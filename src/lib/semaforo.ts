import type { EstadoTermino } from "@prisma/client";

/**
 * Calcula el estado del semaforo basado en la fecha actual vs plazo de vencimiento.
 *
 * Reglas:
 * - Sin fecha -> null
 * - Vencido (dias < 0) -> ROJO
 * - 0-3 dias -> ROJO
 * - 4-10 dias -> NARANJA
 * - >10 dias -> VERDE
 */
export function calcularEstadoTermino(
  plazoVencimiento: Date | string | null
): EstadoTermino | null {
  if (!plazoVencimiento) return null;

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const venc = new Date(plazoVencimiento);
  venc.setHours(0, 0, 0, 0);

  const diffMs = venc.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 3) return "ROJO";
  if (diffDays <= 10) return "NARANJA";
  return "VERDE";
}

/**
 * Calcula los dias restantes hasta el vencimiento.
 * Negativo = ya vencido.
 */
export function diasHastaVencimiento(
  plazoVencimiento: Date | string | null
): number | null {
  if (!plazoVencimiento) return null;

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const venc = new Date(plazoVencimiento);
  venc.setHours(0, 0, 0, 0);

  return Math.ceil((venc.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Retorna las clases Tailwind para el badge del semaforo.
 */
export function getBadgeStyles(estado: EstadoTermino | null): {
  bg: string;
  text: string;
  label: string;
  dot: string;
} | null {
  if (!estado) return null;

  const config: Record<
    EstadoTermino,
    { bg: string; text: string; label: string; dot: string }
  > = {
    ROJO: {
      bg: "bg-red-100",
      text: "text-red-700",
      label: "Vencido / Urgente",
      dot: "bg-red-500",
    },
    NARANJA: {
      bg: "bg-orange-100",
      text: "text-orange-700",
      label: "Proximo",
      dot: "bg-orange-500",
    },
    VERDE: {
      bg: "bg-green-100",
      text: "text-green-700",
      label: "Al dia",
      dot: "bg-green-500",
    },
  };

  return config[estado];
}
