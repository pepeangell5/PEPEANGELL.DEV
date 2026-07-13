# PepeAngell Labs

Static personal technical website for PepeAngell Labs, focused on ESP32, RF, BLE, WiFi, embedded systems, cyberdecks, web flashers, educational firmware projects and public GitHub repositories.

The site is built with Astro and deployed on Vercel. It is mostly static, uses public GitHub data generated at build time, and does not require a backend for the main portfolio, firmware, repos, downloads or hardware sections.

Production domain:

```text
https://www.pepeangell.dev
```

## Local Setup

```bash
npm install
npm run dev
npm run build
```

To update the local GitHub repositories, README JSON, flashers, downloads, hardware wiki and news data:

```bash
npm run fetch:github
```

The script reads public repositories from:

```text
https://api.github.com/users/pepeangell5/repos?per_page=100&sort=updated
```

It writes normalized data to:

```text
public/data/repos.json
public/data/readmes.json
public/data/hardware-wiki.json
src/data/hardware-wiki.generated.json
```

If GitHub is unavailable, the script preserves the existing JSON file when possible. In GitHub Actions it can use `GITHUB_TOKEN`, but no token is exposed to the frontend.

## Vercel Deploy

The production site is deployed from the `main` branch on Vercel.

Recommended Vercel settings:

```text
Framework Preset: Astro
Root Directory: ./
Install Command: npm ci
Build Command: npm run fetch:github && npm run build
Output Directory: dist
```

Environment variables:

```text
PUBLIC_GOATCOUNTER_CODE=pepeangell
PUBLIC_SUPABASE_URL=https://bnsilqtypedxwksqopdz.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-public-anon-key
```

Vercel rebuilds the site when changes are pushed to GitHub. The build fetches the latest public repository data before generating the static Astro site.

## Shop / Supabase

The shop uses the Supabase project `pepeangell-shop` from the static Astro frontend. No service role key is used in the site.

Initial setup:

1. Run `supabase/schema.sql` in the Supabase SQL editor.
2. Configure Supabase Auth email links for the production domain.
3. Add Pepe as an admin after he signs in once:

```sql
insert into public.profiles (id, role) values ('AUTH_USER_UUID_HERE', 'admin');
```

4. Add these variables in Vercel and locally:

```text
PUBLIC_SUPABASE_URL=...
PUBLIC_SUPABASE_ANON_KEY=...
```

Shop routes:

```text
/shop/            Public catalog with live stock when Supabase is configured
/shop/checkout/   Shipping checkout for supported countries
/shop/orders/     Public order lookup by code and email
/shop/admin/      Private admin for stock, prices, availability and order states
```

Supported checkout countries are Spanish-speaking countries plus United States. Payment remains manual through PayPal and confirmation happens through Telegram at `@pepeangell`.

Creating an order reserves stock immediately. If an admin marks an order as cancelled from `/shop/admin/`, Supabase returns the reserved stock once and records the event in the order history.

## Updating Content

Most visible content is stored in JSON files:

```text
src/data/projects.json
src/data/hardware-catalog.json
src/data/flashers.json
src/data/hardware.json
src/data/lab-notes.json
src/data/roadmap.json
src/data/changelog.json
public/data/repos.json
```

Update those files to change project cards, flashers, hardware notes, roadmap entries and changelog items without editing Astro components.

`src/data/hardware-catalog.json` is the curated component database. `npm run fetch:hardware` cross-checks it with public READMEs and updates the hardware wiki.

## Routes

```text
/
/support/
/shop/
/shop/checkout/
/shop/orders/
/shop/admin/
/firmware/
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

## Legacy GitHub Pages Workflow

The repository still contains a GitHub Pages workflow at:

```text
.github/workflows/deploy.yml
```

It was the previous deploy path and runs on:

- Push to `main`
- Manual `workflow_dispatch`
- Daily schedule

Production now uses Vercel. If GitHub Pages is no longer needed, this workflow can be disabled or removed later to avoid maintaining two deploy paths.

## Visitor Counter

The site uses GoatCounter for privacy-friendly visit counting.

GoatCounter settings:

```text
Site URL: https://www.pepeangell.dev
Code: pepeangell
Allow adding visitor counts on your website: enabled
Sites that can embed GoatCounter: pepeangell.dev
```

Vercel environment variable:

```text
PUBLIC_GOATCOUNTER_CODE=pepeangell
```

When the variable is present, every page loads GoatCounter and the footer displays the total site visits. GoatCounter counts visits/sessions rather than simple reload hits.

## Custom Domain

The domain is purchased separately and DNS is managed in Cloudflare.

Vercel domains:

```text
www.pepeangell.dev -> Production
pepeangell.dev -> 308 redirect to www.pepeangell.dev
pepeangell-dev.vercel.app -> Production fallback
```

Cloudflare DNS records should point to Vercel with proxy disabled:

```text
pepeangell.dev      CNAME  d955fa97d685e0c1.vercel-dns-017.com  DNS only
www.pepeangell.dev  CNAME  d955fa97d685e0c1.vercel-dns-017.com  DNS only
```

Keep Cloudflare proxy off for these records unless the Vercel domain configuration is intentionally changed.

## Folder Structure

```text
src/components/      Reusable UI components
src/data/            Editable site content
src/layouts/         Base page layout
src/pages/           Static Astro routes
src/styles/          Global CSS
public/              Static assets, CNAME, robots, sitemap and repo JSON
scripts/             GitHub repo data generation
.github/workflows/   Legacy GitHub Pages deployment
```

## Future Improvements

- Add automatic PayPal webhooks if manual confirmation becomes too much work.
- Restore or improve visitor analytics if GoatCounter settings change.
- Replace firmware fallback links with final Web Flasher URLs when those pages are published.
- Add real project images, wiring photos or screenshots.
- Expand project detail pages with release notes and hardware compatibility tables.
- Add generated screenshots or Open Graph images.
- Replace the static sitemap with generated entries if the number of pages grows.
