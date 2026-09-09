# Khedr0x00.github.io — Portfolio

Live at **https://khedr0x00.github.io**

Portfolio of **Mohamed Khedr** ([@Khedr0x00](https://github.com/Khedr0x00)) — Automation · IoT · Web · Security Tooling.

## What it does

- Showcases **every public project** from the GitHub account, with descriptions, topics, languages, stars, and update dates
- **Live sync** — project data is fetched from the GitHub API on each visit, so new repos appear automatically (with a baked snapshot as offline fallback)
- Search + language filters, project detail modals, animated terminal-style background
- Dark cyber aesthetic, fully responsive, keyboard accessible

## Structure

```
index.html            — single-page site
assets/css/style.css  — styles
assets/js/app.js      — rendering, live GitHub sync, canvas background
assets/js/data.js     — auto-generated snapshot (offline fallback)
```

## Updating

The site updates itself: any new public repository appears on the next visit automatically.
