import { ConfidentialClientApplication } from "@azure/msal-node";
import { Client } from "@microsoft/microsoft-graph-client";

const TENANT_ID = process.env.AZURE_AD_TENANT_ID!;
const CLIENT_ID = process.env.AZURE_AD_CLIENT_ID!;
const CLIENT_SECRET = process.env.AZURE_AD_CLIENT_SECRET!;

const ONEDRIVE_USER = "jfelipetorresv@lexia.co";
const ROOT_FOLDER = "/Lexia Abogados/Procesos";

const msalClient = new ConfidentialClientApplication({
  auth: {
    clientId: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    authority: `https://login.microsoftonline.com/${TENANT_ID}`,
  },
});

export async function getAccessToken(): Promise<string> {
  const result = await msalClient.acquireTokenByClientCredential({
    scopes: ["https://graph.microsoft.com/.default"],
  });

  if (!result?.accessToken) {
    throw new Error("No se pudo obtener el token de acceso de Azure AD");
  }

  return result.accessToken;
}

function getGraphClient(accessToken: string): Client {
  return Client.init({
    authProvider: (done) => done(null, accessToken),
  });
}

/** Base del endpoint: drive del usuario Lexia */
const DRIVE_BASE = `/users/${ONEDRIVE_USER}/drive`;

/**
 * Construye la ruta completa combinando ROOT_FOLDER + folderPath relativo.
 * Si folderPath es vacío o "/", usa solo ROOT_FOLDER.
 */
function buildFullPath(folderPath?: string): string {
  const trimmed = folderPath?.replace(/^\/+|\/+$/g, "") ?? "";
  if (!trimmed) return ROOT_FOLDER;
  return `${ROOT_FOLDER}/${trimmed}`;
}

/**
 * Lista el contenido de una carpeta en el OneDrive del usuario Lexia.
 * folderPath es relativo a "Lexia Abogados/Procesos".
 * Si es vacío o "/", lista la raíz de Procesos.
 */
export async function listFolderContents(folderPath?: string) {
  const token = await getAccessToken();
  const client = getGraphClient(token);

  const fullPath = buildFullPath(folderPath);
  const endpoint = `${DRIVE_BASE}/root:${fullPath}:/children`;

  const response = await client.api(endpoint).get();

  return (response.value as Array<Record<string, unknown>>).map((item) => ({
    id: item.id as string,
    name: item.name as string,
    isFolder: !!(item.folder as Record<string, unknown> | undefined),
    size: item.size as number | undefined,
    lastModified: (item.lastModifiedDateTime as string) ?? null,
    webUrl: item.webUrl as string,
    mimeType: (item.file as Record<string, unknown> | undefined)?.mimeType as
      | string
      | undefined,
  }));
}

/**
 * Sube un archivo a una carpeta dentro de "Lexia Abogados/Procesos".
 * folderPath es relativo a la raíz de Procesos.
 */
export async function uploadFile(
  folderPath: string,
  fileName: string,
  fileBuffer: Buffer
) {
  const token = await getAccessToken();
  const client = getGraphClient(token);

  const fullPath = buildFullPath(folderPath);
  const endpoint = `${DRIVE_BASE}/root:${fullPath}/${fileName}:/content`;

  const response = await client.api(endpoint).putStream(fileBuffer);

  return {
    id: response.id as string,
    name: response.name as string,
    webUrl: response.webUrl as string,
    size: response.size as number,
  };
}

/**
 * Descarga un archivo por su ID desde el drive del usuario Lexia.
 */
export async function downloadFile(fileId: string): Promise<ArrayBuffer> {
  const token = await getAccessToken();
  const client = getGraphClient(token);

  const stream = await client
    .api(`${DRIVE_BASE}/items/${fileId}/content`)
    .getStream();

  const chunks: Uint8Array[] = [];
  for await (const chunk of stream as AsyncIterable<Uint8Array>) {
    chunks.push(chunk);
  }
  const buffer = Buffer.concat(chunks);
  return buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength
  );
}

/**
 * Busca carpetas usando Microsoft Graph search.
 * basePath es relativo a "Lexia Abogados/Procesos" (ej: "Declarativos").
 * Si es vacío, busca en toda la raíz de Procesos.
 * Retorna solo carpetas con su ruta relativa a Procesos, ordenadas alfabéticamente.
 */
