import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const indices = await db.indiceIPC.findMany({
      orderBy: [{ anio: "desc" }, { mes: "desc" }],
    });

    return NextResponse.json(indices);
  } catch (error) {
    console.error("Error fetching índices IPC:", error);
    return NextResponse.json(
      { error: "Error al obtener los índices IPC" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { anio, mes, valor, fuente } = body;

    if (!anio || !mes || valor == null) {
      return NextResponse.json(
        { error: "Faltan campos requeridos: anio, mes, valor" },
        { status: 400 }
      );
    }

    if (mes < 1 || mes > 12) {
      return NextResponse.json(
        { error: "El mes debe estar entre 1 y 12" },
        { status: 400 }
      );
    }

    const existente = await db.indiceIPC.findUnique({
      where: { anio_mes: { anio, mes } },
    });

    if (existente) {
      return NextResponse.json(
        { error: `Ya existe un índice IPC para ${anio}-${String(mes).padStart(2, "0")}` },
        { status: 400 }
      );
    }

    const indice = await db.indiceIPC.create({
      data: {
        anio,
        mes,
        valor,
        fuente: fuente || "DANE",
      },
    });

    return NextResponse.json(indice, { status: 201 });
  } catch (error) {
    console.error("Error creating índice IPC:", error);
    return NextResponse.json(
      { error: "Error al crear el índice IPC" },
      { status: 500 }
    );
  }
}
