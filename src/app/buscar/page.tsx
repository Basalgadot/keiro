import { Suspense } from "react";
import { notFound } from "next/navigation";
import SearchBar from "@/components/busqueda/SearchBar";
import LocationSelector from "@/components/busqueda/LocationSelector";
import PriceList from "@/components/precios/PriceList";
import type { ResultadoBusqueda } from "@/lib/types";

interface Props {
  searchParams: Promise<{ q?: string; comuna?: string }>;
}

async function fetchPrecios(query: string, comuna: string): Promise<ResultadoBusqueda[]> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const params = new URLSearchParams({ q: query });
  if (comuna) params.set("comuna", comuna);

  const res = await fetch(`${baseUrl}/api/buscar?${params.toString()}`, {
    next: { revalidate: 300 },
  });

  if (!res.ok) return [];
  return res.json();
}

export default async function BuscarPage({ searchParams }: Props) {
  const { q, comuna = "" } = await searchParams;

  if (!q?.trim()) notFound();

  const resultados = await fetchPrecios(q, comuna);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Barra de búsqueda persistente */}
      <div className="mb-6 flex flex-col gap-3">
        <Suspense>
          <SearchBar initialValue={q} />
        </Suspense>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Tu comuna:</span>
          <div className="w-52">
            <Suspense>
              <LocationSelector />
            </Suspense>
          </div>
        </div>
      </div>

      {/* Resultado */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-grafito">
            {q}
          </h1>
          <p className="text-xs text-gray-500">
            {resultados.length} resultado{resultados.length !== 1 ? "s" : ""}
            {comuna ? ` en ${comuna}` : ""}
          </p>
        </div>
        {resultados.length > 0 && (
          <div className="text-right">
            <p className="text-xs text-gray-400">Precio más bajo</p>
            <p className="text-lg font-bold text-keiro-700">
              ${Math.min(...resultados.map((r) => r.precio)).toLocaleString("es-CL")}
            </p>
          </div>
        )}
      </div>

      <PriceList resultados={resultados} />

      <p className="mt-6 text-center text-xs text-gray-400">
        Precios actualizados periódicamente. Verifica el precio final en la tienda o farmacia.
      </p>
    </div>
  );
}
