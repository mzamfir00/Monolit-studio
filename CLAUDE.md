# CLAUDE.md - Architecture & Specifications for Multi-Branch Luxury Engraving E-Commerce

## 1. Project Overview
We are building a full-stack, multi-branch luxury personalized e-commerce platform and internal workshop production management system (ERP/MES for 3 Gravograph M20 rotary/diamond engraving machines).
- **Storefront Language:** Romanian (all UI labels, checkout, emails).
- **Currency:** RON (Romanian Leu).
- **Payment Policy:** STRICTLY Card Payment via Stripe (NO Cash on Delivery / Ramburs, because custom mechanically engraved items are non-recoverable if unclaimed).

## 2. Tech Stack
- **Framework:** Next.js 15 (App Router, Server Actions, TypeScript)
- **Styling:** Tailwind CSS + Lucide React icons + Framer Motion (subtle, high-end editorial animations)
- **Database & ORM:** PostgreSQL + Prisma ORM
- **State Management:** Zustand (with `persist` middleware for the Universal Multi-Branch Cart)
- **Authentication:** Auth.js (NextAuth v5) or Supabase Auth — locked strictly to Admin/Owner credentials for `/admin` routes.
- **Payments:** Stripe Checkout & Webhooks (`checkout.session.completed`)
- **File Uploads:** UploadThing or local/S3 storage (for customer vector/sketch uploads)
- **Transactional Emails:** Resend + React Email (automated notifications on order status changes)

## 3. Multi-Branch Dynamic Theme System
The platform consists of 1 Umbrella Hub and 4 specialized Verticals (Branches). Each branch acts as a distinct store with its own visual identity, typography, and color palette, controlled via a `data-branch` attribute on the layout wrapper and CSS variables:

1. **`umbrella` (`/`) - "MAISON GRAVURE" (The Atelier Hub)**
   - **Vibe:** Heritage European mechanical engraving studio, timeless craftsmanship, precision diamond & rotary milling.
   - **Palette:** Background `#F7F5F0`, Surface `#EFECE6`, Text `#181818`, Accent `#1E352F` (Imperial Green) & `#B5945B` (Brushed Brass).
   - **Fonts:** Serif (`Cormorant Garamond`) + Sans (`Plus Jakarta Sans`).
   - **Features:** Story of the 3 mechanical M20 machines (diamond drag vs deep rotary milling), interactive branch selector cards, featured masterpieces from all branches.

2. **`pet` (`/pet`) - "Maison Pedigree" (Pet Luxury & Identification)**
   - **Vibe:** Warm Heritage, organic luxury, heavy solid brass & surgical steel tags, riveted leather collars, ceramic/wood bowls, memorial urns.
   - **Palette:** Background `#F3EDE2` (Oatmeal paper), Cards `#FAF6F0` (Soft cream), Text `#22201C`, Accent `#1B3B2B` (British racing / forest green) & `#C86D51` (Cognac leather / terracotta).
   - **Fonts:** Serif (`Fraunces`) + Sans (`Plus Jakarta Sans`).
   - **Geometry:** organic curves (`rounded-3xl`, pill buttons), stitched dashed inner seams (`.stitch`), arch frames, warm paper grain with a soft radial glow, rotating lifetime-guarantee seal.

3. **`jewelry` (`/jewelry`) - "Maison Aurum" (Fine Jewelry & Ceremonial Keepsakes)**
   - **Vibe:** High-fashion editorial, ultra-clean white/ivory space, macro diamond-cut textures, 925 silver pendants, cufflinks, baptism silver coins/spoons, heavy brass love locks.
   - **Palette:** Background `#FAF9F6` (Gallery alabaster), Cards `#FFFFFF`, Text `#0A0A0A` (Obsidian), Accent `#C5A059` (Champagne Gold), hairlines `#E6E2DD`.
   - **Fonts:** Editorial Serif (`Bodoni Moda` / `Playfair Display`) + Sans (`Inter`).
   - **Geometry:** zero border radius everywhere, 0.5px hairlines, centred museum layouts, asymmetric diptychs, roman numerals, lookbook cards without boxes.

