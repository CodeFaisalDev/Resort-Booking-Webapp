# Resort Booking Website — Design Instructions
### Adapted from "Vertex" (Phenomenon Labs / Phenomenon Studio, Dribbble)

> Source material note: the only asset available was Dribbble's 800×150px hover-preview
> clip (20s, scrolling through the shot), not the full-resolution image. Colors below were
> sampled directly from the video's pixel data; layout, spacing, and component structure
> are read from the scroll sequence. Treat pixel values as a very close approximation of
> the original, not a guaranteed 1:1 match — nudge them ±5% if you have access to the
> full-res shot later.

---

## 1. Overall Art Direction

The source is a **dark, editorial, high-end real-estate site** — moody charcoal backgrounds,
huge property photography, restrained typography, thin hairline dividers, and small
uppercase micro-labels used like a magazine spread rather than a typical SaaS UI.

For the resort version, keep that exact mood but swap the subject from "homes for sale" to
**"a stay you book."** Think: a five-star resort's brand site crossed with a boutique
real-estate portfolio — calm, spacious, photography-led, zero clutter.

**Core mood words:** quiet luxury, cinematic, warm-neutral, spacious, confident.

---

## 2. Color Palette (sampled from source)

| Role | Hex | Notes |
|---|---|---|
| Primary background (dark) | `#141414` | Main canvas color, near-black charcoal (not pure black) |
| Secondary background (deep) | `#0d0d0d` / `#000000` | Used for the deepest/darkest sections (hero overlay, footer) |
| Card / panel dark | `#1a1a1a` – `#2c2c2c` | Slightly lifted panels/cards sitting on the main background |
| Light section background | `#ededed` / `#f6f4f2` | Warm off-white used for alternating light sections — not pure white |
| Divider / hairline | `#2c2c2c` @ 1px | Subtle section separators, never high-contrast |
| Body text on dark | `#e5e5e5` / `#f2f2f2` | Off-white, not pure `#fff`, for reduced glare |
| Muted / secondary text | `#8a8a8a` – `#a0a0a0` | Captions, meta labels, secondary descriptions |
| Photography accent tones | terracotta `#824105`, olive `#525700`, dusty rose `#cb6f73` | These come through the property/lifestyle photography itself — use warm, sun-lit, earthy photo grading rather than a saturated "brand accent color" |

**Resort adaptation:** Instead of a synthetic accent color, let a **warm sand/terracotta**
(`#B9784F` or similar) act as the one accent used sparingly — active nav underline, price
highlight, one CTA button fill. Everything else stays grayscale/off-white on charcoal.

---

## 3. Typography

- **Headline typeface:** a modern high-contrast serif or a clean geometric sans in a
  **light/regular weight**, set large (roughly 56–96px desktop for the hero). The source
  favors generous letter-spacing on short headline phrases rather than dense paragraphs.
- **Body typeface:** a neutral grotesque sans-serif (Inter, General Sans, Neue Montreal, or
  similar), regular weight, comfortable line-height (~1.5–1.6).
