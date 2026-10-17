import { Body, Controller, Headers, Inject, Post, Query, Req, Res } from '@nestjs/common';
import { PluginCommonModule, RequestContextService, TransactionalConnection, PaymentService, PaymentMethod, VendurePlugin, Logger } from '@vendure/core';
import type { Request, Response } from 'express';
import { kashierSignatureValid, paymobHmacValid } from './npf-payment-gateways';

/**
 * Signed webhook endpoints for the card gateways. These are the ONLY paths
 * that can transition a gateway payment to Settled/Declined without a human
 * in /admin — and every one of them refuses to act unless the gateway's
 * signature verifies against the credentials stored on the PaymentMethod.
 *
 * The manual transfer rails (InstaPay / Vodafone Cash) do NOT route through
 * here — they remain strictly manual by design (see the WhatsApp-receipt
 * flow: activation triggers zero shop-api mutations; settlement is a human
 * step in /admin).
 */

type GatewayArgs = Record<string, string>;

/** Read the credential args off the PaymentMethod that uses `handlerCode`. */
async function argsForHandler(connection: TransactionalConnection, handlerCode: string): Promise<GatewayArgs | null> {
    const methods = await connection
        .getRepository(PaymentMethod)
        .createQueryBuilder('pm')
        // `handler` is stored as text — cast to jsonb for the operator.
        .where("pm.handler::jsonb ->> 'code' = :code", { code: handlerCode })
        .getMany();
    for (const method of methods) {
        const configArgs = method.handler.args ?? [];
        const args: GatewayArgs = {};
        for (const arg of configArgs) args[arg.name] = String(arg.value ?? '');
        if (Object.values(args).some((v) => v.trim().length > 0)) return args;
    }
    return null;
}

async function findPaymentByMetadata(connection: TransactionalConnection, key: string, value: string) {
    return connection
        .getRepository(PaymentMethod)
        .manager // eslint-disable-line @typescript-eslint/no-explicit-any
        .query(`SELECT id FROM payment WHERE metadata ->> $1 = $2 LIMIT 1`, [key, value])
        .then((rows: Array<{ id: string }>) => rows[0] ?? null);
}

@Controller('payment-gateways')
export class NpfPaymentGatewaysController {
    constructor(
        // Explicit @Inject tokens — esbuild bundles do not emit
        // design:paramtypes metadata, so Nest cannot reflect constructor types.
        @Inject(TransactionalConnection) private connection: TransactionalConnection,
        @Inject(PaymentService) private paymentService: PaymentService,
        @Inject(RequestContextService) private requestContext: RequestContextService,
    ) {}

    /**
     * Paymob "transaction processed callback". The HMAC arrives as a query
     * param (per their docs); the body is { type: "TRANSACTION", obj: {...} }.
     * success=true && pending=false → Settled; success=false → Declined;
     * pending=true → acknowledged but left alone (e.g. cash-on-delivery
     * style pending states are not a payment yet).
     */
    @Post('paymob/webhook')
    async paymobWebhook(
        @Req() req: Request,
        @Res() res: Response,
        @Query('hmac') hmac: string | undefined,
        @Body() body: { obj?: Record<string, unknown> },
    ): Promise<void> {
        const obj = body?.obj;
        if (!obj) {
            res.status(400).send('missing obj');
            return;
        }
        const args = await argsForHandler(this.connection, 'paymob');
        if (!args?.hmacSecret) {
            Logger.warn('paymob webhook received but no configured Paymob PaymentMethod exists — ignoring', 'NpfPaymentGateways');
            res.status(503).send('paymob not configured');
            return;
        }
        if (!paymobHmacValid(obj, hmac ?? (req.body as { hmac?: string } | undefined)?.hmac, args.hmacSecret)) {
            Logger.warn('paymob webhook HMAC mismatch — refusing to act', 'NpfPaymentGateways');
            res.status(403).send('invalid hmac');
            return;
        }
        const paymobOrderId = String((obj.order as { id?: unknown } | undefined)?.id ?? '');
        if (!paymobOrderId) {
            res.status(400).send('missing order id');
            return;
        }
        const payment = await findPaymentByMetadata(this.connection, 'paymobOrderId', paymobOrderId);
        if (!payment) {
            Logger.warn(`paymob webhook: no payment with paymobOrderId=${paymobOrderId}`, 'NpfPaymentGateways');
            res.status(200).send('unknown payment — ignored');
            return;
        }
        const ctx = await this.requestContext.create({ apiType: 'admin' });
        const success = obj.success === true;
        const pending = obj.pending === true;
        try {
            if (success && !pending) {
                await this.paymentService.transitionToState(ctx, payment.id, 'Settled');
                Logger.info(`paymob webhook: payment ${payment.id} settled`, 'NpfPaymentGateways');
            } else if (!success && !pending) {
                await this.paymentService.transitionToState(ctx, payment.id, 'Declined');
                Logger.info(`paymob webhook: payment ${payment.id} declined by gateway`, 'NpfPaymentGateways');
            } else {
                Logger.info(`paymob webhook: payment ${payment.id} still pending — no action`, 'NpfPaymentGateways');
            }
        } catch (error) {
            // A wrong-state transition throws; log and answer 200 so the
            // gateway does not retry-storm an already-final payment.
            Logger.warn(`paymob webhook transition failed: ${error instanceof Error ? error.message : String(error)}`, 'NpfPaymentGateways');
        }
        res.status(200).send('ok');
    }

