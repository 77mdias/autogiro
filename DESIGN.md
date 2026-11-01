---
version: alpha
name: facilitador-de-pagamentos-para-empresas-uvvipay-design-analysis
description: Uvvipay's design language uses a near-white canvas (#ffffff) paired with near-black text (#000000) and a saturated primary accent (#0e9389). Typography centers on Inter with JetBrains Mono as a secondary face. The overall voice is clean and minimal.

colors:
  primary: "#0e9389"
  on-primary: "#ffffff"
  ink: "#000000"
  ink-soft: "#101010"
  body: "#d6d6d6"
  body-mid: "#d3d3d3"
  mute: "#a3a3a3"
  canvas: "#ffffff"
  canvas-soft: "#f0fdfa"

typography:
  display-xl:
    fontFamily: system-ui, sans-serif
    fontSize: 52px
    fontWeight: 400
    lineHeight: 65px
    letterSpacing: -0.03em
  display-lg:
    fontFamily: system-ui, sans-serif
    fontSize: 42px
    fontWeight: 500
    lineHeight: 53px
    letterSpacing: -0.03em
  display-md:
    fontFamily: system-ui, sans-serif
    fontSize: 32px
    fontWeight: 600
    lineHeight: 40px
    letterSpacing: -0.03em
  display-sub-lg:
    fontFamily: system-ui, sans-serif
    fontSize: 18px
    fontWeight: 700
    lineHeight: 23px
  display-sub-md:
    fontFamily: system-ui, sans-serif
    fontSize: 17px
    fontWeight: 700
    lineHeight: 21px
  display-sub-sm:
    fontFamily: system-ui, sans-serif
    fontSize: 16px
    fontWeight: 700
    lineHeight: 20px
  body-lg:
    fontFamily: system-ui, sans-serif
    fontSize: 15px
    fontWeight: 700
    lineHeight: 19px
  body-md:
    fontFamily: system-ui, sans-serif
    fontSize: 14px
    fontWeight: 700
    lineHeight: 18px
  body-sm:
    fontFamily: system-ui, sans-serif
    fontSize: 13px
    fontWeight: 700
    lineHeight: 16px
  caption:
    fontFamily: system-ui, sans-serif
    fontSize: 12px
    fontWeight: 700
    lineHeight: 15px

rounded:
  none: 0px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 50px
  pill: 9999px

spacing:
  xxs: 2px
  xs: 4px
  sm: 5px
  md: 6px
  lg: 7px
  xl: 8px
  2xl: 10px
  3xl: 12px
  4xl: 13px

components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button-md}"
    rounded: "{rounded.md}"
    padding: "6px 8px"
  button-secondary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button-md}"
    rounded: "{rounded.md}"
    padding: "6px 8px"
  button-tertiary:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    borderColor: "{colors.ink}"
    typography: "{typography.button-md}"
    rounded: "{rounded.md}"
    padding: "6px 8px"
  card:
    backgroundColor: "{colors.canvas-soft}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "8px"
  nav-bar:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    padding: "6px 8px"
  text-input:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    borderColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.sm}"
    padding: "6px 7px"
  footer:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.canvas-soft}"
    typography: "{typography.body-sm}"
    padding: "12px 8px"
---

## Overview

Uvvipay's design language uses a near-white canvas (#ffffff) paired with near-black text (#000000) and a saturated primary accent (#0e9389). Typography centers on Inter with JetBrains Mono as a secondary face. The overall voice is clean and minimal.

**Key Characteristics:**

- A `primary` color `{colors.primary}` (`#0e9389`)
- A `on-primary` color `{colors.on-primary}` (`#ffffff`)
- A `ink` color `{colors.ink}` (`#000000`)
- A `ink-soft` color `{colors.ink-soft}` (`#101010`)
- A `body` color `{colors.body}` (`#d6d6d6`)
- A `body-mid` color `{colors.body-mid}` (`#d3d3d3`)
- A `mute` color `{colors.mute}` (`#a3a3a3`)
- A `canvas` color `{colors.canvas}` (`#ffffff`)
- A `canvas-soft` color `{colors.canvas-soft}` (`#f0fdfa`)

## Colors

### Brand & Accent

- **primary** (`{colors.primary}` — `#0e9389`): The brand accent. Use for CTAs, links, and interactive highlights.
- **on-primary** (`{colors.on-primary}` — `#ffffff`): Text/icon color on top of the primary accent. Ensures contrast.

### Surface

- **canvas** (`{colors.canvas}` — `#ffffff`): Main page background — near-white.
- **canvas-soft** (`{colors.canvas-soft}` — `#f0fdfa`): Tinted card/section background — creates subtle depth.

### Text

- **ink** (`{colors.ink}` — `#000000`): Primary text color — deep near-black.
- **ink-soft** (`{colors.ink-soft}` — `#101010`): Near-ink — headings and strong emphasis.
- **body** (`{colors.body}` — `#d6d6d6`): Default body text color.
- **body-mid** (`{colors.body-mid}` — `#d3d3d3`): Secondary body / metadata.
- **mute** (`{colors.mute}` — `#a3a3a3`): Lowest-priority text — fine print, placeholders, captions.

## Typography

### Font Families

1. **Inter** — Primary / display face
2. **JetBrains Mono** — Secondary / body face
3. **Inter Placeholder** — Tertiary face
4. **JetBrains Mono Placeholder** — Tertiary face

### Type Scale

