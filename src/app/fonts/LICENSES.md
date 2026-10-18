# Local web fonts

All fonts here are self-hosted so production builds never depend on the Google
Fonts network. Delivery format is **WOFF2** — the raw TTF/OTF sources are kept
in [`assets/fonts-source/`](../../../assets/fonts-source/) (outside the
delivery path, so they are never served or bundled) for future edits.

## Fontsource subsets (SIL Open Font License 1.1)

Subsetted from Fontsource 5.3.0 packages.

- **IBM Plex Sans Arabic**: Copyright 2019 IBM Corp.; SIL Open Font License 1.1.
- **IBM Plex Mono**: Copyright 2017 IBM Corp.; SIL Open Font License 1.1.
- **Noto Kufi Arabic** (600/700): Copyright The Noto Project Authors; SIL Open Font License 1.1.
- **Manrope** (400–700): Copyright 2018 The Manrope Project Authors; SIL Open Font License 1.1.
- **Bricolage Grotesque** (600/700): Copyright 2022 The Bricolage Grotesque Project Authors; SIL Open Font License 1.1.

The full SIL Open Font License text is available at https://scripts.sil.org/OFL.

## Retired faces (2026-10-18, Nile Glass redesign)

KO Banzeen and Glora were removed from the delivery path: neither carried an OFL grant (Banzeen: "don't redistribute", Glora: no licence
record) and the repository is public. They are no longer referenced by any CSS or `next/font/local` call and their woff2 files were deleted.
The display role is now Noto Kufi Arabic (Arabic) and Bricolage Grotesque (Latin), both OFL. Montserrat was deleted as unused.
If the owner obtains written web-use rights for the old brand faces they can be restored from git history (`9df98f7`).
