"use client";

import { useState } from "react";
import Link from "next/link";
import { Trash2, Plus, Minus, ShoppingCart, ArrowLeft, Loader2 } from "lucide-react";
import { useCart, cartTotal, itemsPorFarmacia } from "@/lib/cart";
import { CADENA_LABEL } from "@/lib/types";

export default function CarritoPage() {
  const { items, removeItem, updateCantidad, clear } = useCart();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [cargando, setCargando] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const total = cartTotal(items);
  const grupos = itemsPorFarmacia(items);

  const pagar = async () => {
    if (!nombre || !email || !direccion) return;
    setCargando(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/pagos/crear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, nombre, email, telefono, direccion }),
      });

      const data = await res.json();

      if (!res.ok || !data.redirectUrl) {
        setErrorMsg(data.error ?? "Error al iniciar el pago. Intenta nuevamente.");
        return;
      }

      // Limpiar carrito y redirigir a Flow
      clear();
      window.location.href = data.redirectUrl;
    } catch {
      setErrorMsg("Error de conexión. Intenta nuevamente.");
    } finally {
      setCargando(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <ShoppingCart className="mx-auto mb-4 h-12 w-12 text-gray-300" />
        <h1 className="mb-2 text-lg font-semibold text-gray-700">Tu carrito está vacío</h1>
        <p className="mb-6 text-sm text-gray-500">Busca medicamentos y agrégatlos aquí para hacer tu pedido.</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-green-700"
        >
          Buscar medicamentos
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Tu carrito</h1>
      </div>

      {/* Items agrupados por farmacia */}
      <div className="mb-6 flex flex-col gap-4">
        {grupos.map(({ farmacia, items: grupoItems }) => (
          <div key={farmacia.id} className="rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-4 py-3">
              <span className="text-sm font-semibold text-gray-800">
                {CADENA_LABEL[farmacia.cadena as keyof typeof CADENA_LABEL] ?? farmacia.nombre}
              </span>
              {farmacia.direccion && (
                <span className="ml-2 text-xs text-gray-400">{farmacia.direccion}</span>
              )}
            </div>
            <div className="divide-y divide-gray-50">
              {grupoItems.map((item) => (
                <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{item.medicamento.nombre_generico}</p>
                    {(item.medicamento.forma || item.medicamento.dosis) && (
                      <p className="text-xs text-gray-500">
                        {[item.medicamento.forma, item.medicamento.dosis].filter(Boolean).join(" · ")}
                      </p>
                    )}
                    <p className="text-sm font-semibold text-green-700">
                      ${(item.precio * item.cantidad).toLocaleString("es-CL")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateCantidad(item.id, item.cantidad - 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-5 text-center text-sm font-medium">{item.cantidad}</span>
                    <button
                      onClick={() => updateCantidad(item.id, item.cantidad + 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="ml-1 text-red-400 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="mb-6 flex items-center justify-between rounded-2xl bg-green-50 px-4 py-3">
        <span className="text-sm font-medium text-gray-700">Total</span>
        <span className="text-xl font-bold text-green-700">${total.toLocaleString("es-CL")}</span>
      </div>

      {/* Formulario de datos del pedido */}
      <div className="mb-6 flex flex-col gap-3">
        <p className="text-sm font-semibold text-gray-700">Datos para el despacho</p>
        <input
          type="text"
          placeholder="Nombre completo *"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
        />
        <input
          type="email"
          placeholder="Correo electrónico *"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
        />
        <input
          type="tel"
          placeholder="Teléfono (opcional)"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
        />
        <input
          type="text"
          placeholder="Dirección de despacho *"
          value={direccion}
          onChange={(e) => setDireccion(e.target.value)}
          className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
        />
      </div>

      {errorMsg && (
        <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{errorMsg}</p>
      )}

      <button
        onClick={pagar}
        disabled={!nombre || !email || !direccion || cargando}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:bg-gray-200 disabled:text-gray-400 transition-colors"
      >
        {cargando ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Redirigiendo a Flow...
          </>
        ) : (
          `Pagar con Flow — $${total.toLocaleString("es-CL")}`
        )}
      </button>
      <p className="mt-2 text-center text-xs text-gray-400">
        Pagarás con Khipu, Banca.me, ETPay o Mach. Seguro y sin tarjeta.
      </p>
    </div>
  );
}
