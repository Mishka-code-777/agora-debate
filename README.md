# Agora — debate platform (design)

Static, responsive HTML/CSS design for a debate platform, built from a technical
specification. Bilingual (EN / RU) with light & dark themes.

**Live preview:** https://mishka-code-777.github.io/agora-debate/

## Status

Step 1 — design system + base template + reference pages.

| Page | File | State |
| --- | --- | --- |
| Index (landing) | `index.html` | ✅ |
| Debates list | `debates.html` | ✅ |
| _remaining pages_ | — | in progress |

## Structure

```
assets/css/tokens.css       design tokens (both themes)
assets/css/base.css         reset + primitives
assets/css/components.css   buttons, forms, cards, header, footer, dialogs, …
assets/css/pages.css        page-level sections
assets/js/app.js            theme + language toggle, header/footer, UI wiring
```

Theme and language are remembered in `localStorage`. No build step — open any
`.html` file directly.

Developed by SPOF Code · Design by Agora · © SPOF Code. All rights reserved. 2026
