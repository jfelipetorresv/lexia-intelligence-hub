import { db } from "@/lib/db";
import type { ZurichInformeData } from "../types/zurich";
import { formatCOP, formatDate } from "../utils/formatters";

export interface ZurichBuildResult extends ZurichInformeData {
  extraidoDeDocumento: boolean;
}

// ── Extract from contestación PDF via Claude ──────────────

async function extractFromContestacion(
  procesoId: string
): Promise<Partial<ZurichInformeData>> {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return {};

    // Search for contestación document
    const docs = await db.documento.findMany({
      where: {
        procesoId,
        OR: [
          { tipo: { contains: "contestacion", mode: "insensitive" } },
          { nombre: { contains: "contestacion", mode: "insensitive" } },
          { nombre: { contains: "contestación", mode: "insensitive" } },
        ],
      },
      take: 1,
    });

    const docLocal = docs.length === 0
      ? await db.documentoLocal.findFirst({
          where: {
            procesoId,
            OR: [
              { nombre: { contains: "contestacion", mode: "insensitive" } },
              { nombre: { contains: "contestación", mode: "insensitive" } },
            ],
          },
        })
      : null;

    const docUrl = docs[0]?.url ?? docLocal?.url;
    if (!docUrl) return {};

    // Fetch PDF and extract text
    const pdfParse = (await import("pdf-parse")).default;
    const pdfResponse = await fetch(docUrl);
    if (!pdfResponse.ok) return {};

    const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());
    const parsed = await pdfParse(pdfBuffer);
    const text = parsed.text?.slice(0, 15000); // Limit to ~15k chars for Claude
    if (!text || text.length < 100) return {};

    // Call Claude API
    const claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        system:
          "Eres un asistente jurídico especializado en derecho de seguros colombiano. " +
          "Analiza el siguiente documento legal y extrae la información solicitada en formato JSON estricto. " +
          "Solo incluye los campos donde encuentres información clara y explícita. " +
          "Si no encuentras información para un campo, omítelo del JSON.",
        messages: [
          {
            role: "user",
            content:
              "Del siguiente texto de una contestación de demanda o informe jurídico, extrae estos campos en JSON:\n" +
              "{\n" +
              '  resumenContingencia: string (resumen del hecho que originó el proceso),\n' +
              '  pretensiones: string (lo que pide el demandante con valores si los hay),\n' +
              '  calificacionContingencia: "PROBABLE" | "EVENTUAL" | "REMOTA",\n' +
              '  motivosCalificacion: string (argumentos jurídicos para la calificación),\n' +
              '  pretensionesObjetivadas: string (verdadera exposición económica de la compañía),\n' +
              '  reservaSugerida: string (reserva recomendada con su cálculo),\n' +
              '  coaseguro: "SI" | "NO" | "N/A"\n' +
              "}\n\n" +
              "Texto del documento:\n" +
              text,
          },
        ],
      }),
    });

    if (!claudeResponse.ok) return {};

    const claudeData = await claudeResponse.json();
    const content = claudeData.content?.[0]?.text;
    if (!content) return {};

    // Extract JSON from response (may be wrapped in markdown code block)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return {};

    const extracted = JSON.parse(jsonMatch[0]);

    // Validate and return only known fields
    const result: Partial<ZurichInformeData> = {};
    if (typeof extracted.resumenContingencia === "string")
      result.resumenContingencia = extracted.resumenContingencia;
    if (typeof extracted.pretensiones === "string")
      result.pretensiones = extracted.pretensiones;
    if (["PROBABLE", "EVENTUAL", "REMOTA"].includes(extracted.calificacionContingencia))
      result.calificacionContingencia = extracted.calificacionContingencia;
    if (typeof extracted.motivosCalificacion === "string")
      result.motivosCalificacion = extracted.motivosCalificacion;
    if (typeof extracted.pretensionesObjetivadas === "string")
      result.pretensionesObjetivadas = extracted.pretensionesObjetivadas;
    if (typeof extracted.reservaSugerida === "string")
      result.reservaSugerida = extracted.reservaSugerida;
    if (["SI", "NO", "N/A"].includes(extracted.coaseguro))
      result.coaseguro = extracted.coaseguro;

    return result;
  } catch {
    // Fail silently
    return {};
  }
}

// ── Build Zurich informe data ─────────────────────────────

