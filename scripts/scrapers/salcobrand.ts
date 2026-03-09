/**
 * Scraper Salcobrand — Playwright con intercepción de red
 */
import { newContext } from "./browser.js";
import type { PrecioScrapeado } from "./types.js";

const CADENA = "salcobrand";

export async function scrapeSalcobrand(query: string): Promise<PrecioScrapeado[]> {
  const context = await newContext();
  const page = await context.newPage();
  const results: PrecioScrapeado[] = [];

  try {
    page.on("response", async (response) => {
      const url = response.url();
      const ct = response.headers()["content-type"] ?? "";
      if (!ct.includes("json")) return;

      if (
        url.includes("/search") ||
        url.includes("/products") ||
        url.includes("query=") ||
        url.includes("q=")
      ) {
        try {
          const data = await response.json();
          const products = Array.isArray(data)
            ? data
            : data?.products ?? data?.hits ?? data?.items ?? data?.data ?? [];

          for (const p of (products as Record<string, unknown>[]).slice(0, 5)) {
            const precio =
              (p.price as number) ??
              (p.selling_price as number) ??
              ((p as { offer?: { price?: number } }).offer?.price) ??
              0;
            if (precio > 0) {
              results.push({
                query,
                nombre_producto: (p.name ?? p.productName ?? query) as string,
                precio: Math.round(precio),
                stock: (p.available ?? p.in_stock ?? true) as boolean,
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
      `https://salcobrand.cl/t/buscar?q=${encodeURIComponent(query)}`,
      { waitUntil: "networkidle", timeout: 20_000 }
    );

    if (results.length === 0) {
      const precios = await page.$$eval(
        "[class*='price'], [class*='Price'], [class*='precio'], span[class*='value']",
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
    console.warn(`[salcobrand] Error scraping "${query}":`, (e as Error).message);
  } finally {
    await context.close();
  }

  return results;
}
