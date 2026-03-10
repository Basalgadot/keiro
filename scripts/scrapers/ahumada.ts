/**
 * Scraper Farmacias Ahumada
 *
 * PLATAFORMA: Salesforce Commerce Cloud (Demandware), NO VTEX.
 * Detectado via HTML: `/on/demandware.static/Sites-ahumada-cl-Site/`
 *
 * TODO: Implementar con Salesforce OCC API:
 * GET https://www.farmaciasahumada.cl/s/ahumada-cl/dw/shop/v23_1/product_search?q={query}&count=5
 * Requiere client_id de Salesforce (puede obtenerse del JS de la tienda).
 */
import type { PrecioScrapeado } from "./types.js";

export async function scrapeAhumada(_query: string): Promise<PrecioScrapeado[]> {
  // Pendiente: Ahumada usa Salesforce Commerce Cloud, no VTEX.
  // Ver comentario arriba para el endpoint correcto.
  return [];
}
