# Maison Gravure

Multi-branch luxury engraving storefront (Romanian, RON, card-only payments) and the owner's workshop portal for three Gravograph M20 machines. The full product specification lives in [CLAUDE.md](./CLAUDE.md).

| Atelier              | Route        | Identity                                                                       |
| -------------------- | ------------ | ------------------------------------------------------------------------------ |
| Maison Gravure (hub) | `/`          | Cormorant Garamond + Plus Jakarta Sans · ivory, imperial green, brushed brass  |
| Maison Pedigree      | `/pet`       | Fraunces + Plus Jakarta Sans · warm sand, forest green, terracotta             |
| Maison Aurum         | `/jewelry`   | Bodoni Moda + Inter · pure ivory, champagne gold                               |
| The Brass Vault      | `/vault`     | Space Grotesk + JetBrains Mono · charcoal obsidian, aged copper                |
| Maison Bespoke       | `/corporate` | Archivo Expanded + IBM Plex Mono · travertine, architectural navy, satin brass |

## Stack

Next.js 15 (App Router, TypeScript) · Tailwind CSS 4 · Lucide · Zustand 5 · Prisma 7 on PostgreSQL · Auth.js 5.

## Getting started

```bash
npm install
```

```bash
cp .env.example .env
```

The catalogue lives in PostgreSQL, so point `DATABASE_URL` in `.env` at your database before running the app, then create the schema and load the 12 starter products:

```bash
npm run db:migrate
```

```bash
npm run db:seed
```

## Scripts

| Script                               | Purpose                                                     |
| ------------------------------------ | ----------------------------------------------------------- |
| `npm run dev`                        | Development server on http://localhost:3000                 |
| `npm run build` / `npm start`        | Production build / serve                                    |
| `npm run lint` · `npm run typecheck` | ESLint · TypeScript                                         |
| `npm run db:migrate`                 | Apply Prisma migrations (dev)                               |
| `npm run db:deploy`                  | Apply migrations in production                              |
| `npm run db:seed`                    | Add missing starter products (`-- --reset` overwrites them) |
| `npm run db:studio`                  | Prisma Studio                                               |
| `npm run admin:credentials -- "…"`   | Print the owner password hash and auth secret               |

## Personalization configurator

Every product page (`/[branch]/produs/[slug]`) runs the step-by-step engraving configurator: finish, front / back, typeface, text lines limited by the blank's real engraving area, a vector symbol library, an optional sketch upload and the velvet gift box. The live SVG preview and the RON total update as you type, and configured pieces from every branch go into the persisted Universal Cart.

Sketch uploads (up to 4 MB) are stored privately in PostgreSQL and can only be downloaded from the workshop portal.

## Checkout and payments

`/checkout` collects contact, billing (persoană fizică or juridică with CUI and Reg. Com.) and shipping details, re-prices the cart on the server and takes payment by card only.

- **Without Stripe keys** (`npm run dev`), use **Simulează plata (dezvoltare)**: the order is saved as `PAID_NEW`, each piece is assigned to its M20 machine and you land on `/comanda/[orderNumber]`, where another button walks the order through the workshop stages. Under `npm start`, set `PAYMENT_SIMULATION=true` to get the same button.
- **With Stripe**, set `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` in `.env`, then forward webhooks locally:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Checkout and order pages need PostgreSQL (`npm run db:migrate` and `npm run db:seed` first).

## Customer accounts

Customers can create an account at `/autentificare` (or tick "Vreau să creez un cont…" at checkout). `/contul-meu` lists their paid orders with the engraving of every piece and the workshop stage, and stores their default delivery address, which prefills checkout. Ordering without an account still works.

Password reset links are e-mailed through [Resend](https://resend.com): set `RESEND_API_KEY` and `EMAIL_FROM` (an address on a domain verified in Resend). Under `npm run dev` without them, the reset link is shown on screen instead.

## Workshop portal (`/admin`)

Owner-only. Create the credentials once and paste the two printed lines, plus your e-mail, into `.env`:

```bash
npm run admin:credentials -- "o parolă de cel puțin 12 caractere"
```

```dotenv
ADMIN_EMAIL="atelier@exemplu.ro"
```

Then sign in at `/admin/login`.

- **Panou** — revenue per atelier, the load on each M20 by workshop stage, urgent orders and blanks running low.
- **Producție M20** — the queue as a board, one column per stage, filterable by machine and stage. Each piece shows its text in the chosen font, can be moved to another M20, and has **Descarcă SVG (mm) · Față / Verso**: a Gravostyle-ready file whose `width`/`height` are the blank's engraving area in millimetres, with a cyan guide outline of the blank, the vector symbol and the centred text. **Fișă tehnică de atelier** opens the printable job sheet.
- **Comenzi** — search, PF/PJ billing and shipping details, the status history, and the courier + AWB form that marks an order shipped.
- **Clienți** — registered customer accounts with their number of paid orders, lifetime spend and sign-up date.
- **Produse** — add, edit, duplicate, hide or delete products: prices, stock (also editable inline in the list), finishes, volume tiers and the M20 parameters (blank SKU, material, engraving area and depth, machine, diamond or rotary, tool). Changes appear in the shop immediately. Products that were already ordered can only be hidden.

## Deploy to Vercel

The repository deploys to [Vercel](https://vercel.com) with a [Neon](https://neon.tech) PostgreSQL database. Every push to the production branch redeploys; each build applies new database migrations and, on an empty database, loads the 12 starter products.

1. In Vercel, **Add New → Project** and import this GitHub repository. Keep the detected settings (`vercel.json` sets the build command and the Frankfurt region) and deploy. The first build skips the database steps because none is connected yet.
2. In the project, open **Storage → Create Database → Neon**, choose the **Frankfurt (eu-central-1)** region and connect it to the project. This adds `DATABASE_URL` and `DATABASE_URL_UNPOOLED`.
3. In **Settings → Environment Variables**, add `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH` and `AUTH_SECRET` (from `npm run admin:credentials`). Until Stripe is set up, also add `PAYMENT_SIMULATION` = `true` to test orders without real payments.
4. **Deployments → ⋯ → Redeploy**. The site is then live at the project's `.vercel.app` address, and the workshop portal at `/admin`.

Canonical URLs, the sitemap and share images use the Vercel production domain automatically. When you add your own domain, set `NEXT_PUBLIC_SITE_URL` (for example `https://maison-gravure.ro`) and redeploy, then submit `https://<domain>/sitemap.xml` in Google Search Console.

Before taking real orders, remove `PAYMENT_SIMULATION` and add `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`, with a Stripe webhook pointing at `https://<domain>/api/stripe/webhook` (events `checkout.session.completed` and `checkout.session.expired`).

## How the theme system works

Each atelier is a set of `--b-*` CSS variables under `[data-branch="…"]` in `src/app/globals.css`. Tailwind utilities such as `bg-bg`, `text-ink`, `bg-accent`, `font-display` and `rounded-branch` read those variables, so any element re-themes itself by setting `data-branch`. The page shell sets it for the whole page; product cards, cart badges and the umbrella's atelier preview set it on themselves to keep their own identity inside another atelier's page.
