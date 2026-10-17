# Nile Pharma Food — search growth master plan

**Date:** 2026-09-23  
**Status:** strategy only. Not implemented.  
**Domain:** `https://nilepharmafood.com` remains the only canonical origin.  
**Production:** accepted external blocker. The host still serves the Bluehost suspension page. This document does not re-investigate hosting and does not repeat the runtime gate.

No rankings, traffic, conversions, or AI-citation outcomes are promised. Search volume, CPC, backlink counts, and current rank positions were not available. Where a number is missing, it is marked **Not measured**.

Evidence labels used below:

- **OBSERVED** — seen in this repository, or in a page/snippet retrieved on 2026-09-23.
- **INFERRED** — a planning conclusion from that evidence. Not a measured cause.
- **UNKNOWN** — not in the catalog and not in the sources checked.

---

## 1. Executive summary

Nile Pharma Food is a small bilingual catalog, not a general pharmacy. The repository holds eight real products: six Alfasigma-line supplements and two CA-MI home devices. Three more categories exist only as coming-soon tiles (dental, cosmetics, drugs) and must not become search targets.

The search problem is not a missing keyword list. It is a stack of constraints:

1. The official domain is not the document search engines can fetch. **OBSERVED** in the closed runtime gate. No on-site strategy works until that external blocker is gone.
2. Short brand queries collide with a different company, El-Nile Co. for Pharmaceuticals (`nilepharma.com.eg`). **OBSERVED** in prior workspace research on 2026-09-23 and not contradicted by this pass. This pass’s Arabic company-name search did not return an official Nile Pharma Food page.
3. English product-name queries are occupied by the manufacturer’s own sites and by US/EU sellers. Egypt commercial queries are occupied by price directories, importers, and local lookalike sachets, especially Eva Pharma’s Carnivita Advance. **OBSERVED** this pass. No winner is declared.
4. Every supplement is intentionally not indexable until leaflet and claim clearance exists as data. A download URL is not clearance. **OBSERVED** in `src/lib/seo/indexability.ts`.
5. The catalog itself contains marketing sentences that over-claim (“clinically proven”, conception outcomes) next to more careful evidence notes. Those sentences must not be promoted into titles, FAQs, or new articles.

The defensible position, once the site is served, is narrow: be the Egypt source of record for these exact packs, in Arabic and English, with stored names, pack, dated price, composition that matches a leaflet, and no invented medical outcomes. Educational pages come only after medical review. Hubs come only when more than one indexable, evidence-cleared asset exists for that intent.

---

## 2. Current SEO state

### What the repository already encodes

**OBSERVED** in code, not on the public host:

| Control | Current rule |
| --- | --- |
| Origin | `https://nilepharmafood.com` only. No www in canonicals. |
| Locales | Arabic default, English alternate. hreflang on pages that set it. |
| Index eligibility | Derived. Not `status === "active"`. Supplements always blocked (`supplement_claim_clearance_absent`). Devices need active status, both names, specs, and no “not yet confirmed” markers. |
| Arabic identity | Title, H1, and Product `name` use stored `nameArabic`. English uses Latin `name`. No invented translation. |
| Schema | Product + Offer only with a finite price and real availability. No brand, manufacturer, rating, review, or GTIN. `launching_soon` has no Offer. Seller, if present, is the site trade name. |
| Sitemap | Indexable URLs only. No `lastModified`. No blogs, careers, cart, checkout, admin, API, lab, or filtered query URLs. |
| Robots | Disallow `/admin`, `/api`, `/*/lab/`. This is not authentication. |
| Redirects | Five explicit 301s to Arabic PDPs. Unknown `/product/*` is 404. Spam and trash are 410. Thermometer old slug is not confirmed and is not redirected. |
| Tests | `src/lib/seo/remediation.test.ts` and `e2e/seo.spec.ts`. The e2e file has not been run against production. |

### What the public host shows

