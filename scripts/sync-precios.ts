/**
 * sync-precios.ts
 * Actualiza la tabla `precios` con datos frescos de cada farmacia.
 *
 * Uso local:  npx tsx scripts/sync-precios.ts
 * GitHub Actions: se ejecuta diariamente a las 6am UTC (3am Chile)
 */
import { db } from "./db.js";
import { scrapeCV } from "./scrapers/cruz-verde.js";
import { scrapeSalcobrand } from "./scrapers/salcobrand.js";
import { scrapeAhumada } from "./scrapers/ahumada.js";
import { scrapeDrSimi } from "./scrapers/dr-simi.js";
import type { PrecioScrapeado } from "./scrapers/types.js";

const SCRAPERS: Record<string, (q: string) => Promise<PrecioScrapeado[]>> = {
  cruzverdefarmacia: scrapeCV,
  salcobrand: scrapeSalcobrand,
  ahumada: scrapeAhumada,
  drsimi: scrapeDrSimi,
};

/** Pausa entre requests para no saturar los servidores */
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  console.log("=== Sync precios iniciado:", new Date().toISOString());

  // 1. Obtener todos los medicamentos activos
  const { data: medicamentos, error: errMeds } = await db
    .from("medicamentos")
    .select("id, nombre_generico, nombre_comercial")
    .eq("activo", true);

  if (errMeds || !medicamentos?.length) {
    console.error("Error cargando medicamentos:", errMeds);
    process.exit(1);
  }
  console.log(`Medicamentos a actualizar: ${medicamentos.length}`);

  // 2. Obtener farmacias activas agrupadas por cadena
  const { data: farmacias, error: errFarm } = await db
    .from("farmacias")
    .select("id, cadena, nombre")
    .eq("activa", true);

  if (errFarm || !farmacias?.length) {
    console.error("Error cargando farmacias:", errFarm);
    process.exit(1);
  }

  // Mapa cadena → primera farmacia (precio online unificado por cadena)
  const farmaciasPorCadena = new Map<string, string>();
  for (const f of farmacias) {
    if (!farmaciasPorCadena.has(f.cadena)) farmaciasPorCadena.set(f.cadena, f.id);
  }

  let actualizados = 0;
  let errores = 0;

  // 3. Para cada medicamento, scrapeamos cada farmacia
  for (const med of medicamentos) {
    const query = med.nombre_generico;

    for (const [cadena, scraper] of Object.entries(SCRAPERS)) {
      const farmaciaId = farmaciasPorCadena.get(cadena);
      if (!farmaciaId) continue;

      try {
        await sleep(300); // respetar rate limits
        const resultados = await scraper(query);

        if (!resultados.length) continue;

        // Tomar el resultado más relevante (menor precio con stock)
        const mejor = resultados
          .filter((r) => r.stock && r.precio > 0)
          .sort((a, b) => a.precio - b.precio)[0] ?? resultados[0];

        const { error } = await db.from("precios").upsert(
          {
            medicamento_id: med.id,
            farmacia_id: farmaciaId,
            precio: mejor.precio,
            precio_normal: mejor.precio_normal ?? null,
            stock_disponible: mejor.stock,
            fuente: cadena,
            url_producto: mejor.url ?? null,
            scraped_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "medicamento_id,farmacia_id" }
        );

        if (error) {
          console.error(`[${cadena}] Error upsert ${query}:`, error.message);
          errores++;
        } else {
          actualizados++;
        }
      } catch (e) {
        console.error(`[${cadena}] Error scraping "${query}":`, e);
        errores++;
      }
    }
  }

  console.log(`=== Sync completado: ${actualizados} precios actualizados, ${errores} errores`);
}

main();
