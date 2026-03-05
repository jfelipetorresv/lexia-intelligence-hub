import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { fetchProcesos } from "@/lib/queries/procesos";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const data = await fetchProcesos({
      busqueda: searchParams.get("busqueda"),
      estado: searchParams.get("estado"),
      jurisdiccion: searchParams.get("jurisdiccion"),
      abogadoId: searchParams.get("abogadoId"),
      pagina: searchParams.get("pagina")
        ? parseInt(searchParams.get("pagina")!)
        : 1,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching procesos:", error);
    return NextResponse.json(
      { error: "Error al obtener los procesos" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      radicado,
      tipoProceso,
      claseProceso,
      estadoActual,
      fechaApertura,
      demandante,
      demandado,
      juzgado,
      ciudad,
      cuantia,
      clienteId,
      abogadoLiderId,
      descripcion,
      organizacionId,
    } = body;

    if (!radicado || !tipoProceso || !clienteId || !abogadoLiderId) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    // Check for duplicate radicado
    const existing = await db.proceso.findUnique({
      where: { radicado },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Ya existe un proceso con este radicado" },
        { status: 409 }
      );
    }

    // Get organizacionId from the client if not provided
    let orgId = organizacionId;
    if (!orgId) {
      const cliente = await db.cliente.findUnique({
        where: { id: clienteId },
        select: { organizacionId: true },
      });
      orgId = cliente?.organizacionId;
    }

    if (!orgId) {
      return NextResponse.json(
        { error: "No se pudo determinar la organización" },
        { status: 400 }
      );
    }

    const proceso = await db.proceso.create({
      data: {
        organizacionId: orgId,
        clienteId,
        radicado,
        tipoProceso,
        claseProceso: claseProceso || undefined,
        estadoActual: estadoActual || "ACTIVO",
        fechaApertura: fechaApertura ? new Date(fechaApertura) : undefined,
        demandante,
        demandado,
        juzgado,
        ciudad: ciudad || undefined,
        cuantia: cuantia ? parseFloat(cuantia) : undefined,
        descripcion: descripcion || undefined,
        asignaciones: {
          create: {
            abogadoId: abogadoLiderId,
            rolEnCaso: "LIDER",
          },
        },
      },
      select: { id: true, radicado: true },
    });

    return NextResponse.json({ proceso }, { status: 201 });
  } catch (error) {
    console.error("Error creating proceso:", error);
    return NextResponse.json(
      { error: "Error al crear el proceso" },
      { status: 500 }
    );
  }
}
