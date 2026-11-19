---
name: Mannerbund
description: Everyday community life in deep teal, neon and cartography.
colors:
  bg: '#011a21'
  surface: '#01313f'
  raised: '#01414f'
  bronze: '#ff28b9'
  bronze-light: '#00dadb'
  text: '#e9ffff'
  muted: '#93d7dd'
  border: '#026276'
  focus: '#00dadb'
  map-canvas: '#012029'
  territory-panel: '#01313f'
typography:
  display:
    {
      fontFamily: 'Manrope, sans-serif',
      fontSize: '30px',
      fontWeight: 600,
      lineHeight: 1.3,
      letterSpacing: '-1px',
    }
  headline:
    {
      fontFamily: 'Manrope, sans-serif',
      fontSize: '20px',
      fontWeight: 600,
      lineHeight: 1.3,
      letterSpacing: '-0.4px',
    }
  title: { fontFamily: 'Manrope, sans-serif', fontSize: '16px', fontWeight: 600, lineHeight: 1.3 }
  body: { fontFamily: 'Manrope, sans-serif', fontSize: '14px', fontWeight: 400, lineHeight: 1.6 }
  label: { fontFamily: 'Manrope, sans-serif', fontSize: '12px', fontWeight: 400, lineHeight: 1.6 }
  button: { fontFamily: 'Manrope, sans-serif', fontSize: '13px', fontWeight: 600, lineHeight: 1.5 }
rounded:
  filter: '6px'
  field: '7px'
  control: '8px'
  compact-panel: '10px'
  panel: '12px'
  dialog: '14px'
  medallion: '50%'
spacing:
  xs: '4px'
  sm: '8px'
  md: '12px'
  lg: '16px'
  xl: '24px'
  xxl: '32px'
  section: '48px'
components:
  button-primary:
    {
      backgroundColor: '{colors.bronze}',
      textColor: '{colors.bg}',
      typography: '{typography.button}',
      rounded: '{rounded.control}',
      padding: '10px 16px',
    }
  button-secondary:
    {
      backgroundColor: '#012029',
      textColor: '{colors.text}',
      typography: '{typography.button}',
      rounded: '{rounded.control}',
      padding: '10px 16px',
    }
  button-ghost:
    {
      backgroundColor: 'transparent',
      textColor: '{colors.muted}',
      typography: '{typography.button}',
      rounded: '{rounded.control}',
      padding: '10px',
    }
  button-danger:
    {
      backgroundColor: '#3d0028',
      textColor: '{colors.text}',
      typography: '{typography.button}',
      rounded: '{rounded.control}',
      padding: '10px 16px',
    }
  search-field:
    {
      backgroundColor: '{colors.surface}',
      textColor: '{colors.text}',
      typography: '{typography.label}',
      rounded: '{rounded.control}',
      padding: '0 14px',
      height: '44px',
    }
  navigation-item:
    { textColor: '{colors.muted}', rounded: '{rounded.control}', padding: '11px 14px' }
  map-filter:
    {
      backgroundColor: 'transparent',
      textColor: '{colors.muted}',
      typography: '{typography.label}',
      rounded: '{rounded.filter}',
      padding: '10px 12px',
    }
  community-card:
    { backgroundColor: '{colors.surface}', textColor: '{colors.text}', rounded: '{rounded.panel}' }
---

# Design System: Mannerbund

## Overview

**Creative North Star: "Teal profundo, neon e cartografia"**

An everyday community app whose defining canvas is the territorial map. Deep teal surfaces, cyan cartographic details, magenta and neon-pink accents supply the night-time urban character; familiar controls and plain Portuguese keep the experience approachable.

The angular M in a six-sided seal anchors the identity. Subdued cover photography carries living community activity, while medallion trophies carry the ancient material. Community themes change accent, cover and emblem within a stable navigation and accessibility system.

**Key Characteristics:**

