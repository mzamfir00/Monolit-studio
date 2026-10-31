// schema.org JSON-LD for search engines: the business, each atelier's collection and every product offer.

import { ATELIERS } from "./branches";
import { FREE_SHIPPING_FROM_BANI, SHIPPING_FEE_BANI } from "./pricing";
import { formatRon } from "./format";
import { SITE_NAME, absoluteUrl, clampDescription } from "./site";
import type { Branch, CatalogProduct } from "./types";
import { ENGRAVING_METHODS, MATERIAL_LABELS } from "./workshop";

type Json = Record<string, unknown>;

const CONTEXT = "https://schema.org";
const ron = (bani: number) => (bani / 100).toFixed(2);

export const productPath = (product: CatalogProduct) => `${ATELIERS[product.branch].href}/produs/${product.slug}`;

/** Search-result description: what it is, how it is engraved, price and lead time. */
export function productMetaDescription(product: CatalogProduct): string {
  const method = ENGRAVING_METHODS[product.engravingMethod].label.toLowerCase();
  const label = MATERIAL_LABELS[product.material];
  const material = `${label[0].toLowerCase()}${label.slice(1)}`; // "Inox chirurgical 316L" → "inox chirurgical 316L"
  const sides = product.backEngravingAvailable ? ", față și verso" : "";
  return clampDescription(
    `${product.subtitle}. ${method[0].toUpperCase()}${method.slice(1)} pe ${material}${sides}. ${formatRon(product.priceBani)} · gata în ${product.leadTimeDays} zile lucrătoare.`,
  );
}

export function organizationLd(): Json {
  return {
    "@context": CONTEXT,
    "@type": "Organization",
    "@id": absoluteUrl("/#organizatie"),
    name: SITE_NAME,
    url: absoluteUrl("/"),
    logo: absoluteUrl("/icon.svg"),
    description: ATELIERS.umbrella.seoDescription,
    areaServed: { "@type": "Country", name: "România" },
    brand: (["pet", "jewelry", "vault", "corporate"] as const).map((branch) => ({
      "@type": "Brand",
      name: ATELIERS[branch].name,
      url: absoluteUrl(ATELIERS[branch].href),
    })),
  };
}

export function websiteLd(): Json {
  return {
    "@context": CONTEXT,
    "@type": "WebSite",
    name: SITE_NAME,
    url: absoluteUrl("/"),
    inLanguage: "ro-RO",
    publisher: { "@id": absoluteUrl("/#organizatie") },
  };
}

export function breadcrumbLd(trail: Array<[name: string, path: string]>): Json {
  return {
    "@context": CONTEXT,
    "@type": "BreadcrumbList",
    itemListElement: trail.map(([name, path], index) => ({
      "@type": "ListItem",
      position: index + 1,
      name,
      item: absoluteUrl(path),
    })),
  };
}

/** The atelier's collection page with its products in display order. */
export function collectionLd(branch: Branch, products: CatalogProduct[]): Json {
  const atelier = ATELIERS[branch];
  return {
    "@context": CONTEXT,
    "@type": "CollectionPage",
    name: `${atelier.seoTitle} · ${atelier.name}`,
    description: atelier.seoDescription,
    url: absoluteUrl(atelier.href),
    inLanguage: "ro-RO",
    isPartOf: { "@type": "WebSite", name: SITE_NAME, url: absoluteUrl("/") },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: products.length,
      itemListElement: products.map((product, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: product.name,
        url: absoluteUrl(productPath(product)),
      })),
    },
  };
}

/**
 * Product with its offer. Engraved pieces are made to order, so returns are not accepted
 * (OUG 34/2014 excepts personalised goods); shipping follows the checkout rule (free from 500 RON).
 */
export function productLd(product: CatalogProduct): Json {
  const atelier = ATELIERS[product.branch];
  const url = absoluteUrl(productPath(product));
  const size = (value: number, unitCode: string) => ({ "@type": "QuantitativeValue", value, unitCode });
  return {
    "@context": CONTEXT,
    "@type": "Product",
    name: product.name,
    description: product.description,
    sku: product.blankSku,
    url,
    image: [absoluteUrl(`${productPath(product)}/opengraph-image`)],
    brand: { "@type": "Brand", name: atelier.name },
    category: atelier.category,
    material: MATERIAL_LABELS[product.material],
    width: size(product.widthMm, "MMT"),
    height: size(product.heightMm, "MMT"),
    depth: size(product.depthMm, "MMT"),
    weight: size(product.weightGrams, "GRM"),
    additionalProperty: [
      { "@type": "PropertyValue", name: "Tehnică de gravare", value: ENGRAVING_METHODS[product.engravingMethod].label },
      {
        "@type": "PropertyValue",
        name: "Zonă de gravură",
        value: `${product.engraveWidthMm} × ${product.engraveHeightMm} mm`,
      },
    ],
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "RON",
      price: ron(product.priceBani),
      availability: product.stockQuantity > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@id": absoluteUrl("/#organizatie") },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "RO",
        returnPolicyCategory: "https://schema.org/MerchantReturnNotPermitted",
      },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: {
          "@type": "MonetaryAmount",
          value: ron(product.priceBani >= FREE_SHIPPING_FROM_BANI ? 0 : SHIPPING_FEE_BANI),
          currency: "RON",
        },
        shippingDestination: { "@type": "DefinedRegion", addressCountry: "RO" },
      },
    },
  };
}
