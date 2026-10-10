---
name: Asman Universiteti ilmiy maqolalari (Avtomaqola)
description: University portal where teachers publish scholarly articles; quiet lapis-on-paper academic surfaces, Literata headings over Onest UI.
colors:
  lapis: "#1f3c8f"
  lapis-deep: "#172d6c"
  on-lapis: "#ffffff"
  tile: "#0f7b83"
  tile-soft: "#e3f3f2"
  mist: "#f1f4f9"
  paper: "#ffffff"
  ink: "#15213b"
  muted: "#5a6478"
  line: "#d6dde8"
  input-border: "#7d889b"
  danger: "#b42318"
  danger-soft: "#fdecea"
  telegram: "#1a73a8"
  orcid: "#a6ce39"
  logo-navy: "#0b1d3a"
typography:
  display:
    fontFamily: "Literata, Georgia, serif"
    fontSize: "clamp(2.5rem, min(4.6vw, 9svh), 5rem)"
    fontWeight: 600
    lineHeight: 1.04
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Literata, Georgia, serif"
    fontSize: "2.25rem"
    fontWeight: 600
    lineHeight: 1.11
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Literata, Georgia, serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.4
  card-title:
    fontFamily: "Literata, Georgia, serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.375
  numeral:
    fontFamily: "Literata, Georgia, serif"
    fontSize: "1.875rem"
    fontWeight: 600
    lineHeight: 1.2
    fontFeature: "\"tnum\""
  body:
    fontFamily: "Onest, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  lead:
    fontFamily: "Onest, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.625
  button:
    fontFamily: "Onest, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 500
    lineHeight: 1.25rem
  label:
    fontFamily: "Onest, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.25rem
  caption:
    fontFamily: "Onest, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1rem
rounded:
  control: "8px"
  card: "12px"
  dialog: "16px"
  pill: "9999px"
spacing:
  tight: "8px"
  group: "12px"
  card: "16px"
  card-lg: "20px"
  stack: "20px"
  block: "32px"
  page: "40px"
  section: "48px"
components:
  button-primary:
    backgroundColor: "{colors.lapis}"
    textColor: "{colors.on-lapis}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "10px 16px"
    height: "42px"
  button-primary-hover:
    backgroundColor: "{colors.lapis-deep}"
    textColor: "{colors.on-lapis}"
  button-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "10px 16px"
    height: "42px"
  button-ghost:
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "10px 16px"
    height: "42px"
  button-lg:
    rounded: "{rounded.control}"
    padding: "13px 22px"
    height: "48px"
  button-telegram:
    backgroundColor: "{colors.telegram}"
    textColor: "{colors.paper}"
    rounded: "{rounded.control}"
    padding: "10px 16px"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "10px 12px"
    height: "46px"
  card:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.card}"
    padding: "16px"
  card-side-panel:
    backgroundColor: "{colors.mist}"
    width: "128px"
    padding: "16px"
  chip-status:
    backgroundColor: "{colors.paper}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    padding: "2px 10px"
  filter-pill:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "8px 16px"
  filter-pill-active:
    backgroundColor: "{colors.lapis}"
    textColor: "{colors.on-lapis}"
  nav-link:
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "10px 8px"
  nav-link-active:
    backgroundColor: "{colors.mist}"
    textColor: "{colors.ink}"
  dialog:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.dialog}"
    padding: "24px"
---

# Design System: Asman Universiteti ilmiy maqolalari (Avtomaqola)

## Overview

**Creative North Star: "The University Notice Board, Ruled in Lapis"**

The portal reads like a well-kept academic register: paper cards on a cool mist ground, one lapis voice for every action and every emphasis numeral, serif headings that give scholarly weight, and a plain sans for everything the user has to operate. Density is moderate and calm. Structure comes from 1px hairlines and generous whitespace, not from fills, shadows or colour. The palette's names come from Samarkand tilework: lojuvard (lapis) for the brand and turquoise tile (firuza) for focus and success.

The home landing (`src/app/page.tsx`, `src/components/home/**`) is the reference grammar and is frozen. It alone carries atmosphere: the sky gradient, the tile horizon line, the rising and floating logo, the blurred sticky header and scroll-driven reveal motion. Every other surface (public pages, "Kabinet", "Moderator paneli", "Admin panel", auth, 404) speaks the landing's grammar without its decoration: same header, same width, same card, same buttons. The owner's taste is minimal text and no excess decoration (gradients, glow, many colours); the ratings block ("Iqtiboslar") was rebuilt to that taste and now sits inside the article column as a plain list.

Both themes are first-class. `<html data-theme>` is set before paint from the saved choice or the system preference; every token has a dark value, and the official logo switches from its navy to `ink` in dark mode.

