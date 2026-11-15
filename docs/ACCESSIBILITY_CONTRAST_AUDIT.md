# ISA text contrast and readability audit

Audit date: 14 November 2026. This is a global readability correction; the existing information architecture, copy, research claims, citations, green-and-gold identity, and routing are preserved.

## Root causes corrected

- The redesign stylesheet re-declared the light palette unconditionally after the main stylesheet's dark-mode rules. This silently replaced the system and explicit dark theme tokens. Theme tokens now live in `src/styles/main.css`; parchment and quotation surfaces adapt with the active theme.
- The global `footer` selector also styled the citation footer inside quoted research passages. Site footer styling is scoped to `.site-footer`, leaving the nested passage citation readable on its own surface.
- Gold labels and links used one color on both light and dark surfaces. Separate text, button, and dark-surface gold tokens now keep foreground/background pairs distinct while preserving the heritage palette.
- A pale library note used pale text on the page surface; Arabic scholar names inherited the light-surface gold on a green profile hero; and mobile image opacity faded the adjacent image caption. Those selectors now use colors and opacity on the appropriate elements.
- Disabled pager labels used reduced opacity. They now use the theme's readable secondary text color. Form placeholders have an explicit theme-aware color and full opacity.

## Surfaces and components reviewed

Reviewed both global stylesheets and rendered templates for home, scholar directory, scholar profiles, contribution details, manuscripts/library, timeline, admin, loading/error/empty states, navigation, inputs, buttons, information cards, research dossiers and citations, dialogs/lightboxes, and footer. This includes the English, Urdu, and Arabic route templates; direction and font rules remain intact.

The mobile rules at 48rem and 40rem were inspected for text-specific opacity, overflow, and footer wrapping. The creator attribution appears once, after existing footer content, with a `mailto:` link and wrapping email text.

## Contrast checks

`tests/contrast.test.ts` calculates WCAG contrast ratios for primary, secondary, gold, link, and status text against light and dark page, card, parchment, and passage surfaces. It also checks the fixed heritage cards, quote panels, danger/gold buttons, footer text, and creator attribution. Normal text pairs are required to reach 4.5:1.

The audit is a source/CSS and automated contrast review. A live screenshot comparison at desktop, tablet, and mobile sizes could not be completed because the Windows browser session did not expose a verifiable current URL during this pass.
