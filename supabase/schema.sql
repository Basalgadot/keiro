-- ============================================================
-- FarmaVibe — Schema de base de datos
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- GEOGRAFÍA
-- ============================================================

CREATE TABLE IF NOT EXISTS regiones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(100) NOT NULL,
  numero INTEGER,
  codigo VARCHAR(10)
);

CREATE TABLE IF NOT EXISTS comunas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(100) NOT NULL,
  region_id UUID REFERENCES regiones(id) ON DELETE CASCADE,
  codigo_ine VARCHAR(10)
);

CREATE INDEX idx_comunas_nombre ON comunas(nombre);
CREATE INDEX idx_comunas_region ON comunas(region_id);

-- ============================================================
-- FARMACIAS
-- ============================================================

CREATE TABLE IF NOT EXISTS farmacias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(255) NOT NULL,
  cadena VARCHAR(50) NOT NULL,
  -- Valores posibles: cruzverdefarmacia, salcobrand, ahumada, drsimi, kairosweb, independiente
  direccion TEXT,
  comuna_id UUID REFERENCES comunas(id),
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  telefono VARCHAR(20),
  tiene_despacho BOOLEAN DEFAULT FALSE,
  tiene_retiro BOOLEAN DEFAULT TRUE,
  url_compra TEXT,
  activa BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_farmacias_cadena ON farmacias(cadena);
CREATE INDEX idx_farmacias_comuna ON farmacias(comuna_id);
CREATE INDEX idx_farmacias_activa ON farmacias(activa);

-- ============================================================
-- MEDICAMENTOS
-- ============================================================

CREATE TABLE IF NOT EXISTS medicamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_generico VARCHAR(255) NOT NULL,
  nombre_comercial VARCHAR(255),
  principio_activo VARCHAR(255),
  forma VARCHAR(100),
  -- comprimido, cápsula, jarabe, inyectable, crema, gotas, parche, etc.
  dosis VARCHAR(100),
  requiere_receta BOOLEAN DEFAULT FALSE,
  requiere_receta_retenida BOOLEAN DEFAULT FALSE,
  codigo_isp VARCHAR(50),
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_medicamentos_generico ON medicamentos(nombre_generico);
CREATE INDEX idx_medicamentos_comercial ON medicamentos(nombre_comercial);
CREATE INDEX idx_medicamentos_principio ON medicamentos(principio_activo);
CREATE INDEX idx_medicamentos_isp ON medicamentos(codigo_isp);

-- Búsqueda full-text en español
CREATE INDEX idx_medicamentos_fts ON medicamentos
  USING gin(to_tsvector('spanish', nombre_generico || ' ' || COALESCE(nombre_comercial, '') || ' ' || COALESCE(principio_activo, '')));

-- ============================================================
-- BIOEQUIVALENTES
-- ============================================================

CREATE TABLE IF NOT EXISTS bioequivalentes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medicamento_origen_id UUID REFERENCES medicamentos(id) ON DELETE CASCADE,
  medicamento_equivalente_id UUID REFERENCES medicamentos(id) ON DELETE CASCADE,
  aprobado_isp BOOLEAN DEFAULT TRUE,
  UNIQUE(medicamento_origen_id, medicamento_equivalente_id)
);

-- ============================================================
-- PRECIOS (actualizado por el scraper cada 4 horas)
-- ============================================================

CREATE TABLE IF NOT EXISTS precios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medicamento_id UUID REFERENCES medicamentos(id) ON DELETE CASCADE,
  farmacia_id UUID REFERENCES farmacias(id) ON DELETE CASCADE,
  precio INTEGER NOT NULL,
  -- Precio en pesos chilenos, sin decimales
  precio_normal INTEGER,
  -- Precio sin descuento (si hay oferta)
  stock_disponible BOOLEAN DEFAULT TRUE,
  unidades_disponibles INTEGER,
  fuente VARCHAR(50),
  -- cruzverdefarmacia, salcobrand, ahumada, drsimi, kairosweb, minsal
  url_producto TEXT,
  scraped_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_precios_medicamento ON precios(medicamento_id, scraped_at DESC);
CREATE INDEX idx_precios_farmacia ON precios(farmacia_id);
CREATE INDEX idx_precios_stock ON precios(stock_disponible, scraped_at DESC);

-- ============================================================
-- USUARIOS (extendido de Supabase Auth)
-- ============================================================

CREATE TABLE IF NOT EXISTS perfiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre VARCHAR(255),
  comuna_id UUID REFERENCES comunas(id),
  isapre VARCHAR(100),
  -- Nombre de la Isapre o null si es Fonasa
  fonasa_tramo CHAR(1),
  -- A, B, C o D
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- RECETAS
-- ============================================================

CREATE TABLE IF NOT EXISTS recetas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  imagen_url TEXT,
  texto_extraido TEXT,
  medicamentos_json JSONB,
  tipo VARCHAR(20) DEFAULT 'simple',
  -- simple, retenida, cheque
  fecha_emision DATE,
  fecha_validez DATE,
  estado VARCHAR(20) DEFAULT 'activa',
  -- activa, vencida, usada
  medico_nombre VARCHAR(255),
  medico_rut VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_recetas_usuario ON recetas(user_id, created_at DESC);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Activar RLS en tablas con datos de usuarios
ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE recetas ENABLE ROW LEVEL SECURITY;

-- Perfiles: cada usuario solo ve el suyo
CREATE POLICY "perfiles_select_own" ON perfiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "perfiles_insert_own" ON perfiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "perfiles_update_own" ON perfiles FOR UPDATE USING (auth.uid() = id);

-- Recetas: cada usuario solo ve las suyas
CREATE POLICY "recetas_select_own" ON recetas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "recetas_insert_own" ON recetas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "recetas_delete_own" ON recetas FOR DELETE USING (auth.uid() = user_id);

-- Datos públicos sin RLS: regiones, comunas, farmacias, medicamentos, precios
-- (son datos de negocio, no personales)
