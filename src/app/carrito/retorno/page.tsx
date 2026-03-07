"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, XCircle, Clock, Loader2 } from "lucide-react";
import { Suspense } from "react";

type Estado = "cargando" | "pagado" | "rechazado" | "pendiente";

function RetornoContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [estado, setEstado] = useState<Estado>("cargando");

  useEffect(() => {
    if (!token) { setEstado("rechazado"); return; }

    // Consultar el estado del pago
    fetch(`/api/pagos/estado?token=${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.estado === "pagado") setEstado("pagado");
        else if (data.estado === "rechazado" || data.estado === "anulado") setEstado("rechazado");
        else setEstado("pendiente");
      })
      .catch(() => setEstado("pendiente"));
  }, [token]);

  if (estado === "cargando") {
    return (
      <div className="flex flex-col items-center gap-3 py-16">
        <Loader2 className="h-10 w-10 animate-spin text-green-600" />
        <p className="text-sm text-gray-500">Verificando tu pago...</p>
      </div>
    );
  }

  if (estado === "pagado") {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <CheckCircle className="h-16 w-16 text-green-500" />
        <h1 className="text-2xl font-bold text-gray-900">¡Pago exitoso!</h1>
        <p className="max-w-sm text-sm text-gray-500">
          Tu pedido fue recibido y lo estamos procesando. Te enviaremos un correo con la confirmación y el seguimiento.
        </p>
        <Link
          href="/"
          className="mt-2 rounded-xl bg-green-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-green-700"
        >
          Volver al inicio
        </Link>
      </div>
    );
  }

  if (estado === "rechazado") {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <XCircle className="h-16 w-16 text-red-400" />
        <h1 className="text-2xl font-bold text-gray-900">Pago no completado</h1>
        <p className="max-w-sm text-sm text-gray-500">
          El pago fue rechazado o cancelado. Tu carrito sigue guardado, puedes intentarlo nuevamente.
        </p>
        <Link
          href="/carrito"
          className="mt-2 rounded-xl bg-green-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-green-700"
        >
          Volver al carrito
        </Link>
      </div>
    );
  }

  // pendiente
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <Clock className="h-16 w-16 text-yellow-400" />
      <h1 className="text-2xl font-bold text-gray-900">Pago en proceso</h1>
      <p className="max-w-sm text-sm text-gray-500">
        Tu pago está siendo procesado. Te notificaremos por correo cuando se confirme.
      </p>
      <Link
        href="/"
        className="mt-2 rounded-xl bg-green-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-green-700"
      >
        Volver al inicio
      </Link>
    </div>
  );
}

export default function RetornoPage() {
  return (
    <div className="mx-auto max-w-lg px-4">
      <Suspense fallback={
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
        </div>
      }>
        <RetornoContent />
      </Suspense>
    </div>
  );
}
