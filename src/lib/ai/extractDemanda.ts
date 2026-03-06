import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface DemandaExtraida {
  jurisdiccionJuzgado: {
    jurisdiccion: string | null;
    juzgado: string | null;
    ciudad: string | null;
    especialidad: string | null;
  };
  radicado: string | null;
  partes: {
    demandantes: Array<{ nombre: string; tipo?: string }>;
    demandados: Array<{ nombre: string; tipo?: string }>;
    apoderados: Array<{ nombre: string; tp?: string; representa: string }>;
  };
  calidadVinculacionCliente: {
    calidad: string | null;
    descripcion: string | null;
  };
  polizaRamo: {
    hayPoliza: boolean;
    numeroPoliza: string | null;
    aseguradora: string | null;
    ramo: string | null;
    descripcionCobertura: string | null;
  };
  sintesisPretensiones: {
    declarativas: string[];
    condenatorias: string[];
  };
  pretensionesContraCliente: {
    detalle: Array<{ concepto: string; valor: number | null }>;
    totalPretendido: number | null;
    moneda: string;
  };
  cuantiaGlobal: {
    valor: number | null;
    moneda: string;
    descripcion: string | null;
  };
  hechosclave: string;
  fundamentosJuridicos: {
    normas: string[];
    jurisprudencia: string[];
  };
  fortalezasDemanda: {
    resumen: string;
    items: Array<{ descripcion: string; impacto: 'alto' | 'medio' | 'bajo' }>;
  };
  debilidadesDemanda: {
    resumen: string;
    items: Array<{ tipo: string; descripcion: string; impacto: 'alto' | 'medio' | 'bajo' }>;
  };
  estrategiaDefensa: {
    resumenEstrategico: string;
    lineasDefensa: Array<{
      prioridad: 'principal' | 'subsidiaria';
      titulo: string;
      descripcion: string;
      tipoExcepcion?: string;
    }>;
    advertencias: string[];
    proximosPasos: string[];
  };
}

