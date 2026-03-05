import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const BUCKET = "documentos-proceso";

export async function GET(request: NextRequest) {
  let path = request.nextUrl.searchParams.get("path");
  if (!path) {
    return NextResponse.json({ error: "path requerido" }, { status: 400 });
  }

  // Normalize: if old DB records stored the full public URL, extract the relative path
  if (path.startsWith("http")) {
    const marker = `${BUCKET}/`;
    const idx = path.indexOf(marker);
    if (idx !== -1) {
      path = path.slice(idx + marker.length);
    }
  }

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 60);

  if (error || !data?.signedUrl) {
    console.error("Error generando signed URL:", error);
    return NextResponse.json(
      { error: `No se pudo generar URL de descarga: ${error?.message ?? "unknown"}` },
      { status: 500 }
    );
  }

  return NextResponse.redirect(data.signedUrl);
}
