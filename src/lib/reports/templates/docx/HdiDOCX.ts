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
import type { HdiInformeData } from "../../types/hdi";

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
            size: 18,
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
            size: 19,
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

export function buildHdiDocx(data: HdiInformeData): Document {
  const fechaGeneracion = new Date().toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const mainTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      row("Radicado", data.radicado),
      row("Juzgado / Tribunal / Árbitro", data.juzgado),
      row("Clase de proceso", data.claseProces),
      row("Jurisdicción", data.jurisdiccion),
      row("Tipo de vinculación", data.tipoVinculacion),
      row("Demandante", data.demandante),
      row("Demandado", data.demandado),
      row("Asegurado / Tomador", data.aseguradoTomador),
      row("Número de póliza", data.numeroPoliza),
      row("Ramo", data.ramo),
      row("Fecha de notificación de la demanda", data.fechaNotificacionDemanda),
      row("Fecha de notificación de vinculación a HDI", data.fechaNotificacionHdi),
      row("Fecha de contestación", data.fechaContestacion),
      row("Pretensiones", data.pretensiones),
      row("Excepciones propuestas", data.excepcionesPropuestas),
      row("Estado actual del proceso", data.estadoActualProceso),
      row("Últimas actuaciones", data.ultimasActuaciones),
      row("Próximos vencimientos", data.proximosVencimientos),
      row("Valor reclamado", data.valorReclamado),
      row("Estimación de contingencia", data.estimacionContingencia),
      row("Valor propuesta conciliatoria", data.valorPropuestaConciliatoria),
      row("Observaciones del abogado", data.observacionesAbogado),
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
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 40 },
            children: [
              new TextRun({
                text: "INFORME DE PROCESO",
                bold: true,
                font: "Calibri",
                size: 24,
                color: TEAL,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: "HDI Seguros S.A. (antes Liberty Seguros)",
                font: "Calibri",
                size: 20,
                color: BLACK,
              }),
            ],
          }),
          mainTable,
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

export async function generateHdiDocxBuffer(
  data: HdiInformeData
): Promise<Buffer> {
  const doc = buildHdiDocx(data);
  return Buffer.from(await Packer.toBuffer(doc));
}
