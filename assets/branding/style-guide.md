# mmmh Brand Style Guide

## Logo

The mmmh logo uses custom bubble-letter typography spelling "MMMH".

- **Full logo**: `logo-full.png` — horizontal text logo (transparent background)
- **Logo mark**: `logo-mark.png` — logo on cream background (for app icon contexts)
- **SVG source**: `mmmh-logo.svg`

### Usage Rules

- Minimum clear space: equal to the height of one letter on all sides
- Always display on cream (#fff8e7) or white (#FFFEFA) backgrounds
- Do not stretch, rotate, or alter colors of the logo

## Color Palette

Three core colors plus grey accents.

| Name       | Hex       | Usage                                    |
| ---------- | --------- | ---------------------------------------- |
| Cream      | `#fff8e7` | App background                           |
| White      | `#FFFEFA` | Cards, containers, surfaces              |
| Dark       | `#1A1A1D` | Text, borders, accents, active tab icons |
| Grey       | `#6B7280` | Muted/secondary text                     |
| Grey Light | `#9CA3AF` | Placeholders, inactive tab icons         |

### Semantic Colors

| Name    | Hex       | Usage                          |
| ------- | --------- | ------------------------------ |
| Success | `#22C55E` | Confirmations, positive states |
| Warning | `#F59E0B` | Alerts, caution states         |
| Error   | `#EF4444` | Errors, destructive actions    |
| Info    | `#3B82F6` | Informational highlights       |

## Typography

### Fonts

| Role   | Font     | Usage                                                    |
| ------ | -------- | -------------------------------------------------------- |
| Script | Overlock | Headers, titles, section names, buttons with personality |
| Sans   | Shanti   | Body text, labels, captions, form inputs                 |

### Scale

| Token | Size | Usage              |
| ----- | ---- | ------------------ |
| xs    | 12px | Captions           |
| sm    | 14px | Small body, labels |
| base  | 16px | Body text, buttons |
| lg    | 18px | Section titles     |
| xl    | 20px | Titles             |
| 2xl   | 24px | Headers            |
| 3xl   | 32px | Large headers (h1) |

### Weights

| Token    | Weight |
| -------- | ------ |
| normal   | 400    |
| medium   | 500    |
| semibold | 600    |
| bold     | 700    |

## App Icon

- **iOS**: 1024x1024px, no transparency, no rounded corners (system applies them)
- **Android**: Adaptive icon with transparent foreground (432x432px) and cream background
- Icon concept: MMMH bubble-letter logo centered on cream background

## Splash Screen

- Static: cream background with centered MMMH logo (1284x2778px)
- Animated: Phase 1 (repeated logos) crossfades to Phase 2 ("Bienvenue sur mmmh / Bon appetit!")

## Accessibility

- Dark text (#1A1A1D) on Cream (#fff8e7): contrast ratio ~16.5:1 (WCAG AAA)
- Dark text (#1A1A1D) on White (#FFFEFA): contrast ratio ~17.5:1 (WCAG AAA)
- Grey (#6B7280) on Cream (#fff8e7): contrast ratio ~4.8:1 (WCAG AA)
- Logo is recognizable in grayscale (black outlines with white fills)
