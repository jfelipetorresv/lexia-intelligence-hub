// ============================================================
// CÁLCULOS FINANCIEROS JURÍDICOS — COLOMBIA
// Nivel 7: Funciones puras sin dependencias de base de datos
// ============================================================

// ─── CONSTANTES ───────────────────────────────────────────────────────────────

// Tasa de interés puro técnico: 6% anual → mensual = (1.06)^(1/12) - 1 ≈ 0.004867
const TASA_INTERES_MENSUAL = 0.004867;

// SMMLV colombiano por año (fuente: Decretos anuales del Gobierno Nacional)
const SMMLV_POR_ANIO: Record<number, number> = {
  2020: 877803,
  2021: 908526,
  2022: 1000000,
  2023: 1160000,
  2024: 1300000,
  2025: 1423500,
  2026: 1750905,
};

// Auxilio de transporte colombiano por año (fuente: Decretos anuales)
const AUXILIO_TRANSPORTE_POR_ANIO: Record<number, number> = {
  2020: 102854,
  2021: 106454,
  2022: 117172,
  2023: 140606,
  2024: 162000,
  2025: 174983,
  2026: 200000,
};

// Tabla de topes en SMMLV por nivel de cercanía afectiva
// Consejo de Estado — Sentencia de Unificación 28 de agosto de 2014
// Nivel 1: cónyuge/compañero permanente, padres, hijos
// Nivel 2: abuelos, nietos
// Nivel 3: hermanos
// Nivel 4: tíos, sobrinos
// Nivel 5: primos, otros parientes
const TOPES_SMMLV_CONTENCIOSO: Record<number, number> = {
  1: 100,
  2: 50,
  3: 35,
  4: 25,
  5: 15,
};

// Sala Civil CSJ — SC072-2025: tope máximo 100 SMMLV para daño moral
// La tabla orientadora sigue niveles similares al Consejo de Estado
const TOPES_SMMLV_CIVIL: Record<number, number> = {
  1: 100,
  2: 80,
  3: 60,
  4: 40,
  5: 20,
};

// ─── TIPOS ────────────────────────────────────────────────────────────────────

export interface ResultadoIndexacion {
  valorHistorico: number;
  ipcInicial: number;
  ipcFinal: number;
  valorActualizado: number;
  factorActualizacion: number;
}

export interface ResultadoLucroCesante {
  rentaMensualBase: number;
  rentaConPrestaciones: number;
  rentaAplicada: number;
  meses: number;
  factorSn: number;
  valorActual: number;
  tipo: "CONSOLIDADO" | "FUTURO";
}

export interface ResultadoPerjuiciosMorales {
  smmlv: number;
  porcentajeAplicado: number;
  nivelCercaniaAfectiva: number;
  valorSMMLV: number;
  valorPesos: number;
  jurisdiccion: "CIVIL" | "CONTENCIOSO_ADMINISTRATIVO" | "LABORAL";
}

export interface ResultadoInteresMoratorio {
  capital: number;
  tasaAnual: number;
  diasMora: number;
  mesesMora: number;
  valorInteres: number;
}

// ─── FUNCIONES ────────────────────────────────────────────────────────────────

/**
 * 1. INDEXACIÓN IPC
 *
 * Fórmula: Va = Vh × (IPC_final / IPC_inicial)
 *
 * Fuente jurídica: Corte Suprema de Justicia, Sala de Casación Civil.
 * Metodología estándar de actualización monetaria usando el Índice de Precios
 * al Consumidor publicado por el DANE (base 2018 = 100).
 *
 * @param valorHistorico - Valor en pesos a la fecha del hecho
 * @param ipcInicial - IPC del mes/año del hecho generador
 * @param ipcFinal - IPC del mes/año de la liquidación (sentencia o actualización)
 */
