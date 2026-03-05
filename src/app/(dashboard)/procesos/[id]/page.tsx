"use client";

import { useEffect, useState, FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  Paperclip,
  Calculator,
  ClipboardList,
  Plus,
  Loader2,
  X,
} from "lucide-react";
import { EstadoBadge } from "@/components/procesos/estado-badge";
import { SemaforoBadge } from "@/components/procesos/semaforo-badge";
import {
  formatRadicado,
  TIPO_PROCESO_LABELS,
} from "@/lib/formato";
import {
  calcularEstadoTermino,
  diasHastaVencimiento,
  getBadgeStyles,
} from "@/lib/semaforo";
import type { ProcesoDetail } from "@/types/proceso";

function formatDate(date: Date | string | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatCurrency(value: string | null): string {
  if (!value) return "—";
  const num = parseFloat(value);
  if (isNaN(num)) return "—";
  return `$ ${num.toLocaleString("es-CO")}`;
}

function InfoField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-[#8B8C8E]">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium text-[#060606]">{children}</dd>
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="mb-5">
      <h2
        className="text-xs font-medium uppercase tracking-widest text-[#060606]"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        {title}
      </h2>
      <div className="mt-1.5 h-[2px] w-8 bg-[#008080]" />
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="mb-1 h-4 w-40 rounded bg-[#E8E9EA]" />
      <div className="mb-4 h-8 w-72 rounded bg-[#E8E9EA]" />
      <div className="mb-8 flex gap-2">
        <div className="h-6 w-20 rounded bg-[#E8E9EA]" />
        <div className="h-6 w-20 rounded bg-[#E8E9EA]" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <div className="rounded-sm border border-[#E8E9EA] bg-white p-6">
            <div className="mb-5 h-4 w-48 rounded bg-[#E8E9EA]" />
            <div className="grid grid-cols-2 gap-x-8 gap-y-5">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i}>
                  <div className="mb-1 h-3 w-20 rounded bg-[#E8E9EA]" />
                  <div className="h-4 w-32 rounded bg-[#E8E9EA]" />
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-sm border border-[#E8E9EA] bg-white p-6">
            <div className="mb-5 h-4 w-48 rounded bg-[#E8E9EA]" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="mb-3 h-12 rounded bg-[#E8E9EA]" />
            ))}
          </div>
        </div>
        <div className="space-y-6">
          <div className="rounded-sm border border-[#E8E9EA] bg-white p-6">
            <div className="mb-5 h-4 w-36 rounded bg-[#E8E9EA]" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-4 w-full rounded bg-[#E8E9EA]" />
              ))}
            </div>
          </div>
          <div className="rounded-sm border border-[#E8E9EA] bg-white p-6">
            <div className="mb-5 h-4 w-36 rounded bg-[#E8E9EA]" />
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-10 rounded bg-[#E8E9EA]" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const TIPO_ACTUACION_OPTIONS = [
  "Notificación",
  "Auto",
  "Sentencia",
  "Recurso",
  "Audiencia",
  "Traslado",
  "Memorial",
  "Término de ejecutoria",
  "Término para contestar",
  "Otro",
];

interface HitoItem {
  id: string;
  tipoActuacion: string;
  fecha: string;
  descripcion: string | null;
  plazoVencimiento: string | null;
  estadoTermino: "VERDE" | "NARANJA" | "ROJO" | null;
}

