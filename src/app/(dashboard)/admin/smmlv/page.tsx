"use client";

import { useEffect, useState, FormEvent } from "react";
import { Loader2 } from "lucide-react";

interface ValorSMMLV {
  id: number;
  anio: number;
  valor: number;
  decreto: string | null;
  creadoEn: string;
}

const formatCOP = (v: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(v);

export default function AdminSMMLVPage() {
  const [valores, setValores] = useState<ValorSMMLV[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formAnio, setFormAnio] = useState("");
  const [formValor, setFormValor] = useState("");
  const [formDecreto, setFormDecreto] = useState("");

  const fetchValores = async () => {
    try {
      const res = await fetch("/api/smmlv");
      if (res.ok) setValores(await res.json());
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchValores();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const anio = parseInt(formAnio);
    const valor = parseFloat(formValor);

    if (!anio || anio < 2000 || anio > 2100) {
      setError("Ingresa un año válido");
      return;
    }
    if (!valor || valor <= 0) {
      setError("Ingresa un valor válido");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/smmlv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          anio,
          valor,
          decreto: formDecreto.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Error al guardar");
        return;
      }

      setSuccess(`SMMLV ${anio} registrado correctamente`);
      setFormAnio("");
      setFormValor("");
      setFormDecreto("");
      await fetchValores();
    } catch {
      setError("Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1
          className="text-2xl font-light tracking-wide text-[#060606]"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          SMMLV — Salario Mínimo
        </h1>
        <p className="mt-1 text-sm text-[#8B8C8E]">
          Valores históricos del Salario Mínimo Mensual Legal Vigente en Colombia
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        {/* Tabla */}
        <div className="rounded-sm border border-[#E8E9EA] bg-white p-6">
          <div className="mb-5">
            <h2
              className="text-xs font-medium uppercase tracking-widest text-[#060606]"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              Valores registrados
            </h2>
            <div className="mt-1.5 h-[2px] w-8 bg-[#008080]" />
          </div>

          {loading ? (
            <div className="animate-pulse space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 rounded bg-[#E8E9EA]" />
              ))}
            </div>
          ) : valores.length === 0 ? (
            <p className="py-8 text-center text-sm text-[#8B8C8E]">
              No hay valores SMMLV registrados.
            </p>
          ) : (
            <div className="overflow-hidden rounded-sm border border-[#E8E9EA]">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#FAFBFC]">
                    <th className="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-[#8B8C8E]">Año</th>
                    <th className="px-4 py-2.5 text-right text-[11px] font-medium uppercase tracking-wider text-[#8B8C8E]">Valor</th>
                    <th className="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-[#8B8C8E]">Decreto</th>
                    <th className="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-[#8B8C8E]">Registrado</th>
                  </tr>
                </thead>
                <tbody>
                  {valores.map((v) => (
                    <tr key={v.id} className="border-t border-[#E8E9EA]">
                      <td className="px-4 py-2.5 text-sm font-bold text-[#060606]">{v.anio}</td>
                      <td className="px-4 py-2.5 text-right text-sm font-medium text-[#008080]">{formatCOP(v.valor)}</td>
                      <td className="px-4 py-2.5 text-sm text-[#8B8C8E]">{v.decreto || "—"}</td>
                      <td className="px-4 py-2.5 text-sm text-[#8B8C8E]">
                        {new Date(v.creadoEn).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Formulario */}
        <div className="rounded-sm border border-[#E8E9EA] bg-white p-6">
          <div className="mb-5">
            <h2
              className="text-xs font-medium uppercase tracking-widest text-[#060606]"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              Registrar nuevo año
            </h2>
            <div className="mt-1.5 h-[2px] w-8 bg-[#008080]" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-[#8B8C8E]">
                Año *
              </label>
              <input
                type="number"
                value={formAnio}
                onChange={(e) => setFormAnio(e.target.value)}
                placeholder="2027"
                className="w-full rounded-sm border border-[#E8E9EA] bg-white px-3 py-2 text-sm text-[#060606] focus:border-[#008080] focus:outline-none focus:ring-1 focus:ring-[#008080]"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-[#8B8C8E]">
                Valor ($) *
              </label>
              <input
                type="number"
                value={formValor}
                onChange={(e) => setFormValor(e.target.value)}
                placeholder="1750905"
                className="w-full rounded-sm border border-[#E8E9EA] bg-white px-3 py-2 text-sm text-[#060606] focus:border-[#008080] focus:outline-none focus:ring-1 focus:ring-[#008080]"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-[#8B8C8E]">
                Decreto
              </label>
              <input
                type="text"
                value={formDecreto}
                onChange={(e) => setFormDecreto(e.target.value)}
                placeholder="Decreto XXXX de YYYY"
                className="w-full rounded-sm border border-[#E8E9EA] bg-white px-3 py-2 text-sm text-[#060606] focus:border-[#008080] focus:outline-none focus:ring-1 focus:ring-[#008080]"
              />
            </div>

            {error && (
              <div className="rounded-sm border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-sm border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-sm bg-[#008080] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#006666] disabled:opacity-50"
            >
              {saving ? (
                <span className="inline-flex items-center justify-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Guardando...
                </span>
              ) : (
                "Registrar SMMLV"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
