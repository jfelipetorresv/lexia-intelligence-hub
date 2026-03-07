import { NextRequest, NextResponse } from "next/server";
import { buildHdiData } from "@/lib/reports/generators/hdiGenerator";
import { generateHdiDocxBuffer } from "@/lib/reports/templates/docx/HdiDOCX";

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

    const data = await buildHdiData(procesoId);
    const buffer = await generateHdiDocxBuffer(data);

    const filename = `informe-hdi-${data.radicado.replace(/\s/g, "-")}.docx`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error generando DOCX HDI:", error);
    const message =
      error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: `Error al generar el DOCX: ${message}` },
      { status: 500 }
    );
  }
}
