/**
 * sync-isp.ts
 * Descarga el catálogo de medicamentos registrados del ISP y actualiza la tabla `medicamentos`.
 *
 * Uso local:  ISP_DATA_URL=<url> npx tsx scripts/sync-isp.ts
 *
 * Cómo obtener la URL del Excel:
 * 1. Ir a https://registrosaludchile.ispch.cl/
 * 2. Ir a "Búsqueda avanzada" → exportar a Excel con todos los registros activos
 * 3. Subir el archivo a un bucket de Supabase Storage o usar un link de descarga directa
 * 4. Poner la URL en la variable de entorno ISP_DATA_URL (o en .env.local)
 *
 * Columnas esperadas en el Excel del ISP:
 *   Número de Registro | Nombre del Producto | Principio Activo | Forma Farmacéutica |
 *   Concentración | Condición de Venta | Titular del Registro
 */
import { db } from "./db.js";
import * as XLSX from "xlsx";

const ISP_URL = process.env.ISP_DATA_URL;

/** Normaliza texto: minúsculas, sin acentos, trim */
function normalizar(s: string | null | undefined): string {
  if (!s) return "";
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/** Mapea la condición de venta del ISP a requiere_receta */
function requiereReceta(condicion: string): boolean {
  const n = normalizar(condicion);
  return n.includes("receta") || n.includes("retenida") || n.includes("cheque");
}

function requiereRetenida(condicion: string): boolean {
  const n = normalizar(condicion);
  return n.includes("retenida") || n.includes("cheque");
}

interface IspRow {
  numero_registro?: string;
  nombre_producto?: string;
  principio_activo?: string;
  forma_farmaceutica?: string;
  concentracion?: string;
  condicion_venta?: string;
}

function parsearFila(row: Record<string, unknown>): IspRow {
  // El Excel del ISP puede tener los headers en distintos formatos según el año
  // Intentamos múltiples variantes
  const get = (...keys: string[]) => {
    for (const k of keys) {
      const val = row[k] ?? row[k.toLowerCase()] ?? row[k.toUpperCase()];
      if (val !== undefined && val !== null && val !== "") return String(val).trim();
    }
    return undefined;
  };

  return {
    numero_registro: get("N° Registro", "Numero Registro", "registro", "REGISTRO"),
    nombre_producto: get("Nombre del Producto", "Nombre Producto", "NOMBRE", "nombre"),
    principio_activo: get("Principio Activo", "PRINCIPIO ACTIVO", "principio_activo"),
    forma_farmaceutica: get("Forma Farmacéutica", "Forma Farmaceutica", "FORMA", "forma"),
    concentracion: get("Concentración", "Concentracion", "CONCENTRACION"),
    condicion_venta: get("Condición de Venta", "Condicion de Venta", "CONDICION"),
  };
}

async function main() {
  if (!ISP_URL) {
    console.error(
      "Falta ISP_DATA_URL. Descarga el Excel del ISP (ver instrucciones en el archivo) y ponlo en .env.local"
    );
    process.exit(1);
  }

  console.log("=== Sync ISP iniciado:", new Date().toISOString());
  console.log("Descargando Excel desde:", ISP_URL);

  const res = await fetch(ISP_URL);
  if (!res.ok) throw new Error(`Error descargando Excel: HTTP ${res.status}`);

  const buffer = await res.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

  console.log(`Filas en Excel: ${rows.length}`);

  let insertados = 0;
  let actualizados = 0;
  let saltados = 0;

  for (const row of rows) {
    const fila = parsearFila(row);

    if (!fila.nombre_producto) {
      saltados++;
      continue;
    }

    const { error } = await db.from("medicamentos").upsert(
      {
        nombre_generico: fila.nombre_producto,
        principio_activo: fila.principio_activo ?? null,
        forma: fila.forma_farmaceutica ?? null,
        dosis: fila.concentracion ?? null,
        codigo_isp: fila.numero_registro ?? null,
        requiere_receta: requiereReceta(fila.condicion_venta ?? ""),
        requiere_receta_retenida: requiereRetenida(fila.condicion_venta ?? ""),
        activo: true,
      },
      { onConflict: "codigo_isp" }
    );

    if (error) {
      console.error("Error upsert:", fila.nombre_producto, error.message);
      saltados++;
    } else {
      actualizados++;
    }
  }

  console.log(`=== ISP sync completado: ${actualizados} upsertados, ${saltados} saltados`);
}

main();