export async function searchFolders(query: string, basePath?: string) {
  const token = await getAccessToken();
  const client = getGraphClient(token);

  const searchRoot = buildFullPath(basePath);
  const endpoint = `${DRIVE_BASE}/root:${searchRoot}:/search(q='${encodeURIComponent(query)}')`;

  // First page — request up to 999 items
  const response = await client
    .api(endpoint)
    .select("id,name,folder,parentReference,webUrl")
    .top(999)
    .get();

  let items = response.value as Array<Record<string, unknown>>;

  // If there's a second page, fetch it and merge
  if (response["@odata.nextLink"]) {
    try {
      const page2 = await client
        .api(response["@odata.nextLink"] as string)
        .get();
      items = items.concat(page2.value as Array<Record<string, unknown>>);
    } catch {
      // Silently continue with first page only
    }
  }

  // Since parentReference.path comes empty in Graph search results,
  // filter exclusively by folder name patterns.

  // INCLUDE patterns — looks like a legal process folder
  const VS_RE = /\bvs\b/i;
  const PROCESO_PREFIX_RE = /^Procesos?\s+\d{4}/i;
  const YEAR_CASE_RE = /\b(20[0-3]\d)-\d+/; // e.g. 2017-00273

  // EXCLUDE patterns — clearly internal document folders
  const DOCUMENT_SUFFIX_RE = /(?:CONTESTA|CONTESTACION|ALEGATOS|DEMANDA|PRUEBAS)\s*$/i;
  const ALL_CAPS_NO_DIGITS_RE = /^[A-ZÁÉÍÓÚÑÜ\s]+$/;
  const SINGLE_WORD_CAPS_RE = /^[A-ZÁÉÍÓÚÑÜ]+$/;
  const INTERNAL_PREFIX_RE = /^(?:Fase\s+admin|Informes?|Actas?|[0-9]+\.\s)/i;
  const EXACT_EXCLUDE = new Set([
    "civiles", "administrativo", "laborales",
    "procesos finalizados", "documentos de interes",
  ]);

  function isProcessFolder(name: string): boolean {
    if (VS_RE.test(name)) return true;
    if (PROCESO_PREFIX_RE.test(name)) return true;
    if (YEAR_CASE_RE.test(name)) return true;
    return false;
  }

  function isDocumentFolder(name: string): boolean {
    if (DOCUMENT_SUFFIX_RE.test(name)) return true;
    if (SINGLE_WORD_CAPS_RE.test(name.trim())) return true;
    if (ALL_CAPS_NO_DIGITS_RE.test(name) && !VS_RE.test(name) && name.length > 2) return true;
    if (INTERNAL_PREFIX_RE.test(name)) return true;
    if (EXACT_EXCLUDE.has(name.toLowerCase().trim())) return true;
    return false;
  }

  const rootMarker = `root:${ROOT_FOLDER}`;

  const folders = items
    .filter((item) => !!(item.folder as Record<string, unknown> | undefined))
    .map((item) => {
      const parentRef = item.parentReference as Record<string, unknown> | undefined;
      const parentPath = (parentRef?.path as string) ?? "";
      const markerIdx = parentPath.indexOf(rootMarker);
      let relativePath = "";
      if (markerIdx !== -1) {
        relativePath = parentPath.slice(markerIdx + rootMarker.length).replace(/^\//, "");
      }
      const fullRelative = relativePath
        ? `${relativePath}/${item.name as string}`
        : (item.name as string);

      return {
        id: item.id as string,
        name: item.name as string,
        path: fullRelative,
        webUrl: item.webUrl as string,
      };
    })
    .filter((f) => {
      // Exclude document-like folder names first
      if (isDocumentFolder(f.name)) return false;
      // Include only folders that look like legal processes
      return isProcessFolder(f.name);
    });

  // Sort alphabetically by name
  folders.sort((a, b) => a.name.localeCompare(b.name, "es"));

  return { folders };
}

/**
 * Resolve a folder's full relative path (relative to ROOT_FOLDER) by its item ID.
 * Uses a separate GET to retrieve parentReference.path which IS populated for direct item lookups (unlike search).
 */
export async function resolveFolderPath(itemId: string): Promise<string | null> {
  const token = await getAccessToken();
  const client = getGraphClient(token);

  try {
    const item = await client
      .api(`${DRIVE_BASE}/items/${itemId}`)
      .select("id,name,parentReference")
      .get();

    const parentPath = (item.parentReference?.path as string) ?? "";
    const rootMarker = `root:${ROOT_FOLDER}`;
    const markerIdx = parentPath.indexOf(rootMarker);
    let relativePath = "";
    if (markerIdx !== -1) {
      relativePath = parentPath.slice(markerIdx + rootMarker.length).replace(/^\//, "");
    }
    return relativePath
      ? `${relativePath}/${item.name as string}`
      : (item.name as string);
  } catch (err) {
    console.error("[resolveFolderPath] Error for item", itemId, err);
    return null;
  }
}

/**
 * Crea una carpeta nueva. parentPath es relativo a "Lexia Abogados/Procesos".
 */
export async function createFolder(parentPath: string, folderName: string) {
  const token = await getAccessToken();
  const client = getGraphClient(token);

  const fullPath = buildFullPath(parentPath);
  const endpoint = `${DRIVE_BASE}/root:${fullPath}:/children`;

  const response = await client.api(endpoint).post({
    name: folderName,
    folder: {},
    "@microsoft.graph.conflictBehavior": "fail",
  });

  return {
    id: response.id as string,
    name: response.name as string,
    webUrl: response.webUrl as string,
  };
}
