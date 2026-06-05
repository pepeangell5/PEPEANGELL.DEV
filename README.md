# PepeAngell Labs

Static personal technical website for PepeAngell Labs, focused on ESP32, RF, BLE, WiFi, embedded systems, cyberdecks, web flashers, educational firmware projects and public GitHub repositories.

The site is designed for GitHub Pages and does not use a backend, databases, Meta APIs, private tokens or server-side APIs.

## Local Setup

```bash
npm install
npm run dev
npm run build
```

To update the local GitHub repositories JSON:

```bash
npm run fetch:repos
```

The script reads public repositories from:

```text
https://api.github.com/users/pepeangell5/repos?per_page=100&sort=updated
```

It writes normalized data to:

```text
public/data/repos.json
```

If GitHub is unavailable, the script preserves the existing JSON file when possible. In GitHub Actions it can use `GITHUB_TOKEN`, but no token is exposed to the frontend.

## Updating Content

Most visible content is stored in JSON files:

```text
src/data/projects.json
src/data/flashers.json
src/data/hardware.json
src/data/lab-notes.json
src/data/roadmap.json
src/data/changelog.json
public/data/repos.json
```

Update those files to change project cards, flashers, hardware notes, roadmap entries and changelog items without editing Astro components.

## Routes

```text
/
/projects/
/projects/[slug]/
/repos/
/flashers/
/hardware/
/lab-notes/
/roadmap/
/changelog/
/disclaimer/
/contact/
/404.html
```

## GitHub Pages Deploy

The workflow lives at:

```text
.github/workflows/deploy.yml
```

It runs on:

- Push to `main`
- Manual `workflow_dispatch`
- Daily schedule

The workflow installs dependencies, fetches public repos, builds Astro and deploys `dist` to GitHub Pages.

## Custom Domain

`public/CNAME` contains:

```text
pepeangell.dev
```

Configure DNS at the registrar to point the domain to GitHub Pages. Typical setup is either GitHub Pages apex records or a `www` CNAME, depending on how the domain is configured in GitHub.

## Folder Structure

```text
src/components/      Reusable UI components
src/data/            Editable site content
src/layouts/         Base page layout
src/pages/           Static Astro routes
src/styles/          Global CSS
public/              Static assets, CNAME, robots, sitemap and repo JSON
scripts/             GitHub repo data generation
.github/workflows/   GitHub Pages deployment
```

## Future Improvements

- Replace firmware fallback links with final Web Flasher URLs when those pages are published.
- Add real project images, wiring photos or screenshots.
- Expand project detail pages with release notes and hardware compatibility tables.
- Add generated screenshots or Open Graph images.
- Replace the static sitemap with generated entries if the number of pages grows.
