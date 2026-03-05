import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { calcularEstadoTermino } from "@/lib/semaforo";

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

    const hitos = await db.hitoProcesal.findMany({
      where: { procesoId: params.id },
      orderBy: { fecha: "desc" },
    });

    return NextResponse.json(hitos);
  } catch (error) {
    console.error("Error fetching hitos:", error);
    return NextResponse.json(
      { error: "Error al obtener los hitos" },
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
    const {
      tipo_actuacion,
      fecha,
      descripcion,
      plazo_vencimiento,
      estado_termino,
    } = body;

    if (!tipo_actuacion || !fecha || !descripcion) {
      return NextResponse.json(
        { error: "Faltan campos requeridos: tipo_actuacion, fecha, descripcion" },
        { status: 400 }
      );
    }

    const parsedPlazo = plazo_vencimiento
      ? new Date(plazo_vencimiento)
      : null;

    const estadoCalculado = calcularEstadoTermino(parsedPlazo);

    // Si el body trae estado_termino distinto al calculado, es override manual.
    // Si no trae estado_termino, usar el calculado automaticamente.
    const isManualOverride = !!estado_termino && estado_termino !== estadoCalculado;
    const resolvedEstado = estado_termino || estadoCalculado;

    const hito = await db.hitoProcesal.create({
      data: {
        procesoId: params.id,
        tipoActuacion: tipo_actuacion,
        fecha: new Date(fecha),
        descripcion,
        plazoVencimiento: parsedPlazo,
        estadoTermino: resolvedEstado,
        overrideManual: isManualOverride,
      },
    });

    return NextResponse.json(hito, { status: 201 });
  } catch (error) {
    console.error("Error creating hito:", error);
    return NextResponse.json(
      { error: "Error al crear el hito" },
      { status: 500 }
    );
  }
}
