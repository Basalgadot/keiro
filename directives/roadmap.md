# Roadmap Keiro — 4 Semanas MVP

## Semana 1: Cimientos + Búsqueda manual
**Lo que Benjamín podrá hacer al final de la semana:**
- Abrir la app en el celular (como si fuera app instalada)
- Ingresar su dirección y ver que la app reconoce su comuna
- Buscar un medicamento por nombre y ver precios de Cruz Verde, Salcobrand y Ahumada

**Tareas técnicas:**
- [ ] Setup proyecto Next.js + Supabase + Tailwind + TypeScript
- [ ] Configurar PWA (instalable en Android e iOS)
- [ ] Diseño y layout mobile-first: pantalla de inicio, barra de búsqueda
- [ ] Integración Google Places API para autocompletado de dirección
- [ ] Scraper base en Python para Cruz Verde + Salcobrand (top 50 medicamentos)
- [ ] DB schema: comunas, farmacias, medicamentos, precios
- [ ] Pantalla de resultados: lista de precios por farmacia

**Hito de validación:**
Benjamín busca "Paracetamol 500mg" en Santiago y ve precios reales de las 3 cadenas.

---

## Semana 2: Escaneo de Recetas
**Lo que Benjamín podrá hacer al final de la semana:**
- Sacar foto de una receta con el celular
- Ver en pantalla los medicamentos que la IA reconoció, con sus dosis
- Confirmar o corregir si algo está mal
- La app busca automáticamente los precios de lo que dice la receta

**Tareas técnicas:**
- [ ] UI de captura de receta (cámara del navegador + carga de archivo)
- [ ] Integración GPT-4o Vision con el system prompt definido
- [ ] Parseo y validación del JSON extraído contra catálogo ISP
- [ ] Pantalla de revisión de receta (confirmación por el usuario)
- [ ] Flujo completo: foto → medicamentos detectados → búsqueda de precios

**Hito de validación:**
Benjamín fotografía una receta manuscrita y la app identifica correctamente los medicamentos y muestra precios comparativos.

---

## Semana 3: Copago + Bioequivalentes + Bóveda
**Lo que Benjamín podrá hacer al final de la semana:**
- Ingresar su Isapre o Fonasa y ver cuánto pagará realmente en caja
- Ver alternativas genéricas más baratas para cada medicamento recetado
- Guardar su receta en la app para reutilizarla en compras futuras

**Tareas técnicas:**
- [ ] Auth de usuarios (magic link por email + Google)
- [ ] Perfil de usuario: Isapre, Fonasa, seguros complementarios
- [ ] Calculadora de copago (reglas FONASA tramos A-B-C-D, lógica Isapre simplificada)
- [ ] Motor de bioequivalencia: mostrar alternativa genérica aprobada por ISP
- [ ] Bóveda de recetas: storage seguro con acceso solo del usuario
- [ ] Historial de recetas guardadas

**Hito de validación:**
Benjamín, con Fonasa B, escanea una receta y la app le dice "pagarás $3.200 en Cruz Verde, o $1.100 con el genérico en Salcobrand".

---

## Semana 4: Pulido + Compra + Lanzamiento
**Lo que Benjamín podrá hacer al final de la semana:**
- Ir a pagar directamente desde la app (integrado con Flow)
- Compartir la app con amigos (está en el dominio definitivo, funciona bien)
- Ver que la app se ve bien en iPhone y Android, rápida y sin bugs obvios

**Tareas técnicas:**
- [ ] Integración Flow.cl para pago (redirección a sitio de farmacia o pago directo)
- [ ] Notificaciones por email al guardar/usar receta
- [ ] Pulido de UI/UX: estados de carga, mensajes de error amigables, onboarding
- [ ] Testing end-to-end de los flujos principales
- [ ] SEO básico y PWA manifiesto completo
- [ ] Deploy en dominio definitivo (keiro.cl o similar)
- [ ] Monitoreo básico con Sentry

**Hito de validación:**
Benjamín puede mostrarle la app a alguien que nunca la vio, que puede escanear una receta, ver precios y pagar, sin necesitar ayuda.

---

## Backlog Post-MVP (v2)

- Farmacias independientes vía integración Bsale
- Notificaciones push cuando bajan precios de medicamentos que el usuario compra regularmente
- Acuerdos de datos con cadenas para datos oficiales en tiempo real
- Historial de compras y gasto mensual en medicamentos
- Renovación automática de recetas recurrentes
- Geolocalización de farmacias en mapa

---

## Dependencias Críticas para Iniciar

| Dependencia | Acción requerida | Urgente |
|---|---|---|
| Cuenta Supabase | Crear cuenta free en supabase.com | Semana 1 |
| OpenAI API Key | Cuenta en platform.openai.com, agregar créditos ($20 suficiente para MVP) | Semana 2 |
| Google Maps API Key | Google Cloud Console, habilitar Places + Geocoding APIs | Semana 1 |
| Flow.cl | Solicitar cuenta en flow.cl (puede tardar 3-5 días hábiles) | Semana 3 |
| Dominio .cl | Comprar en NIC Chile o registrador | Semana 4 |

---

*Última actualización: 2026-03-05*
