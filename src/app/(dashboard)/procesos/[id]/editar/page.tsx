"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { formatRadicado } from "@/lib/formato";
import { CiudadSelect } from "@/components/ui/CiudadSelect";
import type { ProcesoDetail } from "@/types/proceso";

const TIPO_PROCESO_OPTIONS = [
  { value: "CIVIL", label: "Civil" },
  { value: "CONTENCIOSO_ADMINISTRATIVO", label: "Contencioso Administrativo" },
  { value: "ARBITRAL", label: "Arbitral" },
  { value: "LABORAL", label: "Laboral" },
  { value: "PENAL", label: "Penal" },
  { value: "RESPONSABILIDAD_FISCAL", label: "Responsabilidad Fiscal" },
  { value: "PROCEDIMIENTO_ADMINISTRATIVO_SANCIONATORIO", label: "Proc. Adm. Sancionatorio" },
  { value: "PASC", label: "PASC" },
  { value: "EJECUTIVO", label: "Ejecutivo" },
  { value: "DISCIPLINARIO", label: "Disciplinario" },
  { value: "CONSTITUCIONAL", label: "Constitucional" },
  { value: "OTRO", label: "Otro" },
];

const CLASE_PROCESO_OPTIONS = [
  { value: "ORDINARIO", label: "Ordinario" },
  { value: "VERBAL", label: "Verbal" },
  { value: "EJECUTIVO", label: "Ejecutivo" },
  { value: "NULIDAD_RESTABLECIMIENTO", label: "Nulidad y Restablecimiento" },
  { value: "REPARACION_DIRECTA", label: "Reparación Directa" },
  { value: "REPARACION_DIRECTA_CONTRACTUAL", label: "Reparación Directa Contractual" },
  { value: "ARBITRAMENTO", label: "Arbitramento" },
  { value: "OTRO", label: "Otro" },
];

const ESTADO_OPTIONS = [
  { value: "ACTIVO", label: "Activo" },
  { value: "SUSPENDIDO", label: "Suspendido" },
  { value: "TRASLADO_PREVIO", label: "Traslado Previo" },
  { value: "TERMINADO", label: "Terminado" },
  { value: "ARCHIVADO", label: "Archivado" },
];

interface ClienteOption {
  id: string;
  nombre: string;
  nit: string | null;
  tipo: string;
}

interface AbogadoOption {
  id: string;
  nombre: string;
  rol: string;
  especialidad: string | null;
}

