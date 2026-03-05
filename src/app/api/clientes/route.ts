import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const clientes = await db.cliente.findMany({
      where: { activo: true },
      select: { id: true, nombre: true, nit: true, tipo: true },
      orderBy: { nombre: "asc" },
    });
    return NextResponse.json(clientes);
  } catch (error) {
    console.error("Error fetching clientes:", error);
    return NextResponse.json(
      { error: "Error al obtener los clientes" },
      { status: 500 }
    );
  }
}
