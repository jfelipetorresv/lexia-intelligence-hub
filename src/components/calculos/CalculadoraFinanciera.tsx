"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Trash2, Plus, X, ChevronDown } from "lucide-react";
import {
  calcularIndexacion,
  calcularLucroCesanteConsolidado,
  calcularLucroCesanteFuturo,
  calcularPerjuiciosMoralesCivil,
  calcularPerjuiciosMoralesContencioso,
  calcularInteresMoratorio,
  calcularInteresMoratorioComercial,
  calcularMesesEntreFechas,
  getSMMLV,
  getAuxilioTransporte,
  getAniosAuxilioTransporte,
} from "@/lib/calculosFinancieros";

// ════════════════════════════════════════════════════════════
// TYPES & CONSTANTS
// ════════════════════════════════════════════════════════════

type Jurisdiccion = "CIVIL" | "CONTENCIOSO" | "LABORAL";

type TipoRubro =
  // Materiales (todas las jurisdicciones)
  | "DAÑO_EMERGENTE"
  | "INDEXACION"
  | "LUCRO_CESANTE_CONSOLIDADO"
  | "LUCRO_CESANTE_FUTURO"
  | "INTERESES_MORA_CIVIL"
  | "INTERESES_MORA_COMERCIAL"
  // Inmateriales — Civil
  | "DAÑO_MORAL_CIVIL"
  | "VIDA_DE_RELACION"
  | "DAÑO_A_LA_SALUD_CIVIL"
  | "BIENES_PERSONALISIMOS_CIVIL"
  // Inmateriales — CE
  | "DAÑO_MORAL_CE"
  | "DAÑO_A_LA_SALUD_CE"
  | "BIENES_CONSTITUCIONALES_CE"
  // Inmateriales — Laboral
  | "DAÑO_MORAL_LABORAL"
  | "VIDA_DE_RELACION_LABORAL"
  | "DAÑO_A_LA_SALUD_LABORAL";

const JURISDICCION_LABELS: Record<Jurisdiccion, { nombre: string; detalle: string }> = {
  CIVIL: { nombre: "Civil", detalle: "Sala Civil CSJ (SC072-2025)" },
  CONTENCIOSO: { nombre: "Contencioso Administrativo", detalle: "Consejo de Estado Sección 3ª (SU 28 ago 2014)" },
  LABORAL: { nombre: "Laboral", detalle: "Sala Laboral CSJ (Art. 216 CST)" },
};

const RUBRO_LABELS: Record<TipoRubro, string> = {
  DAÑO_EMERGENTE: "Daño emergente",
  INDEXACION: "Indexación IPC",
  LUCRO_CESANTE_CONSOLIDADO: "Lucro cesante consolidado",
  LUCRO_CESANTE_FUTURO: "Lucro cesante futuro",
  INTERESES_MORA_CIVIL: "Intereses de mora (Civil)",
  INTERESES_MORA_COMERCIAL: "Intereses de mora (Comercial)",
  DAÑO_MORAL_CIVIL: "Daño moral (Civil)",
  VIDA_DE_RELACION: "Vida de relación",
  DAÑO_A_LA_SALUD_CIVIL: "Daño a la salud (Civil)",
  BIENES_PERSONALISIMOS_CIVIL: "Bienes personalísimos",
  DAÑO_MORAL_CE: "Daño moral (CE)",
  DAÑO_A_LA_SALUD_CE: "Daño a la salud (CE)",
  BIENES_CONSTITUCIONALES_CE: "Bienes constitucionales",
  DAÑO_MORAL_LABORAL: "Daño moral (Laboral)",
  VIDA_DE_RELACION_LABORAL: "Vida de relación (Laboral)",
  DAÑO_A_LA_SALUD_LABORAL: "Daño a la salud (Laboral)",
};

const RUBRO_FUENTES: Record<TipoRubro, string> = {
  DAÑO_EMERGENTE: "Perjuicio material directo — prueba documental",
  INDEXACION: "Va = Vh × (IPC_f / IPC_i)",
  LUCRO_CESANTE_CONSOLIDADO: "LCC = Ra × [(1+i)^n − 1] / i — i=0.004867 mensual",
  LUCRO_CESANTE_FUTURO: "LCF = Ra × [(1+i)^n − 1] / [i×(1+i)^n] — i=0.004867",
  INTERESES_MORA_CIVIL: "6% anual — Art. 1617 Código Civil",
  INTERESES_MORA_COMERCIAL: "1.5× interés bancario corriente — Art. 884 C.Co.",
  DAÑO_MORAL_CIVIL: "Daño moral — SC072-2025 CSJ Sala Civil, M.P. Tejeiro Duque",
  VIDA_DE_RELACION: "Daño a la vida de relación — SC072-2025 CSJ Sala Civil",
  DAÑO_A_LA_SALUD_CIVIL: "Daño a la salud — SC072-2025 CSJ Sala Civil",
  BIENES_PERSONALISIMOS_CIVIL: "Bienes personalísimos — SC072-2025 CSJ Sala Civil",
  DAÑO_MORAL_CE: "Daño moral — CE Sección Tercera, SU 28 ago 2014",
  DAÑO_A_LA_SALUD_CE: "Daño a la salud — CE Sección Tercera, exps. 19031 y 38222",
  BIENES_CONSTITUCIONALES_CE: "Afectación bienes constitucionales — SU CE 2014",
  DAÑO_MORAL_LABORAL: "Daño moral — Sala Laboral CSJ, Art. 216 CST",
  VIDA_DE_RELACION_LABORAL: "Daño a la vida de relación — Sala Laboral CSJ",
  DAÑO_A_LA_SALUD_LABORAL: "Daño a la salud — Sala Laboral CSJ",
};

// Rubros materiales — disponibles en todas las jurisdicciones
const RUBROS_MATERIALES: TipoRubro[] = [
  "DAÑO_EMERGENTE",
  "INDEXACION",
  "LUCRO_CESANTE_CONSOLIDADO",
  "LUCRO_CESANTE_FUTURO",
  "INTERESES_MORA_CIVIL",
  "INTERESES_MORA_COMERCIAL",
];

const RUBROS_INMATERIALES: Record<Jurisdiccion, TipoRubro[]> = {
  CIVIL: ["DAÑO_MORAL_CIVIL", "VIDA_DE_RELACION", "DAÑO_A_LA_SALUD_CIVIL", "BIENES_PERSONALISIMOS_CIVIL"],
  CONTENCIOSO: ["DAÑO_MORAL_CE", "DAÑO_A_LA_SALUD_CE", "BIENES_CONSTITUCIONALES_CE"],
  LABORAL: ["DAÑO_MORAL_LABORAL", "VIDA_DE_RELACION_LABORAL", "DAÑO_A_LA_SALUD_LABORAL"],
};

// Topes SMMLV — Civil SC072-2025
const TOPES_CIVIL: Record<number, number> = { 1: 100, 2: 70, 3: 50, 4: 35, 5: 15 };
// Topes SMMLV — CE SU 2014
const TOPES_CE: Record<number, number> = { 1: 100, 2: 50, 3: 35, 4: 25, 5: 15 };

// ────────────────────────────────────────────────────────────

interface RubroAgregado {
  id: string;
  tipo: TipoRubro;
  label: string;
  valor: number;
  parametros: Record<string, unknown>;
  fuente: string;
}

interface CalculoGuardado {
  id: string;
  tipoCalculo: string;
  nombre: string;
  parametros: Record<string, unknown>;
  resultado: Record<string, unknown>;
  totalCalculado: number;
  notas: string | null;
  creadoEn: string;
}

