import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { buildZurichData } from "@/lib/reports/generators/zurichGenerator";
import { ZurichPDFDocument } from "@/lib/reports/templates/pdf/ZurichPDF";

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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const element = React.createElement(ZurichPDFDocument, { data }) as any;
    const buffer = await renderToBuffer(element);

    const filename = `informe-zurich-${data.radicado.replace(/\s/g, "-")}.pdf`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "X-Extraido-Documento": data.extraidoDeDocumento ? "true" : "false",
      },
    });
  } catch (error) {
    console.error("Error generando PDF Zurich:", error);
    const message =
      error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: `Error al generar el PDF: ${message}` },
      { status: 500 }
    );
  }
}
