/**
 * Scraper MercadoLibre Chile — API oficial con OAuth2 Client Credentials
 *
 * Setup (gratis, 5 min):
 * 1. Crear cuenta en https://developers.mercadolibre.com
 * 2. Crear una app → obtener APP_ID y SECRET_KEY
 * 3. Agregar al .env.local:
 *    MERCADOLIBRE_APP_ID=tu_app_id
 *    MERCADOLIBRE_SECRET_KEY=tu_secret_key
 * 4. Agregar los mismos como Secrets en GitHub Actions
 */
import type { PrecioScrapeado } from "./types.js";
import { fetchProxy } from "./fetch-proxy.js";

const CADENA = "mercadolibre";

let _token: string | null = null;
let _tokenExpiry = 0;

async function getToken(): Promise<string | null> {
  const appId = process.env.MERCADOLIBRE_APP_ID;
  const secret = process.env.MERCADOLIBRE_SECRET_KEY;
  if (!appId || !secret) return null;

  if (_token && Date.now() < _tokenExpiry) return _token;

  const res = await fetch("https://api.mercadolibre.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: appId,
      client_secret: secret,
    }).toString(),
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    console.warn("[mercadolibre] Error obteniendo token:", res.status);
    return null;
  }

  const data = await res.json();
  _token = data.access_token;
  _tokenExpiry = Date.now() + (data.expires_in - 60) * 1000; // renovar 1 min antes
  return _token;
}

interface MliItem {
  title: string;
  price: number;
  original_price: number | null;
  available_quantity: number;
  permalink: string;
}

export async function scrapeMercadoLibre(query: string): Promise<PrecioScrapeado[]> {
  const hasProxy = !!process.env.SCRAPER_API_KEY;
  const token = await getToken();

  // Sin proxy ni credenciales MercadoLibre: skip silencioso
  if (!hasProxy && !token) return [];

  const url = `https://api.mercadolibre.com/sites/MLC/search?q=${encodeURIComponent(query)}&limit=5&condition=new`;

  // Con proxy (IP chilena), la API pública funciona sin token
  // Sin proxy, necesitamos token OAuth2
  const res = hasProxy
    ? await fetchProxy(url)
    : await fetch(url, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        signal: AbortSignal.timeout(15_000),
      });

  if (!res.ok) {
    console.warn(`[mercadolibre] HTTP ${res.status} para "${query}"`);
    return [];
  }

  const data = await res.json();
  const items: MliItem[] = data?.results ?? [];

  return items
    .filter((item) => item.price > 0 && item.available_quantity > 0)
    .map((item) => ({
      query,
      nombre_producto: item.title,
      precio: Math.round(item.price),
      precio_normal:
        item.original_price && item.original_price > item.price
          ? Math.round(item.original_price)
          : undefined,
      stock: true,
      url: item.permalink,
      cadena: CADENA,
    } satisfies PrecioScrapeado));
}
