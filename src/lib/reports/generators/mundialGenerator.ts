import { db } from "@/lib/db";
import type { MundialInformeData } from "../types/mundial";
import { formatCOP, formatDate } from "../utils/formatters";

export async function buildMundialData(
  procesoId: string
): Promise<MundialInformeData> {
  const proceso = await db.proceso.findUniqueOrThrow({
    where: { id: procesoId },
    include: {
      cliente: true,
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

  const valorAsegurado = polizaRel?.cobertura
    ? formatCOP(Number(polizaRel.cobertura))
    : "N/A";

  let vigenciaPoliza = "N/A";
  if (polizaRel?.vigenciaDesde && polizaRel?.vigenciaHasta) {
    vigenciaPoliza = `${formatDate(polizaRel.vigenciaDesde)} — ${formatDate(polizaRel.vigenciaHasta)}`;
  }

  const ultimasActuaciones =
    proceso.hitos
      .slice(0, 3)
      .map(
        (h, i) =>
          `${i + 1}) ${formatDate(h.fecha)} — ${h.tipoActuacion}${h.descripcion ? ": " + h.descripcion : ""}`
      )
      .join(" ") || "Sin actuaciones registradas";

  const estadoMap: Record<string, string> = {
    ACTIVO: "Activo",
    EN_TRAMITE: "En trámite",
    EN_PRUEBAS: "Etapa probatoria",
    EN_FALLO: "Pendiente de fallo",
    TERMINADO: "Terminado",
    ARCHIVADO: "Archivado",
  };
  const estadoActual =
    estadoMap[proceso.estadoActual] || proceso.estadoActual;

  return {
    radicado: proceso.radicado || "Sin radicado",
    juzgado: proceso.juzgado || "Sin despacho registrado",
    claseProceso: proceso.tipoProceso || "Ordinario",
    demandante: proceso.demandante || "Sin registro",
    demandado: proceso.demandado || "Sin registro",
    afianzado: proceso.cliente.nombre,
    sucursalPoliza: "Pendiente de registro",
    numeroPoliza: polizaRel?.numeroPoliza || "Sin póliza vinculada",
    objetoPoliza: proceso.descripcion || "Pendiente de registro",
    ramo: polizaRel?.ramo?.replace(/_/g, " ") || "N/A",
    vigenciaPoliza,
    valorAsegurado,
    pretensiones: proceso.descripcion || "Pendiente de registro",
    excepcionesPropuestas: "Pendiente de registro",
    calificacionRiesgo: "EVENTUAL",
    estadoActual,
    ultimasActuaciones,
    proximosVencimientos: "Pendiente de registro",
    propuestaHonorarios: "N/A",
    observaciones: "Pendiente de observaciones",
  };
}
