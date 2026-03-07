import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const anotaciones = await db.anotacion.findMany({
      where: { procesoId: params.id },
      orderBy: { creadoEn: "desc" },
    });
    return NextResponse.json(anotaciones);
  } catch (error) {
    console.error("[anotaciones] Error GET:", error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `Error al obtener anotaciones: ${msg}` },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { contenido } = await request.json();
    if (!contenido || !contenido.trim()) {
      return NextResponse.json(
        { error: "El contenido es requerido" },
        { status: 400 }
      );
    }

    const anotacion = await db.anotacion.create({
      data: {
        procesoId: params.id,
        contenido: contenido.trim(),
      },
    });

    return NextResponse.json(anotacion, { status: 201 });
  } catch (error) {
    console.error("[anotaciones] Error POST:", error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `Error al crear anotación: ${msg}` },
      { status: 500 }
    );
  }
}
