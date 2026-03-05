import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { supabase } from "@/lib/supabase";

const BUCKET = "documentos-proceso";

const ACCENT_MAP: Record<string, string> = {
  á: "a", é: "e", í: "i", ó: "o", ú: "u",
  Á: "A", É: "E", Í: "I", Ó: "O", Ú: "U",
  ñ: "n", Ñ: "N",
};

function sanitizeFileName(name: string): string {
  // Separate name and extension
  const dotIdx = name.lastIndexOf(".");
  const base = dotIdx > 0 ? name.slice(0, dotIdx) : name;
  const ext = dotIdx > 0 ? name.slice(dotIdx) : "";

  let sanitized = base
    .replace(/[áéíóúÁÉÍÓÚñÑ]/g, (ch) => ACCENT_MAP[ch] ?? ch)
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_\-]/g, "");

  if (!sanitized) sanitized = "archivo";
  return sanitized + ext.toLowerCase();
}

// Ensure the storage bucket exists (runs once per cold start)
let bucketEnsured = false;
async function ensureBucket() {
  if (bucketEnsured) return;
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.some((b) => b.name === BUCKET);
  if (!exists) {
    const { error } = await supabase.storage.createBucket(BUCKET, {
      public: false,
    });
    if (error) {
      console.error("Error creando bucket:", error.message);
    } else {
      console.log(`Bucket "${BUCKET}" creado exitosamente`);
    }
  }
  bucketEnsured = true;
}

export async function GET(request: NextRequest) {
  try {
    const procesoId = request.nextUrl.searchParams.get("procesoId");
    if (!procesoId) {
      return NextResponse.json({ error: "procesoId requerido" }, { status: 400 });
    }

    const docs = await db.documentoLocal.findMany({
      where: { procesoId },
      orderBy: { creadoEn: "desc" },
    });

    return NextResponse.json({ documentos: docs });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Error listando documentos locales:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const procesoId = request.nextUrl.searchParams.get("procesoId");
    if (!procesoId) {
      return NextResponse.json({ error: "procesoId requerido" }, { status: 400 });
    }

    const ids = request.nextUrl.searchParams.get("ids");
    if (!ids) {
      return NextResponse.json({ error: "ids requerido" }, { status: 400 });
    }

    const idList = ids.split(",").filter(Boolean);
    if (idList.length === 0) {
      return NextResponse.json({ error: "No se proporcionaron IDs" }, { status: 400 });
    }

    // Delete from DB (only matching this proceso for safety)
    const result = await db.documentoLocal.deleteMany({
      where: { id: { in: idList }, procesoId },
    });

    return NextResponse.json({ deleted: result.count });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Error eliminando documentos locales:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  console.log(`[documentos-local] SUPABASE_URL="${url.slice(0, 10)}..." KEY="${key.slice(0, 10)}..."`);

  if (!url || !key) {
    return NextResponse.json(
      { error: "Supabase no configurado: faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local" },
      { status: 500 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const procesoId = formData.get("procesoId") as string | null;

    if (!file || !procesoId) {
      return NextResponse.json(
        { error: "Los campos 'file' y 'procesoId' son requeridos" },
        { status: 400 }
      );
    }

    await ensureBucket();

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const originalName = file.name;
    // subPath comes from the client for folder uploads (e.g. "subdir/file.txt")
    const subPath = formData.get("subPath") as string | null;
    const safeName = sanitizeFileName(originalName);
    const storagePath = subPath
      ? `${procesoId}/${subPath.split("/").slice(0, -1).map(sanitizeFileName).join("/")}/${safeName}`
      : `${procesoId}/${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, buffer, {
        contentType: file.type || "application/octet-stream",
        upsert: true,
      });

    if (uploadError) {
      console.error("Error subiendo a Supabase Storage:", uploadError);
      return NextResponse.json(
        { error: `Storage upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Store sanitized name for storage path, original name for display
    console.log("[documentos-local] Guardando en BD url:", storagePath, "nombreOriginal:", originalName);
    const doc = await db.documentoLocal.create({
      data: {
        procesoId,
        nombre: safeName,
        nombreOriginal: originalName,
        url: storagePath,
        tamano: buffer.length,
        tipo: file.type || null,
      },
    });

    return NextResponse.json({ documento: doc }, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Error creando documento local:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
