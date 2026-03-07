import {
  Document,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  WidthType,
  AlignmentType,
  BorderStyle,
  ShadingType,
  PageNumber,
  Footer,
  Header,
  Packer,
} from "docx";
import type { ZurichInformeData } from "../../types/zurich";

// ── Helpers ───────────────────────────────────────────────

const TEAL = "008080";
const BLACK = "060606";
const GRAY = "888888";
const BORDER_COLOR = "C0C0C0";
const LABEL_BG = "E8E8E8";

function border(color = BORDER_COLOR) {
  return {
    style: BorderStyle.SINGLE,
    size: 4,
    color,
  };
}

const cellBorders = {
  top: border(),
  bottom: border(),
  left: border(),
  right: border(),
};

function labelCell(text: string): TableCell {
  return new TableCell({
    width: { size: 35, type: WidthType.PERCENTAGE },
    shading: { type: ShadingType.SOLID, color: LABEL_BG, fill: LABEL_BG },
    borders: cellBorders,
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text,
            bold: true,
            font: "Calibri",
            size: 18, // 9pt × 2
            color: BLACK,
          }),
        ],
      }),
    ],
  });
}

function valueCell(text: string): TableCell {
  return new TableCell({
    width: { size: 65, type: WidthType.PERCENTAGE },
    borders: cellBorders,
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text,
            font: "Calibri",
            size: 19, // 9.5pt × 2
            color: BLACK,
          }),
        ],
      }),
    ],
  });
}

function row(label: string, value: string): TableRow {
  return new TableRow({
    children: [labelCell(label), valueCell(value)],
  });
}

// ── Build document ────────────────────────────────────────

export function buildZurichDocx(data: ZurichInformeData): Document {
  const tipoLabel =
    data.tipoInforme === "INICIAL" ? "INFORME INICIAL" : "INFORME INTERMEDIO";

  const fechaGeneracion = new Date().toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const mainTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      row("DESPACHO", data.despacho),
      row("ABOGADO ASIGNADO", data.abogadoAsignado),
      row("WORKFLOW", data.workflow),
      row("RADICADO", data.radicado),
      row("INSTANCIA DE PROCESO", data.instancia),
      row("DEMANDANTE", data.demandante),
      row("VÍCTIMA DIRECTA", data.victimaDirecta),
      row("ID VÍCTIMA DIRECTA", data.idVictimaDirecta),
      row("DEMANDADO", data.demandado),
      row("LLAMADO EN GTÍA (TERCERO CIVILMENTE RESPONSABLE)", data.llamadoEnGarantia),
      row("PÓLIZA", data.poliza),
      row("VIGENCIA DE LA PÓLIZA", data.vigenciaPoliza),
      row("RAMO", data.ramo),
      row("AMPARO", data.amparo),
      row("VALOR ASEGURADO", data.valorAsegurado),
      row("ASEGURADO", data.asegurado),
      row("SINIESTRO", data.resumenSiniestro),
      row("FECHA SINIESTRO", data.fechaSiniestro),
      row("FECHA DE NOTIFICACION", data.fechaNotificacion),
      row("COASEGURO (SI – NO) O N/A", data.coaseguro),
      row("NOMBRE COASEGURADORES", data.nombreCoaseguradores ?? "N/A"),
      row("PARTICIPACION PORCENTAJE COASEGURADORES", data.participacionCoaseguradores ?? "N/A"),
      row("¿COASEGURADOR PARTICIPA DENTRO DEL PROCESO?", data.coaseguradorParticipa ?? "N/A"),
      row("FECHA DE LA PRESENTACIÓN DE LA DEMANDA (AUTO DE APERTURA)", data.fechaPresentacionDemanda),
      row("PLACA", data.placa ?? "N/A"),
      row("RESUMEN DE LA CONTINGENCIA", data.resumenContingencia),
      row("PRETENSIONES (O VALOR DETRIMENTO RF)", data.pretensiones),
      row("CALIFICACION ARGUMENTADA DE LA CONTINGENCIA (PROBABLE, EVENTUAL Y REMOTA)", data.calificacionContingencia),
      row("MOTIVOS DE LA CALIFICACION DE LA CONTINGENCIA", data.motivosCalificacion),
      row("PRETENSIONES OBJETIVADAS (LA VERDADERA EXPOSICIÓN DE LA COMPAÑÍA)", data.pretensionesObjetivadas),
      row("TRATÁNDOSE DE PROCESOS DE RF (MOTIVACIÓN PARA NO PRESENTAR ARGUMENTOS)", data.motivacionSinArgumentosDefensa ?? ""),
      row("CALIFICACIÓN DE LA CONTINGENCIA LUEGO DE AUTO DE IMPUTACIÓN (AI)", data.calificacionLuegoAutoImputacion ?? ""),
      row("MOTIVOS DE LA CALIFICACION DE LA CONTINGENCIA LUEGO DE AI", data.motivosLuegoAutoImputacion ?? ""),
      row("OBSERVACIONES GENERALES", data.observacionesGenerales ?? ""),
      row("CALIFICACIÓN FINAL DEL PROCESO", data.calificacionFinal ?? ""),
      row("RESERVA SUGERIDA", data.reservaSugerida),
    ],
  });

  return new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720,
              bottom: 720,
              left: 900,
              right: 900,
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "LEXIA ABOGADOS",
                    bold: true,
                    font: "Calibri",
                    size: 28,
                    color: BLACK,
                  }),
                ],
              }),
              new Paragraph({
                border: {
                  bottom: { style: BorderStyle.SINGLE, size: 6, color: TEAL },
                },
                children: [
                  new TextRun({
                    text: "www.lexia.co | info@lexia.co | (317) 655-4145 | Av Cra 19 #100-45, WeWork, Bogotá",
                    font: "Calibri",
                    size: 16,
                    color: TEAL,
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: "Documento confidencial — Lexia Abogados SAS — Página ",
                    font: "Calibri",
                    size: 14,
                    color: GRAY,
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    font: "Calibri",
                    size: 14,
                    color: GRAY,
                  }),
                ],
              }),
            ],
          }),
        },
        children: [
          // Título
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 40 },
            children: [
              new TextRun({
                text: tipoLabel,
                bold: true,
                font: "Calibri",
                size: 24,
                color: BLACK,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: "ZÚRICH COLOMBIA SEGUROS S.A.",
                font: "Calibri",
                size: 20,
                color: TEAL,
              }),
            ],
          }),

          // Tabla
          mainTable,

          // Pie de generación
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 400 },
            children: [
              new TextRun({
                text: `Documento generado por Lexia Intelligence Hub el ${fechaGeneracion}`,
                font: "Calibri",
                size: 14,
                color: GRAY,
              }),
            ],
          }),
        ],
      },
    ],
  });
}

export async function generateZurichDocxBuffer(
  data: ZurichInformeData
): Promise<Buffer> {
  const doc = buildZurichDocx(data);
  return Buffer.from(await Packer.toBuffer(doc));
}