- **Micro-labels / eyebrows:** small (11–13px), **uppercase**, letter-spaced (0.1–0.2em),
  muted gray color — used above headlines and section titles (e.g. "OUR RESORTS", "WHY
  STAY WITH US").
- **Numerals:** used prominently for stats blocks (e.g. property count, ratings) in a
  large, light weight against small uppercase captions underneath.

**Resort naming convention for labels:** "FEATURED STAYS", "DESTINATIONS", "THE
EXPERIENCE", "GUEST STORIES", "BOOK DIRECT."

---

## 4. Layout & Structure (read from the scroll sequence)

The video scrolls top→bottom through a full homepage. Reconstructed section order:

### 4.1 Navigation Bar (sticky, top)
- Dark, transparent-to-solid on scroll, `#141414` background once solid.
- Left: wordmark/logo (short, all-caps or lightweight custom mark).
- Center or left-adjacent: 4–5 nav links, small uppercase text, generous horizontal
  spacing (`Stays` / `Destinations` / `Experiences` / `About` / `Contact`).
- Right: a single outlined or ghost-button CTA (**"Book Now"**), plus sometimes a
  secondary icon (search / menu / language).
- Thin 1px hairline or subtle shadow separates nav from hero on scroll only — otherwise
  nav floats over the hero image with no visible bar.

### 4.2 Hero Section
- Full-bleed, full-viewport-height photograph (resort exterior / pool / villa at golden
  hour) with a dark gradient overlay (`#000000` at 20–40% opacity, heavier toward the
  bottom) so text stays legible.
- Small uppercase eyebrow label top-left or centered ("A QUIET ESCAPE" / "LUXURY
  RESORT & SPA").
- Large light-weight headline, 2 lines max, e.g. **"Find Your Place to Belong"** →
  resort version: **"Where Every Stay Feels Like Home"**.
- One-line supporting description in muted gray, max ~60 characters wide.
- A single primary CTA button ("Explore Rooms" / "Check Availability") — rectangular or
  slightly rounded, outlined or subtly filled, no drop shadows, minimal.
- Bottom-of-hero: a **thin stats/inline bar** — 3–4 small stat blocks side by side
  (e.g. "120+ Properties / 4.9★ Guest Rating / 24 Destinations"), separated by hairline
  vertical dividers, sitting just above or overlapping the hero's bottom edge.

### 4.3 "Search / Booking Bar" module (resort-specific addition)
The source is real estate (no dates/guests), but for a resort booking site this is the
most important functional swap. Insert a **floating booking card** directly beneath or
overlapping the hero, styled to match the dark-panel language:
- Dark card (`#1a1a1a`) with hairline border, rounded corners (8–12px), drop shadow soft
  and low-opacity.
- Horizontal row of fields: **Destination / Check-in / Check-out / Guests**, each
  separated by thin vertical dividers, labeled with tiny uppercase captions above each
  value.
- Right-aligned solid CTA button ("Search" / "Check Availability") in the warm accent
  color.
- On mobile this stacks vertically with full-width fields.

### 4.4 Featured Listings Grid ("Featured Stays")
- Section eyebrow + headline + optional short paragraph, left-aligned, with a
  "View All →" link on the right at the same baseline.
- Asymmetric card grid — **not** a uniform 3-column grid. Source shows a large hero card
  (roughly 60% width) paired with 1–2 smaller stacked cards, then a row of 2–3 even
  cards below. Mix large feature cards with smaller companion cards for rhythm.
- Each card:
  - Large photo, rounded corners (~12–16px), subtle hover zoom.
  - Overlaid or below-image micro-tag (e.g. "OCEANFRONT VILLA", "BEST SELLER").
  - Title (resort/room name), location line in muted gray with a small pin icon.
  - Price line: **"From $420 / night"** in a slightly larger, warmer-toned weight.
  - Small meta row: guests / bedrooms / amenities icons (bed, guests, wifi) — mirrors the
    source's bed/bath/sqft icon row but swapped for resort-relevant icons (guests, beds,
    view type).
  - Optional small "save/heart" icon top-right of the image.

### 4.5 Stats / Trust Band
- Full-width darker or lighter contrasting strip breaking up the scroll.
- 3–4 large light-weight numerals with small uppercase captions beneath
  (e.g. "98% Guest Satisfaction", "15 Years Hosting", "40+ Awards").
- Numbers should feel understated, not "counter-animated SaaS metric" — same restrained
  typographic language as the rest of the site.

### 4.6 "Why Book With Us" / Feature Highlights
- Alternating light (`#ededed`) and dark sections as the page scrolls — this
  light/dark alternation is a defining rhythm of the source design; keep it.
- 2–3 column layout: small icon or number, short bold title, 1–2 line description.
  Resort equivalents: "Best Rate Guarantee," "Free Cancellation," "24/7 Concierge,"
  "Curated Experiences."

### 4.7 Destinations / Map-driven Section
- Real estate original likely showed a map/location browser; adapt to a **destination
  picker**: horizontally scrollable or grid of destination photo-cards (e.g. Maldives,
  Bali, Santorini, Aspen), each with a soft dark gradient, city/region name, and a
  small "X properties" count.

### 4.8 Testimonials
- Large quotation mark or serif opening glyph, generous line-height, guest name + small
  avatar + location, set on a plain dark or light panel — no card border, just spacing.
- Optional horizontal carousel with thin dot or line pagination indicators, minimal
  arrow controls.

### 4.9 Secondary CTA / Newsletter Band
- Full-width band, contrasting background, centered short headline ("Ready for your
  next escape?"), single email input + button inline, minimal border, no clutter.

### 4.10 Footer
- Dark (`#000000` or `#0d0d0d`), generous top padding (~96–120px).
- Multi-column link layout: Company / Destinations / Support / Legal.
- Large wordmark or logo repeated at reduced opacity as a background/closing element
  (a common "editorial site" outro trick) — optional but on-brand.
- Bottom row: copyright, social icons (thin line-style icons only), language/currency
  selector.

---

## 5. Component Style Rules (apply everywhere)

- **Corners:** consistently rounded, 8–16px radius on cards/buttons/inputs. No sharp
  90° corners on interactive elements, no fully-pill/rounded-full buttons.
- **Borders:** hairline 1px, low-contrast (`rgba(255,255,255,0.08)` on dark,
  `rgba(0,0,0,0.08)` on light) — used instead of shadows for separation wherever possible.
- **Shadows:** minimal, soft, low-opacity, only under floating elements (the booking
  card, dropdowns). Never a hard/dark drop shadow.
- **Buttons:**
  - Primary: solid warm-accent fill, dark text, no gradient.
  - Secondary/ghost: 1px border, transparent fill, text color matches surrounding
    text, background fades in subtly on hover.
- **Icons:** thin single-weight line icons only (1.5px stroke), never filled/solid
  icon style.
- **Imagery:** always full-bleed or large-format, warm/golden-hour color grading,
  consistent crop ratio per card type (e.g. 4:3 for listing cards, 16:9 for hero).
- **Motion (read from the scroll video):** gentle parallax on hero image, cards
  fade+slide up ~20px on scroll into view, nav bar background fades in past ~80px
  scroll, image hover = slow scale(1.03) zoom with overflow hidden on the card.
- **Spacing:** generous — section vertical padding roughly 96–140px desktop, 56–72px
  mobile. Don't compress; the whole design reads as "confident whitespace."

---

## 6. Content/Copy Adaptation Cheat-Sheet (Real Estate → Resort)

| Real Estate original concept | Resort booking equivalent |
|---|---|
| "Find your place to belong" / property search hero | "Where every stay feels like home" / availability search hero |
| Property listing card (price, sqft, beds/baths) | Room/villa card (price per night, guests, bed config, view) |
| "View Listing" | "View Room" / "Book Now" |
| Agent bios / "Meet the team" | Concierge team / "Meet Your Hosts" |
| Neighborhood explorer / map | Destination explorer (resort locations/islands) |
| Mortgage calculator or "Request a tour" | "Check Availability" date-range booking form |
| Client testimonials (buyers) | Guest reviews (stays) |
| "Schedule a viewing" CTA | "Reserve Your Stay" CTA |
| Property stats (sqft, lot size, year built) | Room stats (guests max, m², bed type, amenities) |

---

## 7. Prompt-Ready Summary (for AI website builders / v0 / Lovable / Framer AI / etc.)

Use this as a single condensed prompt if you're generating this in one shot with an AI
tool:

> Design a dark, editorial-style luxury resort booking website homepage. Background
> `#141414` charcoal with alternating warm off-white (`#f6f4f2`) sections for rhythm.
> Sticky transparent nav that solidifies to `#141414` on scroll, wordmark left,
> 4–5 uppercase nav links, single outlined "Book Now" button right. Full-viewport hero
> with a golden-hour resort photograph, dark gradient overlay, small uppercase eyebrow
> label, large light-weight two-line headline ("Where Every Stay Feels Like Home"),
> muted one-line subtext, single accent-filled CTA button, and a thin 3-stat inline bar
> at the hero's base. Below the hero, a floating dark booking card (`#1a1a1a`, hairline
> border, 12px radius) with Destination / Check-in / Check-out / Guests fields separated
> by thin dividers and a warm-accent "Search" button. Featured Stays section: asymmetric
> card grid (one large card + smaller companion cards), rounded 12–16px image corners,
> price-per-night in warm accent tone, small meta row of guest/bed/amenity icons.
> Stats band with large light-weight numerals and small uppercase captions. Alternating
> light/dark feature sections with icon + short title + 1–2 line description
> (best-rate guarantee, free cancellation, concierge). Destination picker with photo
> cards per region. Minimal testimonial section with large quote glyph and guest name.
> Full-width newsletter CTA band. Dark multi-column footer. Typography: light-weight
> modern sans/serif headlines, neutral grotesque sans body text, uppercase letter-spaced
> micro-labels throughout. Hairline borders and soft low-opacity shadows only, thin
> line-style icons, warm terracotta (`#B9784F`) as the single accent color, generous
> 96–140px section spacing, subtle scroll-triggered fade/slide-up animations and
> slow-zoom image hovers.

---

## 8. What I could and couldn't verify

- **Verified from pixel data:** background/panel hex values, light/dark section
  alternation, hairline divider treatment, overall dark-charcoal palette, general
  scroll structure (nav → hero → grid sections → stats → footer).
- **Inferred from visual pattern at low resolution (not pixel-verified):** exact font
  family, exact spacing values, exact card grid breakpoints, precise copy/microcopy.
  If you can get the full-resolution Dribbble shot (open the shot page directly rather
  than the hover-preview video), I can re-check typography and spacing against it for
  a tighter match.
