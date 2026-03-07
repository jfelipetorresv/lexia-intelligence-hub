"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Loader2, Upload, FileText, Sparkles, AlertTriangle,
  Save, ShieldAlert, CheckCircle, Scale,
  FolderPlus, Check, X, ArrowLeft, Search,
} from "lucide-react";
import type { DemandaExtraida } from "@/lib/ai/extractDemanda";

const formatMoneda = (valor: number | null, moneda: string = 'COP'): string => {
  if (valor === null || valor === undefined) return 'No identificado';
  if (moneda === 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(valor) + ' USD';
  }
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(valor) + ' COP';
};

type Estado = "idle" | "configuracion" | "loading" | "resultado";

type ClienteOption = { id: string; nombre: string; nit: string; tipo: string };

function NullText({ children }: { children: string | null | undefined }) {
  if (children) return <span>{children}</span>;
  return <span className="text-[#8B8C8E] italic">No identificado</span>;
}

function ImpactBadge({ impacto }: { impacto: "alto" | "medio" | "bajo" }) {
  const styles = {
    alto: "bg-red-100 text-red-700",
    medio: "bg-orange-100 text-orange-700",
    bajo: "bg-yellow-100 text-yellow-700",
  };
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase ${styles[impacto]}`}>
      {impacto}
    </span>
  );
}

function SectionCard({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-sm border border-[#E8E9EA] bg-white p-5 ${className ?? ""}`}>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#008080]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

const renderItem = (item: any): string => {
  if (typeof item === "string") return item;
  if (typeof item === "object" && item !== null) {
    return item.nombre || item.concepto || item.texto ||
           item.descripcion || JSON.stringify(item);
  }
  return String(item);
};

