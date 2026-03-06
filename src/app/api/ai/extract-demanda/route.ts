/** @ts-ignore */
import { NextRequest, NextResponse } from 'next/server';
import { extractDemanda } from '@/lib/ai/extractDemanda';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó ningún archivo' },
        { status: 400 }
      );
    }

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json(
        { error: 'El archivo debe ser un PDF' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let textoExtraido: string;
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const pdfParse = require('pdf-parse');
      const pdfData = await pdfParse(buffer);
      textoExtraido = pdfData.text;

      if (!textoExtraido || textoExtraido.trim().length < 100) {
        return NextResponse.json(
          { error: 'No se pudo extraer texto del PDF. Verifica que el PDF tenga texto seleccionable y no sea una imagen escaneada.' },
          { status: 400 }
        );
      }
    } catch (pdfError: any) {
      console.error('[extract-demanda] Error pdf-parse:', pdfError);
      return NextResponse.json(
        { error: 'Error al leer el PDF: ' + (pdfError.message || 'formato no soportado') },
        { status: 400 }
      );
    }

    const resultado = await extractDemanda(textoExtraido);

    return NextResponse.json({
      textoExtraido: textoExtraido.substring(0, 500) + '...',
      resultado,
    });

  } catch (error: any) {
    console.error('[extract-demanda] Error general:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
