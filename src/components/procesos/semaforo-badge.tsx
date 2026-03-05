const semaforoConfig = {
  ROJO: { label: "Urgente", color: "#DC2626" },
  NARANJA: { label: "Próximo", color: "#EA580C" },
  VERDE: { label: "Al día", color: "#008080" },
};

export function SemaforoBadge({
  semaforo,
}: {
  semaforo: "ROJO" | "NARANJA" | "VERDE" | null;
}) {
  if (!semaforo)
    return <span className="text-[12px] text-[#8B8C8E]">—</span>;

  const config = semaforoConfig[semaforo];

  return (
    <span className="inline-flex items-center gap-2">
      <span
        className="inline-block h-2 w-2 rounded-full"
        style={{ backgroundColor: config.color }}
      />
      <span
        className="font-data text-[12px] font-medium"
        style={{ color: config.color }}
      >
        {config.label}
      </span>
    </span>
  );
}