export function calcularIndexacion(
  valorHistorico: number,
  ipcInicial: number,
  ipcFinal: number
): ResultadoIndexacion {
  const factorActualizacion = ipcFinal / ipcInicial;
  const valorActualizado = valorHistorico * factorActualizacion;

  return {
    valorHistorico,
    ipcInicial,
    ipcFinal,
    valorActualizado: Math.round(valorActualizado),
    factorActualizacion: Number(factorActualizacion.toFixed(6)),
  };
}

/**
 * 2. LUCRO CESANTE CONSOLIDADO (pasado)
 *
 * Fórmula: LCC = Ra × S(n,i)
 * donde S(n,i) = [(1+i)^n - 1] / i
 *
 * S(n,i) es el factor de acumulación de una anualidad vencida:
 * acumula n pagos mensuales de $1 al interés i mensual.
 *
 * Fuente jurídica: CSJ Sala Civil, fórmulas actuariales adoptadas desde
 * sentencia de 1993 (G.J. CCXXV). Consejo de Estado, Sección Tercera.
 *
 * @param rentaMensual - Ingreso mensual base de la víctima
 * @param porcentajePrestaciones - Factor prestacional (0.25 = 25% si hay relación laboral, 0 si independiente)
 * @param porcentajeIncapacidad - Porcentaje de pérdida de capacidad laboral (0 a 1).
 *        Para fallecimiento: usar 0.75 (se descuenta 25% de gastos personales del causante).
 *        Para incapacidad parcial: usar el % PCL dictaminado.
 * @param meses - Meses transcurridos desde el hecho dañoso hasta la fecha de liquidación
 */
export function calcularLucroCesanteConsolidado(
  rentaMensual: number,
  porcentajePrestaciones: number,
  porcentajeIncapacidad: number,
  meses: number,
  auxilioTransporte: number = 0
): ResultadoLucroCesante {
  const rentaBase = rentaMensual + auxilioTransporte;
  const rentaConPrestaciones = rentaBase * (1 + porcentajePrestaciones);
  const rentaAplicada = rentaConPrestaciones * porcentajeIncapacidad;

  // S(n,i) = [(1+i)^n - 1] / i — factor de acumulación
  const i = TASA_INTERES_MENSUAL;
  const factorSn =
    meses > 0 ? (Math.pow(1 + i, meses) - 1) / i : 0;
  const valorActual = rentaAplicada * factorSn;

  return {
    rentaMensualBase: rentaMensual,
    rentaConPrestaciones: Math.round(rentaConPrestaciones),
    rentaAplicada: Math.round(rentaAplicada),
    meses,
    factorSn: Number(factorSn.toFixed(6)),
    valorActual: Math.round(valorActual),
    tipo: "CONSOLIDADO",
  };
}

/**
 * 3. LUCRO CESANTE FUTURO
 *
 * Fórmula: LCF = Ra × a(n,i)
 * donde a(n,i) = [(1+i)^n - 1] / [i × (1+i)^n]
 *
 * a(n,i) es el valor presente de una anualidad vencida:
 * trae a valor presente n pagos futuros mensuales de $1 al interés i.
 *
 * Fuente jurídica: misma base actuarial que el consolidado.
 * Se aplica desde la fecha de sentencia hasta el fin del período indemnizable
 * (vida probable según tablas de mortalidad, o edad de independencia económica
 * del hijo — 25 años según jurisprudencia del Consejo de Estado).
 *
 * @param rentaMensual - Ingreso mensual base de la víctima
 * @param porcentajePrestaciones - Factor prestacional (0.25 si aplica)
 * @param porcentajeIncapacidad - Porcentaje de afectación (misma lógica que consolidado)
 * @param mesesFuturos - Meses desde la sentencia hasta el fin del período indemnizable
 */
