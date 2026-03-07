import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: { anio: string; mes: string } }
) {
  try {
    const anio = parseInt(params.anio, 10);
    const mes = parseInt(params.mes, 10);

    if (isNaN(anio) || isNaN(mes)) {
      return NextResponse.json(
        { error: "anio y mes deben ser números válidos" },
        { status: 400 }
      );
    }

    if (mes < 1 || mes > 12) {
      return NextResponse.json(
        { error: "El mes debe estar entre 1 y 12" },
        { status: 400 }
      );
    }

    const indice = await db.indiceIPC.findUnique({
      where: { anio_mes: { anio, mes } },
    });

    if (!indice) {
      return NextResponse.json(
        { error: `No se encontró índice IPC para ${anio}-${String(mes).padStart(2, "0")}` },
        { status: 404 }
      );
    }

    return NextResponse.json(indice);
  } catch (error) {
    console.error("Error fetching índice IPC:", error);
    return NextResponse.json(
      { error: "Error al obtener el índice IPC" },
      { status: 500 }
    );
  }
}