interface GrupoLiquidacion {
  nombre: string;
  fecha: string;
  rubros: CalculoGuardado[];
  total: number;
}

interface FormState {
  descripcion: string;
  valor: string;
  valorHistorico: string;
  ipcInicial: string;
  ipcFinal: string;
  requiereIndexacion: boolean;
  rentaMensual: string;
  aplicaPrestaciones: boolean;
  porcentajeAplicacion: string;
  fechaInicio: string;
  fechaFin: string;
  capital: string;
  fechaInicioMora: string;
  fechaFinMora: string;
  tasaBancaria: string;
  anioSmmlv: string;
  nivelCercania: string;
  porcentajeJuez: string;
  graveDDHH: boolean;
  pclPorcentaje: string;
  casoExcepcional: boolean;
  valorSMMLV: string;
  incluyeAuxTransporte: boolean;
  anioAuxTransporte: string;
}

// ════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════

const formatCOP = (v: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(v);

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });

function diasEntre(a: string, b: string): number {
  return Math.max(0, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000));
}

interface SmmlvDB {
  anio: number;
  valor: number;
  decreto: string | null;
}

// Fallback hardcoded years if API fails
const ANIOS_SMMLV_FALLBACK = [2020, 2021, 2022, 2023, 2024, 2025, 2026];

function resolveSmmlvFromList(anio: string, lista: SmmlvDB[]): number {
  const found = lista.find((s) => s.anio === parseInt(anio));
  if (found) return found.valor;
  try {
    return getSMMLV(parseInt(anio));
  } catch {
    return 0;
  }
}

function resolveDecretoFromList(anio: string, lista: SmmlvDB[]): string | null {
  const found = lista.find((s) => s.anio === parseInt(anio));
  return found?.decreto || null;
}

const INITIAL_FORM: FormState = {
  descripcion: "",
  valor: "",
  valorHistorico: "",
  ipcInicial: "",
  ipcFinal: "",
  requiereIndexacion: false,
  rentaMensual: "",
  aplicaPrestaciones: false,
  porcentajeAplicacion: "",
  fechaInicio: "",
  fechaFin: "",
  capital: "",
  fechaInicioMora: "",
  fechaFinMora: "",
  tasaBancaria: "",
  anioSmmlv: String(new Date().getFullYear()),
  nivelCercania: "1",
  porcentajeJuez: "100",
  graveDDHH: false,
  pclPorcentaje: "",
  casoExcepcional: false,
  valorSMMLV: "",
  incluyeAuxTransporte: false,
  anioAuxTransporte: String(new Date().getFullYear()),
};

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

// ── Compute rubro value from form ─────────────────────────

function computeRubroValue(tipo: TipoRubro, f: FormState, smmlvList: SmmlvDB[]): number | null {
  switch (tipo) {
    case "DAÑO_EMERGENTE": {
      const v = parseFloat(f.valor);
      if (!v) return null;
      if (f.requiereIndexacion) {
        const ii = parseFloat(f.ipcInicial);
        const if_ = parseFloat(f.ipcFinal);
        if (!ii || !if_) return null;
        return calcularIndexacion(v, ii, if_).valorActualizado;
      }
      return v;
    }
    case "INDEXACION": {
      const vh = parseFloat(f.valorHistorico);
      const ii = parseFloat(f.ipcInicial);
      const if_ = parseFloat(f.ipcFinal);
      if (!vh || !ii || !if_) return null;
      return calcularIndexacion(vh, ii, if_).valorActualizado;
    }
    case "LUCRO_CESANTE_CONSOLIDADO": {
      const rm = parseFloat(f.rentaMensual);
      const pa = parseFloat(f.porcentajeAplicacion) / 100;
      if (!rm || !pa || !f.fechaInicio || !f.fechaFin) return null;
      const meses = calcularMesesEntreFechas(new Date(f.fechaInicio), new Date(f.fechaFin));
      if (meses <= 0) return null;
      const aux = f.incluyeAuxTransporte ? (() => { try { return getAuxilioTransporte(parseInt(f.anioAuxTransporte)); } catch { return 0; } })() : 0;
      return calcularLucroCesanteConsolidado(rm, f.aplicaPrestaciones ? 0.25 : 0, pa, meses, aux).valorActual;
    }
    case "LUCRO_CESANTE_FUTURO": {
      const rm = parseFloat(f.rentaMensual);
      const pa = parseFloat(f.porcentajeAplicacion) / 100;
      if (!rm || !pa || !f.fechaInicio || !f.fechaFin) return null;
      const meses = calcularMesesEntreFechas(new Date(f.fechaInicio), new Date(f.fechaFin));
      if (meses <= 0) return null;
      const aux = f.incluyeAuxTransporte ? (() => { try { return getAuxilioTransporte(parseInt(f.anioAuxTransporte)); } catch { return 0; } })() : 0;
      return calcularLucroCesanteFuturo(rm, f.aplicaPrestaciones ? 0.25 : 0, pa, meses, aux).valorActual;
    }
    case "INTERESES_MORA_CIVIL": {
      const c = parseFloat(f.capital);
      if (!c || !f.fechaInicioMora || !f.fechaFinMora) return null;
      const dias = diasEntre(f.fechaInicioMora, f.fechaFinMora);
      if (dias <= 0) return null;
      return calcularInteresMoratorio(c, dias).valorInteres;
    }
    case "INTERESES_MORA_COMERCIAL": {
      const c = parseFloat(f.capital);
      const tb = parseFloat(f.tasaBancaria) / 100;
      if (!c || !tb || !f.fechaInicioMora || !f.fechaFinMora) return null;
      const dias = diasEntre(f.fechaInicioMora, f.fechaFinMora);
      if (dias <= 0) return null;
      return calcularInteresMoratorioComercial(c, dias, tb).valorInteres;
    }
    case "DAÑO_MORAL_CIVIL": {
      const sm = resolveSmmlvFromList(f.anioSmmlv, smmlvList);
      const nivel = parseInt(f.nivelCercania);
      const pct = parseFloat(f.porcentajeJuez) / 100;
      if (!sm || !nivel || isNaN(pct)) return null;
      return calcularPerjuiciosMoralesCivil(sm, nivel, pct).valorPesos;
    }
    case "VIDA_DE_RELACION": {
      const sm = resolveSmmlvFromList(f.anioSmmlv, smmlvList);
      const pct = parseFloat(f.porcentajeJuez) / 100;
      if (!sm || isNaN(pct)) return null;
      return Math.round(sm * 200 * pct);
    }
    case "DAÑO_A_LA_SALUD_CIVIL": {
      const v = parseFloat(f.valor);
      return v > 0 ? v : null;
    }
    case "BIENES_PERSONALISIMOS_CIVIL": {
      const sm = resolveSmmlvFromList(f.anioSmmlv, smmlvList);
      const pct = parseFloat(f.porcentajeJuez) / 100;
      if (!sm || isNaN(pct)) return null;
      return Math.round(sm * 100 * pct);
    }
    case "DAÑO_MORAL_CE": {
      const sm = resolveSmmlvFromList(f.anioSmmlv, smmlvList);
      const nivel = parseInt(f.nivelCercania);
      const pct = parseFloat(f.porcentajeJuez) / 100;
      if (!sm || !nivel || isNaN(pct)) return null;
      const tope = TOPES_CE[nivel] || 15;
      const multiplicador = f.graveDDHH ? 3 : 1;
      return Math.round(sm * tope * multiplicador * pct);
    }
    case "DAÑO_A_LA_SALUD_CE": {
      const sm = resolveSmmlvFromList(f.anioSmmlv, smmlvList);
      const pcl = parseFloat(f.pclPorcentaje);
      if (!sm || isNaN(pcl) || pcl < 0) return null;
      let smmlvBase: number;
      if (f.casoExcepcional) {
        smmlvBase = 400;
      } else if (pcl >= 50) {
        smmlvBase = 100;
      } else {
        // Proporcional: PCL 0% → 10 SMMLV, PCL 50% → 100 SMMLV
        smmlvBase = 10 + (pcl / 50) * 90;
      }
      return Math.round(sm * smmlvBase);
    }
    case "BIENES_CONSTITUCIONALES_CE": {
      const sm = resolveSmmlvFromList(f.anioSmmlv, smmlvList);
      const pct = parseFloat(f.porcentajeJuez) / 100;
      if (!sm || isNaN(pct)) return null;
      return Math.round(sm * 100 * pct);
    }
    case "DAÑO_MORAL_LABORAL": {
      const v = parseFloat(f.valor);
      return v > 0 ? v : null;
    }
    case "VIDA_DE_RELACION_LABORAL":
    case "DAÑO_A_LA_SALUD_LABORAL": {
      const sm = resolveSmmlvFromList(f.anioSmmlv, smmlvList);
      const vs = parseFloat(f.valorSMMLV);
      if (!sm || !vs) return null;
      return Math.round(sm * vs);
    }
  }
}

