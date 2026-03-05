import { db } from "@/lib/db";
import { Prisma, EstadoProceso, TipoProceso } from "@prisma/client";
import { calcularEstadoTermino } from "@/lib/semaforo";
import type { ProcesoListItem, ProcesoDetail } from "@/types/proceso";

const PAGE_SIZE = 20;

interface FetchProcesosParams {
  busqueda?: string | null;
  estado?: string | null;
  jurisdiccion?: string | null;
  abogadoId?: string | null;
  pagina?: number;
}

function buildWhereClause(params: FetchProcesosParams): Prisma.ProcesoWhereInput {
  const where: Prisma.ProcesoWhereInput = {};

  if (params.estado && Object.values(EstadoProceso).includes(params.estado as EstadoProceso)) {
    where.estadoActual = params.estado as EstadoProceso;
  }

  if (params.jurisdiccion && Object.values(TipoProceso).includes(params.jurisdiccion as TipoProceso)) {
    where.tipoProceso = params.jurisdiccion as TipoProceso;
  }

  if (params.busqueda) {
    where.OR = [
      { radicado: { contains: params.busqueda, mode: "insensitive" } },
      { demandante: { contains: params.busqueda, mode: "insensitive" } },
      { demandado: { contains: params.busqueda, mode: "insensitive" } },
      { cliente: { nombre: { contains: params.busqueda, mode: "insensitive" } } },
    ];
  }

  if (params.abogadoId) {
    where.asignaciones = {
      some: { abogadoId: params.abogadoId, rolEnCaso: "LIDER", activa: true },
    };
  }

  return where;
}

export async function fetchProcesos(params: FetchProcesosParams) {
  const pagina = Math.max(1, params.pagina ?? 1);
  const skip = (pagina - 1) * PAGE_SIZE;
  const where = buildWhereClause(params);

  const [procesos, total] = await Promise.all([
    db.proceso.findMany({
      where,
      skip,
      take: PAGE_SIZE,
      orderBy: { createdAt: "desc" },
      include: {
        cliente: { select: { id: true, nombre: true } },
        asignaciones: {
          where: { rolEnCaso: "LIDER", activa: true },
          include: { abogado: { select: { id: true, nombre: true } } },
          take: 1,
        },
        hitos: {
          where: { plazoVencimiento: { not: null } },
          select: {
            id: true,
            tipoActuacion: true,
            plazoVencimiento: true,
            estadoTermino: true,
          },
        },
      },
    }),
    db.proceso.count({ where }),
  ]);

  const totalPaginas = Math.ceil(total / PAGE_SIZE);

  const items: ProcesoListItem[] = procesos.map((p) => {
    // Encontrar el hito con vencimiento mas proximo:
    // 1. Nearest future deadline, or 2. Most recently past-due deadline
    const now = new Date();
    const futureHitos = p.hitos
      .filter((h) => h.plazoVencimiento && new Date(h.plazoVencimiento) >= now)
      .sort(
        (a, b) =>
          new Date(a.plazoVencimiento!).getTime() -
          new Date(b.plazoVencimiento!).getTime()
      );
    const pastHitos = p.hitos
      .filter((h) => h.plazoVencimiento && new Date(h.plazoVencimiento) < now)
      .sort(
        (a, b) =>
          new Date(b.plazoVencimiento!).getTime() -
          new Date(a.plazoVencimiento!).getTime()
      );
    const relevantHito = futureHitos[0] ?? pastHitos[0] ?? null;

    return {
      id: p.id,
      radicado: p.radicado,
      tipoProceso: p.tipoProceso,
      demandante: p.demandante,
      demandado: p.demandado,
      juzgado: p.juzgado,
      ciudad: p.ciudad,
      cuantia: p.cuantia?.toString() ?? null,
      estadoActual: p.estadoActual,
      fechaApertura: p.fechaApertura,
      cliente: p.cliente,
      abogadoLider: p.asignaciones[0]?.abogado ?? null,
      proximoHito: relevantHito
        ? {
            id: relevantHito.id,
            tipoActuacion: relevantHito.tipoActuacion,
            plazoVencimiento: relevantHito.plazoVencimiento,
            estadoTermino: relevantHito.estadoTermino,
          }
        : null,
      semaforo: relevantHito?.plazoVencimiento
        ? calcularEstadoTermino(relevantHito.plazoVencimiento)
        : null,
    };
  });

  return { procesos: items, total, pagina, totalPaginas };
}

export async function fetchProcesoById(id: string): Promise<ProcesoDetail | null> {
  const p = await db.proceso.findUnique({
    where: { id },
    include: {
      cliente: { select: { nombre: true, nit: true, tipo: true } },
      asignaciones: {
        include: {
          abogado: { select: { nombre: true, rol: true, especialidad: true } },
        },
        orderBy: { rolEnCaso: "asc" },
      },
      hitos: {
        orderBy: { fecha: "desc" },
        take: 10,
      },
    },
  });

  if (!p) return null;

  // Encontrar hito mas relevante: nearest future o most recent past-due
  const now = new Date();
  const futureHitos = p.hitos
    .filter((h) => h.plazoVencimiento && new Date(h.plazoVencimiento) >= now)
    .sort(
      (a, b) =>
        new Date(a.plazoVencimiento!).getTime() -
        new Date(b.plazoVencimiento!).getTime()
    );
  const pastHitos = p.hitos
    .filter((h) => h.plazoVencimiento && new Date(h.plazoVencimiento) < now)
    .sort(
      (a, b) =>
        new Date(b.plazoVencimiento!).getTime() -
        new Date(a.plazoVencimiento!).getTime()
    );
  const relevantHito = futureHitos[0] ?? pastHitos[0] ?? null;

  return {
    id: p.id,
    radicado: p.radicado,
    tipoProceso: p.tipoProceso,
    claseProceso: p.claseProceso,
    estadoActual: p.estadoActual,
    juzgado: p.juzgado,
    ciudad: p.ciudad,
    cuantia: p.cuantia?.toString() ?? null,
    demandante: p.demandante,
    demandado: p.demandado,
    fechaApertura: p.fechaApertura,
    descripcion: p.descripcion,
    clienteId: p.clienteId,
    cliente: p.cliente,
    asignaciones: p.asignaciones.map((a) => ({
      id: a.id,
      abogadoId: a.abogadoId,
      rolEnCaso: a.rolEnCaso,
      fechaAsignacion: a.fechaAsignacion,
      activa: a.activa,
      abogado: a.abogado,
    })),
    hitos: p.hitos.map((h) => ({
      id: h.id,
      tipoActuacion: h.tipoActuacion,
      fecha: h.fecha,
      descripcion: h.descripcion,
      plazoVencimiento: h.plazoVencimiento,
      estadoTermino: h.estadoTermino,
    })),
    semaforo: relevantHito?.plazoVencimiento
      ? calcularEstadoTermino(relevantHito.plazoVencimiento)
      : null,
  };
}

export async function fetchAbogadosActivos() {
  return db.abogado.findMany({
    where: { activo: true },
    select: { id: true, nombre: true },
    orderBy: { nombre: "asc" },
  });
}
