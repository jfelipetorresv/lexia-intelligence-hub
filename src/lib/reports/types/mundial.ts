export interface MundialInformeData {
  radicado: string;
  juzgado: string;
  claseProceso: string;
  demandante: string;
  demandado: string;
  afianzado: string;
  sucursalPoliza: string;
  numeroPoliza: string;
  objetoPoliza: string;
  ramo: string;
  vigenciaPoliza: string;
  valorAsegurado: string;
  pretensiones: string;
  excepcionesPropuestas: string;
  calificacionRiesgo: "PROBABLE" | "EVENTUAL" | "REMOTA";
  estadoActual: string;
  ultimasActuaciones: string;
  proximosVencimientos: string;
  propuestaHonorarios: string;
  observaciones: string;
}

export const mockMundialData: MundialInformeData = {
  radicado: "25000233600020230078900",
  juzgado: "Tribunal Administrativo de Cundinamarca, Sección Tercera",
  claseProceso: "Controversias contractuales",
  demandante: "Instituto de Desarrollo Urbano — IDU",
  demandado: "Consorcio Vías del Futuro 2022",
  afianzado: "Consorcio Vías del Futuro 2022",
  sucursalPoliza: "Bogotá — Sucursal Empresarial",
  numeroPoliza: "CU-MUN-2022-11234",
  objetoPoliza:
    "Garantía de cumplimiento del contrato de obra pública No. IDU-LP-045-2022 " +
    "para la construcción y rehabilitación de la malla vial en la localidad de Suba.",
  ramo: "Cumplimiento",
  vigenciaPoliza: "01/06/2022 — 01/06/2025",
  valorAsegurado: "$2.800.000.000",
  pretensiones:
    "Se solicita declarar el incumplimiento del contrato de obra pública No. IDU-LP-045-2022 " +
    "y en consecuencia condenar solidariamente al contratista y a la aseguradora al pago de: " +
    "cláusula penal por $1.400.000.000 (50% del valor del contrato), sobrecostos de interventoría " +
    "por $320.000.000 y perjuicios por mayor permanencia de obra por $480.000.000.",
  excepcionesPropuestas:
    "1. Inexistencia de incumplimiento contractual por parte del afianzado.\n" +
    "2. Culpa exclusiva de la entidad contratante por modificaciones unilaterales no compensadas.\n" +
    "3. Fuerza mayor derivada de la temporada invernal 2022-2023.\n" +
    "4. Agotamiento del amparo por terminación anticipada del contrato.",
  calificacionRiesgo: "EVENTUAL",
  estadoActual:
    "Etapa probatoria — se decretaron testimonios y dictamen pericial técnico de obra",
  ultimasActuaciones:
    "1) 20/01/2026 — Auto que decreta pruebas de oficio (inspección judicial al sitio de obra). " +
    "2) 15/12/2025 — Audiencia de pacto de cumplimiento fallida. " +
    "3) 01/11/2025 — Radicación del dictamen pericial de parte por la defensa.",
  proximosVencimientos:
    "Inspección judicial programada para el 20/04/2026. " +
    "Término para contradicción del dictamen de la demandante vence el 15/05/2026.",
  propuestaHonorarios: "N/A",
  observaciones:
    "El dictamen pericial de parte contratado por la defensa acredita un cumplimiento del 78% " +
    "de las obligaciones contractuales, lo cual debilita significativamente la pretensión de " +
    "incumplimiento total. Se recomienda mantener la estrategia de acreditar fuerza mayor y " +
    "modificaciones unilaterales no compensadas. La exposición real de la compañía se estima " +
    "en un 30% del valor asegurado, esto es aproximadamente $840.000.000.",
};