// ── Auto-generate rubro label ─────────────────────────────

function generarLabelRubro(tipo: TipoRubro, f: FormState): string {
  switch (tipo) {
    case "DAÑO_EMERGENTE":
      return `Daño emergente — ${f.descripcion.slice(0, 40) || "Sin descripción"}`;
    case "INDEXACION":
      return `Indexación — ${formatCOP(parseFloat(f.valorHistorico) || 0)}`;
    case "LUCRO_CESANTE_CONSOLIDADO": {
      const m = f.fechaInicio && f.fechaFin
        ? calcularMesesEntreFechas(new Date(f.fechaInicio), new Date(f.fechaFin))
        : 0;
      return `LC Consolidado — ${m} meses${f.incluyeAuxTransporte ? " + aux. transporte" : ""}`;
    }
    case "LUCRO_CESANTE_FUTURO": {
      const m = f.fechaInicio && f.fechaFin
        ? calcularMesesEntreFechas(new Date(f.fechaInicio), new Date(f.fechaFin))
        : 0;
      return `LC Futuro — ${m} meses${f.incluyeAuxTransporte ? " + aux. transporte" : ""}`;
    }
    case "INTERESES_MORA_CIVIL":
      return `Intereses mora civil — ${diasEntre(f.fechaInicioMora, f.fechaFinMora)} días`;
    case "INTERESES_MORA_COMERCIAL":
      return `Intereses mora comercial — ${diasEntre(f.fechaInicioMora, f.fechaFinMora)} días`;
    case "DAÑO_MORAL_CIVIL":
      return `Daño moral (Civil) — Nivel ${f.nivelCercania}, ${f.porcentajeJuez}%`;
    case "VIDA_DE_RELACION":
      return `Vida de relación — ${f.porcentajeJuez}%`;
    case "DAÑO_A_LA_SALUD_CIVIL":
      return `Daño a la salud (Civil) — ${f.descripcion.slice(0, 40) || "tratamientos"}`;
    case "BIENES_PERSONALISIMOS_CIVIL":
      return `Bienes personalísimos — ${f.porcentajeJuez}%`;
    case "DAÑO_MORAL_CE":
      return `Daño moral (CE) — Nivel ${f.nivelCercania}, ${f.porcentajeJuez}%${f.graveDDHH ? " (DDHH ×3)" : ""}`;
    case "DAÑO_A_LA_SALUD_CE":
      return `Daño a la salud (CE) — PCL ${f.pclPorcentaje}%${f.casoExcepcional ? " (excepcional)" : ""}`;
    case "BIENES_CONSTITUCIONALES_CE":
      return `Bienes constitucionales — ${f.porcentajeJuez}%`;
    case "DAÑO_MORAL_LABORAL":
      return `Daño moral (Laboral) — ${formatCOP(parseFloat(f.valor) || 0)}`;
    case "VIDA_DE_RELACION_LABORAL":
      return `Vida de relación (Laboral) — ${f.valorSMMLV} SMMLV`;
    case "DAÑO_A_LA_SALUD_LABORAL":
      return `Daño a la salud (Laboral) — ${f.valorSMMLV} SMMLV`;
  }
}

// ── Build parametros for save ─────────────────────────────

function buildParametros(tipo: TipoRubro, f: FormState, smmlvList: SmmlvDB[]): Record<string, unknown> {
  const base: Record<string, unknown> = { tipo };
  switch (tipo) {
    case "DAÑO_EMERGENTE":
      return { ...base, descripcion: f.descripcion, valor: parseFloat(f.valor), requiereIndexacion: f.requiereIndexacion, ipcInicial: parseFloat(f.ipcInicial) || null, ipcFinal: parseFloat(f.ipcFinal) || null };
    case "INDEXACION":
      return { ...base, valorHistorico: parseFloat(f.valorHistorico), ipcInicial: parseFloat(f.ipcInicial), ipcFinal: parseFloat(f.ipcFinal) };
    case "LUCRO_CESANTE_CONSOLIDADO":
    case "LUCRO_CESANTE_FUTURO": {
      const auxVal = f.incluyeAuxTransporte ? (() => { try { return getAuxilioTransporte(parseInt(f.anioAuxTransporte)); } catch { return 0; } })() : 0;
      return { ...base, rentaMensual: parseFloat(f.rentaMensual), aplicaPrestaciones: f.aplicaPrestaciones, porcentajeAplicacion: parseFloat(f.porcentajeAplicacion), fechaInicio: f.fechaInicio, fechaFin: f.fechaFin, incluyeAuxTransporte: f.incluyeAuxTransporte, anioAuxTransporte: f.incluyeAuxTransporte ? parseInt(f.anioAuxTransporte) : null, auxilioTransporte: auxVal };
    }
    case "INTERESES_MORA_CIVIL":
      return { ...base, capital: parseFloat(f.capital), fechaInicioMora: f.fechaInicioMora, fechaFinMora: f.fechaFinMora };
    case "INTERESES_MORA_COMERCIAL":
      return { ...base, capital: parseFloat(f.capital), fechaInicioMora: f.fechaInicioMora, fechaFinMora: f.fechaFinMora, tasaBancariaMensual: parseFloat(f.tasaBancaria) };
    case "DAÑO_MORAL_CIVIL":
    case "DAÑO_MORAL_CE":
      return { ...base, anioSmmlv: parseInt(f.anioSmmlv), smmlvVigente: resolveSmmlvFromList(f.anioSmmlv, smmlvList), nivelCercania: parseInt(f.nivelCercania), porcentajeJuez: parseFloat(f.porcentajeJuez), graveDDHH: f.graveDDHH };
    case "VIDA_DE_RELACION":
    case "BIENES_PERSONALISIMOS_CIVIL":
    case "BIENES_CONSTITUCIONALES_CE":
      return { ...base, anioSmmlv: parseInt(f.anioSmmlv), smmlvVigente: resolveSmmlvFromList(f.anioSmmlv, smmlvList), porcentajeJuez: parseFloat(f.porcentajeJuez) };
    case "DAÑO_A_LA_SALUD_CIVIL":
      return { ...base, descripcion: f.descripcion, valor: parseFloat(f.valor) };
    case "DAÑO_A_LA_SALUD_CE":
      return { ...base, anioSmmlv: parseInt(f.anioSmmlv), smmlvVigente: resolveSmmlvFromList(f.anioSmmlv, smmlvList), pclPorcentaje: parseFloat(f.pclPorcentaje), casoExcepcional: f.casoExcepcional };
    case "DAÑO_MORAL_LABORAL":
      return { ...base, valor: parseFloat(f.valor) };
    case "VIDA_DE_RELACION_LABORAL":
    case "DAÑO_A_LA_SALUD_LABORAL":
      return { ...base, anioSmmlv: parseInt(f.anioSmmlv), smmlvVigente: resolveSmmlvFromList(f.anioSmmlv, smmlvList), valorSMMLV: parseFloat(f.valorSMMLV) };
    default:
      return base;
  }
}

