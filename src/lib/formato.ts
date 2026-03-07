/**
 * Format a 23-digit Colombian radicado into standard format:
 * XX-XXX-XX-XX-XXX-XXXX-XXXXX-XX
 */
export function formatRadicado(radicado: string | null): string {
  if (!radicado) return "Sin radicado";
  const clean = radicado.replace(/\D/g, "");
  if (clean.length !== 23) return radicado;
  return `${clean.slice(0, 2)}-${clean.slice(2, 5)}-${clean.slice(5, 7)}-${clean.slice(7, 9)}-${clean.slice(9, 12)}-${clean.slice(12, 16)}-${clean.slice(16, 21)}-${clean.slice(21, 23)}`;
}

export const TIPO_PROCESO_LABELS: Record<string, string> = {
  CIVIL: "Civil",
  CONTENCIOSO_ADMINISTRATIVO: "Contencioso Administrativo",
  ARBITRAL: "Arbitral",
  LABORAL: "Laboral",
  PENAL: "Penal",
  RESPONSABILIDAD_FISCAL: "Responsabilidad Fiscal",
  PROCEDIMIENTO_ADMINISTRATIVO_SANCIONATORIO: "Proc. Adm. Sancionatorio",
  PASC: "PASC",
  EJECUTIVO: "Ejecutivo",
  DISCIPLINARIO: "Disciplinario",
  CONSTITUCIONAL: "Constitucional",
  OTRO: "Otro",
};

export const ESTADO_PROCESO_LABELS: Record<string, string> = {
  TRASLADO_PREVIO: "Traslado Previo",
  ACTIVO: "Activo",
  TERMINADO: "Terminado",
};

/**
 * Compute semaforo color based on days until plazoVencimiento.
 * ROJO: <3 days, NARANJA: <8 days, VERDE: >=8 days
 */
export function computeSemaforo(
  plazoVencimiento: Date | null
): "ROJO" | "NARANJA" | "VERDE" | null {
  if (!plazoVencimiento) return null;
  const now = new Date();
  const diffMs = new Date(plazoVencimiento).getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  if (diffDays < 3) return "ROJO";
  if (diffDays < 8) return "NARANJA";
  return "VERDE";
}
