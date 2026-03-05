import { NextRequest, NextResponse } from "next/server";
import { sendAlertaVencimiento } from "@/lib/email/resend";

export async function POST(request: NextRequest) {
  const apiKey = process.env.RESEND_API_KEY;
  console.log("[alerta-test] RESEND_API_KEY:", apiKey ? `${apiKey.substring(0, 8)}...` : "NO DEFINIDA");

  try {
    const body = await request.json();
    const { email, procesoId } = body;

    if (!email) {
      return NextResponse.json(
        { error: "El campo 'email' es requerido" },
        { status: 400 }
      );
    }

    const result = await sendAlertaVencimiento({
      to: email,
      abogadoNombre: "Juan Perez (prueba)",
      procesoId: procesoId ?? "test-123",
      radicado: "11001310300220230012300",
      demandante: "Empresa ABC S.A.S.",
      demandado: "Aseguradora XYZ S.A.",
      tipoActuacion: "Traslado",
      fechaVencimiento: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      diasRestantes: 2,
      estadoTermino: "ROJO",
    });

    return NextResponse.json({
      mensaje: "Correo de prueba enviado exitosamente",
      emailId: result?.id,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : "N/A";
    console.error("[alerta-test] Error message:", msg);
    console.error("[alerta-test] Error stack:", stack);
    return NextResponse.json(
      {
        error: "Error al enviar correo de prueba",
        detalle: msg,
      },
      { status: 500 }
    );
  }
}
