import { NextRequest, NextResponse } from "next/server";
import { buildMundialData } from "@/lib/reports/generators/mundialGenerator";
import { generateMundialDocxBuffer } from "@/lib/reports/templates/docx/MundialDOCX";

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

    const data = await buildMundialData(procesoId);
    const buffer = await generateMundialDocxBuffer(data);

    const filename = `informe-mundial-${data.radicado.replace(/\s/g, "-")}.docx`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error generando DOCX Mundial:", error);
    const message =
      error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: `Error al generar el DOCX: ${message}` },
      { status: 500 }
    );
  }
}
