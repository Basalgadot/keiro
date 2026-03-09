/**
 * Scraper Cruz Verde — Playwright con intercepción de red
 * Navega a la página de búsqueda y captura la respuesta JSON del API interno.
 */
import { newContext } from "./browser.js";
import type { PrecioScrapeado } from "./types.js";

const CADENA = "cruzverdefarmacia";

interface CvProduct {
  name?: string;
  productName?: string;
  items?: { sellers?: { commertialOffer?: { Price?: number; ListPrice?: number; IsAvailable?: boolean } }[] }[];
  offers?: { price?: number; priceCurrency?: string }[];
  price?: number;
}

export async function scrapeCV(query: string): Promise<PrecioScrapeado[]> {
  const context = await newContext();
  const page = await context.newPage();
  const results: PrecioScrapeado[] = [];

  try {
    // Intercepta respuestas JSON con productos/precios
    page.on("response", async (response) => {
      const url = response.url();
      const ct = response.headers()["content-type"] ?? "";
      if (!ct.includes("json")) return;

      // Captura respuestas de búsqueda VTEX u otras APIs internas
      if (
        url.includes("/products/search") ||
        url.includes("/search?q=") ||
        url.includes("fullText=") ||
        url.includes("/catalog_system")
      ) {
        try {
          const data = await response.json();
          const products: CvProduct[] = Array.isArray(data) ? data : data?.products ?? data?.data ?? [];
          for (const p of products.slice(0, 5)) {
            const offer = p.items?.[0]?.sellers?.[0]?.commertialOffer;
            const precio = offer?.Price ?? p.price ?? 0;
            if (precio > 0) {
              results.push({
                query,
                nombre_producto: p.productName ?? p.name ?? query,
                precio: Math.round(precio),
                precio_normal:
                  offer?.ListPrice && offer.ListPrice > precio
                    ? Math.round(offer.ListPrice)
                    : undefined,
                stock: offer?.IsAvailable ?? true,
                url: page.url(),
                cadena: CADENA,
              });
            }
          }
        } catch {
          // respuesta no parseable, ignorar
        }
      }
    });

    await page.goto(
      `https://www.cruzverdefarmacia.cl/buscar?q=${encodeURIComponent(query)}`,
      { waitUntil: "networkidle", timeout: 20_000 }
    );

    // Si no se capturó nada por red, intentar extraer del DOM
    if (results.length === 0) {
      const precios = await page.$$eval(
        "[class*='price'], [class*='Price'], [data-testid*='price']",
        (els) =>
          els
            .map((el) => el.textContent?.replace(/[^\d]/g, ""))
            .filter(Boolean)
            .map(Number)
            .filter((n) => n > 100 && n < 500_000)
      );
      if (precios.length > 0) {
        results.push({
          query,
          nombre_producto: query,
          precio: Math.min(...precios),
          stock: true,
          url: page.url(),
          cadena: CADENA,
        });
      }
    }
  } catch (e) {
    console.warn(`[cruz-verde] Error scraping "${query}":`, (e as Error).message);
  } finally {
    await context.close();
  }

  return results;
}
