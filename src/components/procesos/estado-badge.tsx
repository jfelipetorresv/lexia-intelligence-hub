import { ESTADO_PROCESO_LABELS } from "@/lib/formato";

const estadoStyles: Record<string, React.CSSProperties> = {
  TRASLADO_PREVIO: {
    background: "rgba(139, 140, 142, 0.15)",
    color: "#8B8C8E",
    border: "1px solid rgba(139, 140, 142, 0.4)",
  },
  ACTIVO: {
    background: "rgba(22, 163, 74, 0.12)",
    color: "#16a34a",
    border: "1px solid rgba(22, 163, 74, 0.4)",
  },
  TERMINADO: {
    background: "rgba(6, 6, 6, 0.08)",
    color: "#060606",
    border: "1px solid rgba(6, 6, 6, 0.2)",
  },
};

const defaultStyle: React.CSSProperties = {
  background: "rgba(139, 140, 142, 0.15)",
  color: "#8B8C8E",
  border: "1px solid rgba(139, 140, 142, 0.4)",
};

export function EstadoBadge({ estado }: { estado: string }) {
  const style = estadoStyles[estado] ?? defaultStyle;

  return (
    <span
      className="inline-block whitespace-nowrap px-2 py-0.5 text-[11px] font-medium uppercase tracking-[0.04em]"
      style={{ borderRadius: "2px", ...style }}
    >
      {ESTADO_PROCESO_LABELS[estado] ?? estado}
    </span>
  );
}
