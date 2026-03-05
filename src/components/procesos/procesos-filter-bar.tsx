"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useTransition, useRef } from "react";
import { Search, X } from "lucide-react";
import { ESTADO_PROCESO_LABELS, TIPO_PROCESO_LABELS } from "@/lib/formato";

interface Props {
  abogados: { id: string; nombre: string }[];
}

const inputClasses =
  "h-9 border border-[#E8E9EA] bg-white px-3 text-[13px] text-[#060606] placeholder:text-[#8B8C8E] focus:border-[#008080] focus:outline-none focus:ring-1 focus:ring-[#008080] transition-colors font-data";

const selectClasses =
  "h-9 appearance-none border border-[#E8E9EA] bg-white px-3 pr-8 text-[13px] text-[#060606] focus:border-[#008080] focus:outline-none focus:ring-1 focus:ring-[#008080] transition-colors font-data bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%238B8C8E%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[right_0.5rem_center] bg-no-repeat";

export function ProcesosFilterBar({ abogados }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "_all") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("pagina");
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [searchParams, pathname, router]
  );

  const handleSearch = useCallback(
    (value: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        updateFilter("busqueda", value);
      }, 300);
    },
    [updateFilter]
  );

  const clearFilters = () => {
    startTransition(() => {
      router.push(pathname);
    });
  };

  const hasFilters = searchParams.toString().length > 0;

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8B8C8E]" />
        <input
          type="text"
          placeholder="Buscar radicado, partes..."
          defaultValue={searchParams.get("busqueda") ?? ""}
          onChange={(e) => handleSearch(e.target.value)}
          className={`${inputClasses} w-64 pl-9`}
          style={{ borderRadius: "2px" }}
        />
      </div>

      <select
        value={searchParams.get("estado") ?? "_all"}
        onChange={(e) => updateFilter("estado", e.target.value)}
        className={`${selectClasses} w-44`}
        style={{ borderRadius: "2px" }}
      >
        <option value="_all">Todos los estados</option>
        {Object.entries(ESTADO_PROCESO_LABELS).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>

      <select
        value={searchParams.get("jurisdiccion") ?? "_all"}
        onChange={(e) => updateFilter("jurisdiccion", e.target.value)}
        className={`${selectClasses} w-52`}
        style={{ borderRadius: "2px" }}
      >
        <option value="_all">Todas las jurisdicciones</option>
        {Object.entries(TIPO_PROCESO_LABELS).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>

      <select
        value={searchParams.get("abogadoId") ?? "_all"}
        onChange={(e) => updateFilter("abogadoId", e.target.value)}
        className={`${selectClasses} w-48`}
        style={{ borderRadius: "2px" }}
      >
        <option value="_all">Todos los abogados</option>
        {abogados.map((a) => (
          <option key={a.id} value={a.id}>
            {a.nombre}
          </option>
        ))}
      </select>

      {hasFilters && (
        <button
          onClick={clearFilters}
          className="flex h-9 items-center gap-1.5 px-3 text-[12px] font-medium text-[#8B8C8E] transition-colors hover:text-[#060606]"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          <X className="h-3.5 w-3.5" />
          Limpiar filtros
        </button>
      )}

      {isPending && (
        <span className="font-data text-[12px] text-[#8B8C8E]">
          Cargando...
        </span>
      )}
    </div>
  );
}
