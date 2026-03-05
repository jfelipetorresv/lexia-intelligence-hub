import { NextRequest, NextResponse } from "next/server";
import { resolveFolderPath } from "@/lib/onedrive";

export async function GET(request: NextRequest) {
  try {
    const itemId = request.nextUrl.searchParams.get("itemId");
    if (!itemId) {
      return NextResponse.json({ error: "itemId requerido" }, { status: 400 });
    }

    const path = await resolveFolderPath(itemId);
    if (!path) {
      return NextResponse.json({ error: "No se pudo resolver la ruta" }, { status: 404 });
    }

    return NextResponse.json({ path });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[resolve-path] Error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
