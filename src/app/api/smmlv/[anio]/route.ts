import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: { anio: string } }
) {
  try {
    const anio = parseInt(params.anio, 10);

    if (isNaN(anio)) {
      return NextResponse.json(
        { error: "El año debe ser un número válido" },
        { status: 400 }
      );
    }

    const registro = await db.valorSMMLV.findUnique({
      where: { anio },
    });

    if (!registro) {
      return NextResponse.json(
        { error: `No se encontró valor SMMLV para el año ${anio}` },
        { status: 404 }
      );
    }

    return NextResponse.json(registro);
  } catch (error) {
    console.error("Error fetching SMMLV:", error);
    return NextResponse.json(
      { error: "Error al obtener el valor SMMLV" },
      { status: 500 }
    );
  }
}
