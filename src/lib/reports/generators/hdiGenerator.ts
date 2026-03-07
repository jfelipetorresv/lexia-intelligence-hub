import { db } from "@/lib/db";
import type { HdiInformeData } from "../types/hdi";
import { formatCOP, formatDate } from "../utils/formatters";

export async function buildHdiData(procesoId: string): Promise<HdiInformeData> {
  const proceso = await db.proceso.findUniqueOrThrow({
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
    },
  });

  const polizaRel = proceso.polizas[0]?.poliza;

  // Cuantía
  const valorReclamado = proceso.cuantia
    ? formatCOP(Number(proceso.cuantia))
    : "Sin determinar";

  // Jurisdicción derivada del tipo de proceso
  let jurisdiccion = "Civil";
  const tipo = (proceso.tipoProceso || "").toLowerCase();
  if (tipo.includes("administrativ")) jurisdiccion = "Administrativa";
  else if (tipo.includes("arbitr")) jurisdiccion = "Arbitral";

  // Tipo de vinculación
  const tipoVinculacion = "Llamamiento en garantía";

  // Fechas de notificación
  const hitoNotif = proceso.hitos.find(
    (h) =>
      h.tipoActuacion.toLowerCase().includes("notificación") ||
      h.tipoActuacion.toLowerCase().includes("notificacion")
  );
  const fechaNotifDemanda = hitoNotif
    ? formatDate(hitoNotif.fecha)
    : proceso.fechaApertura
      ? formatDate(proceso.fechaApertura)
      : "Sin registro";

  // Fecha de contestación
  const hitoContestacion = proceso.hitos.find(
    (h) =>
      h.tipoActuacion.toLowerCase().includes("contestación") ||
      h.tipoActuacion.toLowerCase().includes("contestacion")
  );
  const fechaContestacion = hitoContestacion
    ? formatDate(hitoContestacion.fecha)
    : "Pendiente";

  // Últimas 3 actuaciones
  const ultimasActuaciones = proceso.hitos
    .slice(0, 3)
    .map(
      (h, i) =>
        `${i + 1}) ${formatDate(h.fecha)} — ${h.tipoActuacion}${h.descripcion ? ": " + h.descripcion : ""}`
    )
    .join(" ") || "Sin actuaciones registradas";

  // Estado actual
  const estadoMap: Record<string, string> = {
    ACTIVO: "Activo",
    EN_TRAMITE: "En trámite",
    EN_PRUEBAS: "Etapa probatoria",
    EN_FALLO: "Pendiente de fallo",
    TERMINADO: "Terminado",
    ARCHIVADO: "Archivado",
  };
  const estadoActual = estadoMap[proceso.estadoActual] || proceso.estadoActual;

  return {
    clienteNombre: proceso.cliente.nombre,
    radicado: proceso.radicado || "Sin radicado",
    juzgado: proceso.juzgado || "Sin despacho registrado",
    claseProces: proceso.tipoProceso || "Ordinario",
    jurisdiccion,
    tipoVinculacion,
    demandante: proceso.demandante || "Sin registro",
    demandado: proceso.demandado || "Sin registro",
    aseguradoTomador: proceso.cliente.nombre,
    numeroPoliza: polizaRel?.numeroPoliza || "Sin póliza vinculada",
    ramo: polizaRel?.ramo?.replace(/_/g, " ") || "N/A",
    fechaNotificacionDemanda: fechaNotifDemanda,
    fechaNotificacionHdi: fechaNotifDemanda,
    fechaContestacion,
    pretensiones: proceso.descripcion || "Pendiente de registro",
    excepcionesPropuestas: "Pendiente de registro",
    estadoActualProceso: estadoActual,
    ultimasActuaciones,
    proximosVencimientos: "Pendiente de registro",
    valorReclamado,
    estimacionContingencia: "Eventual",
    valorPropuestaConciliatoria: "N/A",
    observacionesAbogado: "Pendiente de observaciones",
  };
}
