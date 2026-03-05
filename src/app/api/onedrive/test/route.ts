import { NextResponse } from "next/server";
import { getAccessToken, listFolderContents } from "@/lib/onedrive";

export async function GET() {
  let tokenOk = false;
  let archivos: { name: string; isFolder: boolean }[] = [];
  let error: string | null = null;

  try {
    const token = await getAccessToken();
    tokenOk = !!token;
  } catch (e) {
    error = `Token error: ${e instanceof Error ? e.message : String(e)}`;
    return NextResponse.json({ tokenOk, archivos, error });
  }

  try {
    // folderPath vacío → lista raíz "Lexia Abogados/Procesos"
    const items = await listFolderContents();
    archivos = items.map((item) => ({
      name: item.name,
      isFolder: item.isFolder,
    }));
  } catch (e) {
    error = `ListFolder error: ${e instanceof Error ? e.message : String(e)}`;
  }

  return NextResponse.json({ tokenOk, archivos, error });
}
