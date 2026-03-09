export interface PrecioScrapeado {
  /** Término buscado (nombre del medicamento) */
  query: string;
  /** Nombre del producto tal como aparece en la farmacia */
  nombre_producto: string;
  /** Precio en pesos CLP */
  precio: number;
  /** Precio normal antes de descuento (si existe) */
  precio_normal?: number;
  /** Hay stock disponible */
  stock: boolean;
  /** URL del producto en la farmacia */
  url?: string;
  /** Cadena: cruzverdefarmacia | salcobrand | ahumada | drsimi */
  cadena: string;
}
