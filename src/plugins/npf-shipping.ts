import { LanguageCode, ShippingCalculator, ShippingEligibilityChecker } from '@vendure/core';

/**
 * Carrier: deliveries are fulfilled by Middle East Courier Service (MECS) —
 * the per-zone rates below are MECS's published price list for the store, and
 * the storefront's shipping page lists MECS branch drop-off points
 * (src/lib/shipping/mecs.ts).
 *
 * Source of truth for this table is the storefront's own shipping page copy
 * (apps/storefront/src/lib/i18n/dictionaries.ts, `shipping.zones`) — carried
 * over verbatim, not retyped from memory. If that table changes, mirror the
 * change here too; the two are not automatically kept in sync (separate
 * repos, no shared package).
 *
 * `areasEn` are the English governorate/city names for the same zone, taken
 * from that same dictionary file's `en` locale (which already spells them
 * out) so backend matching stays word-for-word consistent with what
 * English-locale customers see on the shipping page.
 *
 * Prices are one-way rates for shipments ≤ 1 kg, per the client's official
 * 2026 coverage split (delivered in writing, 2026-09-24) — the same split
 * recorded in `MECS_RATE_CARD` (src/lib/shipping/mecs.ts):
 *
 *   zone 1 (Greater Cairo + Alexandria): FREE to the customer by store
 *     policy ("الشحن مجاني بشكل افتراضي ما عدا حالات خاصة تُبلغ كاستثناءات").
 *     MECS still bills the store its 75 EGP Cairo row — absorbed by the
 *     store, never charged to the customer. Special-case exceptions will be
 *     supplied separately by the client and patched in when they arrive.
 *   zones 2–10: the tier prices the customer pays (85/90/95/105/120/170/
 *     400/550/1400 EGP). MECS's +30/+35 address pickup/delivery add-on is
 *     also absorbed by the store (client's analysis: not split out to avoid
 *     the base-vs-door-to-door confusion) — recorded in MECS_RATE_CARD.
 *
 * All prices are halved by `applyPrepaidDiscount` below when
 * `order.customFields.prepaidShipping` is set.
 */
