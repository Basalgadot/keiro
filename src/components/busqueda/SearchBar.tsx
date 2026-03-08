"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X, Loader2 } from "lucide-react";

interface Sugerencia {
  id: string;
  nombre_generico: string;
  nombre_comercial: string | null;
  forma: string | null;
  dosis: string | null;
}

interface SearchBarProps {
  initialValue?: string;
  autoFocus?: boolean;
}

export default function SearchBar({ initialValue = "", autoFocus = false }: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialValue);
  const [sugerencias, setSugerencias] = useState<Sugerencia[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userTyped = useRef(false);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    if (!userTyped.current || query.length < 2) {
      setSugerencias([]);
      setOpen(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/medicamentos/sugerencias?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setSugerencias(data);
          setOpen(data.length > 0);
        }
      } finally {
        setLoading(false);
      }
    }, 300);
  }, [query]);

  const buscar = (termino: string) => {
    if (!termino.trim()) return;
    setOpen(false);
    const comuna = searchParams.get("comuna") ?? "";
    const params = new URLSearchParams({ q: termino });
    if (comuna) params.set("comuna", comuna);
    router.push(`/buscar?${params.toString()}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") buscar(query);
    if (e.key === "Escape") setOpen(false);
  };

  const limpiar = () => {
    setQuery("");
    setSugerencias([]);
    setOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div className="relative w-full">
      <div className="flex items-center rounded-xl border border-gray-200 bg-white shadow-sm focus-within:border-keiro-400 focus-within:ring-2 focus-within:ring-keiro-100">
        <Search className="ml-3 h-4 w-4 shrink-0 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => { userTyped.current = true; setQuery(e.target.value); }}
          onKeyDown={handleKeyDown}
          onFocus={() => sugerencias.length > 0 && setOpen(true)}
          placeholder="Buscar medicamento, ej: Paracetamol 500mg"
          className="flex-1 bg-transparent px-3 py-3 text-sm outline-none placeholder:text-gray-400"
          autoComplete="off"
        />
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin text-gray-400" />}
        {query && !loading && (
          <button onClick={limpiar} className="mr-2 rounded p-0.5 text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        )}
        <button
          onClick={() => buscar(query)}
          className="mr-1 rounded-lg bg-keiro-500 px-4 py-2 text-sm font-medium text-white hover:bg-keiro-700 transition-colors"
        >
          Buscar
        </button>
      </div>

      {open && sugerencias.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-gray-100 bg-white shadow-lg">
          {sugerencias.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setQuery(s.nombre_generico);
                buscar(s.nombre_generico);
              }}
              className="flex w-full flex-col px-4 py-3 text-left hover:bg-surface first:rounded-t-xl last:rounded-b-xl"
            >
              <span className="text-sm font-medium text-grafito">{s.nombre_generico}</span>
              {(s.nombre_comercial || s.forma || s.dosis) && (
                <span className="text-xs text-gray-500">
                  {[s.nombre_comercial, s.forma, s.dosis].filter(Boolean).join(" · ")}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
