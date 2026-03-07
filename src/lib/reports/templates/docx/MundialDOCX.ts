import {
  Document,
  Paragraph,
  TextRun,
  AlignmentType,
  BorderStyle,
  PageNumber,
  Footer,
  Header,
  Packer,
} from "docx";
import type { MundialInformeData } from "../../types/mundial";

const TEAL = "008080";
const BLACK = "060606";
const GRAY = "888888";

function field(label: string, value: string): Paragraph[] {
  return [
    new Paragraph({
      spacing: { before: 120 },
      children: [
        new TextRun({
          text: label,
          bold: true,
          font: "Calibri",
          size: 18,
          color: BLACK,
          allCaps: true,
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 80 },
      children: [
        new TextRun({
          text: value,
          font: "Calibri",
          size: 19,
          color: BLACK,
        }),
      ],
    }),
  ];
}

function separator(): Paragraph {
  return new Paragraph({
    spacing: { before: 60, after: 60 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 2, color: "E0E0E0" },
    },
    children: [],
  });
}

export function buildMundialDocx(data: MundialInformeData): Document {
  const fechaGeneracion = new Date().toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const riesgoLabel =
    data.calificacionRiesgo === "PROBABLE"
      ? "[PROBABLE]  Eventual  Remota"
      : data.calificacionRiesgo === "EVENTUAL"
        ? "Probable  [EVENTUAL]  Remota"
        : "Probable  Eventual  [REMOTA]";

  return new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 720, bottom: 720, left: 900, right: 900 },
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
                text: "COMPAÑÍA MUNDIAL DE SEGUROS S.A.",
                font: "Calibri",
                size: 20,
                color: BLACK,
              }),
            ],
          }),

          // Identificación
          ...field("RADICADO", data.radicado),
          ...field("JUZGADO / TRIBUNAL / ÁRBITRO", data.juzgado),
          ...field("CLASE DE PROCESO", data.claseProceso),
          separator(),

          // Partes
          ...field("DEMANDANTE", data.demandante),
          ...field("DEMANDADO", data.demandado),
          ...field("AFIANZADO", data.afianzado),
          separator(),

          // Póliza
          ...field("SUCURSAL PÓLIZA", data.sucursalPoliza),
          ...field("NÚMERO DE PÓLIZA", data.numeroPoliza),
          ...field("OBJETO DE LA PÓLIZA", data.objetoPoliza),
          ...field("RAMO", data.ramo),
          ...field("VIGENCIA DE LA PÓLIZA", data.vigenciaPoliza),
          ...field("VALOR ASEGURADO", data.valorAsegurado),
          separator(),

          // Pretensiones
          ...field("PRETENSIONES", data.pretensiones),
          ...field("EXCEPCIONES PROPUESTAS", data.excepcionesPropuestas),
          separator(),

          // Riesgo y estado
          ...field("CALIFICACIÓN DE RIESGO", riesgoLabel),
          ...field("ESTADO ACTUAL", data.estadoActual),
          ...field("ÚLTIMAS ACTUACIONES", data.ultimasActuaciones),
          ...field("PRÓXIMOS VENCIMIENTOS", data.proximosVencimientos),
          separator(),

          // Cierre
          ...field("PROPUESTA DE HONORARIOS", data.propuestaHonorarios),
          ...field("OBSERVACIONES", data.observaciones),

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

export async function generateMundialDocxBuffer(
  data: MundialInformeData
): Promise<Buffer> {
  const doc = buildMundialDocx(data);
  return Buffer.from(await Packer.toBuffer(doc));
}
