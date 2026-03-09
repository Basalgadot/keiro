/**
 * Scraper Farmacias Ahumada — VTEX
 * API: https://www.ahumada.cl/api/catalog_system/pub/products/search/{query}
 */
import type { PrecioScrapeado } from "./types.js";

const BASE = "https://www.ahumada.cl";
const CADENA = "ahumada";

interface VtexOffer {
  Price: number;
  ListPrice: number;
  IsAvailable: boolean;
}
interface VtexItem {
  sellers: { commertialOffer: VtexOffer }[];
}
interface VtexProduct {
  productName: string;
  link: string;
  items: VtexItem[];
}

export async function scrapeAhumada(query: string): Promise<PrecioScrapeado[]> {
  const url = `${BASE}/api/catalog_system/pub/products/search/${encodeURIComponent(query)}?_from=0&_to=5`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; KeiroPriceBot/1.0)",
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    console.warn(`[ahumada] HTTP ${res.status} para "${query}"`);
    return [];
  }

  const products: VtexProduct[] = await res.json();

  return products
    .map((p) => {
      const offer = p.items?.[0]?.sellers?.[0]?.commertialOffer;
      if (!offer || offer.Price <= 0) return null;
      return {
        query,
        nombre_producto: p.productName,
        precio: Math.round(offer.Price),
        precio_normal: offer.ListPrice > offer.Price ? Math.round(offer.ListPrice) : undefined,
        stock: offer.IsAvailable,
        url: `${BASE}${p.link}`,
        cadena: CADENA,
      } satisfies PrecioScrapeado;
    })
    .filter((p): p is PrecioScrapeado => p !== null);
}