export function calcularLucroCesanteFuturo(
  rentaMensual: number,
  porcentajePrestaciones: number,
  porcentajeIncapacidad: number,
  mesesFuturos: number,
  auxilioTransporte: number = 0
): ResultadoLucroCesante {
  const rentaBase = rentaMensual + auxilioTransporte;
  const rentaConPrestaciones = rentaBase * (1 + porcentajePrestaciones);
  const rentaAplicada = rentaConPrestaciones * porcentajeIncapacidad;

  // a(n,i) = [(1+i)^n - 1] / [i × (1+i)^n] — valor presente de anualidad
  const i = TASA_INTERES_MENSUAL;
  const potencia = Math.pow(1 + i, mesesFuturos);
  const factorSn =
    mesesFuturos > 0 ? (potencia - 1) / (i * potencia) : 0;
  const valorActual = rentaAplicada * factorSn;

  return {
    rentaMensualBase: rentaMensual,
    rentaConPrestaciones: Math.round(rentaConPrestaciones),
    rentaAplicada: Math.round(rentaAplicada),
    meses: mesesFuturos,
    factorSn: Number(factorSn.toFixed(6)),
    valorActual: Math.round(valorActual),
    tipo: "FUTURO",
  };
}

/**
 * 4. PERJUICIOS MORALES — SALA CIVIL CSJ (SC072-2025)
 *
 * Tope máximo: 100 SMMLV para daño moral subjetivo.
 * La Corte Suprema de Justicia en su Sala de Casación Civil estableció
 * una tabla orientadora según el grado de cercanía afectiva con la víctima.
 *
 * El juez tiene arbitrio judicial para graduar dentro del tope,
 * representado aquí por el porcentajeAplicado.
 *
 * Niveles de cercanía:
 *   1 → Cónyuge/compañero permanente, padres, hijos → hasta 100 SMMLV
 *   2 → Abuelos, nietos → hasta 80 SMMLV
 *   3 → Hermanos → hasta 60 SMMLV
 *   4 → Tíos, sobrinos → hasta 40 SMMLV
 *   5 → Primos, otros parientes → hasta 20 SMMLV
 *
 * @param smmlvVigente - Valor del SMMLV vigente en pesos
 * @param nivelCercania - Nivel de cercanía afectiva (1 a 5)
 * @param porcentajeAplicado - Porcentaje del tope a reconocer (0 a 1), según arbitrio del juez
 */
export function calcularPerjuiciosMoralesCivil(
  smmlvVigente: number,
  nivelCercania: number,
  porcentajeAplicado: number
): ResultadoPerjuiciosMorales {
  const nivel = Math.max(1, Math.min(5, Math.round(nivelCercania)));
  const topeSMMLV = TOPES_SMMLV_CIVIL[nivel];
  const valorSMMLV = topeSMMLV * porcentajeAplicado;
  const valorPesos = valorSMMLV * smmlvVigente;

  return {
    smmlv: smmlvVigente,
    porcentajeAplicado,
    nivelCercaniaAfectiva: nivel,
    valorSMMLV: Number(valorSMMLV.toFixed(2)),
    valorPesos: Math.round(valorPesos),
    jurisdiccion: "CIVIL",
  };
}

/**
 * 5. PERJUICIOS MORALES — CONSEJO DE ESTADO (SU 28 ago 2014)
 *
 * Sentencia de Unificación de la Sección Tercera del Consejo de Estado.
 * Establece 5 niveles de cercanía afectiva con topes fijos:
 *
 *   Nivel 1 → Cónyuge/compañero permanente, padres, hijos → 100 SMMLV
 *   Nivel 2 → Abuelos, nietos → 50 SMMLV
 *   Nivel 3 → Hermanos → 35 SMMLV
 *   Nivel 4 → Tíos, sobrinos → 25 SMMLV
 *   Nivel 5 → Primos, otros → 15 SMMLV
 *
 * Aplica en jurisdicción contencioso-administrativa (reparación directa,
 * nulidad y restablecimiento del derecho, etc.).
 *
 * @param smmlvVigente - Valor del SMMLV vigente en pesos
 * @param nivelCercania - Nivel de cercanía afectiva (1 a 5)
 * @param porcentajeAplicado - Porcentaje del tope (0 a 1), según gravedad y prueba del daño
 */
