import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const search = request.nextUrl.searchParams.get("search") || "";

    const clientes = await db.cliente.findMany({
      where: search && search.trim().length > 0
        ? { nombre: { contains: search.trim(), mode: 'insensitive' as const } }
        : {},
      select: {
        id: true,
        nombre: true,
        nit: true,
        tipo: true,
        plantillaInforme: true,
      },
      orderBy: { nombre: "asc" },
      take: 15,
    });

    return NextResponse.json(clientes);
  } catch (error) {
    console.error("[API /clientes] Error:", error);
    return NextResponse.json(
      { error: "Error al obtener los clientes" },
      { status: 500 }
    );
  }
}
