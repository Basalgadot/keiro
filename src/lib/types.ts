export type Cadena =
  | "cruzverdefarmacia"
  | "salcobrand"
  | "ahumada"
  | "drsimi"
  | "kairosweb"
  | "independiente";

export interface Region {
  id: string;
  nombre: string;
}

export interface Comuna {
  id: string;
  nombre: string;
  region_id: string;
}

export interface Farmacia {
  id: string;
  nombre: string;
  cadena: Cadena;
  direccion: string | null;
  comuna_id: string;
  lat: number | null;
  lng: number | null;
  tiene_despacho: boolean;
  tiene_retiro: boolean;
  url_compra: string | null;
  activa: boolean;
}

export interface Medicamento {
  id: string;
  nombre_generico: string;
  nombre_comercial: string | null;
  principio_activo: string | null;
  forma: string | null;
  dosis: string | null;
  requiere_receta: boolean;
  codigo_isp: string | null;
}

export interface Precio {
  id: string;
  medicamento_id: string;
  farmacia_id: string;
  precio: number;
  precio_normal: number | null;
  stock_disponible: boolean;
  fuente: string;
  scraped_at: string;
}

export interface ResultadoBusqueda {
  medicamento: Pick<Medicamento, "id" | "nombre_generico" | "nombre_comercial" | "forma" | "dosis" | "requiere_receta">;
  farmacia: Pick<Farmacia, "id" | "nombre" | "cadena" | "direccion" | "tiene_despacho" | "tiene_retiro" | "url_compra">;
  comuna: Pick<Comuna, "nombre">;
  precio: number;
  precio_normal: number | null;
  stock_disponible: boolean;
  scraped_at: string;
}

export const CADENA_LABEL: Record<Cadena, string> = {
  cruzverdefarmacia: "Cruz Verde",
  salcobrand: "Salcobrand",
  ahumada: "Ahumada",
  drsimi: "Dr. Simi",
  kairosweb: "Kairos Web",
  independiente: "Farmacia independiente",
};

// --- Recetas ---

export interface MedicamentoExtraido {
  nombre_original: string;
  nombre_normalizado: string;
  principio_activo: string | null;
  forma_farmaceutica: string | null;
  concentracion: {
    valor: number | null;
    unidad: string | null;
  };
  cantidad_total: number | null;
  unidad_cantidad: string | null;
  posologia: {
    descripcion_original: string;
    dosis_por_toma: number | null;
    frecuencia_horas: number | null;
    duracion_dias: number | null;
    instrucciones_especiales: string | null;
  };
  requiere_receta_retenida: boolean;
  confianza: "alta" | "media" | "baja";
}

export interface RecetaExtraida {
  tipo: "simple" | "retenida" | "cheque" | "desconocido";
  fecha_emision: string | null;
  fecha_validez: string | null;
  medico: {
    nombre: string | null;
    especialidad: string | null;
    rut: string | null;
    registro_superindencia: string | null;
  };
  paciente: {
    nombre: string | null;
    rut: string | null;
    edad: string | null;
    diagnostico: string | null;
  };
  medicamentos: MedicamentoExtraido[];
  indicaciones_generales: string | null;
  confianza_global: "alta" | "media" | "baja";
  advertencias: string[];
}

export const CADENA_COLOR: Record<Cadena, string> = {
  cruzverdefarmacia: "#007C3E",
  salcobrand: "#E4002B",
  ahumada: "#0057A8",
  drsimi: "#F5A623",
  kairosweb: "#6D28D9",
  independiente: "#6B7280",
};
