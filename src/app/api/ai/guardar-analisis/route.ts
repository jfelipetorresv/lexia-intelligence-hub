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

      const cliente = await db.cliente.findFirst({
        where: { organizacionId: org.id, activo: true },
      });
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
