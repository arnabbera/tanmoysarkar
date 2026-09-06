# Tanmoy Sarkar Portfolio

[![GitHub Repo](https://img.shields.io/badge/GitHub-arnabbera%2Ftanmoysarkar-blue?logo=github)](https://github.com/arnabbera/tanmoysarkar)

A modern, responsive, high‑fi portfolio website for a professional videographer and digital creator. The site showcases YouTube channels, work samples, memories, and provides an admin area for creating SEO‑rich posts.

## Features
- Dark‑slate, glass‑morphism design with smooth micro‑animations.
- Mobile‑first responsive layout (desktop, tablet, mobile).
- Single‑page navigation with lazy‑loaded YouTube embeds.
- Admin login (email‑only) for two admins:
  - `berarnab@gmail.com`
  - `tanmoysarkarvlogs@gmail.com`
- Admin dashboard lets you **create / edit / delete** posts (title, description, SEO keywords, YouTube video) stored in `localStorage`.
- SEO meta tags (title, description, keywords) on every page.
- Placeholder hero banner (generated AI image).

## Project Structure
```
.
├─ index.html               # Home page with hero & navigation tabs
├─ about.html               # About me
├─ work.html                # Portfolio showcase
├─ memories.html            # Memories section
├─ creations.html           # YouTube channel showcase
├─ contact.html             # Contact details & social links
│
├─ admin/
│   ├─ login.html          # Admin login page
│   ├─ dashboard.html      # Admin dashboard (post CRUD)
│   └─ admin.js            # JS for login & post handling (localStorage)
│
├─ assets/
│   ├─ css/
│   │   └─ style.css       # Global stylesheet (dark slate theme)
│   ├─ js/
│   │   ├─ main.js         # SPA navigation & lazy YouTube loader
│   │   └─ admin.js        # Admin logic (already in admin folder)
│   └─ images/
│       └─ hero_banner_*.png   # Generated hero image
│
└─ README.md                # This file
```

## Getting Started (Local Development)
1. Ensure you have **Node.js** (optional, only for a simple dev server).  
2. From the project root, run a static server, e.g.:
   ```bash
   npx -y http-server . -p 8080
   ```
   or, if you prefer Python:
   ```bash
   python -m http.server 8080
   ```
3. Open `http://localhost:8080` in your browser.
4. Navigate the tabs, test the admin login (use one of the admin emails), and create a post. Posts persist across reloads via `localStorage`.

## Deployment
The site is pure static assets, so you can host it on any static‑site provider (GitHub Pages, Netlify, Vercel, Cloudflare Pages, etc.).
1. Push the repository to GitHub.
2. Enable GitHub Pages on the `main` branch (or use Netlify/Cloudflare by linking the repo).
3. The site will be live at the generated URL.

If you later want a backend, the admin CRUD logic can be swapped for API calls; the UI will remain the same.

## Customisation
- **Colours / Fonts** – Edit `assets/css/style.css`. The colour palette uses HSL variables; change them to match your brand.
- **Hero Image** – Replace `assets/images/hero_banner_*.png` with your own banner (keep the same file name or update the URL in `index.html`).
- **Add More Sections** – Create a new `.html` file, add a tab in `index.html`, and the SPA loader will handle it automatically.

---
*Built with vanilla HTML, CSS, and JavaScript – no external frameworks required.*
