import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { fetchProcesoById } from "@/lib/queries/procesos";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const proceso = await fetchProcesoById(params.id);

    if (!proceso) {
      return NextResponse.json(
        { error: "Proceso no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(proceso);
  } catch (error) {
    console.error("Error fetching proceso:", error);
    return NextResponse.json(
      { error: "Error al obtener el proceso" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const existing = await db.proceso.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Proceso no encontrado" },
        { status: 404 }
      );
    }

    const body = await request.json();

    const {
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
    } = body;

    const proceso = await db.proceso.update({
      where: { id: params.id },
      data: {
        tipoProceso: tipoProceso ?? undefined,
        claseProceso: claseProceso || null,
        estadoActual: estadoActual ?? undefined,
        fechaApertura: fechaApertura ? new Date(fechaApertura) : undefined,
        demandante: demandante ?? undefined,
        demandado: demandado ?? undefined,
        juzgado: juzgado ?? undefined,
        ciudad: ciudad || null,
        cuantia: cuantia ? parseFloat(cuantia) : undefined,
        clienteId: clienteId ?? undefined,
        descripcion: descripcion || null,
      },
      select: { id: true, radicado: true },
    });

    // Handle abogado líder change
    if (abogadoLiderId) {
      // Deactivate current LIDER assignment
      await db.asignacion.updateMany({
        where: {
          procesoId: params.id,
          rolEnCaso: "LIDER",
          activa: true,
        },
        data: { activa: false },
      });

      // Upsert new LIDER assignment
      const existingAssignment = await db.asignacion.findUnique({
        where: {
          procesoId_abogadoId: {
            procesoId: params.id,
            abogadoId: abogadoLiderId,
          },
        },
      });

      if (existingAssignment) {
        await db.asignacion.update({
          where: { id: existingAssignment.id },
          data: { rolEnCaso: "LIDER", activa: true },
        });
      } else {
        await db.asignacion.create({
          data: {
            procesoId: params.id,
            abogadoId: abogadoLiderId,
            rolEnCaso: "LIDER",
          },
        });
      }
    }

    return NextResponse.json({ proceso });
  } catch (error) {
    console.error("Error updating proceso:", error);
    return NextResponse.json(
      { error: "Error al actualizar el proceso" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const existing = await db.proceso.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Proceso no encontrado" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const data: Record<string, unknown> = {};

    if ("onedriveFolderPath" in body) {
      data.onedriveFolderPath = body.onedriveFolderPath;
    }

    const proceso = await db.proceso.update({
      where: { id: params.id },
      data,
      select: { id: true },
    });

    return NextResponse.json({ proceso });
  } catch (error) {
    console.error("Error patching proceso:", error);
    return NextResponse.json(
      { error: "Error al actualizar el proceso" },
      { status: 500 }
    );
  }
}
