# NPF — Clinical Glass implementation plan

2026-10-15. Builds on the independent review; does not apply the historic patch or merge PR #4 blindly. All changes stay on arena/2f247beb-npf.

1. Upgrade compatible Next/Payload/Vendure groups and review remaining audit findings; fix Docker stage and build secret handling.
2. Native React/CSS Clinical Glass art direction: pearl canvas, emerald/navy contrast, floating navigation, bold editorial hero, quieter trust strip, need-first discovery, contextual product spotlight, evidence and a single contact close. Keep existing real product assets, translations, catalog/cart contracts and useful policy content.
3. Rebuild compact catalog toolbar; preserve search/filter/sort across locale changes; improve product card/PDP intrinsic sizing, touch/keyboard, focus and contrast. Simplify navigation; stop promoting empty blog.
4. Explicit catalog price provenance/fail-safe fallback, SSR skip link, error boundaries, wishlist/address recovery. Private HTML/RSC never cached; migrate old page caches. Avoid invented health claims/testimonials or analytics without consent/vendor decisions.
5. Unit/regression tests, lint/typegen/typecheck, production mock build, browser desktop/mobile/ar/en/dark and accessibility. Try real DB via temporary tooling only if feasible. Document remaining live-commerce/SMTP/security/deployment gates honestly.
6. Launch review preview bound to 0.0.0.0 with explicit preview configuration and visible mock-mode disclosure. Deliver before/after evidence and MD report; update Docs/Linear only to the extent verified.

Non-goals: fabricated medical approvals, fake successful checkout/payments, untested merging, automatic public sharing, or claims that local screenshots constitute production release approval.