function EstadoTerminoBadge({ estado }: { estado: string | null }) {
  if (!estado) {
    return (
      <span className="inline-block rounded-sm bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
        Sin término
      </span>
    );
  }
  const config: Record<string, { bg: string; text: string; label: string }> = {
    ROJO: { bg: "bg-red-100", text: "text-red-700", label: "Vencido / Urgente" },
    NARANJA: { bg: "bg-orange-100", text: "text-orange-700", label: "Próximo" },
    VERDE: { bg: "bg-green-100", text: "text-green-700", label: "Al día" },
  };
  const c = config[estado] ?? config.VERDE;
  return (
    <span className={`inline-block rounded-sm px-2 py-0.5 text-[11px] font-medium ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
}

function HitosProcesalesSection({ procesoId }: { procesoId: string }) {
  const [hitos, setHitos] = useState<HitoItem[]>([]);
  const [loadingHitos, setLoadingHitos] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [hitoForm, setHitoForm] = useState({
    tipo_actuacion: "",
    fecha: "",
    descripcion: "",
    plazo_vencimiento: "",
    estado_termino: "",
  });

  const fetchHitos = async () => {
    try {
      const res = await fetch(`/api/procesos/${procesoId}/hitos`);
      if (res.ok) {
        const data = await res.json();
        setHitos(data);
      }
    } catch {
      // silent
    } finally {
      setLoadingHitos(false);
    }
  };

  useEffect(() => {
    fetchHitos();
  }, [procesoId]);

  const resetForm = () => {
    setHitoForm({
      tipo_actuacion: "",
      fecha: "",
      descripcion: "",
      plazo_vencimiento: "",
      estado_termino: "",
    });
    setFormError(null);
  };

  const handleCancel = () => {
    setShowForm(false);
    resetForm();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!hitoForm.tipo_actuacion) return setFormError("El tipo de actuación es requerido");
    if (!hitoForm.fecha) return setFormError("La fecha es requerida");
    if (!hitoForm.descripcion.trim()) return setFormError("La descripción es requerida");
    if (hitoForm.descripcion.length > 500) return setFormError("La descripción no puede exceder 500 caracteres");

    setSaving(true);

    try {
      const body: Record<string, string | null> = {
        tipo_actuacion: hitoForm.tipo_actuacion,
        fecha: hitoForm.fecha,
        descripcion: hitoForm.descripcion,
        plazo_vencimiento: hitoForm.plazo_vencimiento || null,
        estado_termino: hitoForm.estado_termino || null,
      };

      const res = await fetch(`/api/procesos/${procesoId}/hitos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setFormError(data.error || "Error al crear el hito");
        setSaving(false);
        return;
      }

      await fetchHitos();
      setShowForm(false);
      resetForm();
    } catch {
      setFormError("Error de conexión. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-sm border border-[#E8E9EA] bg-white p-6">
      <div className="mb-5 flex items-center justify-between">
        <SectionTitle title="Hitos Procesales" />
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 rounded-sm bg-[#060606] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#008080]"
          >
            <Plus className="h-3.5 w-3.5" />
            Registrar hito
          </button>
        )}
      </div>

      {/* Inline form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 rounded-sm border border-[#008080]/30 bg-[#FAFBFC] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs font-medium uppercase tracking-wide text-[#060606]">
              Nuevo hito
            </h3>
            <button type="button" onClick={handleCancel} className="text-[#8B8C8E] hover:text-[#060606]">
              <X className="h-4 w-4" />
            </button>
          </div>

          {formError && (
            <div className="mb-3 rounded-sm border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-[#8B8C8E]">
                Tipo de actuación *
              </label>
              <select
                value={hitoForm.tipo_actuacion}
                onChange={(e) => setHitoForm((p) => ({ ...p, tipo_actuacion: e.target.value }))}
                className="w-full rounded-sm border border-[#E8E9EA] bg-white px-3 py-2 text-sm text-[#060606] focus:border-[#008080] focus:outline-none focus:ring-1 focus:ring-[#008080]"
              >
                <option value="">Seleccionar...</option>
                {TIPO_ACTUACION_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-[#8B8C8E]">
                Fecha de la actuación *
              </label>
              <input
                type="date"
                value={hitoForm.fecha}
                onChange={(e) => setHitoForm((p) => ({ ...p, fecha: e.target.value }))}
                className="w-full rounded-sm border border-[#E8E9EA] bg-white px-3 py-2 text-sm text-[#060606] focus:border-[#008080] focus:outline-none focus:ring-1 focus:ring-[#008080]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-[#8B8C8E]">
                Descripción *
              </label>
              <textarea
                value={hitoForm.descripcion}
                onChange={(e) => setHitoForm((p) => ({ ...p, descripcion: e.target.value }))}
                placeholder="Descripción de la actuación..."
                maxLength={500}
                rows={3}
                className="w-full resize-none rounded-sm border border-[#E8E9EA] bg-white px-3 py-2 text-sm text-[#060606] placeholder:text-[#8B8C8E] focus:border-[#008080] focus:outline-none focus:ring-1 focus:ring-[#008080]"
              />
              <p className="mt-0.5 text-right text-[11px] text-[#8B8C8E]">
                {hitoForm.descripcion.length}/500
              </p>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-[#8B8C8E]">
                Fecha de vencimiento
              </label>
              <input
                type="date"
                value={hitoForm.plazo_vencimiento}
                onChange={(e) => {
                  const fecha = e.target.value;
                  const estado = fecha
                    ? calcularEstadoTermino(new Date(fecha + "T00:00:00"))
                    : null;
                  setHitoForm((p) => ({
                    ...p,
                    plazo_vencimiento: fecha,
                    estado_termino: estado ?? "",
                  }));
                }}
                className="w-full rounded-sm border border-[#E8E9EA] bg-white px-3 py-2 text-sm text-[#060606] focus:border-[#008080] focus:outline-none focus:ring-1 focus:ring-[#008080]"
              />
              {hitoForm.plazo_vencimiento && (() => {
                const estado = calcularEstadoTermino(
                  new Date(hitoForm.plazo_vencimiento + "T00:00:00")
                );
                const dias = diasHastaVencimiento(
                  new Date(hitoForm.plazo_vencimiento + "T00:00:00")
                );
                const styles = getBadgeStyles(estado);
                if (!estado || !styles || dias === null) return null;
                const diasTexto =
                  dias < 0
                    ? `vencido hace ${Math.abs(dias)} dia${Math.abs(dias) !== 1 ? "s" : ""}`
                    : dias === 0
                      ? "vence hoy"
                      : `${dias} dia${dias !== 1 ? "s" : ""}`;
                const dot =
                  estado === "ROJO" ? "\uD83D\uDD34" : estado === "NARANJA" ? "\uD83D\uDFE0" : "\uD83D\uDFE2";
                return (
                  <p className={`mt-1 text-[11px] font-medium ${styles.text}`}>
                    {`Sugerencia automatica: ${dot} ${styles.label} (${diasTexto})`}
                  </p>
                );
              })()}
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-[#8B8C8E]">
                Estado del termino
              </label>
              <select
                value={hitoForm.estado_termino}
                onChange={(e) => setHitoForm((p) => ({ ...p, estado_termino: e.target.value }))}
                className="w-full rounded-sm border border-[#E8E9EA] bg-white px-3 py-2 text-sm text-[#060606] focus:border-[#008080] focus:outline-none focus:ring-1 focus:ring-[#008080]"
              >
                <option value="">Sin estado</option>
                <option value="VERDE">VERDE — Al dia</option>
                <option value="NARANJA">NARANJA — Proximo a vencer</option>
                <option value="ROJO">ROJO — Vencido o urgente</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-sm border border-[#E8E9EA] bg-white px-4 py-1.5 text-sm text-[#060606] transition-colors hover:bg-[#FAFBFC]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-sm bg-[#060606] px-4 py-1.5 text-sm text-white transition-colors hover:bg-[#008080] disabled:opacity-50"
            >
              {saving ? (
                <span className="inline-flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Guardando...
                </span>
              ) : (
                "Guardar hito"
              )}
            </button>
          </div>
        </form>
      )}

      {/* Hitos list */}
      {loadingHitos ? (
        <div className="animate-pulse space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-12 rounded bg-[#E8E9EA]" />
          ))}
        </div>
      ) : hitos.length === 0 ? (
        <p className="py-8 text-center text-sm text-[#8B8C8E]">
          No hay hitos registrados aún
        </p>
      ) : (
        <div className="overflow-hidden rounded-sm border border-[#E8E9EA]">
          <table className="w-full">
            <thead>
              <tr className="bg-[#FAFBFC]">
                <th className="px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wider text-[#8B8C8E]">
                  Fecha
                </th>
                <th className="px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wider text-[#8B8C8E]">
                  Actuación
                </th>
                <th className="px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wider text-[#8B8C8E]">
                  Descripción
                </th>
                <th className="px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wider text-[#8B8C8E]">
                  Vencimiento
                </th>
                <th className="px-3 py-2 text-center text-[11px] font-medium uppercase tracking-wider text-[#8B8C8E]">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody>
              {hitos.map((hito) => (
                <tr key={hito.id} className="border-t border-[#E8E9EA]">
                  <td className="whitespace-nowrap px-3 py-2.5 font-data text-[13px] text-[#060606]">
                    {formatDate(hito.fecha)}
                  </td>
                  <td className="px-3 py-2.5 text-[13px] font-medium text-[#060606]">
                    {hito.tipoActuacion}
                  </td>
                  <td className="max-w-[250px] truncate px-3 py-2.5 font-data text-[13px] text-[#8B8C8E]">
                    {hito.descripcion ?? "—"}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 font-data text-[13px] text-[#060606]">
                    {formatDate(hito.plazoVencimiento)}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <EstadoTerminoBadge estado={hito.estadoTermino} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function ProcesoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [proceso, setProceso] = useState<ProcesoDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [archiving, setArchiving] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/procesos/${id}`);
        if (!res.ok) {
          setError(true);
          return;
        }
        const data = await res.json();
        setProceso(data);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  if (loading) return <DetailSkeleton />;

  if (error || !proceso) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h2
          className="text-xl font-light text-[#060606]"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          Proceso no encontrado
        </h2>
        <p className="mt-2 text-sm text-[#8B8C8E]">
          El proceso que buscas no existe o fue eliminado.
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

  const abogadoLider = proceso.asignaciones.find(
    (a) => a.rolEnCaso === "LIDER" && a.activa
  );
  const otrasAsignaciones = proceso.asignaciones.filter(
    (a) => !(a.rolEnCaso === "LIDER" && a.activa)
  );

  return (
    <div>
      {/* Breadcrumb */}
      <div className="mb-1 flex items-center gap-1.5 text-xs text-[#8B8C8E]">
        <Link href="/procesos" className="hover:text-[#008080]">
          Procesos
        </Link>
        <span>/</span>
        <span className="font-mono text-[#060606]">
          {formatRadicado(proceso.radicado)}
        </span>
      </div>

      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1
            className="text-2xl font-light tracking-wide text-[#060606]"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            {proceso.claseProceso
              ? `${proceso.claseProceso} — `
              : ""}
            {TIPO_PROCESO_LABELS[proceso.tipoProceso] ?? proceso.tipoProceso}
          </h1>
          <div className="mt-2 flex items-center gap-3">
            <EstadoBadge estado={proceso.estadoActual} />
            <SemaforoBadge semaforo={proceso.semaforo} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push(`/procesos/${id}/editar`)}
            className="rounded-sm border border-[#060606] bg-white px-4 py-2 text-sm font-medium text-[#060606] transition-colors hover:bg-[#060606] hover:text-white"
          >
            Editar
          </button>
          {proceso.estadoActual !== "ARCHIVADO" && (
            <button
              disabled={archiving}
              onClick={async () => {
                if (!window.confirm("¿Archivar este proceso? Esta acción cambia su estado a Archivado.")) return;
                setArchiving(true);
                try {
                  const res = await fetch(`/api/procesos/${id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ estadoActual: "ARCHIVADO" }),
                  });
                  if (res.ok) {
                    router.push("/procesos");
                    router.refresh();
                  }
                } catch {
                  setArchiving(false);
                }
              }}
              className="rounded-sm border border-[#E8E9EA] bg-white px-4 py-2 text-sm font-medium text-[#8B8C8E] transition-colors hover:border-[#8B8C8E] disabled:opacity-50"
            >
              {archiving ? "Archivando..." : "Archivar"}
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Left column */}
        <div className="space-y-6">
          {/* Card: Información del Proceso */}
          <div className="rounded-sm border border-[#E8E9EA] bg-white p-6">
            <SectionTitle title="Información del Proceso" />
            <dl className="grid grid-cols-2 gap-x-8 gap-y-5">
              <InfoField label="Radicado">
                <span className="font-mono font-bold">
                  {formatRadicado(proceso.radicado)}
                </span>
              </InfoField>
              <InfoField label="Estado actual">
                <EstadoBadge estado={proceso.estadoActual} />
              </InfoField>
              <InfoField label="Tipo de proceso">
                {TIPO_PROCESO_LABELS[proceso.tipoProceso] ?? proceso.tipoProceso}
              </InfoField>
              <InfoField label="Clase de proceso">
                {proceso.claseProceso ?? "—"}
              </InfoField>
              <InfoField label="Juzgado / Tribunal">
                {proceso.juzgado ?? "—"}
              </InfoField>
              <InfoField label="Ciudad">
                {proceso.ciudad ?? "—"}
              </InfoField>
              <InfoField label="Fecha de notificación">
                {formatDate(proceso.fechaApertura)}
              </InfoField>
              <InfoField label="Cuantía">
                {formatCurrency(proceso.cuantia)}
              </InfoField>
              <InfoField label="Demandante">
                {proceso.demandante ?? "—"}
              </InfoField>
              <InfoField label="Demandado">
                {proceso.demandado ?? "—"}
              </InfoField>
            </dl>
            {proceso.descripcion && (
              <div className="mt-5 border-t border-[#E8E9EA] pt-5">
                <InfoField label="Descripción">
                  <p className="font-normal leading-relaxed">
                    {proceso.descripcion}
                  </p>
                </InfoField>
              </div>
            )}
          </div>

          {/* Card: Hitos Procesales */}
          <HitosProcesalesSection procesoId={id} />
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Card: Partes y Asignación */}
          <div className="rounded-sm border border-[#E8E9EA] bg-white p-6">
            <SectionTitle title="Partes y Asignación" />
            <div className="space-y-5">
              {/* Cliente */}
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-[#8B8C8E]">
                  Cliente
                </p>
                <p className="mt-1 text-sm font-medium text-[#060606]">
                  {proceso.cliente.nombre}
                </p>
                {proceso.cliente.nit && (
                  <p className="mt-0.5 text-xs text-[#8B8C8E]">
                    NIT: {proceso.cliente.nit}
                  </p>
                )}
                <p className="mt-0.5 text-xs text-[#8B8C8E]">
                  {proceso.cliente.tipo.replace(/_/g, " ")}
                </p>
              </div>

              {/* Separator */}
              <div className="border-t border-[#E8E9EA]" />

              {/* Abogado Líder */}
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-[#8B8C8E]">
                  Abogado Líder
                </p>
                {abogadoLider ? (
                  <>
                    <p className="mt-1 text-sm font-medium text-[#060606]">
                      {abogadoLider.abogado.nombre}
                    </p>
                    <p className="mt-0.5 text-xs text-[#8B8C8E]">
                      {abogadoLider.abogado.rol.replace(/_/g, " ")}
                      {abogadoLider.abogado.especialidad &&
                        ` · ${abogadoLider.abogado.especialidad.replace(/_/g, " ")}`}
                    </p>
                  </>
                ) : (
                  <p className="mt-1 text-sm text-[#8B8C8E]">Sin asignar</p>
                )}
              </div>

              {/* Other assignments */}
              {otrasAsignaciones.length > 0 && (
                <>
                  <div className="border-t border-[#E8E9EA]" />
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-[#8B8C8E]">
                      Otras asignaciones
                    </p>
                    <div className="mt-2 space-y-2">
                      {otrasAsignaciones.map((a) => (
                        <div key={a.id} className="flex items-center justify-between">
                          <span className="text-sm text-[#060606]">
                            {a.abogado.nombre}
                          </span>
                          <span className="rounded-sm bg-[#FAFBFC] px-2 py-0.5 text-[11px] font-medium uppercase text-[#8B8C8E]">
                            {a.rolEnCaso}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Card: Acciones Rápidas */}
          <div className="rounded-sm border border-[#E8E9EA] bg-white p-6">
            <SectionTitle title="Acciones Rápidas" />
            <div className="space-y-2">
              {[
                { icon: ClipboardList, label: "Registrar Hito" },
                { icon: Paperclip, label: "Adjuntar Documento" },
                { icon: Calculator, label: "Calcular Indexación" },
                { icon: FileText, label: "Generar Informe" },
              ].map(({ icon: Icon, label }) => (
                <button
                  key={label}
                  className="flex w-full items-center gap-3 rounded-sm border border-[#E8E9EA] bg-white px-4 py-2.5 text-left text-sm font-medium text-[#060606] transition-colors hover:border-[#008080] hover:text-[#008080]"
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
