# Agora — debate platform

A working front-end prototype of a debate platform, built from a technical
specification. Bilingual (EN / RU), light & dark themes, fully responsive.

**Live:** https://mishka-code-777.github.io/agora-debate/

> **Front-end prototype.** There is no server yet. Accounts, debates, sessions,
> reports and notifications are stored in your browser (localStorage) via
> `assets/js/store.js`. A **demo account** is pre-seeded so the full product is
> visible immediately — username `sofia`, password `password123`. Use
> "Reset demo data" in the footer to restore the seed. Swapping the store for a
> real backend/API is the next step.

## What works

- **Registration** with live validation (username charset, password length)
- **Login / logout**, session-aware header across the whole site
- **Profile settings**: change username & password (inline), edit description,
  manage contacts (Contact platform widget), delete account
- **Debates**: create / edit / delete (with the Virtual location widget),
  participate / withdraw, report
- **Users**: browse, search, sort, view a user, report a user
- **Debates list**: search, multi-sort, filters (published-by multi-row +
  status), applied-filter chips
- **My debates**, **Notifications**, and empty / 404 states

## Pages

`index` · `register` · `login` · `debates` · `debate` · `debate-config` ·
`users` · `user` · `profile` · `my-debates` · `notifications` ·
`account-deleted` · `404`

## Structure

```
assets/css/tokens.css       design tokens (light + dark)
assets/css/base.css         reset + primitives
assets/css/components.css   buttons, forms, cards, header, footer, dialogs, widgets…
assets/css/pages.css        page-level sections
assets/js/store.js          client-side data layer (localStorage)
assets/js/app.js            theme + language, header/footer, render helpers, wiring
```

No build step — open any `.html` file directly. Theme and language are
remembered in `localStorage`.

Developed by SPOF Code · Design by Agora · © SPOF Code. All rights reserved. 2026