**Key Characteristics:**
- One accent: lapis for actions, links, current state and emphasis numerals; tile only for focus, success and landing decoration.
- Literata for headings, card titles and numerals; Onest for body, UI, buttons, labels and chips.
- Borders, not shadows: hairline `line` edges on paper; shadows only on floating menus and the chart tooltip.
- One width (`PUBLIC_WIDTH`) and one header grammar across public and signed-in surfaces.
- Status is always text plus tone, never colour alone.
- Motion is feedback only outside the frozen landing.

## Colors

A cool, near-monochrome slate system with a single deep blue accent and a teal used sparingly for focus and success.

### Primary
- **Lojuvard Lapis** (lapis): the pinned brand colour. Primary buttons, links (`.link`), the active filter pill, filled stars, the editor's current step, the landing's final step marker, emphasis numerals such as "6-maqola", hover text on clickable titles. Dark theme: `#8fb0ff`.
- **Deep Lapis** (lapis-deep): hover state of every lapis fill. Dark theme: `#b8ccff`.
- **On Lapis** (on-lapis): text and icons on lapis fills. Dark theme flips to the night ground `#0d1424`.

### Secondary
- **Firuza Tile** (tile): the global focus ring, the input focus border and halo, success and "published" chips, inline success messages, the landing's horizon line and avatar initials. Dark theme: `#4fc2c0`.
- **Tile Wash** (tile-soft): text selection, the avatar initials disc, small success icon wells. Dark theme: `#12302f`.

### Neutral
- **Mist Ground** (mist): page background, card side panels (issue number column), active nav background, hover background of menu rows. Dark: `#0d1424`.
- **Paper** (paper): every surface that holds content: headers, footers, cards, dialogs, inputs, chips. Dark: `#141d31`.
- **Ink** (ink): body and heading text. Dark: `#e6ebf5`.
- **Muted Slate** (muted): meta lines (dates, bylines, "3-son"), table headers, footer links, empty-state sentences. Dark: `#9aa6bd`.
- **Hairline** (line): card edges, header and footer rules, list dividers, table rules, secondary-button borders, unchecked step rings. Decorative only (1.37:1 on paper). Dark: `#2a3650`.
- **Field Edge** (input-border): the 3:1 boundary of inputs and empty stars (WCAG 1.4.11 on paper and mist). Dark: `#5d6b87`.

### State and brand marks
- **Danger** (danger) / **Danger Wash** (danger-soft): validation text, destructive action text, alert boxes (`danger-soft` fill, `danger` text). Dark: `#ff8a80` / `#3a1714`.
- **Telegram** (telegram): the Telegram code button only; darkened from Telegram's own blue to reach 5.2:1 with white. Same in both themes.
- **ORCID Green** (orcid): the ORCID iD icon only.
- **Asman Navy** (logo-navy): the official logo and Asman mark in light theme only; pinned, never used elsewhere.

### Named Rules
**The One Voice Rule.** Lapis is the only accent. Any other hue on a screen must mean a state (success, danger) or a third-party mark (Telegram, ORCID). No new decorative colours.

**The Tile Is Not a Highlight Rule.** Tile signals focus and success. It does not decorate app surfaces; its decorative uses (sky glow, horizon line) belong to the frozen landing.

## Typography

**Display Font:** Literata (opsz axis, with Georgia, serif)
**Body Font:** Onest (with system-ui, sans-serif)

**Character:** A bookish optical-size serif for everything that names or counts (titles, card headings, statistics), paired with a clear geometric-humanist sans for everything that is operated. Both self-hosted with Latin preloaded and Cyrillic / Latin-extended loaded on demand.

### Hierarchy
- **Display** (Literata 600, fluid to 5rem, line-height 1.04, -0.02em): the landing hero h1 only.
- **Headline** (Literata 600, 1.875rem below 640px and 2.25rem from 640px, tracking-tight): every page h1 (public, cabinet, admin, moderator, 404, article and news titles) and the landing's section h2s. `text-balance` on public pages.
- **Title** (Literata 600, 1.25rem): section h2s inside cabinet and staff pages, drawer and dialog titles. Panel and article-page section headings step down to 1.125rem.
- **Card title** (Literata 600, 1.125rem, leading-snug): article, author and news titles in cards and lists; the brand name in `SiteBrand`.
- **Numeral** (Literata 600, 1.875rem, tabular): stat values (landing stats, admin `Stats`); 1.25rem for secondary stats; issue sequence ("12-maqola") in lapis at 0.875–1rem.
- **Body** (Onest 400, 1rem, 1.5): UI text and all inputs (16px so iOS does not zoom).
- **Lead** (Onest 400, 1.125rem, leading-relaxed): page leads and long reading text, capped at 34em (`haqida`, news body).
- **Button** (Onest 500, 0.9375rem / 1.25rem): all `.btn` labels and header nav.
- **Label** (Onest 400–500, 0.875rem): meta lines, form labels, table cells, helper and error text, footer links, menu rows.
- **Caption** (Onest 500, 0.75rem): status chips, table headers, the footer copyright line.