- Deep teal surfaces with restrained cyan emphasis and neon pink reserved for primary actions.
- Cartographic ownership reinforced by symbols and names.
- Compact Manrope typography and familiar, keyboard-accessible controls.
- Local artwork, subdued photography and explicitly identified demonstration content.

## Colors

Neon pink is the primary action accent; cyan carries links, focus and secondary emphasis; deep teal neutrals keep the map and community identity legible. Frontmatter records the actual CSS palette; `src/tokens.css` remains the implementation source.

### Primary

- **Rosa neon** (`bronze`): primary buttons, progress, active filter borders, notification dots and selected identity details.
- **Ciano** (`bronze-light`): emphasized links, active icons, focus and highlighted totals.
- **Magenta profundo** (`accent-deep`): pressed and destructive states.
- **Rosa de texto** (`accent-text`): small danger copy and error icons, lightened for AA contrast on teal surfaces.

### Neutral

- **Teal profundo** (`bg`, `surface`) and **Teal elevado** (`raised`): shell, cards and interactive tonal layers.
- **Quase branco ciano** (`text`) and **Ciano suave** (`muted`): primary content and supporting copy.
- **Borda teal** (`border`): thin dividers and control boundaries.
- **Cartographic Ground** (`map-canvas`) and **Territory Teal** (`territory-panel`): observed map and detail-panel surfaces, defined in `src/styles.css`.

**The Readable Accent Rule.** Preserve the raw community color in storage and the color editor. Derive visible seals, territorial overlays, dots and community emphasis with `accessibleAccent`: retain colors that reach 4.5:1 against the surface; otherwise blend toward the text color until they do. Invalid input falls back to neon pink. Never replace the stored choice with its derived ink.

## Typography

**Display Font / Body Font:** Manrope, with sans-serif fallback. Local font files supply weights 400, 500, 600 and 700; no serif or mono companion is used.

**Character:** Clear, compact and contemporary. Tight title tracking balances the deep teal surfaces and neon accents without adopting ornamental lettering. Text and icons carry meaning together.

- **Display:** base h1 follows the frontmatter display role; page headings typically use 28px, with map headings changing from 24–28px on desktop to 27px on mobile.
- **Headline / Title:** frontmatter roles serve section and component headings. Territory titles use 21–24px according to width.
- **Body:** frontmatter body is the baseline; supporting descriptions commonly use 12–13px with more generous leading.
- **Label:** essential territory facts, contenders, events, point-strip names, legends, map filters and map search stay at least 12px. Map-marker labels appear on selection, hover or keyboard focus. Auxiliary navigation captions and decorative map annotation retain smaller observed sizes.

**The Map Readability Rule.** Responsive compression must preserve the final 12px essential map labels and 44px map filters; do not restore the earlier compact overrides.

## Layout

Desktop uses a fixed sidebar, 65px top bar and flexible main area. The implemented base sidebar is 216px; the map detail column is 310px with a 24px gap. Page padding is generally 32px; the map uses 30px 28px 0. Content pages cap at 1440px.

- **1600px and above:** sidebar 232px; detail column 340px with a 30px gap and 36px map side padding.
- **1250px and below:** sidebar 190px; detail column 280px and gap 18px. At 1080px the detail column is 260px and gap 16px.
- **701–900px:** sidebar 170px; map and detail stack, with a two-column detail panel. Hide the redundant Local pill inside the demo toggle so the tablet sidebar stays contained.
- **700px and below:** replace the sidebar with five-item bottom navigation, a sticky 62px top bar and safe-area spacing. The map is 430px tall. Territory detail can open as a scrollable bottom panel capped at 65dvh. Chat switches between list and conversation.
- **901px and above:** the map fills the viewport below the top bar, with a 730px minimum main height; the detail panel scrolls internally. The final map-frame minimum is 360px.

Use the spacing scale for rhythm, with observed 18–30px adjustments where the responsive composition needs them. Filters and territory strips scroll horizontally inside their own bounds.

