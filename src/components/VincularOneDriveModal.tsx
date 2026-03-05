"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Folder, ChevronRight, Loader2, ArrowLeft, Search } from "lucide-react";

interface FolderItem {
  name: string;
  isFolder: boolean;
}

interface SearchResult {
  id: string;
  name: string;
  path: string;
  webUrl: string;
}

const FILTER_CHIPS = [
  { key: "", label: "Todos" },
  { key: "Declarativos", label: "Declarativos" },
  { key: "Arbitraje", label: "Arbitraje" },
  { key: "Admin Sancionatorio", label: "Admin Sancionatorio" },
  { key: "Disciplinarios", label: "Disciplinarios" },
  { key: "Ejecutivos", label: "Ejecutivos" },
  { key: "Tutelas", label: "Tutelas" },
  { key: "Responsabilidad Fiscal", label: "Responsabilidad Fiscal" },
] as const;

interface VincularOneDriveModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (folderPath: string) => void;
}

export function VincularOneDriveModal({
  open,
  onClose,
  onSelect,
}: VincularOneDriveModalProps) {
  const [pathSegments, setPathSegments] = useState<string[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentPath = pathSegments.join("/");
  const isTextSearching = search.length >= 3;

  // Determine effective mode:
  // 1. text >= 3 chars → global search (optionally scoped by filter)
  // 2. filter only (no text) → navigate into that subfolder
  // 3. neither → normal browse from pathSegments

  useEffect(() => {
    if (!open) return;
    setPathSegments([]);
    setSearch("");
    setFilter("");
    setSearchResults([]);
  }, [open]);

  // Load folder contents when navigating (no text search active)
  useEffect(() => {
    if (!open || isTextSearching) return;
    loadFolders();
  }, [open, currentPath, filter, isTextSearching]);

  // When filter changes without text, navigate into that subfolder
  useEffect(() => {
    if (isTextSearching) return;
    if (filter) {
      setPathSegments([filter]);
    } else {
      setPathSegments([]);
    }
  }, [filter]);

  // Debounced search (text >= 3)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!isTextSearching) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q: search });
        if (filter) params.set("basePath", filter);
        const res = await fetch(`/api/onedrive/search?${params}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setSearchResults(data.folders);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search, filter]);

  async function loadFolders() {
    setLoading(true);
    setError(null);
    try {
      const query = currentPath ? `?path=${encodeURIComponent(currentPath)}` : "";
      const res = await fetch(`/api/onedrive/files${query}`);
      if (!res.ok) throw new Error("Error al cargar carpetas");
      const data = await res.json();
      setFolders(
        (data.files as FolderItem[]).filter((f) => f.isFolder)
      );
    } catch {
      setError("No se pudieron cargar las carpetas");
    } finally {
      setLoading(false);
    }
  }

  function navigateInto(folderName: string) {
    setSearch("");
    setPathSegments((prev) => [...prev, folderName]);
  }

  function navigateBack() {
    setPathSegments((prev) => prev.slice(0, -1));
  }

  function handleSelect() {
    onSelect(currentPath);
  }

  async function handleSearchSelect(result: SearchResult) {
    // result.path from search may be incomplete (just the name) because
    // parentReference.path is empty in Graph search results.
    // Resolve the full path via a separate API call using the item ID.
    try {
      const res = await fetch(`/api/onedrive/resolve-path?itemId=${encodeURIComponent(result.id)}`);
      if (res.ok) {
        const data = await res.json();
        console.log("[VincularModal] Resolved path:", data.path, "from search result:", result.name);
        onSelect(data.path);
        return;
      }
    } catch {
      // fallback to result.path
    }
    // Fallback: use whatever path we have
    console.warn("[VincularModal] Could not resolve path, using fallback:", result.path);
    onSelect(result.path);
  }

  function handleFilterChange(key: string) {
    setFilter(key);
    setSearch("");
  }

  function formatSearchPath(path: string) {
    // path is relative to Procesos root, e.g. "Declarativos/Zürich/Administrativo/Proceso 2017-00273"
    // Show parent path (excluding the folder name itself) with › separator
    const segments = path.split("/");
    if (segments.length <= 1) return "";
    return segments.slice(0, -1).join(" › ");
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-xl border-[#E8E9EA] bg-white" style={{ minHeight: "600px" }}>
        <DialogHeader>
          <DialogTitle
            className="text-base font-medium text-[#060606]"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Vincular carpeta de OneDrive
          </DialogTitle>
          <DialogDescription className="text-xs text-[#8B8C8E]">
            Navega o busca la carpeta del proceso
          </DialogDescription>
        </DialogHeader>

        {/* Breadcrumb — only show when browsing (not text-searching) */}
        {!isTextSearching && (
          <div className="flex items-center gap-1 text-xs text-[#8B8C8E]">
            <button
              onClick={() => { setPathSegments([]); setFilter(""); }}
              className="hover:text-[#008080]"
            >
              Procesos
            </button>
            {pathSegments.map((seg, i) => (
              <span key={i} className="flex items-center gap-1">
                <ChevronRight className="h-3 w-3" />
                <button
                  onClick={() => setPathSegments((prev) => prev.slice(0, i + 1))}
                  className="hover:text-[#008080]"
                >
                  {seg}
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8B8C8E]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar carpeta..."
            className="w-full rounded-sm border border-[#E8E9EA] py-1.5 pl-8 pr-3 text-sm text-[#060606] placeholder:text-[#8B8C8E] focus:border-[#008080] focus:outline-none"
          />
        </div>

        {/* Filter chips */}
        <div className="-my-1 flex flex-wrap gap-1.5">
          {FILTER_CHIPS.map((chip) => (
            <button
              key={chip.key}
              onClick={() => handleFilterChange(chip.key)}
              className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                filter === chip.key
                  ? "bg-[#008080] text-white"
                  : "bg-[#F0F0F0] text-[#8B8C8E] hover:bg-[#E8E9EA] hover:text-[#060606]"
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Content area */}
        <div className="min-h-[160px] max-h-[450px] overflow-y-auto rounded-sm border border-[#E8E9EA]">
          {isTextSearching ? (
            // Global search results
            searching ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-[#008080]" />
              </div>
            ) : searchResults.length === 0 ? (
              <p className="py-8 text-center text-sm text-[#8B8C8E]">
                No se encontraron procesos. Intenta con otro término.
              </p>
            ) : (
              <div>
                <ul>
                  {searchResults.map((result) => {
                    const parentPath = formatSearchPath(result.path);
                    return (
                      <li key={result.id}>
                        <button
                          onClick={() => handleSearchSelect(result)}
                          className="flex w-full flex-col gap-1 px-3 py-2.5 text-left transition-colors hover:bg-[#FAFBFC]"
                        >
                          <span className="flex items-center gap-2 text-sm font-semibold text-[#060606]">
                            <Folder className="h-4 w-4 shrink-0 text-[#008080]" />
                            <span className="truncate">{result.name}</span>
                          </span>
                          {parentPath && (
                            <span
                              className="block truncate pl-6 text-[11px] text-[#8B8C8E]"
                              dir="rtl"
                              style={{ textAlign: "left" }}
                            >
                              <bdi>{parentPath}</bdi>
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
                <p className="border-t border-[#E8E9EA] px-3 py-2 text-center text-[11px] text-[#8B8C8E]">
                  {searchResults.length} {searchResults.length === 1 ? "proceso encontrado" : "procesos encontrados"}
                </p>
              </div>
            )
          ) : (
            // Normal folder navigation
            loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-[#008080]" />
              </div>
            ) : error ? (
              <p className="py-8 text-center text-sm text-red-600">{error}</p>
            ) : folders.length === 0 ? (
              <p className="py-8 text-center text-sm text-[#8B8C8E]">
                No hay subcarpetas
              </p>
            ) : (
              <ul>
                {pathSegments.length > 0 && (
                  <li>
                    <button
                      onClick={navigateBack}
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-[#8B8C8E] transition-colors hover:bg-[#FAFBFC]"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Volver
                    </button>
                  </li>
                )}
                {folders.map((folder) => (
                  <li key={folder.name}>
                    <button
                      onClick={() => navigateInto(folder.name)}
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-[#060606] transition-colors hover:bg-[#FAFBFC]"
                    >
                      <Folder className="h-4 w-4 text-[#008080]" />
                      {folder.name}
                      <ChevronRight className="ml-auto h-3.5 w-3.5 text-[#8B8C8E]" />
                    </button>
                  </li>
                ))}
              </ul>
            )
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <p className="max-w-[250px] truncate text-xs text-[#8B8C8E]">
            {isTextSearching
              ? filter
                ? `Búsqueda en ${filter}`
                : "Búsqueda global"
              : currentPath || "(raíz de Procesos)"}
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-sm border border-[#E8E9EA] bg-white px-4 py-1.5 text-sm text-[#060606] transition-colors hover:bg-[#FAFBFC]"
            >
              Cancelar
            </button>
            {!isTextSearching && (
              <button
                onClick={handleSelect}
                disabled={pathSegments.length === 0}
                className="rounded-sm bg-[#008080] px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#006666] disabled:opacity-40"
              >
                Seleccionar carpeta
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