export async function buildZurichData(
  procesoId: string,
  tipo: "INICIAL" | "INTERMEDIO" = "INTERMEDIO"
): Promise<ZurichBuildResult> {
  // Run DB query and document extraction in parallel
  const [proceso, extractedData] = await Promise.all([
    db.proceso.findUniqueOrThrow({
      where: { id: procesoId },
      include: {
        cliente: true,
        asignaciones: {
          where: { activa: true },
          include: { abogado: true },
          orderBy: { fechaAsignacion: "asc" },
        },
        polizas: {
          include: { poliza: true },
        },
        hitos: {
          orderBy: { fecha: "desc" },
          take: 5,
        },
        analisisIA: {
          orderBy: { creadoEn: "desc" },
          take: 1,
        },
      },
    }),
    extractFromContestacion(procesoId),
  ]);

  const extraidoDeDocumento = Object.keys(extractedData).length > 0;

  // Abogado líder o el primero disponible
  const lider = proceso.asignaciones.find((a) => a.rolEnCaso === "LIDER");
  const abogado = lider?.abogado ?? proceso.asignaciones[0]?.abogado;
  const abogadoNombre = abogado ? `Dr. ${abogado.nombre}` : "PENDIENTE";

  // Póliza vinculada (primera disponible)
  const polizaRel = proceso.polizas[0]?.poliza;

  // Cuantía formateada
  const cuantiaStr = proceso.cuantia
    ? formatCOP(Number(proceso.cuantia))
    : "Sin determinar";

  // Fecha de informe
  const fechaInforme = new Date().toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  // Vigencia póliza
  let vigenciaPoliza = "N/A";
  if (polizaRel?.vigenciaDesde && polizaRel?.vigenciaHasta) {
    vigenciaPoliza = `${formatDate(polizaRel.vigenciaDesde)} — ${formatDate(polizaRel.vigenciaHasta)}`;
  }

  // Resumen de contingencia desde análisis IA si existe
  let resumenContingencia = "Pendiente de análisis";
  let observaciones = "";
  const analisis = proceso.analisisIA[0];
  if (analisis) {
    const resultado = analisis.resultado as Record<string, unknown>;
    if (typeof resultado?.resumen === "string") {
      resumenContingencia = resultado.resumen;
    }
    if (typeof resultado?.recomendaciones === "string") {
      observaciones = resultado.recomendaciones;
    }
  }

  // Descripción del proceso como fallback de siniestro
  const resumenSiniestro =
    proceso.descripcion || "Sin descripción del siniestro registrada";

  // Fecha apertura como fecha presentación demanda
  const fechaPresentacion = proceso.fechaApertura
    ? formatDate(proceso.fechaApertura)
    : "Sin registro";

  // Fecha notificación: primer hito de tipo Notificación o fecha apertura
  const hitoNotificacion = proceso.hitos.find(
    (h) =>
      h.tipoActuacion.toLowerCase().includes("notificación") ||
      h.tipoActuacion.toLowerCase().includes("notificacion")
  );
  const fechaNotificacion = hitoNotificacion
    ? formatDate(hitoNotificacion.fecha)
    : fechaPresentacion;

  // Base data from DB
  const baseData: ZurichInformeData = {
    clienteNombre: proceso.cliente.nombre,
    tipoInforme: tipo,
    fechaInforme,

    despacho: proceso.juzgado || "Sin despacho registrado",
    abogadoAsignado: abogadoNombre,
    workflow: "PENDIENTE",
    radicado: proceso.radicado || "Sin radicado",
    instancia: "1 INSTANCIA",

    demandante: proceso.demandante || "Sin registro",
    victimaDirecta: proceso.demandante || "Sin registro",
    idVictimaDirecta: "PENDIENTE",
    demandado: proceso.demandado || "Sin registro",
    llamadoEnGarantia: "Zúrich Colombia Seguros S.A. Y OTROS",

    poliza: polizaRel?.numeroPoliza || "Sin póliza vinculada",
    vigenciaPoliza,
    ramo: polizaRel?.ramo?.replace(/_/g, " ") || "N/A",
    amparo: "Según condiciones de la póliza",
    valorAsegurado: polizaRel?.cobertura
      ? formatCOP(Number(polizaRel.cobertura))
      : "N/A",
    asegurado: proceso.cliente.nombre,

    resumenSiniestro,
    fechaSiniestro: "PENDIENTE",
    fechaNotificacion,

    coaseguro: "N/A",

    fechaPresentacionDemanda: fechaPresentacion,
    placa: "N/A",

    resumenContingencia,
    pretensiones: cuantiaStr,
    calificacionContingencia: "EVENTUAL",
    motivosCalificacion: "Pendiente de análisis detallado de la contingencia",
    pretensionesObjetivadas: "PENDIENTE DE CÁLCULO",

    observacionesGenerales: observaciones || undefined,
    reservaSugerida: "PENDIENTE DE CÁLCULO",
  };

  // Merge: extracted data overrides defaults, but DB data takes priority
  // (extractedData fills in "PENDIENTE" fields)
  return {
    ...baseData,
    ...extractedData,
    // DB values always override extraction for these fields
    tipoInforme: tipo,
    fechaInforme,
    despacho: baseData.despacho,
    abogadoAsignado: baseData.abogadoAsignado,
    radicado: baseData.radicado,
    demandante: baseData.demandante,
    demandado: baseData.demandado,
    poliza: baseData.poliza,
    asegurado: baseData.asegurado,
    extraidoDeDocumento,
  };
}