// ════════════════════════════════════════════════════════════
// STYLE CONSTANTS
// ════════════════════════════════════════════════════════════

const inputCls =
  "w-full rounded-sm border border-[#E8E9EA] bg-white px-3 py-2 text-sm text-[#060606] focus:border-[#008080] focus:outline-none focus:ring-1 focus:ring-[#008080]";
const labelCls = "mb-1 block text-[11px] font-medium uppercase tracking-wide text-[#8B8C8E]";
const helpCls = "mt-0.5 text-[10px] text-[#8B8C8E]";
const notaCls = "mt-1 rounded-sm bg-amber-50 border border-amber-200 px-3 py-2 text-[11px] text-amber-700";

// ════════════════════════════════════════════════════════════
// FORM FIELDS BY RUBRO TYPE
// ════════════════════════════════════════════════════════════

function RubroFields({
  tipo,
  form,
  setForm,
  valorEnVivo,
  aniosDisponibles,
  smmlvList,
}: {
  tipo: TipoRubro;
  form: FormState;
  setForm: (fn: (prev: FormState) => FormState) => void;
  valorEnVivo: number | null;
  aniosDisponibles: number[];
  smmlvList: SmmlvDB[];
}) {
  const up = (field: keyof FormState, value: unknown) =>
    setForm((p) => ({ ...p, [field]: value }));

  const [showPctJuez, setShowPctJuez] = useState(false);

  // Reset when tipo changes (RubroFields re-mounts via key or form reset)
  useEffect(() => {
    setShowPctJuez(false);
  }, [tipo]);

  const PorcentajeJuezToggle = () =>
    !showPctJuez ? (
      <button
        type="button"
        onClick={() => setShowPctJuez(true)}
        className="text-xs text-[#8B8C8E] underline hover:text-[#008080]"
      >
        Ajustar porcentaje del juez
      </button>
    ) : (
      <div>
        <label className={labelCls}>Porcentaje aplicado (%)</label>
        <input type="number" min="0" max="100" value={form.porcentajeJuez} onChange={(e) => up("porcentajeJuez", e.target.value)} className={inputCls} />
        <button
          type="button"
          onClick={() => { up("porcentajeJuez", "100"); setShowPctJuez(false); }}
          className="mt-1 text-xs text-[#8B8C8E] underline hover:text-[#008080]"
        >
          Restablecer al 100%
        </button>
      </div>
    );

  const smmlvResuelto = resolveSmmlvFromList(form.anioSmmlv, smmlvList);
  const decretoResuelto = resolveDecretoFromList(form.anioSmmlv, smmlvList);

  const SmmlvSelector = () => (
    <div>
      <label className={labelCls}>Año SMMLV</label>
      <select value={form.anioSmmlv} onChange={(e) => up("anioSmmlv", e.target.value)} className={inputCls}>
        {aniosDisponibles.map((a) => (
          <option key={a} value={String(a)}>{a}</option>
        ))}
      </select>
      {smmlvResuelto > 0 && (
        <p className="mt-1 rounded-sm bg-[#FAFBFC] px-3 py-1.5 text-sm font-medium text-[#060606]">
          SMMLV {form.anioSmmlv}: {formatCOP(smmlvResuelto)}
          {decretoResuelto && <span className="ml-1 font-normal text-[#8B8C8E]">— {decretoResuelto}</span>}
        </p>
      )}
      <p className={helpCls}>Usar el año de la sentencia o del período de referencia (CSJ: SMMLV vigente a la sentencia)</p>
    </div>
  );

  const mesesCalc =
    form.fechaInicio && form.fechaFin
      ? calcularMesesEntreFechas(new Date(form.fechaInicio), new Date(form.fechaFin))
      : 0;

  const diasMoraCalc =
    form.fechaInicioMora && form.fechaFinMora
      ? diasEntre(form.fechaInicioMora, form.fechaFinMora)
      : 0;

  const tasaMoraAplicada = form.tasaBancaria
    ? (parseFloat(form.tasaBancaria) / 100) * 1.5
    : 0;

  switch (tipo) {
    case "DAÑO_EMERGENTE":
      return (
        <>
          <div>
            <label className={labelCls}>Descripción del gasto</label>
            <input type="text" value={form.descripcion} onChange={(e) => up("descripcion", e.target.value)} placeholder="Ej: Gastos médicos" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Valor (pesos)</label>
            <input type="number" value={form.valor} onChange={(e) => up("valor", e.target.value)} placeholder="0" className={inputCls} />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="idx-check" checked={form.requiereIndexacion} onChange={(e) => up("requiereIndexacion", e.target.checked)} className="h-4 w-4 rounded border-[#E8E9EA] text-[#008080] focus:ring-[#008080]" />
            <label htmlFor="idx-check" className="text-sm text-[#060606]">Requiere indexación IPC</label>
          </div>
          {form.requiereIndexacion && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>IPC inicial</label>
                <input type="number" step="0.01" value={form.ipcInicial} onChange={(e) => up("ipcInicial", e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>IPC final</label>
                <input type="number" step="0.01" value={form.ipcFinal} onChange={(e) => up("ipcFinal", e.target.value)} className={inputCls} />
              </div>
            </div>
          )}
        </>
      );

    case "INDEXACION":
      return (
        <>
          <div>
            <label className={labelCls}>Valor histórico</label>
            <input type="number" value={form.valorHistorico} onChange={(e) => up("valorHistorico", e.target.value)} placeholder="0" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>IPC inicial</label>
            <input type="number" step="0.01" value={form.ipcInicial} onChange={(e) => up("ipcInicial", e.target.value)} className={inputCls} />
            <p className={helpCls}>Índice DANE base 2018=100</p>
          </div>
          <div>
            <label className={labelCls}>IPC final</label>
            <input type="number" step="0.01" value={form.ipcFinal} onChange={(e) => up("ipcFinal", e.target.value)} className={inputCls} />
          </div>
        </>
      );

    case "LUCRO_CESANTE_CONSOLIDADO":
    case "LUCRO_CESANTE_FUTURO": {
      const aniosAux = getAniosAuxilioTransporte();
      let auxValor = 0;
      if (form.incluyeAuxTransporte) {
        try { auxValor = getAuxilioTransporte(parseInt(form.anioAuxTransporte)); } catch { /* ignore */ }
      }
      const rentaNum = parseFloat(form.rentaMensual) || 0;
      const rentaEfectiva = rentaNum + auxValor;
      return (
        <>
          <div>
            <label className={labelCls}>Renta mensual base (pesos)</label>
            <input type="number" value={form.rentaMensual} onChange={(e) => up("rentaMensual", e.target.value)} placeholder="0" className={inputCls} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="aux-check" checked={form.incluyeAuxTransporte} onChange={(e) => up("incluyeAuxTransporte", e.target.checked)} className="h-4 w-4 rounded border-[#E8E9EA] text-[#008080] focus:ring-[#008080]" />
              <label htmlFor="aux-check" className="text-sm text-[#060606]">Incluir auxilio de transporte</label>
            </div>
          </div>
          {form.incluyeAuxTransporte && (
            <>
              <div>
                <label className={labelCls}>Año del auxilio de transporte</label>
                <select value={form.anioAuxTransporte} onChange={(e) => up("anioAuxTransporte", e.target.value)} className={inputCls}>
                  {aniosAux.map((a) => (
                    <option key={a} value={String(a)}>{a}</option>
                  ))}
                </select>
              </div>
              <p className="rounded-sm bg-[#FAFBFC] px-3 py-1.5 text-sm text-[#8B8C8E]">
                Auxilio de transporte {form.anioAuxTransporte}: {formatCOP(auxValor)} — solo aplica si el salario no supera 2 SMMLV
              </p>
            </>
          )}
          {form.incluyeAuxTransporte && rentaNum > 0 && (
            <p className="rounded-sm bg-teal-50 border border-teal-200 px-3 py-1.5 text-sm text-teal-800">
              Renta base efectiva: {formatCOP(rentaEfectiva)} (salario {formatCOP(rentaNum)} + auxilio {formatCOP(auxValor)})
            </p>
          )}
          <div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="prest-check" checked={form.aplicaPrestaciones} onChange={(e) => up("aplicaPrestaciones", e.target.checked)} className="h-4 w-4 rounded border-[#E8E9EA] text-[#008080] focus:ring-[#008080]" />
              <label htmlFor="prest-check" className="text-sm text-[#060606]">Aplica +25% prestaciones sociales</label>
            </div>
            <p className={helpCls}>Solo si hay relación laboral subordinada probada y se solicita como pretensión (CSJ SC072-2025, CE SU 2014)</p>
          </div>
          <div>
            <label className={labelCls}>Porcentaje de aplicación (%)</label>
            <input type="number" min="0" max="100" value={form.porcentajeAplicacion} onChange={(e) => up("porcentajeAplicacion", e.target.value)} placeholder="0" className={inputCls} />
            <p className={helpCls}>Capacidad laboral perdida. Para fallecimiento: 75 (descuento 25% gastos personales)</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Fecha inicio</label>
              <input type="date" value={form.fechaInicio} onChange={(e) => up("fechaInicio", e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Fecha fin</label>
              <input type="date" value={form.fechaFin} onChange={(e) => up("fechaFin", e.target.value)} className={inputCls} />
            </div>
          </div>
          {form.fechaInicio && form.fechaFin && (
            <p className="rounded-sm bg-[#FAFBFC] px-3 py-1.5 text-sm text-[#8B8C8E]">Meses: {mesesCalc}</p>
          )}
        </>
      );
    }

    case "INTERESES_MORA_CIVIL":
      return (
        <>
          <div>
            <label className={labelCls}>Capital</label>
            <input type="number" value={form.capital} onChange={(e) => up("capital", e.target.value)} placeholder="0" className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Fecha inicio mora</label>
              <input type="date" value={form.fechaInicioMora} onChange={(e) => up("fechaInicioMora", e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Fecha fin</label>
              <input type="date" value={form.fechaFinMora} onChange={(e) => up("fechaFinMora", e.target.value)} className={inputCls} />
            </div>
          </div>
          {form.fechaInicioMora && form.fechaFinMora && (
            <p className="rounded-sm bg-[#FAFBFC] px-3 py-1.5 text-sm text-[#8B8C8E]">Días de mora: {diasMoraCalc}</p>
          )}
        </>
      );

    case "INTERESES_MORA_COMERCIAL":
      return (
        <>
          <div>
            <label className={labelCls}>Capital</label>
            <input type="number" value={form.capital} onChange={(e) => up("capital", e.target.value)} placeholder="0" className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Fecha inicio mora</label>
              <input type="date" value={form.fechaInicioMora} onChange={(e) => up("fechaInicioMora", e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Fecha fin</label>
              <input type="date" value={form.fechaFinMora} onChange={(e) => up("fechaFinMora", e.target.value)} className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Tasa bancaria corriente mensual (%)</label>
            <input type="number" step="0.01" value={form.tasaBancaria} onChange={(e) => up("tasaBancaria", e.target.value)} placeholder="1.82" className={inputCls} />
            <p className={helpCls}>Tasa certificada por Superfinanciera — ingresar sin dividir por 100, ej: 1.82</p>
          </div>
          {form.tasaBancaria && (
            <p className="rounded-sm bg-[#FAFBFC] px-3 py-1.5 text-sm text-[#8B8C8E]">
              Tasa de mora aplicada: {(tasaMoraAplicada * 100).toFixed(2)}% mensual (1.5 × tasa corriente)
            </p>
          )}
          {form.fechaInicioMora && form.fechaFinMora && (
            <p className="rounded-sm bg-[#FAFBFC] px-3 py-1.5 text-sm text-[#8B8C8E]">Días de mora: {diasMoraCalc}</p>
          )}
        </>
      );

    case "DAÑO_MORAL_CIVIL":
      return (
        <>
          <SmmlvSelector />
          <div>
            <label className={labelCls}>Nivel de cercanía afectiva</label>
            <select value={form.nivelCercania} onChange={(e) => up("nivelCercania", e.target.value)} className={inputCls}>
              <option value="1">1 — Cónyuge / Padres / Hijos → 100 SMMLV</option>
              <option value="2">2 — Nietos → 70 SMMLV</option>
              <option value="3">3 — Hermanos → 50 SMMLV</option>
              <option value="4">4 — Abuelos → 35 SMMLV</option>
              <option value="5">5 — Terceros con vínculo → 15 SMMLV</option>
            </select>
          </div>
          <PorcentajeJuezToggle />
          {smmlvResuelto > 0 && (
            <p className="rounded-sm bg-[#FAFBFC] px-3 py-1.5 text-sm text-[#8B8C8E]">
              Tope: {TOPES_CIVIL[parseInt(form.nivelCercania)] || 100} SMMLV → máximo {formatCOP((TOPES_CIVIL[parseInt(form.nivelCercania)] || 100) * smmlvResuelto)}
            </p>
          )}
        </>
      );

    case "VIDA_DE_RELACION":
      return (
        <>
          <SmmlvSelector />
          <PorcentajeJuezToggle />
          {smmlvResuelto > 0 && (
            <p className="rounded-sm bg-[#FAFBFC] px-3 py-1.5 text-sm text-[#8B8C8E]">
              Tope: 200 SMMLV → máximo {formatCOP(200 * smmlvResuelto)}
            </p>
          )}
        </>
      );

    case "DAÑO_A_LA_SALUD_CIVIL":
      return (
        <>
          <div>
            <label className={labelCls}>Descripción (tratamientos o secuelas)</label>
            <input type="text" value={form.descripcion} onChange={(e) => up("descripcion", e.target.value)} placeholder="Ej: Cirugía reconstructiva, rehabilitación" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Valor estimado de tratamientos (pesos)</label>
            <input type="number" value={form.valor} onChange={(e) => up("valor", e.target.value)} placeholder="0" className={inputCls} />
          </div>
          <p className={notaCls}>
            En jurisdicción civil el daño a la salud se indemniza mediante prestación del servicio médico o pago de tratamientos — SC072-2025
          </p>
        </>
      );

    case "BIENES_PERSONALISIMOS_CIVIL":
      return (
        <>
          <SmmlvSelector />
          <PorcentajeJuezToggle />
          {smmlvResuelto > 0 && (
            <p className="rounded-sm bg-[#FAFBFC] px-3 py-1.5 text-sm text-[#8B8C8E]">
              Tope: 100 SMMLV → máximo {formatCOP(100 * smmlvResuelto)}
            </p>
          )}
        </>
      );

    case "DAÑO_MORAL_CE":
      return (
        <>
          <SmmlvSelector />
          <div>
            <label className={labelCls}>Nivel de cercanía afectiva</label>
            <select value={form.nivelCercania} onChange={(e) => up("nivelCercania", e.target.value)} className={inputCls}>
              <option value="1">1 — Cónyuge / Padres / Hijos → 100 SMMLV</option>
              <option value="2">2 — Hermanos / Abuelos / Nietos → 50 SMMLV</option>
              <option value="3">3 — 3° consanguinidad (tíos/sobrinos) → 35 SMMLV</option>
              <option value="4">4 — 4° consanguinidad (primos) → 25 SMMLV</option>
              <option value="5">5 — Terceros con vínculo → 15 SMMLV</option>
            </select>
          </div>
          <PorcentajeJuezToggle />
          <div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="ddhh-check" checked={form.graveDDHH} onChange={(e) => up("graveDDHH", e.target.checked)} className="h-4 w-4 rounded border-[#E8E9EA] text-[#008080] focus:ring-[#008080]" />
              <label htmlFor="ddhh-check" className="text-sm text-[#060606]">Caso de grave violación de DDHH (tope ×3)</label>
            </div>
            <p className={helpCls}>Solo para desapariciones forzadas, ejecuciones extrajudiciales, tortura u otras graves violaciones al DIH — CE Sección Tercera, exp. 32.988 (2014)</p>
          </div>
          {smmlvResuelto > 0 && (() => {
            const tope = TOPES_CE[parseInt(form.nivelCercania)] || 100;
            return (
              <>
                <p className="rounded-sm bg-[#FAFBFC] px-3 py-1.5 text-sm text-[#8B8C8E]">
                  Tope: {tope} SMMLV → máximo {formatCOP(tope * smmlvResuelto)}
                </p>
                {form.graveDDHH && (
                  <p className="rounded-sm bg-red-50 border border-red-200 px-3 py-1.5 text-sm text-red-700">
                    Tope ×3 DDHH: {tope * 3} SMMLV → máximo {formatCOP(tope * 3 * smmlvResuelto)}
                  </p>
                )}
              </>
            );
          })()}
        </>
      );

    case "DAÑO_A_LA_SALUD_CE": {
      const pcl = parseFloat(form.pclPorcentaje) || 0;
      let smmlvBase = 0;
      if (form.casoExcepcional) smmlvBase = 400;
      else if (pcl >= 50) smmlvBase = 100;
      else if (pcl > 0) smmlvBase = Math.round(10 + (pcl / 50) * 90);
      return (
        <>
          <SmmlvSelector />
          <div>
            <label className={labelCls}>% de pérdida de capacidad laboral (PCL)</label>
            <input type="number" min="0" max="100" value={form.pclPorcentaje} onChange={(e) => up("pclPorcentaje", e.target.value)} placeholder="0" className={inputCls} />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="excep-check" checked={form.casoExcepcional} onChange={(e) => up("casoExcepcional", e.target.checked)} className="h-4 w-4 rounded border-[#E8E9EA] text-[#008080] focus:ring-[#008080]" />
            <label htmlFor="excep-check" className="text-sm text-[#060606]">Caso excepcional (irreversibilidad, pérdida de órganos)</label>
          </div>
          {smmlvResuelto > 0 && pcl > 0 && (
            <p className="rounded-sm bg-[#FAFBFC] px-3 py-1.5 text-sm text-[#8B8C8E]">
              {smmlvBase} SMMLV → {formatCOP(smmlvResuelto * smmlvBase)}
            </p>
          )}
          <p className={notaCls}>
            Solo víctima directa. Absorbe &ldquo;vida de relación&rdquo; como categoría — CE Sección Tercera desde 2011
          </p>
        </>
      );
    }

    case "BIENES_CONSTITUCIONALES_CE":
      return (
        <>
          <SmmlvSelector />
          <PorcentajeJuezToggle />
          {smmlvResuelto > 0 && (
            <p className="rounded-sm bg-[#FAFBFC] px-3 py-1.5 text-sm text-[#8B8C8E]">
              Tope: 100 SMMLV → máximo {formatCOP(100 * smmlvResuelto)}
            </p>
          )}
          <p className={notaCls}>
            Complementar con solicitud de medidas no pecuniarias (disculpas públicas, garantías de no repetición)
          </p>
        </>
      );

    case "DAÑO_MORAL_LABORAL":
      return (
        <>
          <div>
            <label className={labelCls}>Valor estimado por arbitrio judicial ($)</label>
            <input type="number" value={form.valor} onChange={(e) => up("valor", e.target.value)} placeholder="0" className={inputCls} />
          </div>
          <p className={notaCls}>
            Sin topes legales fijos — queda a criterio del juez según las pruebas del proceso (Art. 216 CST)
          </p>
        </>
      );

    case "VIDA_DE_RELACION_LABORAL":
      return (
        <>
          <SmmlvSelector />
          <div>
            <label className={labelCls}>Valor en SMMLV</label>
            <input type="number" value={form.valorSMMLV} onChange={(e) => up("valorSMMLV", e.target.value)} placeholder="0" className={inputCls} />
          </div>
          <p className={notaCls}>Sin tope fijo. Determinado por arbitrio judicial</p>
        </>
      );

    case "DAÑO_A_LA_SALUD_LABORAL":
      return (
        <>
          <SmmlvSelector />
          <div>
            <label className={labelCls}>Valor en SMMLV</label>
            <input type="number" value={form.valorSMMLV} onChange={(e) => up("valorSMMLV", e.target.value)} placeholder="0" className={inputCls} />
          </div>
          <p className={notaCls}>
            Sin tope fijo. No se descuenta de la indemnización las prestaciones pagadas por la ARL — SL1670-2024
          </p>
        </>
      );
  }
}

// ════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════

export function CalculadoraFinanciera({ procesoId }: { procesoId: string }) {
  // ── Jurisdicción
  const [jurisdiccion, setJurisdiccion] = useState<Jurisdiccion>("CIVIL");

  // ── Rubro form
  const [tipoRubro, setTipoRubro] = useState<TipoRubro>("DAÑO_EMERGENTE");
  const [form, setForm] = useState<FormState>({ ...INITIAL_FORM });

  // ── Liquidación actual (rubros agregados en sesión)
  const [rubros, setRubros] = useState<RubroAgregado[]>([]);
  const [nombreLiquidacion, setNombreLiquidacion] = useState("");
  const [notasGenerales, setNotasGenerales] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── SMMLV dinámico desde BD
  const [smmlvList, setSmmlvList] = useState<SmmlvDB[]>([]);

  // ── Historial
  const [historial, setHistorial] = useState<CalculoGuardado[]>([]);
  const [loadingHistorial, setLoadingHistorial] = useState(true);
  const [eliminandoGrupo, setEliminandoGrupo] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // ── Available rubros for current jurisdiction
  const rubrosDisponibles = useMemo(() => {
    const materiales = RUBROS_MATERIALES;
    const inmateriales = RUBROS_INMATERIALES[jurisdiccion];
    return [
      { grupo: "Perjuicios materiales", rubros: materiales },
      { grupo: "Perjuicios inmateriales", rubros: inmateriales },
    ];
  }, [jurisdiccion]);

  // ── Años disponibles (dinámico desde BD, fallback hardcoded)
  const aniosDisponibles = useMemo(() => {
    if (smmlvList.length > 0) return smmlvList.map((s) => s.anio).sort((a, b) => a - b);
    return ANIOS_SMMLV_FALLBACK;
  }, [smmlvList]);

  // ── Real-time value computation
  const valorEnVivo = useMemo(() => computeRubroValue(tipoRubro, form, smmlvList), [tipoRubro, form, smmlvList]);

  // ── Total liquidación
  const totalLiquidacion = useMemo(() => rubros.reduce((s, r) => s + r.valor, 0), [rubros]);

  // ── Default liquidación name
  useEffect(() => {
    const hoy = new Date().toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
    setNombreLiquidacion(`Liquidación ${JURISDICCION_LABELS[jurisdiccion].nombre} — ${hoy}`);
  }, [jurisdiccion]);

  // ── Reset rubro form when tipo changes
  useEffect(() => {
    setForm({ ...INITIAL_FORM });
    setError(null);
  }, [tipoRubro]);

  // ── Reset inmaterial rubros when jurisdiction changes
  useEffect(() => {
    const firstRubro = rubrosDisponibles[0].rubros[0];
    setTipoRubro(firstRubro);
  }, [jurisdiccion]);

  // ── Fetch SMMLV from DB
  useEffect(() => {
    async function fetchSmmlv() {
      try {
        const res = await fetch("/api/smmlv");
        if (res.ok) {
          const data: SmmlvDB[] = await res.json();
          if (data.length > 0) setSmmlvList(data);
        }
      } catch {
        // fallback silencioso a valores hardcodeados
      }
    }
    fetchSmmlv();
  }, []);

  // ── Fetch historial
  const fetchHistorial = async () => {
    try {
      const res = await fetch(`/api/procesos/${procesoId}/calculos`);
      if (res.ok) setHistorial(await res.json());
    } catch {
      // silent
    } finally {
      setLoadingHistorial(false);
    }
  };

  useEffect(() => {
    fetchHistorial();
  }, [procesoId]);

  // ── Group historial by liquidation name
  const gruposHistorial = useMemo(() => {
    const map: Record<string, CalculoGuardado[]> = {};
    for (const c of historial) {
      const parts = c.nombre.split(" | ");
      const groupName = parts.length > 1 ? parts[0] : c.nombre;
      if (!map[groupName]) map[groupName] = [];
      map[groupName].push(c);
    }
    const groups: GrupoLiquidacion[] = [];
    for (const nombre of Object.keys(map)) {
      const items = map[nombre];
      groups.push({
        nombre,
        fecha: items[0].creadoEn,
        rubros: items,
        total: items.reduce((s: number, r: CalculoGuardado) => s + r.totalCalculado, 0),
      });
    }
    return groups;
  }, [historial]);

  // ── Add rubro
  const handleAgregar = () => {
    setError(null);
    if (valorEnVivo === null) {
      setError("Completa todos los campos requeridos para calcular el valor");
      return;
    }
    const rubro: RubroAgregado = {
      id: uid(),
      tipo: tipoRubro,
      label: generarLabelRubro(tipoRubro, form),
      valor: valorEnVivo,
      parametros: buildParametros(tipoRubro, form, smmlvList),
      fuente: RUBRO_FUENTES[tipoRubro],
    };
    setRubros((prev) => [...prev, rubro]);
    setForm({ ...INITIAL_FORM });
    setError(null);
  };

  // ── Remove rubro
  const handleQuitarRubro = (id: string) => {
    setRubros((prev) => prev.filter((r) => r.id !== id));
  };

  // ── Save entire liquidation
  const handleGuardarLiquidacion = async () => {
    if (rubros.length === 0) {
      setError("Agrega al menos un rubro a la liquidación");
      return;
    }
    if (!nombreLiquidacion.trim()) {
      setError("El nombre de la liquidación es requerido");
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      for (const rubro of rubros) {
        const res = await fetch(`/api/procesos/${procesoId}/calculos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tipoCalculo: rubro.tipo,
            nombre: `${nombreLiquidacion.trim()} | ${rubro.label}`,
            parametros: rubro.parametros,
            resultado: { ...rubro.parametros, valorCalculado: rubro.valor, fuente: rubro.fuente },
            totalCalculado: rubro.valor,
            notas: notasGenerales.trim() || null,
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Error al guardar rubro");
        }
      }
      setRubros([]);
      setNotasGenerales("");
      await fetchHistorial();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al guardar la liquidación");
    } finally {
      setGuardando(false);
    }
  };

  // ── Delete entire group
  const handleEliminarGrupo = async (grupo: GrupoLiquidacion) => {
    if (!window.confirm(`¿Eliminar la liquidación "${grupo.nombre}" y todos sus rubros?`)) return;
    setEliminandoGrupo(grupo.nombre);
    try {
      for (const rubro of grupo.rubros) {
        await fetch(`/api/procesos/${procesoId}/calculos/${rubro.id}`, { method: "DELETE" });
      }
      await fetchHistorial();
    } catch {
      // silent
    } finally {
      setEliminandoGrupo(null);
    }
  };

  const toggleGroup = (nombre: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(nombre)) next.delete(nombre);
      else next.add(nombre);
      return next;
    });
  };

  // ════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════

  return (
    <div className="space-y-6">
      {/* ── JURISDICCIÓN SELECTOR ── */}
      <div className="rounded-sm border border-[#E8E9EA] bg-white p-5">
        <p className="mb-3 text-[11px] font-medium uppercase tracking-widest text-[#8B8C8E]">
          Jurisdicción aplicable
        </p>
        <div className="flex flex-wrap gap-3">
          {(Object.keys(JURISDICCION_LABELS) as Jurisdiccion[]).map((j) => (
            <button
              key={j}
              onClick={() => setJurisdiccion(j)}
              className={`rounded-sm border px-4 py-2.5 text-left transition-all ${
                jurisdiccion === j
                  ? "border-[#008080] bg-[#008080]/5 ring-1 ring-[#008080]"
                  : "border-[#E8E9EA] bg-white hover:border-[#8B8C8E]"
              }`}
            >
              <p className={`text-sm font-medium ${jurisdiccion === j ? "text-[#008080]" : "text-[#060606]"}`}>
                {JURISDICCION_LABELS[j].nombre}
              </p>
              <p className="text-[11px] text-[#8B8C8E]">{JURISDICCION_LABELS[j].detalle}</p>
            </button>
          ))}
        </div>
      </div>

      {/* ── MAIN: Form + Liquidation ── */}
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* ── LEFT: Agregar rubro (40%) ── */}
        <div className="w-full lg:w-[40%]">
          <div className="rounded-sm border border-[#E8E9EA] bg-white p-6">
            <div className="mb-5">
              <h2 className="text-xs font-medium uppercase tracking-widest text-[#060606]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Agregar rubro
              </h2>
              <div className="mt-1.5 h-[2px] w-8 bg-[#008080]" />
            </div>

            {/* Tipo rubro selector */}
            <div className="mb-4">
              <label className={labelCls}>Tipo de rubro</label>
              <select
                value={tipoRubro}
                onChange={(e) => setTipoRubro(e.target.value as TipoRubro)}
                className={inputCls}
              >
                {rubrosDisponibles.map(({ grupo, rubros: opts }) => (
                  <optgroup key={grupo} label={grupo}>
                    {opts.map((r) => (
                      <option key={r} value={r}>{RUBRO_LABELS[r]}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* Dynamic fields */}
            <div className="space-y-3">
              <RubroFields tipo={tipoRubro} form={form} setForm={setForm} valorEnVivo={valorEnVivo} aniosDisponibles={aniosDisponibles} smmlvList={smmlvList} />
            </div>

            {/* Live preview */}
            {valorEnVivo !== null && (
              <div className="mt-4 rounded-sm border border-[#008080]/20 bg-[#008080]/5 px-4 py-3">
                <p className="text-[11px] font-medium uppercase tracking-wide text-[#008080]">Valor calculado</p>
                <p className="mt-0.5 text-xl font-bold text-[#008080]">{formatCOP(valorEnVivo)}</p>
                <p className="mt-1 text-[10px] italic text-[#008080]/70">{RUBRO_FUENTES[tipoRubro]}</p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mt-3 rounded-sm border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {error}
              </div>
            )}

            {/* Agregar button */}
            <button
              onClick={handleAgregar}
              disabled={valorEnVivo === null}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-sm bg-[#008080] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#006666] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus className="h-4 w-4" />
              Agregar a liquidación
            </button>
          </div>
        </div>

        {/* ── RIGHT: Liquidación actual (60%) ── */}
        <div className="w-full lg:w-[60%] space-y-6">
          {/* Liquidación en curso */}
          <div className="rounded-sm border border-[#E8E9EA] bg-white p-6">
            <div className="mb-5">
              <h2 className="text-xs font-medium uppercase tracking-widest text-[#060606]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Liquidación actual
              </h2>
              <div className="mt-1.5 h-[2px] w-8 bg-[#008080]" />
            </div>

            {rubros.length === 0 ? (
              <p className="py-8 text-center text-sm text-[#8B8C8E]">
                Agrega rubros desde el panel izquierdo para construir la liquidación.
              </p>
            ) : (
              <>
                {/* Rubros list */}
                <div className="space-y-2">
                  {rubros.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center gap-3 rounded-sm border border-[#E8E9EA] bg-[#FAFBFC] px-4 py-3"
                    >
                      <span className="inline-block whitespace-nowrap rounded-sm bg-[#e0f2f2] px-2 py-0.5 text-[10px] font-medium text-[#008080]">
                        {RUBRO_LABELS[r.tipo]}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm text-[#060606]">
                        {r.label}
                      </span>
                      <span className="whitespace-nowrap text-sm font-bold text-[#060606]">
                        {formatCOP(r.valor)}
                      </span>
                      <button
                        onClick={() => handleQuitarRubro(r.id)}
                        className="flex-shrink-0 rounded-sm p-1 text-[#8B8C8E] transition-colors hover:bg-red-50 hover:text-red-600"
                        title="Quitar rubro"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Divider + Total */}
                <div className="mt-4 border-t border-[#E8E9EA] pt-4">
                  <div className="flex items-baseline justify-between">
                    <p className="text-xs font-medium uppercase tracking-widest text-[#8B8C8E]">
                      Total liquidación estimada
                    </p>
                    <p className="text-2xl font-bold text-[#008080]">{formatCOP(totalLiquidacion)}</p>
                  </div>
                  <p className="mt-1 text-right text-[11px] text-[#8B8C8E]">
                    Jurisdicción: {JURISDICCION_LABELS[jurisdiccion].nombre} — {rubros.length} rubro{rubros.length !== 1 ? "s" : ""}
                  </p>
                </div>

                {/* Save controls */}
                <div className="mt-4 space-y-3 border-t border-[#E8E9EA] pt-4">
                  <div>
                    <label className={labelCls}>Nombre de la liquidación</label>
                    <input
                      type="text"
                      value={nombreLiquidacion}
                      onChange={(e) => setNombreLiquidacion(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Notas generales</label>
                    <textarea
                      value={notasGenerales}
                      onChange={(e) => setNotasGenerales(e.target.value)}
                      rows={2}
                      placeholder="Observaciones opcionales..."
                      className={`${inputCls} resize-none`}
                    />
                  </div>
                  <button
                    onClick={handleGuardarLiquidacion}
                    disabled={guardando || rubros.length === 0}
                    className="w-full rounded-sm bg-[#008080] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#006666] disabled:opacity-50"
                  >
                    {guardando ? (
                      <span className="inline-flex items-center justify-center gap-1.5">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Guardando liquidación...
                      </span>
                    ) : (
                      "Guardar liquidación completa"
                    )}
                  </button>
                </div>
              </>
            )}
          </div>

          {/* ── HISTORIAL ── */}
          <div className="rounded-sm border border-[#E8E9EA] bg-white p-6">
            <div className="mb-5">
              <h2 className="text-xs font-medium uppercase tracking-widest text-[#060606]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Liquidaciones guardadas
              </h2>
              <div className="mt-1.5 h-[2px] w-8 bg-[#008080]" />
            </div>

            {loadingHistorial ? (
              <div className="animate-pulse space-y-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="h-20 rounded bg-[#E8E9EA]" />
                ))}
              </div>
            ) : gruposHistorial.length === 0 ? (
              <p className="py-8 text-center text-sm text-[#8B8C8E]">
                Aún no hay cálculos guardados para este proceso.
              </p>
            ) : (
              <div className="space-y-3">
                {gruposHistorial.map((grupo) => {
                  const isExpanded = expandedGroups.has(grupo.nombre);
                  return (
                    <div
                      key={grupo.nombre}
                      className="rounded-sm border border-[#E8E9EA] bg-[#FAFBFC] transition-colors hover:border-[#008080]/30"
                    >
                      {/* Group header */}
                      <div
                        className="flex cursor-pointer items-center gap-3 px-4 py-3"
                        onClick={() => toggleGroup(grupo.nombre)}
                      >
                        <ChevronDown className={`h-4 w-4 flex-shrink-0 text-[#8B8C8E] transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-[#060606] truncate">{grupo.nombre}</p>
                          <p className="text-[11px] text-[#8B8C8E]">
                            {formatDate(grupo.fecha)} — {grupo.rubros.length} rubro{grupo.rubros.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <p className="whitespace-nowrap text-lg font-bold text-[#008080]">{formatCOP(grupo.total)}</p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEliminarGrupo(grupo);
                          }}
                          disabled={eliminandoGrupo === grupo.nombre}
                          className="flex-shrink-0 rounded-sm p-1.5 text-[#8B8C8E] transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                          title="Eliminar liquidación"
                        >
                          {eliminandoGrupo === grupo.nombre ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>

                      {/* Expanded rubros */}
                      {isExpanded && (
                        <div className="border-t border-[#E8E9EA] px-4 py-3 space-y-1.5">
                          {grupo.rubros.map((rubro) => {
                            const rubroLabel = rubro.nombre.includes(" | ")
                              ? rubro.nombre.split(" | ").slice(1).join(" | ")
                              : rubro.nombre;
                            return (
                              <div key={rubro.id} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="inline-block whitespace-nowrap rounded-sm bg-[#e0f2f2] px-1.5 py-0.5 text-[9px] font-medium text-[#008080]">
                                    {RUBRO_LABELS[rubro.tipoCalculo as TipoRubro] || rubro.tipoCalculo}
                                  </span>
                                  <span className="truncate text-[#8B8C8E]">{rubroLabel}</span>
                                </div>
                                <span className="whitespace-nowrap font-medium text-[#060606] ml-2">
                                  {formatCOP(rubro.totalCalculado)}
                                </span>
                              </div>
                            );
                          })}
                          {grupo.rubros[0]?.notas && (
                            <p className="mt-1 text-xs italic text-[#8B8C8E]">
                              {grupo.rubros[0].notas}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
