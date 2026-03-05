"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Loader2,
  Upload,
  Download,
  FileText,
  FileSpreadsheet,
  FileImage,
  File,
  Folder,
  FolderOpen,
  Link2,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  Files,
  FolderUp,
  HardDrive,
  X,
  Unlink,
} from "lucide-react";
import { VincularOneDriveModal } from "./VincularOneDriveModal";

interface OneDriveFile {
  id: string;
  name: string;
  isFolder: boolean;
  size?: number;
  lastModified: string | null;
  webUrl: string;
  mimeType?: string;
}

interface LocalDoc {
  id: string;
  nombre: string;
  nombreOriginal: string | null;
  url: string;
  tamano: number | null;
  tipo: string | null;
  creadoEn: string;
}

interface PreviewState {
  open: boolean;
  title: string;
  url: string;
  downloadUrl: string;
  type: "pdf" | "docx" | "other";
  source: "local" | "onedrive";
}

interface DocumentosPanelProps {
  procesoId: string;
  onedriveFolderPath: string | null;
}

function formatFileSize(bytes?: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
}

function getFileExt(name: string): string {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

function getFileIcon(name: string, mimeType?: string | null) {
  const ext = getFileExt(name);
  if (ext === "pdf") return <FileText className="h-4 w-4 text-red-500" />;
  if (["doc", "docx"].includes(ext)) return <FileText className="h-4 w-4 text-blue-600" />;
  if (["xls", "xlsx", "csv"].includes(ext)) return <FileSpreadsheet className="h-4 w-4 text-green-600" />;
  if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext)) return <FileImage className="h-4 w-4 text-purple-500" />;
  if (mimeType?.startsWith("image/")) return <FileImage className="h-4 w-4 text-purple-500" />;
  return <File className="h-4 w-4 text-[#8B8C8E]" />;
}

function localDownloadUrl(storagePath: string): string {
  return `/api/documentos-local/download?path=${encodeURIComponent(storagePath)}`;
}

function displayName(doc: LocalDoc): string {
  return doc.nombreOriginal || doc.nombre;
}

function folderDisplayName(path: string): string {
  const segments = path.replace(/\/+$/, "").split("/");
  return segments[segments.length - 1] || path;
}

/** Remove "Lexia Abogados/Procesos/" prefix if present */
function normalizePath(path: string): string {
  return path.replace(/^\/?(Lexia Abogados\/Procesos)\/?/i, "");
}

