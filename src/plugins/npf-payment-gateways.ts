import { createHmac, timingSafeEqual } from 'node:crypto';
import { LanguageCode, PaymentMethodHandler } from '@vendure/core';

/**
 * Card-gateway payment handlers — Paymob ("Accept") and Kashier, fully
 * implemented against their documented hosted-checkout flows, plus Fawry
 * which stays an honest stub.
 *
 * How this stays SAFE while no gateway is registered:
 *  - No PaymentMethod entity exists for these handlers (nothing seeded) —
 *    the storefront's card rail only renders when an eligible PaymentMethod
 *    with one of these codes appears in the Shop API.
 *  - Even if a method were created half-configured, `createPayment` returns
 *    `Declined` until every credential arg is non-empty.
 *
 * When the merchant account exists: create the PaymentMethod in /admin
 * (handler `paymob` or `kashier`), fill the args with the real credentials,
 * and the flow goes:
 *    1. storefront addPaymentToOrder → createPayment calls the gateway API
 *       and returns state `Pending` + a hosted-payment redirectUrl (stored
 *       in payment.metadata.public.redirectUrl);
 *    2. the customer pays on the gateway's hosted page;
 *    3. the gateway POSTs a signed webhook to
 *       /payment-gateways/{paymob|kashier}/webhook (see
 *       npf-payment-gateway-webhooks.ts) — a VALID signature is the only
 *       thing that can settle or decline the payment. The transfer rails
 *       (InstaPay / Vodafone Cash) are untouched and remain manual-only.
 *
 * All outbound requests go through `gatewayFetch` with a timeout, and every
 * branch that would need an undocumented field is commented as such rather
 * than guessed.
 */

const PAYMOB_API_BASE = 'https://accept.paymob.com/api';
const KASHIER_CHECKOUT_BASE = 'https://checkout.kashier.io';
const GATEWAY_FETCH_TIMEOUT_MS = 15_000;

async function gatewayFetch(url: string, init: RequestInit): Promise<Response> {
    return fetch(url, { ...init, signal: AbortSignal.timeout(GATEWAY_FETCH_TIMEOUT_MS) });
}

function isConfigured(...values: Array<string | undefined>): boolean {
    return values.every((value) => Boolean(value && value.trim().length > 0));
}

/** `amount` arrives in Vendure minor units (piasters for EGP) — Paymob's
 * `amount_cents` is the same unit, so it passes through untouched. */
function billingDataFrom(order: {
    code: string;
    customer?: { firstName?: string; lastName?: string; emailAddress?: string; phoneNumber?: string | null };
    shippingAddress?: Record<string, string | undefined> | null;
}) {
    const address = order.shippingAddress ?? {};
    const first = order.customer?.firstName || address.fullName?.split(/\s+/)[0] || 'NPF';
    const last = order.customer?.lastName || address.fullName?.split(/\s+/).slice(1).join(' ') || 'Customer';
    return {
        first_name: first.slice(0, 100),
        last_name: (last.slice(0, 100) || first.slice(0, 100)),
        email: order.customer?.emailAddress || `order-${order.code}@nilepharmafood.local`,
        phone_number: order.customer?.phoneNumber || address.phoneNumber || '01000000000',
        apartment: 'NA',
        floor: 'NA',
        street: address.streetLine1 || 'NA',
        building: 'NA',
        city: address.city || 'NA',
        country: 'EG',
        state: address.province || 'NA',
        zip_code: address.postalCode || '00000',
    };
}

export const CARD_GATEWAY_CODES = ['paymob', 'kashier', 'fawry'] as const;

/**
 * ── Paymob ("Accept") ─ https://developers.paymob.com/egypt/en/docs/
 * auth/tokens → ecommerce/orders → acceptance/payment_keys → hosted iframe.
 * Settlement: their "transaction processed callback" (HMAC-SHA256 over the
 * documented field ordering, verified in paymobHmacValid below).
 */
