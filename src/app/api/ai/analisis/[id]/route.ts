import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const analisis = await db.analisisIA.findUnique({
      where: { id: params.id },
      include: {
        proceso: {
          select: { id: true, radicado: true },
        },
      },
    });

    if (!analisis) {
      return NextResponse.json(
        { error: 'Análisis no encontrado' },
        { status: 404 }
      );
    }

    const tareas = await db.tareaIA.findMany({
      where: { analisisId: analisis.id },
      orderBy: { orden: 'asc' },
    });

    return NextResponse.json({ analisis, tareas });
  } catch (error: any) {
    console.error('[ai/analisis/id] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Error al obtener el análisis' },
      { status: 500 }
    );
  }
}
