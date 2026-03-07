"use client";

import { useEffect, useState, useRef, useCallback, FormEvent } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  Calculator,
  ClipboardList,
  Plus,
  Loader2,
  X,
  FolderOpen,
  Sparkles,
  Check,
  ChevronDown,
  MessageSquare,
  StickyNote,
  Trash2,
  Pencil,
  FileDown,
  Search,
  ArrowLeftIcon,
  Building2,
  User,
  AlertTriangle,
} from "lucide-react";
import { DocumentosPanel } from "@/components/DocumentosPanel";
import { ChatIAPanel } from "@/components/procesos/ChatIAPanel";
import { CalculadoraFinanciera } from "@/components/calculos/CalculadoraFinanciera";
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

function formatearFecha(fecha: string | Date | null | undefined): string {
  if (!fecha) return "Sin fecha";
  const d = new Date(fecha);
  if (isNaN(d.getTime())) return "Sin fecha";
  return d.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatearFechaCorta(fecha: string | Date | null | undefined): string {
  if (!fecha) return "Sin fecha";
  const d = new Date(fecha);
  if (isNaN(d.getTime())) return "Sin fecha";
  return d.toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" });
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

interface TareaIA {
  id: string;
  titulo: string;
  completada: boolean;
  orden: number;
}

interface AnalisisItem {
  id: string;
  resultado: any;
  tipo: string;
  tipoDocumento: string;
  nombre: string | null;
  creadoEn: string;
}

interface AnalisisMultiData {
  analisis: AnalisisItem[];
  tareasPorAnalisis: Record<string, TareaIA[]>;
}

const TIPO_DOCUMENTO_OPTIONS = [
  "Demanda",
  "Contestación de demanda",
  "Recurso de apelación",
  "Alegatos de conclusión",
  "Sentencia",
];

const TIPO_ANALISIS_LABELS: Record<string, string> = {
  demanda_principal: "Demanda principal",
  llamamiento_garantia: "Llamamiento en garantía",
  demanda_reconvencion: "Demanda de reconvención",
  otro: "Otro documento",
};

function AnalisisIAPanel({
  analisis,
  tareas,
  onToggleTarea,
}: {
  analisis: AnalisisItem;
  tareas: TareaIA[];
  onToggleTarea: (tarea: TareaIA) => void;
}) {
  const [expandido, setExpandido] = useState(false);
  const resultado = analisis.resultado as any;
  const totalTareas = tareas.length;
  const tareasCompletadas = tareas.filter(t => t.completada).length;
  const todasCompletadas = totalTareas > 0 && tareasCompletadas === totalTareas;

  return (
    <div className="space-y-6">
      {/* TAREAS */}
      {totalTareas > 0 && (
        <div className="rounded-sm border border-[#E8E9EA] bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xs font-medium uppercase tracking-widest text-[#060606]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Pr&oacute;ximos pasos del an&aacute;lisis
            </h2>
            <span className={`text-xs ${todasCompletadas ? "font-semibold text-[#008080]" : "text-[#6b7280]"}`}>
              {todasCompletadas ? "Todos los pasos completados" : `${tareasCompletadas} de ${totalTareas} completados`}
            </span>
          </div>

          {todasCompletadas && (
            <div className="mb-4 rounded-sm border border-green-200 bg-green-50 px-4 py-2.5 text-sm text-green-700">
              Todos los pasos completados
            </div>
          )}

          <div className="space-y-2">
            {tareas.map(tarea => (
              <div
                key={tarea.id}
                onClick={() => onToggleTarea(tarea)}
                className="flex cursor-pointer items-start gap-3 rounded-lg border border-[#e5e7eb] bg-white py-3 px-4 transition-colors hover:bg-[#f0fdf9]"
              >
                <div className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 ${
                  tarea.completada ? "border-[#008080] bg-[#008080]" : "border-gray-300 bg-transparent"
                }`}>
                  {tarea.completada && <Check className="h-3 w-3 text-white" />}
                </div>
                <span className={`text-sm transition-all duration-200 ${
                  tarea.completada ? "text-[#8B8C8E] line-through" : "text-[#008080]"
                }`}>{tarea.titulo}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RESUMEN COLAPSABLE */}
      <div className="rounded-sm border border-[#E8E9EA] bg-white">
        <button
          onClick={() => setExpandido(!expandido)}
          className="flex w-full items-center justify-between bg-[#f9fafb] px-6 py-4 text-left transition-colors hover:bg-[#f3f4f6]"
        >
          <span className="text-xs font-medium uppercase tracking-widest text-[#060606]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Ver an&aacute;lisis completo
          </span>
          <ChevronDown className={`h-4 w-4 text-[#8B8C8E] transition-transform ${expandido ? "rotate-180" : ""}`} />
        </button>

        {expandido && (
          <div className="border-t border-[#E8E9EA] px-6 py-5 space-y-4">
            {resultado?.calidadVinculacionCliente?.calidad && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-[#8B8C8E]">Calidad de vinculaci&oacute;n</p>
                <span className="mt-1 inline-block rounded-full bg-[#e0f2f2] px-3 py-1 text-sm font-semibold text-[#008080]">
                  {resultado.calidadVinculacionCliente.calidad}
                </span>
              </div>
            )}

            {resultado?.cuantiaGlobal?.valor != null && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-[#8B8C8E]">Cuant&iacute;a global</p>
                <p className="mt-1 text-xl font-bold text-[#008080]">
                  {formatCurrency(String(resultado.cuantiaGlobal.valor))}
                </p>
              </div>
            )}

            {resultado?.pretensionesContraCliente?.totalPretendido != null && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-[#8B8C8E]">Total pretensiones contra el cliente</p>
                <p className="mt-1 text-xl font-bold text-[#008080]">
                  {formatCurrency(String(resultado.pretensionesContraCliente.totalPretendido))}
                </p>
              </div>
            )}

            {resultado?.estrategiaDefensa?.resumenEstrategico && (
              <div className="border-l-4 border-[#008080] bg-[#f9fafb] px-4 py-3 rounded-r">
                <p className="text-xs font-medium uppercase tracking-wide text-[#8B8C8E]">Resumen estrat&eacute;gico</p>
                <p className="mt-1 text-sm leading-relaxed text-[#060606]">{resultado.estrategiaDefensa.resumenEstrategico}</p>
              </div>
            )}

            <Link
              href={`/ai/extraer?analisisId=${analisis.id}`}
              className="text-sm font-medium text-[#008080] underline hover:text-[#006666]"
            >
              Ver ficha t&eacute;cnica completa
            </Link>
          </div>
        )}
      </div>

      {/* Fecha */}
      <p className="text-xs italic text-[#8B8C8E]">
        Análisis generado el {formatearFecha(analisis.creadoEn)}
      </p>
    </div>
  );
}

function AnalisisIASection({ procesoId }: { procesoId: string }) {
  const router = useRouter();
  const [data, setData] = useState<AnalisisMultiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeAnalisisIdx, setActiveAnalisisIdx] = useState(0);
  const [showTipoSelector, setShowTipoSelector] = useState(false);
  const [tipoDocCustom, setTipoDocCustom] = useState("");
  const [selectedTipoDoc, setSelectedTipoDoc] = useState("");

  useEffect(() => {
    async function fetchAnalisis() {
      try {
        const res = await fetch(`/api/procesos/${procesoId}/analisis`);
        if (res.ok) {
          setData(await res.json());
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    fetchAnalisis();
  }, [procesoId]);

  const toggleTarea = async (tarea: TareaIA) => {
    if (!data) return;
    const newCompletada = !tarea.completada;
    setData(prev => {
      if (!prev) return prev;
      const updated = { ...prev.tareasPorAnalisis };
      for (const key of Object.keys(updated)) {
        updated[key] = updated[key].map(t =>
          t.id === tarea.id ? { ...t, completada: newCompletada } : t
        );
      }
      return { ...prev, tareasPorAnalisis: updated };
    });
    try {
      await fetch(`/api/ai/tareas/${tarea.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completada: newCompletada }),
      });
    } catch {
      setData(prev => {
        if (!prev) return prev;
        const updated = { ...prev.tareasPorAnalisis };
        for (const key of Object.keys(updated)) {
          updated[key] = updated[key].map(t =>
            t.id === tarea.id ? { ...t, completada: !newCompletada } : t
          );
        }
        return { ...prev, tareasPorAnalisis: updated };
      });
    }
  };

  const handleNuevoAnalisis = () => {
    setShowTipoSelector(true);
    setSelectedTipoDoc("");
    setTipoDocCustom("");
  };

  const handleConfirmTipo = () => {
    const tipoDoc = selectedTipoDoc === "Otro" ? tipoDocCustom.trim() : selectedTipoDoc;
    if (!tipoDoc) return;
    const params = new URLSearchParams({ procesoId, tipoDocumento: tipoDoc });
    router.push(`/ai/extraer?${params}`);
  };

  const formatAnalisisLabel = (a: AnalisisItem) => {
    const tipoLabel = a.tipoDocumento && a.tipoDocumento !== "Demanda"
      ? a.tipoDocumento
      : a.nombre || TIPO_ANALISIS_LABELS[a.tipo] || "Demanda";
    const fecha = formatearFechaCorta(a.creadoEn);
    return { tipoLabel, fecha };
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-6 w-48 rounded bg-[#E8E9EA]" />
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 rounded bg-[#E8E9EA]" />
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.analisis.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Sparkles className="mb-3 h-10 w-10 text-[#8B8C8E]" />
        <p className="text-sm font-medium text-[#060606]">No hay análisis IA para este proceso</p>
        <p className="mt-1 text-xs text-[#8B8C8E]">Analiza un documento para generar la ficha técnica automáticamente</p>
        <button
          onClick={handleNuevoAnalisis}
          className="mt-4 flex items-center gap-2 rounded-sm bg-[#008080] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#006666]"
        >
          <Plus className="h-4 w-4" /> Nuevo análisis
        </button>

        {showTipoSelector && (
          <div className="mt-4 w-full max-w-sm rounded-sm border border-[#E8E9EA] bg-white p-4 shadow-sm">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-[#8B8C8E]">
              ¿Qué documento vas a analizar?
            </p>
            <div className="space-y-1.5">
              {TIPO_DOCUMENTO_OPTIONS.map((opt) => (
                <label key={opt} className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-[#060606] hover:bg-[#F5F5F5]">
                  <input type="radio" name="tipoDoc" checked={selectedTipoDoc === opt} onChange={() => setSelectedTipoDoc(opt)} className="h-3.5 w-3.5 text-[#008080] focus:ring-[#008080]" />
                  {opt}
                </label>
              ))}
              <label className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-[#060606] hover:bg-[#F5F5F5]">
                <input type="radio" name="tipoDoc" checked={selectedTipoDoc === "Otro"} onChange={() => setSelectedTipoDoc("Otro")} className="h-3.5 w-3.5 text-[#008080] focus:ring-[#008080]" />
                Otro
              </label>
              {selectedTipoDoc === "Otro" && (
                <input
                  value={tipoDocCustom}
                  onChange={(e) => setTipoDocCustom(e.target.value)}
                  placeholder="Describe el documento..."
                  className="mt-1 w-full rounded-sm border border-[#E8E9EA] px-3 py-1.5 text-sm focus:border-[#008080] focus:outline-none focus:ring-1 focus:ring-[#008080]"
                />
              )}
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <button onClick={() => setShowTipoSelector(false)} className="rounded-sm border border-[#E8E9EA] px-3 py-1.5 text-xs text-[#060606] hover:bg-[#FAFBFC]">Cancelar</button>
              <button
                onClick={handleConfirmTipo}
                disabled={!selectedTipoDoc || (selectedTipoDoc === "Otro" && !tipoDocCustom.trim())}
                className="rounded-sm bg-[#008080] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#006666] disabled:opacity-50"
              >
                Continuar
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  const { analisis: analisisList, tareasPorAnalisis } = data;
  const activeAnalisis = analisisList[activeAnalisisIdx];
  const activeTareas = tareasPorAnalisis[activeAnalisis.id] || [];

  return (
    <div className="space-y-4">
      {/* Header with new analysis button */}
      <div className="flex items-center justify-end relative">
        <button
          onClick={handleNuevoAnalisis}
          className="flex items-center gap-1 rounded-md border border-[#008080] bg-transparent px-3 py-1.5 text-sm text-[#008080] transition-colors hover:bg-[#008080]/10"
        >
          <Plus className="h-3.5 w-3.5" /> Nuevo análisis
        </button>

        {showTipoSelector && (
          <div className="absolute right-0 top-full z-20 mt-1 w-72 rounded-sm border border-[#E8E9EA] bg-white p-4 shadow-lg">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-[#8B8C8E]">
              ¿Qué documento vas a analizar?
            </p>
            <div className="space-y-1.5">
              {TIPO_DOCUMENTO_OPTIONS.map((opt) => (
                <label key={opt} className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-[#060606] hover:bg-[#F5F5F5]">
                  <input type="radio" name="tipoDocNuevo" checked={selectedTipoDoc === opt} onChange={() => setSelectedTipoDoc(opt)} className="h-3.5 w-3.5 text-[#008080] focus:ring-[#008080]" />
                  {opt}
                </label>
              ))}
              <label className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-[#060606] hover:bg-[#F5F5F5]">
                <input type="radio" name="tipoDocNuevo" checked={selectedTipoDoc === "Otro"} onChange={() => setSelectedTipoDoc("Otro")} className="h-3.5 w-3.5 text-[#008080] focus:ring-[#008080]" />
                Otro
              </label>
              {selectedTipoDoc === "Otro" && (
                <input
                  value={tipoDocCustom}
                  onChange={(e) => setTipoDocCustom(e.target.value)}
                  placeholder="Describe el documento..."
                  className="mt-1 w-full rounded-sm border border-[#E8E9EA] px-3 py-1.5 text-sm focus:border-[#008080] focus:outline-none focus:ring-1 focus:ring-[#008080]"
                />
              )}
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <button onClick={() => setShowTipoSelector(false)} className="rounded-sm border border-[#E8E9EA] px-3 py-1.5 text-xs text-[#060606] hover:bg-[#FAFBFC]">Cancelar</button>
              <button
                onClick={handleConfirmTipo}
                disabled={!selectedTipoDoc || (selectedTipoDoc === "Otro" && !tipoDocCustom.trim())}
                className="rounded-sm bg-[#008080] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#006666] disabled:opacity-50"
              >
                Continuar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sub-tabs if multiple analyses — show tipo + date */}
      {analisisList.length > 1 && (
        <div className="flex flex-wrap gap-0 border-b border-[#E8E9EA]">
          {analisisList.map((a, idx) => {
            const { tipoLabel, fecha } = formatAnalisisLabel(a);
            return (
              <button
                key={a.id}
                onClick={() => setActiveAnalisisIdx(idx)}
                className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm transition-colors ${
                  idx === activeAnalisisIdx
                    ? "border-[#008080] text-[#008080] font-medium"
                    : "border-transparent text-[#8B8C8E] hover:text-[#060606]"
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                <span>{tipoLabel}</span>
                <span className={`text-[10px] ${idx === activeAnalisisIdx ? "text-[#008080]/70" : "text-[#8B8C8E]"}`}>
                  · {fecha}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Active analysis header */}
      {analisisList.length === 1 && (() => {
        const { tipoLabel, fecha } = formatAnalisisLabel(analisisList[0]);
        return (
          <p className="text-xs text-[#8B8C8E]">
            Análisis — {tipoLabel} · {fecha}
          </p>
        );
      })()}

      <AnalisisIAPanel
        key={activeAnalisis.id}
        analisis={activeAnalisis}
        tareas={activeTareas}
        onToggleTarea={toggleTarea}
      />
    </div>
  );
}

interface AnotacionItem {
  id: string;
  contenido: string;
  creadoEn: string;
}

function AnotacionPanel({ procesoId }: { procesoId: string }) {
  const [anotaciones, setAnotaciones] = useState<AnotacionItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [texto, setTexto] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/procesos/${procesoId}/anotaciones`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setAnotaciones(data); })
      .catch(() => {});
  }, [procesoId]);

  const handleGuardar = async () => {
    if (!texto.trim() || saving) return;
    setSaving(true);
    try {
      if (editingId) {
        const res = await fetch(`/api/procesos/${procesoId}/anotaciones/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contenido: texto.trim() }),
        });
        const updated = await res.json();
        setAnotaciones((prev) => prev.map((a) => (a.id === editingId ? updated : a)));
      } else {
        const res = await fetch(`/api/procesos/${procesoId}/anotaciones`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contenido: texto.trim() }),
        });
        const created = await res.json();
        setAnotaciones((prev) => [created, ...prev]);
      }
      setShowForm(false);
      setEditingId(null);
      setTexto("");
    } catch (err) {
      console.error("Error guardando anotación:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleEditar = (a: AnotacionItem) => {
    setTexto(a.contenido);
    setEditingId(a.id);
    setShowForm(true);
  };

  const handleEliminar = async (id: string) => {
    try {
      await fetch(`/api/procesos/${procesoId}/anotaciones/${id}`, { method: "DELETE" });
      setAnotaciones((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error("Error eliminando anotación:", err);
    }
  };

  const handleCancelar = () => {
    setShowForm(false);
    setEditingId(null);
    setTexto("");
  };

  return (
    <div className="space-y-3">
      {!showForm && (
        <button
          onClick={() => { setTexto(""); setEditingId(null); setShowForm(true); }}
          className="flex w-full items-center gap-3 rounded-sm border border-[#E8E9EA] bg-white px-4 py-2.5 text-left text-sm font-medium text-[#060606] transition-colors hover:border-[#008080] hover:text-[#008080]"
        >
          <StickyNote className="h-4 w-4" />
          Nueva anotación
        </button>
      )}

      {showForm && (
        <div className="rounded-sm border border-[#008080]/30 bg-[#FAFBFC] p-4">
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value.slice(0, 500))}
            placeholder="Escribe una anotación..."
            rows={4}
            maxLength={500}
            className="w-full resize-none rounded-sm border border-[#E8E9EA] bg-white px-3 py-2 text-sm text-[#060606] placeholder:text-[#8B8C8E] focus:border-[#008080] focus:outline-none focus:ring-1 focus:ring-[#008080]"
          />
          <div className="mt-1 flex items-center justify-between">
            <p className="text-[11px] text-[#8B8C8E]">{texto.length}/500</p>
            <div className="flex gap-2">
              <button
                onClick={handleCancelar}
                className="rounded-sm border border-[#E8E9EA] bg-white px-3 py-1.5 text-xs text-[#060606] hover:bg-[#FAFBFC]"
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardar}
                disabled={!texto.trim() || saving}
                className="rounded-sm bg-[#008080] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#006666] disabled:opacity-50"
              >
                {saving ? "Guardando..." : editingId ? "Actualizar" : "Guardar anotación"}
              </button>
            </div>
          </div>
        </div>
      )}

      {anotaciones.map((a) => (
        <div key={a.id} className="rounded-sm border border-amber-200 bg-amber-50 p-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <StickyNote className="h-3.5 w-3.5 text-amber-600" />
              <span className="text-[11px] font-medium text-amber-700">
                {formatearFecha(a.creadoEn)}
              </span>
            </div>
            <div className="flex gap-1">
              <button onClick={() => handleEditar(a)} className="rounded-sm p-1 text-amber-600 hover:bg-amber-100" title="Editar">
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => handleEliminar(a.id)} className="rounded-sm p-1 text-amber-600 hover:bg-red-100 hover:text-red-600" title="Eliminar">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <p className="text-sm leading-relaxed text-[#060606] whitespace-pre-wrap">{a.contenido}</p>
        </div>
      ))}
    </div>
  );
}

const ESTADO_OPTIONS: { value: string; label: string; color: string; bg: string; border: string }[] = [
  { value: "TRASLADO_PREVIO", label: "Traslado Previo", color: "#8B8C8E", bg: "rgba(139,140,142,0.15)", border: "rgba(139,140,142,0.4)" },
  { value: "ACTIVO", label: "Activo", color: "#16a34a", bg: "rgba(22,163,74,0.12)", border: "rgba(22,163,74,0.4)" },
  { value: "TERMINADO", label: "Terminado", color: "#060606", bg: "rgba(6,6,6,0.08)", border: "rgba(6,6,6,0.2)" },
];

function EstadoSelector({ procesoId, estadoActual, onUpdate }: { procesoId: string; estadoActual: string; onUpdate: (estado: string) => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
  }, []);

  useEffect(() => {
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, handleClickOutside]);

  const current = ESTADO_OPTIONS.find((o) => o.value === estadoActual) ?? ESTADO_OPTIONS[1];

  const changeEstado = async (nuevoEstado: string) => {
    if (nuevoEstado === estadoActual) { setOpen(false); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/procesos/${procesoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estadoActual: nuevoEstado }),
      });
      if (res.ok) onUpdate(nuevoEstado);
    } finally {
      setSaving(false);
      setOpen(false);
    }
  };

  return (
    <div ref={ref} className="relative">
      <div className="flex items-center gap-2.5">
        <button
          onClick={() => setOpen(!open)}
          disabled={saving}
          title="Cambiar estado"
          className="inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded px-4 py-1.5 text-sm font-semibold uppercase tracking-wide ring-2 ring-current/30 ring-offset-1 transition-all hover:brightness-90 disabled:opacity-50"
          style={{ background: current.bg, color: current.color, borderColor: current.color }}
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          {saving ? "Guardando..." : current.label}
          <ChevronDown className="ml-1 h-4 w-4" />
        </button>
        <span className="text-xs text-gray-500">← clic para cambiar</span>
      </div>
      {open && (
        <div className="absolute left-0 top-full z-20 mt-1 w-44 rounded-sm border border-[#E8E9EA] bg-white shadow-lg">
          {ESTADO_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => changeEstado(opt.value)}
              className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-[#F5F5F5] ${opt.value === estadoActual ? "font-medium" : ""}`}
            >
              <span className="h-2 w-2 rounded-full" style={{ background: opt.color }} />
              {opt.label}
              {opt.value === estadoActual && <Check className="ml-auto h-3.5 w-3.5 text-[#008080]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Abogado Líder Selector ─────────────────────────────────

interface AbogadoOption {
  id: string;
  nombre: string;
  rol: string;
  especialidad: string | null;
}

function AbogadoLiderSelector({
  procesoId,
  abogadoLider,
  onUpdate,
}: {
  procesoId: string;
  abogadoLider: ProcesoDetail["asignaciones"][number] | undefined;
  onUpdate: (asignacion: ProcesoDetail["asignaciones"][number] | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [abogados, setAbogados] = useState<AbogadoOption[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const fetchAbogados = async () => {
    if (abogados.length > 0) return;
    setLoading(true);
    try {
      const res = await fetch("/api/abogados");
      const data = await res.json();
      setAbogados(Array.isArray(data) ? data : []);
    } catch {
      setAbogados([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setOpen(!open);
    if (!open) fetchAbogados();
  };

  const selectAbogado = async (abogado: AbogadoOption) => {
    setOpen(false);
    try {
      await fetch(`/api/procesos/${procesoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ abogadoLiderId: abogado.id }),
      });
      onUpdate({
        id: `asig-${abogado.id}`,
        abogadoId: abogado.id,
        rolEnCaso: "LIDER",
        fechaAsignacion: new Date(),
        activa: true,
        abogado: {
          nombre: abogado.nombre,
          rol: abogado.rol,
          especialidad: abogado.especialidad,
        },
      });
    } catch (err) {
      console.error("Error asignando abogado líder:", err);
    }
  };

  return (
    <div ref={ref} className="relative">
      <p className="text-xs font-medium uppercase tracking-wide text-[#8B8C8E]">
        Abogado Líder
      </p>
      <button
        onClick={handleOpen}
        className="mt-1 flex w-full items-center gap-2 rounded-sm px-1 py-0.5 text-left transition-colors hover:bg-[#F5F5F5]"
      >
        <User className="h-4 w-4 text-[#8B8C8E]" />
        {abogadoLider ? (
          <div>
            <p className="text-sm font-medium text-[#060606]">
              {abogadoLider.abogado.nombre}
            </p>
            <p className="text-xs text-[#8B8C8E]">
              {abogadoLider.abogado.rol.replace(/_/g, " ")}
              {abogadoLider.abogado.especialidad &&
                ` · ${abogadoLider.abogado.especialidad.replace(/_/g, " ")}`}
            </p>
          </div>
        ) : (
          <span className="text-sm text-[#8B8C8E]">Sin asignar</span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full z-20 mt-1 w-full max-h-[180px] overflow-y-auto rounded-sm border border-[#E8E9EA] bg-white shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center py-3">
              <Loader2 className="h-4 w-4 animate-spin text-[#8B8C8E]" />
            </div>
          ) : abogados.length === 0 ? (
            <p className="px-3 py-2 text-xs text-[#8B8C8E]">No hay abogados disponibles</p>
          ) : (
            abogados.map((a) => (
              <button
                key={a.id}
                onClick={() => selectAbogado(a)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[#060606] transition-colors hover:bg-gray-50"
              >
                <User className="h-3.5 w-3.5 text-[#8B8C8E]" />
                <div>
                  <span className="font-medium">{a.nombre}</span>
                  <span className="ml-1.5 text-xs text-[#8B8C8E]">
                    · {a.rol.charAt(0) + a.rol.slice(1).toLowerCase().replace(/_/g, " ")}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

interface ClienteAsignado {
  id: string;
  nombre: string;
  nit: string | null;
  tipo: string;
  plantillaInforme: string;
}

const PLANTILLAS_CON_TIPO = ["ZURICH"];
const PLANTILLAS_DISPONIBLES = ["ZURICH", "HDI", "MUNDIAL", "GENERAL"];

function getReportEndpoint(plantilla: string, formato: "pdf" | "docx") {
  if (plantilla === "HDI") return `/api/reportes/hdi/${formato}`;
  if (plantilla === "MUNDIAL") return `/api/reportes/mundial/${formato}`;
  return `/api/reportes/zurich/${formato}`;
}

function InformeButton({ procesoId, clientes }: { procesoId: string; clientes: ClienteAsignado[] }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"cliente" | "options">("cliente");
  const [selectedCliente, setSelectedCliente] = useState<ClienteAsignado | null>(null);
  const [tipo, setTipo] = useState<"INICIAL" | "INTERMEDIO">("INTERMEDIO");
  const [generating, setGenerating] = useState<"pdf" | "docx" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [extraido, setExtraido] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
  }, []);

  useEffect(() => {
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, handleClickOutside]);

  // Auto-select if single client
  const singleCliente = clientes.length === 1 ? clientes[0] : null;
  const activeCliente = singleCliente ?? selectedCliente;
  const hasTipoSelector = activeCliente && PLANTILLAS_CON_TIPO.includes(activeCliente.plantillaInforme);

  const buttonLabel = clientes.length === 0
    ? "Informe General"
    : clientes.length === 1
      ? `Informe ${clientes[0].nombre.split(" ")[0]}`
      : "Generar Informe";

  const handleOpen = () => {
    setOpen(!open);
    setError(null);
    if (clientes.length <= 1) {
      setStep("options");
      setSelectedCliente(singleCliente);
    } else {
      setStep("cliente");
      setSelectedCliente(null);
    }
  };

  const selectCliente = (c: ClienteAsignado) => {
    setSelectedCliente(c);
    setStep("options");
  };

  const download = async (formato: "pdf" | "docx") => {
    setGenerating(formato);
    setError(null);
    try {
      const plantilla = activeCliente?.plantillaInforme ?? "GENERAL";
      const endpoint = getReportEndpoint(plantilla, formato);
      const params = new URLSearchParams({ procesoId });
      if (hasTipoSelector) params.set("tipo", tipo);
      const res = await fetch(`${endpoint}?${params}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Error ${res.status}`);
      }
      const extraidoHeader = res.headers.get("X-Extraido-Documento");
      if (extraidoHeader === "true") setExtraido(true);

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const defaultName = `informe-${(activeCliente?.nombre ?? "general").toLowerCase().replace(/\s+/g, "-")}.${formato}`;
      a.download = res.headers.get("Content-Disposition")?.match(/filename="(.+)"/)?.[1] || defaultName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al generar");
    } finally {
      setGenerating(null);
    }
  };

  return (
    <div ref={ref} className="relative">
      <div className="flex items-center gap-1.5">
        {extraido && (
          <span className="text-[10px] font-medium text-[#008080]">
            ✦ Auto-completado con IA
          </span>
        )}
        <button
          onClick={handleOpen}
          className="flex items-center gap-1.5 rounded-sm bg-[#008080] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#006666]"
        >
          <FileDown className="h-4 w-4" />
          {buttonLabel}
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </div>
      {open && (
        <div className="absolute right-0 top-full z-20 mt-1 w-64 rounded-sm border border-[#E8E9EA] bg-white shadow-lg">
          {/* Step 1: Client selector (only for multiple clients) */}
          {step === "cliente" && clientes.length > 1 && (
            <div className="px-1 py-1">
              <p className="px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-[#8B8C8E]">
                Selecciona el cliente
              </p>
              {clientes.map((c) => (
                <button
                  key={c.id}
                  onClick={() => selectCliente(c)}
                  className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm text-[#060606] hover:bg-[#F5F5F5]"
                >
                  <Building2 className="h-4 w-4 text-[#8B8C8E]" />
                  <span className="truncate">{c.nombre}</span>
                </button>
              ))}
            </div>
          )}

          {/* Step 2: Options */}
          {step === "options" && (
            <>
              {/* Back button for multi-client */}
              {clientes.length > 1 && (
                <div className="border-b border-[#E8E9EA] px-2 py-1">
                  <button
                    onClick={() => { setStep("cliente"); setSelectedCliente(null); }}
                    className="flex items-center gap-1.5 rounded-sm px-2 py-1.5 text-xs text-[#8B8C8E] hover:text-[#060606]"
                  >
                    <ArrowLeftIcon className="h-3 w-3" />
                    Volver — {activeCliente?.nombre}
                  </button>
                </div>
              )}

              {/* Tipo selector (for templates that support it) */}
              {hasTipoSelector && (
                <div className="border-b border-[#E8E9EA] px-4 py-2.5">
                  <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-[#8B8C8E]">
                    Tipo de informe
                  </p>
                  <label className="flex cursor-pointer items-center gap-2 py-0.5 text-sm text-[#060606]">
                    <input type="radio" name="tipo" checked={tipo === "INICIAL"} onChange={() => setTipo("INICIAL")} className="h-3.5 w-3.5 text-[#008080] focus:ring-[#008080]" />
                    Informe Inicial
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 py-0.5 text-sm text-[#060606]">
                    <input type="radio" name="tipo" checked={tipo === "INTERMEDIO"} onChange={() => setTipo("INTERMEDIO")} className="h-3.5 w-3.5 text-[#008080] focus:ring-[#008080]" />
                    Informe Intermedio
                  </label>
                </div>
              )}

              {/* Format buttons or placeholder */}
              {PLANTILLAS_DISPONIBLES.includes(activeCliente?.plantillaInforme ?? "GENERAL") ? (
                <div className="px-1 py-1">
                  <button
                    disabled={generating !== null}
                    onClick={() => download("pdf")}
                    className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm text-[#060606] hover:bg-[#F5F5F5] disabled:opacity-50"
                  >
                    {generating === "pdf" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4 text-red-500" />}
                    {generating === "pdf" ? "Generando..." : "Descargar PDF"}
                  </button>
                  <button
                    disabled={generating !== null}
                    onClick={() => download("docx")}
                    className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm text-[#060606] hover:bg-[#F5F5F5] disabled:opacity-50"
                  >
                    {generating === "docx" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4 text-blue-500" />}
                    {generating === "docx" ? "Generando..." : "Descargar Word"}
                  </button>
                </div>
              ) : (
                <div className="px-4 py-3 text-center text-sm text-[#8B8C8E]">
                  Template en desarrollo — Proximamente
                </div>
              )}
            </>
          )}

          {error && (
            <div className="border-t border-[#E8E9EA] px-4 py-2 text-xs text-red-600">
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ClientesAsignados({ procesoId, onClientesChange }: { procesoId: string; onClientesChange: (c: ClienteAsignado[]) => void }) {
  const [clientes, setClientes] = useState<ClienteAsignado[]>([]);
  const [loading, setLoading] = useState(true);
  const [mostrarDropdown, setMostrarDropdown] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState<ClienteAsignado[]>([]);
  const [cargando, setCargando] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const clientesRef = useRef<ClienteAsignado[]>([]);

  // Keep ref in sync so fetch functions always see latest assigned clients
  clientesRef.current = clientes;

  // 1. Load assigned clients on mount
  const cargarAsignados = async () => {
    try {
      const res = await fetch(`/api/procesos/${procesoId}/clientes`);
      if (res.ok) {
        const data = await res.json();
        setClientes(data);
        clientesRef.current = data;
        onClientesChange(data);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => { cargarAsignados(); }, [procesoId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Imperative fetch — no useCallback, no stale closures
  const cargarClientes = async (texto: string) => {
    const url = `/api/clientes?search=${encodeURIComponent(texto)}`;
    console.log('🔍 Fetching clientes con search:', texto);
    console.log("[ClientesAsignados] Fetching:", url);
    setCargando(true);
    try {
      const res = await fetch(url);
      const data = await res.json();
      console.log('✅ Clientes recibidos:', data);
      console.log("[ClientesAsignados] Resultado:", data.length, "clientes");
      const asignadosIds = new Set(clientesRef.current.map((c) => c.id));
      setResultados(Array.isArray(data) ? data.filter((c: ClienteAsignado) => !asignadosIds.has(c.id)) : []);
    } catch (e) {
      console.error("[ClientesAsignados] Error:", e);
      setResultados([]);
    } finally {
      setCargando(false);
    }
  };

  // When dropdown opens → fetch immediately
  const abrirDropdown = () => {
    setMostrarDropdown(true);
    setBusqueda("");
    setResultados([]);
    cargarClientes("");
  };

  // When user types → debounced fetch
  useEffect(() => {
    if (!mostrarDropdown || busqueda === "") return;
    const timer = setTimeout(() => cargarClientes(busqueda), 300);
    return () => clearTimeout(timer);
  }, [busqueda]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close on click outside
  useEffect(() => {
    if (!mostrarDropdown) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setMostrarDropdown(false);
        setBusqueda("");
        setResultados([]);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [mostrarDropdown]);

  // Auto-focus input
  useEffect(() => {
    if (mostrarDropdown && inputRef.current) inputRef.current.focus();
  }, [mostrarDropdown]);

  // 5. Add client
  const agregarCliente = async (clienteId: string) => {
    await fetch(`/api/procesos/${procesoId}/clientes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clienteId }),
    });
    setMostrarDropdown(false);
    setBusqueda("");
    setResultados([]);
    cargarAsignados();
  };

  // 6. Remove client
  const quitarCliente = async (clienteId: string) => {
    await fetch(`/api/procesos/${procesoId}/clientes`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clienteId }),
    });
    cargarAsignados();
  };

  if (loading) {
    return (
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-[#8B8C8E]">Clientes Asignados</p>
        <div className="mt-2 h-6 w-32 animate-pulse rounded bg-[#E8E9EA]" />
      </div>
    );
  }

  const displayClientes = showAll ? clientes : clientes.slice(0, 3);
  const hiddenCount = clientes.length - 3;

  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-[#8B8C8E]">
        Clientes Asignados
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {displayClientes.map((c) => (
          <span
            key={c.id}
            className="inline-flex items-center gap-1 rounded-sm bg-[#F5F5F5] px-2 py-1 text-xs font-medium text-[#060606]"
          >
            {c.nombre.length > 25 ? c.nombre.slice(0, 25) + "…" : c.nombre}
            <button
              onClick={() => quitarCliente(c.id)}
              className="ml-0.5 text-[#8B8C8E] hover:text-red-500"
              title="Desvincular cliente"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        {!showAll && hiddenCount > 0 && (
          <button
            onClick={() => setShowAll(true)}
            className="rounded-sm bg-[#E8E9EA] px-2 py-1 text-xs font-medium text-[#8B8C8E] hover:text-[#060606]"
          >
            +{hiddenCount} más
          </button>
        )}
        {showAll && clientes.length > 3 && (
          <button
            onClick={() => setShowAll(false)}
            className="rounded-sm bg-[#E8E9EA] px-2 py-1 text-xs font-medium text-[#8B8C8E] hover:text-[#060606]"
          >
            Ver menos
          </button>
        )}
      </div>

      {/* Add client dropdown */}
      <div ref={dropdownRef} className="relative mt-2">
        {!mostrarDropdown ? (
          <button
            onClick={abrirDropdown}
            className="flex items-center gap-1.5 text-xs font-medium text-[#008080] hover:underline"
          >
            <Plus className="h-3.5 w-3.5" />
            Agregar cliente
          </button>
        ) : (
          <div>
            <div className="flex items-center gap-1.5 rounded-sm border border-[#008080] bg-white px-2 py-1.5">
              <Search className="h-3.5 w-3.5 text-[#8B8C8E]" />
              <input
                ref={inputRef}
                type="text"
                value={busqueda}
                onChange={(e) => {
                  const val = e.target.value;
                  setBusqueda(val);
                  if (val === "") cargarClientes("");
                }}
                placeholder="Buscar cliente..."
                className="flex-1 bg-transparent text-xs text-[#060606] outline-none placeholder:text-[#8B8C8E]"
              />
              {cargando && <Loader2 className="h-3.5 w-3.5 animate-spin text-[#8B8C8E]" />}
            </div>
            <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-[200px] overflow-y-auto rounded-sm border border-[#E8E9EA] bg-white shadow-lg">
              {cargando && resultados.length === 0 && (
                <div className="flex items-center justify-center px-3 py-3">
                  <Loader2 className="h-4 w-4 animate-spin text-[#8B8C8E]" />
                </div>
              )}
              {resultados.map((c) => (
                <button
                  key={c.id}
                  onClick={() => agregarCliente(c.id)}
                  className="flex w-full cursor-pointer items-center justify-between px-3 py-2 text-left text-xs text-[#060606] hover:bg-[#F5F5F5]"
                >
                  <div className="flex items-center gap-2">
                    <Building2 className="h-3.5 w-3.5 text-[#8B8C8E]" />
                    <span className="font-medium">{c.nombre}</span>
                  </div>
                  <span className="ml-2 shrink-0 rounded bg-[#F0F0F0] px-1.5 py-0.5 text-[10px] font-medium text-[#8B8C8E]">{c.plantillaInforme}</span>
                </button>
              ))}
              {!cargando && resultados.length === 0 && (
                <div className="px-3 py-2 text-xs text-[#8B8C8E]">
                  {busqueda.trim() ? "Sin resultados" : "No hay clientes disponibles"}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {clientes.length === 0 && !mostrarDropdown && (
        <p className="mt-1 text-xs text-[#8B8C8E]">Sin clientes asignados</p>
      )}
    </div>
  );
}

export default function ProcesoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id as string;

  const [proceso, setProceso] = useState<ProcesoDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [clientesAsignados, setClientesAsignados] = useState<ClienteAsignado[]>([]);
  const [modalEliminar, setModalEliminar] = useState<"cerrado" | "paso1" | "paso2">("cerrado");
  const [inputConfirmacion, setInputConfirmacion] = useState("");

  const tabParam = searchParams.get('tab');
  const initialTab = tabParam === 'analisis' ? 'analisis-ia' as const
    : tabParam === 'documentos' ? 'documentos' as const
    : tabParam === 'calculadora' ? 'calculadora' as const
    : 'detalle' as const;
  const [activeTab, setActiveTab] = useState<"detalle" | "documentos" | "analisis-ia" | "calculadora">(initialTab);

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
            <EstadoSelector
              procesoId={id}
              estadoActual={proceso.estadoActual}
              onUpdate={(estado) => setProceso((p) => p ? { ...p, estadoActual: estado as typeof p.estadoActual } : p)}
            />
            <SemaforoBadge semaforo={proceso.semaforo} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <InformeButton procesoId={id} clientes={clientesAsignados} />
          <button
            onClick={() => router.push(`/procesos/${id}/editar`)}
            className="rounded-sm border border-[#060606] bg-white px-4 py-2 text-sm font-medium text-[#060606] transition-colors hover:bg-[#060606] hover:text-white"
          >
            Editar
          </button>
          <button
            onClick={() => { setModalEliminar("paso1"); setInputConfirmacion(""); }}
            className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-500 transition-colors hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
            Eliminar
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-0 border-b border-[#E8E9EA]">
        {([
          { key: "detalle" as const, label: "Detalle", icon: ClipboardList },
          { key: "documentos" as const, label: "Documentos", icon: FolderOpen },
          { key: "analisis-ia" as const, label: "An\u00e1lisis IA", icon: Sparkles },
          { key: "calculadora" as const, label: "Calculadora", icon: Calculator },
        ]).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === key
                ? "border-[#008080] text-[#008080]"
                : "border-transparent text-[#8B8C8E] hover:text-[#060606]"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab: Documentos */}
      {activeTab === "documentos" && (
        <DocumentosPanel
          key={id}
          procesoId={id}
          onedriveFolderPath={proceso.onedriveFolderPath}
        />
      )}

      {/* Tab: Análisis IA */}
      {activeTab === "analisis-ia" && (
        <AnalisisIASection procesoId={id} />
      )}

      {/* Tab: Calculadora */}
      {activeTab === "calculadora" && (
        <CalculadoraFinanciera procesoId={id} />
      )}

      {/* Tab: Detalle */}
      {activeTab === "detalle" && (
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
              {/* Clientes Asignados */}
              <ClientesAsignados procesoId={id} onClientesChange={setClientesAsignados} />

              {/* Separator */}
              <div className="border-t border-[#E8E9EA]" />

              {/* Abogado Líder */}
              <AbogadoLiderSelector
                procesoId={id}
                abogadoLider={abogadoLider}
                onUpdate={(asignacion) => setProceso((p) => {
                  if (!p) return p;
                  const otras = p.asignaciones.filter((a) => !(a.rolEnCaso === "LIDER" && a.activa));
                  return { ...p, asignaciones: asignacion ? [...otras, asignacion] : otras };
                })}
              />

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

          {/* Card: Anotación */}
          <AnotacionPanel procesoId={id} />
        </div>
      </div>
      )}

      {/* Modal Eliminar Proceso */}
      {modalEliminar !== "cerrado" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            {modalEliminar === "paso1" ? (
              <>
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                  <AlertTriangle className="h-6 w-6 text-red-500" />
                </div>
                <h3 className="mb-2 text-center text-lg font-semibold text-[#060606]">
                  ¿Eliminar este proceso?
                </h3>
                <p className="mb-4 text-center text-sm text-[#8B8C8E]">
                  Esta acción no se puede deshacer. Se eliminarán todos los hitos, anotaciones y documentos asociados.
                </p>
                <div className="mb-6 flex justify-center">
                  <span className="rounded bg-[#F5F5F5] px-3 py-1 font-mono text-sm text-[#060606]">
                    {proceso.radicado}
                  </span>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setModalEliminar("cerrado")}
                    className="flex-1 rounded-lg border border-[#E8E9EA] px-4 py-2.5 text-sm font-medium text-[#060606] transition-colors hover:bg-[#FAFBFC]"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => setModalEliminar("paso2")}
                    className="flex-1 rounded-lg bg-red-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-600"
                  >
                    Continuar →
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                  <Trash2 className="h-6 w-6 text-red-500" />
                </div>
                <h3 className="mb-2 text-center text-lg font-semibold text-[#060606]">
                  Confirma la eliminación
                </h3>
                <p className="mb-4 text-center text-sm text-red-500">
                  Escribe el radicado del proceso para confirmar:
                </p>
                <div className="mb-2 flex justify-center">
                  <span className="rounded bg-[#F5F5F5] px-3 py-1 font-mono text-xs text-[#8B8C8E]">
                    {proceso.radicado}
                  </span>
                </div>
                <input
                  type="text"
                  value={inputConfirmacion}
                  onChange={(e) => setInputConfirmacion(e.target.value)}
                  placeholder="Escribe el radicado aquí..."
                  className="mb-4 w-full rounded-lg border border-[#E8E9EA] px-3 py-2.5 font-mono text-sm text-[#060606] placeholder:text-[#8B8C8E] focus:border-red-300 focus:outline-none focus:ring-1 focus:ring-red-300"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => { setModalEliminar("paso1"); setInputConfirmacion(""); }}
                    className="flex-1 rounded-lg border border-[#E8E9EA] px-4 py-2.5 text-sm font-medium text-[#060606] transition-colors hover:bg-[#FAFBFC]"
                  >
                    Cancelar
                  </button>
                  <button
                    disabled={inputConfirmacion !== proceso.radicado}
                    onClick={async () => {
                      try {
                        const res = await fetch(`/api/procesos/${id}`, { method: "DELETE" });
                        const data = await res.json();
                        if (data.ok) {
                          router.push("/procesos");
                        } else {
                          alert(data.error || "Error al eliminar el proceso");
                          setModalEliminar("cerrado");
                        }
                      } catch {
                        alert("Error de conexión al eliminar el proceso");
                        setModalEliminar("cerrado");
                      }
                    }}
                    className="flex-1 rounded-lg bg-red-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Eliminar definitivamente
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Chat IA - Backdrop */}
      <div
        className={`fixed inset-0 bg-black/20 z-40 transition-opacity ${chatOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setChatOpen(false)}
      />

      {/* Chat IA - Floating Button */}
      <button
        onClick={() => setChatOpen(!chatOpen)}
        title="Asistente IA"
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#008080] text-white shadow-lg transition-colors hover:bg-[#006666]"
      >
        {chatOpen ? <X className="h-[22px] w-[22px]" /> : <MessageSquare className="h-[22px] w-[22px]" />}
      </button>

      {/* Chat IA - Panel */}
      <ChatIAPanel procesoId={proceso.id} isOpen={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
}
