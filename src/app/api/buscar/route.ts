import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import type { ResultadoBusqueda } from "@/lib/types";

const IS_MOCK_MODE =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL === "TU_SUPABASE_URL_AQUI";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const comuna = searchParams.get("comuna")?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ error: "Término de búsqueda muy corto" }, { status: 400 });
  }

  // Modo demo: sin Supabase configurado, devolver datos de ejemplo
  if (IS_MOCK_MODE) {
    return NextResponse.json(getMockData(q));
  }

  const supabase = createServerClient();
  if (!supabase) return NextResponse.json([]);

  const { data: medicamentos, error: errMed } = await supabase
    .from("medicamentos")
    .select("id, nombre_generico, nombre_comercial, forma, dosis, requiere_receta")
    .or(`nombre_generico.ilike.%${q}%,nombre_comercial.ilike.%${q}%,principio_activo.ilike.%${q}%`)
    .limit(10);

  if (errMed || !medicamentos?.length) {
    return NextResponse.json([]);
  }

  const medicamentoIds = medicamentos.map((m) => m.id);

  let preciosQuery = supabase
    .from("precios")
    .select(`
      id,
      precio,
      precio_normal,
      stock_disponible,
      scraped_at,
      medicamento:medicamento_id (
        id, nombre_generico, nombre_comercial, forma, dosis, requiere_receta
      ),
      farmacia:farmacia_id (
        id, nombre, cadena, direccion, tiene_despacho, tiene_retiro, url_compra,
        comuna:comuna_id (nombre)
      )
    `)
    .in("medicamento_id", medicamentoIds)
    .eq("stock_disponible", true)
    .order("precio", { ascending: true })
    .limit(50);

  if (comuna) {
    const { data: comunaData } = await supabase
      .from("comunas")
      .select("id")
      .ilike("nombre", `%${comuna}%`)
      .single();

    if (comunaData) {
      const { data: farmaciaIds } = await supabase
        .from("farmacias")
        .select("id")
        .eq("comuna_id", comunaData.id);

      if (farmaciaIds?.length) {
        preciosQuery = preciosQuery.in("farmacia_id", farmaciaIds.map((f) => f.id));
      } else {
        return NextResponse.json([]);
      }
    }
  }

  const { data: precios, error: errPrecios } = await preciosQuery;
  if (errPrecios || !precios) return NextResponse.json([]);

  const resultados: ResultadoBusqueda[] = precios.map((p: any) => ({
    medicamento: p.medicamento,
    farmacia: p.farmacia,
    comuna: p.farmacia.comuna,
    precio: p.precio,
    precio_normal: p.precio_normal,
    stock_disponible: p.stock_disponible,
    scraped_at: p.scraped_at,
  }));

  return NextResponse.json(resultados);
}

function getMockData(query: string): ResultadoBusqueda[] {
  const medicamento = {
    id: "mock-1",
    nombre_generico: query,
    nombre_comercial: null,
    forma: "comprimido",
    dosis: "500mg",
    requiere_receta: false,
  };

  return [
    {
      medicamento,
      farmacia: { id: "f4", nombre: "Dr. Simi Maipú", cadena: "drsimi", direccion: "Av. Pajaritos 3456", tiene_despacho: false, tiene_retiro: true, url_compra: null },
      comuna: { nombre: "Maipú" },
      precio: 2490,
      precio_normal: null,
      stock_disponible: true,
      scraped_at: new Date().toISOString(),
    },
    {
      medicamento,
      farmacia: { id: "f5", nombre: "Kairos Web", cadena: "kairosweb", direccion: null, tiene_despacho: true, tiene_retiro: false, url_compra: null },
      comuna: { nombre: "Despacho a domicilio" },
      precio: 2890,
      precio_normal: 3200,
      stock_disponible: true,
      scraped_at: new Date().toISOString(),
    },
    {
      medicamento,
      farmacia: { id: "f1", nombre: "Cruz Verde Providencia", cadena: "cruzverdefarmacia", direccion: "Av. Providencia 1234", tiene_despacho: true, tiene_retiro: true, url_compra: null },
      comuna: { nombre: "Providencia" },
      precio: 3490,
      precio_normal: 4200,
      stock_disponible: true,
      scraped_at: new Date().toISOString(),
    },
    {
      medicamento,
      farmacia: { id: "f2", nombre: "Salcobrand Las Condes", cadena: "salcobrand", direccion: "Av. Apoquindo 5678", tiene_despacho: true, tiene_retiro: true, url_compra: null },
      comuna: { nombre: "Las Condes" },
      precio: 3890,
      precio_normal: null,
      stock_disponible: true,
      scraped_at: new Date().toISOString(),
    },
    {
      medicamento,
      farmacia: { id: "f3", nombre: "Farmacias Ahumada Santiago", cadena: "ahumada", direccion: "Huérfanos 1234", tiene_despacho: false, tiene_retiro: true, url_compra: null },
      comuna: { nombre: "Santiago" },
      precio: 4100,
      precio_normal: null,
      stock_disponible: true,
      scraped_at: new Date().toISOString(),
    },
  ] as unknown as ResultadoBusqueda[];
}
