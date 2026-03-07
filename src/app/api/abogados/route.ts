import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const FALLBACK_ABOGADOS = [
  { id: "fallback-1", nombre: "Juan Felipe Torres", rol: "SOCIO", especialidad: null },
  { id: "fallback-2", nombre: "José Torres Varela", rol: "SOCIO", especialidad: null },
  { id: "fallback-3", nombre: "Laura Bastidas", rol: "ASOCIADA", especialidad: null },
];

export async function GET() {
  try {
    const abogados = await db.abogado.findMany({
      where: { activo: true },
      select: { id: true, nombre: true, rol: true, especialidad: true },
      orderBy: { nombre: "asc" },
    });
    return NextResponse.json(abogados.length > 0 ? abogados : FALLBACK_ABOGADOS);
  } catch (error) {
    console.error("Error fetching abogados:", error);
    return NextResponse.json(FALLBACK_ABOGADOS);
  }
}
