"""
FarmaVibe — Scraper de precios de farmacias chilenas
Uso: python scraper_farmacias.py [--farmacia cruzverdefarmacia] [--query "paracetamol"]

Scrapea precios de medicamentos de las farmacias configuradas y los guarda en Supabase.
"""

import os
import asyncio
import random
import json
from datetime import datetime
from typing import Optional
from dotenv import load_dotenv
from playwright.async_api import async_playwright, Browser, Page
from tenacity import retry, stop_after_attempt, wait_exponential
from loguru import logger
from supabase import create_client, Client

load_dotenv()

# ============================================================
# Configuración
# ============================================================

SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
]

DELAY_MIN = 2.0  # segundos entre requests
DELAY_MAX = 5.0

# ============================================================
# Resultado de scraping
# ============================================================

class ResultadoPrecio:
    def __init__(
        self,
        medicamento_nombre: str,
        farmacia_nombre: str,
        cadena: str,
        precio: int,
        precio_normal: Optional[int],
        stock_disponible: bool,
        url_producto: Optional[str],
        fuente: str,
    ):
        self.medicamento_nombre = medicamento_nombre
        self.farmacia_nombre = farmacia_nombre
        self.cadena = cadena
        self.precio = precio
        self.precio_normal = precio_normal
        self.stock_disponible = stock_disponible
        self.url_producto = url_producto
        self.fuente = fuente
        self.scraped_at = datetime.utcnow().isoformat()

    def to_dict(self) -> dict:
        return self.__dict__

# ============================================================
# Base scraper
# ============================================================

class BaseScraper:
    nombre: str = "base"

    async def scrape(self, page: Page, query: str) -> list[ResultadoPrecio]:
        raise NotImplementedError

    def limpiar_precio(self, texto: str) -> Optional[int]:
        """Convierte '$3.490' o '3490' a 3490 (int)."""
        if not texto:
            return None
        limpio = texto.replace("$", "").replace(".", "").replace(",", "").strip()
        try:
            return int(limpio)
        except ValueError:
            return None

# ============================================================
# Scrapers por cadena
# ============================================================

class CruzVerdeScraper(BaseScraper):
    nombre = "cruzverdefarmacia"
    url_base = "https://www.cruzverdefarmacia.cl"

    async def scrape(self, page: Page, query: str) -> list[ResultadoPrecio]:
        resultados = []
        try:
            await page.goto(f"{self.url_base}/buscar/{query}", wait_until="networkidle", timeout=30000)
            await page.wait_for_timeout(2000)

            productos = await page.query_selector_all("[data-testid='product-card'], .product-card, .product-item")

            for producto in productos[:5]:  # Máximo 5 resultados por búsqueda
                try:
                    nombre_el = await producto.query_selector(".product-name, h2, h3")
                    precio_el = await producto.query_selector(".price, .precio, [data-price]")
                    precio_normal_el = await producto.query_selector(".price-original, .precio-tachado, .price--before")

                    nombre = await nombre_el.inner_text() if nombre_el else query
                    precio_texto = await precio_el.inner_text() if precio_el else None
                    precio_normal_texto = await precio_normal_el.inner_text() if precio_normal_el else None

                    precio = self.limpiar_precio(precio_texto)
                    if not precio:
                        continue

                    url_el = await producto.query_selector("a")
                    url = await url_el.get_attribute("href") if url_el else None
                    if url and not url.startswith("http"):
                        url = f"{self.url_base}{url}"

                    resultados.append(ResultadoPrecio(
                        medicamento_nombre=nombre.strip(),
                        farmacia_nombre="Cruz Verde",
                        cadena=self.nombre,
                        precio=precio,
                        precio_normal=self.limpiar_precio(precio_normal_texto),
                        stock_disponible=True,
                        url_producto=url,
                        fuente=self.nombre,
                    ))
                except Exception as e:
                    logger.warning(f"Cruz Verde: error parseando producto: {e}")

        except Exception as e:
            logger.error(f"Cruz Verde: error en búsqueda '{query}': {e}")

        return resultados


class SalcobrandScraper(BaseScraper):
    nombre = "salcobrand"
    url_base = "https://salcobrand.cl"

    async def scrape(self, page: Page, query: str) -> list[ResultadoPrecio]:
        resultados = []
        try:
            await page.goto(f"{self.url_base}/t/{query}", wait_until="networkidle", timeout=30000)
            await page.wait_for_timeout(2000)

            productos = await page.query_selector_all(".product-box, .product, [class*='ProductCard']")

            for producto in productos[:5]:
                try:
                    nombre_el = await producto.query_selector(".product-name, h3, [class*='name']")
                    precio_el = await producto.query_selector("[class*='price'], .price, .precio")
                    precio_normal_el = await producto.query_selector("[class*='originalPrice'], .price-before")

                    nombre = await nombre_el.inner_text() if nombre_el else query
                    precio_texto = await precio_el.inner_text() if precio_el else None

                    precio = self.limpiar_precio(precio_texto)
                    if not precio:
                        continue

                    url_el = await producto.query_selector("a")
                    url = await url_el.get_attribute("href") if url_el else None
                    if url and not url.startswith("http"):
                        url = f"{self.url_base}{url}"

                    resultados.append(ResultadoPrecio(
                        medicamento_nombre=nombre.strip(),
                        farmacia_nombre="Salcobrand",
                        cadena=self.nombre,
                        precio=precio,
                        precio_normal=self.limpiar_precio(await precio_normal_el.inner_text() if precio_normal_el else None),
                        stock_disponible=True,
                        url_producto=url,
                        fuente=self.nombre,
                    ))
                except Exception as e:
                    logger.warning(f"Salcobrand: error parseando producto: {e}")

        except Exception as e:
            logger.error(f"Salcobrand: error en búsqueda '{query}': {e}")

        return resultados


