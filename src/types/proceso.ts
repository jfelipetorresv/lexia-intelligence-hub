import type { EstadoProceso, TipoProceso, EstadoTermino } from "@prisma/client";

export interface ProcesoListItem {
  id: string;
  radicado: string | null;
  tipoProceso: TipoProceso;
  demandante: string | null;
  demandado: string | null;
  juzgado: string | null;
  ciudad: string | null;
  cuantia: string | null;
  estadoActual: EstadoProceso;
  fechaApertura: Date | null;
  cliente: {
    id: string;
    nombre: string;
  };
  abogadoLider: {
    id: string;
    nombre: string;
  } | null;
  proximoHito: {
    id: string;
    tipoActuacion: string;
    plazoVencimiento: Date | null;
    estadoTermino: EstadoTermino | null;
  } | null;
  semaforo: "ROJO" | "NARANJA" | "VERDE" | null;
}

export interface ProcesosPageData {
  procesos: ProcesoListItem[];
  total: number;
  pagina: number;
  totalPaginas: number;
}

export interface ProcesoDetail {
  id: string;
  radicado: string | null;
  tipoProceso: TipoProceso;
  claseProceso: string | null;
  estadoActual: EstadoProceso;
  juzgado: string | null;
  ciudad: string | null;
  cuantia: string | null;
  demandante: string | null;
  demandado: string | null;
  fechaApertura: Date | null;
  descripcion: string | null;
  onedriveFolderPath: string | null;
  clienteId: string;
  cliente: {
    nombre: string;
    nit: string | null;
    tipo: string;
  };
  asignaciones: {
    id: string;
    abogadoId: string;
    rolEnCaso: string;
    fechaAsignacion: Date;
    activa: boolean;
    abogado: {
      nombre: string;
      rol: string;
      especialidad: string | null;
    };
  }[];
  hitos: {
    id: string;
    tipoActuacion: string;
    fecha: Date;
    descripcion: string | null;
    plazoVencimiento: Date | null;
    estadoTermino: EstadoTermino | null;
  }[];
  semaforo: "ROJO" | "NARANJA" | "VERDE" | null;
}
