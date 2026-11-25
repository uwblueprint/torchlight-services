# Torchlight visual references

This directory records the supplied design references and the semantic tokens used by
the web app. The reference screenshots are source material, not application assets.

## Color tokens

The UI palette is defined once in `frontend/src/app/globals.css` under `:root` as
`--color-*` variables. Components should use those variables instead of repeating hex
values.

| Group | Token | Value | Use |
|---|---|---|---|
| Background | `--color-bg-page` | `#F6F6F6` | App/page background |
| Background | `--color-bg-card` | `#FFFFFF` | Cards, panels, popovers |
| Background | `--color-bg-field` | `#F6F6F6` | Inputs and quiet fields |
| Background | `--color-bg-chip` | `#F3F3F3` | Badges and chips |
| Background | `--color-bg-muted` | `#F2F2F2` | Panel headers and muted surfaces |
| Background | `--color-bg-button-secondary` | `#EBEBEB` | Secondary buttons |
| Background | `--color-bg-dark` | `#18181B` | Dark inverse surfaces |
| Border | `--color-border-default` | `#F0F0F0` | Default dividers and outlines |
| Border | `--color-border-strong` | `#E4E4E7` | Inputs and stronger outlines |
| Border | `--color-border-dashed` | `#D4D4D8` | Dashed placeholders |
| Text | `--color-text-primary` | `#18181B` | Headings and primary text |
| Text | `--color-text-body` | `#3F3F46` | Body copy |
| Text | `--color-text-secondary` | `#71717A` | Supporting text |
| Text | `--color-text-tertiary` | `#A1A1AA` | Disabled and faint text |
| Text | `--color-text-inverse` | `#FFFFFF` | Text on dark/brand surfaces |
| Brand | `--color-brand-primary` | `#2563EB` | Primary actions and links |
| Brand | `--color-brand-pressed` | `#1D4ED8` | Pressed/hover primary |
| Brand | `--color-brand-soft` | `#EAF0FE` | Soft brand fill |
| Status | `--color-status-success` | `#7CB48E` | Success accent |
| Status | `--color-status-success-text` | `#3D7A2C` | Success text |
| Status | `--color-status-success-bg` | `#EAF5E7` | Success background |
| Status | `--color-status-danger` | `#D92D20` | Danger accent |
| Status | `--color-status-danger-text` | `#B42318` | Danger text |
| Status | `--color-status-danger-bg` | `#FDECEC` | Danger background |
| Status | `--color-status-warning` | `#D98A0B` | Warning accent |
| Status | `--color-status-warning-text` | `#93500A` | Warning text |
| Status | `--color-status-warning-bg` | `#FDF3E3` | Warning background |
| Status | `--color-status-info` | `#1D4ED8` | Informational accent |
| Status | `--color-status-info-bg` | `#EAF0FE` | Informational background |

The logo's blue, orange, red, and yellow are artwork colors. They are not UI action
colors; buttons and links use the brand tokens above.

## Assets

- `frontend/public/brand/torchlight-mark.png` — flame mark, 878 × 1114, transparent
  background. Used in the portal and map headers.
- `frontend/src/app/favicon.ico` — tab icon generated from the flame mark at 16, 32,
  48, and 64 px. Regenerate it if the mark changes.
- `frontend/public/brand/torchlight-services-logo.png` — full Torchlight Services
  wordmark, 1676 × 788, white background. Reserved for larger brand placements.
- `docs/design/reference/color-tokens.png` — supplied color-system reference.
- `docs/design/reference/brand-sheet.png` — supplied logo and palette moodboard.

The reference screenshots include Figma/Flaticon UI that is not part of the Torchlight
brand. Use only the logo artwork and the palette; do not copy the surrounding interface.

The PNGs are supplied reference exports. Replace them with official vector assets when
Torchlight provides them, and keep the public asset filenames stable so the app does not
need another change.
