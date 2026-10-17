import {
    dummyPaymentHandler,
    DefaultJobQueuePlugin,
    DefaultSearchPlugin,
    VendureConfig,
} from '@vendure/core';
import { defaultEmailHandlers, EmailPlugin, FileBasedTemplateLoader, type EmailPluginOptions, type EmailPluginDevModeOptions } from '@vendure/email-plugin';
import { AssetServerPlugin } from '@vendure/asset-server-plugin';
import { DashboardPlugin } from '@vendure/dashboard/plugin';
import { GraphiqlPlugin } from '@vendure/graphiql-plugin';
import 'dotenv/config';
import path from 'path';
import { getEmailTransportConfig } from './lib/email/transport-config';

import {
    npfBranchDropoffCalculator,
    npfBranchDropoffEligibilityChecker,
    npfCompanyPickupCalculator,
    npfCompanyPickupEligibilityChecker,
    npfDoorToDoorCalculator,
    npfDoorToDoorEligibilityChecker,
} from './plugins/npf-shipping';
import { fawryPaymentHandler, kashierPaymentHandler, paymobPaymentHandler } from './plugins/npf-payment-gateways';
import { NpfPaymentGatewaysPlugin } from './plugins/npf-payment-gateway-webhooks';
import { parseEnvOrThrow, vendureEnvSchema, vendureEnvWarnings, warnEnvIssues } from './lib/env';

// F-11 — validated once, at boot, with every problem reported together instead
// of surfacing as NaN ports and silently-ignored super-admin credentials later
// (see src/lib/env.ts for the three failure modes this replaces). Optional but
// consequential gaps warn rather than throw so offline/mock development stays
// a supported mode.
const env = parseEnvOrThrow(vendureEnvSchema, 'vendure');
warnEnvIssues('vendure', vendureEnvWarnings(env));

const IS_DEV = env.APP_ENV === 'dev';

// Email verification stays OFF by default: registration currently logs the
// customer straight in (see the auth flow's `register` action), and flipping
// this without a working mailer would lock every new customer out of the
// account they just created. It is now an explicit switch rather than a
// hard-coded constant, so enabling it is a deployment decision — and the
// `/verify` route plus real SMTP transport that make it safe now exist.
const requireEmailVerification = /^(1|true|yes)$/i.test(
    process.env.NPF_REQUIRE_EMAIL_VERIFICATION ?? '',
);
// PORT wins because hosting platforms inject it into the environment at runtime, and that
// must take precedence over any value baked into the .env file at scaffold time.
const serverPort = process.env.PORT ? env.PORT : env.VENDURE_SERVER_PORT;

const smtp = getEmailTransportConfig()
const emailCommon = {
    handlers: defaultEmailHandlers,
    templateLoader: new FileBasedTemplateLoader(path.join(__dirname, '../static/email/templates')),
}
const emailOptions: EmailPluginOptions | EmailPluginDevModeOptions | null = smtp ? {
    ...emailCommon,
    transport: {type:'smtp',host:smtp.host,port:smtp.port,secure:smtp.secure,requireTLS:smtp.requireTLS,auth:smtp.auth,tls:smtp.tls},
    globalTemplateVars: {
        fromAddress: smtp.fromAddress,
        passwordResetUrl: `${smtp.storefront}/ar/reset-password`,
        verifyEmailAddressUrl: `${smtp.storefront}/ar/verify`,
        changeEmailAddressUrl: `${smtp.storefront}/ar/verify-email-change`,
    },
} : IS_DEV && process.env.EMAIL_DEV_MAILBOX === 'true' ? {
    ...emailCommon,devMode:true,outputPath:path.join(__dirname,'../.cache/vendure-emails'),route:'mailbox',
    globalTemplateVars:{fromAddress:'"NPF local preview" <noreply@example.test>',passwordResetUrl:'http://localhost:3000/ar/reset-password'},
} : null

