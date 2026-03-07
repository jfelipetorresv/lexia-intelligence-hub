import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const relations = await db.procesoCliente.findMany({
      where: { procesoId: params.id },
      include: {
        cliente: {
          select: {
            id: true,
            nombre: true,
            nit: true,
            tipo: true,
            plantillaInforme: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const clientes = relations.map((r) => r.cliente);
    return NextResponse.json(clientes);
  } catch (error) {
    console.error("Error fetching proceso clientes:", error);
    return NextResponse.json(
      { error: "Error al obtener los clientes del proceso" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { clienteId } = await request.json();

    if (!clienteId) {
      return NextResponse.json(
        { error: "clienteId es requerido" },
        { status: 400 }
      );
    }

    const existing = await db.procesoCliente.findUnique({
      where: {
        procesoId_clienteId: { procesoId: params.id, clienteId },
      },
    });

    if (existing) {
      return NextResponse.json({ message: "Relación ya existe" });
    }

    await db.procesoCliente.create({
      data: { procesoId: params.id, clienteId },
    });

    return NextResponse.json({ message: "Cliente asignado" }, { status: 201 });
  } catch (error) {
    console.error("Error assigning cliente:", error);
    return NextResponse.json(
      { error: "Error al asignar el cliente" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { clienteId } = await request.json();

    if (!clienteId) {
      return NextResponse.json(
        { error: "clienteId es requerido" },
        { status: 400 }
      );
    }

    await db.procesoCliente.deleteMany({
      where: { procesoId: params.id, clienteId },
    });

    return NextResponse.json({ message: "Cliente desvinculado" });
  } catch (error) {
    console.error("Error removing cliente:", error);
    return NextResponse.json(
      { error: "Error al desvincular el cliente" },
      { status: 500 }
    );
  }
}
