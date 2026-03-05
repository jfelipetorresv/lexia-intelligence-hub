import { NextRequest, NextResponse } from "next/server";
import { listFolderContents } from "@/lib/onedrive";

export async function GET(request: NextRequest) {
  try {
    let path = request.nextUrl.searchParams.get("path") ?? undefined;

    // Strip "Lexia Abogados/Procesos/" prefix if the stored path includes it
    if (path) {
      path = path.replace(/^\/?(Lexia Abogados\/Procesos)\/?/i, "");
    }

    console.log("[onedrive/files] path recibido:", request.nextUrl.searchParams.get("path"));
    console.log("[onedrive/files] path normalizado:", path);

    const files = await listFolderContents(path || undefined);
    console.log("[onedrive/files] Archivos encontrados:", files.length);
    return NextResponse.json({ files });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : "";
    console.error("[onedrive/files] Error listando archivos:", msg);
    console.error("[onedrive/files] Stack:", stack);
    return NextResponse.json(
      { error: `Error al listar archivos de OneDrive: ${msg}` },
      { status: 500 }
    );
  }
}
