import { NextRequest, NextResponse } from 'next/server';
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
      // Find the first org and client to use as defaults
      const org = await db.organizacion.findFirst({ where: { activa: true } });
      if (!org) {
        return NextResponse.json(
          { error: 'No se encontró una organización activa' },
          { status: 400 }
        );
      }

      const cliente = await db.cliente.findFirst({
        where: { organizacionId: org.id, activo: true },
      });
      if (!cliente) {
        return NextResponse.json(
          { error: 'No se encontró un cliente activo' },
          { status: 400 }
        );
      }

      const radicado = resultado?.radicado || `TEMP-${Date.now()}`;

      // Check for duplicate radicado
      const existing = await db.proceso.findUnique({ where: { radicado } });

      // Map especialidad to TipoProceso enum
      const especialidadMap: Record<string, string> = {
        civil: 'CIVIL',
        administrativo: 'CONTENCIOSO_ADMINISTRATIVO',
        laboral: 'LABORAL',
        penal: 'PENAL',
        arbitral: 'ARBITRAL',
        ejecutivo: 'EJECUTIVO',
        disciplinario: 'DISCIPLINARIO',
        constitucional: 'CONSTITUCIONAL',
      };
      const esp = (resultado?.jurisdiccionJuzgado?.especialidad || '').toLowerCase();
      const tipoProceso = especialidadMap[esp] || 'CIVIL';

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
          demandante: resultado?.partes?.demandantes?.[0]?.nombre || undefined,
          demandado: resultado?.partes?.demandados?.[0]?.nombre || undefined,
          cuantia: resultado?.cuantiaGlobal?.valor || undefined,
          descripcion: 'Proceso creado desde análisis IA',
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

    // Create Documento references
    const nombreDoc = nombreAnalisis || 'Documento analizado';
    await db.documento.create({
      data: {
        procesoId: targetProcesoId,
        nombre: `Demanda - ${nombreDoc}`,
        tipo: 'demanda',
        url: `/api/ai/analisis/${analisis.id}`,
        descripcion: 'Cargado automaticamente desde analisis IA',
      },
    });

    await db.documento.create({
      data: {
        procesoId: targetProcesoId,
        nombre: `Ficha Tecnica IA - ${nombreDoc}`,
        tipo: 'analisis_ia',
        url: `/ai/extraer?analisisId=${analisis.id}`,
        descripcion: 'Ficha tecnica generada automaticamente por analisis IA',
      },
    });

    // Create TareaIA for each próximo paso
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

    return NextResponse.json({
      procesoId: targetProcesoId,
      analisisId: analisis.id,
      tareasCreadas: pasos.length,
    });
  } catch (error: any) {
    console.error('[guardar-analisis] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Error al guardar el análisis' },
      { status: 500 }
    );
  }
}