class AhumadaScraper(BaseScraper):
    nombre = "ahumada"
    url_base = "https://www.farmaciasahumada.cl"

    async def scrape(self, page: Page, query: str) -> list[ResultadoPrecio]:
        resultados = []
        try:
            await page.goto(f"{self.url_base}/busqueda?query={query}", wait_until="networkidle", timeout=30000)
            await page.wait_for_timeout(2000)

            productos = await page.query_selector_all(".product-tile, .product-grid-item, [class*='ProductCard']")

            for producto in productos[:5]:
                try:
                    nombre_el = await producto.query_selector("h2, h3, .product-name, [class*='name']")
                    precio_el = await producto.query_selector(".price-sales, .price, [class*='Price']")

                    nombre = await nombre_el.inner_text() if nombre_el else query
                    precio_texto = await precio_el.inner_text() if precio_el else None

                    precio = self.limpiar_precio(precio_texto)
                    if not precio:
                        continue

                    url_el = await producto.query_selector("a")
                    url = await url_el.get_attribute("href") if url_el else None
                    if url and not url.startswith("http"):
                        url = f"{self.url_base}{url}"

                    resultados.append(ResultadoPrecio(
                        medicamento_nombre=nombre.strip(),
                        farmacia_nombre="Farmacias Ahumada",
                        cadena=self.nombre,
                        precio=precio,
                        precio_normal=None,
                        stock_disponible=True,
                        url_producto=url,
                        fuente=self.nombre,
                    ))
                except Exception as e:
                    logger.warning(f"Ahumada: error parseando producto: {e}")

        except Exception as e:
            logger.error(f"Ahumada: error en búsqueda '{query}': {e}")

        return resultados


class DrSimiScraper(BaseScraper):
    nombre = "drsimi"
    url_base = "https://www.drsimi.cl"

    async def scrape(self, page: Page, query: str) -> list[ResultadoPrecio]:
        resultados = []
        try:
            await page.goto(f"{self.url_base}/buscar?q={query}", wait_until="networkidle", timeout=30000)
            await page.wait_for_timeout(2000)

            productos = await page.query_selector_all(".product, .product-item, [class*='product']")

            for producto in productos[:5]:
                try:
                    nombre_el = await producto.query_selector("h2, h3, .name, .title")
                    precio_el = await producto.query_selector(".price, .precio, [class*='price']")

                    nombre = await nombre_el.inner_text() if nombre_el else query
                    precio_texto = await precio_el.inner_text() if precio_el else None

                    precio = self.limpiar_precio(precio_texto)
                    if not precio:
                        continue

                    resultados.append(ResultadoPrecio(
                        medicamento_nombre=nombre.strip(),
                        farmacia_nombre="Dr. Simi",
                        cadena=self.nombre,
                        precio=precio,
                        precio_normal=None,
                        stock_disponible=True,
                        url_producto=None,
                        fuente=self.nombre,
                    ))
                except Exception as e:
                    logger.warning(f"Dr. Simi: error parseando producto: {e}")

        except Exception as e:
            logger.error(f"Dr. Simi: error en búsqueda '{query}': {e}")

        return resultados


class KairosWebScraper(BaseScraper):
    nombre = "kairosweb"
    url_base = "https://www.kairosweb.cl"

    async def scrape(self, page: Page, query: str) -> list[ResultadoPrecio]:
        resultados = []
        try:
            await page.goto(f"{self.url_base}/buscar/{query}", wait_until="networkidle", timeout=30000)
            await page.wait_for_timeout(2000)

            productos = await page.query_selector_all(".product, .product-item, [class*='product']")

            for producto in productos[:5]:
                try:
                    nombre_el = await producto.query_selector("h2, h3, .name")
                    precio_el = await producto.query_selector(".price, .precio")
                    precio_normal_el = await producto.query_selector(".price-old, .precio-anterior")

                    nombre = await nombre_el.inner_text() if nombre_el else query
                    precio_texto = await precio_el.inner_text() if precio_el else None

                    precio = self.limpiar_precio(precio_texto)
                    if not precio:
                        continue

                    url_el = await producto.query_selector("a")
                    url = await url_el.get_attribute("href") if url_el else None

                    resultados.append(ResultadoPrecio(
                        medicamento_nombre=nombre.strip(),
                        farmacia_nombre="Kairos Web",
                        cadena=self.nombre,
                        precio=precio,
                        precio_normal=self.limpiar_precio(await precio_normal_el.inner_text() if precio_normal_el else None),
                        stock_disponible=True,
                        url_producto=url,
                        fuente=self.nombre,
                    ))
                except Exception as e:
                    logger.warning(f"Kairos Web: error parseando producto: {e}")

        except Exception as e:
            logger.error(f"Kairos Web: error en búsqueda '{query}': {e}")

        return resultados


