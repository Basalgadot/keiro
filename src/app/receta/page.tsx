"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { Camera, Upload, Loader2, AlertTriangle, ArrowRight, RotateCcw, FileImage, Pencil, Check, X } from "lucide-react";
import type { RecetaExtraida, MedicamentoExtraido } from "@/lib/types";

type Estado = "idle" | "procesando" | "revision" | "error";

interface EditState {
  nombre: string;
  valor: string;
  unidad: string;
}

const CONFIANZA_ESTILO: Record<string, string> = {
  alta: "border-gray-200 bg-white",
  media: "border-yellow-200 bg-yellow-50",
  baja: "border-red-300 bg-red-50",
};

const CONFIANZA_BADGE: Record<string, string | null> = {
  alta: null,
  media: "Revisar",
  baja: "Confirmar manualmente",
};

async function resizeImagen(file: File, maxPx = 2048): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => resolve(blob!), "image/jpeg", 0.85);
    };
    img.src = url;
  });
}

function buildSearchQuery(med: MedicamentoExtraido): string {
  const nombre = med.nombre_normalizado;
  const conc =
    med.concentracion.valor && med.concentracion.unidad
      ? ` ${med.concentracion.valor}${med.concentracion.unidad}`
      : "";
  return `${nombre}${conc}`.trim();
}

