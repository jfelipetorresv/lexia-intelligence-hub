import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { completada } = await request.json();

    if (typeof completada !== 'boolean') {
      return NextResponse.json(
        { error: 'Se requiere el campo completada (boolean)' },
        { status: 400 }
      );
    }

    const tarea = await db.tareaIA.update({
      where: { id: params.id },
      data: { completada },
    });

    return NextResponse.json(tarea);
  } catch (error: any) {
    console.error('[tareas] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Error al actualizar la tarea' },
      { status: 500 }
    );
  }
}
