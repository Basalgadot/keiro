import crypto from "crypto";

const FLOW_API_URL =
  process.env.FLOW_ENVIRONMENT === "sandbox"
    ? "https://sandbox.flow.cl/api"
    : "https://www.flow.cl/api";

const FLOW_API_KEY = process.env.FLOW_API_KEY!;
const FLOW_SECRET = process.env.FLOW_SECRET_KEY!;

// Flow requiere firmar todos los parámetros con HMAC-SHA256
function sign(params: Record<string, string>): string {
  const sorted = Object.keys(params)
    .sort()
    .map((k) => `${k}${params[k]}`)
    .join("");
  return crypto.createHmac("sha256", FLOW_SECRET).update(sorted).digest("hex");
}

export interface FlowPaymentParams {
  commerceOrder: string; // ID único de tu pedido
  subject: string;       // Descripción del cobro
  amount: number;        // Monto en CLP (entero)
  email: string;         // Email del pagador
  urlConfirmation: string;
  urlReturn: string;
}

export interface FlowPaymentResponse {
  token: string;
  url: string;       // URL base de Flow
  flowOrder: number;
  // Redirigir al usuario a: url + "?token=" + token
}

export async function createFlowPayment(
  params: FlowPaymentParams
): Promise<FlowPaymentResponse> {
  const body: Record<string, string> = {
    apiKey: FLOW_API_KEY,
    commerceOrder: params.commerceOrder,
    subject: params.subject,
    amount: String(params.amount),
    email: params.email,
    paymentMethod: "9", // 9 = todos los métodos habilitados en tu cuenta (Khipu, Banca.me, ETPay, Mach)
    urlConfirmation: params.urlConfirmation,
    urlReturn: params.urlReturn,
    currency: "CLP",
  };

  body.s = sign(body);

  const res = await fetch(`${FLOW_API_URL}/payment/create`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body).toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Flow API error ${res.status}: ${text}`);
  }

  return res.json();
}

export interface FlowPaymentStatus {
  flowOrder: number;
  commerceOrder: string;
  requestDate: string;
  status: number; // 1=pendiente, 2=pagado, 3=rechazado, 4=anulado
  subject: string;
  amount: number;
  payer: string;
  paymentData?: {
    date: string;
    media: string;
    amount: number;
  };
}

export async function getFlowPaymentStatus(
  token: string
): Promise<FlowPaymentStatus> {
  const params: Record<string, string> = {
    apiKey: FLOW_API_KEY,
    token,
  };
  params.s = sign(params);

  const url = `${FLOW_API_URL}/payment/getStatus?${new URLSearchParams(params).toString()}`;
  const res = await fetch(url);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Flow API error ${res.status}: ${text}`);
  }

  return res.json();
}

export const FLOW_STATUS: Record<number, string> = {
  1: "pendiente",
  2: "pagado",
  3: "rechazado",
  4: "anulado",
};
