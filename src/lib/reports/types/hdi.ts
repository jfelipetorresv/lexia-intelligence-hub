export interface HdiInformeData {
  clienteNombre: string;
  radicado: string;
  juzgado: string;
  claseProces: string;
  jurisdiccion: string;
  tipoVinculacion: string;
  demandante: string;
  demandado: string;
  aseguradoTomador: string;
  numeroPoliza: string;
  ramo: string;
  fechaNotificacionDemanda: string;
  fechaNotificacionHdi: string;
  fechaContestacion: string;
  pretensiones: string;
  excepcionesPropuestas: string;
  estadoActualProceso: string;
  ultimasActuaciones: string;
  proximosVencimientos: string;
  valorReclamado: string;
  estimacionContingencia: "Probable" | "Eventual" | "Remota";
  valorPropuestaConciliatoria: string;
  observacionesAbogado: string;
}

export const mockHdiData: HdiInformeData = {
  clienteNombre: "HDI Seguros S.A.",
  radicado: "11001310503720230098700",
  juzgado: "Juzgado 37 Civil del Circuito de Bogotá",
  claseProces: "Ordinario de responsabilidad civil extracontractual",
  jurisdiccion: "Civil",
  tipoVinculacion: "Llamamiento en garantía",
  demandante: "Pedro Antonio Ramírez Gómez",
  demandado: "Constructora Andes S.A.S.",
  aseguradoTomador: "Constructora Andes S.A.S.",
  numeroPoliza: "RC-HDI-2023-54321",
  ramo: "Responsabilidad Civil Extracontractual",
  fechaNotificacionDemanda: "15/06/2023",
  fechaNotificacionHdi: "20/07/2023",
  fechaContestacion: "10/09/2023",
  pretensiones:
    "Se solicita declarar civilmente responsable a la demandada por los perjuicios " +
    "materiales e inmateriales causados al demandante como consecuencia del colapso parcial " +
    "de la estructura del edificio Torres del Parque, nivel 3. Se reclaman daño emergente " +
    "por $120.000.000, lucro cesante por $85.000.000, daño moral por $150.000.000 y daño " +
    "a la salud por $200.000.000.",
  excepcionesPropuestas:
    "1) Culpa exclusiva de la víctima. 2) Hecho de un tercero. " +
    "3) Inexistencia de nexo causal. 4) Falta de legitimación en la causa por pasiva.",
  estadoActualProceso: "Etapa probatoria — pendiente práctica de dictamen pericial técnico",
  ultimasActuaciones:
    "1) 15/01/2026 — Auto que decreta pruebas solicitadas por las partes. " +
    "2) 20/12/2025 — Audiencia de conciliación fallida. " +
    "3) 05/11/2025 — Contestación de la demanda por parte del llamado en garantía.",
  proximosVencimientos: "Audiencia de instrucción y juzgamiento: 15/04/2026",
  valorReclamado: "$555.000.000",
  estimacionContingencia: "Eventual",
  valorPropuestaConciliatoria: "$80.000.000 (propuesta de la parte demandante, rechazada)",
  observacionesAbogado:
    "Se recomienda solicitar contrapericia estructural para desvirtuar el nexo causal " +
    "alegado por el demandante. La póliza cubre hasta $1.000.000.000 en RC extracontractual. " +
    "El dictamen pericial técnico será determinante para la calificación definitiva de la contingencia.",
};