export async function extractDemanda(texto: string): Promise<DemandaExtraida> {
  const textoTruncado = texto.length > 12000
    ? texto.substring(0, 12000) + '\n\n[Documento truncado]'
    : texto;

  const systemPrompt = `Eres un asistente jurídico especializado en derecho colombiano. Responde ÚNICAMENTE con JSON válido, sin texto adicional, sin markdown.`;

  // === LLAMADA 1: Datos factuales del proceso ===
  const prompt1 = `Analiza este documento judicial colombiano. Responde SOLO con este JSON (sin texto extra):

{
  "jurisdiccionJuzgado": { "jurisdiccion": null, "juzgado": null, "ciudad": null, "especialidad": null },
  "radicado": null,
  "partes": {
    "demandantes": [],
    "demandados": [],
    "apoderados": []
  },
  "calidadVinculacionCliente": { "calidad": null, "descripcion": null },
  "polizaRamo": { "hayPoliza": false, "numeroPoliza": null, "aseguradora": null, "ramo": null, "descripcionCobertura": null },
  "sintesisPretensiones": { "declarativas": [], "condenatorias": [] },
  "pretensionesContraCliente": { "detalle": [], "totalPretendido": null, "moneda": "COP" },
  "cuantiaGlobal": { "valor": null, "moneda": "COP", "descripcion": null },
  "hechosclave": "",
  "fundamentosJuridicos": { "normas": [], "jurisprudencia": [] }
}

Reglas:
- partes.demandantes: [{ "nombre": string, "tipo": "persona natural"|"persona jurídica"|"entidad pública" }]
- partes.demandados: igual que demandantes
- partes.apoderados: [{ "nombre": string, "tp": string|null, "representa": string }]
- calidadVinculacionCliente.calidad: "demandado directo"|"llamado en garantia"|"litisconsorte"|"tercero interviniente"|"garante"
- pretensionesContraCliente.detalle: [{ "concepto": string, "valor": number|null }] — SOLO contra el cliente defendido
- hechosclave: resumen narrativo objetivo en 3 párrafos

IMPORTANTE: En hechosclave escribe máximo 2 párrafos cortos. En descripcionCobertura máximo 2 oraciones.

DOCUMENTO:
${textoTruncado}`;

  // === LLAMADA 2: Análisis estratégico ===
  const prompt2 = `Eres un abogado litigante colombiano con 20 años de experiencia en defensa judicial. Analiza esta demanda y produce SOLO el siguiente JSON (sin texto extra).

IMPORTANTE: Sé conciso. Máximo 3 items en fortalezasDemanda.items, máximo 4 items en debilidadesDemanda.items, máximo 5 items en lineasDefensa, máximo 3 advertencias, máximo 6 proximosPasos. Cada descripción máximo 2 oraciones.

{
  "fortalezasDemanda": {
    "resumen": "",
    "items": []
  },
  "debilidadesDemanda": {
    "resumen": "",
    "items": []
  },
  "estrategiaDefensa": {
    "resumenEstrategico": "",
    "lineasDefensa": [],
    "advertencias": [],
    "proximosPasos": []
  }
}

Reglas:
- fortalezasDemanda.items: [{ "descripcion": string, "impacto": "alto"|"medio"|"bajo" }]
- debilidadesDemanda.items: [{ "tipo": string, "descripcion": string, "impacto": "alto"|"medio"|"bajo" }]
  Busca: falta de legitimación, caducidad, prescripción, ausencia de pruebas, contradicciones, pretensiones excesivas, falta de nexo causal, vicios formales
- estrategiaDefensa.lineasDefensa: [{ "prioridad": "principal"|"subsidiaria", "titulo": string, "descripcion": string, "tipoExcepcion": string }]
  Organiza: 1)cuestiones preliminares 2)excepciones previas 3)excepciones de mérito 4)subsidiarias
- estrategiaDefensa.advertencias: array de strings con alertas urgentes
- estrategiaDefensa.proximosPasos: array de strings con acciones concretas para el abogado (máximo 7 pasos)

DOCUMENTO:
${textoTruncado}`;

  const [response1, response2] = await Promise.all([
    client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 6000,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt1 }],
    }),
    client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 6000,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt2 }],
    }),
  ]);

  const parseResponse = (response: any, label: string) => {
    const content = response.content[0];
    if (content.type !== 'text') throw new Error(`Respuesta inesperada en ${label}`);

    let json = content.text.trim();

    // Remover markdown fences
    json = json.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();

    // Extraer entre primera { y última }
    const first = json.indexOf('{');
    const last = json.lastIndexOf('}');
    if (first === -1 || last === -1) throw new Error(`JSON inválido en ${label}: ` + json.substring(0, 300));
    json = json.substring(first, last + 1);

    // Sanitizar caracteres problemáticos dentro de strings JSON
    // Reemplaza saltos de línea literales dentro de strings por \n escapado
    json = json.replace(/("(?:[^"\\]|\\.)*")|(\n)/g, (match, str, newline) => {
      if (str) return str; // dentro de string, no tocar
      return newline ? ' ' : match;
    });

    try {
      return JSON.parse(json);
    } catch (e: any) {
      // Intento de recuperación: buscar el último objeto JSON completo válido
      // truncando desde el último } balanceado
      let depth = 0;
      let lastValidEnd = -1;
      for (let i = 0; i < json.length; i++) {
        if (json[i] === '{') depth++;
        if (json[i] === '}') {
          depth--;
          if (depth === 0) lastValidEnd = i;
        }
      }
      if (lastValidEnd > 0) {
        try {
          return JSON.parse(json.substring(0, lastValidEnd + 1));
        } catch {}
      }
      throw new Error(`JSON inválido en ${label} — ${e.message}. Inicio: ` + json.substring(0, 200));
    }
  };

  const datos = parseResponse(response1, 'datos factuales');
  const analisis = parseResponse(response2, 'análisis estratégico');

  return {
    ...datos,
    ...analisis,
  } as DemandaExtraida;
}
