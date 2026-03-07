"use client";

import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { MapPin } from "lucide-react";

const COMUNAS_POPULARES = [
  "Santiago",
  "Providencia",
  "Las Condes",
  "Maipú",
  "Pudahuel",
  "La Florida",
  "Ñuñoa",
  "San Miguel",
  "Vitacura",
  "Peñalolén",
];

export default function LocationSelector() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const comunaActual = searchParams.get("comuna") ?? "";
  const [input, setInput] = useState(comunaActual);
  const [open, setOpen] = useState(false);

  const filtradas = COMUNAS_POPULARES.filter((c) =>
    c.toLowerCase().includes(input.toLowerCase())
  );

  const seleccionar = (comuna: string) => {
    setInput(comuna);
    setOpen(false);
    const params = new URLSearchParams(searchParams.toString());
    params.set("comuna", comuna);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-100">
        <MapPin className="h-4 w-4 shrink-0 text-green-600" />
        <input
          type="text"
          value={input}
          onChange={(e) => { setInput(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Tu comuna"
          className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
        />
      </div>

      {open && filtradas.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-gray-100 bg-white shadow-lg">
          {filtradas.map((c) => (
            <button
              key={c}
              onClick={() => seleccionar(c)}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm hover:bg-gray-50 first:rounded-t-xl last:rounded-b-xl"
            >
              <MapPin className="h-3.5 w-3.5 text-gray-400" />
              {c}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
