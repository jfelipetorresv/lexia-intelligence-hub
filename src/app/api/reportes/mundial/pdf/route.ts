import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { buildMundialData } from "@/lib/reports/generators/mundialGenerator";
import { MundialPDFDocument } from "@/lib/reports/templates/pdf/MundialPDF";

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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const element = React.createElement(MundialPDFDocument, { data }) as any;
    const buffer = await renderToBuffer(element);

    const filename = `informe-mundial-${data.radicado.replace(/\s/g, "-")}.pdf`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error generando PDF Mundial:", error);
    const message =
      error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: `Error al generar el PDF: ${message}` },
      { status: 500 }
    );
  }
}
