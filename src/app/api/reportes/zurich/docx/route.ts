import { NextRequest, NextResponse } from "next/server";
import { buildZurichData } from "@/lib/reports/generators/zurichGenerator";
import { generateZurichDocxBuffer } from "@/lib/reports/templates/docx/ZurichDOCX";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const procesoId = request.nextUrl.searchParams.get("procesoId");
    if (!procesoId) {
      return NextResponse.json(
        { error: "Falta el parámetro procesoId" },
        { status: 400 }
      );
    }

    const tipoParam = request.nextUrl.searchParams.get("tipo");
    const tipo: "INICIAL" | "INTERMEDIO" =
      tipoParam === "INICIAL" ? "INICIAL" : "INTERMEDIO";

    const data = await buildZurichData(procesoId, tipo);
    const buffer = await generateZurichDocxBuffer(data);

    const filename = `informe-zurich-${data.radicado.replace(/\s/g, "-")}.docx`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "X-Extraido-Documento": data.extraidoDeDocumento ? "true" : "false",
      },
    });
  } catch (error) {
    console.error("Error generando DOCX Zurich:", error);
    const message =
      error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: `Error al generar el DOCX: ${message}` },
      { status: 500 }
    );
  }
}
