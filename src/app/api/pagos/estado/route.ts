import { NextRequest, NextResponse } from "next/server";
import { getFlowPaymentStatus, FLOW_STATUS } from "@/lib/flow";

export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Token requerido" }, { status: 400 });

  try {
    const status = await getFlowPaymentStatus(token);
    return NextResponse.json({ estado: FLOW_STATUS[status.status] ?? "pendiente" });
  } catch {
    return NextResponse.json({ estado: "pendiente" });
  }
}
