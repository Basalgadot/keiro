# TECHNICAL.md — Keiro

Decisiones técnicas del proyecto. Documento vivo — actualizar ante cambios de stack o aprendizajes.

---

## Stack Completo

### Frontend

| Componente | Tecnología | Versión | Razón |
|---|---|---|---|
| Framework | Next.js | 14+ (App Router) | SSR/SSG, PWA-ready, ecosistema React maduro |
| Lenguaje | TypeScript | 5+ | Tipado estático, reduce bugs en producción |
| Estilos | Tailwind CSS | 3+ | Utilidades, mobile-first, rápido de iterar |
| Componentes UI | shadcn/ui | latest | Sin dependencias pesadas, accesible, customizable |
| Estado cliente | Zustand | 4+ | Simple, liviano, sin boilerplate de Redux |
| Formularios | React Hook Form + Zod | latest | Validación robusta con mínimo código |
| PWA | next-pwa | latest | Service worker, instalable en Android/iOS |

### Backend / Infraestructura

| Componente | Tecnología | Razón |
|---|---|---|
| Auth | Supabase Auth | Magic links + Google OAuth, gratis en MVP |
| Base de datos | Supabase (PostgreSQL) | Relacional, Row Level Security para datos sensibles |
| Storage | Supabase Storage | Almacenamiento de recetas (imágenes/PDFs), acceso controlado por usuario |
| API Routes | Next.js API Routes | Evita servidor separado en MVP, serverless |
| Edge Functions | Supabase Edge Functions | Para lógica sensible sin exponer en cliente |

### IA / OCR

| Componente | Tecnología | Razón |
|---|---|---|
| OCR recetas | GPT-4o Vision (OpenAI) | Mejor manejo de caligrafía médica y español; fallback: Google Cloud Vision |
| Modelo primario | gpt-4o | Balance costo/calidad para extracción estructurada |
| Validación ISP | MINSAL/ISP API pública | Crosscheck de nombre y código de medicamento |

### Mapas y Ubicación

| Componente | Tecnología | Razón |
|---|---|---|
| Autocompletado dirección | Google Places API | Cubre Chile perfectamente, comunas incluidas |
| Geolocalización | Browser Geolocation API | Nativo, sin costo adicional |
| Geocoding | Google Geocoding API | Convertir coordenadas a comuna/región |

### Precios de Farmacias

Ver `directives/price-strategy.md` para la estrategia completa.

| Componente | Tecnología | Razón |
|---|---|---|
| Scraper | Python (Playwright) | Headless browser, maneja JS dinámico de las farmacias |
| Scheduler | Supabase Edge Functions + cron | Actualización periódica de precios en DB |
| Cache de precios | PostgreSQL (Supabase) | TTL de 4 horas por producto/farmacia/comuna |
| Proxy rotation | BrightData o Oxylabs | Evitar bloqueos en scraping (solo si necesario) |
| Datos oficiales | datos.gob.cl + MINSAL | Precios regulados como baseline |
| API independientes | Bsale API | Farmacias independientes chilenas (un solo contrato, acceso a decenas de locales) |

**Fuentes de precios cubiertos en MVP:**
Cruz Verde, Salcobrand, Ahumada, Dr. Simi, Kairos Web + farmacias independientes via Bsale

### Pagos

| Componente | Tecnología | Razón |
|---|---|---|
| Procesador | Flow.cl | Acepta tarjeta crédito (Visa/MC/Amex), débito Redcompra y transferencia bancaria. API limpia, 100% chileno. |
| Fallback | Webpay Plus (Transbank) | Si Flow no cubre algún caso, agregar en v2 |

**Nota:** Flow cubre todos los métodos de pago relevantes para Chile (tarjeta + débito + transferencia). No se necesita Mercado Pago ni procesador adicional para MVP.

### DevOps

| Componente | Tecnología | Razón |
|---|---|---|
| Hosting frontend | Vercel | Deploy automático, CDN global, gratis en MVP |
| Hosting scripts | Supabase Edge Functions o Railway | Scripts Python de scraping |
| CI/CD | GitHub Actions | Tests y deploy automático |
| Monitoreo | Sentry (free tier) | Captura de errores en producción |
| Variables secretas | Vercel Env + .env.local | Separación dev/prod |

---

## Estructura de Base de Datos

```sql
-- Usuarios
users (id, email, nombre, comuna_id, isapre, fonasa, created_at)

-- Comunas y regiones (lookup)
comunas (id, nombre, region_id, codigo_ine)
regiones (id, nombre)

-- Farmacias
farmacias (id, nombre, cadena, direccion, comuna_id, lat, lng, telefono)

-- Medicamentos (catálogo ISP)
medicamentos (id, nombre_generico, nombre_comercial, principio_activo, forma, dosis, requiere_receta, codigo_isp)

-- Bioequivalentes
bioequivalentes (id, medicamento_origen_id, medicamento_equivalente_id)

-- Precios (actualizado cada 4h)
precios (id, medicamento_id, farmacia_id, precio, stock_disponible, updated_at)

-- Recetas
recetas (id, user_id, imagen_url, texto_extraido, medicamentos_json, fecha_validez, estado, created_at)

-- Seguros del usuario
seguros_usuario (id, user_id, tipo, nombre_plan, porcentaje_cobertura)
```

---

## Flujo de Datos Principal

```
Usuario escanea receta
  → Next.js API Route → GPT-4o Vision → JSON estructurado
  → Validación contra catálogo ISP (DB)
  → Búsqueda de precios en DB (cache de 4h) + stock por comuna
  → Cálculo de copago (reglas Fonasa/Isapre)
  → Presentación comparativa con alternativas bioequivalentes
  → Selección y redirección a Flow para pago
```

---

## Seguridad y Privacidad

- Row Level Security (RLS) en Supabase: cada usuario solo ve sus propias recetas
- Imágenes de recetas en bucket privado de Supabase Storage (URLs firmadas con TTL)
- No almacenar datos de tarjeta (delegado a Flow/Transbank)
- HTTPS forzado en producción
- Rate limiting en API routes de OCR (costoso y abusable)
- Logs de acceso a recetas para auditoría

---

## Variables de Entorno Necesarias

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# OpenAI
OPENAI_API_KEY=

# Google
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
GOOGLE_CLOUD_VISION_API_KEY=  # fallback OCR

# Flow.cl
FLOW_API_KEY=
FLOW_SECRET_KEY=

# Scraping (si aplica)
BRIGHTDATA_API_KEY=

# App
NEXT_PUBLIC_APP_URL=
NODE_ENV=development
```

---

## Decisiones Clave y Razonamiento

1. **GPT-4o sobre Google Vision para OCR:** La caligrafía médica en español requiere comprensión de contexto, no solo reconocimiento de caracteres. GPT-4o entiende que "Amox 500 mg 1-0-1 x 7d" es amoxicilina 500mg, 3 veces al día por 7 días.

2. **Flow sobre Webpay Plus:** API más moderna y fácil de integrar. Webpay requiere más burocracia de onboarding con Transbank.

3. **Precios en DB propia (no scraping en tiempo real):** Scraping en tiempo real por usuario es lento y costoso. Mejor estrategia: scraper periódico que puebla una DB propia, y el usuario consulta la DB. Cache de 4 horas es aceptable para precios de farmacia.

4. **Next.js App Router:** Permite RSC (React Server Components) para reducir JS en el cliente — crítico en mobile-first.

5. **Supabase sobre Firebase:** PostgreSQL con SQL real es más mantenible. Row Level Security es más expresivo que reglas de Firebase.

---

*Última actualización: 2026-03-05*