const ZONE_TABLE: Array<{ zone: string; areas: string[]; areasEn: string[]; oneWayEGP: number | null }> = [
    {
        zone: '1',
        areas: [
            'القاهرة الكبرى', 'الإسكندرية', 'الجيزة', 'القليوبية', 'الشيخ زايد', 'العاشر من رمضان',
            'القاهرة الجديدة', 'أكتوبر', 'حلوان', 'السلام', 'الرحاب', 'مسطرد', 'العبور', 'مدينتي',
            'بدر', 'الشروق', 'المقطم', 'البراجيل', 'إمبابة',
            'الوراق', 'طموه', 'العياط', 'الصف', 'البدرشين', 'الحوامدية', 'أطفيح', 'الكريمات',
        ],
        areasEn: [
            'Greater Cairo', 'Cairo', 'Alexandria', 'Giza', 'Qalyubia', 'Sheikh Zayed', '10th of Ramadan',
            'New Cairo', '6th of October', 'October', 'Helwan', 'Al Salam', 'Al Rehab', 'Mostorod',
            'El Obour', 'Madinaty', 'Badr', 'El Shorouk', 'Al Muqattam', 'Al Barajeel', 'Imbaba',
            'El Warraq', 'Tamwa', 'El Ayyat', 'El Saff', 'Badrasheen', 'El Hawamdeya', 'Atfih', 'El Kureimat',
        ],
        // FREE to the customer by store policy (2026-09-24): Cairo + Giza
        // governorate + Alexandria. MECS bills the store its Cairo row for
        // these — absorbed, never charged to the customer.
        oneWayEGP: null,
    },
    {
        zone: '2',
        areas: [
            'المنصورة', 'الزقازيق', 'طنطا', 'المحلة', 'السويس', 'بورسعيد', 'الإسماعيلية', 'العاشر',
            'بلبيس', 'كفر الدوار', 'إيتاي البارود', 'بنها', 'كفر الشيخ', 'دمياط', 'جمصة', 'فارسكور',
            'برج العرب', 'دمنهور', 'شبين الكوم', 'كوم حمادة', 'قليوب', 'الباجور', 'شبين القناطر',
            'الدقهلية', 'أبو رواش', 'أبوزعبل', 'منيا القمح', 'طريق الواحات', 'أشمون', 'النوبارية',
            'السادات', 'الخانكة',
        ],
        areasEn: [
            'Mansoura', 'Zagazig', 'Tanta', 'El Mahalla', 'Suez', 'Port Said', 'Ismailia', '10th of Ramadan',
            'Belbeis', 'Kafr El Dawwar', 'Itay El Baroud', 'Banha', 'Kafr El Sheikh', 'Damietta', 'Gamasa',
            'Faraskur', 'Borg El Arab', 'Damanhur', 'Shibin El Kom', 'Kom Hamada', 'Qalyub', 'El Bagour',
            'Shibin El Qanater', 'Dakahlia', 'Abu Rawash', 'Abu Zaabal', 'Minya El Qamh', 'Al-Wahat Road',
            'Ashmoun', 'Nubariya', 'Sadat City', 'El Khanka',
        ],
        // 2026 tier: 85 = بورسعيد، السويس، الإسماعيلية، وكل مدن الدلتا.
        oneWayEGP: 85,
    },
    {
        zone: '3',
        areas: ['العين السخنة', 'العاصمة الإدارية'],
        areasEn: ['Ain Sokhna', 'New Administrative Capital'],
        // 2026 tier: 90 = العين السخنة + العاصمة الإدارية فقط. مدن محافظة
        // الجيزة انتقلت لـ zone 1 (مجانية بقرار المتجر، 2026-09-24) — الـ90
        // بتاع الميدل ايست عليها محمّل على المتجر.
        oneWayEGP: 90,
    },
    {
        zone: '4',
        areas: ['بني سويف', 'الفيوم'],
        areasEn: ['Beni Suef', 'Fayoum'],
        // 2026 tier: 95 = بني سويف والفيوم.
        oneWayEGP: 95,
    },
    {
        zone: '5',
        areas: ['المنيا', 'أسيوط'],
        areasEn: ['Minya', 'Assiut'],
        // 2026 tier: 105 = المنيا وأسيوط (الشيخ فضل استثناء المنيا → zone 8).
        oneWayEGP: 105,
    },
    {
        zone: '6',
        areas: ['سوهاج', 'قنا', 'الأقصر', 'نجع حمادي', 'أسوان', 'الغردقة'],
        areasEn: ['Sohag', 'Qena', 'Luxor', 'Naga Hammadi', 'Aswan', 'Hurghada'],
        // 2026 tier: 120 = سوهاج، الأقصر، قنا، أسوان، الغردقة.
        oneWayEGP: 120,
    },
    {
        zone: '7',
        areas: [
            'مرسى مطروح', 'سفاجا', 'الجونة', 'شرم الشيخ', 'الساحل الشمالي', 'العلمين', 'راس سدر',
            'شرق التفريعة', 'الطور', 'القنطرة شرق', 'العريش', 'ألكس ويست',
        ],
        areasEn: [
            'Marsa Matrouh', 'Safaga', 'El Gouna', 'Sharm El Sheikh', 'North Coast', 'El Alamein', 'Ras Sedr',
            'East Tafriya', 'El Tor', 'Qantara East', 'Arish', 'Alex West',
        ],
        // 2026 tier: 170 = مطروح، الساحل الشمالي، شرم الشيخ، الجونة، سفاجا،
        // شمال وجنوب سيناء.
        oneWayEGP: 170,
    },
    {
        zone: '8',
        areas: ['الوادي الجديد', 'الخارجة', 'دهب', 'نويبع', 'طابا', 'القصير', 'الشيخ فضل'],
        areasEn: ['New Valley', 'El Kharga', 'Dahab', 'Nuweiba', 'Taba', 'El Qusayr', 'Sheikh Fadl'],
        // 2026 tier: 400 = الشيخ فضل (المنيا)، الوادي الجديد، دهب، نويبع،
        // طابا، القصير. (مرسى علم نُقل لـ zone 9 — 550.)
        oneWayEGP: 400,
    },
    {
        zone: '9',
        areas: ['الداخلة', 'الواحات البحرية', 'أبوسمبل', 'أخميم الجديدة', 'مرسى علم'],
        areasEn: ['Dakhla', 'Bahariya Oasis', 'Abu Simbel', 'New Akhmim', 'Marsa Alam'],
        // 2026 tier: 550 = أخميم الجديدة، الداخلة، الواحات البحرية، أبو سمبل،
        // مرسى علم (نُقل من zone 8 حسب توزيع 2026).
        oneWayEGP: 550,
    },
    {
        zone: '10',
        areas: ['الفرافرة', 'حلايب', 'شلاتين', 'توشكى', 'سيوة', 'سانت كاترين', 'السلوم'],
        areasEn: ['Farafra', 'Halayeb', 'Shalateen', 'Toshka', 'Siwa', 'Saint Catherine', 'Sallum'],
        // 2026 tier: 1400 = خدمة تسليم المناطق النائية.
        oneWayEGP: 1400,
    },
];

/**
 * Fuzzy on purpose: matches the order's city/province text against each
 * zone's known area names (either direction — handles "زايد" vs "الشيخ
 * زايد", or "Cairo" vs "Greater Cairo"). Real addresses are free text, not a
 * picklist, so this is a starting point to refine once real orders show what
 * doesn't match. English names are matched case-insensitively since free-text
 * addresses vary in casing; Arabic has no case so lower-casing it is a no-op.
 */
function findZone(text: string | null | undefined) {
    if (!text) return undefined;
    const normalized = text.trim().toLowerCase();
    if (!normalized) return undefined;
    for (const zone of ZONE_TABLE) {
        for (const area of [...zone.areas, ...zone.areasEn]) {
            const normalizedArea = area.toLowerCase();
            if (normalized.includes(normalizedArea) || normalizedArea.includes(normalized)) {
                return zone;
            }
        }
    }
    return undefined;
}

