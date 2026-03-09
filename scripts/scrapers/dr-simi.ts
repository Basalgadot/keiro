/**
 * Scraper Dr. Simi — API REST propia
 * Endpoint a confirmar. Ver instrucciones en README del scraper.
 *
 * Para obtener el endpoint correcto:
 * 1. Abrir https://www.drsimi.cl en Chrome
 * 2. DevTools → Network → XHR
 * 3. Buscar "paracetamol" en el buscador
 * 4. Copiar la URL de la request que retorna JSON con productos
 * 5. Reemplazar BASE y el path de búsqueda abajo
 */
import type { PrecioScrapeado } from "./types.js";

const BASE = "https://www.drsimi.cl";
const CADENA = "drsimi";

export async function scrapeDrSimi(query: string): Promise<PrecioScrapeado[]> {
  // TODO: verificar el endpoint correcto de Dr. Simi
  // Posibles candidatos:
  //   /api/products/search?q={query}
  //   /catalogsearch/result/?q={query}  (Magento)
  const url = `${BASE}/api/catalog_system/pub/products/search/${encodeURIComponent(query)}?_from=0&_to=5`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; KeiroPriceBot/1.0)",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      console.warn(`[dr-simi] HTTP ${res.status} — endpoint puede necesitar ajuste`);
      return [];
    }

    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data
      .map((p: { productName?: string; link?: string; items?: { sellers?: { commertialOffer?: { Price?: number; ListPrice?: number; IsAvailable?: boolean } }[] }[] }) => {
        const offer = p.items?.[0]?.sellers?.[0]?.commertialOffer;
        if (!offer || !offer.Price || offer.Price <= 0) return null;
        return {
          query,
          nombre_producto: p.productName ?? query,
          precio: Math.round(offer.Price),
          precio_normal: offer.ListPrice && offer.ListPrice > offer.Price ? Math.round(offer.ListPrice) : undefined,
          stock: offer.IsAvailable ?? true,
          url: p.link ? `${BASE}${p.link}` : undefined,
          cadena: CADENA,
        } satisfies PrecioScrapeado;
      })
      .filter((p): p is PrecioScrapeado => p !== null);
  } catch {
    console.warn(`[dr-simi] Error — verificar endpoint`);
    return [];
  }
}
