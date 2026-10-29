# Maison Gravure

Multi-branch luxury engraving storefront (Romanian, RON, card-only payments) and — in later phases — the workshop ERP for three Gravograph M20 machines. The full product specification lives in [CLAUDE.md](./CLAUDE.md).

| Atelier              | Route        | Identity                                                                       |
| -------------------- | ------------ | ------------------------------------------------------------------------------ |
| Maison Gravure (hub) | `/`          | Cormorant Garamond + Plus Jakarta Sans · ivory, imperial green, brushed brass  |
| Maison Pedigree      | `/pet`       | Fraunces + Plus Jakarta Sans · warm sand, forest green, terracotta             |
| Maison Aurum         | `/jewelry`   | Bodoni Moda + Inter · pure ivory, champagne gold                               |
| The Brass Vault      | `/vault`     | Space Grotesk + JetBrains Mono · charcoal obsidian, aged copper                |
| Maison Bespoke       | `/corporate` | Archivo Expanded + IBM Plex Mono · travertine, architectural navy, satin brass |

## Stack

Next.js 15 (App Router, TypeScript) · Tailwind CSS 4 · Lucide · Zustand 5 · Prisma 7 on PostgreSQL.

## Getting started

```bash
npm install
```

```bash
cp .env.example .env
```

The storefront renders from `src/lib/seed-data.ts`, so `npm run dev` works without a database. To load the catalogue into PostgreSQL, point `DATABASE_URL` in `.env` at your database, then:

```bash
npm run db:migrate
```

```bash
npm run db:seed
```

## Scripts

| Script                               | Purpose                                      |
| ------------------------------------ | -------------------------------------------- |
| `npm run dev`                        | Development server on http://localhost:3000  |
| `npm run build` / `npm start`        | Production build / serve                     |
| `npm run lint` · `npm run typecheck` | ESLint · TypeScript                          |
| `npm run db:migrate`                 | Apply Prisma migrations (dev)                |
| `npm run db:deploy`                  | Apply migrations in production               |
| `npm run db:seed`                    | Upsert the 12-product catalogue (idempotent) |
| `npm run db:studio`                  | Prisma Studio                                |

## How the theme system works

Each atelier is a set of `--b-*` CSS variables under `[data-branch="…"]` in `src/app/globals.css`. Tailwind utilities such as `bg-bg`, `text-ink`, `bg-accent`, `font-display` and `rounded-branch` read those variables, so any element re-themes itself by setting `data-branch`. The page shell sets it for the whole page; product cards, cart badges and the umbrella's atelier preview set it on themselves to keep their own identity inside another atelier's page.
