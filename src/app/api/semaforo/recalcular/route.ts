import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { calcularEstadoTermino } from "@/lib/semaforo";

export async function POST() {
  try {
    const hitos = await db.hitoProcesal.findMany({
      where: {
        plazoVencimiento: { not: null },
        overrideManual: false,
      },
      select: {
        id: true,
        plazoVencimiento: true,
        estadoTermino: true,
      },
    });

    let actualizados = 0;

    for (const hito of hitos) {
      const nuevoEstado = calcularEstadoTermino(hito.plazoVencimiento);
      if (nuevoEstado !== hito.estadoTermino) {
        await db.hitoProcesal.update({
          where: { id: hito.id },
          data: { estadoTermino: nuevoEstado },
        });
        actualizados++;
      }
    }

    return NextResponse.json({
      mensaje: `Semaforos recalculados: ${actualizados} hitos actualizados de ${hitos.length} evaluados.`,
      actualizados,
      evaluados: hitos.length,
    });
  } catch (error) {
    console.error("Error recalculando semaforos:", error);
    return NextResponse.json(
      { error: "Error al recalcular semaforos" },
      { status: 500 }
    );
  }
}
