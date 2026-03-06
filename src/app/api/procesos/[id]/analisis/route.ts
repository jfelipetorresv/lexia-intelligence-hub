import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const analisisList = await db.analisisIA.findMany({
      where: { procesoId: params.id },
      orderBy: { creadoEn: 'desc' },
    });

    if (analisisList.length === 0) {
      return NextResponse.json({ analisis: [], tareasPorAnalisis: {} });
    }

    const tareas = await db.tareaIA.findMany({
      where: { analisisId: { in: analisisList.map(a => a.id) } },
      orderBy: { orden: 'asc' },
    });

    const tareasPorAnalisis: Record<string, typeof tareas> = {};
    for (const a of analisisList) {
      tareasPorAnalisis[a.id] = tareas.filter(t => t.analisisId === a.id);
    }

    return NextResponse.json({ analisis: analisisList, tareasPorAnalisis });
  } catch (error: any) {
    console.error('[procesos/analisis] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Error al obtener el análisis' },
      { status: 500 }
    );
  }
}