4. **`vault` (`/vault`) - "The Brass Vault" (Gentlemen's EDC, Barware & Executive)**
   - **Vibe:** Dark Mode, masculine, industrial bespoke, solid brass lighters, titanium cardholders, knives, luxury pens, hip flasks.
   - **Palette:** Background `#0B0C0E` (Carbon gunmetal), Surface `#131519` (Machined slate), borders `#262930` (Brushed steel), Text `#F3F4F6`, Accent `#D97736` (Molten copper).
   - **Fonts:** Technical Sans (`Space Grotesk`) + Mono (`JetBrains Mono`).
   - **Geometry:** 2px industrial corners, exposed 4rem CAD blueprint grid, `+` crosshairs and copper corner brackets, millimetre rulers, telemetry strip, monospace SKUs and machine codes.

5. **`corporate` (`/corporate`) - "Maison Bespoke" (B2B, HoReCa & Mountain Cabins)**
   - **Vibe:** Architectural, structured, heavy brass hotel/cabin key fobs, trophy plaques, executive gifts, volume calculation tiers.
   - **Palette:** Background `#E8E6E1` (Raw limestone), Cells `#F7F6F2`, Text & grid `#121212` (Architectural black), Accent `#8C5A32` (International bronze).
   - **Fonts:** Expanded Sans (`Archivo`, width 125%) + Mono (`IBM Plex Mono`).
   - **Geometry:** exposed Swiss grid of continuous 1px black rules shared between cells, numbered index markers (`01 / 04`, `N° 01`), specification-sheet tables, volume tier bars on every product.

**Universal Navigation & Cart Rule:**
- A sleek top bar ("Atelier Switcher") allows switching between branches at any time.
- The **Slide-Over Universal Cart** holds items from ANY branch simultaneously, dynamically adapting its visual theme to whichever branch the user is currently viewing, and showing a subtle branch badge next to each cart item.

## 4. Product Personalization Configurator (Type A - Clean & Rapid, No Canvas Lag)
On every product page (`/ [branch] / produs / [slug]`), do NOT build a laggy 2D canvas overlay. Instead, build a luxury, structured **Step-by-Step Engraving Configurator**:
1. **Material / Finish Variant Selector** (e.g., Alamă Masivă Periată, Inox Chirurgical 316L, Argint 925).
2. **Engraving Side Selector:**
   - Doar Față (Inclus în preț)
   - Față + Verso (+XX RON dynamic price bump)
3. **Typography Selector (Visual Pill Buttons rendered in the actual font):**
   - *Classic Roman* (Garamond), *Monogram Script* (Great Vibes / Snell), *Modern Geometric* (Montserrat), *Technical Block* (Cinzel), *Minimal Sans* (Inter).
4. **Text Input with Live Character & Line Counter:**
   - Dynamic validation based on the product's physical dimensions (`maxCharsPerLine`, `maxLines`).
   - Separate inputs for Line 1, Line 2, Line 3 (Front) and Line 1, Line 2, Line 3 (Back) — e.g., for Pet Tags: Front = Pet Name, Back = Owner Phone & "Cip: Da".
5. **Predefined Vector Symbol Library (Visual Grid Picker):**
   - Categorized clean SVG icons ready for M20 engraving: *Pet* (Paw, Bone, Crown, Heart, Mountain), *Jewelry* (Infinity, Zodiac signs, Cross, Star, Floral), *EDC* (Compass, Anchor, Shield, Monogram Crest).
6. **Custom Sketch / Vector Upload (Optional Toggle):**
   - Allows uploading a photo of handwriting, a child's drawing, a pet paw print, or a company logo (+XX RON vectorization fee).
7. **Gift Packaging Upgrade:**
   - Cutie rigidă de atelier cu inserție de catifea + Certificat de Gravură Mecanică (+XX RON).

## 5. Owner-Only Admin Portal & Gravograph M20 Production Queue (`/admin`)
Protected by strict authentication. Contains 4 modules:

### Module A: Dashboard & Analytics
- Revenue by Branch (Pet vs Jewelry vs Vault vs Corporate).
- Machine load distribution across the 3 M20 units.
- Urgent orders & low-stock blank alerts (e.g., "Mais ai doar 4 medalioane de alamă 30mm").

### Module B: M20 Workshop Production Queue (`/admin/production`)
Specifically engineered for the owner's 3 Gravograph M20 machines:
- **Machine Fleet Columns / Filters:**
  1. `M20_NEW_GEN` (Latest Gen M20 — auto-suggested for `jewelry` branch, 925 Silver, Cufflinks, fine micro-engravings).
  2. `M20_OLD_GEN_1` (Previous Gen M20 #1 — auto-suggested for `pet` & `vault` heavy brass/stainless steel items).
  3. `M20_OLD_GEN_2` (Previous Gen M20 #2 — auto-suggested for `corporate` batch runs, large plaques, or backup).
- **Order Workflow Statuses (Kanban or Filterable Table):**
  - `PAID_NEW` (Plătită - Nouă)
  - `ASSIGNED_TO_M20` (Alocată pe Mașină)
  - `ENGRAVING` (În Gravare)
  - `FINISHING_ULTRASONIC` (Curățare Ultrasunete & Lustruire)
  - `PACKAGING` (În Ambalare Premium)
  - `SHIPPED` (Expediată + AWB)
- **1-Click "Export Fișă Gravostyle (SVG + Job Sheet)":**
  - Each order item has an **"Export SVG (mm)"** button.
  - Generates a downloadable `.svg` file where the `width` and `height` attributes are strictly in **millimeters (`mm`)** matching the product's exact physical engraving area (`engraveWidthMm`, `engraveHeightMm`), containing the centered text in the selected font and the chosen vector symbol SVG path. This allows immediate drag-and-drop into Gravostyle without manual resizing.
  - Also includes a printable **"Fișă de Atelier (PDF/Print View)"** showing: Machine assigned, Blank SKU, Physical dimensions, Tool tip recommendation (Diamond vs Rotary cutter + depth), Front/Back text, Symbol preview, and Packaging notes.

### Module C: Product & Blank Inventory Manager (`/admin/products`)
- Full CRUD for products across all branches.
- Technical M20 Metadata per product:
  - `blankSku` (codul semifabricatului în atelier)
  - `material` (Alamă, Inox 316L, Argint 925, Piele, Lemn/Ceramică)
  - `engraveWidthMm` & `engraveHeightMm` (dimensiunea exactă a zonei de gravat în mm)
  - `recommendedMachine` (`M20_NEW_GEN`, `M20_OLD_GEN_1`, `M20_OLD_GEN_2`)
  - `engravingMethod` (`DIAMOND_DRAG` vs `ROTARY_MILLING`)
  - `stockQuantity` (numărul de semifabricate fizice disponibile)

### Module D: Customer Orders & AWB Management (`/admin/orders`)
- View billing/shipping details (Persoană Fizică sau Juridică - CUI/Reg. Com.).
- Input Courier Name & AWB Number -> triggers automated shipping email via Resend.

## 6. Implementation Conventions (codebase map)
- **Commands:** `npm run dev` · `npm run build` · `npm run lint` · `npm run typecheck` · `npm run db:migrate` · `npm run db:seed` (Prisma 7 + `@prisma/adapter-pg`; config in `prisma.config.ts`, client generated to `src/generated/prisma`, git-ignored, regenerated on `postinstall`). Migrations and the seed prefer `DATABASE_URL_UNPOOLED` when it is set (direct connection behind a pooler). Access the database only through `db()` from `src/lib/prisma.ts` (created lazily, so `next build` runs without `DATABASE_URL`; every page that shows products needs it at runtime).
- **Theme tokens:** `src/app/globals.css` defines every atelier as `--b-*` variables under `[data-branch="…"]`. Use the semantic Tailwind utilities (`bg-bg`, `bg-surface`, `bg-panel` (card fill), `text-ink`, `text-muted`, `border-line`, `border-grid` (structural rules), `bg-accent`, `text-accent-ink`, `text-metal`, `text-metal-text`, `font-display`, `font-mono`, `rounded-branch`, `rounded-branch-lg`, `text-hero`, `text-h2`, `text-card`) and the component utilities (`display`, `wordmark`, `eyebrow`, `btn btn-primary`, `btn btn-ghost`, `texture`). Never hard-code a branch colour in a component — set `data-branch` on a subtree instead (cards, badges and previews re-theme themselves this way).
- **Branch design systems:** the four storefronts differ in structure, not only colour. `src/components/branch/` holds one variant per atelier of the hero (`BranchHero`), product card and grid (`BranchProductCard`, `BranchProductGrid`), section header, pillars, craft and cross-links (`BranchSections`) and the product page wrappers (`ProductPage`). `src/app/branch-systems.css` holds the geometry layer: decorative primitives (`.stitch`, `.corner-brackets`, `.ruler-x/y`, `.molten`), per-atelier button shapes, and the configurator re-cut through its `cfg-*` class hooks (`cfg-step`, `cfg-step-index`, `cfg-option`, `cfg-font`, `cfg-input`, `cfg-toggle`, `cfg-summary`, `cfg-preview`…), so the configurator's logic stays shared. New storefront UI needs a variant for each atelier (or a `PANEL[branch]` frame). The umbrella hub keeps `src/components/product/ProductCard.tsx`.
- **SEO:** `src/lib/site.ts` resolves the public origin (`NEXT_PUBLIC_SITE_URL`, else Vercel's `VERCEL_PROJECT_PRODUCTION_URL`) used as `metadataBase`; indexable pages build their metadata with `pageMetadata()` (canonical, Open Graph, Twitter), and each atelier carries `seoTitle` / `seoDescription` in `branches.ts`. JSON-LD comes from `src/lib/structured-data.ts` (Organization, WebSite, CollectionPage, Product + Offer in RON with the no-return policy for personalised goods, BreadcrumbList) rendered by `<JsonLd>`, which escapes `<`. `src/app/sitemap.ts` lists active products live from PostgreSQL; `src/app/robots.ts` keeps `/admin`, `/api/`, `/checkout` and `/comanda/` out of the index, and those pages also carry `noindex`. `next.config.ts` sets `htmlLimitedBots: /.*/`, so metadata is always in the initial `<head>`. Share images are `opengraph-image.tsx` routes (hub, atelier, product) drawn by `src/lib/server/og-image.tsx` with next/og: the product's own `ProductVisual` drawing (flattened to plain SVG, text dropped) in each atelier's layout, using the OFL fonts in `assets/og-fonts/`. Satori cannot read CSS variables, so that file repeats each atelier's palette: update it with `globals.css`. The product JSON-LD `image` points at the same route.
- **Fonts:** all families are loaded with `next/font/google` in `src/app/fonts.ts` (latin-ext for ă â î ș ț) and exposed as CSS variables on `<html>`.
- **Routing:** `src/app/(umbrella)` = `/`; `src/app/[branch]` = the four storefronts (static params, unknown segments 404); product pages live at `/[branch]/produs/[slug]`. `BranchShell` wraps every page with the Atelier Switcher, masthead, footer and the Universal Cart drawer.
- **Catalogue:** PostgreSQL is the source of truth, edited in `/admin/products` (dimensions in mm, prices in bani = RON × 100). `src/lib/seed-data.ts` only bootstraps it: `npm run db:seed` adds missing products and leaves existing ones alone (`-- --reset` rewrites them, `-- --if-empty` only seeds an empty catalogue). The storefront reads the active catalogue through `src/lib/server/catalog.ts` (`unstable_cache`, tag `catalog`); pages that show products are `force-dynamic`. Call `invalidateCatalog()` from a server action or route handler after any product or stock change — never during render.
- **Domain constants:** branch copy in `src/lib/branches.ts`; materials, M20 machines, engraving methods and the order workflow in `src/lib/workshop.ts`; shared types (mirroring Prisma enums) in `src/lib/types.ts`.
- **Product imagery:** until photography exists, `src/components/product/ProductVisual.tsx` draws each blank to scale from its mm data (`visual` key per product); shared metal gradients live in `MaterialDefs.tsx`.
- **Configurator:** `src/components/engraving/EngravingConfigurator.tsx` (client) drives the product page. The engraving model, fonts, line limits and validation live in `src/lib/engraving.ts`; price rules and the vectorisation / gift-box fees in `src/lib/pricing.ts`; the vector symbol library (24 × 24 single-stroke paths, reused by the SVG export) in `src/lib/symbols.ts`. Per-line placeholders come from `frontLineHints` / `backLineHints` on each product.
- **Uploads:** `POST /api/uploads` sniffs magic bytes (PNG, JPG, WEBP, HEIC, PDF, SVG), caps size at 4 MB (`MAX_UPLOAD_MB` in `src/lib/uploads.ts`; serverless hosts cap request bodies at ~4.5 MB) and stores the file in the `Upload` table through `src/lib/server/sketches.ts`. Files are never served publicly; only `GET /api/admin/uploads/[id]` returns them, as a sandboxed download.
- **Cart:** Zustand store with `persist` in `src/store/useCartStore.ts`. Each line stores its full `EngravingConfig` plus a `LinePricing` snapshot that `quoteLine()` re-prices when quantity changes. Gate persisted values behind `useHydrated()` to avoid hydration mismatches. Checkout must re-validate and re-price server-side from the catalogue.
- **Server-only code** lives in `src/lib/server/` and starts with `import "server-only"`: catalogue reads, order services, Stripe, admin queries and mutations, owner credentials.
- **Checkout & orders:** `/checkout` calls the `placeOrder` server action, which re-validates the customer (`src/lib/checkout.ts`: PF/PJ, CUI checksum, Reg. Com., phone, county, postal code) and re-prices every line from PostgreSQL before creating the order in `PENDING_PAYMENT`. Payment is either hosted Stripe Checkout restricted to cards (`allowed_payment_method_types: ["card"]`) or the development simulation. `markOrderPaid()` in `src/lib/server/orders.ts` is the only transition to `PAID_NEW`: it sets each `OrderItem.assignedMachine` from the product's `recommendedMachine`, decrements blank stock and writes an `OrderStatusEvent`; it is idempotent. Stripe reaches it through `/api/stripe/webhook` (`checkout.session.completed`, `checkout.session.expired`) or the success-page fallback, both via `settleCheckoutSession()`, which checks session id, amount and currency.
- **Payment simulation:** on under `next dev`, or with `PAYMENT_SIMULATION=true`; always off when `STRIPE_SECRET_KEY` is a live key. Orders paid this way are flagged `isSimulated`.
- **Tracking:** `/comanda/[orderNumber]?cheie=<accessToken>` shows the order and the workshop timeline (refreshes every 15 s). Without a valid key it only shows an e-mail lookup form, never order data. In simulation mode a button advances the order one station at a time.
- **Customer accounts:** `/autentificare` (sign-in / registration tabs, reset request), `/autentificare/resetare` and `/contul-meu` (`comenzi`, `profil`, sign-out). Sessions are separate from the admin's Auth.js: `src/lib/server/customer-auth.ts` sets an httpOnly `mg_cont` cookie with a random token whose SHA-256 is stored in `CustomerSession` (30 days); `currentCustomer()` / `requireCustomer(returnTo)` read it, and a customer session never passes `requireAdmin()`. Every `/contul-meu` page calls `requireCustomer()` with its own path (the layout only reads the session). Registration, sign-in throttling, password reset (one-hour single-use `PasswordResetToken`, e-mail through `src/lib/server/email.ts` / Resend, all sessions revoked on reset), profile and order history live in `src/lib/server/customers.ts`; form rules in `src/lib/account.ts` (password minimum 6). Orders link to `User` through nullable `Order.userId`: set when a signed-in customer checks out, or when a guest ticks "creez un cont" (the account is created with the order and signed in). Guest orders are never attached by e-mail, because e-mails are not verified. The history shows paid orders only. `User.role` exists, but the admin portal still signs in with the owner credentials.
- **Admin auth:** Auth.js v5 credentials provider for a single owner account (`ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, `AUTH_SECRET`; `npm run admin:credentials -- "<parolă>"` prints the hash and secret). The hash format is `scrypt:N:r:p:salt:hash` (`src/lib/password.ts`); failed logins are throttled in memory. `src/auth.config.ts` is edge-safe and shared with `src/middleware.ts`, which guards `/admin/*` (redirect to `/admin/login`) and `/api/admin/*` (401 JSON). Middleware is not the only gate: every admin page, server action and route handler calls `requireAdmin()` or `adminSession()` from `src/lib/server/admin-auth.ts`.
- **Admin portal:** pages live in `src/app/admin/(portal)` (dashboard, `production`, `orders`, `products`, `customers`) behind one layout; components in `src/components/admin`. Queries and order mutations are in `src/lib/server/admin.ts` (station moves only go one step at a time; `SHIPPED` only through `shipOrder()` with courier + AWB), product mutations in `src/lib/server/admin-products.ts`. Server actions return `{ ok?, error? }` and finish with `revalidatePath("/admin", "layout")`. A product that has order items cannot be deleted, only deactivated.
- **Product editor:** `src/lib/product-schema.ts` holds `normalizeProduct()` (also the shape guard for untrusted action input) and `validateProduct()` (field-path errors such as `variants.1.name`); the client form and the `saveProduct` action run both. Variants and volume tiers are replaced inside one transaction; slug and blank SKU uniqueness is checked against the database.
- **Gravostyle export:** `src/lib/gravostyle-svg.ts` builds one SVG per side with `width`/`height` in mm and `viewBox="0 0 W H"` equal to the engraving area. Layer `GHID` holds cyan 0.1 mm guides (true-scale blank outline from `blankGuidePath()`, which may extend past the canvas, plus the dashed engraving zone); layer `GRAVURA` holds the symbol paths and the centred text in the chosen font. Shared blank proportions live in `src/lib/blank-geometry.ts` (also used by `ProductVisual`). Downloads come from `GET /api/admin/svg/[itemId]/fata|verso`.
- **Blank snapshot:** each `OrderItem` stores `blankSpec` (JSON, `src/lib/blank-spec.ts`) at order time, so exports and job sheets keep the dimensions the customer bought even after the product is edited. Read it through `specForItem()`.
- **Job sheet:** `JobSheet` renders the printable "Fișă tehnică de atelier"; `JobSheetDialog` portals it into a native `<dialog class="print-sheet">` on `<body>`, and the print stylesheet in `globals.css` hides every other child of `<body>`.
- **Deployment:** Vercel (`vercel.json`: build command `npm run vercel-build`, functions in `fra1`) with Neon PostgreSQL in Frankfurt. `scripts/vercel-build.sh` runs `prisma migrate deploy` and the `--if-empty` seed before `next build`, and skips both when `DATABASE_URL` is missing. New schema changes need a committed migration in `prisma/migrations`.
