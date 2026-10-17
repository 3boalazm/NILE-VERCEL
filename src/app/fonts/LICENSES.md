# Local web fonts

All fonts here are self-hosted so production builds never depend on the Google
Fonts network. Delivery format is **WOFF2** — the raw TTF/OTF sources are kept
in [`assets/fonts-source/`](../../../assets/fonts-source/) (outside the
delivery path, so they are never served or bundled) for future edits.

## Fontsource subsets (SIL Open Font License 1.1)

Subsetted from Fontsource 5.3.0 packages.

- **IBM Plex Sans Arabic**: Copyright 2019 IBM Corp.; SIL Open Font License 1.1.
- **IBM Plex Mono**: Copyright 2017 IBM Corp.; SIL Open Font License 1.1.
- **Montserrat**: Copyright 2011 The Montserrat Project Authors; SIL Open Font License 1.1.

The full SIL Open Font License text is available at https://scripts.sil.org/OFL.

## Brand faces — ⚠️ licence status must be confirmed before launch

These two families were supplied to the project rather than downloaded from a
foundry catalogue, and **neither is covered by an OFL entry above**. What is
known comes from the licence metadata embedded in the files themselves
(`nameID 0`/`7`/`8`/`9`, read with fontTools):

| Family | Embedded licence statement | Designer / foundry |
|---|---|---|
| **KO Banzeen** (Arabic display, 3 cuts) | “Banzeen is a free typeface. **Don't redistribute or re-sell.** Copyright © 2024 Protype Foundry. All rights reserved.” · contact `hello@protype.studio` | Ibrahim Hamdi — Protype Foundry, ko-type.com |
| **Glora** (Latin display, 6 weights) | **none** — the files carry no `nameID 0` licence record at all | “Khaiuns” (designer credit, `nameID 9`) |

Two consequences worth being explicit about:

1. **KO Banzeen's “don't redistribute” needs a ruling.** Serving a webfont to
   site visitors is normal web embedding, but these binaries are also committed
   to a **public** GitHub repository, which is closer to redistribution than to
   embedding. Ask Protype Foundry (`hello@protype.studio`) to confirm web use —
   or move the files to a private asset store, or swap to an OFL-licensed Arabic
   display face. This is a business/legal question, not something code can
   settle; it is tracked in the defect register so it cannot be lost.
2. **Glora has no recorded licence.** It came from the client (“Ahmed's own
   files” per the layout comment). If it was commissioned or purchased, the
   licence terms should be filed here; if it was downloaded, the source needs
   identifying. Shipping a font with no known licence is the same class of risk
   as shipping unlicensed photography.

Nothing above blocks the current work: converting the files to WOFF2 does not
change what is already being served or already committed — it makes the same
delivery ~44% smaller.

## Regenerating the WOFF2 files

The conversion is a one-off asset build, not a runtime step (the repo's other
WOFF2 files were added the same way). To redo it after editing a source font:

```bash
pip install fonttools brotli
python3 - <<'PY'
from fontTools.ttLib import TTFont
import os
for name in os.listdir("assets/fonts-source"):
    if not name.lower().endswith((".ttf", ".otf")): continue
    font = TTFont(os.path.join("assets/fonts-source", name))
    font.flavor = "woff2"                       # WOFF2 = Brotli-compressed SFNT
    font.save(os.path.join("src/app/fonts", os.path.splitext(name)[0] + ".woff2"))
PY
```

Full conversion, **no subsetting**, on purpose: these faces drive display
headings whose text comes from the CMS and from product names, so trimming the
character set to today's copy would break tomorrow's. Sizes are small enough
that the trade is easy — Glora ≈ 6.1 KB/weight, KO Banzeen ≈ 14.5 KB/cut, total
143 KB → 80 KB raw. Measured with fontTools 4.65.0.
