import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendAlertaVencimiento } from "@/lib/email/resend";
import { diasHastaVencimiento } from "@/lib/semaforo";

export async function POST() {
  try {
    const hitos = await db.hitoProcesal.findMany({
      where: {
        plazoVencimiento: { not: null },
        estadoTermino: { in: ["ROJO", "NARANJA"] },
        proceso: { estadoActual: "ACTIVO" },
      },
      include: {
        proceso: {
          select: {
            id: true,
            radicado: true,
            demandante: true,
            demandado: true,
            asignaciones: {
              where: { rolEnCaso: "LIDER", activa: true },
              include: {
                abogado: { select: { nombre: true, email: true } },
              },
              take: 1,
            },
          },
        },
      },
    });

    let enviados = 0;
    let errores = 0;
    const detalle: Array<{
      hitoId: string;
      radicado: string | null;
      email: string;
      estado: "enviado" | "error" | "sin_abogado";
      error?: string;
    }> = [];

    for (const hito of hitos) {
      const abogado = hito.proceso.asignaciones[0]?.abogado;

      if (!abogado?.email) {
        detalle.push({
          hitoId: hito.id,
          radicado: hito.proceso.radicado,
          email: "",
          estado: "sin_abogado",
        });
        continue;
      }

      const dias = diasHastaVencimiento(hito.plazoVencimiento);

      try {
        await sendAlertaVencimiento({
          to: abogado.email,
          abogadoNombre: abogado.nombre,
          procesoId: hito.proceso.id,
          radicado: hito.proceso.radicado ?? "",
          demandante: hito.proceso.demandante ?? "N/A",
          demandado: hito.proceso.demandado ?? "N/A",
          tipoActuacion: hito.tipoActuacion,
          fechaVencimiento: hito.plazoVencimiento!,
          diasRestantes: dias ?? 0,
          estadoTermino: hito.estadoTermino as "ROJO" | "NARANJA",
        });

        enviados++;
        detalle.push({
          hitoId: hito.id,
          radicado: hito.proceso.radicado,
          email: abogado.email,
          estado: "enviado",
        });
      } catch (err) {
        errores++;
        detalle.push({
          hitoId: hito.id,
          radicado: hito.proceso.radicado,
          email: abogado.email,
          estado: "error",
          error: err instanceof Error ? err.message : "Error desconocido",
        });
      }
    }

    return NextResponse.json({ enviados, errores, detalle });
  } catch (error) {
    console.error("Error enviando alertas:", error);
    return NextResponse.json(
      { error: "Error al enviar alertas de vencimiento" },
      { status: 500 }
    );
  }
}
