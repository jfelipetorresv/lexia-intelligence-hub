import React from "react";
import { Resend } from "resend";
import { render } from "@react-email/render";
import { AlertaVencimientoEmail } from "./templates/alerta-vencimiento";
import { formatRadicado } from "@/lib/formato";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ?? "Lexia Hub <onboarding@resend.dev>";

interface SendAlertaParams {
  to: string;
  abogadoNombre: string;
  procesoId: string;
  radicado: string;
  demandante: string;
  demandado: string;
  tipoActuacion: string;
  fechaVencimiento: Date;
  diasRestantes: number;
  estadoTermino: "ROJO" | "NARANJA";
}

export async function sendAlertaVencimiento(params: SendAlertaParams) {
  const radicadoFmt = formatRadicado(params.radicado);

  const subject =
    params.estadoTermino === "ROJO"
      ? `URGENTE: Vence hoy o ya vencio - ${radicadoFmt}`
      : `Termino proximo a vencer - ${radicadoFmt}`;

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const procesoUrl = `${appUrl}/procesos/${params.procesoId}`;

  const fechaFmt = new Date(params.fechaVencimiento).toLocaleDateString(
    "es-CO",
    { day: "2-digit", month: "long", year: "numeric" }
  );

  const html = await render(
    <AlertaVencimientoEmail
      abogadoNombre={params.abogadoNombre}
      procesoNombre={`${params.demandante ?? "N/A"} vs. ${params.demandado ?? "N/A"}`}
      radicado={radicadoFmt}
      tipoActuacion={params.tipoActuacion}
      fechaVencimiento={fechaFmt}
      diasRestantes={params.diasRestantes}
      estadoTermino={params.estadoTermino}
      procesoUrl={procesoUrl}
    />
  );

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: params.to,
    subject,
    html,
  });

  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }

  return data;
}
