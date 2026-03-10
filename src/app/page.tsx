import { Suspense } from "react";
import Link from "next/link";
import SearchBar from "@/components/busqueda/SearchBar";
import LocationSelector from "@/components/busqueda/LocationSelector";
import { Shield, Clock, MapPin, FileImage, ShoppingCart } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center gap-8 px-4 py-16 text-center">
        <div className="flex flex-col items-center gap-3">
          <h1 className="max-w-lg text-3xl font-bold leading-tight text-grafito sm:text-4xl">
            Compara precios de medicamentos y suplementos en Chile
          </h1>
          <p className="max-w-md text-base text-gray-500">
            Encuentra el mejor precio en farmacias, MercadoLibre y más tiendas. Medicamentos, proteínas, vitaminas, magnesio y mucho más.
          </p>
        </div>

        {/* Buscador */}
        <div className="w-full max-w-xl space-y-3">
          <Suspense>
            <SearchBar autoFocus />
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

        {/* Link escanear receta */}
        <Link
          href="/receta"
          className="flex items-center gap-2 text-sm text-keiro-700 hover:text-keiro-700"
        >
          <FileImage className="h-4 w-4" />
          ¿Tienes receta médica? Escanéala aquí
        </Link>

        {/* Búsquedas populares */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs text-gray-400">Medicamentos frecuentes</span>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                "Paracetamol 500mg",
                "Ibuprofeno 400mg",
                "Amoxicilina 500mg",
                "Omeprazol 20mg",
                "Loratadina 10mg",
                "Metformina 850mg",
              ].map((med) => (
                <a
                  key={med}
                  href={`/buscar?q=${encodeURIComponent(med)}`}
                  className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-600 hover:border-keiro-200 hover:bg-keiro-50 hover:text-keiro-700 transition-colors"
                >
                  {med}
                </a>
              ))}
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs text-gray-400">Suplementos populares</span>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                "Proteína whey",
                "Magnesio 400mg",
                "Vitamina D3",
                "Omega 3",
                "Creatina",
                "Vitamina C 1000mg",
              ].map((sup) => (
                <a
                  key={sup}
                  href={`/buscar?q=${encodeURIComponent(sup)}`}
                  className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100 transition-colors"
                >
                  {sup}
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Propuesta de valor */}
      <section className="mt-auto border-t border-gray-100 bg-white px-4 py-10">
        <div className="mx-auto grid max-w-3xl gap-6 sm:grid-cols-4">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-keiro-100">
              <MapPin className="h-5 w-5 text-keiro-500" />
            </div>
            <span className="text-sm font-medium text-grafito">Por tu zona</span>
            <span className="text-xs text-gray-500">Precios y stock filtrados por tu comuna</span>
          </div>
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-keiro-100">
              <Clock className="h-5 w-5 text-keiro-500" />
            </div>
            <span className="text-sm font-medium text-grafito">Actualizado diariamente</span>
            <span className="text-xs text-gray-500">Precios reales de tiendas y farmacias</span>
          </div>
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-keiro-100">
              <ShoppingCart className="h-5 w-5 text-keiro-500" />
            </div>
            <span className="text-sm font-medium text-grafito">Múltiples tiendas</span>
            <span className="text-xs text-gray-500">Farmacias, MercadoLibre y más comercios</span>
          </div>
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-keiro-100">
              <Shield className="h-5 w-5 text-keiro-500" />
            </div>
            <span className="text-sm font-medium text-grafito">Genéricos aprobados ISP</span>
            <span className="text-xs text-gray-500">Alternativas más baratas validadas por el Ministerio de Salud</span>
          </div>
        </div>
      </section>
    </div>
  );
}