export function calcularPerjuiciosMoralesContencioso(
  smmlvVigente: number,
  nivelCercania: number,
  porcentajeAplicado: number
): ResultadoPerjuiciosMorales {
  const nivel = Math.max(1, Math.min(5, Math.round(nivelCercania)));
  const topeSMMLV = TOPES_SMMLV_CONTENCIOSO[nivel];
  const valorSMMLV = topeSMMLV * porcentajeAplicado;
  const valorPesos = valorSMMLV * smmlvVigente;

  return {
    smmlv: smmlvVigente,
    porcentajeAplicado,
    nivelCercaniaAfectiva: nivel,
    valorSMMLV: Number(valorSMMLV.toFixed(2)),
    valorPesos: Math.round(valorPesos),
    jurisdiccion: "CONTENCIOSO_ADMINISTRATIVO",
  };
}

/**
 * 6. INTERESES MORATORIOS
 *
 * Tasa legal: 6% anual (Art. 1617 del Código Civil colombiano).
 * Se causan desde la ejecutoria de la sentencia hasta la fecha de pago.
 *
 * Fórmula: I = C × r × t
 * donde r = 0.06 / 360 (tasa diaria) y t = días de mora.
 *
 * Nota: En Colombia el interés moratorio legal civil es simple, no compuesto.
 * No confundir con el interés bancario corriente (que aplica en materia comercial).
 *
 * @param capital - Monto de capital sobre el cual se calculan intereses
 * @param diasMora - Número de días transcurridos desde ejecutoria hasta pago
 */
export function calcularInteresMoratorio(
  capital: number,
  diasMora: number
): ResultadoInteresMoratorio {
  const tasaAnual = 0.06;
  // Interés simple: I = C × (tasa anual / 360) × días
  const tasaDiaria = tasaAnual / 360;
  const valorInteres = capital * tasaDiaria * diasMora;
  const mesesMora = diasMora / 30;

  return {
    capital,
    tasaAnual,
    diasMora,
    mesesMora: Number(mesesMora.toFixed(2)),
    valorInteres: Math.round(valorInteres),
  };
}

/**
 * 9. INTERESES MORATORIOS COMERCIALES (Art. 884 Código de Comercio)
 *
 * Aplica para obligaciones de naturaleza mercantil, incluyendo contratos de
 * seguro, transporte, compraventa mercantil, etc.
 *
 * Tasa de mora comercial = 1.5 × interés bancario corriente certificado
 * por la Superintendencia Financiera de Colombia.
 *
 * Fórmula: I = C × tasaMoraDiaria × días
 * donde tasaMoraDiaria = (tasaBancariaCorrienteMensual × 1.5 × 12) / 360
 *
 * Fuente jurídica: Art. 884 del Código de Comercio colombiano.
 * La tasa bancaria corriente es certificada trimestralmente por la
 * Superfinanciera (Resolución periódica).
 *
 * @param capital - Monto de capital adeudado
 * @param diasMora - Días transcurridos desde el vencimiento de la obligación
 * @param tasaBancariaCorrienteMensual - Tasa mensual vigente (ej: 0.0182 para 1.82%)
 */
export function calcularInteresMoratorioComercial(
  capital: number,
  diasMora: number,
  tasaBancariaCorrienteMensual: number
): ResultadoInteresMoratorio {
  // Tasa de mora = 1.5 veces la tasa bancaria corriente
  const tasaMoraMensual = tasaBancariaCorrienteMensual * 1.5;
  const tasaMoraAnual = tasaMoraMensual * 12;
  const tasaDiaria = tasaMoraAnual / 360;
  const valorInteres = capital * tasaDiaria * diasMora;
  const mesesMora = diasMora / 30;

  return {
    capital,
    tasaAnual: Number(tasaMoraAnual.toFixed(6)),
    diasMora,
    mesesMora: Number(mesesMora.toFixed(2)),
    valorInteres: Math.round(valorInteres),
  };
}

