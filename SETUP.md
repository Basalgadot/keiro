# Keiro — Guía de Setup para Benjamín

Esta guía te dice exactamente qué hacer para conectar los servicios externos. Sigue los pasos en orden.

---

## PASO 1: GitHub (para guardar el código)

1. Ve a [github.com](https://github.com) y crea una cuenta si no tienes
2. Crea un repositorio nuevo → llámalo `keiro` → marca como **Private**
3. Copia la URL del repositorio (termina en `.git`)
4. Avísame la URL y yo conecto el proyecto

---

## PASO 2: Supabase (la base de datos)

**¿Qué es?** El lugar donde se guardan todos los datos: precios, farmacias, recetas, usuarios.

1. Ve a [supabase.com](https://supabase.com) → **Start for Free**
2. Crea una cuenta con Google o email
3. Crea un nuevo proyecto:
   - Nombre: `keiro`
   - Contraseña de base de datos: genera una fuerte y guárdala en un lugar seguro
   - Región: **South America (São Paulo)** — es la más cercana a Chile
4. Espera ~2 minutos mientras crea el proyecto
5. Ve a **Settings → API** y copia:
   - `Project URL` → es tu `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → es tu `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role secret` key → es tu `SUPABASE_SERVICE_ROLE_KEY` (NUNCA compartir)
6. Pega los tres valores en el archivo `.env.local` del proyecto
7. Ve a **SQL Editor** en Supabase, copia el contenido de `supabase/schema.sql` y ejecútalo
8. Luego copia el contenido de `supabase/seed.sql` y ejecútalo también

---

## PASO 3: Vercel (para publicar la web)

**¿Qué es?** El servicio que hace que tu web esté disponible en internet.

1. Ve a [vercel.com](https://vercel.com) → **Start Deploying**
2. Conecta con tu cuenta de GitHub
3. Importa el repositorio `keiro`
4. En la sección **Environment Variables**, agrega todas las variables de `.env.local`
5. Haz clic en **Deploy**

La app quedará en una URL como `keiro.vercel.app` mientras no tengas dominio propio.

---

## PASO 4: Google Cloud (para mapas y autocompletado de dirección)

**¿Cuándo lo necesito?** Semana 2. Por ahora la app funciona sin esto.

1. Ve a [console.cloud.google.com](https://console.cloud.google.com)
2. Crea un proyecto nuevo → llámalo `keiro`
3. Ve a **APIs y Servicios → Biblioteca**
4. Busca y activa:
   - **Places API** (autocompletado de direcciones)
   - **Maps JavaScript API** (mapa en pantalla)
   - **Geocoding API** (convertir dirección a coordenadas)
5. Ve a **APIs y Servicios → Credenciales → Crear credencial → API key**
6. En la API key, configura restricciones:
   - Tipo: **Sitios web HTTP**
   - Agrega: `localhost:3000/*` y `*.vercel.app/*`
7. Copia la API key → pégala en `.env.local` como `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

**Nota de costo:** Google da $200 USD gratis al mes. Para el MVP no deberías pagar nada.

---

## PASO 5: OpenAI (para leer las recetas médicas)

**¿Cuándo lo necesito?** Semana 2. Por ahora la app funciona sin esto.

1. Ve a [platform.openai.com](https://platform.openai.com)
2. Crea una cuenta o inicia sesión
3. Ve a **Billing → Add payment method** → agrega una tarjeta (te cobrarán por uso)
4. Agrega $20 USD de crédito inicial — suficiente para el MVP
5. Ve a **API Keys → Create new secret key**
6. Copia la key → pégala en `.env.local` como `OPENAI_API_KEY`

**Nota de costo:** Cada receta escaneada cuesta ~$0.01 USD. Con $20 puedes escanear ~2.000 recetas.

---

## PASO 6: Flow.cl (para recibir pagos)

**¿Cuándo lo necesito?** Semana 4.

1. Ve a [flow.cl](https://www.flow.cl) → **Crear cuenta**
2. Completa el registro empresarial (puede pedir RUT de empresa o persona natural)
3. Sube los documentos solicitados (cédula de identidad, etc.)
4. Espera la aprobación (3-5 días hábiles)
5. Una vez aprobado, ve a **Configuración → API Keys**
6. Copia `API Key` y `Secret Key` → pégalas en `.env.local`

**Entorno de prueba:** Puedes usar el entorno sandbox antes de la aprobación para probar pagos sin dinero real.

---

## PASO 7: Dominio .cl (opcional para MVP)

**¿Cuándo lo necesito?** Semana 4, si quieres un dominio propio en vez de `keiro.vercel.app`.

1. Ve a [nic.cl](https://nic.cl) → busca `keiro.cl`
2. Si está disponible, regístralo (~$10.000 CLP/año)
3. Configura los DNS apuntando a Vercel (te doy las instrucciones cuando llegue el momento)

---

## Estado actual de configuración

| Servicio | Estado | Necesario para |
|---|---|---|
| GitHub | Pendiente | Guardar código |
| Supabase | Pendiente | Todo |
| Vercel | Pendiente | Ver la web en internet |
| Google Cloud | Pendiente | Semana 2 |
| OpenAI | Pendiente | Semana 2 |
| Flow.cl | En gestión | Semana 4 |
| Dominio .cl | Opcional | Semana 4 |

---

*Para ejecutar la app localmente sin nada configurado: `cd keiro && npm run dev` y abre `http://localhost:3000`. Los datos de ejemplo ya están incluidos.*
