import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { createFlowPayment } from "@/lib/flow";
import type { CartItem } from "@/lib/cart";

interface PedidoBody {
  items: CartItem[];
  nombre: string;
  email: string;
  telefono?: string;
  direccion: string;
}

export async function POST(req: NextRequest) {
  const body: PedidoBody = await req.json();
  const { items, nombre, email, telefono, direccion } = body;

  if (!items?.length || !nombre || !email || !direccion) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }

  const total = items.reduce((s, i) => s + i.precio * i.cantidad, 0);

  const supabase = createServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Error de configuración" }, { status: 500 });
  }

  // 1. Crear pedido en Supabase con estado "pendiente"
  const { data: pedido, error } = await supabase
    .from("pedidos")
    .insert({
      nombre_cliente: nombre,
      email_cliente: email,
      telefono_cliente: telefono ?? null,
      direccion_despacho: direccion,
      total,
      items,
      estado: "pendiente",
    })
    .select("id")
    .single();

  if (error || !pedido) {
    return NextResponse.json({ error: "Error al crear pedido" }, { status: 500 });
  }

  // 2. Crear orden en Flow
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  try {
    const flowResp = await createFlowPayment({
      commerceOrder: pedido.id,
      subject: `Pedido Keiro — ${items.length} medicamento${items.length !== 1 ? "s" : ""}`,
      amount: total,
      email,
      urlConfirmation: `${appUrl}/api/pagos/confirmar`,
      urlReturn: `${appUrl}/carrito/retorno`,
    });

    // 3. Guardar flow_token y flow_order en el pedido
    await supabase
      .from("pedidos")
      .update({ flow_token: flowResp.token, flow_order: flowResp.flowOrder })
      .eq("id", pedido.id);

    // 4. Devolver la URL de pago de Flow al cliente
    return NextResponse.json({
      redirectUrl: `${flowResp.url}?token=${flowResp.token}`,
    });
  } catch (err) {
    await supabase.from("pedidos").delete().eq("id", pedido.id);
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[pagos/crear] Flow error:", msg);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