# ============================================================
# Orquestador principal
# ============================================================

SCRAPERS: dict[str, BaseScraper] = {
    "cruzverdefarmacia": CruzVerdeScraper(),
    "salcobrand": SalcobrandScraper(),
    "ahumada": AhumadaScraper(),
    "drsimi": DrSimiScraper(),
    "kairosweb": KairosWebScraper(),
}

MEDICAMENTOS_PRIORITARIOS = [
    "paracetamol",
    "ibuprofeno",
    "amoxicilina",
    "omeprazol",
    "loratadina",
    "metformina",
    "atorvastatina",
    "losartan",
    "salbutamol",
    "cetirizina",
]


async def scrape_todos(queries: list[str], cadenas: list[str] = None) -> list[dict]:
    cadenas = cadenas or list(SCRAPERS.keys())
    todos_resultados = []

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)

        for cadena in cadenas:
            scraper = SCRAPERS.get(cadena)
            if not scraper:
                logger.warning(f"Scraper no encontrado: {cadena}")
                continue

            context = await browser.new_context(
                user_agent=random.choice(USER_AGENTS),
                locale="es-CL",
                viewport={"width": 1280, "height": 800},
                extra_http_headers={
                    "Accept-Language": "es-CL,es;q=0.9",
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                },
            )
            page = await context.new_page()

            for query in queries:
                logger.info(f"Scraping {cadena}: '{query}'")
                try:
                    resultados = await scraper.scrape(page, query)
                    todos_resultados.extend([r.to_dict() for r in resultados])
                    logger.success(f"{cadena}: {len(resultados)} resultados para '{query}'")
                except Exception as e:
                    logger.error(f"{cadena} / '{query}': {e}")

                # Delay anti-bloqueo entre búsquedas
                await asyncio.sleep(random.uniform(DELAY_MIN, DELAY_MAX))

            await context.close()

        await browser.close()

    return todos_resultados


def guardar_en_supabase(resultados: list[dict]) -> None:
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        logger.warning("Supabase no configurado. Guardando en archivo local.")
        with open(".tmp/resultados_scraping.json", "w") as f:
            json.dump(resultados, f, indent=2, default=str)
        return

    supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    insertados = 0
    errores = 0

    for resultado in resultados:
        try:
            # Buscar medicamento por nombre
            med_resp = supabase.table("medicamentos").select("id").ilike(
                "nombre_generico", f"%{resultado['medicamento_nombre']}%"
            ).limit(1).execute()

            if not med_resp.data:
                continue  # Medicamento no encontrado en catálogo

            med_id = med_resp.data[0]["id"]

            # Buscar farmacia por cadena
            farm_resp = supabase.table("farmacias").select("id").eq(
                "cadena", resultado["cadena"]
            ).eq("activa", True).limit(1).execute()

            if not farm_resp.data:
                continue

            farm_id = farm_resp.data[0]["id"]

            # Upsert precio
            supabase.table("precios").upsert({
                "medicamento_id": med_id,
                "farmacia_id": farm_id,
                "precio": resultado["precio"],
                "precio_normal": resultado.get("precio_normal"),
                "stock_disponible": resultado.get("stock_disponible", True),
                "url_producto": resultado.get("url_producto"),
                "fuente": resultado["fuente"],
                "scraped_at": resultado["scraped_at"],
                "updated_at": datetime.utcnow().isoformat(),
            }, on_conflict="medicamento_id,farmacia_id").execute()

            insertados += 1

        except Exception as e:
            logger.error(f"Error guardando resultado: {e}")
            errores += 1

    logger.info(f"Guardado: {insertados} precios insertados, {errores} errores.")


async def main():
    import argparse
    parser = argparse.ArgumentParser(description="FarmaVibe Scraper")
    parser.add_argument("--cadenas", nargs="+", default=list(SCRAPERS.keys()), help="Cadenas a scrapear")
    parser.add_argument("--queries", nargs="+", default=MEDICAMENTOS_PRIORITARIOS, help="Medicamentos a buscar")
    args = parser.parse_args()

    logger.info(f"Iniciando scraping: {len(args.queries)} medicamentos × {len(args.cadenas)} cadenas")
    resultados = await scrape_todos(queries=args.queries, cadenas=args.cadenas)
    logger.info(f"Total: {len(resultados)} precios obtenidos")
    guardar_en_supabase(resultados)


if __name__ == "__main__":
    asyncio.run(main())
