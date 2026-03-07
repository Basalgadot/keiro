import PriceCard from "./PriceCard";
import type { ResultadoBusqueda } from "@/lib/types";

interface PriceListProps {
  resultados: ResultadoBusqueda[];
}

export default function PriceList({ resultados }: PriceListProps) {
  if (resultados.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center">
        <p className="text-sm text-gray-500">No encontramos precios para este medicamento en tu zona.</p>
        <p className="mt-1 text-xs text-gray-400">Intenta con otro nombre o cambia tu comuna.</p>
      </div>
    );
  }

  const ordenados = [...resultados].sort((a, b) => a.precio - b.precio);
  const precioMinimo = ordenados[0].precio;

  return (
    <div className="flex flex-col gap-3">
      {ordenados.map((r, i) => (
        <PriceCard
          key={`${r.farmacia.id}-${r.medicamento.id}`}
          resultado={r}
          esMasBarato={i === 0 && r.precio === precioMinimo}
        />
      ))}
    </div>
  );
}