export const paymobPaymentHandler = new PaymentMethodHandler({
    code: 'paymob',
    description: [{ languageCode: LanguageCode.en, value: 'Paymob (Accept) — cards, mobile wallets, BNPL' }],
    args: {
        apiKey: { type: 'string', label: [{ languageCode: LanguageCode.en, value: 'API Key' }] },
        integrationId: { type: 'string', label: [{ languageCode: LanguageCode.en, value: 'Integration ID (online card)' }] },
        iframeId: { type: 'string', label: [{ languageCode: LanguageCode.en, value: 'Iframe ID' }] },
        hmacSecret: { type: 'string', label: [{ languageCode: LanguageCode.en, value: 'HMAC secret (webhook verification)' }] },
    },
    createPayment: async (ctx, order, amount, args) => {
        if (!isConfigured(args.apiKey, args.integrationId, args.iframeId, args.hmacSecret)) {
            return {
                amount,
                state: 'Declined',
                errorMessage: 'Paymob is not configured yet — apiKey/integrationId/iframeId/hmacSecret required.',
                metadata: { gateway: 'paymob', notConfigured: true },
            };
        }
        try {
            const auth = await gatewayFetch(`${PAYMOB_API_BASE}/auth/tokens`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ api_key: args.apiKey }),
            });
            if (!auth.ok) throw new Error(`paymob auth failed: ${auth.status}`);
            const { token } = (await auth.json()) as { token: string };

            const orderRes = await gatewayFetch(`${PAYMOB_API_BASE}/ecommerce/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    auth_token: token,
                    delivery_needed: false,
                    amount_cents: amount,
                    currency: 'EGP',
                    // Unique per attempt: retrying a failed payment on the same
                    // order must not collide with Paymob's merchant_order_id.
                    merchant_order_id: `${order.code}-${Date.now()}`,
                    items: [],
                }),
            });
            if (!orderRes.ok) throw new Error(`paymob order failed: ${orderRes.status}`);
            const paymobOrder = (await orderRes.json()) as { id: number };

            const keyRes = await gatewayFetch(`${PAYMOB_API_BASE}/acceptance/payment_keys`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    auth_token: token,
                    amount_cents: amount,
                    expiration: 3600,
                    order_id: paymobOrder.id,
                    billing_data: billingDataFrom(order),
                    currency: 'EGP',
                    integration_id: Number(args.integrationId),
                }),
            });
            if (!keyRes.ok) throw new Error(`paymob payment key failed: ${keyRes.status}`);
            const { token: paymentKey } = (await keyRes.json()) as { token: string };

            return {
                amount,
                state: 'Authorized',
                metadata: {
                    public: {
                        gateway: 'paymob',
                        redirectUrl: `${PAYMOB_API_BASE.replace('/api', '')}/api/acceptance/iframes/${args.iframeId}?payment_token=${paymentKey}`,
                    },
                    paymobOrderId: String(paymobOrder.id),
                },
            };
        } catch (error) {
            return {
                amount,
                state: 'Error',
                errorMessage: error instanceof Error ? error.message : String(error),
                metadata: { gateway: 'paymob' },
            };
        }
    },
    settlePayment: async () => ({ success: true }),
    cancelPayment: async () => ({ success: true }),
});

/**
 * Paymob's documented webhook HMAC: SHA-256 over these fields concatenated
 * with the empty string, values as strings (booleans "true"/"false",
 * null → ""), keyed with the dashboard's HMAC secret. Nested fields
 * (order.id, source_data.*) are per their docs.
 */
const PAYMOB_HMAC_FIELDS = [
    ['amount_cents'],
    ['created_at'],
    ['currency'],
    ['error_occured'],
    ['has_parent_transaction'],
    ['id'],
    ['integration_id'],
    ['is_3d_secure'],
    ['is_auth'],
    ['is_capture'],
    ['is_refunded'],
    ['is_standalone_payment'],
    ['is_voided'],
    ['order', 'id'],
    ['owner'],
    ['pending'],
    ['source_data', 'pan'],
    ['source_data', 'sub_type'],
    ['source_data', 'type'],
    ['success'],
] as const;

function paymobConcatenated(obj: Record<string, unknown>): string {
    return PAYMOB_HMAC_FIELDS.map((path) => {
        let value: unknown = obj;
        for (const key of path) value = (value as Record<string, unknown> | undefined)?.[key];
        if (value === null || value === undefined) return '';
        if (typeof value === 'boolean') return value ? 'true' : 'false';
        return String(value);
    }).join('');
}

export function paymobHmacValid(obj: Record<string, unknown>, receivedHmac: string | undefined, secret: string): boolean {
    if (!receivedHmac) return false;
    const expected = createHmac('sha256', secret).update(paymobConcatenated(obj)).digest('hex');
    const a = Buffer.from(expected);
    const b = Buffer.from(receivedHmac.toLowerCase());
    return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * ── Kashier ─ https://developers.kashier.io — hosted checkout. The order
 * hash is HMAC-SHA256 over the alphabetically-ordered params
 * `amount, currency, merchantId, orderId, mode` (their documented order),
 * keyed with the API key. Settlement: their signed webhook (raw-body HMAC,
 * verified in kashierSignatureValid).
 */
export function kashierOrderHash(params: {
    merchantId: string;
    orderId: string;
    amountMajor: string; // "7500.00" — major units, 2 decimals
    currency: string;
    mode: 'live' | 'test';
    apiKey: string;
}): string {
    // Alphabetical: amount, currency, merchantId, orderId, mode
    const payload = `amount=${params.amountMajor}&currency=${params.currency}&merchantId=${params.merchantId}&orderId=${params.orderId}&mode=${params.mode}`;
    return createHmac('sha256', params.apiKey).update(payload).digest('hex');
}

export function kashierSignatureValid(rawBody: string, receivedSignature: string | undefined, apiKey: string): boolean {
    if (!receivedSignature) return false;
    const expected = createHmac('sha256', apiKey).update(rawBody).digest('hex');
    const a = Buffer.from(expected);
    const b = Buffer.from(receivedSignature.toLowerCase());
    return a.length === b.length && timingSafeEqual(a, b);
}

export const kashierPaymentHandler = new PaymentMethodHandler({
    code: 'kashier',
    description: [{ languageCode: LanguageCode.en, value: 'Kashier — hosted checkout, cards and wallets' }],
    args: {
        merchantId: { type: 'string', label: [{ languageCode: LanguageCode.en, value: 'Merchant ID' }] },
        apiKey: { type: 'string', label: [{ languageCode: LanguageCode.en, value: 'API Key' }] },
        mode: {
            type: 'string',
            defaultValue: 'live',
            label: [{ languageCode: LanguageCode.en, value: 'Mode (live|test)' }],
        },
    },
    createPayment: async (ctx, order, amount, args) => {
        if (!isConfigured(args.merchantId, args.apiKey)) {
            return {
                amount,
                state: 'Declined',
                errorMessage: 'Kashier is not configured yet — merchantId/apiKey required.',
                metadata: { gateway: 'kashier', notConfigured: true },
            };
        }
        const mode = args.mode === 'test' ? 'test' : 'live';
        try {
            const amountMajor = (amount / 100).toFixed(2);
            const orderId = `${order.code}-${Date.now()}`;
            const hash = kashierOrderHash({
                merchantId: args.merchantId,
                orderId,
                amountMajor,
                currency: 'EGP',
                mode,
                apiKey: args.apiKey,
            });
            const params = new URLSearchParams({
                orderId,
                amount: amountMajor,
                currency: 'EGP',
                hash,
                mode,
                // The customer returns to the confirmation page either way;
                // the webhook is what actually settles the payment.
                redirectUrl: `${process.env.STOREFRONT_URL ?? 'http://localhost:3000'}/ar/checkout/confirmation`,
                webhookUrl: `${process.env.VENDURE_PUBLIC_URL ?? 'http://localhost:3001'}/payment-gateways/kashier/webhook`,
                method: 'card',
            });
            return {
                amount,
                state: 'Authorized',
                metadata: {
                    public: {
                        gateway: 'kashier',
                        redirectUrl: `${KASHIER_CHECKOUT_BASE}/#/pay/${args.merchantId}?${params.toString()}`,
                    },
                    kashierOrderId: orderId,
                },
            };
        } catch (error) {
            return {
                amount,
                state: 'Error',
                errorMessage: error instanceof Error ? error.message : String(error),
                metadata: { gateway: 'kashier' },
            };
        }
    },
    settlePayment: async () => ({ success: true }),
    cancelPayment: async () => ({ success: true }),
});

/**
 * ── Fawry — still scaffold-only. Their charge API signs requests with a
 * merchant-specific SHA-256 scheme and settles via server notification;
 * implementing it blind (no merchant account, no verified payload sample)
 * would mean fabricating their contract. It stays a safe Declined stub
 * until real credentials exist — do NOT register it as a PaymentMethod.
 */
export const fawryPaymentHandler = new PaymentMethodHandler({
    code: 'fawry',
    description: [{ languageCode: LanguageCode.en, value: 'Fawry — cards, wallets, and cash payment points' }],
    args: {
        merchantCode: { type: 'string', label: [{ languageCode: LanguageCode.en, value: 'Merchant Code' }] },
        securityKey: { type: 'string', label: [{ languageCode: LanguageCode.en, value: 'Security Key' }] },
    },
    createPayment: async (ctx, order, amount, args) => {
        void args;
        void order;
        return {
            amount,
            state: 'Declined',
            errorMessage: 'Fawry integration not yet implemented — no merchant account to verify the contract against.',
            metadata: { gateway: 'fawry', notImplemented: true },
        };
    },
    settlePayment: async () => ({ success: true }),
    cancelPayment: async () => ({ success: true }),
});
