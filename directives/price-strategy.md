# Directiva: Estrategia de Precios Localizados

## Objetivo
Obtener precios reales y stock disponible de medicamentos por comuna en Chile, para Cruz Verde, Salcobrand, Ahumada y farmacias independientes.

---

## Evaluación de Opciones

### Opción A: APIs Oficiales de las Cadenas
**Estado:** No existen APIs públicas documentadas para Cruz Verde, Salcobrand ni Ahumada.
- Cruz Verde (cruzverdefarmacia.cl): Sin API pública
- Salcobrand (salcobrand.cl): Sin API pública
- Ahumada (farmaciasahumada.cl): Sin API pública
- **Conclusión:** No viable como fuente primaria.

### Opción B: Acuerdos de Datos
**Estado:** Posible a futuro, no viable para MVP.
- Requiere negociación legal y tiempo
- Ninguna cadena chilena tiene programa de datos para terceros documentado
- **Conclusión:** Descartar para MVP. Retomar en v2 si hay tracción.

### Opción C: Datos Oficiales del Gobierno + Scraping Selectivo
**Estado:** VIABLE — estrategia recomendada para MVP.

#### Fuente 1: MINSAL / Fijación de Precios de Medicamentos
- URL: https://www.minsal.cl y https://datos.gob.cl
- El Decreto Supremo N° 466 obliga a farmacias a reportar precios al Ministerio de Salud
- Portal ISP publica precios regulados por producto
- **Limitación:** Precios regulados, no necesariamente precio final al público. Sin stock.
- **Uso:** Baseline de precios y validación de rango razonable.

#### Fuente 2: Scraping con Playwright (headless browser)
- Las 3 cadenas tienen buscadores en sus sitios web que devuelven precios y stock
- Playwright maneja JavaScript dinámico (los sitios usan React/Vue)
- Se scrapea por farmacia + medicamento una vez cada 4 horas, no por usuario
- Los resultados se guardan en la DB propia → usuarios consultan la DB (rápido)

**URLs objetivo:**
- Cruz Verde: `https://www.cruzverdefarmacia.cl/buscar/{query}`
- Salcobrand: `https://salcobrand.cl/t/{query}`
- Ahumada: `https://www.farmaciasahumada.cl/busqueda?query={query}`
- Dr. Simi: `https://www.drsimi.cl/buscar?q={query}`
- Kairos Web: `https://www.kairosweb.cl/buscar/{query}`
- Farmacias independientes: Bsale API (autenticación por farmacia, documentación en bsale.cl/api)

#### Fuente 3: Dr. Simi y Kairos Web
- **Dr. Simi** (drsimi.cl): precios habitualmente más bajos que las cadenas grandes, muy popular en Chile. Sitio con buscador scrappeable.
- **Kairos Web** (kairosweb.cl): farmacia 100% online, fuerte en despacho a domicilio. Scraping similar a las cadenas.
- Incluir en MVP por diferenciación de precio y cobertura de despacho.

#### Fuente 4: Farmacias independientes via Bsale API
- Bsale es el ERP/POS más usado en farmacias independientes chilenas
- Tienen API pública documentada que expone catálogo y stock en tiempo real
- Con una sola integración se accede a decenas de farmacias locales independientes
- Esto diferencia a Keiro de solo comparar cadenas grandes
- Incluir en MVP (Semana 1 o 2, dependiendo de complejidad de onboarding Bsale)

---

## Decisión: Estrategia Híbrida (C)

```
MINSAL datos.gob.cl (precios regulados)
  + Scraping periódico de las 3 cadenas (cada 4 horas)
  → DB propia en Supabase
  → Usuarios consultan la DB (< 200ms)
```

---

## Anti-bloqueo para Scraping

### Nivel 1 — Suficiente para MVP (implementar primero):
- User-Agent rotation (pool de ~10 user agents reales)
- Headers HTTP realistas (Accept-Language: es-CL, etc.)
- Delays aleatorios entre requests (2-5 segundos)
- Respetar robots.txt y no hacer más de 1 request/segundo por dominio

### Nivel 2 — Si el Nivel 1 falla (agregar si hay bloqueos):
- Rotating residential proxies: BrightData (~$15/GB) o Oxylabs
- Browser fingerprinting con playwright-stealth
- CAPTCHA solving: 2captcha o Anti-Captcha como último recurso

### Nota importante:
El scraping de precios de productos públicos en sitios de retail es una zona gris legal en Chile. Los precios son información pública. Sin embargo, revisar TOS de cada sitio antes de producción. Alternativa a largo plazo: contactar a las cadenas para un acuerdo de datos.

---

## Schema de DB para Precios

```sql
-- Tabla principal de precios scrapeados
CREATE TABLE precios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medicamento_id UUID REFERENCES medicamentos(id),
  farmacia_id UUID REFERENCES farmacias(id),
  precio INTEGER NOT NULL,  -- en pesos chilenos, sin decimales
  precio_normal INTEGER,    -- precio sin descuento si hay oferta
  stock_disponible BOOLEAN DEFAULT true,
  unidades_disponibles INTEGER,  -- si el sitio lo expone
  fuente VARCHAR(50),  -- 'cruzverdefarmacia', 'salcobrand', 'ahumada', 'minsal'
  scraped_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index para consultas por medicamento + comuna
CREATE INDEX idx_precios_medicamento ON precios(medicamento_id, scraped_at DESC);

-- Farmacias con ubicación
CREATE TABLE farmacias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(255) NOT NULL,
  cadena VARCHAR(50) NOT NULL,  -- 'cruzverdefarmacia', 'salcobrand', 'ahumada'
  direccion TEXT,
  comuna_id UUID REFERENCES comunas(id),
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  tiene_despacho BOOLEAN DEFAULT false,
  tiene_retiro BOOLEAN DEFAULT true,
  url_compra TEXT,  -- deep link a la página del producto en su sitio
  activa BOOLEAN DEFAULT true
);
```

---

## Script de Scraping

Ubicación: `execution/scraper_farmacias.py`

**Inputs:**
- Lista de medicamentos a buscar (desde DB)
- Comunas objetivo (inicialmente: Santiago, Providencia, Las Condes, Maipú, Pudahuel)

**Output:**
- Registros insertados/actualizados en tabla `precios`
- Log de errores en `.tmp/scraper_errors.log`

**Schedule:**
- Cada 4 horas vía Supabase Edge Function cron
- Trigger manual disponible vía endpoint protegido

**Manejo de errores:**
- Si un sitio falla, marcar `stock_disponible = false` para esa farmacia (no borrar precio anterior)
- Alertar si 2 intentos consecutivos fallan (posible bloqueo)
- Reintentar con backoff exponencial: 1min, 5min, 15min

---

## KPIs de Calidad de Datos

- Cobertura: >= 80% de medicamentos top-100 con precio actualizado en últimas 4h
- Latencia de consulta: < 200ms (siempre desde DB, nunca scraping en vivo)
- Precisión de precio: validar spot-check manual semanal contra precio real en caja

---

*Última actualización: 2026-03-05*
