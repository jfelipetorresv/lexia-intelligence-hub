export function formatCOP(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(date: Date | string | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatRadicado(radicado: string | null): string {
  if (!radicado) return "Sin radicado";
  // Formato: XX-XXX-XX-XXXX-XXXX-XXXXX-XX
  const clean = radicado.replace(/\D/g, "");
  if (clean.length === 23) {
    return `${clean.slice(0, 2)}-${clean.slice(2, 5)}-${clean.slice(5, 7)}-${clean.slice(7, 11)}-${clean.slice(11, 15)}-${clean.slice(15, 20)}-${clean.slice(20, 23)}`;
  }
  return radicado;
}
