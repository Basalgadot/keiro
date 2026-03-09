/**
 * Scraper Farmacias Ahumada — Playwright con intercepción de red
 */
import { newContext } from "./browser.js";
import type { PrecioScrapeado } from "./types.js";

const CADENA = "ahumada";

export async function scrapeAhumada(query: string): Promise<PrecioScrapeado[]> {
  const context = await newContext();
  const page = await context.newPage();
  const results: PrecioScrapeado[] = [];

  try {
    page.on("response", async (response) => {
      const url = response.url();
      const ct = response.headers()["content-type"] ?? "";
      if (!ct.includes("json")) return;

      if (url.includes("/search") || url.includes("/products") || url.includes("query=")) {
        try {
          const data = await response.json();
          const products = Array.isArray(data)
            ? data
            : data?.products ?? data?.hits ?? data?.items ?? [];

          for (const p of (products as Record<string, unknown>[]).slice(0, 5)) {
            const offer = (p as { items?: { sellers?: { commertialOffer?: { Price?: number; ListPrice?: number; IsAvailable?: boolean } }[] }[] }).items?.[0]?.sellers?.[0]?.commertialOffer;
            const precio = offer?.Price ?? (p.price as number) ?? 0;
            if (precio > 0) {
              results.push({
                query,
                nombre_producto: (p.productName ?? p.name ?? query) as string,
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
          // ignorar
        }
      }
    });

    await page.goto(
      `https://www.ahumada.cl/buscar?q=${encodeURIComponent(query)}`,
      { waitUntil: "networkidle", timeout: 20_000 }
    );

    if (results.length === 0) {
      const precios = await page.$$eval(
        "[class*='price'], [class*='Price'], [class*='precio']",
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
    console.warn(`[ahumada] Error scraping "${query}":`, (e as Error).message);
  } finally {
    await context.close();
  }

  return results;
}