export default function RecetaPage() {
  const [estado, setEstado] = useState<Estado>("idle");
  const [receta, setReceta] = useState<RecetaExtraida | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [editando, setEditando] = useState<number | null>(null);
  const [editState, setEditState] = useState<EditState>({ nombre: "", valor: "", unidad: "" });
  const inputRef = useRef<HTMLInputElement>(null);

  function iniciarEdicion(i: number, med: MedicamentoExtraido) {
    setEditando(i);
    setEditState({
      nombre: med.nombre_normalizado,
      valor: med.concentracion.valor?.toString() ?? "",
      unidad: med.concentracion.unidad ?? "mg",
    });
  }

  function guardarEdicion(i: number) {
    if (!receta) return;
    const meds = [...receta.medicamentos];
    meds[i] = {
      ...meds[i],
      nombre_normalizado: editState.nombre.trim() || meds[i].nombre_normalizado,
      concentracion: {
        valor: editState.valor ? parseFloat(editState.valor) : meds[i].concentracion.valor,
        unidad: editState.unidad || meds[i].concentracion.unidad,
      },
    };
    setReceta({ ...receta, medicamentos: meds });
    setEditando(null);
  }

  async function procesarArchivo(file: File) {
    setEstado("procesando");
    try {
      let blob: Blob = file;
      if (file.type.startsWith("image/")) {
        blob = await resizeImagen(file);
      }

      const form = new FormData();
      form.append("imagen", blob, "receta.jpg");

      const res = await fetch("/api/receta", { method: "POST", body: form });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error procesando la receta");
      }
      if (!data.receta?.medicamentos?.length) {
        throw new Error(
          "No se detectaron medicamentos en la imagen. Intenta con una foto más clara y bien iluminada."
        );
      }

      setReceta(data.receta);
      setEstado("revision");
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : "Ocurrió un error inesperado.");
      setEstado("error");
    }
  }

  function reiniciar() {
    setEstado("idle");
    setReceta(null);
    setErrorMsg("");
    if (inputRef.current) inputRef.current.value = "";
  }

  function abrirCamara() {
    if (!inputRef.current) return;
    inputRef.current.accept = "image/*";
    inputRef.current.setAttribute("capture", "environment");
    inputRef.current.click();
  }

  function abrirArchivo() {
    if (!inputRef.current) return;
    inputRef.current.accept = "image/*,application/pdf";
    inputRef.current.removeAttribute("capture");
    inputRef.current.click();
  }

  // Estado: procesando
  if (estado === "procesando") {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center gap-6 px-4">
        <Loader2 className="h-12 w-12 animate-spin text-green-600" />
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-900">Leyendo tu receta...</p>
          <p className="mt-1 text-sm text-gray-500">
            La IA está identificando los medicamentos. Toma unos segundos.
          </p>
        </div>
      </div>
    );
  }

  // Estado: error
  if (estado === "error") {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center gap-6 px-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <AlertTriangle className="h-8 w-8 text-red-600" />
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-900">No pudimos leer la receta</p>
          <p className="mt-1 max-w-xs text-sm text-gray-500">{errorMsg}</p>
        </div>
        <button
          onClick={reiniciar}
          className="flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-green-700"
        >
          <RotateCcw className="h-4 w-4" />
          Intentar de nuevo
        </button>
      </div>
    );
  }

  // Estado: revision
  if (estado === "revision" && receta) {
    return (
      <div className="mx-auto max-w-lg px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Medicamentos detectados</h1>
            <p className="text-sm text-gray-500">
              {receta.medicamentos.length === 1
                ? "1 medicamento"
                : `${receta.medicamentos.length} medicamentos`}{" "}
              en la receta
            </p>
          </div>
          <button
            onClick={reiniciar}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Nueva receta
          </button>
        </div>

        {receta.advertencias.length > 0 && (
          <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3">
            <p className="text-xs font-medium text-yellow-800">Aviso</p>
            <ul className="mt-1 space-y-0.5">
              {receta.advertencias.map((a, i) => (
                <li key={i} className="text-xs text-yellow-700">
                  • {a}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-3">
          {receta.medicamentos.map((med, i) => {
            const query = buildSearchQuery(med);
            const badge = CONFIANZA_BADGE[med.confianza];
            const esEditando = editando === i;

            return (
              <div
                key={i}
                className={`rounded-xl border-2 p-4 ${CONFIANZA_ESTILO[med.confianza] ?? CONFIANZA_ESTILO.alta}`}
              >
                {esEditando ? (
                  /* Modo edición */
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-gray-500">Editar medicamento</p>
                    <input
                      type="text"
                      value={editState.nombre}
                      onChange={(e) => setEditState({ ...editState, nombre: e.target.value })}
                      placeholder="Nombre del medicamento"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                    />
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={editState.valor}
                        onChange={(e) => setEditState({ ...editState, valor: e.target.value })}
                        placeholder="Dosis"
                        className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                      />
                      <select
                        value={editState.unidad}
                        onChange={(e) => setEditState({ ...editState, unidad: e.target.value })}
                        className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-500"
                      >
                        {["mg", "mcg", "g", "ml", "UI", "%"].map((u) => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => guardarEdicion(i)}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-green-600 py-2 text-sm font-medium text-white hover:bg-green-700"
                      >
                        <Check className="h-4 w-4" /> Guardar
                      </button>
                      <button
                        onClick={() => setEditando(null)}
                        className="flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                      >
                        <X className="h-4 w-4" /> Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Modo normal */
                  <>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold leading-tight text-gray-900">
                          {med.nombre_normalizado}
                        </p>
                        {med.concentracion.valor && (
                          <p className="text-sm text-gray-600">
                            {med.concentracion.valor} {med.concentracion.unidad}
                            {med.forma_farmaceutica && ` · ${med.forma_farmaceutica}`}
                          </p>
                        )}
                        {med.posologia.descripcion_original && (
                          <p className="mt-1 text-xs text-gray-500">
                            {med.posologia.descripcion_original}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {badge && (
                          <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
                            {badge}
                          </span>
                        )}
                        <button
                          onClick={() => iniciarEdicion(i, med)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                          title="Editar"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <Link
                      href={`/buscar?q=${encodeURIComponent(query)}`}
                      className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700"
                    >
                      Buscar precios
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Estado: idle — pantalla de captura
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center gap-8 px-4">
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) procesarArchivo(file);
        }}
      />

      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
          <FileImage className="h-10 w-10 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Escanear receta</h1>
        <p className="max-w-xs text-sm text-gray-500">
          Toma una foto de tu receta médica o sube un archivo, y la IA detectará los
          medicamentos automáticamente.
        </p>
      </div>

      <div className="flex w-full max-w-xs flex-col gap-3">
        <button
          onClick={abrirCamara}
          className="flex items-center justify-center gap-3 rounded-xl bg-green-600 px-6 py-4 text-base font-semibold text-white shadow-sm transition-transform hover:bg-green-700 active:scale-95"
        >
          <Camera className="h-5 w-5" />
          Tomar foto de la receta
        </button>
        <button
          onClick={abrirArchivo}
          className="flex items-center justify-center gap-3 rounded-xl border-2 border-gray-200 bg-white px-6 py-4 text-base font-semibold text-gray-700 transition-transform hover:border-green-300 hover:text-green-700 active:scale-95"
        >
          <Upload className="h-5 w-5" />
          Subir imagen o PDF
        </button>
      </div>

      <p className="text-xs text-gray-400">Funciona con recetas manuscritas y digitales</p>
    </div>
  );
}
