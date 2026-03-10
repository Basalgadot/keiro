/**
 * Scraper Salcobrand
 *
 * PLATAFORMA: Spree Commerce (Ruby on Rails SPA), NO VTEX.
 * La API Spree v1 requiere autenticación (401 sin token).
 *
 * TODO: Investigar si exponen API pública o usar ScraperAPI para parsear HTML:
 * GET https://www.salcobrand.cl/api/v1/taxons/products?q[name_cont]={query}&per_page=5
 * Requiere: Authorization: Bearer {token} (token de usuario, no disponible públicamente)
 *
 * Alternativa: parsear la página de búsqueda:
 * https://www.salcobrand.cl/search?q={query}
 */
import type { PrecioScrapeado } from "./types.js";

export async function scrapeSalcobrand(_query: string): Promise<PrecioScrapeado[]> {
  // Pendiente: Salcobrand usa Spree Commerce, requiere auth.
  // Ver comentario arriba para opciones de implementación.
  return [];
}
