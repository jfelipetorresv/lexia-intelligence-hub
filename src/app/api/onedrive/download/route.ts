import { NextRequest, NextResponse } from "next/server";
import { downloadFile } from "@/lib/onedrive";
import { getAccessToken } from "@/lib/onedrive";
import { Client } from "@microsoft/microsoft-graph-client";

const ONEDRIVE_USER = "jfelipetorresv@lexia.co";

export async function GET(request: NextRequest) {
  try {
    const fileId = request.nextUrl.searchParams.get("fileId");

    if (!fileId) {
      return NextResponse.json(
        { error: "El parámetro 'fileId' es requerido" },
        { status: 400 }
      );
    }

    // Get file metadata for the name
    const token = await getAccessToken();
    const client = Client.init({
      authProvider: (done) => done(null, token),
    });
    const meta = await client
      .api(`/users/${ONEDRIVE_USER}/drive/items/${fileId}`)
      .select("name")
      .get();

    const data = await downloadFile(fileId);

    return new NextResponse(data, {
      headers: {
        "Content-Disposition": `attachment; filename="${encodeURIComponent(meta.name)}"`,
        "Content-Type": "application/octet-stream",
      },
    });
  } catch (error) {
    console.error("Error descargando archivo de OneDrive:", error);
    return NextResponse.json(
      { error: "Error al descargar archivo de OneDrive" },
      { status: 500 }
    );
  }
}
