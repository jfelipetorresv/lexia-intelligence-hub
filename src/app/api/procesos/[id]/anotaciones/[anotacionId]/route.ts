import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; anotacionId: string } }
) {
  try {
    const { contenido } = await request.json();
    if (!contenido || !contenido.trim()) {
      return NextResponse.json(
        { error: "El contenido es requerido" },
        { status: 400 }
      );
    }

    const anotacion = await db.anotacion.update({
      where: { id: params.anotacionId },
      data: { contenido: contenido.trim() },
    });

    return NextResponse.json(anotacion);
  } catch (error) {
    console.error("[anotaciones] Error PATCH:", error);
    return NextResponse.json(
      { error: "Error al actualizar anotación" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string; anotacionId: string } }
) {
  try {
    await db.anotacion.delete({
      where: { id: params.anotacionId },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[anotaciones] Error DELETE:", error);
    return NextResponse.json(
      { error: "Error al eliminar anotación" },
      { status: 500 }
    );
  }
}
