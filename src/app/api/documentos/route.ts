import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { procesoId, nombre, url, descripcion } = body;

    if (!procesoId || !nombre || !url) {
      return NextResponse.json(
        { error: "procesoId, nombre y url son requeridos" },
        { status: 400 }
      );
    }

    const doc = await db.documento.create({
      data: {
        procesoId,
        nombre,
        url,
        tipo: "analisis_ia",
        descripcion: descripcion || null,
      },
    });

    return NextResponse.json({ documento: doc }, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Error creando documento:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