## Elevation & Depth

Depth primarily comes from tonal teal layers and thin borders. Resting cards stay flat. Shadows are structural: small medallion separation over the map, and stronger separation for floating feedback, dialogs and bottom panels. Do not add ambient glows or glass.

### Shadow Vocabulary

- **Map medallion:** `0 3px 8px #0005`.
- **Toast:** `0 8px 30px #0004`.
- **Demo panel:** `0 14px 60px #0008`.
- **Dialog:** `0 24px 100px #0009`; backdrop `#0d0f0cc9`.
- **Mobile territory panel:** `0 -12px 60px #0008`.
- **Conquest moment:** `0 12px 45px #0005`.

## Shapes

Controls are gently rounded; map filters and fields use slightly tighter corners. Panels and cards use the panel radius, compact mobile map surfaces use the compact-panel radius, and dialogs use the dialog radius before reducing to panel radius on mobile. Borders are generally 1px. Circular double-ring seals and medallions identify communities; the product mark alone uses the angular six-sided seal. Avoid decorative icon tiles and pill-shaped content cards.

## Components

### Buttons

Familiar and restrained. The base button has a 44px minimum height, 9px icon gap and frontmatter padding. Primary uses neon pink with deep-teal ink; hover lightens it to `#ff5cc8`. Secondary has a teal border and lightens on hover. Ghost starts transparent and gains a surface fill. Danger uses a deep magenta surface with light text. Disabled buttons reduce opacity to 0.45. Some secondary mobile controls have smaller observed dimensions; the 44px map-filter and primary map-action floors remain binding.

### Chips

Map filters are gently squared outlined buttons with 44px minimum height. Selected filters use a deep teal fill, cyan text and a neon-pink border. They remain horizontally scrollable; the community select follows available width.

### Cards / Containers

Community cards use raised teal, clipped rounded corners and 20px content padding. Subdued photographic covers use saturation 0.7. Their hover changes tone without adding shadow. Territory sections use dividers and 22px base padding rather than nested decorative cards.

### Inputs / Fields

Fields have a dark fill, thin teal stroke, 44px minimum height and 11px 13px padding. Search is a distinct 44px flex control with an inline icon. General keyboard focus uses a 2px cyan outline at 4px offset; search uses a 1px outline around its container at 2px offset. Keep visible labels, recovery text and keyboard operation.

### Navigation

Desktop items have a 46px minimum height, muted ink and a subtle teal hover. Active items gain a raised teal fill, light text and cyan icons. Mobile navigation keeps five labeled destinations with 46px minimum item height and safe-area padding.

### Territory medallions and conquest feedback

Double-ring medallions use the derived community accent, a small structural shadow and a selected filled state. Hover lifts them 3px; labels appear on selection, hover and focus. Map-radius outlines encode the actual geofence. State transitions generally last 180ms; trophy-image hover uses 300ms. The authored conquest arrival lasts 600ms with `cubic-bezier(0.16, 1, 0.3, 1)`; selected-point map travel lasts 900ms. Reduced motion removes travel and conquest animation and collapses CSS transitions.

## Do's and Don'ts

### Do:

- **Do** reserve neon pink for primary actions, alerts and selected states; use cyan for links, focus and supporting emphasis.
- **Do** reinforce ownership with names and emblems as well as color.
- **Do** preserve raw community accents and derive readable display ink.
- **Do** retain 12px essential map metadata, 44px map filters and visible keyboard focus at every width.
- **Do** use local artwork, subdued community photography and honest demonstration labels.

### Don't:

- **Don't** introduce panel gradients, glass, glows or decorative icon tiles.
- **Don't** trade familiar controls or plain Portuguese for ornamental lore.
- **Don't** turn the app canvas into a landing-page hero or decorative KPI grid.
- **Don't** squeeze desktop chat columns or the Local pill into narrow layouts.
