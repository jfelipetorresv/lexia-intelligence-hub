export interface ZurichInformeData {
  // Encabezado
  tipoInforme: "INICIAL" | "INTERMEDIO";
  fechaInforme: string;

  // Identificación del proceso
  despacho: string;
  abogadoAsignado: string;
  workflow: string;
  radicado: string;
  instancia: string;

  // Partes
  demandante: string;
  victimaDirecta: string;
  idVictimaDirecta: string;
  demandado: string;
  llamadoEnGarantia: string;

  // Póliza
  poliza: string;
  vigenciaPoliza: string;
  ramo: string;
  amparo: string;
  valorAsegurado: string;
  asegurado: string;

  // Siniestro
  resumenSiniestro: string;
  fechaSiniestro: string;
  fechaNotificacion: string;

  // Coaseguro
  coaseguro: "SI" | "NO" | "N/A";
  nombreCoaseguradores?: string;
  participacionCoaseguradores?: string;
  coaseguradorParticipa?: string;

  // Demanda
  fechaPresentacionDemanda: string;
  placa?: string;

  // Contingencia
  resumenContingencia: string;
  pretensiones: string;
  calificacionContingencia: "PROBABLE" | "EVENTUAL" | "REMOTA";
  motivosCalificacion: string;
  pretensionesObjetivadas: string;

  // Responsabilidad fiscal (opcional)
  motivacionSinArgumentosDefensa?: string;
  calificacionLuegoAutoImputacion?: string;
  motivosLuegoAutoImputacion?: string;

  // Cierre
  observacionesGenerales?: string;
  calificacionFinal?: string;
  reservaSugerida: string;
}

// Datos mock para pruebas
export const mockZurichData: ZurichInformeData = {
  tipoInforme: "INTERMEDIO",
  fechaInforme: new Date().toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }),

  despacho: "Juzgado Tercero Civil del Circuito de Montería",
  abogadoAsignado: "Dr. Carlos Andrés Mejía Restrepo",
  workflow: "ZC 999888",
  radicado: "23001310300320230045600",
  instancia: "1 INSTANCIA",

  demandante: "María Fernanda López Gutiérrez",
  victimaDirecta: "María Fernanda López Gutiérrez",
  idVictimaDirecta: "1.067.845.321",
  demandado: "Transportes del Sinú S.A.S.",
  llamadoEnGarantia: "Zúrich Colombia Seguros S.A. Y OTROS",

  poliza: "RC-AUTO-2022-87654",
  vigenciaPoliza: "15/03/2022 — 15/03/2023",
  ramo: "Responsabilidad Civil Extracontractual",
  amparo: "RC Extracontractual derivada de accidente de tránsito",
  valorAsegurado: "$1.500.000.000",
  asegurado: "Transportes del Sinú S.A.S.",

  resumenSiniestro:
    "Accidente de tránsito ocurrido el 22 de julio de 2022 en la vía Montería-Cereté, " +
    "kilómetro 8, donde un vehículo de servicio público de propiedad de la demandada " +
    "colisionó con la motocicleta en la que se desplazaba la demandante, causándole " +
    "fracturas múltiples en miembro inferior derecho y trauma craneoencefálico moderado.",
  fechaSiniestro: "22/07/2022",
  fechaNotificacion: "15/03/2023",

  coaseguro: "N/A",
  nombreCoaseguradores: "N/A",
  participacionCoaseguradores: "N/A",
  coaseguradorParticipa: "N/A",

  fechaPresentacionDemanda: "10/01/2023",
  placa: "ABC-123",

  resumenContingencia:
    "Se trata de un proceso ordinario de responsabilidad civil extracontractual " +
    "derivado de un accidente de tránsito. La demandante reclama perjuicios materiales " +
    "e inmateriales. Existe informe de tránsito que atribuye la culpa al conductor del " +
    "vehículo de servicio público. Sin embargo, la pericial de reconstrucción contratada " +
    "por la defensa demuestra concurrencia de culpas, lo que reduce significativamente la " +
    "exposición patrimonial del asegurado y de la aseguradora.",
  pretensiones: "$850.000.000 (lucro cesante, daño emergente, daño moral, daño a la salud)",
  calificacionContingencia: "REMOTA",
  motivosCalificacion:
    "1) La pericia de reconstrucción demuestra concurrencia de culpas (la víctima no " +
    "portaba casco y circulaba sin luces). 2) Las pretensiones están sobredimensionadas " +
    "respecto de los soportes probatorios presentados. 3) La incapacidad definitiva no ha " +
    "sido dictaminada por la Junta Regional de Calificación de Invalidez. 4) El juzgado ha " +
    "acogido históricamente una posición conservadora en cuanto a la tasación de perjuicios " +
    "inmateriales en casos similares.",
  pretensionesObjetivadas:
    "$170.000.000 — correspondiente al 20% de las pretensiones totales, considerando la " +
    "concurrencia de culpas y la reducción proporcional del perjuicio reclamado.",

  observacionesGenerales:
    "Se recomienda mantener la estrategia de defensa actual enfocada en la concurrencia " +
    "de culpas. Próxima audiencia de instrucción y juzgamiento programada para el 15 de " +
    "abril de 2026. Se sugiere solicitar contrapericia de daño a la salud.",
  calificacionFinal: "REMOTA",
  reservaSugerida:
    "$170.000.000 — 20% de las pretensiones, ajustado por concurrencia de culpas",
};
