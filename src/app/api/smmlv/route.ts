import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const valores = await db.valorSMMLV.findMany({
      orderBy: { anio: "desc" },
    });
    return NextResponse.json(valores);
  } catch (error) {
    console.error("Error fetching SMMLV:", error);
    return NextResponse.json(
      { error: "Error al obtener los valores SMMLV" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { anio, valor, decreto } = body;

    if (!anio || valor == null) {
      return NextResponse.json(
        { error: "Faltan campos requeridos: anio, valor" },
        { status: 400 }
      );
    }

    const existente = await db.valorSMMLV.findUnique({
      where: { anio },
    });

    if (existente) {
      return NextResponse.json(
        { error: `Ya existe un valor SMMLV para el año ${anio}` },
        { status: 400 }
      );
    }

    const registro = await db.valorSMMLV.create({
      data: {
        anio,
        valor,
        decreto: decreto || null,
      },
    });

    return NextResponse.json(registro, { status: 201 });
  } catch (error) {
    console.error("Error creating SMMLV:", error);
    return NextResponse.json(
      { error: "Error al crear el valor SMMLV" },
      { status: 500 }
    );
  }
}
