import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const abogados = await db.abogado.findMany({
      where: { activo: true },
      select: { id: true, nombre: true, rol: true, especialidad: true },
      orderBy: { nombre: "asc" },
    });
    return NextResponse.json(abogados);
  } catch (error) {
    console.error("Error fetching abogados:", error);
    return NextResponse.json(
      { error: "Error al obtener los abogados" },
      { status: 500 }
    );
  }
}