export const config: VendureConfig = {
    apiOptions: {
        port: serverPort,
        adminApiPath: 'admin-api',
        shopApiPath: 'shop-api',
        // The following options are useful in development mode,
        // but are best turned off for production for security
        // reasons.
        ...(IS_DEV ? {
            adminApiDebug: true,
            shopApiDebug: true,
        } : {}),
        // F-57 — Express sets X-Powered-By by default, advertising the stack
        // (and helping fingerprinting) on both APIs. Vendure exposes no
        // "disable" flag, but its middleware hook runs before any route, so
        // the header is stripped on every response, shop and admin alike.
        middleware: [
            {
                route: '*',
                handler: (_req: unknown, res: { removeHeader: (name: string) => void }, next: () => void) => {
                    res.removeHeader('X-Powered-By');
                    next();
                },
            },
            {
                // Gateway webhooks (src/plugins/npf-payment-gateway-webhooks.ts):
                // Kashier's signature is HMAC over the EXACT raw request body —
                // capture the stream bytes before anything else consumes them.
                // beforeListen registers this BEFORE Nest's body parsers; the
                // regular middleware hook runs after them and the exact bytes
                // Kashier signed would already be gone.
                route: '/payment-gateways/kashier/webhook',
                beforeListen: true,
                handler: (
                    req: { method?: string; on: (event: string, cb: (chunk?: Buffer) => void) => unknown; rawBody?: string },
                    _res: unknown,
                    next: () => void,
                ) => {
                    if (req.method === 'POST') {
                        const chunks: Buffer[] = [];
                        req.on('data', (chunk) => chunks.push(chunk as Buffer));
                        req.on('end', () => {
                            req.rawBody = Buffer.concat(chunks).toString('utf8');
                        });
                    }
                    next();
                },
            },
        ],
    },
    authOptions: {
        tokenMethod: ['bearer', 'cookie'],
        superadminCredentials: {
            identifier: env.SUPERADMIN_USERNAME,
            password: env.SUPERADMIN_PASSWORD,
        },
        cookieOptions: {
          secret: env.COOKIE_SECRET,
        },
        // Vendure's default (true) requires clicking an emailed verification
        // link before a new customer account can log in. That was unsafe here
        // while EmailPlugin sat on its scaffold defaults (devMode: true, no
        // SMTP, links pointing at a dead localhost:8080 origin): a required
        // verification email would never reach anyone, permanently locking
        // every new customer out of their own just-created account.
        // F-52 fixed the transport and the links and added the `/verify`
        // route, so the behaviour is now a deployment switch instead of a
        // hard-coded `false` — still off by default so the existing
        // register-then-auto-login flow is unchanged.
        requireVerification: requireEmailVerification,
    },
    dbConnectionOptions: {
        type: 'postgres',
        // See the README.md "Migrations" section for an explanation of
        // the `synchronize` and `migrations` options.
        synchronize: false,
        migrations: [path.join(__dirname, './migrations/*.+(js|ts)')],
        logging: false,
        database: env.DB_NAME,
        schema: env.DB_SCHEMA,
        host: env.DB_HOST,
        port: env.DB_PORT,
        username: env.DB_USERNAME,
        password: env.DB_PASSWORD,
        // F-71 — explicit pool sizing. TypeORM forwards `extra` to the node-pg
        // pool, whose default is `max: 10` *per process*: with the storefront
        // and a Vendure worker sharing one database host that silently becomes
        // 20+ connections, and Postgres' own default ceiling is 100. The number
        // is now written down, bounded (1..200, validated in src/lib/env.ts)
        // and shared with Payload's adapter so both sides of the same physical
        // database agree.
        extra: {
            max: env.DATABASE_POOL_MAX,
        },
    },
    paymentOptions: {
        // paymob/fawry/kashier are scaffolding only (no gateway chosen yet,
        // no real credentials) — see plugins/npf-payment-gateways.ts. Listing
        // a handler here just makes Vendure aware of it; no PaymentMethod
        // entity has been created for any of them, so none show up as a
        // real checkout option yet.
        paymentMethodHandlers: [dummyPaymentHandler, paymobPaymentHandler, fawryPaymentHandler, kashierPaymentHandler],
    },
    shippingOptions: {
        shippingEligibilityCheckers: [
            npfDoorToDoorEligibilityChecker,
            npfBranchDropoffEligibilityChecker,
            npfCompanyPickupEligibilityChecker,
        ],
        shippingCalculators: [npfDoorToDoorCalculator, npfBranchDropoffCalculator, npfCompanyPickupCalculator],
    },
    // When adding or altering custom field definitions, the database will
    // need to be updated. See the "Migrations" section in README.md.
    customFields: {
        Order: [
            {
                name: 'prepaidShipping',
                type: 'boolean',
                defaultValue: false,
                public: true,
                // Set by the storefront (via setOrderCustomFields) before
                // fetching eligible shipping methods, based on the
                // customer's chosen payment method. Read by the npf
                // shipping calculators to apply the 50% prepaid discount —
                // see plugins/npf-shipping.ts.
            },
            {
                name: 'customerNotes',
                type: 'text',
                defaultValue: '',
                public: true,
                // Checkout notes are written through the existing Shop API
                // setOrderCustomFields contract and remain attached to the
                // order for fulfillment/admin workflows.
            },
        ],
    },
    plugins: [
        // F-09 — the interactive GraphQL IDE is a development affordance, not a
        // production surface: it advertises the whole schema and lets anyone
        // run queries unauthenticated against the shop API. It now follows the
        // same IS_DEV gate as adminApiDebug/shopApiDebug above, and the routes
        // it serves are documented (docs/GRAPHQL.md) rather than discovered by
        // probing. Payload's own playground route
        // (src/app/(payload)/api/graphql-playground) is a separate surface.
        ...(IS_DEV ? [GraphiqlPlugin.init()] : []),
        AssetServerPlugin.init({
            route: 'assets',
            assetUploadDir: path.join(__dirname, '../static/assets'),
            // For local dev, the correct value for assetUrlPrefix should
            // be guessed correctly, but for production it will usually need
            // to be set manually to match your production url.
            assetUrlPrefix: process.env.VENDURE_ASSET_URL_PREFIX || undefined,
        }),
        DefaultJobQueuePlugin.init({ useDatabaseForBuffer: true }),
        DefaultSearchPlugin.init({ bufferUpdates: false, indexStockStatus: true }),
        ...(emailOptions ? [EmailPlugin.init(emailOptions)] : []),
        DashboardPlugin.init({
            route: 'dashboard',
            appDir: IS_DEV
                ? path.join(__dirname, '../dist/dashboard')
                : path.join(__dirname, 'dashboard'),
        }),
        // Signed card-gateway webhooks (Paymob / Kashier). Inert until a
        // configured PaymentMethod exists — the endpoints answer 503 and no
        // seeded PaymentMethod uses these handlers (see
        // npf-payment-gateways.ts).
        NpfPaymentGatewaysPlugin,
    ],
};
