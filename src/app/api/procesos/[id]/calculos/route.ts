import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const proceso = await db.proceso.findUnique({
      where: { id: params.id },
      select: { id: true },
    });

    if (!proceso) {
      return NextResponse.json(
        { error: "Proceso no encontrado" },
        { status: 404 }
      );
    }

    const calculos = await db.calculoFinanciero.findMany({
      where: { procesoId: params.id },
      orderBy: { creadoEn: "desc" },
    });

    return NextResponse.json(calculos);
  } catch (error) {
    console.error("Error fetching cálculos:", error);
    return NextResponse.json(
      { error: "Error al obtener los cálculos financieros" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const proceso = await db.proceso.findUnique({
      where: { id: params.id },
      select: { id: true },
    });

    if (!proceso) {
      return NextResponse.json(
        { error: "Proceso no encontrado" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { tipoCalculo, nombre, parametros, resultado, totalCalculado, notas, creadoPor } = body;

    if (!tipoCalculo || !nombre || !parametros || !resultado || totalCalculado == null) {
      return NextResponse.json(
        { error: "Faltan campos requeridos: tipoCalculo, nombre, parametros, resultado, totalCalculado" },
        { status: 400 }
      );
    }

    const calculo = await db.calculoFinanciero.create({
      data: {
        procesoId: params.id,
        tipoCalculo,
        nombre,
        parametros,
        resultado,
        totalCalculado,
        notas: notas || null,
        creadoPor: creadoPor || null,
      },
    });

    return NextResponse.json(calculo, { status: 201 });
  } catch (error) {
    console.error("Error creating cálculo:", error);
    return NextResponse.json(
      { error: "Error al crear el cálculo financiero" },
      { status: 500 }
    );
  }
}
