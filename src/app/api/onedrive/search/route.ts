import { NextRequest, NextResponse } from "next/server";
import { searchFolders } from "@/lib/onedrive";

export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get("q");
    if (!q || q.length < 3) {
      return NextResponse.json(
        { error: "El parámetro 'q' requiere al menos 3 caracteres" },
        { status: 400 }
      );
    }

    const basePath = request.nextUrl.searchParams.get("basePath") ?? undefined;
    const { folders } = await searchFolders(q, basePath);
    return NextResponse.json({ folders });
  } catch (error) {
    console.error("Error buscando carpetas en OneDrive:", error);
    return NextResponse.json(
      { error: "Error al buscar carpetas en OneDrive" },
      { status: 500 }
    );
  }
}