### Named Rules
**The Serif Names, Sans Operates Rule.** Literata is for headings, titles and numbers; never for buttons, labels, chips or form text.

**The Title Is the Largest Rule.** On public article pages the article h1 is the largest text; `SiteBrand` stays a link at card-title size, never a heading (Google Scholar reads titles from the page).

## Layout

One container for every surface: `PUBLIC_WIDTH` = centred, 90% wide on phones and tablets, 70% from 1280px, 60% from 1536px (the owner's 15–20% side margins). Header, page content and footer share it, so the brand and the content's left edge stay on one line. Exception: wide work surfaces (the article editor) pass `wide` to `DashboardShell`, which switches header and main to full width with 16/24/40px side padding.

Reading content inside the container is capped: prose and article columns at 48rem (`max-w-3xl`), reading paragraphs at 34em. Forms are capped at about 36rem.

Page rhythm: main area padded 40px top and bottom; 32px from the title block to the first content; 48px between sections inside a page; 20px between form fields; 16px between cards in a grid. Landing sections use 64px (96px from 1024px) and are landing-only.

Responsive: article and author cards go from one to two columns at 1024px. Header nav collapses into a "☰" `details` menu below 1024px; "Kirish" stays visible from 640px. Tables never widen the page; they scroll inside their own keyboard-focusable frame.

### Named Rules
**The One Edge Rule.** Every non-landing surface uses `PUBLIC_WIDTH`. Do not introduce new `max-w-*` page containers; cap content inside the container instead.

## Elevation & Depth

The system is flat. Depth comes from the mist ground versus paper surfaces and from 1px hairlines. Hover on a card changes its border to lapis at 50%, not its height. Shadows appear only on floating elements that overlap content.

### Shadow Vocabulary
- **Floating menu** (`box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)`, Tailwind `shadow-lg`; the user menu tints it to `ink/5`): the "☰" menu, language menu and user menu.
- **Tooltip** (Tailwind `shadow-md`): the admin bar-chart tooltip.
- **Scrim**: modal dialogs dim the page with `ink` at 50%; the admin article drawer uses 40%.

### Named Rules
**The Hairline Rule.** Separate with a 1px `line` border or divider, not with a shadow or a fill.

**The Paper Bar Rule.** The sticky bottom action bar of long forms (editor, profile, news) is the one translucent app surface: paper (mist on phones) at 95% with backdrop blur, top border, 12px radius from 640px.

## Shapes

Gently rounded, never pill-shaped except for things that are labels or identities.
- **Controls** (8px): buttons, inputs, menu rows, notices, code blocks, radio choice cards.
- **Cards** (12px): content cards, menus, the sticky action bar. Tables and row lists have no radius (top and bottom rules only).
- **Dialogs** (16px): modal dialogs, the auth card. Side drawers are full-height and square.
- **Full**: avatars, status chips, filter pills, the user-menu trigger, step markers.

Images in news cards use 6px. Icons are inline SVG, 2px stroke, round caps, 16–20px.

## Components

### Buttons
Plain and confident; one lapis button per decision.
- **Shape:** 8px radius, 1px border (transparent unless secondary), 42px tall; `btn-lg` 48px for hero and decisive actions.
- **Primary:** lapis fill, on-lapis text; hover deep lapis. 150ms colour transitions.
- **Secondary:** paper fill, hairline border, ink text; hover darkens the border to muted. Used for "Kirish", pagination, close buttons in drawers.
- **Ghost:** no fill; hover is ink at 7%. Header nav links and icon buttons (theme toggle, "☰").
- **Telegram:** Telegram blue, white text, hover `#155f8b`.
- **Busy and disabled:** `aria-disabled="true"` keeps focus on busy buttons; disabled renders at 55% opacity with a not-allowed cursor.

### Chips
- **Style:** one shape for all statuses: full radius, 1px border at 40% of the tone, paper fill, 12px medium text, 2px × 10px padding.
- **Tones:** neutral (draft, roles: line border, muted text), lapis (submitted / in progress), tile (published / success), danger (rejected / error). Colour always paired with the word (`StatusChip`).

### Filter pills
- **Style:** full radius, hairline border on paper, 14px medium label with a muted tabular count; hover border lapis.
- **Active:** filled lapis with on-lapis text, `aria-current="true"`. Shared by "Maqolalarim" and admin "Maqolalar".

### Cards / Containers
- **Corner Style:** 12px.
- **Background:** paper on the mist ground.
- **Shadow Strategy:** none (see Elevation & Depth).
- **Border:** 1px `line`; clickable cards turn `lapis` at 50% on hover.
- **Clickable card:** only the title is a link, stretched over the card with an `::after` layer; the focus ring is drawn around the whole card (2px tile outline, offset 2px), the link's own outline suppressed.
- **Article card:** a 128px mist side panel with "N-son" (muted caption) and "N-maqola" (lapis serif numeral), then date, serif title, two-line muted byline and venue. 16px padding, 20px from 640px. Same recipe for authors.
- **Internal Padding:** 16–20px for list cards; 24–32px for the auth card and dialogs.

### Lists and tables
- **Row list:** no box; top and bottom hairlines with dividers between rows, 16px row padding. Title in medium ink (hover lapis); meta in muted 14px; status chip and tabular date aligned right from 640px. Used by "Maqolalarim", the review queue, moderator and admin lists.
- **Table:** same frame (top and bottom rules only), 14px cells, 12px medium muted headers, numeric columns right-aligned and tabular, zeros muted.
- **Empty state:** a single muted sentence ("Hali maqola yo‘q."), no box, no illustration.

### Inputs / Fields
- **Style:** paper fill, 1px `input-border`, 8px radius, 16px text, 10px × 12px padding (46px tall).
- **Focus:** border turns tile with a 3px tile halo at 25%.
- **Error / Disabled:** `aria-invalid` turns the border danger with a danger message below; disabled at 60% opacity.
- **Checkbox / radio:** lapis accent; radio choice cards are 8px bordered rows that turn lapis-bordered with a 5% lapis wash when checked.

### Navigation
- **Header (every surface):** paper, bottom hairline, 72px. `SiteBrand` (40px Asman mark, Literata university name, muted tagline) on the left. Public pages: five sections as ghost buttons ("Maqolalar", "Mualliflar", "Yo‘nalishlar", "Yangiliklar", "Portal haqida"), theme toggle, "Kirish" secondary. Active section: mist background, semibold, `aria-current="page"`. The landing renders the same header sticky on translucent mist.
- **Signed-in header:** same brand and width; on the right the theme toggle and a pill trigger (36px avatar, name, chevron) that opens the user menu: "Kabinet", "Maqolalarim", "Profil", "Internetdagi ma’lumotlarim", the role panel link, then "Chiqish" behind a confirmation dialog.
- **Admin tabs:** a second row inside the page: underline tabs, 14px medium muted text, active tab ink with a 2px lapis underline; tabs wrap rather than scroll.
- **Footer (public):** paper, top hairline, brand on the left, muted section links and caption copyright on the right.

### Step marker (signature)
A numbered circle that turns a process into a sequence. Landing: 40px ring with 2px lapis border and a Literata number on paper; the final step is filled lapis with a drawn SVG check; steps joined by a 1px `line` connector. The article editor uses a compact 32px marker of its own (current: lapis fill; done: tile fill with SVG check; to do: hairline ring with muted number); it is not yet reconciled with the landing ring.

### Avatar
Photo in a circle, or Literata initials on tile-soft in tile, sized by the caller; always next to the name, so decorative (`alt=""`).

## Do's and Don'ts

### Do:
- **Do** use `.btn btn-primary` for the single main action of a view and `.btn-secondary` / `.btn-ghost` for everything else.
- **Do** build every new page inside `PublicHeader` or `DashboardShell` with `PUBLIC_WIDTH`, a Literata h1 at 1.875rem / 2.25rem and a 40px page padding.
- **Do** make cards clickable with the stretched title link and the card-level tile focus ring, as in `ArticleList`.
- **Do** express status with `Chip` tones (neutral, lapis, tile, danger) and always with text.
- **Do** separate content with 1px `line` hairlines and the mist/paper contrast.
- **Do** give every motion a `prefers-reduced-motion` fallback; outside the landing limit motion to 150ms colour transitions, the chevron rotation and the loading pulse.
- **Do** use inline SVG icons with a 2px stroke and round caps.

### Don't:
- **Don't** add gradients, glows, textured backgrounds or new hues on app surfaces; the sky gradient and horizon line belong to the frozen landing.
- **Don't** add shadows to cards, panels or buttons; shadows are for floating menus and tooltips only.
- **Don't** introduce new radii beyond 8 / 12 / 16px and full.
- **Don't** use Literata for buttons, labels, chips or form text.
- **Don't** set text smaller than 12px or uppercase-tracked labels outside the frozen landing.
- **Don't** use Unicode glyphs (✕, ✓, ←) as stand-alone icons; draw them as SVG.
- **Don't** alter the official Asman logo, the Asman mark or their navy.
- **Don't** port landing-only devices (scroll-driven reveals, logo float, blurred sticky header, drenched lapis CTA band) to other surfaces.