/**
 * 7. FUNCIÓN AUXILIAR: Calcular meses entre dos fechas
 *
 * Calcula la diferencia en meses completos + fracción proporcional de días.
 * Útil para determinar el período del lucro cesante consolidado o futuro.
 *
 * @param fechaInicio - Fecha del hecho dañoso o inicio del período
 * @param fechaFin - Fecha de la sentencia o fin del período
 */
export function calcularMesesEntreFechas(
  fechaInicio: Date,
  fechaFin: Date
): number {
  const anios = fechaFin.getFullYear() - fechaInicio.getFullYear();
  const meses = fechaFin.getMonth() - fechaInicio.getMonth();
  const dias = fechaFin.getDate() - fechaInicio.getDate();

  // Meses completos + fracción de días sobre 30
  const totalMeses = anios * 12 + meses + dias / 30;
  return Number(Math.max(0, totalMeses).toFixed(2));
}

/**
 * 8. FUNCIÓN AUXILIAR: SMMLV vigente por año
 *
 * Retorna el Salario Mínimo Mensual Legal Vigente para Colombia
 * según el año indicado. Datos hardcodeados desde 2020 hasta 2026.
 *
 * Fuente: Decretos anuales del Gobierno Nacional de Colombia.
 *   2020: Decreto 2360/2019 → $877.803
 *   2021: Decreto 1785/2020 → $908.526
 *   2022: Decreto 1724/2021 → $1.000.000
 *   2023: Decreto 2613/2022 → $1.160.000
 *   2024: Decreto 2292/2023 → $1.300.000
 *   2025: Decreto 2641/2024 → $1.423.500
 *   2026: Decreto 1469/2025 → $1.750.905
 *
 * @param anio - Año para consultar el SMMLV
 * @returns Valor del SMMLV en pesos colombianos
 * @throws Error si el año no está disponible
 */
export function getSMMLV(anio: number): number {
  const valor = SMMLV_POR_ANIO[anio];
  if (!valor) {
    throw new Error(
      `SMMLV no disponible para el año ${anio}. Años disponibles: ${Object.keys(SMMLV_POR_ANIO).join(", ")}`
    );
  }
  return valor;
}

/**
 * 8B. FUNCIÓN AUXILIAR: SMMLV desde base de datos (async, para componentes cliente)
 *
 * Llama a la API /api/smmlv/[anio] para obtener el valor de BD.
 * Si la llamada falla, usa getSMMLV() como fallback con valores hardcodeados.
 *
 * @param anio - Año para consultar el SMMLV
 * @returns Valor del SMMLV en pesos colombianos
 */
export async function getSMMLVFromDB(anio: number): Promise<number> {
  try {
    const res = await fetch(`/api/smmlv/${anio}`);
    if (res.ok) {
      const data = await res.json();
      return data.valor;
    }
  } catch {
    // fallback silencioso
  }
  return getSMMLV(anio);
}

/**
 * 8C. FUNCIÓN AUXILIAR: Auxilio de transporte por año
 *
 * Retorna el valor del auxilio de transporte colombiano para el año indicado.
 * Solo aplica a trabajadores cuyo salario no supere 2 SMMLV.
 *
 * Fuente: Decretos anuales del Gobierno Nacional de Colombia.
 *
 * @param anio - Año para consultar el auxilio de transporte
 * @returns Valor del auxilio en pesos colombianos
 * @throws Error si el año no está disponible
 */
export function getAuxilioTransporte(anio: number): number {
  const valor = AUXILIO_TRANSPORTE_POR_ANIO[anio];
  if (!valor) {
    throw new Error(
      `Auxilio de transporte no disponible para el año ${anio}. Años disponibles: ${Object.keys(AUXILIO_TRANSPORTE_POR_ANIO).join(", ")}`
    );
  }
  return valor;
}

/**
 * Retorna los años disponibles para auxilio de transporte.
 */
export function getAniosAuxilioTransporte(): number[] {
  return Object.keys(AUXILIO_TRANSPORTE_POR_ANIO).map(Number).sort((a, b) => a - b);
}
