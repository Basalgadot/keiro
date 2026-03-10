/**
 * Scraper Farmacias Ahumada — VTEX infrastructure endpoint
 * Ahumada es parte del grupo Socofar (mismo grupo que Cruz Verde).
 * Account name VTEX: "ahumada"
 */
import type { PrecioScrapeado } from "./types.js";

const VTEX_ACCOUNT = "ahumada";
const BASE = `https://${VTEX_ACCOUNT}.vtexcommercestable.com.br`;
const CADENA = "ahumada";

interface VtexOffer {
  Price: number;
  ListPrice: number;
  IsAvailable: boolean;
}
interface VtexProduct {
  productName: string;
  link: string;
  items: { sellers: { commertialOffer: VtexOffer }[] }[];
}

export async function scrapeAhumada(query: string): Promise<PrecioScrapeado[]> {
  const url = `${BASE}/api/catalog_system/pub/products/search/${encodeURIComponent(query)}?_from=0&_to=5`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; KeiroPriceBot/1.0)",
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(15_000),
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
        url: `https://www.ahumada.cl${p.link}`,
        cadena: CADENA,
      } satisfies PrecioScrapeado;
    })
    .filter((p): p is PrecioScrapeado => p !== null);
}