// ─── Preview Modal ───
function PreviewModal({ preview, onClose }: { preview: PreviewState; onClose: () => void }) {
  if (!preview.open) return null;

  async function handleDownload() {
    if (preview.source === "local") {
      try {
        const res = await fetch(preview.downloadUrl, { redirect: "manual" });
        const location = res.headers.get("Location");
        window.open(location || preview.downloadUrl, "_blank");
      } catch {
        window.open(preview.downloadUrl, "_blank");
      }
    } else {
      window.open(preview.downloadUrl, "_blank");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative flex flex-col rounded-sm border border-[#E8E9EA] bg-white shadow-xl" style={{ width: "90vw", maxWidth: "1200px", height: "92vh" }}>
        <div className="flex items-center justify-between border-b border-[#E8E9EA] px-4 py-3">
          <h3 className="truncate text-sm font-medium text-[#060606]" style={{ fontFamily: "'DM Sans', sans-serif" }}>{preview.title}</h3>
          <div className="flex items-center gap-2">
            <button onClick={handleDownload} className="inline-flex items-center gap-1 rounded-sm border border-[#E8E9EA] px-3 py-1.5 text-xs font-medium text-[#060606] transition-colors hover:border-[#008080] hover:text-[#008080]">
              <Download className="h-3 w-3" /> Descargar
            </button>
            <button onClick={onClose} className="rounded-sm p-1 text-[#8B8C8E] transition-colors hover:bg-[#FAFBFC] hover:text-[#060606]">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          {preview.type === "pdf" ? (
            <iframe src={preview.url} className="h-full w-full border-0" title={preview.title} />
          ) : preview.type === "docx" ? (
            <iframe src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(preview.url)}`} className="h-full w-full border-0" title={preview.title} />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-[#8B8C8E]">
              <File className="h-12 w-12" />
              <p className="text-sm">Vista previa no disponible para este tipo de archivo</p>
              <button onClick={handleDownload} className="inline-flex items-center gap-1.5 rounded-sm bg-[#008080] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#006666]">
                <Download className="h-4 w-4" /> Descargar archivo
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Drop Zone ───
function DropZone({ onFiles, disabled }: { onFiles: (files: globalThis.File[]) => void; disabled: boolean }) {
  const [dragging, setDragging] = useState(false);
  const [folderWarning, setFolderWarning] = useState(false);
  const dragCounter = useRef(0);

  return (
    <div
      onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); dragCounter.current++; if (dragCounter.current === 1) setDragging(true); }}
      onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); dragCounter.current--; if (dragCounter.current === 0) setDragging(false); }}
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
      onDrop={(e) => {
        e.preventDefault(); e.stopPropagation(); dragCounter.current = 0; setDragging(false);
        if (disabled) return;
        setFolderWarning(false);

        // Detect folders via webkitGetAsEntry
        const items = e.dataTransfer.items;
        if (items?.length) {
          let hasFolder = false;
          const realFiles: globalThis.File[] = [];
          for (let i = 0; i < items.length; i++) {
            const entry = items[i].webkitGetAsEntry?.();
            if (entry?.isDirectory) {
              hasFolder = true;
            } else {
              const file = items[i].getAsFile();
              if (file && file.size > 0) realFiles.push(file);
            }
          }
          if (hasFolder) {
            setFolderWarning(true);
            setTimeout(() => setFolderWarning(false), 5000);
            // Still upload any regular files that were dragged alongside
            if (realFiles.length > 0) onFiles(realFiles);
            return;
          }
          if (realFiles.length > 0) { onFiles(realFiles); return; }
        }

        // Fallback: use dataTransfer.files
        const fl = e.dataTransfer.files;
        if (fl.length > 0) onFiles(Array.from(fl).filter((f) => f.size > 0));
      }}
      className={`flex flex-col items-center justify-center gap-1 rounded-sm border-2 border-dashed transition-colors ${dragging ? "border-[#008080] bg-[#008080]/10" : "border-[#008080]/40 bg-transparent"} ${disabled ? "opacity-50" : ""}`}
      style={{ minHeight: "80px" }}
    >
      <div className="flex items-center gap-2 text-[#8B8C8E]">
        <Upload className="h-4 w-4 text-[#008080]" />
        <span className="text-xs font-medium">Arrastra archivos aqu&iacute;</span>
      </div>
      {folderWarning && (
        <p className="text-[11px] text-amber-600 font-medium">
          Para subir carpetas usa el bot&oacute;n &quot;Subir carpeta&quot;
        </p>
      )}
    </div>
  );
}

// ─── Main Component ───
export function DocumentosPanel({ procesoId, onedriveFolderPath: initialPath }: DocumentosPanelProps) {
  const [folderPath, setFolderPath] = useState(initialPath);        // root linked path
  const [currentPath, setCurrentPath] = useState(initialPath ?? ""); // currently browsing path
  const [files, setFiles] = useState<OneDriveFile[]>([]);
  const [localDocs, setLocalDocs] = useState<LocalDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingLocal, setLoadingLocal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [showLocalUploadMenu, setShowLocalUploadMenu] = useState(false);
  const [preview, setPreview] = useState<PreviewState>({ open: false, title: "", url: "", downloadUrl: "", type: "other", source: "local" });

  // File input refs — always in DOM, outside dropdowns
  const fileInputRef = useRef<HTMLInputElement>(null);
  const multiFileInputRef = useRef<HTMLInputElement>(null);
  const odFolderInputRef = useRef<HTMLInputElement>(null);
  const localFileInputRef = useRef<HTMLInputElement>(null);
  const localMultiFileInputRef = useRef<HTMLInputElement>(null);
  const localFolderInputRef = useRef<HTMLInputElement>(null);
  const uploadMenuRef = useRef<HTMLDivElement>(null);
  const localUploadMenuRef = useRef<HTMLDivElement>(null);

  // Set webkitdirectory via DOM — React filters non-standard attributes in JSX
  useEffect(() => {
    if (localFolderInputRef.current) {
      localFolderInputRef.current.setAttribute("webkitdirectory", "");
      localFolderInputRef.current.setAttribute("directory", "");
      localFolderInputRef.current.multiple = true;
      console.log("[FolderInput Local] atributos seteados via DOM:", localFolderInputRef.current.getAttribute("webkitdirectory"), localFolderInputRef.current.multiple);
    }
    if (odFolderInputRef.current) {
      odFolderInputRef.current.setAttribute("webkitdirectory", "");
      odFolderInputRef.current.setAttribute("directory", "");
      odFolderInputRef.current.multiple = true;
      console.log("[FolderInput OD] atributos seteados via DOM:", odFolderInputRef.current.getAttribute("webkitdirectory"), odFolderInputRef.current.multiple);
    }
  }, []);

  // When folderPath changes (new link), reset currentPath and load
  useEffect(() => {
    setFiles([]);
    setError(null);
    if (folderPath) {
      setCurrentPath(folderPath);
      loadFiles(folderPath);
    }
  }, [folderPath]);

  // Load local documents always
  useEffect(() => { loadLocalDocs(); }, [procesoId]);

  // Close upload menus on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (uploadMenuRef.current && !uploadMenuRef.current.contains(e.target as Node)) setShowUploadMenu(false);
      if (localUploadMenuRef.current && !localUploadMenuRef.current.contains(e.target as Node)) setShowLocalUploadMenu(false);
    }
    if (showUploadMenu || showLocalUploadMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showUploadMenu, showLocalUploadMenu]);

  // Close preview on Escape
  useEffect(() => {
    if (!preview.open) return;
    function handleKey(e: KeyboardEvent) { if (e.key === "Escape") setPreview((p) => ({ ...p, open: false })); }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [preview.open]);

  // ─── Data loaders ───

  async function loadFiles(path: string) {
    setLoading(true);
    setError(null);
    try {
      const cleanPath = normalizePath(path);
      console.log("[DocumentosPanel] loadFiles path:", path, "→", cleanPath);
      const res = await fetch(`/api/onedrive/files?path=${encodeURIComponent(cleanPath)}`);
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? `Error ${res.status}`);
      }
      const data = await res.json();
      console.log("[DocumentosPanel] Archivos recibidos:", data.files?.length ?? 0);
      setFiles(data.files);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "No se pudieron cargar los archivos";
      console.error("[DocumentosPanel] loadFiles error:", msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function loadLocalDocs() {
    setLoadingLocal(true);
    try {
      const res = await fetch(`/api/documentos-local?procesoId=${procesoId}`);
      if (res.ok) {
        const data = await res.json();
        const unique = (data.documentos as LocalDoc[]).filter((d, i, arr) => arr.findIndex((x) => x.id === d.id) === i);
        setLocalDocs(unique);
      }
    } catch { /* silent */ } finally { setLoadingLocal(false); }
  }

  // ─── OneDrive folder navigation ───

  function navigateToFolder(folderName: string) {
    const newPath = currentPath ? `${currentPath}/${folderName}` : folderName;
    setCurrentPath(newPath);
    loadFiles(newPath);
  }

  function navigateToBreadcrumb(index: number) {
    if (!folderPath) return;
    const rootSegments = folderPath.split("/");
    const allSegments = currentPath.split("/");
    const targetSegments = allSegments.slice(0, rootSegments.length + index);
    const newPath = targetSegments.join("/");
    setCurrentPath(newPath);
    loadFiles(newPath);
  }

  function navigateBack() {
    if (!folderPath || currentPath === folderPath) return;
    const segments = currentPath.split("/");
    segments.pop();
    const newPath = segments.join("/");
    setCurrentPath(newPath || folderPath);
    loadFiles(newPath || folderPath);
  }

  /** Breadcrumb segments relative to root */
  function getBreadcrumbs(): string[] {
    if (!folderPath || currentPath === folderPath) return [];
    const rootLen = folderPath.split("/").length;
    return currentPath.split("/").slice(rootLen);
  }

  // ─── Vincular / Desvincular ───

  async function handleVincular(path: string) {
    setShowModal(false);
    console.log("[DocumentosPanel] handleVincular path:", path);
    try {
      const res = await fetch(`/api/procesos/${procesoId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onedriveFolderPath: path }),
      });
      if (!res.ok) throw new Error();
      setFolderPath(path);
    } catch { setError("Error al vincular la carpeta"); }
  }

  async function handleDesvincular() {
    try {
      const res = await fetch(`/api/procesos/${procesoId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onedriveFolderPath: null }),
      });
      if (!res.ok) throw new Error();
      setFolderPath(null);
      setCurrentPath("");
      setFiles([]);
    } catch { setError("Error al desvincular la carpeta"); }
  }

  // ─── Upload handlers ───

  async function handleUpload(file: globalThis.File) {
    if (!folderPath) return;
    setUploading(true); setError(null);
    try {
      const form = new FormData();
      form.append("file", file); form.append("folderPath", currentPath || folderPath);
      const res = await fetch("/api/onedrive/upload", { method: "POST", body: form });
      if (!res.ok) throw new Error();
      await loadFiles(currentPath || folderPath);
    } catch { setError("Error al subir el archivo"); } finally { setUploading(false); }
  }

  async function handleMultiUpload(files: globalThis.File[] | FileList) {
    const arr = Array.from(files);
    if (!folderPath || arr.length === 0) return;
    setUploading(true); setUploadProgress({ current: 0, total: arr.length }); setError(null);
    let failed = 0;
    for (let i = 0; i < arr.length; i++) {
      setUploadProgress({ current: i + 1, total: arr.length });
      try {
        const form = new FormData();
        form.append("file", arr[i]); form.append("folderPath", currentPath || folderPath);
        const res = await fetch("/api/onedrive/upload", { method: "POST", body: form });
        if (!res.ok) failed++;
      } catch { failed++; }
    }
    if (failed > 0) setError(`Error al subir ${failed} de ${arr.length} archivos`);
    await loadFiles(currentPath || folderPath);
    setUploading(false); setUploadProgress(null);
  }

  async function handleLocalUpload(file: globalThis.File, subPath?: string) {
    setUploading(true); setError(null);
    try {
      const form = new FormData();
      form.append("file", file); form.append("procesoId", procesoId);
      if (subPath) form.append("subPath", subPath);
      const res = await fetch("/api/documentos-local", { method: "POST", body: form });
      if (!res.ok) { const body = await res.json().catch(() => null); throw new Error(body?.error ?? `Error ${res.status}`); }
      await loadLocalDocs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir el archivo localmente");
    } finally { setUploading(false); }
  }

  async function handleLocalMultiUpload(files: globalThis.File[], preservePaths = false) {
    if (files.length === 0) return;
    console.log("[handleLocalMultiUpload] Total archivos:", files.length, "preservePaths:", preservePaths);
    setUploading(true); setUploadProgress({ current: 0, total: files.length }); setError(null);
    let failed = 0;
    let i = 0;
    for (const file of files) {
      i++;
      setUploadProgress({ current: i, total: files.length });
      try {
        const form = new FormData();
        form.append("file", file); form.append("procesoId", procesoId);
        if (preservePaths && file.webkitRelativePath) {
          form.append("subPath", file.webkitRelativePath);
        }
        console.log(`[handleLocalMultiUpload] Subiendo ${i}/${files.length}: ${file.name} (${file.size} bytes)`);
        const res = await fetch("/api/documentos-local", { method: "POST", body: form });
        if (!res.ok) failed++;
      } catch { failed++; }
    }
    if (failed > 0) setError(`Error al subir ${failed} de ${files.length} archivos`);
    await loadLocalDocs();
    setUploading(false); setUploadProgress(null);
  }

  // ─── Clean duplicates ───
  async function handleCleanDuplicates() {
    // Group by display name, keep only the most recent (first in desc order)
    const seen = new Map<string, LocalDoc>();
    const dupeIds: string[] = [];
    for (const doc of localDocs) {
      const key = (doc.nombreOriginal || doc.nombre).toLowerCase();
      if (seen.has(key)) {
        dupeIds.push(doc.id); // older duplicate
      } else {
        seen.set(key, doc);
      }
    }
    if (dupeIds.length === 0) { setError("No se encontraron duplicados"); return; }
    try {
      const res = await fetch(`/api/documentos-local?procesoId=${procesoId}&ids=${dupeIds.join(",")}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      await loadLocalDocs();
    } catch { setError("Error al limpiar duplicados"); }
  }

  const hasDuplicates = (() => {
    const names = new Set<string>();
    for (const doc of localDocs) {
      const key = (doc.nombreOriginal || doc.nombre).toLowerCase();
      if (names.has(key)) return true;
      names.add(key);
    }
    return false;
  })();

  // ─── Local folder grouping ───
  const [expandedLocalFolders, setExpandedLocalFolders] = useState<Set<string>>(new Set());

  useEffect(() => {
    const folders = new Set(
      localDocs
        .filter((d) => (d.nombreOriginal ?? d.nombre).includes("/"))
        .map((d) => (d.nombreOriginal ?? d.nombre).split("/")[0])
    );
    setExpandedLocalFolders(folders);
  }, [localDocs]);

  const toggleLocalFolder = (folder: string) => {
    setExpandedLocalFolders((prev) => {
      const next = new Set(prev);
      next.has(folder) ? next.delete(folder) : next.add(folder);
      return next;
    });
  };

  const rootLocalFiles = localDocs.filter((d) => !(d.nombreOriginal ?? d.nombre).includes("/"));
  const localFolderGroups = localDocs.reduce((acc, doc) => {
    const name = doc.nombreOriginal ?? doc.nombre;
    if (name.includes("/")) {
      const folder = name.split("/")[0];
      if (!acc[folder]) acc[folder] = [];
      acc[folder].push(doc);
    }
    return acc;
  }, {} as Record<string, LocalDoc[]>);

  // ─── Drop handler ───
  const handleDropFiles = useCallback(async (droppedFiles: globalThis.File[]) => {
    if (droppedFiles.length === 0 || uploading) return;
    console.log("[handleDropFiles]", droppedFiles.length, "archivos");
    if (droppedFiles.length === 1) {
      await handleLocalUpload(droppedFiles[0]);
    } else {
      setUploading(true); setUploadProgress({ current: 0, total: droppedFiles.length }); setError(null);
      let failed = 0;
      for (let i = 0; i < droppedFiles.length; i++) {
        setUploadProgress({ current: i + 1, total: droppedFiles.length });
        try {
          const form = new FormData();
          form.append("file", droppedFiles[i]); form.append("procesoId", procesoId);
          const res = await fetch("/api/documentos-local", { method: "POST", body: form });
          if (!res.ok) failed++;
        } catch { failed++; }
      }
      if (failed > 0) setError(`Error al subir ${failed} de ${droppedFiles.length} archivos`);
      await loadLocalDocs();
      setUploading(false); setUploadProgress(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploading, procesoId]);

  // ─── Preview handlers ───

  function openLocalPreview(doc: LocalDoc) {
    const name = displayName(doc);
    const ext = getFileExt(name);
    const dlUrl = localDownloadUrl(doc.url);
    if (ext === "pdf") { setPreview({ open: true, title: name, url: dlUrl, downloadUrl: dlUrl, type: "pdf", source: "local" }); }
    else { window.open(dlUrl, "_blank"); }
  }

  function openOneDrivePreview(file: OneDriveFile) {
    const ext = getFileExt(file.name);
    const dlUrl = `/api/onedrive/download?fileId=${file.id}`;
    if (ext === "pdf") { setPreview({ open: true, title: file.name, url: dlUrl, downloadUrl: dlUrl, type: "pdf", source: "onedrive" }); }
    else if (["doc", "docx", "xls", "xlsx", "ppt", "pptx"].includes(ext)) { setPreview({ open: true, title: file.name, url: file.webUrl, downloadUrl: dlUrl, type: "docx", source: "onedrive" }); }
    else { window.open(file.webUrl, "_blank"); }
  }

  // ─── Upload dropdown (no folder input inside — refs are external) ───

  function UploadDropdown({ menuRef, show, setShow, onSingle, onMulti, onFolder }: {
    menuRef: React.Ref<HTMLDivElement>; show: boolean; setShow: (v: boolean) => void;
    onSingle: () => void; onMulti: () => void; onFolder: () => void;
  }) {
    return (
      <div ref={menuRef} className="relative">
        <button onClick={() => setShow(!show)} disabled={uploading}
          className="flex items-center gap-1.5 rounded-sm bg-[#060606] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#008080] disabled:opacity-50">
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          {uploading ? "Subiendo..." : "Subir documento"}
          {!uploading && <ChevronDown className="h-3 w-3" />}
        </button>
        {show && (
          <div className="absolute right-0 top-full z-10 mt-1 w-52 rounded-sm border border-[#E8E9EA] bg-white py-1 shadow-lg">
            <button onClick={() => { setShow(false); onSingle(); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[#060606] transition-colors hover:bg-[#FAFBFC]">
              <Upload className="h-3.5 w-3.5 text-[#008080]" /> Subir archivo
            </button>
            <button onClick={() => { setShow(false); onMulti(); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[#060606] transition-colors hover:bg-[#FAFBFC]">
              <Files className="h-3.5 w-3.5 text-[#008080]" /> Subir m&uacute;ltiples archivos
            </button>
            <button onClick={() => { setShow(false); onFolder(); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[#060606] transition-colors hover:bg-[#FAFBFC]">
              <FolderUp className="h-3.5 w-3.5 text-[#008080]" /> Subir carpeta
            </button>
          </div>
        )}
      </div>
    );
  }

  const nameClass = "max-w-[300px] truncate text-[13px] font-medium text-[#060606] cursor-pointer hover:text-[#008080] hover:underline";
  const breadcrumbs = getBreadcrumbs();
  const isSubfolder = folderPath ? currentPath !== folderPath : false;

  // ─── Hidden file inputs (always in DOM, outside dropdowns) ───
  const hiddenInputs = (
    <>
      {/* OneDrive inputs */}
      <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ""; }} />
      <input ref={multiFileInputRef} type="file" multiple className="hidden" onChange={(e) => { const files = Array.from(e.target.files || []); e.target.value = ""; if (files.length > 0) handleMultiUpload(files); }} />
      <input ref={odFolderInputRef} type="file" style={{ display: "none" }}
        onChange={async (e) => {
          const files = Array.from(e.target.files ?? []);
          console.log("[FolderInput OD] onChange disparado, archivos:", files.length, files.map(f => f.name));
          e.target.value = "";
          if (files.length > 0) await handleMultiUpload(files);
        }} />
      {/* Local inputs */}
      <input ref={localFileInputRef} type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleLocalUpload(f); e.target.value = ""; }} />
      <input ref={localMultiFileInputRef} type="file" multiple className="hidden" onChange={(e) => { const files = Array.from(e.target.files || []); e.target.value = ""; if (files.length > 0) handleLocalMultiUpload(files); }} />
      <input ref={localFolderInputRef} type="file" style={{ display: "none" }}
        onChange={async (e) => {
          const files = Array.from(e.target.files ?? []);
          console.log("[FolderInput] archivos capturados antes de reset:", files.length, files.map(f => f.webkitRelativePath));
          e.target.value = "";
          if (files.length === 0) return;
          setUploading(true); setError(null);
          setUploadProgress({ current: 0, total: files.length });
          let current = 0;
          let failed = 0;
          for (const file of files) {
            current++;
            setUploadProgress({ current, total: files.length });
            const formData = new FormData();
            formData.append("file", file);
            formData.append("procesoId", procesoId);
            if (file.webkitRelativePath) {
              formData.append("subPath", file.webkitRelativePath);
            }
            console.log(`[FolderInput] Subiendo ${current}/${files.length}: ${file.name}`);
            try {
              const res = await fetch("/api/documentos-local", { method: "POST", body: formData });
              if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                console.error("[FolderInput] Error:", body.error);
                failed++;
              }
            } catch { failed++; }
          }
          if (failed > 0) setError(`Error al subir ${failed} de ${files.length} archivos`);
          setUploadProgress(null);
          setUploading(false);
          await loadLocalDocs();
        }} />
    </>
  );

  // ─── Progress bar ───
  const progressBar = uploadProgress && (
    <div className="mb-4">
      <p className="mb-1 text-xs text-[#8B8C8E]">Subiendo {uploadProgress.current} de {uploadProgress.total} archivos...</p>
      <div className="h-2 w-full overflow-hidden rounded-full bg-[#E8E9EA]">
        <div className="h-full rounded-full bg-[#008080] transition-all" style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }} />
      </div>
    </div>
  );

  // ═══════════════════════════════════════════
  // Single return — inputs always mounted at top level
  // ═══════════════════════════════════════════
  return (
    <div className="rounded-sm border border-[#E8E9EA] bg-white p-6">
      {hiddenInputs}

      {!folderPath ? (
        <>
          {/* No folder linked */}
          <div className="flex flex-col items-center justify-center py-10">
            <FolderOpen className="mb-3 h-10 w-10 text-[#8B8C8E]" />
            <p className="mb-1 text-sm font-medium text-[#060606]">Sin carpeta vinculada</p>
            <p className="mb-5 text-xs text-[#8B8C8E]">Vincula una carpeta de OneDrive o sube documentos localmente</p>
            <div className="flex items-center gap-3">
              <button onClick={() => setShowModal(true)} className="flex items-center gap-2 rounded-sm bg-[#008080] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#006666]">
                <Link2 className="h-4 w-4" /> Vincular carpeta de OneDrive
              </button>
              <UploadDropdown menuRef={localUploadMenuRef} show={showLocalUploadMenu} setShow={setShowLocalUploadMenu}
                onSingle={() => localFileInputRef.current?.click()}
                onMulti={() => localMultiFileInputRef.current?.click()}
                onFolder={() => { console.log("[btn] Subir carpeta local clicked, ref:", !!localFolderInputRef.current, "webkitdirectory:", localFolderInputRef.current?.getAttribute("webkitdirectory")); localFolderInputRef.current?.click(); }} />
            </div>
          </div>

          <div className="mt-4"><DropZone onFiles={handleDropFiles} disabled={uploading} /></div>

          {error && <div className="mt-4 rounded-sm border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}
          {uploadProgress && <div className="mt-4">{progressBar}</div>}

          {(localDocs.length > 0 || loadingLocal) && (
            <div className="mt-6">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-xs font-medium uppercase tracking-widest text-[#060606]">Documentos locales</h3>
                {hasDuplicates && (
                  <button onClick={handleCleanDuplicates} className="text-[11px] font-medium text-amber-600 hover:text-amber-800 hover:underline">
                    Limpiar duplicados
                  </button>
                )}
              </div>
              {loadingLocal ? <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-[#008080]" /></div>
                : <LocalDocsTable rootFiles={rootLocalFiles} folderGroups={localFolderGroups} expandedFolders={expandedLocalFolders} onToggleFolder={toggleLocalFolder} onClickName={openLocalPreview} />}
            </div>
          )}
        </>
      ) : (
        <>
      {/* OneDrive linked banner */}
      <div className="mb-4 flex items-center justify-between rounded-sm border border-green-200 bg-green-50 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <FolderOpen className="h-4 w-4 text-green-600" />
          <span className="text-sm font-medium text-green-800">Vinculada: {folderDisplayName(folderPath)}</span>
        </div>
        <button onClick={handleDesvincular} className="flex items-center gap-1 text-xs font-medium text-red-600 transition-colors hover:text-red-800">
          <Unlink className="h-3.5 w-3.5" /> Desvincular
        </button>
      </div>

      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xs font-medium uppercase tracking-widest text-[#060606]" style={{ fontFamily: "'DM Sans', sans-serif" }}>Documentos</h2>
          <div className="mt-1.5 h-[2px] w-8 bg-[#008080]" />
        </div>
        <div className="flex items-center gap-2">
          <UploadDropdown menuRef={uploadMenuRef} show={showUploadMenu} setShow={setShowUploadMenu}
            onSingle={() => fileInputRef.current?.click()}
            onMulti={() => multiFileInputRef.current?.click()}
            onFolder={() => { console.log("[btn] Subir carpeta OD clicked, ref:", !!odFolderInputRef.current, "webkitdirectory:", odFolderInputRef.current?.getAttribute("webkitdirectory")); odFolderInputRef.current?.click(); }} />
        </div>
      </div>

      {/* Breadcrumb navigation */}
      {(isSubfolder || breadcrumbs.length > 0) && (
        <div className="mb-3 flex items-center gap-1 text-xs">
          <button onClick={navigateBack} className="flex items-center gap-0.5 text-[#008080] hover:underline">
            <ArrowLeft className="h-3.5 w-3.5" /> Atr&aacute;s
          </button>
          <span className="mx-1 text-[#8B8C8E]">|</span>
          <button onClick={() => { setCurrentPath(folderPath); loadFiles(folderPath); }} className="text-[#008080] hover:underline">
            {folderDisplayName(folderPath)}
          </button>
          {breadcrumbs.map((seg, i) => (
            <span key={i} className="flex items-center gap-1">
              <ChevronRight className="h-3 w-3 text-[#8B8C8E]" />
              {i < breadcrumbs.length - 1 ? (
                <button onClick={() => navigateToBreadcrumb(i + 1)} className="text-[#008080] hover:underline">{seg}</button>
              ) : (
                <span className="font-medium text-[#060606]">{seg}</span>
              )}
            </span>
          ))}
        </div>
      )}

      {/* Drag & Drop zone */}
      <div className="mb-4"><DropZone onFiles={handleDropFiles} disabled={uploading} /></div>

      {error && <div className="mb-4 rounded-sm border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}
      {progressBar}

      {/* ── DOCUMENTOS ONEDRIVE ── */}
      <div className="mb-2">
        <h3 className="mb-3 text-xs font-medium uppercase tracking-widest text-[#060606]">Documentos OneDrive</h3>
        {loading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-[#008080]" /></div>
        ) : files.length === 0 ? (
          <p className="py-6 text-center text-sm text-[#8B8C8E]">No hay archivos en esta carpeta</p>
        ) : (
          <div className="overflow-hidden rounded-sm border border-[#E8E9EA]">
            <table className="w-full">
              <thead>
                <tr className="bg-[#FAFBFC]">
                  <th className="px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wider text-[#8B8C8E]">Nombre</th>
                  <th className="hidden px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wider text-[#8B8C8E] sm:table-cell">Modificado</th>
                  <th className="hidden px-3 py-2 text-right text-[11px] font-medium uppercase tracking-wider text-[#8B8C8E] sm:table-cell">Tama&ntilde;o</th>
                  <th className="px-3 py-2 text-center text-[11px] font-medium uppercase tracking-wider text-[#8B8C8E]">Acci&oacute;n</th>
                </tr>
              </thead>
              <tbody>
                {files.filter((f) => f.isFolder).map((folder) => (
                  <tr
                    key={folder.id}
                    className="border-t border-[#E8E9EA] cursor-pointer bg-[#008080]/5 hover:bg-[#008080]/10 transition-colors"
                    onClick={() => navigateToFolder(folder.name)}
                  >
                    <td className="px-3 py-2.5" colSpan={3}>
                      <div className="flex items-center gap-2">
                        <Folder className="h-4 w-4 text-[#008080]" />
                        <span className="text-[13px] font-medium text-[#060606]">{folder.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <ChevronRight className="ml-auto h-3.5 w-3.5 text-[#8B8C8E]" />
                    </td>
                  </tr>
                ))}
                {files.filter((f) => !f.isFolder).map((file) => (
                  <tr key={file.id} className="border-t border-[#E8E9EA]">
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        {getFileIcon(file.name, file.mimeType)}
                        <button onClick={() => openOneDrivePreview(file)} className={nameClass}>{file.name}</button>
                      </div>
                    </td>
                    <td className="hidden whitespace-nowrap px-3 py-2.5 font-data text-[13px] text-[#8B8C8E] sm:table-cell">{formatDate(file.lastModified)}</td>
                    <td className="hidden whitespace-nowrap px-3 py-2.5 text-right font-data text-[13px] text-[#8B8C8E] sm:table-cell">{formatFileSize(file.size)}</td>
                    <td className="px-3 py-2.5 text-center">
                      <button onClick={() => window.open(`/api/onedrive/download?fileId=${file.id}`, "_blank")}
                        className="inline-flex items-center gap-1 rounded-sm border border-[#E8E9EA] px-2 py-1 text-[11px] font-medium text-[#060606] transition-colors hover:border-[#008080] hover:text-[#008080]">
                        <Download className="h-3 w-3" /> Descargar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── DOCUMENTOS LOCALES ── */}
      {(localDocs.length > 0 || loadingLocal) && (
        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs font-medium uppercase tracking-widest text-[#060606]">Documentos Locales</h3>
            {hasDuplicates && (
              <button onClick={handleCleanDuplicates} className="text-[11px] font-medium text-amber-600 hover:text-amber-800 hover:underline">
                Limpiar duplicados
              </button>
            )}
          </div>
          {loadingLocal ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-[#008080]" /></div>
          ) : (
            <LocalDocsTable rootFiles={rootLocalFiles} folderGroups={localFolderGroups} expandedFolders={expandedLocalFolders} onToggleFolder={toggleLocalFolder} onClickName={openLocalPreview} />
          )}
        </div>
      )}

        </>
      )}

      <VincularOneDriveModal open={showModal} onClose={() => setShowModal(false)} onSelect={handleVincular} />
      <PreviewModal preview={preview} onClose={() => setPreview((p) => ({ ...p, open: false }))} />
    </div>
  );
}

/** Single local file row */
function LocalFileRow({ doc, onClickName, indented }: { doc: LocalDoc; onClickName: (doc: LocalDoc) => void; indented?: boolean }) {
  const name = displayName(doc);
  // If indented (inside folder group), show only the filename part after the folder prefix
  const label = indented ? name.split("/").slice(1).join("/") || name : name;
  return (
    <tr key={doc.id} className="border-t border-[#E8E9EA]">
      <td className={`px-3 py-2.5 ${indented ? "pl-8" : ""}`}>
        <div className="flex items-center gap-2">
          {getFileIcon(label, doc.tipo)}
          <button onClick={() => onClickName(doc)} className="max-w-[250px] truncate text-[13px] font-medium text-[#060606] cursor-pointer hover:text-[#008080] hover:underline">
            {label}
          </button>
          <span className="inline-flex items-center gap-1 rounded-sm bg-[#FAFBFC] px-1.5 py-0.5 text-[10px] font-medium text-[#8B8C8E]">
            <HardDrive className="h-2.5 w-2.5" /> Local
          </span>
        </div>
      </td>
      <td className="hidden whitespace-nowrap px-3 py-2.5 font-data text-[13px] text-[#8B8C8E] sm:table-cell">{formatDate(doc.creadoEn)}</td>
      <td className="hidden whitespace-nowrap px-3 py-2.5 text-right font-data text-[13px] text-[#8B8C8E] sm:table-cell">{formatFileSize(doc.tamano)}</td>
      <td className="px-3 py-2.5 text-center">
        <button onClick={() => window.open(localDownloadUrl(doc.url), "_blank")}
          className="inline-flex items-center gap-1 rounded-sm border border-[#E8E9EA] px-2 py-1 text-[11px] font-medium text-[#060606] transition-colors hover:border-[#008080] hover:text-[#008080]">
          <Download className="h-3 w-3" /> Descargar
        </button>
      </td>
    </tr>
  );
}

function LocalDocsTable({ rootFiles, folderGroups, expandedFolders, onToggleFolder, onClickName }: {
  rootFiles: LocalDoc[];
  folderGroups: Record<string, LocalDoc[]>;
  expandedFolders: Set<string>;
  onToggleFolder: (folder: string) => void;
  onClickName: (doc: LocalDoc) => void;
}) {
  const folderNames = Object.keys(folderGroups).sort((a, b) => a.localeCompare(b, "es"));
  return (
    <div className="overflow-hidden rounded-sm border border-[#E8E9EA]">
      <table className="w-full">
        <thead>
          <tr className="bg-[#FAFBFC]">
            <th className="px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wider text-[#8B8C8E]">Nombre</th>
            <th className="hidden px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wider text-[#8B8C8E] sm:table-cell">Fecha</th>
            <th className="hidden px-3 py-2 text-right text-[11px] font-medium uppercase tracking-wider text-[#8B8C8E] sm:table-cell">Tama&ntilde;o</th>
            <th className="px-3 py-2 text-center text-[11px] font-medium uppercase tracking-wider text-[#8B8C8E]">Acci&oacute;n</th>
          </tr>
        </thead>
        <tbody>
          {/* Folder groups */}
          {folderNames.map((folderName) => {
            const docs = folderGroups[folderName];
            const isExpanded = expandedFolders.has(folderName);
            return (
              <React.Fragment key={`folder-${folderName}`}>
                <tr
                  className="border-t border-[#E8E9EA] cursor-pointer bg-[#008080]/5 hover:bg-[#008080]/10 transition-colors"
                  onClick={() => onToggleFolder(folderName)}
                >
                  <td className="px-3 py-2.5" colSpan={3}>
                    <div className="flex items-center gap-2">
                      {isExpanded
                        ? <FolderOpen className="h-4 w-4 text-[#008080]" />
                        : <Folder className="h-4 w-4 text-[#008080]" />}
                      <span className="text-[13px] font-medium text-[#060606]">{folderName}</span>
                      <span className="rounded-sm bg-[#E8E9EA] px-1.5 py-0.5 text-[10px] font-medium text-[#8B8C8E]">
                        {docs.length} {docs.length === 1 ? "archivo" : "archivos"}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    {isExpanded
                      ? <ChevronDown className="ml-auto h-3.5 w-3.5 text-[#8B8C8E]" />
                      : <ChevronRight className="ml-auto h-3.5 w-3.5 text-[#8B8C8E]" />}
                  </td>
                </tr>
                {isExpanded && docs.map((doc) => (
                  <LocalFileRow key={doc.id} doc={doc} onClickName={onClickName} indented />
                ))}
              </React.Fragment>
            );
          })}
          {/* Root files (no folder) */}
          {rootFiles.map((doc) => (
            <LocalFileRow key={doc.id} doc={doc} onClickName={onClickName} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
