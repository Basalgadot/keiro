/**
 * Scraper Cruz Verde — VTEX
 * Account name VTEX: "cruzverdefarmacia" (por confirmar — timeout incluso con ScraperAPI).
 * www.cruzverde.cl puede ser que use un account VTEX diferente.
 * TODO: Inspeccionar HTML de cruzverde.cl para confirmar el account name correcto.
 */
import type { PrecioScrapeado } from "./types.js";
import { fetchProxy } from "./fetch-proxy.js";

const VTEX_ACCOUNT = "cruzverdefarmacia";
const BASE = `https://${VTEX_ACCOUNT}.vtexcommercestable.com.br`;
const CADENA = "cruzverdefarmacia";

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

export async function scrapeCV(query: string): Promise<PrecioScrapeado[]> {
  const url = `${BASE}/api/catalog_system/pub/products/search/${encodeURIComponent(query)}?_from=0&_to=5`;

  const res = await fetchProxy(url);

  if (!res.ok) {
    console.warn(`[cruz-verde] HTTP ${res.status} para "${query}"`);
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
        url: `https://www.cruzverdefarmacia.cl${p.link}`,
        cadena: CADENA,
      } satisfies PrecioScrapeado;
    })
    .filter((p): p is PrecioScrapeado => p !== null);
}
