import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { getFlowPaymentStatus, FLOW_STATUS } from "@/lib/flow";

// Flow envía POST con el token cuando el pago se completa (exitoso o fallido)
export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const token = formData.get("token") as string;

  if (!token) {
    return NextResponse.json({ error: "Token requerido" }, { status: 400 });
  }

  const supabase = createServerClient();
  if (!supabase) return NextResponse.json({ ok: false }, { status: 500 });

  try {
    const status = await getFlowPaymentStatus(token);
    const estado = FLOW_STATUS[status.status] ?? "pendiente";

    await supabase
      .from("pedidos")
      .update({ estado, updated_at: new Date().toISOString() })
      .eq("flow_token", token);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[pagos/confirmar] error:", err);
    return NextResponse.json({ error: "Error al confirmar" }, { status: 500 });
  }
}
