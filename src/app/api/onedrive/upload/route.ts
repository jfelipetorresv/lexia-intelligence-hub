import { NextRequest, NextResponse } from "next/server";
import { uploadFile } from "@/lib/onedrive";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folderPath = formData.get("folderPath") as string | null;

    if (!file || !folderPath) {
      return NextResponse.json(
        { error: "Los campos 'file' y 'folderPath' son requeridos" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await uploadFile(folderPath, file.name, buffer);

    return NextResponse.json({ file: result }, { status: 201 });
  } catch (error) {
    console.error("Error subiendo archivo a OneDrive:", error);
    return NextResponse.json(
      { error: "Error al subir archivo a OneDrive" },
      { status: 500 }
    );
  }
}
