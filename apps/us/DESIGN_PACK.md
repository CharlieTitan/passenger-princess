# US Design Pack — V1

Canonical design guidance for the standalone US app in `apps/us`. This document governs new screens and ongoing QC; it does not replace the existing layout wholesale.

## Personality
An intimate, premium shared scrapbook. Playful without gimmicks. Not a SaaS dashboard. The two people and their moments are the focus.

## Tokens
The CSS custom properties in `apps/us/app/us.css` beginning `--us-` are the source of truth.
- Display: Georgia / serif for emotional and editorial headings.
- UI: system sans-serif for controls, labels, counts and tile titles.
- Main ink `#342b2f`, quiet muted ink `#8f7d83`, pink accent `#e65a8d`.
- White / warm paper backgrounds, soft rose-grey borders, rounded panels.
- Avoid inconsistent font declarations on adjacent components.

## Component rules
- Category tiles (Eat, Watch, Go, Do): **all four** use the same sans typeface, size, weight, letter spacing and positioning for the title and item count. The emoji can vary.
- Section introductions: eyebrow (9px UI uppercase/tracked), Georgia title (29px), optional muted UI description (11px).
- Button labels and filter chips: sans, medium/bold, readable on mobile; buttons must have meaningful enabled/selected states.
- Photo/memory UI: maintain Polaroid identity with caption and direct links to associated memories.
- Never let expanded detail stretch a Polaroid or crop important text.
- Keep the pink accent restrained: focus, selected state, key interactive actions.
- Respect safe areas, small mobile widths, accessibility labels and light/dark contrast as modes are added.

## Home hierarchy
1. Greeting and Now / Next Up.
2. **Pick for us** — a single prominent expandable card, offering Inspire us and Surprise us inside; expansion is inline, not a scroll jump.
3. Poll It.
4. **Your ideas** section heading, then four category tiles and their lists.
5. Filters, utility shortcuts, search and item cards.

Do not duplicate Pick for us or Tonight inside Your ideas utility shortcut chips. Keep category filters focused on the lists.

## QC guardrails
- Test on iPhone width and desktop.
- Test picker expanded/collapsed with both modes, and check it remains after a suggestion is chosen.
- Verify 4 tiles match even with differing item-count digits.
- Preserve both users' existing `us:*` data; no re-seeding.
- Design changes must not touch Passenger Princess or Pillow Princess data.
- For future public release: review contrast, system typography on Android, tenant isolation, media storage and branding before scaling.
