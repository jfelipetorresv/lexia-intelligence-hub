import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { db } from '@/lib/db';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const mensajes = await db.chatMensaje.findMany({
      where: { procesoId: id },
      orderBy: { creadoEn: 'asc' },
      take: 50,
    });

    return NextResponse.json(mensajes);
  } catch (error: any) {
    console.error('[chat GET] Error:', error.message);
    return NextResponse.json({ error: 'Error al obtener mensajes' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: procesoId } = await params;

  try {
    const body = await request.json();
    const { mensaje, historial } = body as {
      mensaje: string;
      historial: Array<{ rol: string; contenido: string }>;
    };

    if (!mensaje?.trim()) {
      return NextResponse.json({ error: 'Mensaje requerido' }, { status: 400 });
    }

    // 1. Get proceso with latest AnalisisIA and hitos
    const proceso = await db.proceso.findUnique({
      where: { id: procesoId },
      include: {
        analisisIA: { orderBy: { creadoEn: 'desc' }, take: 1 },
        hitos: { orderBy: { fecha: 'desc' }, take: 10 },
        documentos: true,
        // TODO: Documento model has no textoExtraido field — if added in the future, include it here
      },
    });

    if (!proceso) {
      return NextResponse.json({ error: 'Proceso no encontrado' }, { status: 404 });
    }

    // 2. Assemble context
    const analisisReciente = proceso.analisisIA[0];
    let contexto = `=== EXPEDIENTE ===
Radicado: ${proceso.radicado ?? 'Sin radicado'}
Estado: ${proceso.estadoActual}
Juzgado: ${proceso.juzgado ?? 'No definido'}
Tipo de proceso: ${proceso.tipoProceso}
Clase de proceso: ${proceso.claseProceso ?? 'No definida'}
Ciudad: ${proceso.ciudad ?? 'No definida'}
Demandante: ${proceso.demandante ?? 'No definido'}
Demandado: ${proceso.demandado ?? 'No definido'}
Cuantia: ${proceso.cuantia ? `$ ${Number(proceso.cuantia).toLocaleString('es-CO')}` : 'No definida'}
Fecha apertura: ${proceso.fechaApertura ? new Date(proceso.fechaApertura).toLocaleDateString('es-CO') : 'No definida'}`;

    if (proceso.hitos.length > 0) {
      contexto += '\n\n=== HITOS PROCESALES RECIENTES ===';
      for (const h of proceso.hitos) {
        contexto += `\n- ${new Date(h.fecha).toLocaleDateString('es-CO')} | ${h.tipoActuacion}: ${h.descripcion ?? 'Sin descripcion'}`;
        if (h.plazoVencimiento) {
          contexto += ` (vence: ${new Date(h.plazoVencimiento).toLocaleDateString('es-CO')}, estado: ${h.estadoTermino ?? 'sin estado'})`;
        }
      }
    }

    if (analisisReciente) {
      contexto += `\n\n=== ANALISIS IA DE LA DEMANDA ===\n${JSON.stringify(analisisReciente.resultado, null, 2)}`;
    }

    // Documento model has no textoExtraido field, so we list document names only
    if (proceso.documentos.length > 0) {
      contexto += '\n\n=== DOCUMENTOS DEL EXPEDIENTE ===';
      for (const doc of proceso.documentos) {
        contexto += `\nDocumento: ${doc.nombre} (tipo: ${doc.tipo ?? 'general'})`;
      }
    } else {
      contexto += '\n\n=== DOCUMENTOS DEL EXPEDIENTE ===\nNo hay documentos procesados disponibles.';
    }

    // 3. Build messages array
    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

    // Context as first user message
    messages.push({
      role: 'user',
      content: `Este es el contexto del expediente sobre el que responderás preguntas:\n\n${contexto}\n\nConfirma que recibiste el contexto.`,
    });
    messages.push({
      role: 'assistant',
      content: 'Recibido. Tengo el contexto completo del expediente. ¿En qué puedo ayudarte?',
    });

    // Last 8 exchanges from historial (max 16 messages)
    const historialReciente = (historial || []).slice(-16);
    for (const msg of historialReciente) {
      messages.push({
        role: msg.rol === 'user' ? 'user' : 'assistant',
        content: msg.contenido,
      });
    }

    // Current message
    messages.push({ role: 'user', content: mensaje });

    // 4. Call Anthropic
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: 'Eres el asistente jurídico del despacho Lexia Abogados. Respondes preguntas sobre el expediente que se te proporciona. REGLAS: (1) Usa SOLO la información del expediente en tu contexto. (2) Si no encuentras la respuesta, dilo directamente en una línea. (3) No inventes datos. (4) Responde en español, de forma CONCISA y directa — máximo 4-6 líneas salvo que el usuario pida expresamente un resumen largo. (5) Usa negritas solo para destacar valores monetarios y fechas clave. (6) Valores monetarios en formato colombiano: $ 150.000.000. (7) Sin introducciones ni cierres — ve directo al punto.',
      messages,
    });

    const content = response.content[0];
    const respuesta = content.type === 'text' ? content.text : 'No pude generar una respuesta.';

    // 5. Save messages (fire and forget)
    db.chatMensaje.createMany({
      data: [
        { procesoId, rol: 'user', contenido: mensaje },
        { procesoId, rol: 'assistant', contenido: respuesta },
      ],
    }).catch((e: any) => console.error('[chat] Error guardando mensajes:', e.message));

    return NextResponse.json({ respuesta });
  } catch (error: any) {
    console.error('[chat POST] Error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Error al procesar el mensaje' },
      { status: 500 }
    );
  }
}
