"use client";

import { ExternalLink, Truck, Store, TrendingDown, ShoppingCart, Check } from "lucide-react";
import { useState } from "react";
import type { ResultadoBusqueda } from "@/lib/types";
import { CADENA_LABEL } from "@/lib/types";
import { useCart } from "@/lib/cart";

interface PriceCardProps {
  resultado: ResultadoBusqueda;
  esMasBarato?: boolean;
}

export default function PriceCard({ resultado, esMasBarato }: PriceCardProps) {
  const { farmacia, precio, precio_normal, stock_disponible, comuna } = resultado;
  const { addItem, items } = useCart();
  const [agregado, setAgregado] = useState(false);

  const tieneDescuento = precio_normal && precio_normal > precio;
  const descuentoPct = tieneDescuento
    ? Math.round((1 - precio / precio_normal!) * 100)
    : null;

  const itemId = `${farmacia.id}-${resultado.medicamento.id}`;
  const enCarrito = items.some((i) => i.id === itemId);

  const handleAgregar = () => {
    addItem(resultado);
    setAgregado(true);
    setTimeout(() => setAgregado(false), 1500);
  };

  return (
    <div
      className={`relative flex flex-col gap-3 rounded-2xl border bg-white p-4 shadow-sm transition-shadow hover:shadow-md ${
        esMasBarato ? "border-green-300 ring-1 ring-green-200" : "border-gray-100"
      }`}
    >
      {esMasBarato && (
        <span className="absolute -top-2.5 left-4 flex items-center gap-1 rounded-full bg-green-600 px-2 py-0.5 text-xs font-medium text-white">
          <TrendingDown className="h-3 w-3" />
          Más barato
        </span>
      )}

      {/* Fila superior: farmacia + precio */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-gray-900">
            {CADENA_LABEL[farmacia.cadena as keyof typeof CADENA_LABEL] ?? farmacia.nombre}
          </span>
          <span className="text-xs text-gray-500">{farmacia.direccion ?? comuna?.nombre ?? "Online"}</span>
          <div className="mt-1 flex items-center gap-2">
            {farmacia.tiene_despacho && (
              <span className="flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                <Truck className="h-3 w-3" />
                Despacho
              </span>
            )}
            {farmacia.tiene_retiro && (
              <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                <Store className="h-3 w-3" />
                Retiro
              </span>
            )}
            {!stock_disponible && (
              <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-600">
                Sin stock
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          <span className="text-xl font-bold text-gray-900">
            ${precio.toLocaleString("es-CL")}
          </span>
          {tieneDescuento && (
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-400 line-through">
                ${precio_normal!.toLocaleString("es-CL")}
              </span>
              <span className="rounded-full bg-orange-100 px-1.5 py-0.5 text-xs font-medium text-orange-700">
                -{descuentoPct}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Fila inferior: botones */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleAgregar}
          disabled={!stock_disponible}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            agregado
              ? "bg-green-100 text-green-700"
              : enCarrito
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-100 disabled:text-gray-400"
          }`}
        >
          {agregado ? (
            <>
              <Check className="h-4 w-4" />
              Agregado
            </>
          ) : (
            <>
              <ShoppingCart className="h-4 w-4" />
              {enCarrito ? "En carrito" : "Agregar"}
            </>
          )}
        </button>

        {farmacia.url_compra && stock_disponible && (
          <a
            href={farmacia.url_compra}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Ver
          </a>
        )}
      </div>
    </div>
  );
}
