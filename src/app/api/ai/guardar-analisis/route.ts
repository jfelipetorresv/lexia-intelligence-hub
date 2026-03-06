import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { procesoId, crearProceso, datosBasicos, textoExtraido, resultado, proximosPasos, tipoAnalisis, nombreAnalisis } = body;

    if (!textoExtraido || !resultado) {
      return NextResponse.json(
        { error: 'Se requiere textoExtraido y resultado' },
        { status: 400 }
      );
    }

    let targetProcesoId = procesoId;

    if (crearProceso) {
      const org = await db.organizacion.findFirst({ where: { activa: true } });
      if (!org) {
        return NextResponse.json(
          { error: 'No se encontro una organizacion activa' },
          { status: 400 }
        );
      }

      let cliente;
      if (body.clienteId) {
        cliente = await db.cliente.findUnique({ where: { id: body.clienteId } });
      }
      if (!cliente) {
        cliente = await db.cliente.findFirst({
          where: { organizacionId: org.id, activo: true },
        });
      }
      if (!cliente) {
        return NextResponse.json(
          { error: 'No se encontro un cliente activo' },
          { status: 400 }
        );
      }

      const radicado = resultado?.radicado || `TEMP-${Date.now()}`;
      const existing = await db.proceso.findUnique({ where: { radicado } });

      // Infer tipoProceso from AI result using includes() for resilience
      const inferirTipoProceso = (): string => {
        const j = (
          resultado?.tipoProceso ||
          resultado?.jurisdiccionJuzgado?.jurisdiccion ||
          resultado?.jurisdiccionJuzgado?.especialidad ||
          ''
        ).toLowerCase().trim();
        if (j.includes('arbitr')) return 'ARBITRAL';
        if (j.includes('contencioso') || j.includes('administrativ')) return 'CONTENCIOSO_ADMINISTRATIVO';
        if (j.includes('penal')) return 'PENAL';
        if (j.includes('laboral')) return 'LABORAL';
        if (j.includes('ejecutiv')) return 'EJECUTIVO';
        if (j.includes('disciplin')) return 'DISCIPLINARIO';
        if (j.includes('constitucional') || j.includes('tutela')) return 'CONSTITUCIONAL';
        if (j.includes('fiscal')) return 'RESPONSABILIDAD_FISCAL';
        if (j.includes('sancionatori')) return 'PROCEDIMIENTO_ADMINISTRATIVO_SANCIONATORIO';
        if (j.includes('civil') || j.includes('comerci')) return 'CIVIL';
        return 'CIVIL';
      };
      const tipoProceso = inferirTipoProceso();

      // Extract values with safe fallbacks
      const demandanteVal = resultado?.partes?.demandantes?.[0]?.nombre ?? null;
      const demandadoVal = resultado?.partes?.demandados?.[0]?.nombre ?? null;
      const cuantiaRaw = resultado?.cuantiaGlobal?.valor;
      const cuantiaVal = cuantiaRaw != null && !isNaN(Number(cuantiaRaw))
        ? new Prisma.Decimal(cuantiaRaw)
        : null;

      console.log('[guardar-analisis] Creando proceso:', {
        tipoProceso, demandanteVal, demandadoVal, cuantiaVal: cuantiaVal?.toString(), radicado,
      });

      const nuevoProceso = await db.proceso.create({
        data: {
          organizacionId: org.id,
          clienteId: cliente.id,
          radicado: existing ? `${radicado}-${Date.now()}` : radicado,
          tipoProceso: tipoProceso as any,
          estadoActual: 'ACTIVO',
          fechaApertura: new Date(),
          juzgado: resultado?.jurisdiccionJuzgado?.juzgado || 'Por definir',
          ciudad: resultado?.jurisdiccionJuzgado?.ciudad || undefined,
          demandante: demandanteVal,
          demandado: demandadoVal,
          cuantia: cuantiaVal,
          descripcion: 'Proceso creado desde analisis IA',
        },
      });

      targetProcesoId = nuevoProceso.id;
    }

    if (!targetProcesoId) {
      return NextResponse.json(
        { error: 'Se requiere procesoId o crearProceso: true' },
        { status: 400 }
      );
    }

    // Create AnalisisIA
    const analisis = await db.analisisIA.create({
      data: {
        procesoId: targetProcesoId,
        contenidoRaw: textoExtraido,
        resultado: resultado,
        estado: 'completado',
        tipo: tipoAnalisis || 'demanda_principal',
        nombre: nombreAnalisis || null,
      },
    });

    // Create Documento references — wrapped in try/catch so analysis save is not blocked
    const nombreDoc = nombreAnalisis || 'Analisis IA';
    try {
      await db.documento.create({
        data: {
          procesoId: targetProcesoId,
          nombre: `Demanda - ${nombreDoc}`,
          tipo: 'demanda',
          url: `/api/ai/analisis/${analisis.id}`,
          descripcion: 'Vinculado automaticamente desde analisis IA',
        },
      });
    } catch (e) {
      console.error('Error creando documento demanda:', e);
    }

    try {
      await db.documento.create({
        data: {
          procesoId: targetProcesoId,
          nombre: `Ficha Tecnica IA - ${nombreDoc}`,
          tipo: 'analisis_ia',
          url: `/ai/extraer?analisisId=${analisis.id}`,
          descripcion: 'Ficha tecnica generada automaticamente por analisis IA',
        },
      });
    } catch (e) {
      console.error('Error creando documento ficha tecnica:', e);
    }

    // Create TareaIA for each proximo paso
    const pasos: string[] = proximosPasos ?? [];
    if (pasos.length > 0) {
      await db.tareaIA.createMany({
        data: pasos.map((titulo: string, index: number) => ({
          procesoId: targetProcesoId,
          analisisId: analisis.id,
          titulo,
          completada: false,
          orden: index,
        })),
      });
    }

    // Create Asignacion records for abogado líder and apoyo
    if (body.abogadoLiderId) {
      try {
        await db.asignacion.create({
          data: {
            procesoId: targetProcesoId,
            abogadoId: body.abogadoLiderId,
            rolEnCaso: 'LIDER',
          },
        });
      } catch (e: any) {
        console.error('[guardar-analisis] Error asignacion líder:', e.message);
      }

      // Send email notification to abogado líder
      try {
        const abogado = await db.abogado.findUnique({
          where: { id: body.abogadoLiderId },
          select: { nombre: true, email: true },
        });
        if (abogado?.email) {
          const { Resend } = await import('resend');
          const resend = new Resend(process.env.RESEND_API_KEY);
          const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
          const radicado = resultado?.radicado || 'Sin radicado';
          const demandante = resultado?.partes?.demandantes?.[0]?.nombre ?? 'N/A';
          const demandado = resultado?.partes?.demandados?.[0]?.nombre ?? 'N/A';
          const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'Lexia Hub <onboarding@resend.dev>';

          await resend.emails.send({
            from: fromEmail,
            to: abogado.email,
            subject: `Nuevo expediente asignado: ${radicado}`,
            html: `
              <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px;">
                <h2 style="color: #008080; margin-bottom: 16px;">Nuevo expediente asignado</h2>
                <p style="color: #333; font-size: 15px;">Hola <strong>${abogado.nombre}</strong>,</p>
                <p style="color: #333; font-size: 15px;">Se te ha asignado como abogado l&iacute;der en un nuevo expediente creado desde an&aacute;lisis IA:</p>
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                  <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Radicado</td>
                    <td style="padding: 8px 0; font-weight: 600; font-size: 14px;">${radicado}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Partes</td>
                    <td style="padding: 8px 0; font-size: 14px;">${demandante} vs. ${demandado}</td>
                  </tr>
                </table>
                <a href="${appUrl}/procesos/${targetProcesoId}" style="display: inline-block; background: #008080; color: white; padding: 10px 24px; border-radius: 4px; text-decoration: none; font-size: 14px; font-weight: 500;">Ver expediente</a>
                <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">Lexia Intelligence Hub</p>
              </div>
            `,
          });
          console.log('[guardar-analisis] Email enviado a:', abogado.email);
        }
      } catch (emailErr: any) {
        console.error('[guardar-analisis] Error enviando email (no bloqueante):', emailErr.message);
      }
    }
    if (body.abogadoApoyoId) {
      try {
        await db.asignacion.create({
          data: {
            procesoId: targetProcesoId,
            abogadoId: body.abogadoApoyoId,
            rolEnCaso: 'APOYO',
          },
        });
      } catch (e: any) {
        console.error('[guardar-analisis] Error asignacion apoyo:', e.message);
      }
    }

    return NextResponse.json({
      procesoId: targetProcesoId,
      analisisId: analisis.id,
      tareasCreadas: pasos.length,
    });
  } catch (error: any) {
    console.error('[guardar-analisis] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Error al guardar el analisis' },
      { status: 500 }
    );
  }
}