function EditSkeleton() {
  return (
    <div className="mx-auto max-w-4xl animate-pulse">
      <div className="mb-2 h-4 w-20 rounded bg-[#E8E9EA]" />
      <div className="mb-8 h-8 w-56 rounded bg-[#E8E9EA]" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="mb-6 rounded-sm border border-[#E8E9EA] bg-white p-6">
          <div className="mb-6 h-4 w-48 rounded bg-[#E8E9EA]" />
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j}>
                <div className="mb-1 h-3 w-24 rounded bg-[#E8E9EA]" />
                <div className="h-9 w-full rounded bg-[#E8E9EA]" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function EditarProcesoPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [radicado, setRadicado] = useState<string | null>(null);
  const [clientes, setClientes] = useState<ClienteOption[]>([]);
  const [abogados, setAbogados] = useState<AbogadoOption[]>([]);

  const [form, setForm] = useState({
    tipoProceso: "",
    claseProceso: "",
    estadoActual: "ACTIVO",
    fechaApertura: "",
    demandante: "",
    demandado: "",
    juzgado: "",
    ciudad: "",
    cuantia: "",
    clienteId: "",
    abogadoLiderId: "",
    descripcion: "",
  });

  useEffect(() => {
    async function loadData() {
      try {
        const [procesoRes, clientesRes, abogadosRes] = await Promise.all([
          fetch(`/api/procesos/${id}`),
          fetch("/api/clientes"),
          fetch("/api/abogados"),
        ]);

        if (!procesoRes.ok) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        const proceso: ProcesoDetail = await procesoRes.json();
        const clientesData = await clientesRes.json();
        const abogadosData = await abogadosRes.json();

        setClientes(clientesData);
        setAbogados(abogadosData);
        setRadicado(proceso.radicado);

        const lider = proceso.asignaciones.find(
          (a) => a.rolEnCaso === "LIDER" && a.activa
        );

        // Format date for input[type=date]
        let fechaStr = "";
        if (proceso.fechaApertura) {
          const d = new Date(proceso.fechaApertura);
          fechaStr = d.toISOString().split("T")[0];
        }

        setForm({
          tipoProceso: proceso.tipoProceso,
          claseProceso: proceso.claseProceso ?? "",
          estadoActual: proceso.estadoActual,
          fechaApertura: fechaStr,
          demandante: proceso.demandante ?? "",
          demandado: proceso.demandado ?? "",
          juzgado: proceso.juzgado ?? "",
          ciudad: proceso.ciudad ?? "",
          cuantia: proceso.cuantia ?? "",
          clienteId: proceso.clienteId,
          abogadoLiderId: lider?.abogadoId ?? "",
          descripcion: proceso.descripcion ?? "",
        });
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.tipoProceso) return setError("El tipo de proceso es requerido");
    if (!form.fechaApertura) return setError("La fecha de notificación es requerida");
    if (!form.demandante.trim()) return setError("El demandante es requerido");
    if (!form.demandado.trim()) return setError("El demandado es requerido");
    if (!form.juzgado.trim()) return setError("El juzgado es requerido");
    if (!form.clienteId) return setError("El cliente es requerido");
    if (!form.abogadoLiderId) return setError("El abogado líder es requerido");

    setSubmitting(true);

    try {
      const res = await fetch(`/api/procesos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Error al actualizar el proceso");
        setSubmitting(false);
        return;
      }

      router.push(`/procesos/${id}`);
      router.refresh();
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
      setSubmitting(false);
    }
  };

  if (loading) return <EditSkeleton />;

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h2
          className="text-xl font-light text-[#060606]"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          Proceso no encontrado
        </h2>
        <p className="mt-2 text-sm text-[#8B8C8E]">
          El proceso que intentas editar no existe.
        </p>
        <Link
          href="/procesos"
          className="mt-6 flex items-center gap-2 text-sm font-medium text-[#008080] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al listado
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-1.5 text-xs text-[#8B8C8E]">
          <Link href="/procesos" className="hover:text-[#008080]">
            Procesos
          </Link>
          <span>/</span>
          <Link href={`/procesos/${id}`} className="font-mono hover:text-[#008080]">
            {formatRadicado(radicado)}
          </Link>
          <span>/</span>
          <span className="text-[#060606]">Editar</span>
        </div>
        <h1 className="mt-2 text-3xl font-light tracking-wide text-[#060606]">
          Editar Proceso
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Error */}
        {error && (
          <div className="mb-6 rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* ── Sección 1: Identificación ── */}
        <div className="mb-6 rounded-sm border border-[#E8E9EA] bg-white p-6">
          <h2 className="text-xs font-medium uppercase tracking-widest text-[#060606]">
            Identificación del Proceso
          </h2>
          <div className="mb-6 mt-2 h-[2px] w-8 bg-[#008080]" />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Radicado — readonly */}
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-[#060606]">
                Radicado Judicial
              </label>
              <input
                type="text"
                value={formatRadicado(radicado)}
                readOnly
                className="w-full rounded-sm border border-[#E8E9EA] bg-[#FAFBFC] px-3 py-2 font-mono text-sm text-[#8B8C8E] focus:outline-none"
              />
              <p className="mt-1 text-[11px] text-[#8B8C8E]">
                El radicado no puede modificarse
              </p>
            </div>

            {/* Tipo de Proceso */}
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-[#060606]">
                Tipo de Proceso *
              </label>
              <select
                value={form.tipoProceso}
                onChange={(e) => updateField("tipoProceso", e.target.value)}
                className="w-full rounded-sm border border-[#E8E9EA] bg-white px-3 py-2 text-sm text-[#060606] focus:border-[#008080] focus:outline-none focus:ring-1 focus:ring-[#008080]"
              >
                <option value="">Seleccionar...</option>
                {TIPO_PROCESO_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Clase de Proceso */}
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-[#060606]">
                Clase de Proceso
              </label>
              <select
                value={form.claseProceso}
                onChange={(e) => updateField("claseProceso", e.target.value)}
                className="w-full rounded-sm border border-[#E8E9EA] bg-white px-3 py-2 text-sm text-[#060606] focus:border-[#008080] focus:outline-none focus:ring-1 focus:ring-[#008080]"
              >
                <option value="">Seleccionar...</option>
                {CLASE_PROCESO_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Estado */}
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-[#060606]">
                Estado *
              </label>
              <select
                value={form.estadoActual}
                onChange={(e) => updateField("estadoActual", e.target.value)}
                className="w-full rounded-sm border border-[#E8E9EA] bg-white px-3 py-2 text-sm text-[#060606] focus:border-[#008080] focus:outline-none focus:ring-1 focus:ring-[#008080]"
              >
                {ESTADO_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Fecha de Notificación */}
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-[#060606]">
                Fecha de Notificación *
              </label>
              <input
                type="date"
                value={form.fechaApertura}
                onChange={(e) => updateField("fechaApertura", e.target.value)}
                className="w-full rounded-sm border border-[#E8E9EA] bg-white px-3 py-2 text-sm text-[#060606] focus:border-[#008080] focus:outline-none focus:ring-1 focus:ring-[#008080]"
              />
            </div>
          </div>
        </div>

        {/* ── Sección 2: Partes y Juzgado ── */}
        <div className="mb-6 rounded-sm border border-[#E8E9EA] bg-white p-6">
          <h2 className="text-xs font-medium uppercase tracking-widest text-[#060606]">
            Partes y Juzgado
          </h2>
          <div className="mb-6 mt-2 h-[2px] w-8 bg-[#008080]" />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Demandante */}
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-[#060606]">
                Demandante *
              </label>
              <input
                type="text"
                value={form.demandante}
                onChange={(e) => updateField("demandante", e.target.value)}
                placeholder="Nombre del demandante"
                className="w-full rounded-sm border border-[#E8E9EA] bg-white px-3 py-2 text-sm text-[#060606] placeholder:text-[#8B8C8E] focus:border-[#008080] focus:outline-none focus:ring-1 focus:ring-[#008080]"
              />
            </div>

            {/* Demandado */}
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-[#060606]">
                Demandado *
              </label>
              <input
                type="text"
                value={form.demandado}
                onChange={(e) => updateField("demandado", e.target.value)}
                placeholder="Nombre del demandado"
                className="w-full rounded-sm border border-[#E8E9EA] bg-white px-3 py-2 text-sm text-[#060606] placeholder:text-[#8B8C8E] focus:border-[#008080] focus:outline-none focus:ring-1 focus:ring-[#008080]"
              />
            </div>

            {/* Juzgado — full width */}
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-[#060606]">
                Juzgado / Tribunal *
              </label>
              <input
                type="text"
                value={form.juzgado}
                onChange={(e) => updateField("juzgado", e.target.value)}
                placeholder="Ej: Juzgado 15 Civil del Circuito de Bogotá"
                className="w-full rounded-sm border border-[#E8E9EA] bg-white px-3 py-2 text-sm text-[#060606] placeholder:text-[#8B8C8E] focus:border-[#008080] focus:outline-none focus:ring-1 focus:ring-[#008080]"
              />
            </div>

            {/* Ciudad */}
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-[#060606]">
                Ciudad
              </label>
              <CiudadSelect
                value={form.ciudad}
                onChange={(ciudad) => updateField("ciudad", ciudad)}
                placeholder="Ej: Bogotá D.C."
              />
            </div>

            {/* Cuantía */}
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-[#060606]">
                Cuantía (COP)
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={form.cuantia ? Number(form.cuantia).toLocaleString("es-CO") : ""}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\./g, "").replace(/[^0-9]/g, "");
                  updateField("cuantia", raw);
                }}
                placeholder="Ej: 50.000.000"
                className="w-full rounded-sm border border-[#E8E9EA] bg-white px-3 py-2 text-sm text-[#060606] placeholder:text-[#8B8C8E] focus:border-[#008080] focus:outline-none focus:ring-1 focus:ring-[#008080]"
              />
              <p className="mt-1 text-xs text-[#8B8C8E]">Ingresa el valor en pesos colombianos</p>
            </div>
          </div>
        </div>

        {/* ── Sección 3: Asignación ── */}
        <div className="mb-6 rounded-sm border border-[#E8E9EA] bg-white p-6">
          <h2 className="text-xs font-medium uppercase tracking-widest text-[#060606]">
            Asignación
          </h2>
          <div className="mb-6 mt-2 h-[2px] w-8 bg-[#008080]" />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Cliente */}
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-[#060606]">
                Cliente *
              </label>
              <select
                value={form.clienteId}
                onChange={(e) => updateField("clienteId", e.target.value)}
                className="w-full rounded-sm border border-[#E8E9EA] bg-white px-3 py-2 text-sm text-[#060606] focus:border-[#008080] focus:outline-none focus:ring-1 focus:ring-[#008080]"
              >
                <option value="">Seleccionar cliente...</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                    {c.nit ? ` (${c.nit})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Abogado Líder */}
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-[#060606]">
                Abogado Líder *
              </label>
              <select
                value={form.abogadoLiderId}
                onChange={(e) => updateField("abogadoLiderId", e.target.value)}
                className="w-full rounded-sm border border-[#E8E9EA] bg-white px-3 py-2 text-sm text-[#060606] focus:border-[#008080] focus:outline-none focus:ring-1 focus:ring-[#008080]"
              >
                <option value="">Seleccionar abogado...</option>
                {abogados.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nombre} — {a.rol}
                    {a.especialidad ? ` (${a.especialidad})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Descripción — full width */}
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-[#060606]">
                Descripción / Observaciones
              </label>
              <textarea
                value={form.descripcion}
                onChange={(e) => updateField("descripcion", e.target.value)}
                placeholder="Descripción general del proceso..."
                rows={4}
                className="w-full resize-none rounded-sm border border-[#E8E9EA] bg-white px-3 py-2 text-sm text-[#060606] placeholder:text-[#8B8C8E] focus:border-[#008080] focus:outline-none focus:ring-1 focus:ring-[#008080]"
              />
            </div>
          </div>
        </div>

        {/* ── Botones ── */}
        <div className="flex items-center justify-end">
          <Link
            href={`/procesos/${id}`}
            className="mr-3 rounded-sm border border-[#E8E9EA] bg-white px-6 py-2 text-sm text-[#060606] transition-colors hover:bg-[#FAFBFC]"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-sm bg-[#060606] px-6 py-2 text-sm text-white transition-colors hover:bg-[#008080] disabled:opacity-50"
          >
            {submitting ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Guardando...
              </span>
            ) : (
              "Guardar Cambios"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