export default function ExtraerDemandaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const yaGuardado = searchParams.get('guardado') === 'true';
  const procesoIdGuardado = searchParams.get('procesoId');
  const tipoDocumentoParam = searchParams.get('tipoDocumento') || 'Demanda';
  const estaVinculado = !!(procesoIdGuardado || yaGuardado);
  const [estado, setEstado] = useState<Estado>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<DemandaExtraida | null>(null);
  const [textoExtraido, setTextoExtraido] = useState<string>("");
  const [toast, setToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [pasosCompletados, setPasosCompletados] = useState<Set<number>>(new Set());

  // Modal state
  const [mostrarModalGuardar, setMostrarModalGuardar] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [crearProcesoCheck, setCrearProcesoCheck] = useState(true);
  const [tipoAnalisis, setTipoAnalisis] = useState("demanda_principal");
  const [nombreAnalisis, setNombreAnalisis] = useState("");
  const [procesoIdFromAnalisis, setProcesoIdFromAnalisis] = useState<string | null>(null);

  // Configuracion state
  const [clientes, setClientes] = useState<ClienteOption[]>([]);
  const [clienteId, setClienteId] = useState('');
  const [clienteNombre, setClienteNombre] = useState('');
  const [calidadProcesal, setCalidadProcesal] = useState('');
  const [contextoAdicional, setContextoAdicional] = useState('');

  // Abogados state
  const [abogados, setAbogados] = useState<any[]>([]);
  const [abogadoLiderId, setAbogadoLiderId] = useState("");
  const [abogadoApoyoId, setAbogadoApoyoId] = useState("");
  const [mostrarAbogadoApoyo, setMostrarAbogadoApoyo] = useState(false);
  const [clienteIdGuardar, setClienteIdGuardar] = useState('');

  // Unified modal state
  const [modoGuardar, setModoGuardar] = useState<'crear' | 'vincular'>('crear');
  const [busquedaProceso, setBusquedaProceso] = useState('');
  const [todosLosProcesos, setTodosLosProcesos] = useState<any[]>([]);
  const [procesoSeleccionado, setProcesoSeleccionado] = useState<any | null>(null);
  const [cargandoProcesos, setCargandoProcesos] = useState(false);

  // Load clientes when entering configuracion
  useEffect(() => {
    if (estado === 'configuracion' && clientes.length === 0) {
      fetch('/api/clientes')
        .then(r => r.json())
        .then(data => setClientes(Array.isArray(data) ? data : []))
        .catch(() => setClientes([]));
    }
  }, [estado]);

  // Load abogados and clientes when modal opens
  useEffect(() => {
    if (mostrarModalGuardar) {
      fetch("/api/abogados")
        .then((r) => r.json())
        .then((data) => setAbogados(Array.isArray(data) ? data : data.abogados || []))
        .catch(() => setAbogados([]));
      if (clientes.length === 0) {
        fetch("/api/clientes")
          .then((r) => r.json())
          .then((data) => setClientes(Array.isArray(data) ? data : []))
          .catch(() => setClientes([]));
      }
      // Pre-select client from configuracion step
      if (clienteId && !clienteIdGuardar) setClienteIdGuardar(clienteId);
    }
  }, [mostrarModalGuardar]);

  // Load saved analysis from query param
  useEffect(() => {
    const analisisId = searchParams.get("analisisId");
    if (!analisisId) return;
    setEstado("loading");
    fetch(`/api/ai/analisis/${analisisId}`)
      .then(res => {
        if (!res.ok) throw new Error("Análisis no encontrado");
        return res.json();
      })
      .then(data => {
        setResultado(data.analisis.resultado);
        setTextoExtraido(data.analisis.contenidoRaw ?? "");
        if (data.analisis.proceso?.id) {
          setProcesoIdFromAnalisis(data.analisis.proceso.id);
        }
        setEstado("resultado");
      })
      .catch(err => {
        setError(err.message);
        setEstado("idle");
      });
  }, [searchParams]);

  const togglePaso = (index: number) => {
    setPasosCompletados(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  async function handleSubmit() {
    if (!file) return;
    setEstado("loading");
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const nombreCliente = clienteId
        ? clientes.find(c => c.id === clienteId)?.nombre || clienteNombre
        : clienteNombre;
      if (nombreCliente) form.append("clienteNombre", nombreCliente);
      if (clienteId) form.append("clienteId", clienteId);
      if (calidadProcesal) form.append("calidadProcesal", calidadProcesal);
      if (contextoAdicional) form.append("contextoAdicional", contextoAdicional);
      const res = await fetch("/api/ai/extract-demanda", { method: "POST", body: form });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? `Error ${res.status}`);
      }
      const data = await res.json();
      setResultado(data.resultado);
      setTextoExtraido(data.textoExtraido ?? "");
      setEstado("resultado");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
      setEstado("idle");
    }
  }

  function handleReset() {
    setEstado("idle");
    setFile(null);
    setResultado(null);
    setTextoExtraido("");
    setError(null);
    setPasosCompletados(new Set());
    setClienteId('');
    setClienteNombre('');
    setCalidadProcesal('');
    setContextoAdicional('');
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function handleGuardar() {
    if (!resultado) return;
    setGuardando(true);
    try {
      const res = await fetch("/api/ai/guardar-analisis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          procesoId: null,
          crearProceso: crearProcesoCheck,
          datosBasicos: {
            radicado: resultado.radicado,
            juzgado: resultado.jurisdiccionJuzgado?.juzgado,
            ciudad: resultado.jurisdiccionJuzgado?.ciudad,
            jurisdiccion: resultado.jurisdiccionJuzgado?.jurisdiccion,
          },
          textoExtraido,
          resultado,
          proximosPasos: resultado.estrategiaDefensa?.proximosPasos ?? [],
          tipoAnalisis,
          tipoDocumento: tipoDocumentoParam,
          nombreAnalisis: nombreAnalisis || undefined,
          clienteId: clienteIdGuardar || undefined,
          abogadoLiderId: abogadoLiderId || undefined,
          abogadoApoyoId: (mostrarAbogadoApoyo && abogadoApoyoId) || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? `Error ${res.status}`);
      }
      const data = await res.json();
      setMostrarModalGuardar(false);
      router.push(`/ai/extraer?analisisId=${data.analisisId}&guardado=true&procesoId=${data.procesoId}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setGuardando(false);
    }
  }

  // ─── CONFIGURACION ───
  if (estado === "configuracion") {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Sección 1: Documento seleccionado */}
        <div className="flex items-center justify-between rounded-sm border border-[#E8E9EA] bg-white px-4 py-3">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-[#008080]" />
            <div>
              <p className="text-sm font-medium text-[#060606]">{file?.name}</p>
              <p className="text-xs text-[#8B8C8E]">{file ? (file.size / 1024 / 1024).toFixed(2) + ' MB' : ''}</p>
            </div>
          </div>
          <button
            onClick={() => setEstado("idle")}
            className="text-xs text-[#8B8C8E] hover:text-[#060606] transition-colors"
          >
            Cambiar
          </button>
        </div>

        {/* Sección 2: Configurar análisis */}
        <div className="rounded-sm border border-[#E8E9EA] bg-white p-6 space-y-5">
          <div>
            <h2 className="text-base font-semibold text-[#060606]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Configurar an&aacute;lisis
            </h2>
            <p className="mt-1 text-sm text-[#8B8C8E]">
              Esta informaci&oacute;n permite al agente enfocar la estrategia defensiva
            </p>
          </div>

          {/* Campo 1: Cliente representado */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#060606]">Cliente representado</label>
            <select
              value={clienteId}
              onChange={e => {
                setClienteId(e.target.value);
                if (e.target.value) {
                  const c = clientes.find(cl => cl.id === e.target.value);
                  if (c) setClienteNombre(c.nombre);
                }
              }}
              className="w-full rounded-sm border border-[#E8E9EA] bg-white px-3 py-2 text-sm text-[#060606] focus:border-[#008080] focus:outline-none focus:ring-1 focus:ring-[#008080]"
            >
              <option value="">Selecciona el cliente...</option>
              {clientes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.nombre} ({c.tipo === 'ASEGURADORA' ? 'Aseguradora' : c.tipo === 'EMPRESA' ? 'Empresa' : 'Persona'})
                </option>
              ))}
            </select>
            <input
              type="text"
              value={clienteId ? '' : clienteNombre}
              onChange={e => { setClienteNombre(e.target.value); setClienteId(''); }}
              placeholder="ej. Seguros del Estado S.A."
              className="w-full rounded-sm border border-[#E8E9EA] bg-white px-3 py-2 text-sm text-[#060606] placeholder:text-[#8B8C8E] focus:border-[#008080] focus:outline-none focus:ring-1 focus:ring-[#008080]"
            />
            <p className="text-xs text-[#8B8C8E]">Nombre espec&iacute;fico si no est&aacute; en la lista</p>
          </div>

          {/* Campo 2: Calidad procesal */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#060606]">Calidad procesal del cliente</label>
            <select
              value={calidadProcesal}
              onChange={e => setCalidadProcesal(e.target.value)}
              className="w-full rounded-sm border border-[#E8E9EA] bg-white px-3 py-2 text-sm text-[#060606] focus:border-[#008080] focus:outline-none focus:ring-1 focus:ring-[#008080]"
            >
              <option value="">Selecciona la calidad procesal...</option>
              <option value="demandado_directo">Demandado directo</option>
              <option value="llamado_garantia">Llamado en garant&iacute;a</option>
              <option value="litisconsorcio">Litisconsorte necesario</option>
              <option value="tercero_interviniente">Tercero interviniente</option>
              <option value="reconvencionado">Demandado en reconvenci&oacute;n</option>
            </select>
          </div>

          {/* Campo 3: Contexto adicional */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#060606]">Contexto adicional <span className="font-normal text-[#8B8C8E]">(opcional)</span></label>
            <textarea
              value={contextoAdicional}
              onChange={e => {
                if (e.target.value.length <= 500) setContextoAdicional(e.target.value);
              }}
              placeholder="Describe brevemente el contexto del caso si tienes informaci&oacute;n adicional que el documento no refleja (ej. 'el contrato ya fue liquidado', 'hay una conciliaci&oacute;n previa fallida', 'el cliente es coasegurador al 50%')"
              rows={3}
              className="w-full rounded-sm border border-[#E8E9EA] bg-white px-3 py-2 text-sm text-[#060606] placeholder:text-[#8B8C8E] focus:border-[#008080] focus:outline-none focus:ring-1 focus:ring-[#008080] resize-none"
            />
            <p className="text-right text-xs text-[#8B8C8E]">{contextoAdicional.length}/500</p>
          </div>
        </div>

        {/* Sección 3: Botones */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setEstado("idle")}
            className="text-sm text-[#8B8C8E] hover:text-[#060606] transition-colors"
          >
            &larr; Cambiar documento
          </button>
          <button
            onClick={handleSubmit}
            disabled={!calidadProcesal}
            className="flex items-center gap-2 rounded-sm bg-[#008080] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#006666] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Analizar documento &rarr;
          </button>
        </div>
      </div>
    );
  }

  // ─── LOADING ───
  if (estado === "loading") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-[#008080]" />
        <p className="text-base font-medium text-[#060606]">Analizando demanda con IA...</p>
        <p className="text-sm text-[#8B8C8E]">Esto puede tomar entre 20 y 40 segundos seg&uacute;n la extensi&oacute;n del documento.</p>
      </div>
    );
  }

  // ─── RESULTADO ───
  if (estado === "resultado" && resultado) {
    const r = resultado;
    const partes = r.partes as any;
    const apoderados: any[] = partes.apoderados ?? partes.representantes ?? [];

    return (
      <div className="mx-auto max-w-6xl space-y-4 pb-12">
        {/* Back to process */}
        {(procesoIdGuardado || procesoIdFromAnalisis) && (
          <button
            onClick={() => router.push(`/procesos/${procesoIdGuardado || procesoIdFromAnalisis}`)}
            className="flex items-center gap-1 text-sm text-[#008080] hover:underline mb-4"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Volver al expediente
          </button>
        )}

        {/* Guardado badge */}
        {yaGuardado && (
          <div className="mb-4 flex items-center gap-2 rounded-sm border border-green-200 bg-green-50 px-4 py-2 text-sm font-medium text-green-700">
            <Check className="h-4 w-4" /> An&aacute;lisis guardado exitosamente
          </div>
        )}

        {/* Header */}
        <div className="flex items-center gap-3">
          <Sparkles className="h-6 w-6 text-[#008080]" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-[#060606]" style={{ fontFamily: "'DM Sans', sans-serif" }}>Ficha T&eacute;cnica de Demanda</h1>
              {yaGuardado && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#e0f2f2] px-2.5 py-0.5 text-[11px] font-semibold text-[#008080]">
                  <Check className="h-3 w-3" /> Guardado
                </span>
              )}
            </div>
            <p className="text-xs text-[#8B8C8E]">Generada autom&aacute;ticamente por IA — revise y valide la informaci&oacute;n</p>
          </div>
        </div>

        {/* ── SECCIÓN SUPERIOR — Datos del proceso ── */}

        {/* Card 1: Jurisdicción */}
        <SectionCard title="Jurisdicci&oacute;n y Juzgado">
          <div className="grid grid-cols-4 gap-x-6 gap-y-2 text-sm">
            <div><span className="font-medium text-[#8B8C8E]">Jurisdicci&oacute;n:</span> <NullText>{r.jurisdiccionJuzgado.jurisdiccion}</NullText></div>
            <div><span className="font-medium text-[#8B8C8E]">Juzgado:</span> <NullText>{r.jurisdiccionJuzgado.juzgado}</NullText></div>
            <div><span className="font-medium text-[#8B8C8E]">Ciudad:</span> <NullText>{r.jurisdiccionJuzgado.ciudad}</NullText></div>
            <div><span className="font-medium text-[#8B8C8E]">Especialidad:</span> <NullText>{r.jurisdiccionJuzgado.especialidad}</NullText></div>
          </div>
        </SectionCard>

        {/* Card 2: Radicado + Calidad vinculación */}
        <div className="grid grid-cols-2 gap-4">
          <SectionCard title="Radicado">
            <p className="text-lg font-mono font-semibold text-[#060606]"><NullText>{r.radicado}</NullText></p>
          </SectionCard>
          <SectionCard title="Calidad de vinculaci&oacute;n del cliente">
            {r.calidadVinculacionCliente.calidad ? (
              <div className="space-y-2">
                <span className="inline-block rounded-full bg-[#e0f2f2] px-3 py-1 text-sm font-semibold text-[#006666]">
                  {r.calidadVinculacionCliente.calidad}
                </span>
                {r.calidadVinculacionCliente.descripcion && (
                  <p className="text-sm text-[#060606]">{r.calidadVinculacionCliente.descripcion}</p>
                )}
              </div>
            ) : (
              <p className="text-sm italic text-[#8B8C8E]">No identificado</p>
            )}
          </SectionCard>
        </div>

        {/* Card 3: Partes */}
        <SectionCard title="Partes del proceso">
          <div className="overflow-hidden rounded-sm border border-[#E8E9EA]">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#FAFBFC]">
                  <th className="px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wider text-[#8B8C8E]">Rol</th>
                  <th className="px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wider text-[#8B8C8E]">Nombre</th>
                  <th className="px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wider text-[#8B8C8E]">Tipo</th>
                </tr>
              </thead>
              <tbody>
                {r.partes.demandantes.map((d: any, i: number) => (
                  <tr key={`dem-${i}`} className="border-t border-[#E8E9EA]">
                    <td className="px-3 py-2 font-medium text-[#060606]">Demandante</td>
                    <td className="px-3 py-2">{renderItem(d)}</td>
                    <td className="px-3 py-2 text-[#8B8C8E]">{(typeof d === "object" && d?.tipo) || "\u2014"}</td>
                  </tr>
                ))}
                {r.partes.demandados.map((d: any, i: number) => (
                  <tr key={`ddo-${i}`} className="border-t border-[#E8E9EA]">
                    <td className="px-3 py-2 font-medium text-[#060606]">Demandado</td>
                    <td className="px-3 py-2">{renderItem(d)}</td>
                    <td className="px-3 py-2 text-[#8B8C8E]">{(typeof d === "object" && d?.tipo) || "\u2014"}</td>
                  </tr>
                ))}
                {apoderados.map((d: any, i: number) => (
                  <tr key={`apo-${i}`} className="border-t border-[#E8E9EA]">
                    <td className="px-3 py-2 font-medium text-[#060606]">
                      Apoderado{d?.representa ? ` de ${renderItem(d.representa)}` : ""}
                    </td>
                    <td className="px-3 py-2">{renderItem(d)}</td>
                    <td className="px-3 py-2 text-[#8B8C8E]">{d?.tp || "\u2014"}</td>
                  </tr>
                ))}
                {r.partes.demandantes.length === 0 && r.partes.demandados.length === 0 && apoderados.length === 0 && (
                  <tr className="border-t border-[#E8E9EA]">
                    <td colSpan={3} className="px-3 py-4 text-center text-[#8B8C8E] italic">No se identificaron partes</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </SectionCard>

        {/* Card 4: Póliza + Cuantía */}
        <div className="grid grid-cols-2 gap-4">
          <SectionCard title="P&oacute;liza y ramo">
            {r.polizaRamo.hayPoliza ? (
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <div><span className="font-medium text-[#8B8C8E]">N&uacute;mero:</span> <NullText>{r.polizaRamo.numeroPoliza}</NullText></div>
                <div><span className="font-medium text-[#8B8C8E]">Aseguradora:</span> <NullText>{r.polizaRamo.aseguradora}</NullText></div>
                <div><span className="font-medium text-[#8B8C8E]">Ramo:</span> <NullText>{r.polizaRamo.ramo}</NullText></div>
                <div><span className="font-medium text-[#8B8C8E]">Cobertura:</span> <NullText>{r.polizaRamo.descripcionCobertura}</NullText></div>
              </div>
            ) : (
              <p className="text-sm italic text-[#8B8C8E]">No se identific&oacute; p&oacute;liza en el documento</p>
            )}
          </SectionCard>
          <SectionCard title="Cuant&iacute;a global">
            <p className="text-lg font-semibold text-[#060606]">
              {r.cuantiaGlobal.valor != null ? formatMoneda(r.cuantiaGlobal.valor, r.cuantiaGlobal.moneda) : <span className="text-[#8B8C8E] italic text-sm font-normal">No identificada</span>}
            </p>
            {r.cuantiaGlobal.descripcion && (
              <p className="mt-1 text-sm text-[#8B8C8E]">{r.cuantiaGlobal.descripcion}</p>
            )}
          </SectionCard>
        </div>

        {/* ── SECCIÓN DE PRETENSIONES ── */}
        <SectionCard title="Pretensiones">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase text-[#060606]">Declarativas</h4>
              {r.sintesisPretensiones.declarativas.length > 0 ? (
                <ul className="list-disc space-y-1 pl-4 text-sm text-[#060606]">
                  {r.sintesisPretensiones.declarativas.map((d, i) => <li key={i}>{renderItem(d)}</li>)}
                </ul>
              ) : (
                <p className="text-sm italic text-[#8B8C8E]">Ninguna identificada</p>
              )}
              <h4 className="mb-2 mt-4 text-xs font-semibold uppercase text-[#060606]">Condenatorias</h4>
              {r.sintesisPretensiones.condenatorias.length > 0 ? (
                <ul className="list-disc space-y-1 pl-4 text-sm text-[#060606]">
                  {r.sintesisPretensiones.condenatorias.map((d, i) => <li key={i}>{renderItem(d)}</li>)}
                </ul>
              ) : (
                <p className="text-sm italic text-[#8B8C8E]">Ninguna identificada</p>
              )}
            </div>
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase text-[#060606]">Contra el cliente</h4>
              <div className="overflow-hidden rounded-sm border border-[#E8E9EA]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#FAFBFC]">
                      <th className="px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wider text-[#8B8C8E]">Concepto</th>
                      <th className="px-3 py-2 text-right text-[11px] font-medium uppercase tracking-wider text-[#8B8C8E]">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {r.pretensionesContraCliente.detalle.map((d, i) => (
                      <tr key={i} className="border-t border-[#E8E9EA]">
                        <td className="px-3 py-2">{renderItem(d.concepto)}</td>
                        <td className="px-3 py-2 text-right font-mono">{d.valor != null ? formatMoneda(d.valor, r.pretensionesContraCliente?.moneda || 'COP') : <span className="text-[#8B8C8E] italic">Sin cuantificar</span>}</td>
                      </tr>
                    ))}
                    {r.pretensionesContraCliente.detalle.length === 0 && (
                      <tr className="border-t border-[#E8E9EA]">
                        <td colSpan={2} className="px-3 py-4 text-center text-[#8B8C8E] italic">No se identificaron pretensiones espec&iacute;ficas</td>
                      </tr>
                    )}
                    <tr className="border-t-2 border-[#060606] bg-[#FAFBFC]">
                      <td className="px-3 py-2.5 font-semibold text-[#060606]">Total pretendido</td>
                      <td className="px-3 py-2.5 text-right font-mono font-semibold text-[#060606]">
                        {r.pretensionesContraCliente.totalPretendido != null
                          ? formatMoneda(r.pretensionesContraCliente.totalPretendido, r.pretensionesContraCliente?.moneda || 'COP')
                          : <span className="text-[#8B8C8E] italic font-normal">No cuantificado</span>}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* ── SECCIÓN INFERIOR — 2 columnas ── */}
        <div className="grid grid-cols-2 gap-4">
          {/* ── COLUMNA IZQUIERDA — Análisis de la Demanda ── */}
          <div className="space-y-4">
            {/* Hechos clave */}
            <SectionCard title="Hechos clave">
              {r.hechosclave ? (
                <div className="space-y-2 text-sm leading-relaxed text-[#060606]">
                  {r.hechosclave.split("\n").filter(Boolean).map((p, i) => <p key={i}>{p}</p>)}
                </div>
              ) : (
                <p className="text-sm italic text-[#8B8C8E]">No identificados</p>
              )}
            </SectionCard>

            {/* Fortalezas */}
            <div className="rounded-sm border border-red-200 bg-[#fff5f5] p-5">
              <div className="mb-3 flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-red-600" />
                <h3 className="text-xs font-semibold uppercase tracking-widest text-red-700" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  Fortalezas de la demanda
                </h3>
              </div>
              {r.fortalezasDemanda?.resumen && (
                <p className="mb-3 rounded-sm border-l-2 border-red-300 bg-white/60 px-3 py-2 text-sm leading-relaxed text-[#060606]">
                  {r.fortalezasDemanda.resumen}
                </p>
              )}
              {(r.fortalezasDemanda?.items?.length ?? 0) > 0 ? (
                <div className="space-y-2">
                  {r.fortalezasDemanda.items.map((item, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-sm border border-red-100 bg-white/70 p-3">
                      <ImpactBadge impacto={item.impacto} />
                      <p className="flex-1 text-sm text-[#060606]">{item.descripcion}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm italic text-[#8B8C8E]">No se identificaron fortalezas</p>
              )}
            </div>

            {/* Debilidades */}
            <div className="rounded-sm border border-green-200 bg-[#f0fdf4] p-5">
              <div className="mb-3 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <h3 className="text-xs font-semibold uppercase tracking-widest text-green-700" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  Debilidades de la demanda
                </h3>
              </div>
              {r.debilidadesDemanda.resumen && (
                <p className="mb-3 rounded-sm border-l-2 border-green-300 bg-white/60 px-3 py-2 text-sm leading-relaxed text-[#060606]">
                  {r.debilidadesDemanda.resumen}
                </p>
              )}
              {r.debilidadesDemanda.items.length > 0 ? (
                <div className="space-y-2">
                  {r.debilidadesDemanda.items.map((item, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-sm border border-green-100 bg-white/70 p-3">
                      <ImpactBadge impacto={item.impacto} />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-[#060606]">{item.tipo}</p>
                        <p className="mt-0.5 text-sm text-[#8B8C8E]">{item.descripcion}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm italic text-[#8B8C8E]">No se identificaron debilidades</p>
              )}
            </div>

            {/* Fundamentos jurídicos */}
            <SectionCard title="Fundamentos jur&iacute;dicos">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="mb-2 text-xs font-semibold uppercase text-[#060606]">Normas citadas</h4>
                  {r.fundamentosJuridicos.normas.length > 0 ? (
                    <ul className="list-disc space-y-1 pl-4 text-sm text-[#060606]">
                      {r.fundamentosJuridicos.normas.map((n, i) => <li key={i}>{renderItem(n)}</li>)}
                    </ul>
                  ) : (
                    <p className="text-sm italic text-[#8B8C8E]">Ninguna identificada</p>
                  )}
                </div>
                <div>
                  <h4 className="mb-2 text-xs font-semibold uppercase text-[#060606]">Jurisprudencia</h4>
                  {r.fundamentosJuridicos.jurisprudencia.length > 0 ? (
                    <ul className="list-disc space-y-1 pl-4 text-sm text-[#060606]">
                      {r.fundamentosJuridicos.jurisprudencia.map((j, i) => <li key={i}>{renderItem(j)}</li>)}
                    </ul>
                  ) : (
                    <p className="text-sm italic text-[#8B8C8E]">Ninguna identificada</p>
                  )}
                </div>
              </div>
            </SectionCard>
          </div>

          {/* ── COLUMNA DERECHA — Estrategia de Defensa ── */}
          <div className="rounded-sm bg-[#0a1628] p-6 text-white">
            <div className="mb-6 flex items-center gap-3">
              <Scale className="h-5 w-5 text-[#008080]" />
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-widest text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  Estrategia de Defensa Preliminar
                </h3>
                <p className="text-[11px] text-gray-400">An&aacute;lisis orientativo — el abogado valida</p>
              </div>
            </div>

            {/* Resumen estratégico */}
            {r.estrategiaDefensa?.resumenEstrategico && (
              <div className="mb-5">
                <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Resumen estrat&eacute;gico</h4>
                <p className="text-sm leading-relaxed text-gray-300">{r.estrategiaDefensa.resumenEstrategico}</p>
              </div>
            )}

            {/* Líneas de defensa */}
            {(r.estrategiaDefensa?.lineasDefensa?.length ?? 0) > 0 && (
              <div className="mb-5">
                <h4 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">L&iacute;neas de defensa</h4>
                <div className="space-y-3">
                  {r.estrategiaDefensa.lineasDefensa.map((linea, i) => (
                    <div key={i} className="rounded-sm border border-gray-700 bg-[#111d33] p-3">
                      <div className="mb-1 flex items-center gap-2">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                          linea.prioridad === "principal" ? "bg-[#008080] text-white" : "bg-gray-600 text-gray-300"
                        }`}>
                          {linea.prioridad}
                        </span>
                        {linea.tipoExcepcion && (
                          <span className="text-[10px] text-gray-500">{linea.tipoExcepcion}</span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-white">{linea.titulo}</p>
                      <p className="mt-1 text-sm leading-relaxed text-gray-400">{linea.descripcion}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Advertencias */}
            {(r.estrategiaDefensa?.advertencias?.length ?? 0) > 0 && (
              <div className="mb-5 rounded-sm border border-yellow-800 bg-yellow-900/30 p-3">
                <div className="mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-yellow-500" />
                  <h4 className="text-[11px] font-semibold uppercase tracking-wider text-yellow-500">Advertencias</h4>
                </div>
                <ul className="space-y-1 pl-5 text-sm text-yellow-200">
                  {r.estrategiaDefensa.advertencias.map((adv, i) => (
                    <li key={i} className="list-disc">{adv}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Próximos pasos — checklist interactivo */}
            {(r.estrategiaDefensa?.proximosPasos?.length ?? 0) > 0 && (() => {
              const total = r.estrategiaDefensa.proximosPasos.length;
              const completados = pasosCompletados.size;
              const todosCompletos = completados >= total;
              return (
                <div className="mb-5">
                  <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Pr&oacute;ximos pasos</h4>
                  <p className={`mb-3 text-xs ${todosCompletos ? "text-[#008080] font-semibold" : "text-gray-500"}`}>
                    {todosCompletos ? "Todos los pasos completados" : `${completados} de ${total} completados`}
                  </p>
                  <div>
                    {r.estrategiaDefensa.proximosPasos.map((paso, i) => {
                      const done = pasosCompletados.has(i);
                      return (
                        <div
                          key={i}
                          onClick={() => togglePaso(i)}
                          className="mb-2 flex cursor-pointer items-start gap-3 rounded-lg px-3 py-2 transition-all duration-200 hover:bg-slate-700"
                        >
                          <div className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 ${
                            done ? "border-[#008080] bg-[#008080]" : "border-gray-500 bg-transparent"
                          }`}>
                            {done && <Check className="h-3 w-3 text-white" />}
                          </div>
                          <span className={`text-sm transition-all duration-200 ${
                            done ? "text-gray-500 line-through" : "text-white"
                          }`}>{paso}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Disclaimer */}
            <p className="mt-4 border-t border-gray-700 pt-3 text-[10px] leading-relaxed text-gray-500">
              Este an&aacute;lisis es orientativo y fue generado con IA. Debe ser revisado y validado por el abogado responsable del caso antes de tomar cualquier decisi&oacute;n procesal.
            </p>
          </div>
        </div>

        {/* ── FOOTER ── */}
        <div className="flex items-center justify-between pt-2">
          <p className="text-[11px] text-[#8B8C8E]">
            <AlertTriangle className="mr-1 inline h-3 w-3" />
            La IA propone, el abogado valida. Este an&aacute;lisis es orientativo.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 rounded-sm border border-[#E8E9EA] bg-white px-4 py-2 text-sm font-medium text-[#060606] transition-colors hover:bg-[#FAFBFC]"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Analizar otro documento
            </button>
            {(procesoIdGuardado || procesoIdFromAnalisis) && (
              <button
                onClick={() => router.push(`/procesos/${procesoIdGuardado || procesoIdFromAnalisis}`)}
                className="flex items-center gap-1.5 rounded-sm border border-[#E8E9EA] bg-white px-4 py-2 text-sm font-medium text-[#060606] transition-colors hover:bg-[#FAFBFC]"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Volver al expediente
              </button>
            )}
            <button
              onClick={() => setMostrarModalGuardar(true)}
              className="flex items-center gap-1.5 rounded-sm bg-[#008080] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#006666]"
            >
              <Save className="h-3.5 w-3.5" /> Guardar an&aacute;lisis
            </button>
          </div>
        </div>

        {/* ── MODAL UNIFICADO GUARDAR ── */}
        {mostrarModalGuardar && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-lg rounded-sm border border-[#E8E9EA] bg-white p-6 shadow-xl" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold text-[#060606]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  Guardar an&aacute;lisis
                </h2>
                <button onClick={() => setMostrarModalGuardar(false)} className="text-[#8B8C8E] hover:text-[#060606]">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Radicado badge */}
                {r.radicado && (
                  <div className="rounded-sm bg-[#FAFBFC] px-3 py-2 text-sm">
                    <span className="text-[#8B8C8E]">Radicado:</span>{" "}
                    <span className="font-mono font-medium text-[#060606]">{r.radicado}</span>
                  </div>
                )}

                {/* Nombre del archivo */}
                <div>
                  <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-[#8B8C8E]">
                    Nombre del documento
                  </label>
                  <input
                    type="text"
                    value={nombreAnalisis}
                    onChange={(e) => setNombreAnalisis(e.target.value)}
                    placeholder={`Demanda - ${r.partes?.demandantes?.[0]?.nombre ?? ''} vs ${r.partes?.demandados?.[0]?.nombre ?? ''}`}
                    className="w-full rounded-sm border border-[#E8E9EA] bg-white px-3 py-2 text-sm text-[#060606] placeholder:text-[#8B8C8E] focus:border-[#008080] focus:outline-none focus:ring-1 focus:ring-[#008080]"
                  />
                </div>

                {/* Cliente */}
                <div>
                  <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-[#8B8C8E]">
                    Cliente
                  </label>
                  <select
                    value={clienteIdGuardar}
                    onChange={(e) => setClienteIdGuardar(e.target.value)}
                    className="w-full rounded-sm border border-[#E8E9EA] bg-white px-3 py-2 text-sm text-[#060606] focus:border-[#008080] focus:outline-none focus:ring-1 focus:ring-[#008080]"
                  >
                    <option value="">Selecciona el cliente...</option>
                    {clientes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre} ({c.tipo === 'ASEGURADORA' ? 'Aseguradora' : c.tipo === 'EMPRESA' ? 'Empresa' : 'Persona'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* ── Modo selector: Crear / Vincular ── */}
                <div>
                  <label className="mb-2 block text-[11px] font-medium uppercase tracking-wide text-[#8B8C8E]">
                    &iquest;Qu&eacute; deseas hacer?
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setModoGuardar('crear')}
                      className={`rounded-sm border px-3 py-2.5 text-sm font-medium transition-colors ${
                        modoGuardar === 'crear'
                          ? 'border-[#008080] bg-[#008080]/5 text-[#006666]'
                          : 'border-[#E8E9EA] bg-white text-[#8B8C8E] hover:border-[#008080]/50'
                      }`}
                    >
                      <FolderPlus className="mb-1 inline h-4 w-4" /> Crear nuevo proceso
                    </button>
                    <button
                      onClick={() => {
                        setModoGuardar('vincular');
                        if (todosLosProcesos.length === 0) {
                          setCargandoProcesos(true);
                          fetch('/api/procesos')
                            .then(r2 => r2.json())
                            .then(data => setTodosLosProcesos(data.procesos || []))
                            .catch(() => setTodosLosProcesos([]))
                            .finally(() => setCargandoProcesos(false));
                        }
                      }}
                      className={`rounded-sm border px-3 py-2.5 text-sm font-medium transition-colors ${
                        modoGuardar === 'vincular'
                          ? 'border-[#008080] bg-[#008080]/5 text-[#006666]'
                          : 'border-[#E8E9EA] bg-white text-[#8B8C8E] hover:border-[#008080]/50'
                      }`}
                    >
                      <Scale className="mb-1 inline h-4 w-4" /> Vincular a existente
                    </button>
                  </div>
                </div>

                {/* ── Opción A: Crear nuevo expediente ── */}
                {modoGuardar === 'crear' && (
                  <div className="space-y-4 rounded-sm border border-[#E8E9EA] bg-[#FAFBFC] p-4">
                    <div>
                      <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-[#8B8C8E]">
                        Tipo de documento
                      </label>
                      <select
                        value={tipoAnalisis}
                        onChange={(e) => setTipoAnalisis(e.target.value)}
                        className="w-full rounded-sm border border-[#E8E9EA] bg-white px-3 py-2 text-sm text-[#060606] focus:border-[#008080] focus:outline-none focus:ring-1 focus:ring-[#008080]"
                      >
                        <option value="demanda_principal">Demanda principal</option>
                        <option value="llamamiento_garantia">Llamamiento en garant&iacute;a</option>
                        <option value="demanda_reconvencion">Demanda de reconvenci&oacute;n</option>
                        <option value="otro">Otro documento</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-[#8B8C8E]">
                        Abogado l&iacute;der
                      </label>
                      <select
                        value={abogadoLiderId}
                        onChange={(e) => setAbogadoLiderId(e.target.value)}
                        className="w-full rounded-sm border border-[#E8E9EA] bg-white px-3 py-2 text-sm text-[#060606] focus:border-[#008080] focus:outline-none focus:ring-1 focus:ring-[#008080]"
                      >
                        <option value="">Sin asignar</option>
                        {abogados.map((a: any) => (
                          <option key={a.id} value={a.id}>{a.nombre} — {a.rol}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="flex cursor-pointer items-center gap-2">
                        <input
                          type="checkbox"
                          checked={mostrarAbogadoApoyo}
                          onChange={(e) => {
                            setMostrarAbogadoApoyo(e.target.checked);
                            if (!e.target.checked) setAbogadoApoyoId('');
                          }}
                          className="h-4 w-4 rounded border-gray-300 text-[#008080] focus:ring-[#008080]"
                        />
                        <span className="text-sm text-[#060606]">Agregar abogado de apoyo</span>
                      </label>
                      {mostrarAbogadoApoyo && (
                        <select
                          value={abogadoApoyoId}
                          onChange={(e) => setAbogadoApoyoId(e.target.value)}
                          className="mt-2 w-full rounded-sm border border-[#E8E9EA] bg-white px-3 py-2 text-sm text-[#060606] focus:border-[#008080] focus:outline-none focus:ring-1 focus:ring-[#008080]"
                        >
                          <option value="">Seleccionar abogado...</option>
                          {abogados.map((a: any) => (
                            <option key={a.id} value={a.id}>{a.nombre} — {a.rol}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                )}

                {/* ── Opción B: Vincular a expediente existente ── */}
                {modoGuardar === 'vincular' && (() => {
                  const q = busquedaProceso.toLowerCase();
                  const procesosFiltrados = q.length >= 2
                    ? todosLosProcesos.filter((p: any) =>
                        p.radicado?.toLowerCase().includes(q) ||
                        p.demandante?.toLowerCase().includes(q) ||
                        p.demandado?.toLowerCase().includes(q)
                      )
                    : todosLosProcesos;
                  return (
                  <div className="space-y-3">
                    {procesoSeleccionado ? (
                      <div className="flex items-center justify-between rounded-lg border border-[#008080] bg-[#f0fdf9] px-3 py-2.5">
                        <span className="text-sm text-[#006666]">
                          <CheckCircle className="mr-1.5 inline h-3.5 w-3.5" />
                          <span className="font-semibold">{procesoSeleccionado.radicado}</span>
                          {' — '}
                          {procesoSeleccionado.demandante || 'N/A'} vs {procesoSeleccionado.demandado || 'N/A'}
                        </span>
                        <button
                          onClick={() => { setProcesoSeleccionado(null); setBusquedaProceso(''); }}
                          className="ml-2 text-[#8B8C8E] hover:text-[#060606]"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
                        <div className="relative flex items-center" style={{ borderBottom: '1px solid #e5e7eb' }}>
                          <Search className="absolute left-3 h-4 w-4 text-[#9ca3af]" />
                          <input
                            type="text"
                            value={busquedaProceso}
                            onChange={(e) => setBusquedaProceso(e.target.value)}
                            placeholder="Buscar por radicado o partes..."
                            className="w-full bg-white text-sm text-[#111827] placeholder:text-[#9ca3af] focus:outline-none"
                            style={{ border: 'none', fontSize: '14px', padding: '12px 14px', paddingLeft: '36px', paddingRight: '36px' }}
                          />
                          {busquedaProceso && (
                            <button
                              onClick={() => setBusquedaProceso('')}
                              className="absolute right-3 text-[#9ca3af] hover:text-[#060606]"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                        <div style={{ maxHeight: '260px', overflowY: 'auto' }}>
                          {cargandoProcesos ? (
                            <div className="flex items-center justify-center py-8">
                              <Loader2 className="h-5 w-5 animate-spin text-[#008080]" />
                            </div>
                          ) : procesosFiltrados.length === 0 ? (
                            <p className="py-8 text-center text-xs text-[#9ca3af]">
                              {busquedaProceso ? 'No se encontraron procesos con ese t\u00e9rmino' : 'No hay procesos registrados'}
                            </p>
                          ) : (
                            procesosFiltrados.map((p: any) => (
                              <button
                                key={p.id}
                                onClick={() => {
                                  setProcesoSeleccionado(p);
                                  setBusquedaProceso('');
                                }}
                                className="block w-full text-left transition-colors hover:bg-[#f0fdf9]"
                                style={{ padding: '10px 14px', borderBottom: '1px solid #f3f4f6', cursor: 'pointer' }}
                              >
                                <span className="block text-sm font-semibold text-[#111827]">{p.radicado}</span>
                                <span className="block text-[#6b7280]" style={{ fontSize: '13px' }}>
                                  {p.demandante || 'N/A'} vs. {p.demandado || 'N/A'}
                                </span>
                                <span className="block text-[#9ca3af]" style={{ fontSize: '12px' }}>
                                  {p.tipoProceso || 'Sin tipo'}{p.ciudad ? ` — ${p.ciudad}` : ''}
                                </span>
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  );
                })()}

                {/* Botón final */}
                <button
                  onClick={async () => {
                    if (modoGuardar === 'crear') {
                      handleGuardar();
                    } else {
                      if (!procesoSeleccionado) { showToast('Selecciona un expediente'); return; }
                      setGuardando(true);
                      try {
                        const res = await fetch('/api/ai/guardar-analisis', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            procesoId: procesoSeleccionado.id,
                            crearProceso: false,
                            textoExtraido,
                            resultado,
                            proximosPasos: resultado?.estrategiaDefensa?.proximosPasos ?? [],
                            tipoAnalisis: 'demanda_principal',
                            tipoDocumento: tipoDocumentoParam,
                            nombreAnalisis: nombreAnalisis || undefined,
                          }),
                        });
                        if (!res.ok) {
                          const data = await res.json().catch(() => null);
                          throw new Error(data?.error ?? 'Error al guardar');
                        }
                        const data = await res.json();
                        setMostrarModalGuardar(false);
                        router.push(`/procesos/${procesoSeleccionado.id}`);
                      } catch (err) {
                        showToast(err instanceof Error ? err.message : 'Error al vincular el documento');
                      } finally {
                        setGuardando(false);
                      }
                    }
                  }}
                  disabled={guardando || (modoGuardar === 'vincular' && !procesoSeleccionado)}
                  className="flex w-full items-center justify-center gap-2 rounded-sm bg-[#008080] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#006666] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {guardando ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Guardando...</>
                  ) : (
                    "Confirmar y guardar"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toast */}
        {toast && (
          <div className="fixed bottom-6 right-6 z-50 rounded-sm border border-[#E8E9EA] bg-white px-4 py-3 text-sm font-medium text-[#060606] shadow-lg">
            {toast}
          </div>
        )}
      </div>
    );
  }

  // ─── IDLE ───
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 text-center">
        <Sparkles className="mx-auto mb-3 h-10 w-10 text-[#008080]" />
        <h1 className="text-xl font-semibold text-[#060606]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          Analizador de Demandas IA
        </h1>
        <p className="mt-1 text-sm text-[#8B8C8E]">
          Carga el PDF de una demanda para generar la ficha t&eacute;cnica autom&aacute;ticamente
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setDragging(true); }}
        onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragging(false); }}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onDrop={(e) => {
          e.preventDefault(); e.stopPropagation(); setDragging(false);
          const f = e.dataTransfer.files[0];
          if (f?.name.toLowerCase().endsWith(".pdf")) { setFile(f); setError(null); }
          else setError("Solo se aceptan archivos PDF");
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`cursor-pointer rounded-sm border-2 border-dashed transition-colors ${
          dragging ? "border-[#008080] bg-[#008080]/10" : file ? "border-[#008080] bg-[#008080]/5" : "border-[#E8E9EA] bg-white hover:border-[#008080]/50"
        } flex flex-col items-center justify-center gap-3 px-6 py-12`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) { setFile(f); setError(null); }
            e.target.value = "";
          }}
        />
        {file ? (
          <>
            <FileText className="h-10 w-10 text-[#008080]" />
            <p className="text-sm font-medium text-[#060606]">{file.name}</p>
            <p className="text-xs text-[#8B8C8E]">{(file.size / 1024 / 1024).toFixed(2)} MB — Click para cambiar</p>
          </>
        ) : (
          <>
            <Upload className="h-10 w-10 text-[#8B8C8E]" />
            <p className="text-sm font-medium text-[#060606]">Arrastra un PDF aqu&iacute; o haz click para seleccionar</p>
            <p className="text-xs text-[#8B8C8E]">Solo archivos .pdf</p>
          </>
        )}
      </div>

      {error && (
        <div className="mt-4 rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        onClick={() => { setError(null); setEstado("configuracion"); }}
        disabled={!file}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-sm bg-[#008080] px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-[#006666] disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Sparkles className="h-4 w-4" /> Analizar documento
      </button>

      <p className="mt-6 text-center text-[11px] text-[#8B8C8E]">
        <AlertTriangle className="mr-1 inline h-3 w-3" />
        La IA propone, el abogado valida. Este an&aacute;lisis es orientativo y debe ser revisado por un profesional.
      </p>
    </div>
  );
}
