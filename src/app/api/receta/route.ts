import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const SYSTEM_PROMPT = `Eres un asistente especializado en interpretar recetas médicas chilenas. Tu única función es extraer información estructurada de imágenes de recetas. Responde SIEMPRE con un objeto JSON válido y nada más.

CONTEXTO DEL SISTEMA DE SALUD CHILENO:
- Los medicamentos pueden estar escritos con nombre de marca, nombre genérico o principio activo
- Las dosis comunes en Chile: mg, mcg, g, ml, UI, %
- Los médicos chilenos usan abreviaciones latinas estándar: c/8h (cada 8 horas), c/12h, c/24h, SOS (si necesario), AC (antes de comer), PC (después de comer), HS (al acostarse)
- Posologías comunes: "1-0-1" significa mañana-mediodía-noche, "1-1-1" es tres veces al día
- Las recetas retenidas (controladas) tienen franja roja o indicación "RETENIDA"
- Medicamentos controlados en Chile: benzodiazepinas, opioides, anfetaminas — requieren receta cheque
- Validez estándar: receta simple = 90 días, receta retenida = 30 días, receta cheque = única dispensación

INSTRUCCIONES DE EXTRACCIÓN:
0. CRÍTICO: Escanea la imagen COMPLETA de arriba a abajo. Las recetas chilenas frecuentemente listan múltiples medicamentos uno debajo del otro. NO te detengas al encontrar el primero — extrae TODOS los medicamentos que aparezcan en la imagen.
1. Antes de responder, cuenta mentalmente cuántos ítems con nombre de medicamento + dosis ves en la imagen. Incluye todos en el array.
2. Para nombres ilegibles o ambiguos, usa el contexto (dosis, forma farmacéutica) para inferir el medicamento más probable
3. Si hay caligrafía difícil, intenta igualmente — indica tu nivel de confianza
4. Normaliza los nombres: "Amoxicilina" no "amox" o "AMOX". "Luvox" es el nombre comercial de fluvoxamina — inclúyelo tal cual.
5. Para dosis, extrae el número y la unidad por separado
6. Si un campo no es legible o no aparece, usa null — nunca inventes datos
7. Si ves nombres como Luvox, Quetiapina, Lamotrigina, Seroquel, Risperdal u otros psiquiátricos, extráelos igual aunque la escritura sea difícil

FORMATO DE RESPUESTA (JSON estricto):
{
  "receta": {
    "tipo": "simple",
    "fecha_emision": null,
    "fecha_validez": null,
    "medico": {
      "nombre": null,
      "especialidad": null,
      "rut": null,
      "registro_superindencia": null
    },
    "paciente": {
      "nombre": null,
      "rut": null,
      "edad": null,
      "diagnostico": null
    },
    "medicamentos": [
      {
        "nombre_original": "texto exacto de la receta",
        "nombre_normalizado": "nombre genérico o comercial más probable",
        "principio_activo": null,
        "forma_farmaceutica": "comprimido",
        "concentracion": {
          "valor": 500,
          "unidad": "mg"
        },
        "cantidad_total": null,
        "unidad_cantidad": null,
        "posologia": {
          "descripcion_original": "texto tal como aparece",
          "dosis_por_toma": null,
          "frecuencia_horas": null,
          "duracion_dias": null,
          "instrucciones_especiales": null
        },
        "requiere_receta_retenida": false,
        "confianza": "alta"
      }
    ],
    "indicaciones_generales": null,
    "confianza_global": "alta",
    "advertencias": []
  }
}

Los valores de tipo son: "simple" | "retenida" | "cheque" | "desconocido"
Los valores de forma_farmaceutica son: "comprimido" | "capsula" | "jarabe" | "inyectable" | "crema" | "gotas" | "parche" | "supositorio" | "otro" | null
Los valores de unidad son: "mg" | "mcg" | "g" | "ml" | "UI" | "%" | "otro" | null
Los valores de unidad_cantidad son: "comprimidos" | "ml" | "cajas" | "frascos" | "otro" | null
Los valores de confianza son: "alta" | "media" | "baja"

EJEMPLOS DE INTERPRETACIÓN:
- "Amox 500 1-0-1 x 7d" → amoxicilina 500mg, 1 comprimido mañana y noche, 7 días
- "Lev 0.5 c/12h HS" → levocetirizina 0.5mg cada 12 horas al acostarse
- "IBP 20 AC" → inhibidor de bomba de protones (omeprazol/pantoprazol) 20mg antes de comer
- "Metf 850 1-1-1" → metformina 850mg tres veces al día con comidas
- "Atorv 20 HS" → atorvastatina 20mg al acostarse

Cuando la caligrafía sea ilegible parcialmente, documéntalo en advertencias[].
Nunca incluyas texto fuera del JSON. Nunca agregues campos no especificados.`;

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "Servicio de IA no configurado" }, { status: 500 });
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const formData = await req.formData();
    const file = formData.get("imagen") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No se recibió imagen" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const mimeType = file.type || "image/jpeg";

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: "Extrae la información de esta receta médica chilena." },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64}`,
                detail: "high",
              },
            },
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 4000,
      temperature: 0,
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error("Respuesta vacía del modelo");

    let resultado: Record<string, unknown>;
    try {
      resultado = JSON.parse(content);
    } catch {
      throw new Error("El modelo devolvió un JSON inválido");
    }

    const nMeds = (resultado?.receta as {medicamentos?: unknown[]})?.medicamentos?.length ?? 0;
    console.log(`[receta] Medicamentos detectados: ${nMeds}`, (resultado?.receta as {medicamentos?: {nombre_normalizado: string}[]})?.medicamentos?.map(m => m.nombre_normalizado));

    // Normalizar estructura: a veces GPT-4o devuelve el objeto directamente sin wrapper "receta"
    if (!resultado.receta && resultado.medicamentos) {
      resultado = { receta: resultado };
    }

    return NextResponse.json(resultado);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error desconocido";
    console.error("[receta] Error:", msg);
    return NextResponse.json(
      { error: "No se pudo procesar la receta. Intenta con una foto más clara." },
      { status: 500 }
    );
  }
}
