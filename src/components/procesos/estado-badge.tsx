import { ESTADO_PROCESO_LABELS } from "@/lib/formato";

const estadoStyles: Record<string, React.CSSProperties> = {
  ACTIVO: {
    background: "rgba(0, 128, 128, 0.15)",
    color: "#008080",
    border: "1px solid rgba(0, 128, 128, 0.4)",
  },
  TERMINADO: {
    background: "rgba(6, 6, 6, 0.08)",
    color: "#060606",
    border: "1px solid rgba(6, 6, 6, 0.2)",
  },
  SUSPENDIDO: {
    background: "rgba(245, 158, 11, 0.15)",
    color: "#92400E",
    border: "1px solid rgba(245, 158, 11, 0.4)",
  },
  ARCHIVADO: {
    background: "rgba(139, 140, 142, 0.15)",
    color: "#8B8C8E",
    border: "1px solid rgba(139, 140, 142, 0.4)",
  },
  TRASLADO_PREVIO: {
    background: "rgba(133, 211, 212, 0.2)",
    color: "#008080",
    border: "1px solid rgba(0, 128, 128, 0.3)",
  },
};

const defaultStyle: React.CSSProperties = {
  background: "rgba(133, 211, 212, 0.2)",
  color: "#008080",
  border: "1px solid rgba(0, 128, 128, 0.3)",
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