    /**
     * Kashier server notification. Signature = HMAC-SHA256 of the EXACT raw
     * request body under the header `x-kashier-signature`, keyed with the
     * API key — the raw bytes are captured by the json body-parser's
     * `verify` hook registered for this route (see vendure-config.ts).
     */
    @Post('kashier/webhook')
    async kashierWebhook(
        @Req() req: Request,
        @Res() res: Response,
        @Headers('x-kashier-signature') signature: string | undefined,
    ): Promise<void> {
        const rawBody = (req as Request & { rawBody?: string }).rawBody;
        if (!rawBody) {
            res.status(400).send('raw body not captured');
            return;
        }
        const args = await argsForHandler(this.connection, 'kashier');
        if (!args?.apiKey) {
            Logger.warn('kashier webhook received but no configured Kashier PaymentMethod exists — ignoring', 'NpfPaymentGateways');
            res.status(503).send('kashier not configured');
            return;
        }
        if (!kashierSignatureValid(rawBody, signature, args.apiKey)) {
            Logger.warn('kashier webhook signature mismatch — refusing to act', 'NpfPaymentGateways');
            res.status(403).send('invalid signature');
            return;
        }
        let parsed: { event?: string; data?: { orderId?: string; merchantOrderId?: string; order?: { id?: string } } } | undefined;
        try {
            parsed = JSON.parse(rawBody);
        } catch {
            res.status(400).send('invalid json');
            return;
        }
        const orderId = parsed?.data?.orderId ?? parsed?.data?.merchantOrderId ?? parsed?.data?.order?.id;
        if (!orderId) {
            res.status(400).send('missing order id');
            return;
        }
        const payment = await findPaymentByMetadata(this.connection, 'kashierOrderId', orderId);
        if (!payment) {
            Logger.warn(`kashier webhook: no payment with kashierOrderId=${orderId}`, 'NpfPaymentGateways');
            res.status(200).send('unknown payment — ignored');
            return;
        }
        const ctx = await this.requestContext.create({ apiType: 'admin' });
        const event = parsed?.event ?? '';
        try {
            if (event === 'transaction.authorized' || event === 'transaction.captured') {
                await this.paymentService.transitionToState(ctx, payment.id, 'Settled');
                Logger.info(`kashier webhook: payment ${payment.id} settled (${event})`, 'NpfPaymentGateways');
            } else if (event === 'transaction.failed' || event === 'transaction.declined') {
                await this.paymentService.transitionToState(ctx, payment.id, 'Declined');
                Logger.info(`kashier webhook: payment ${payment.id} declined (${event})`, 'NpfPaymentGateways');
            } else {
                Logger.info(`kashier webhook: event "${event}" ignored for payment ${payment.id}`, 'NpfPaymentGateways');
            }
        } catch (error) {
            Logger.warn(`kashier webhook transition failed: ${error instanceof Error ? error.message : String(error)}`, 'NpfPaymentGateways');
        }
        res.status(200).send('ok');
    }
}

/**
 * Registered unconditionally in vendure-config.ts — the endpoints answer
 * 503 while no configured gateway PaymentMethod exists, so they are inert
 * until the merchant account arrives. Signature verification happens BEFORE
 * any state change.
 */
@VendurePlugin({
    imports: [PluginCommonModule],
    controllers: [NpfPaymentGatewaysController],
})
export class NpfPaymentGatewaysPlugin {}
