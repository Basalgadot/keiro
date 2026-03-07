import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

const MOCK_MEDICAMENTOS = [
  { id: "1", nombre_generico: "Paracetamol", nombre_comercial: "Tapsin / Panadol", forma: "comprimido", dosis: "500mg" },
  { id: "2", nombre_generico: "Ibuprofeno", nombre_comercial: "Brufen / Neobrufen", forma: "comprimido", dosis: "400mg" },
  { id: "3", nombre_generico: "Amoxicilina", nombre_comercial: "Amoval", forma: "cápsula", dosis: "500mg" },
  { id: "4", nombre_generico: "Omeprazol", nombre_comercial: "Losec / Omeplax", forma: "cápsula", dosis: "20mg" },
  { id: "5", nombre_generico: "Loratadina", nombre_comercial: "Clarityne", forma: "comprimido", dosis: "10mg" },
  { id: "6", nombre_generico: "Metformina", nombre_comercial: "Glucophage", forma: "comprimido", dosis: "850mg" },
  { id: "7", nombre_generico: "Atorvastatina", nombre_comercial: "Lipitor", forma: "comprimido", dosis: "20mg" },
  { id: "8", nombre_generico: "Losartán", nombre_comercial: "Cozaar", forma: "comprimido", dosis: "50mg" },
  { id: "9", nombre_generico: "Salbutamol", nombre_comercial: "Ventolin", forma: "inhalador", dosis: "100mcg" },
  { id: "10", nombre_generico: "Clonazepam", nombre_comercial: "Ravotril", forma: "comprimido", dosis: "0.5mg" },
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";

  if (q.length < 2) return NextResponse.json([]);

  // En desarrollo sin Supabase, devolver mock
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL === "TU_SUPABASE_URL_AQUI") {
    const filtrados = MOCK_MEDICAMENTOS.filter(
      (m) =>
        m.nombre_generico.toLowerCase().includes(q.toLowerCase()) ||
        m.nombre_comercial?.toLowerCase().includes(q.toLowerCase())
    ).slice(0, 5);
    return NextResponse.json(filtrados);
  }

  const supabase = createServerClient();
  if (!supabase) return NextResponse.json([]);

  const { data, error } = await supabase
    .from("medicamentos")
    .select("id, nombre_generico, nombre_comercial, forma, dosis")
    .or(`nombre_generico.ilike.%${q}%,nombre_comercial.ilike.%${q}%`)
    .limit(6);

  if (error) return NextResponse.json([]);
  return NextResponse.json(data ?? []);
}