function zoneFromOrder(order: { shippingAddress?: { city?: string | null; province?: string | null } }) {
    const address = order.shippingAddress;
    if (!address) return undefined;
    return findZone(address.city) ?? findZone(address.province);
}

// Confirmed with Ahmed directly (2026-08-31): the 14% VAT applies to
// products only, not delivery fees — "لا عالمنتجات بس" (no, products only).
// Shipping is zero-rated.
const SHIPPING_TAX_RATE_PERCENT = 0;

// 50% off door-to-door/branch-pickup shipping for prepaid orders (bank
// transfer), documented on the storefront's shipping page. Confirmed with
// Ahmed directly (2026-08-31) after flagging that it wasn't built yet — he
// wants it live since it's a real incentive for customers who pay upfront.
// The storefront sets `order.customFields.prepaidShipping` via
// `setOrderCustomFields` (Shop API) based on the payment method the
// customer has selected, before fetching eligible shipping methods.
const PREPAID_SHIPPING_DISCOUNT = 0.5;

function applyPrepaidDiscount(priceEGP: number, order: { customFields?: { prepaidShipping?: boolean | null } }) {
    if (priceEGP <= 0) return priceEGP;
    return order.customFields?.prepaidShipping ? Math.round(priceEGP * (1 - PREPAID_SHIPPING_DISCOUNT)) : priceEGP;
}

export const npfDoorToDoorEligibilityChecker = new ShippingEligibilityChecker({
    code: 'npf-door-to-door-eligibility',
    description: [{ languageCode: LanguageCode.en, value: 'NPF: eligible when the shipping address matches a known delivery zone' }],
    args: {},
    check: (ctx, order) => Boolean(zoneFromOrder(order)),
});

export const npfDoorToDoorCalculator = new ShippingCalculator({
    code: 'npf-door-to-door-calculator',
    description: [{ languageCode: LanguageCode.en, value: 'NPF: door-to-door rate from the real 10-zone table (fulfilled by Middle East Courier Service)' }],
    args: {},
    calculate: (ctx, order) => {
        const zone = zoneFromOrder(order);
        const baseEGP = zone ? (zone.oneWayEGP ?? 0) : 0;
        const priceEGP = applyPrepaidDiscount(baseEGP, order);
        return {
            price: priceEGP * 100,
            priceIncludesTax: ctx.channel.pricesIncludeTax,
            taxRate: SHIPPING_TAX_RATE_PERCENT,
            metadata: { zone: zone?.zone ?? null, prepaidDiscountApplied: priceEGP !== baseEGP },
        };
    },
});

// Same underlying delivery network and the same per-zone price as
// door-to-door — Ahmed described this as an alternative drop-off point, not
// a separately priced service, so no different rate is invented here.
export const npfBranchDropoffEligibilityChecker = new ShippingEligibilityChecker({
    code: 'npf-branch-dropoff-eligibility',
    description: [{ languageCode: LanguageCode.en, value: 'NPF: eligible when the shipping address matches a known delivery zone' }],
    args: {},
    check: (ctx, order) => Boolean(zoneFromOrder(order)),
});

export const npfBranchDropoffCalculator = new ShippingCalculator({
    code: 'npf-branch-dropoff-calculator',
    description: [{ languageCode: LanguageCode.en, value: 'NPF: drop-off at a Middle East Courier Service branch, same rate as door-to-door' }],
    args: {},
    calculate: (ctx, order) => {
        const zone = zoneFromOrder(order);
        const baseEGP = zone ? (zone.oneWayEGP ?? 0) : 0;
        const priceEGP = applyPrepaidDiscount(baseEGP, order);
        return {
            price: priceEGP * 100,
            priceIncludesTax: ctx.channel.pricesIncludeTax,
            taxRate: SHIPPING_TAX_RATE_PERCENT,
            metadata: { zone: zone?.zone ?? null, prepaidDiscountApplied: priceEGP !== baseEGP },
        };
    },
});

// Always eligible, regardless of address — this is the guaranteed fallback
// if an address doesn't match any known zone, so checkout is never blocked
// entirely by an unmatched area.
export const npfCompanyPickupEligibilityChecker = new ShippingEligibilityChecker({
    code: 'npf-company-pickup-eligibility',
    description: [{ languageCode: LanguageCode.en, value: 'NPF: always eligible — customer collects from the company premises' }],
    args: {},
    check: () => true,
});

export const npfCompanyPickupCalculator = new ShippingCalculator({
    code: 'npf-company-pickup-calculator',
    description: [{ languageCode: LanguageCode.en, value: 'NPF: free — customer collects from the company premises' }],
    args: {},
    calculate: (ctx) => ({
        price: 0,
        priceIncludesTax: ctx.channel.pricesIncludeTax,
        taxRate: 0,
    }),
});