**OBSERVED**, accepted, not re-opened: the canonical domain does not serve this app. Indexed snippets from 2025 still describe an older WordPress shop, including a Proxerex page that claims “clinically proven” erectile support ([old indexed URL](https://nilepharmafood.com/product/proxerex)). That copy is not the target.

### What the site copy already asserts, and what is not verified

The dictionaries and legal pages state a trade name, a registered-style Arabic name (`شركة النيل للأدوية والأغذية والمكملات الغذائية`), an Obour address, phones `01027639857 / 01024442340`, email `info@nilepharmafood.com`, an authorized-Alfasigma relationship, NFSA registration “until 2030”, and broader FDA/EMA/Olimp-Lab manufacturing language.

**UNKNOWN** this pass: a registration number, a live manufacturer page confirming the Egypt row, and whether the two phones and the Obour address are the single NAP the business wants published. A third-party directory repeats one phone and an Obour address ([pharmaceuticalbank.com](https://pharmaceuticalbank.com/company/nile-pharma-food-and-food-supplements/)). RocketReach and ZoomInfo add employee counts, a 2019 founding year, and a revenue band. Those are **not** authoritative. Do not copy them into schema.

---

## 3. Competitive intelligence

No overall winner. No rank order. Patterns below are what the retrieved results showed, not a measured share of voice.

### Who actually appears

| Surface | Who showed up | What the page is | Label |
| --- | --- | --- | --- |
| English “Proxeed Plus Egypt” | [Ubuy Egypt](https://www.ubuy.com.eg/en/brand/proxeed-plus), Amazon.com sold by Alfasigma USA, Inc. | Importer marketplace and US manufacturer storefront | **OBSERVED** |
| Arabic “بروكسيد بلس” price | [egyptdwa.com](https://egyptdwa.com/m/25449), [dwaprices.com](https://dwaprices.com/med.php?id=25449), [Noon Egypt wellness](https://www.noon.com/egypt-ar/health/wellness/proxeed_plus/) | Price directories and a thin marketplace category | **OBSERVED** |
| “Proxeed Women” | [proxeed.eu](https://www.proxeed.eu/products-for-women/proxeed-women), [LogixX Fertility](https://www.logixxfertility.com/proxeed-women), Ubuy Egypt | Brand/education site and retailers. EU page says “clinically proven” and lists a 1-sachet dose | **OBSERVED** |
| Egypt male/female fertility sachets | [Egyptian Drug Store Carnivita Advance](https://egyptiandrugstore.com/index.php?product_id=4671&route=product%2Fproduct), [Russian Pharmacy Egypt](https://russkaya-apteka.com/en/products/karnivita-advans-dlya-zhenshhin), [Pharmazone](https://pharmazone.com/products/carnivita-advance-for-men-30-sachets) | Eva Pharma Carnivita, not Proxeed. Pack, price, ingredients, and treatment-style indications | **OBSERVED** |
| “Proxerex” | Old `nilepharmafood.com` index snippet; [eBay Alfasigma 30 sachets](https://www.ebay.com/itm/334570115842) | Stale official URL plus a non-Egypt reseller | **OBSERVED** |
| CA-MI O2-Easy | [medical-xprt](https://www.medical-xprt.com/products/ca-mi-model-o2-easy-finger-pulse-oximeter-for-controlling-and-monitoring-917968), [Medaval](https://www.medaval.ie/resources/EN/devices/CA-MI-O2-Easy.html) | Manufacturer/spec directories. Medaval says clinical validation of the SpO2 technology was not found | **OBSERVED** |
| Arabic pulse-oximeter buy queries | [Kanbkam](https://www.kanbkam.com/eg/ar/pulse-oximeter-B0977WC4YW), [AMS Medicals](https://amsmedicals.com/product/%D8%AC%D9%87%D8%A7%D8%B2-%D9%82%D9%8A%D8%A7%D8%B3-%D8%A7%D9%84%D8%A3%D9%83%D8%B3%D8%AC%D9%8A%D9%86/) | Generic Egypt device listings (Beurer and unbranded SKUs) with EGP prices. CA-MI was not in these snippets | **OBSERVED** |
| “Nile Pharma Food” directories | pharmaceuticalbank, RocketReach, ZoomInfo | Third-party profiles. Conflicting detail. Not a SERP ranking study | **OBSERVED** as pages, **UNKNOWN** as rank |
| El-Nile Pharmaceuticals | `nilepharma.com.eg` and Arabic explainers | Different company, drug manufacturer. Occupies the short name | **OBSERVED** in prior 2026-09-23 research. Not re-fetched this pass |
| Alfasigma USA / proxeed.com | Manufacturer DTC, US-only seller language | Owns unqualified English “Proxeed” | **OBSERVED** in prior research. Amazon listing this pass names Alfasigma USA as seller |

### What those pages do

**OBSERVED** patterns, not a recommendation to copy them:

- Egypt price pages lead with Arabic name, pack (`30 كيس`), a number in EGP, and “سعر”. The two directories for the same Proxeed Plus pack do not agree: one snippet says 2,550 EGP with a 2026 page date; the other says 1,475 EGP last updated 2023-06-21. **UNKNOWN** which, if either, is the current selling price.
- Ubuy’s brand page answers “what is it / how does it work / is it effective / how long” and attributes development to Sigma-Tau. It also says results vary. That is a commercial FAQ pattern.
- proxeed.eu and LogixX publish ingredient amounts and fertility-outcome language. LogixX separates a clinical-papers section. Whether those papers apply to the Egypt pack was **not** checked.
- Carnivita pharmacy pages publish dose, contraindications, and indications that include infertility and ART preparation. That is a local commercial pattern. It is also a YMYL risk. It is not evidence that Nile Pharma Food may say the same about Proxeed.
- Device SERPs in Egypt are spec-and-price pages for whoever has stock. Brand story is thin. Medaval’s “no peer-reviewed validation found” is a reason not to invent an accuracy claim for O2-Easy.
- Authorship, medical reviewer, and date-stamped references were **not** consistently present on the Egypt directory pages. **UNKNOWN** how often Google rewards that absence. Do not treat the absence as a tactic.

**INFERRED:** a page that states pack, Arabic name, price, and seller matches the commercial queries that are visible. A page that promises conception or erectile outcomes matches some competitor copy and is not an acceptable template.

**UNKNOWN:** featured-snippet ownership, People Also Ask questions, AI Overview citations, backlink counts, and domain authority. None of those were measured.

---

## 4. Search landscape

Intent is inferred from the words in the queries that returned pages, not from a keyword tool.

| Cluster | Intent | Language | Audience | Funnel | SERP format seen | Right page type | Exists now | Missing | YMYL | Evidence needed | Link role | Commercial tie |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Nile Pharma Food / نايل فارما فود | Brand navigational | AR + EN | Buyers and partners | Decision | Directories, stale homepage | Homepage + About | Routes exist; host does not serve them | Live confirmation | Low | Legal name | Hub of the site | All products |
| Nile Pharma / شركة النيل للأدوية | Brand, colliding | AR + EN | People seeking the drug company | Navigational | Other company’s pages | Disambiguation only after legal sign-off | Not a safe page yet | Approved wording | Medium | Legal identity | Must not steal the other company’s drug queries | None |
| Proxeed Plus / بروكسيد بلس | Product commercial | AR + EN | Men / couples | Decision | Price directories, importers, US brand | Arabic PDP, English alternate | PDP exists, noindex | Claim clearance, live price | High | Leaflet | From men’s cluster only after the cluster is indexable | This SKU |
| Proxeed Women / بروكسيد نساء | Product commercial | AR + EN | Women / couples | Decision | Brand sites, importers | PDP | Exists, noindex | Leaflet match, dose check | High | Leaflet | Women’s cluster later | This SKU |
| Proxeed Men | Product, pre-launch | AR + EN | Men | Consideration | Not separately measured this pass | PDP, noindex | `launching_soon` | Launch facts | High | Leaflet | Do not feature as in stock | Future SKU |
| Proxeed Women Inositol | Product, incomplete | AR + EN | Women, PCOS-adjacent language in catalog | Consideration | Not measured | PDP, noindex | Dose unconfirmed | Exact mg | High | Confirmed dose | No educational leap | Future SKU |
| Proxerex / بروكس إيركس | Sexual-health commercial | AR + EN | Adult men | Decision | Stale official page, EU reseller | PDP, noindex until clearance | Exists | Claim review; old “clinically proven” text must not return | High | Leaflet | Not a fertility-cure link | This SKU |
| Ellamuselle / إلاميوسيل | Paused product | AR + EN | Women | Navigational for old bookmarks | EU retailers in prior research; Egypt retail **not observed** this pass | noindex PDP | Paused | Business decision to sell or not | High | Leaflet if ever reactivated | Do not retarget to another SKU | None while paused |
| Carnitine / fertility sachets, generic | Category commercial | AR + EN | Men or women | Consideration | Carnivita and other pharmacies | No page until two cleared SKUs exist | Filter URLs only | Distinct page | High | Several cleared products | Listing, not an essay | Supplements |
| Male fertility information | Informational | AR + EN | Men trying to conceive | Awareness | Not fully sampled. Commercial pages answer it with product claims | Educational page only after review | None that should rank | Medically reviewed explainer | High | External references, not competitor ads | To PDPs only as products, not treatments | Indirect |
| Female fertility / PCOS information | Informational | AR + EN | Women | Awareness | Competitor pages attach indications to sachets | Same gate | Inositol dose unconfirmed | Reviewer | High | Dose plus references | Do not use Inositol PDP as the article | Indirect, later |
| Sexual function information | Informational | AR + EN | Adult men | Awareness | Old Proxerex page | Do not revive that page’s claims | Unsafe old copy in the index | Reviewed, non-outcome page | High | Leaflet functions only | Separate from fertility hubs | Proxerex only if cleared |
| Pulse oximeter buy | Device commercial | AR | Home users, clinics | Decision | Generic EGP listings | Device PDP | Eligible in code if specs hold | Brand confirmation, Egypt model match | Medium | Spec sheet | Devices branch only | Oximeter |
| Infrared thermometer buy | Device commercial | AR | Home users | Decision | Not sampled as a full SERP this pass | Device PDP | Eligible in code | Old slug still unconfirmed | Medium | Spec sheet | Devices branch | Thermometer |
| Price / comparison | Commercial investigation | AR | Shoppers | Decision | Directory “سعر” pages | PDP price module, not a comparison site | Price in catalog for some SKUs | Dated public price | Medium | Vendure price | No “vs Carnivita” page yet | Own SKU |
| Pharmacy near me | Local | AR | Walk-in buyers | Transactional | Not measured | Not a store-locator unless stores exist | Shipping zones only | Store list | Low | Real locations | Reject doorway cities | Delivery, not local SEO |
| AI / answer engines | Citation | AR + EN | Anyone asking “what is” | Awareness | Not measured | Short factual definitions from leaflets | Not present as citeable live HTML | Live, sourced answers | High | Same as YMYL | From cleared PDPs and reviewed articles | Only factual |

---

## 5. Keyword universe

No volumes. A cluster is included only if a catalog name, a retrieved SERP, or a real business fact gives it a reason to exist.

### Brand

- Nile Pharma Food, Nile Pharma, نايل فارما فود.
- Arabic legal-style name already in the terms text. Use in public SEO only after legal confirmation, because it overlaps El-Nile.
- Product + brand: “Proxeed Plus Nile Pharma”, “بروكسيد بلس نايل فارما”. Reason: navigational once the site is the seller of record.
- Reject: “شركة النيل للأدوية” as a head term. That query belongs to another entity unless a disambiguation sentence is legally approved.

### Exact products

Use only stored names.

| Latin | Stored Arabic | Why the cluster exists |
| --- | --- | --- |
| Proxeed Plus | بروكسيد بلس | Catalog SKU. Arabic price SERP exists. |
| Proxeed Men | بروكسيد رجال | Catalog SKU. Not a live commercial target while `launching_soon`. |
| Proxeed Women | بروكسيد نساء | Catalog SKU. English brand SERP exists. |
| Proxeed Women Inositol | بروكسيد نساء إينوزيتول | Catalog SKU. Incomplete. |
| Proxerex | بروكس إيركس | Catalog SKU. Old URL is in the index. |
| Ellamuselle | إلاميوسيل | Catalog SKU. Paused. |
| CA-MI Pulse Oximeter | جهاز قياس تشبع الأكسجين CA-MI | Catalog SKU. |
| CA-MI IR Thermometer | ميزان حرارة بالأشعة تحت الحمراء CA-MI | Catalog SKU. |

Do not invent Arabic spellings beyond these. “بروكسيد” vs “بروكسيد” variants already in the catalog are the ones to use. Extra transliterations are **UNKNOWN** demand.

### Generic and modifier language that was actually visible

Arabic commercial modifiers in retrieved titles: سعر، كيس، 30، للرجال، للخصوبة، صيدلية، مصر.  
English modifiers in retrieved titles: male fertility, female fertility, sachets, supplement, Alfasigma.

Allowed as modifiers on a product page only when the fact is true for that SKU (pack count, country of sale, seller). Not allowed as a reason to create a new URL.

### Problem and question language

Reason to exist: users asking what a named product is, what a sachet contains, and who sells it in Egypt. Those questions are visible on Ubuy and on price pages.

Not created here: symptom lists, disease outcomes, “best fertility pill”, “increase sperm count fast”, or erectile-cure phrasing. Those phrases appear in competitor and old-site copy. They are not a Nile Pharma Food keyword target until a leaflet and a reviewer allow a specific, bounded statement.

### Comparison language

“Proxeed vs Carnivita” is a plausible commercial query because both are carnitine sachets sold in Egypt. **INFERRED**, not measured. A comparison page is not justified now: the catalog does not contain a sourced comparison, and copying Carnivita’s infertility indications would be a medical claim. Reject until a reviewer writes a factual ingredient-difference table from leaflets.

---

## 6. Search intent map

| Query class | Satisfy with | Do not satisfy with |
| --- | --- | --- |
| Navigational brand, full name | Homepage and About, once live | A keyword-stuffed homepage |
| Navigational brand, short name | A short disambiguation after legal approval | Pretending to be El-Nile or outranking their drug catalog |
| Transactional, named pack | PDP: name, pack, price, availability, seller | A blog post |
| Commercial investigation, “سعر” | The same PDP, with a dated price | A scraped price-list domain |
| Informational, “what is this product” | First screen of the PDP, from the leaflet | A 2,000-word essay |
| Informational, condition | A reviewed article that does not sell a cure | A PDP key-benefit block |
| Comparison | A reviewed table of documented ingredients, or nothing | “We are more clinically proven” |
| Device spec | Spec table already in the catalog | Fertility copy |

Funnel stages are labels for planning. They are not a ranking model.

---

## 7. Product SEO strategy

### Index rule, all products

A product may be indexed only when `productIndexDecision` would pass **and** a human evidence pack says the visible claims match the leaflet. Today every supplement fails the first test. Devices can pass the code test and still must not assert a brand in schema until a catalog brand field exists.

Paused and launching products stay in the database, stay reachable, stay noindex, and stay out of the sitemap.

### Canonical URL pattern

- Arabic canonical: `https://nilepharmafood.com/ar/products/{slug}`
- English alternate: `https://nilepharmafood.com/en/products/{slug}`
- English is hreflang, not a second redirect target.
- Old WooCommerce paths redirect only for the five confirmed pairs, to the Arabic URL, one hop, after the app is the origin.

### PDP template

Use this template for every SKU. Fill only from catalog or an approved leaflet. Leave the field blank if unknown.

1. H1 = stored heading for the locale. Arabic pages also show the Latin name as a secondary line, not as the H1.
2. Title = that heading. Do not append “best”, “clinically proven”, or a city list.
3. Meta description = stored short description, trimmed. If the short description contains an outcome claim the evidence pack rejects, replace the description before indexation. Do not invent a new claim in the replacement.
4. Identity block: Latin name, Arabic name, SKU, category, pack (`availableForm`).
5. Seller: Nile Pharma Food, as the seller. Brand and manufacturer: omit until a field exists. Do not write Alfasigma into CA-MI. Do not write CA-MI into supplements without a confirmed brand field.
6. Composition table: stored rows only. If a row says the amount is unconfirmed, the product is not indexable.
7. Price and availability: from the live commerce source at render time, not from a directory and not from a hardcoded hope. Catalog seed prices are planning facts, not a public price promise.
8. Evidence block: grade the claim (leaflet fact, ingredient-level study, product-level study, or not established). The Proxeed Men English benefit text currently mixes a careful note with “clinically proven” marketing. The marketing half is not publishable as fact.
9. Warnings: only from the leaflet. If the leaflet is missing, publish no dose and no contraindication.
10. FAQ: only questions the leaflet or the seller can answer (pack size, what the seller is, how to contact). No FAQPage schema until the answers are visible and sourced.
11. Schema: current Product rules. No rating, review, or GTIN. A UK Ellamuselle GTIN seen in earlier research is a candidate to verify, not a value to paste.
12. Internal links: related products in the same audience only when both are allowed to be linked. Do not link a paused SKU as an alternative treatment.

### Per product

| Slug | Status in catalog | Seed price | Pack in catalog | Index now | Strategy |
| --- | --- | --- | --- | --- | --- |
| `proxeed-plus` | active | 2550 | 30 × 5 g lemon sachets. Note says amounts are per 2 sachets | No | Own “بروكسيد بلس” as the Egypt seller page after clearance. Do not reconcile 1,475 vs 2,550 from directories in public copy. |
| `proxeed-men` | launching_soon | none in the fields checked | 30 × 6.5 g | No | Keep noindex. Strip outcome marketing before any launch. No Offer. |
| `proxeed-women` | active | 2550 | 30 × 6 g orange. 16 ingredients cited to an Alfasigma doctors’ leaflet | No | Index only after that leaflet is on file and the visible dose matches it. proxeed.eu’s 1-sachet instruction must not be copied unless the Egypt leaflet says the same. |
| `proxeed-women-inositol` | launching_soon | none checked | Packaging “قيد الاعتماد”. Myo-Inositol amount unconfirmed | No | No dose, no PCOS outcome page, no index. |
| `proxerex` | active | 1790 | 30 × 6 g orange | No | Do not restore the indexed “clinically proven erectile function” wording. Sexual-health claims need their own review. |
| `ellamuselle` | paused | 1200 | 30 sachets, 9 ingredients | No | Keep the old URL from 404ing into a different product. Do not market it. Confirm whether an OutOfStock Offer is honest. |
| `ca-mi-pulse-oximeter` | active | 500 | Fingertip oximeter. Specs stored | Code-eligible only | Specs page. No fertility cross-links. Brand omitted until confirmed. Medaval’s missing validation is a reason not to claim clinical accuracy. |
| `ca-mi-ir-thermometer` | active | 750 | Non-contact thermometer. Specs stored | Code-eligible only | Same device rules. No redirect from the unconfirmed old slug. |

---

## 8. Category and hub architecture

A hub is justified only if it has several relevant assets, a distinct intent, unique facts, an internal-link job, and a safe YMYL posture. Otherwise it is rejected.

| Proposed hub | Decision | Why |
| --- | --- | --- |
| `/products` catalog | Keep | Real listing. Already the canonical for filtered views. |
| Supplements category | Keep as a filter, not an essay | Real products, but none are indexable yet. A long category page would be thin. |
| Medical devices | Keep as a filter; consider a real URL only after both device PDPs are approved for index | Two products, distinct from fertility. Enough for a listing, not for a clinical hub. |
| Men’s health | **Reject as an indexable hub for now** | Three slugs, one not launched, none claim-cleared. The current `?need=mens-health` URL must stay non-canonical. |
| Women’s health | **Reject as an indexable hub for now** | One active supplement, one incomplete, one paused. |
| Fertility | **Reject** | No reviewed article and no indexable product set. A fertility hub would be a claim page. |
| Sexual health | **Reject** | One SKU and a history of over-claiming. |
| Devices as a medical-advice hub | **Reject** | Specs do not justify “how to diagnose” content. |
| Dental, cosmetics, drugs | **Reject** | `coming_soon`. No products. The drugs tile collides with El-Nile’s actual business. |
| Comparison hub | **Reject** | No sourced comparison. |
| City or “Egypt pharmacy” hubs | **Reject** | Shipping zones are not store locations. |
| Blog index | Keep noindex until a real article exists | Already the code rule. |

**INFERRED:** the first honest architecture is homepage, about, product listing, eight PDPs, contact, and legal pages. Hubs are a later branch, not a launch requirement.

---

## 9. Content gap analysis

| Cluster | What retrieved competitors cover | What users are being offered | What Nile can factually say today | Needs medical review | Needs leaflet | Do not publish |
| --- | --- | --- | --- | --- | --- | --- |
| Proxeed Plus commercial | Pack, price, fertility outcome, “how long until results” | A buyable 30-sachet story | Seller, stored pack, stored composition, contact | Any effect on sperm or conception | Yes, before those sentences | “Clinically proven” without the study and the product match |
| Proxeed Women | Ingredient table, hormonal and egg-quality claims, 4–6 month use | A fertility protocol | Stored 16-ingredient list if it matches the leaflet | Any pregnancy claim | Yes. Confirm sachet count per day | Copying proxeed.eu outcome lines |
| Inositol / PCOS | Pharmacies attach infertility and ART indications to other brands | A condition solution | Catalog already says the dose–study link is unconfirmed | The whole topic | Exact mg first | Any dosing claim |
| Proxerex | Erectile function, libido, “patented” | A sexual-performance product | Ingredient names in the catalog | Any sexual-function outcome | Yes | The 2025 indexed summary |
| Carnivita-shaped category | L-carnitine sachets for men and women, prices, indications | “The fertility sachet” | Not a category Nile should answer with Carnivita’s indications | If a difference table is ever written | Both leaflets | A versus page that implies superiority |
| Pulse oximeter | Specs, batteries, EGP price, how to use at home | A device to buy | Stored ranges, battery, weight, seller, price | Any diagnostic claim | Spec sheet | “Clinically validated” — Medaval did not find that |
| Brand “who are you” | Directories with conflicting phones and industry labels | A company card | Trade name, email, the address and phones already in the legal pages, after the business reconfirms them | No | No | ZoomInfo revenue, RocketReach headcount, FDA/EMA lines without documents |
| Generic fertility education | Mixed commercial articles | How to get pregnant | Nothing unique yet | Yes, before a word is published | No | AI articles, symptom lists, treatment protocols |

Commercially useful and defensible, in order: a correct PDP for each real SKU; a one-page seller explanation; device spec pages. Informational fertility and sexual-health articles are not defensible yet.

---

## 10. YMYL and health content framework

Health content is not marketing with citations added later.

### Allowed without a clinician

- Who the seller is.
- What the pack contains, copied from the leaflet.
- Pack count, form, SKU, price, and whether it can be ordered.
- How to contact the company.
- Device specifications from the spec sheet.
- “This is a food supplement, not a medicine” if the leaflet says that.

### Requires medical or regulatory review before publication

- Any sentence about fertility, sperm, eggs, ovulation, PCOS, conception, pregnancy, libido, or erectile function.
- Any dose, duration, or “take for 4–6 months”.
- Any contraindication, warning, or “safe”.
- Any “clinically proven”, “patented”, or study citation. The citation must be the paper, not a competitor page, and the reviewer must say whether it studied this finished product or only an ingredient.
- Any NFSA, FDA, or EMA sentence. The site already says some of these. They stay out of new SEO fields until the document number is on file.

### Required on any page that passes review

- Author named, with a real role.
- Reviewer named, with a real credential. No fake Person schema.
- Review date and the leaflet version the text follows.
- Separation: product facts in one block, general health information in another, neither presented as personal medical advice.
- Update the page when the leaflet changes. Do not invent `lastModified` in the sitemap.

### Never

- Turn a key-benefit paragraph into an article.
- Infer efficacy because Carnivita, Ubuy, proxeed.eu, or the old Nile page said it.
- Invent a clinical trial, a percentage improvement, or a patient story.
- Publish sexual-health content aimed at anyone under 21.

---

## 11. AEO, GEO, and AI search

Not measured: whether Google AI Overviews, Bing Copilot, or any LLM cites this domain. Eligibility is not guaranteed.

What makes a fact retrievable, once the page is live and allowed:

- A one-sentence definition: what the product is, who sells it in Egypt, what the pack is. Source: leaflet plus seller confirmation.
- A composition table with units.
- A visible “we are the seller, not the manufacturer” line after legal approval.
- FAQ answers that repeat the visible table, not a new claim.
- Stable URLs and matching names in the title, H1, and Product schema.

What not to do:

- Write answer-shaped filler.
- Add FAQ schema to unanswered questions.
- Optimize for a prompt. Optimize for a sourced sentence.
- Claim a citation relationship with Alfasigma, a journal, or a hospital that has not been confirmed.

Featured snippets and People Also Ask are the same rule: the sentence must already be true on the page. No snippet is promised.

---

## 12. Entity strategy

### Entities that are real in this project

| Entity | What we may say | What we must not say |
| --- | --- | --- |
| Nile Pharma Food | Trade name used across the app. Email `info@nilepharmafood.com`. Domain `nilepharmafood.com`. | That it is El-Nile, Alfasigma, or CA-MI. |
| شركة النيل للأدوية والأغذية والمكملات الغذائية | This string is in the terms and privacy text. | That it is legally verified, or that it should be the SEO title. Legal review first. |
| Products | The eight slugs and stored names. | Extra products, or that a coming-soon category is a product line. |
| Alfasigma | Named in site copy as the supplement principal. | Confirmed live distributor status. The manufacturer page was not re-fetched successfully this pass. |
| CA-MI | Named in site copy as the device principal. Manufacturer address on Medaval is CA-MI srl, Italy, for the O2-Easy. | That this string is the schema brand, or that Nile manufactures the device. |
| People | None verified this pass. | Founders, doctors, or reviewers in schema. |
| Social profiles | Old index text previously mentioned Facebook and Instagram. Not reconfirmed as official this pass. | `sameAs` until the business confirms the URLs. |

### Disambiguation

El-Nile Co. for Pharmaceuticals and `nilepharma.com.eg` are a different company. **OBSERVED** previously. This plan does not claim any corporate relationship.

A public disambiguation sentence is a backlog item, not copy to ship now. It waits on legal confirmation of Nile Pharma Food’s registered name. The sentence, when approved, should state the difference in one line on About and nowhere else. It should not target El-Nile’s drug names.

### Consistency target, after verification

The same confirmed name, domain, email, phone, and address on: About, Contact, legal pages, Organization `name` and `url`, and the seller field. Brand schema stays absent until a brand field exists. External directories are corrected by the business, not by inventing `sameAs`.

---

## 13. Information architecture

Only branches with a catalog or a legal need.

```
https://nilepharmafood.com/ar          Arabic home (default)
https://nilepharmafood.com/en          English home
├── /about                             Seller explanation
├── /story                             Only if claims are evidence-checked; otherwise noindex until then
├── /products                          Catalog canonical
│   ├── /products/{slug}               Eight PDPs
│   └── filters (?category=, ?need=)   Not canonical, not in the sitemap
├── /contact
├── /shipping-delivery
├── /privacy-policy
├── /terms
├── /quality-sourcing                  Keep only if every certification sentence has a document
├── /careers                           Reachable, noindex while empty
└── /blogs                             Noindex, unlinked, until a reviewed article exists
```

Not in the tree: Men, Women, Fertility, Sexual health, Devices-as-a-hub, Educational resources, Dental, Cosmetics, Drugs, comparison, city pages.

Devices stay inside the catalog, labeled medical devices, not inside a fertility branch.

Canonical relationships: each indexable URL is its own path on `https://nilepharmafood.com`. Arabic and English are alternates of the same path. Filtered URLs canonicalize to `/products` or to the PDP, never to a query string.

---

## 14. Internal linking

| From | To | Anchor principle |
| --- | --- | --- |
| Home | `/products` and the few products the business is willing to feature | Stored product name. Not “best fertility pill”. |
| Header / footer | About, products, quality, contact, careers, legal | The navigation label already in the dictionary. |
| Catalog | PDP | Stored heading. |
| PDP | Other in-stock, same-audience products | The other product’s stored name. No “alternative treatment”. |
| PDP | Evidence or leaflet download | “Leaflet” / “النشرة”, not a keyword. |
| Future reviewed article | The one relevant PDP | Product name, once. |
| Future article | Another article | The article’s actual title. |
| Device PDP | Fertility content | Do not link. |
| Paused or launching PDP | A different product as a substitute | Do not link. |
| Any page | `?category=` or `?need=` as if it were a hub | Do not treat it as a canonical target. |

Orphan risks today:

- `/blogs` is unlinked on purpose. Leave it unlinked until it has an article.
- Ineligible PDPs can still be reached from the catalog. That is correct. They must stay noindex.
- Old `/product/*` URLs are not internal links. They are redirects or 404s.
- Coming-soon tiles must not be links to empty SEO URLs.

Breadcrumbs: Home → Products → product name. Category name may appear as text. Do not emit a breadcrumb URL with `?category=`. Already the schema rule.

---

## 15. Schema strategy

| Type | Allowed when | Required data | Prohibited | How to validate |
| --- | --- | --- | --- | --- |
| Organization | Homepage, trade name only, until legal name is confirmed | `name` = site name, `url` = canonical origin, logo that exists | legalName, address, telephone, sameAs, founder, award, until each is confirmed | Rich Results test after the site is live. Unit test that non-canonical hosts are rejected. |
| WebSite | Optional, after launch | `url` and name matching Organization | SearchAction unless site search is a real indexable feature. It is not. | Same |
| WebPage | If a page needs a type | URL equals canonical | Fake dates | Compare canonical and `url` |
| BreadcrumbList | PDPs and real listing pages | Visible labels and canonical item URLs | Query-string items | Existing unit test |
| Product | Every PDP, indexable or not | Stored name, description, url | brand, manufacturer, gtin, aggregateRating, review | Existing unit test. Live check after launch. |
| Offer | Finite price and availability that matches the cart | price, EGP, availability, seller trade name | Price from a directory. Offer on `launching_soon`. Offer on a paused SKU if the business says it is not commercially offered | Compare rendered price with Vendure |
| Brand | Only after a catalog brand field exists | That field | Alfasigma on devices. Seller copied into brand | Schema must not contain a brand key until the field exists |
| Article | Only a reviewed article | Author, date, reviewed body | AI filler, medical outcome | Editorial checklist |
| FAQPage | Only if every question and answer is visible and sourced | Visible FAQ | Questions added for schema | Manual review |
| Person | Only a real named reviewer who agrees | Name and role they actually hold | Medical credential that was not verified | HR / legal confirmation |

No fake ratings, reviews, GTINs, prices, availability, or affiliations.

---

## 16. Arabic and English strategy

**OBSERVED** in the app:

- Locale prefix `/ar` and `/en`. Arabic is the default redirect from `/`.
- hreflang alternates on PDPs and the homepage metadata.
- Arabic heading comes from `nameArabic`. English heading is the Latin `name`.
- Missing Arabic falls back to Latin and is not indexable.
- Product search on the listing also matches `nameArabic`.

Rules for later content:

- Do not machine-translate medical paragraphs. A reviewer writes or approves each language.
- Do not invent Arabic product names. The eight stored strings are the list.
- English titles should say Egypt when the query would otherwise belong to proxeed.com or Amazon. That is a disambiguation choice, not a promise to outrank the US site.
- Arabic commercial intent, where seen, wants the Arabic name and the pack. English commercial intent, where seen, wants the Latin name and “fertility supplement”. Meet those with facts, not with extra adjectives.
- Localization is not a second product. Composition numbers must match across languages. If they do not, neither language is indexable.

---

## 17. SERP feature strategy

No feature is guaranteed.

| Feature | Where it might matter | Requirement | Not a requirement |
| --- | --- | --- | --- |
| Ordinary blue link | Named product and full brand | Live 200, unique title, self-canonical | A keyword list |
| Product rich result | Cleared PDPs with a real price | Offer matching the page | Stars |
| Sitelinks | Full brand name, after the site has real sections | Clear nav: products, about, contact | Invented sections |
| Featured snippet | “What is Proxeed Plus” after the definition is sourced | One sourced sentence | A snippet plugin |
| People Also Ask | Unknown. Not sampled | Answer only if the question is in the leaflet | Guessed questions |
| Image result | Device and pack photos | Real photo, stored-name alt | Keyword alt text |
| Video | No Nile video was found | A real video with a transcript, later | Stock medical video |
| Knowledge panel | Full brand, maybe, after consistency | Confirmed entity data | Forcing a panel |
| AI answer | Unknown | The same sourced sentence, live | Prompt stuffing |

---

## 18. Media SEO

- Alt text is the stored heading for that locale. Already the direction of the product components. Do not append “fertility supplement Egypt”.
- File names should be the slug, not a sentence. Rename only when assets are replaced. Do not rename live files in this plan.
- Dimensions and compression were **not measured**. When new photography is made: one pack shot, one contents shot, consistent background. Prefer a modern format the app already serves if the pipeline supports it. WebP or AVIF is a production choice, not a ranking tactic.
- No image sitemap until at least one PDP is indexable and the images are the final assets.
- Educational diagrams only inside a reviewed article, with a source line.
- Do not use competitor pack shots.

---

## 19. Local and geo search

A local opportunity exists only if the business actually receives visitors or wants a map listing for the Obour address already written in the legal pages.

**OBSERVED:** that address is in the privacy and terms text, and a 2023 directory snippet places the company in Al Obour, Qalyubia, with one of the two phones.  
**UNKNOWN:** Google Business Profile existence, opening hours, whether the address is a public counter, and which phone is primary. The app’s two numbers do not exactly match every older snippet.

If the business confirms one NAP and a real location:

- One Google Business Profile, created by the business, matching the legal pages.
- No extra city landing pages. Shipping to Cairo, Giza, and Alexandria is not a store.
- No fabricated branches.

If they do not confirm a public location: do not build local SEO. The commercial opportunity is national product search, not “pharmacy near me”.

---

## 20. Authority strategy

No outreach in this phase. No links were built.

Legitimate signals that are consistent with what was observed:

- A manufacturer distributor row that names this company and this domain, if Alfasigma or CA-MI still publish one. The live row was **not** reconfirmed this pass. Next action is the business asking the manufacturer, not a directory submission.
- The company’s own About page, after claims are documented.
- A corrected Google Business Profile, if local is real.
- Expert explanations only when a named reviewer writes them.

Avoid, explicitly:

- Paid spam links, PBNs, link farms, automated submissions.
- Irrelevant guest posts.
- Fake reviews or purchased ratings.
- Copied clinical PDFs presented as the company’s research.
- Any attempt to use the old suspended-host spam URLs as “history”.

Competitor authority, where visible, is manufacturer brand sites, pharmacy catalogs, and price directories. That is an observation about page types. It is not a backlink count and not a model to buy.

---

## 21. Brand search strategy

Own the full name. Do not fight the colliding short name with volume.

| Query | Desired live result, after the site is up | Do not chase |
| --- | --- | --- |
| Nile Pharma Food, نايل فارما فود | Homepage, then products, about, contact | A second domain |
| Nile Pharma, نايل فارما | Homepage only if the title is distinctive. A disambiguation line after legal approval | El-Nile’s drug names |
| Proxeed + Nile / بروكسيد + نايل | The matching PDP | A US Amazon URL as “our” page |
| Branded questions (“are you the Alfasigma distributor?”) | About, one sourced sentence | A badge without a document |

Sitelinks, entity boxes, and social profiles are consequences of consistent public facts. They are not tasks to force. Social URLs stay out of schema until confirmed.

The old indexed Proxerex and Proxeed Plus URLs should resolve, after cutover, by the existing redirect map, to the noindex PDP, not to a new claim page.

---

## 22. Analytics and measurement

No baseline numbers exist. Do not fill dashboards with estimates.

When the app is the origin and Search Console / Bing access exists, record, do not invent:

- Indexed URL count and excluded URL count, by reason.
- Impressions and clicks for the full brand name versus product names. Split is **Not measured** until the export exists.
- Landing pages: home, PDPs, catalog. Query pages should not be landing pages.
- Sitemap processing status.
- Rich-result errors.
- Crawl errors for `/product/*`, `/term-paper-writer-reviews`, and `/cgi-sys/`.
- On-site: product views and completed orders from the commerce system, not from an SEO tool. Organic-versus-other split only if analytics is actually installed and consented. Installation status was **not** audited here.

AI-answer visibility: no standard report was available. Do not buy a score. If a citation is noticed, save the URL and the date. That is an anecdote until it is repeatable.

Baseline requirement before any “growth” statement: one full month of Search Console data after the suspension page is gone. Until then every trend is **Not measured**.

---

## 23. SEO testing and CI

Already in the repo, keep:

- Unit: origin, eligibility, identity, schema prohibitions, redirect table, sitemap membership, robots policy.
- E2E file: one-hop 301, 404, 410, robots, Arabic H1, no brand on the device PDP. Run it only against this app, never against the suspension host as if it were a pass.

Add later, still as tests, not as new features now:

| Check | Layer | When |
| --- | --- | --- |
| Sitemap URL is 200, self-canonical, and indexable | E2E against a seeded app | CI, after Postgres exists |
| noindex PDP is absent from sitemap | Unit, already | Keep |
| Homepage, PDP, and listing titles are not duplicated across the eight slugs | Unit | When titles change |
| hreflang pairs resolve | E2E | CI |
| Organization JSON has no address or sameAs until fixtures include them | Unit | When schema grows |
| Story and about pages do not contain an unapproved FDA/EMA sentence | Unit source test, if the business rejects those sentences | After the evidence decision |
| Broken internal links in nav | E2E | CI |
| Private routes not in sitemap | Unit, already | Keep |
| Scheduled fetch of production `/`, `/robots.txt`, `/sitemap.xml` | Monitoring outside CI | Only after cutover. Alert if the body contains “Account Suspended” |

Do not add tests that require fake ratings or a fake GTIN.

---

## 24. Implementation backlog

Priority is dependency order, not a predicted ranking impact. “Expected measurable signal” means what could be observed, not a forecast.

| ID | Pri | Objective | Page / system | Why it matters | Dependency | Evidence required | Complexity | Validation | Signal, if any | Risk |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| B-01 | P0 | Serve this app on the existing domain | Host | Nothing else is testable | External operator | Cutover proof | External | Runtime gate, not this document | A 200 of this app | Pretending a code change fixed hosting |
| B-02 | P0 | Re-run the runtime checks once, after B-01 | Production | Confirms redirects, robots, sitemap | B-01 | Live responses | Low | The closed gate’s checklist | Pass/fail list | Declaring SEO fixed from a single crawl |
| B-03 | P0 | Freeze supplement indexation | Eligibility gate | Already encoded. Do not loosen it | None | The code rule | None now | Existing unit tests | Ineligible slugs absent from sitemap | Indexing active supplements because they are active |
| B-04 | P0 | Evidence pack per SKU | Internal file, not a public page | Blocks every product claim | Business | Leaflet PDF, dose, warnings, what may be said | Medium | Checklist signed per SKU | A yes/no per product | Using the download URL as clearance |
| B-05 | P0 | One confirmed NAP and legal name | About, contact, legal, later Organization | Directories disagree | Business / legal | Registration document, chosen phone, address, social URLs | Low once documents exist | Human diff against schema | Consistent name in the wild | Publishing the colliding Arabic name louder |
| B-06 | P1 | Remove or quarantine over-claim sentences in catalog copy | PDP source text | Proxeed Men, Inositol, and the old Proxerex index disagree with the careful notes | B-04 | Reviewer mark-up | Medium | Read the rendered PDP | No “clinically proven” without a citation | Leaving the marketing half in `keyBenefits` |
| B-07 | P1 | Decide Ellamuselle Offer behavior | Paused PDP | A price plus OutOfStock can look like a product for sale | Business | “Is it commercially offered?” | Low | Schema fixture | Offer absent if not offered | Redirecting it to Proxeed Women |
| B-08 | P1 | Confirm or reject device brand field | Device schema | Brand is correctly omitted | Business | Manufacturer authorization | Low | Unit test still bans a hardcoded brand | Brand key appears only from data | Setting brand to CA-MI by guess |
| B-09 | P1 | Thermometer old slug | Redirect table | Wrong 301 is worse than 404 | Search Console or a backup | Exact historical path | Low | One 301 test | Old URL status | Shipping both hyphen variants |
| B-10 | P1 | Search Console and Bing after B-02 | External | Index, spam URLs, canonical conflicts | Access | Property verification | Low | Export, not a guess | Excluded-URL reasons | Blind removal |
| B-11 | P2 | About disambiguation sentence | About | Short-name collision | B-05 | Legal text | Low | Legal sign-off | Brand query shows the full name | Attacking El-Nile queries |
| B-12 | P2 | Index a supplement | That PDP and sitemap | Only after B-04 says yes | B-01, B-04 | Clearance flag in data, not a comment | Medium | Eligibility test flips for that slug only | URL in sitemap and index report | Turning the gate off globally |
| B-13 | P2 | Real device listing URL | Optional `/products` view or a devices path | Only if both devices stay indexable | B-08 | Specs | Low | Canonical is the new path, filters stay non-canonical | Devices crawlable without fertility text | A thin hub |
| B-14 | P2 | Seller confirmation on the manufacturer’s site | External profile | Strongest non-directory entity signal found in earlier research | Manufacturer | Live distributor row | External | Fetch the page | Referral or mention | Inventing `sameAs` |
| B-15 | P3 | One reviewed “what this product contains” article | Future article | Only if the PDP cannot hold the table | B-04, reviewer | Leaflet | High | YMYL checklist | Article indexed or deliberately noindex | A fertility blog program |
| B-16 | P3 | Ingredient-difference note versus other sachets | Not a versus landing page | Only if a reviewer writes it | Both leaflets | Side-by-side amounts | High | Medical sign-off | None required | A “better than Carnivita” page |
| B-17 | P3 | Image replacement | PDP media | Consistency, not keywords | Photography | Rights to the photos | Medium | Alt equals heading | None required | Keyword-stuffed filenames |
| B-18 | P3 | GBP | Maps | Only if the location is public | B-05 | Confirmed NAP | External | Business creates it | Map listing exists or does not | City doorway pages |

P0 items B-01, B-02, B-05, and B-10 are external. They are listed so implementation does not start in the wrong place. They are not a new hosting investigation.

---

## 25. 30 / 60 / 90 day plan

Publishing more pages is not the plan. Dependencies are.

### Day 0–30 — foundation, no new public content

- External: B-01 if the operator can do it. This team does not wait on it to finish the evidence work, and does not pretend it is done.
- Business: open the leaflet file for all eight SKUs (B-04). Mark each sentence in the current PDP as allowed, rewrite, or delete (B-06).
- Legal: confirm the registered name, the address, and one phone set (B-05). Decide whether FDA/EMA/Olimp-Lab/NFSA-2030 lines stay.
- Technical, only if B-01 happens: run B-02 and stop. Do not open Gate-style content work inside those 30 days.
- If B-01 does not happen: the month still produces the evidence pack. It does not produce articles.

### Day 31–60 — architecture that the evidence allows

- If a SKU is cleared, implement B-12 for that SKU only.
- If the legal name is confirmed, implement B-11. One sentence.
- If both devices are approved, implement B-13. Still no fertility hub.
- Internal links stay on the rules in section 14. No new nav items for Men, Women, or Fertility.
- B-07 and B-08 close the schema gaps.
- B-14 is a business email to the manufacturer, not an outreach campaign.

### Day 61–90 — only what passed review

- At most the articles in B-15, and only for products already indexable.
- No comparison site (B-16) unless the reviewer finished it. Default is do not publish.
- Authority work is limited to correcting the company’s own profiles and the manufacturer row. No guest posts. No directories-for-links.
- Measurement starts only after a full month of Search Console on the real site. No 90-day traffic target.

If evidence is still missing at day 90, the correct outcome is that supplements remain noindex. That is success of the framework, not a delay to fill with AI articles.

---

## 26. Adopt, adapt, avoid, invent

| Pattern | Class | Reason |
| --- | --- | --- |
| Arabic title with product name and pack | **ADOPT** | Visible on Egypt price pages and already stored in `availableForm`. |
| Self-canonical PDP per SKU | **ADOPT** | Already built. Matches how product queries resolve to a URL. |
| Ingredient table with units | **ADAPT** | Brand and pharmacy pages do this. Use the Egypt leaflet, not proxeed.eu’s table, unless they match. |
| Short “what is this” answer | **ADAPT** | Ubuy and brand sites do it. Limit it to seller, pack, and leaflet facts. |
| FAQ block | **ADAPT** | Only for questions the leaflet answers. No FAQ schema until then. |
| “Clinically proven” and conception promises | **AVOID** | Present on proxeed.eu, Ubuy, Carnivita pages, and the old Proxerex index. Not a template. |
| Treatment indications on a supplement | **AVOID** | Carnivita pharmacy pages do this. It is a medical claim. |
| Price-directory thin pages | **AVOID** | They rank in snippets and disagree with each other. Do not clone the model. |
| Stars, review counts, GTIN from another country | **AVOID** | Not in our data. A UK GTIN is unverified for the Egypt pack. |
| Brand schema copied from the seller or from Alfasigma onto devices | **AVOID** | Already removed. Keep it removed. |
| Fertility hub because the keyword exists | **AVOID** | Not enough cleared assets. |
| City pages and “pharmacy near me” | **AVOID** | No verified multi-location business. |
| Paid or automated links | **AVOID** | Not a legitimate signal. |
| Disambiguation from El-Nile, one sourced sentence | **INVENT** | No retrieved competitor needs this sentence. This catalog does, because the names collide. It still waits on legal text. |
| Evidence grade on the PDP (leaflet vs ingredient study vs not established) | **INVENT** | Competitor pages usually skip the distinction. The catalog notes already start it. Make it the public rule. |
| Separate device branch with no fertility links | **INVENT** | Egypt device SERPs are generic. Folding O2-Easy into a fertility hub would invent a relationship the catalog does not have. |

---

## 27. Risks and dependencies

| Risk | Type | What happens if ignored |
| --- | --- | --- |
| Domain still suspended | External, accepted | Every recommendation stays unpublished in effect. |
| Name collision with El-Nile | Entity | Brand queries never resolve to this catalog. |
| English Proxeed owned by the manufacturer’s US/EU sites | Entity | Egypt pages that copy them look like duplicates and still will not be the US answer. |
| Supplement claims in the current `keyBenefits` | Legal / YMYL | Indexing the PDP would publish text the evidence notes already weaken. |
| Inositol dose unconfirmed | Product | Any PCOS article would invent a dose. |
| Conflicting public prices | Commercial | A rich result can show a price the company does not charge. |
| NAP conflict across directories | Local / entity | A knowledge panel, if one appears, can be wrong. |
| Old indexed Proxerex claims | Search | They remain until the live URL replaces them and Search Console is reviewed. |
| Coming-soon drugs category | Entity | Can be read as competing with El-Nile’s actual business. |
| No Search Console access | Measurement | Spam URLs and exclusions stay **UNKNOWN**. |
| No search-volume tool | Planning | This document must not be turned into a traffic forecast later. |

Dependencies that unblock implementation, in order: host serves the app; leaflets exist; legal name and NAP confirmed; reviewer marks claims; only then indexation and any article.

---

## 28. Definition of done

This document is done when all of the following are true:

- It is the only new strategy artifact: `docs/search-domination-master-plan.md`.
- Application code was not changed.
- No page was published, no link was built, and no outreach was sent.
- No search volume, rank, traffic, or conversion number was invented.
- No competitor was ranked and no winner was declared.
- Every product strategy uses a real slug and a stored name.
- Every hub that is not justified is explicitly rejected.
- Supplement indexation stays blocked until an evidence pack exists.
- Medical outcome language is classified as not publishable without review.
- The production suspension is treated as an external blocker, not re-investigated.
- The next action is approval of the backlog, then implementation of the unblocked items. It is not another audit.

**Not done, and not claimed:** SEO fixed, production restored, rankings, AI visibility, or a content program.
