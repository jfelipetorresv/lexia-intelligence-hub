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
    moneda: 'COP' | 'USD';
  };
  cuantiaGlobal: {
    valor: number | null;
    moneda: 'COP' | 'USD';
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
      fundamentoNormativo?: string;
      vulnerabilidad?: string;
    }>;
    advertencias: string[];
    proximosPasos: string[];
  };
}

async function llamarConRetry(fn: () => Promise<any>, intentos = 2): Promise<any> {
  for (let i = 0; i < intentos; i++) {
    try {
      return await fn();
    } catch (error: any) {
      const esRateLimit = error?.status === 529 ||
        error?.message?.includes('overloaded') ||
        error?.message?.includes('529');
      if (esRateLimit && i < intentos - 1) {
        await new Promise(r => setTimeout(r, 35000));
        continue;
      }
      if (esRateLimit) {
        throw new Error('El modelo esta momentaneamente sobrecargado. Espera 1 minuto e intenta de nuevo.');
      }
      throw error;
    }
  }
}

export interface ContextoCliente {
  clienteNombre?: string;
  calidadProcesal?: string;
  contextoAdicional?: string;
}

export async function extractDemanda(texto: string, contexto?: ContextoCliente): Promise<DemandaExtraida> {
  const textoTruncado = texto.length > 12000
    ? texto.substring(0, 12000) + '\n\n[Documento truncado]'
    : texto;

  // Build context block if provided
  const partsContexto: string[] = [];
  if (contexto?.clienteNombre) partsContexto.push(`CLIENTE REPRESENTADO: ${contexto.clienteNombre}`);
  if (contexto?.calidadProcesal) {
    const labels: Record<string, string> = {
      demandado_directo: 'Demandado directo',
      llamado_garantia: 'Llamado en garantia',
      litisconsorcio: 'Litisconsorte necesario',
      tercero_interviniente: 'Tercero interviniente',
      reconvencionado: 'Demandado en reconvencion',
    };
    partsContexto.push(`CALIDAD PROCESAL: ${labels[contexto.calidadProcesal] || contexto.calidadProcesal}`);
  }
  if (contexto?.contextoAdicional) partsContexto.push(`CONTEXTO ADICIONAL DEL ABOGADO: ${contexto.contextoAdicional}`);
  const bloqueContexto = partsContexto.length > 0
    ? `\n\nINFORMACION DEL CLIENTE (proporcionada por el abogado):\n${partsContexto.join('\n')}\n\nUsa esta informacion para enfocar el analisis desde la perspectiva defensiva de este cliente.`
    : '';

  // === LLAMADA 1: Datos factuales ===
  const systemPrompt1 = `Eres un agente juridico de Lexia Abogados Colombia. Extraes datos precisos de documentos juridicos. NUNCA inventes datos — si no encuentras un dato, usa null.

Extrae del documento y responde UNICAMENTE con JSON valido sin texto adicional:
{
  "jurisdiccionJuzgado": { "jurisdiccion": null, "juzgado": null, "ciudad": null, "especialidad": null },
  "radicado": null,
  "tipoProceso": null,
  "partes": {
    "demandantes": [{ "nombre": "", "tipo": "" }],
    "demandados": [{ "nombre": "", "tipo": "" }],
    "apoderados": [{ "nombre": "", "representa": "" }]
  },
  "calidadVinculacionCliente": { "calidad": null, "descripcion": null },
  "polizaRamo": { "hayPoliza": false, "numeroPoliza": null, "aseguradora": null, "ramo": null, "descripcionCobertura": null },
  "sintesisPretensiones": { "declarativas": [], "condenatorias": [] },
  "cuantiaGlobal": {
    "valor": null,
    "moneda": "COP",
    "descripcion": ""
  },
  "pretensionesContraCliente": {
    "totalPretendido": null,
    "moneda": "COP",
    "detalle": [{ "concepto": "", "valor": null }]
  },
  "hechosclave": "",
  "fundamentosJuridicos": {
    "normas": [],
    "jurisprudencia": []
  }
}

REGLA MONEDA: usa "COP" por defecto. Usa "USD" solo si el documento menciona explicitamente dolares americanos, USD, o es arbitraje internacional con contrato en moneda extranjera.`;

  const prompt1 = `Analiza este documento judicial colombiano y extrae todos los datos factuales.

Reglas especificas:
- partes.demandantes: [{ "nombre": string, "tipo": "persona natural"|"persona juridica"|"entidad publica" }]
- partes.demandados: igual formato que demandantes
- partes.apoderados: [{ "nombre": string, "representa": string }]
- calidadVinculacionCliente.calidad: "demandado directo"|"llamado en garantia"|"litisconsorte"|"tercero interviniente"|"garante"
- pretensionesContraCliente.detalle: [{ "concepto": string, "valor": number|null }] — SOLO contra el cliente defendido
- hechosclave: resumen narrativo objetivo en 2 parrafos cortos
- descripcionCobertura: maximo 2 oraciones
- tipoProceso: inferir del documento (civil, administrativo, laboral, arbitral, penal, ejecutivo, etc.)

DOCUMENTO:
${textoTruncado}${bloqueContexto}`;

  // === LLAMADA 2: Analisis estrategico ===
  const systemPrompt2 = `Eres un abogado litigante con 20 anos de experiencia en defensa judicial y arbitral colombiana, especializado en derecho de seguros y contratos estatales.

PRINCIPIO INAMOVIBLE: Nunca inventes jurisprudencia ni normas. Si no tienes certeza de una referencia normativa, omitela. Es preferible no citar que citar mal.

Analiza el documento y genera estrategia defensiva siguiendo la JERARQUIA LEXIA:

PRIORIDAD 1 — CUESTIONES PRELIMINARES: forma antitecnica de pretensiones, acumulacion indebida, pretensiones desproporcionadas (art. 206 CGP), incongruencia entre hechos y pretensiones.

PRIORIDAD 2 — EXCEPCIONES PREVIAS (arts. 100-101 CGP / 176-177 CPACA): falta de competencia, jurisdiccion, compromiso arbitral, caducidad, cosa juzgada, falta de legitimacion, falta de requisitos de procedibilidad.

PRIORIDAD 3 — EXCEPCIONES DE MERITO: inexistencia del hecho generador, exceptio non adimpleti contractus, fuerza mayor (art. 64 C.Civil: inimputabilidad + imprevisibilidad + irresistibilidad), prescripcion (art. 1081 C.Co. para seguros: 2 anos ordinaria / 5 anos extraordinaria), ausencia de nexo causal, ausencia de prueba del siniestro (art. 1077 C.Co.).

PRIORIDAD 4 — SUBSIDIARIAS: reduccion clausula penal (art. 1624 C.Civil), limitacion a suma asegurada, compensacion.

EN SEGUROS aplica ademas: naturaleza indemnizatoria art. 1088 C.Co., carga probatoria art. 1077 C.Co., exclusiones de la poliza, agravacion del riesgo art. 1060 C.Co. En llamamiento en garantia: la aseguradora mantiene AUTONOMIA argumentativa respecto del contratista.

OBJECION AL JURAMENTO ESTIMATORIO: si las pretensiones son desproporcionadas al dano real demostrado, senalarlo como debilidad explotable.

Responde UNICAMENTE con JSON valido sin texto adicional.`;

  const prompt2 = `Analiza esta demanda y genera la estrategia defensiva.

Responde con este JSON exacto:
{
  "fortalezasDemanda": {
    "resumen": "",
    "items": [{ "descripcion": "", "impacto": "alto"|"medio"|"bajo" }]
  },
  "debilidadesDemanda": {
    "resumen": "",
    "items": [{ "tipo": "", "descripcion": "", "impacto": "alto"|"medio"|"bajo" }]
  },
  "estrategiaDefensa": {
    "resumenEstrategico": "",
    "lineasDefensa": [{
      "titulo": "",
      "prioridad": "principal"|"subsidiaria",
      "tipoExcepcion": "",
      "descripcion": "",
      "fundamentoNormativo": "",
      "vulnerabilidad": ""
    }],
    "advertencias": [],
    "proximosPasos": []
  }
}

Reglas:
- Busca debilidades: falta de legitimacion, caducidad, prescripcion, ausencia de pruebas, contradicciones, pretensiones excesivas, falta de nexo causal, vicios formales
- lineasDefensa: organiza por 1)cuestiones preliminares 2)excepciones previas 3)excepciones de merito 4)subsidiarias
- fundamentoNormativo: solo normas reales verificables, dejar vacio si no hay certeza
- vulnerabilidad: contra argumento previsible del adversario
- Maximo: 3 fortalezas, 5 debilidades, 6 lineas de defensa, 3 advertencias, 6 proximos pasos
- Se concreto y especifico al caso — no generico. Cada descripcion maximo 2 oraciones.

DOCUMENTO:
${textoTruncado}${bloqueContexto}`;

  const [response1, response2] = await Promise.all([
    llamarConRetry(() => client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 6000,
      system: systemPrompt1,
      messages: [{ role: 'user', content: prompt1 }],
    })),
    llamarConRetry(() => client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 6000,
      system: systemPrompt2,
      messages: [{ role: 'user', content: prompt2 }],
    })),
  ]);

  const parseResponse = (response: any, label: string) => {
    const content = response.content[0];
    if (content.type !== 'text') throw new Error(`Respuesta inesperada en ${label}`);

    let json = content.text.trim();

    // Remover markdown fences
    json = json.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();

    // Extraer entre primera { y ultima }
    const first = json.indexOf('{');
    const last = json.lastIndexOf('}');
    if (first === -1 || last === -1) throw new Error(`JSON invalido en ${label}: ` + json.substring(0, 300));
    json = json.substring(first, last + 1);

    // Sanitizar saltos de linea fuera de strings JSON
    json = json.replace(/("(?:[^"\\]|\\.)*")|(\n)/g, (match: string, str: string, newline: string) => {
      if (str) return str;
      return newline ? ' ' : match;
    });

    try {
      return JSON.parse(json);
    } catch (e: any) {
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
      throw new Error(`JSON invalido en ${label} — ${e.message}. Inicio: ` + json.substring(0, 200));
    }
  };

  const datos = parseResponse(response1, 'datos factuales');
  const analisis = parseResponse(response2, 'analisis estrategico');

  return {
    ...datos,
    ...analisis,
  } as DemandaExtraida;
}
