import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string; calculoId: string } }
) {
  try {
    const calculo = await db.calculoFinanciero.findFirst({
      where: {
        id: params.calculoId,
        procesoId: params.id,
      },
    });

    if (!calculo) {
      return NextResponse.json(
        { error: "Cálculo no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(calculo);
  } catch (error) {
    console.error("Error fetching cálculo:", error);
    return NextResponse.json(
      { error: "Error al obtener el cálculo financiero" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string; calculoId: string } }
) {
  try {
    const calculo = await db.calculoFinanciero.findFirst({
      where: {
        id: params.calculoId,
        procesoId: params.id,
      },
    });

    if (!calculo) {
      return NextResponse.json(
        { error: "Cálculo no encontrado" },
        { status: 404 }
      );
    }

    await db.calculoFinanciero.delete({
      where: { id: params.calculoId },
    });

    return NextResponse.json({ message: "Cálculo eliminado correctamente" });
  } catch (error) {
    console.error("Error deleting cálculo:", error);
    return NextResponse.json(
      { error: "Error al eliminar el cálculo financiero" },
      { status: 500 }
    );
  }
}