| Token                         | Size | Weight | Line Height | Letter Spacing | Use                   |
| ----------------------------- | ---- | ------ | ----------- | -------------- | --------------------- |
| `{typography.display-xl}`     | 52px | 400    | 65px        | -0.03em        | Hero headline         |
| `{typography.display-lg}`     | 42px | 500    | 53px        | -0.03em        | Section display       |
| `{typography.display-md}`     | 32px | 600    | 40px        | -0.03em        | Sub-section heading   |
| `{typography.display-sub-lg}` | 18px | 700    | 23px        | 0              | Large sub-display     |
| `{typography.display-sub-md}` | 17px | 700    | 21px        | 0              | Card title            |
| `{typography.display-sub-sm}` | 16px | 700    | 20px        | 0              | Small card title      |
| `{typography.body-lg}`        | 15px | 700    | 19px        | 0              | Lead paragraph        |
| `{typography.body-md}`        | 14px | 700    | 18px        | 0              | Default body          |
| `{typography.body-sm}`        | 13px | 700    | 16px        | 0              | Secondary body        |
| `{typography.caption}`        | 12px | 700    | 15px        | 0              | Fine print / metadata |

### Principles

- Build hierarchy using the type scale — don't set arbitrary font sizes.
- Use heavier weights (600–700) only for buttons and emphasis, not for body text.
- Sentence-case headlines; all-caps only for eyebrow / label tokens.

## Layout

### Spacing System

`{spacing.xxs}` 2px · `{spacing.xs}` 4px · `{spacing.sm}` 5px · `{spacing.md}` 6px · `{spacing.lg}` 7px · `{spacing.xl}` 8px · `{spacing.2xl}` 10px · `{spacing.3xl}` 12px · `{spacing.4xl}` 13px

### Grid & Container

Marketing container max-width ~1280px centered with gutters. Hero sections split at desktop; grids collapse to 1-column at mobile.

### Responsive Breakpoints

| Name    | Width      | Key Changes                                 |
| ------- | ---------- | ------------------------------------------- |
| Mobile  | < 768px    | Hero stacks; grids 1-up; hamburger nav      |
| Tablet  | 768–1023px | 2-up grids; nav visible                     |
| Desktop | ≥ 1024px   | Full grids; hero split; max-width container |

## Elevation & Depth

| Level               | Treatment                                                  | Use                          |
| ------------------- | ---------------------------------------------------------- | ---------------------------- |
| Level 0 — Flat      | No shadow, no border                                       | Hero / full-bleed bands      |
| Level 1 — Hairline  | 1px solid `{colors.mute}` border                           | Card chrome, outline buttons |
| Level 2 — Soft Card | `{colors.canvas-soft}` fill against `{colors.canvas}` page | Default content cards        |
| Level 3 — Raised    | Box shadow, 4px blur                                       | Modals, dropdowns            |

## Shapes

### Border Radius Scale

| Token            | Value  | Use                         |
| ---------------- | ------ | --------------------------- |
| `{rounded.none}` | 0px    | Full-bleed bands            |
| `{rounded.sm}`   | 8px    | Inputs, inline pills        |
| `{rounded.md}`   | 12px   | Buttons and cards           |
| `{rounded.lg}`   | 16px   | Large surfaces              |
| `{rounded.xl}`   | 50px   | General                     |
| `{rounded.pill}` | 9999px | Status badges, rounded CTAs |

## Components

**`button-primary`**

- backgroundColor: `{colors.primary}`
- textColor: `{colors.on-primary}`
- typography: `{typography.button-md}`
- rounded: `{rounded.md}`
- padding: `6px 8px`

**`button-secondary`**

- backgroundColor: `{colors.ink}`
- textColor: `{colors.on-primary}`
- typography: `{typography.button-md}`
- rounded: `{rounded.md}`
- padding: `6px 8px`

**`button-tertiary`**

- backgroundColor: `{colors.canvas}`
- textColor: `{colors.ink}`
- borderColor: `{colors.ink}`
- typography: `{typography.button-md}`
- rounded: `{rounded.md}`
- padding: `6px 8px`

**`card`**

- backgroundColor: `{colors.canvas-soft}`
- textColor: `{colors.ink}`
- rounded: `{rounded.md}`
- padding: `8px`

**`nav-bar`**

- backgroundColor: `{colors.canvas}`
- textColor: `{colors.ink}`
- typography: `{typography.body-sm}`
- padding: `6px 8px`

**`text-input`**

- backgroundColor: `{colors.canvas}`
- textColor: `{colors.ink}`
- borderColor: `{colors.ink}`
- typography: `{typography.body-md}`
- rounded: `{rounded.sm}`
- padding: `6px 7px`

**`footer`**

- backgroundColor: `{colors.ink}`
- textColor: `{colors.canvas-soft}`
- typography: `{typography.body-sm}`
- padding: `12px 8px`

## Do's and Don'ts

### Do

- Reserve `#0e9389` for every primary CTA and conversion target
- Keep the canvas at `#ffffff` — maintain brand-accurate background temperature
- Use the defined type scale to build hierarchy — don't mix arbitrary font sizes
- Apply `12px` radius consistently to buttons and cards
- Maintain the spacing scale — don't introduce ad-hoc pixel values
- Pair primary accent with ink-dark text on light surfaces

### Don't

- Don't replace the canvas color with pure white — the exact shade is intentional
- Don't use pure black — `#000000` carries the brand's ink character
- Don't introduce a second chromatic accent color
- Don't set display headlines in weights lighter than 500
- Don't deviate from the border-radius scale
- Don't use font sizes outside the defined type scale
