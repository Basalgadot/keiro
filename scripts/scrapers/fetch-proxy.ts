/**
 * fetch con proxy ScraperAPI — para scraping geo-bloqueado
 *
 * Setup (gratis, 1 min):
 * 1. Crear cuenta en https://scraperapi.com (free: 1,000 requests/mes)
 * 2. Copiar la API key del dashboard
 * 3. Agregar al .env.local:  SCRAPER_API_KEY=tu_key
 * 4. Agregar como Secret en GitHub Actions: SCRAPER_API_KEY
 *
 * Si la key no está configurada, hace fetch directo (puede ser bloqueado).
 */

export async function fetchProxy(
  url: string,
  options?: RequestInit
): Promise<Response> {
  const apiKey = process.env.SCRAPER_API_KEY;

  if (!apiKey) {
    // Sin key configurada: fetch directo
    return fetch(url, options);
  }

  // ScraperAPI: pasa la URL como parámetro, ellos se encargan del proxy
  const proxyUrl = `https://api.scraperapi.com?api_key=${apiKey}&url=${encodeURIComponent(url)}&country_code=cl`;

  return fetch(proxyUrl, {
    method: "GET", // ScraperAPI solo acepta GET en el plan free
    signal: options?.signal ?? AbortSignal.timeout(30_000),
  });
}
