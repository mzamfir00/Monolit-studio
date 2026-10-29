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
   - **Palette:** Background `#F4EFE6` (Warm Sand), Surface `#EAE2D3`, Text `#23201C`, Accent `#2A4034` (Forest Green) & `#C87D55` (Terracotta/Brass).
   - **Fonts:** Serif (`Fraunces`) + Sans (`Plus Jakarta Sans`).

3. **`jewelry` (`/jewelry`) - "Maison Aurum" (Fine Jewelry & Ceremonial Keepsakes)**
   - **Vibe:** High-fashion editorial, ultra-clean white/ivory space, macro diamond-cut textures, 925 silver pendants, cufflinks, baptism silver coins/spoons, heavy brass love locks.
   - **Palette:** Background `#FCFCFA` (Pure Ivory), Surface `#F5F4F0`, Text `#0F0F0F`, Accent `#C5A059` (Champagne Gold).
   - **Fonts:** Editorial Serif (`Bodoni Moda` / `Playfair Display`) + Sans (`Inter`).

4. **`vault` (`/vault`) - "The Brass Vault" (Gentlemen's EDC, Barware & Executive)**
   - **Vibe:** Dark Mode, masculine, industrial bespoke, solid brass lighters, titanium cardholders, knives, luxury pens, hip flasks.
   - **Palette:** Background `#121316` (Charcoal Obsidian), Surface `#1C1E24`, Text `#F3F4F6`, Accent `#B87333` (Aged Copper / Cognac Leather).
   - **Fonts:** Technical Sans (`Space Grotesk`) + Mono (`JetBrains Mono`).

5. **`corporate` (`/corporate`) - "Maison Bespoke" (B2B, HoReCa & Mountain Cabins)**
   - **Vibe:** Architectural, structured, heavy brass hotel/cabin key fobs, trophy plaques, executive gifts, volume calculation tiers.
   - **Palette:** Background `#EDEEEB` (Travertine), Surface `#E2E4E0`, Text `#14181F` (Graphite), Accent `#1B2A3A` (Architectural Navy) & `#A88B5A` (Satin Brass).
   - **Fonts:** Expanded Sans (`Archivo`, width 125%) + Mono (`IBM Plex Mono`).

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
- **Commands:** `npm run dev` · `npm run build` · `npm run lint` · `npm run typecheck` · `npm run db:migrate` · `npm run db:seed` (Prisma 7 + `@prisma/adapter-pg`; config in `prisma.config.ts`, client generated to `src/generated/prisma`, git-ignored, regenerated on `postinstall`). Access the database only through `db()` from `src/lib/prisma.ts` (created lazily, so the static storefront builds without `DATABASE_URL`).
- **Theme tokens:** `src/app/globals.css` defines every atelier as `--b-*` variables under `[data-branch="…"]`. Use the semantic Tailwind utilities (`bg-bg`, `bg-surface`, `text-ink`, `text-muted`, `border-line`, `bg-accent`, `text-accent-ink`, `text-metal`, `text-metal-text`, `font-display`, `font-mono`, `rounded-branch`, `rounded-branch-lg`, `text-hero`, `text-h2`, `text-card`) and the component utilities (`display`, `wordmark`, `eyebrow`, `btn btn-primary`, `btn btn-ghost`, `texture`). Never hard-code a branch colour in a component — set `data-branch` on a subtree instead (cards, badges and previews re-theme themselves this way).
- **Fonts:** all families are loaded with `next/font/google` in `src/app/fonts.ts` (latin-ext for ă â î ș ț) and exposed as CSS variables on `<html>`.
- **Routing:** `src/app/(umbrella)` = `/`; `src/app/[branch]` = the four storefronts (static params, unknown segments 404); product pages live at `/[branch]/produs/[slug]`. `BranchShell` wraps every page with the Atelier Switcher, masthead, footer and the Universal Cart drawer.
- **Catalogue:** `src/lib/seed-data.ts` is the product source of truth (dimensions in mm, prices in bani = RON × 100). The storefront reads it through `src/lib/catalog.ts`; `prisma/seed.ts` upserts the same data into PostgreSQL. Move `catalog.ts` to Prisma queries when the admin CRUD lands.
- **Domain constants:** branch copy in `src/lib/branches.ts`; materials, M20 machines, engraving methods and the order workflow in `src/lib/workshop.ts`; shared types (mirroring Prisma enums) in `src/lib/types.ts`.
- **Product imagery:** until photography exists, `src/components/product/ProductVisual.tsx` draws each blank to scale from its mm data (`visual` key per product); shared metal gradients live in `MaterialDefs.tsx`.
- **Configurator:** `src/components/engraving/EngravingConfigurator.tsx` (client) drives the product page. The engraving model, fonts, line limits and validation live in `src/lib/engraving.ts`; price rules and the vectorisation / gift-box fees in `src/lib/pricing.ts`; the vector symbol library (24 × 24 single-stroke paths, reused by the SVG export) in `src/lib/symbols.ts`. Per-line placeholders come from `frontLineHints` / `backLineHints` on each product.
- **Uploads:** `POST /api/uploads` sniffs magic bytes (PNG, JPG, WEBP, HEIC, PDF, SVG), caps size at 10 MB and writes to `UPLOAD_DIR` (default `./.uploads`, git-ignored). Files are never served back publicly; move to S3/UploadThing before deploying to serverless hosting.
- **Cart:** Zustand store with `persist` in `src/store/useCartStore.ts`. Each line stores its full `EngravingConfig` plus a `LinePricing` snapshot that `quoteLine()` re-prices when quantity changes. Gate persisted values behind `useHydrated()` to avoid hydration mismatches. Checkout must re-validate and re-price server-side from the catalogue.
- **Server-only code** lives in `src/lib/server/` and starts with `import "server-only"`: Prisma catalogue reads for checkout, order services, Stripe.
- **Checkout & orders:** `/checkout` calls the `placeOrder` server action, which re-validates the customer (`src/lib/checkout.ts`: PF/PJ, CUI checksum, Reg. Com., phone, county, postal code) and re-prices every line from PostgreSQL before creating the order in `PENDING_PAYMENT`. Payment is either hosted Stripe Checkout restricted to cards (`allowed_payment_method_types: ["card"]`) or the development simulation. `markOrderPaid()` in `src/lib/server/orders.ts` is the only transition to `PAID_NEW`: it sets each `OrderItem.assignedMachine` from the product's `recommendedMachine`, decrements blank stock and writes an `OrderStatusEvent`; it is idempotent. Stripe reaches it through `/api/stripe/webhook` (`checkout.session.completed`, `checkout.session.expired`) or the success-page fallback, both via `settleCheckoutSession()`, which checks session id, amount and currency.
- **Payment simulation:** on under `next dev`, or with `PAYMENT_SIMULATION=true`; always off when `STRIPE_SECRET_KEY` is a live key. Orders paid this way are flagged `isSimulated`.
- **Tracking:** `/comanda/[orderNumber]?cheie=<accessToken>` shows the order and the workshop timeline (refreshes every 15 s). Without a valid key it only shows an e-mail lookup form, never order data. In simulation mode a button advances the order one station at a time.
