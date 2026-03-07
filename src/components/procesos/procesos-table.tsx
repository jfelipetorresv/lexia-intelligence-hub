"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useRef, useEffect, useCallback } from "react";
import { EstadoBadge } from "./estado-badge";
import { SemaforoBadge } from "./semaforo-badge";
import { formatRadicado, TIPO_PROCESO_LABELS } from "@/lib/formato";
import { Scale, MoreVertical, Eye, Pencil, Trash2 } from "lucide-react";
import type { ProcesoListItem } from "@/types/proceso";

function formatDate(date: Date | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function ProcesoMenu({ proceso }: { proceso: ProcesoListItem }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
  }, []);

  useEffect(() => {
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, handleClickOutside]);

  const handleDelete = async () => {
    setOpen(false);
    const ok = window.confirm(
      `¿Eliminar este proceso? Esta acción no se puede deshacer.\nRadicado: ${proceso.radicado}`
    );
    if (!ok) return;
    try {
      const res = await fetch(`/api/procesos/${proceso.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.ok) {
        router.refresh();
      } else {
        alert(data.error || "Error al eliminar el proceso");
      }
    } catch {
      alert("Error de conexión al eliminar el proceso");
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="rounded p-1 text-[#8B8C8E] hover:bg-[#F5F5F5] hover:text-[#060606]"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-md border border-[#E8E9EA] bg-white py-1 shadow-lg">
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(false); router.push(`/procesos/${proceso.id}`); }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[#060606] hover:bg-[#FAFBFC]"
          >
            <Eye className="h-3.5 w-3.5" />
            Ver proceso
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(false); router.push(`/procesos/${proceso.id}/editar`); }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[#060606] hover:bg-[#FAFBFC]"
          >
            <Pencil className="h-3.5 w-3.5" />
            Editar proceso
          </button>
          <div className="my-1 border-t border-[#E8E9EA]" />
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete(); }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-500 hover:bg-red-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Eliminar proceso
          </button>
        </div>
      )}
    </div>
  );
}

export function ProcesosTable({
  procesos,
}: {
  procesos: ProcesoListItem[];
}) {
  const router = useRouter();

  if (procesos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center border border-dashed border-[#E8E9EA] bg-white py-20">
        <Scale className="mb-4 h-10 w-10 text-[#8B8C8E]/40" />
        <h3 className="text-[15px] font-medium text-[#8B8C8E]">
          No se encontraron procesos
        </h3>
        <p className="mt-1 text-[13px] text-[#8B8C8E]/60">
          Intenta ajustar los filtros de búsqueda
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden border border-[#E8E9EA] bg-white">
      <table className="w-full">
        <thead>
          <tr className="bg-[#060606]">
            <th className="w-[200px] px-4 py-3 text-left text-[11px] font-medium uppercase tracking-[0.08em] text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Radicado
            </th>
            <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-[0.08em] text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Proceso / Partes
            </th>
            <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-[0.08em] text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Juzgado
            </th>
            <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-[0.08em] text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Estado
            </th>
            <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-[0.08em] text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Abogado Líder
            </th>
            <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-[0.08em] text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Próx. Vencimiento
            </th>
            <th className="px-4 py-3 text-center text-[11px] font-medium uppercase tracking-[0.08em] text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Semáforo
            </th>
            <th className="w-12 px-2 py-3" />
          </tr>
        </thead>
        <tbody>
          {procesos.map((proceso) => (
            <tr
              key={proceso.id}
              className="border-b border-[#E8E9EA] transition-colors hover:bg-[#FAFBFC] cursor-pointer"
              onClick={() => router.push(`/procesos/${proceso.id}`)}
            >
              <td className="px-4 py-3.5">
                <Link
                  href={`/procesos/${proceso.id}`}
                  className="font-mono text-sm font-medium text-[#060606] hover:text-[#008080]"
                >
                  {formatRadicado(proceso.radicado)}
                </Link>
              </td>
              <td className="px-4 py-3.5">
                <div className="text-[14px] font-medium text-[#060606]">
                  {proceso.demandante ?? "—"} vs. {proceso.demandado ?? "—"}
                </div>
                <div className="font-data mt-0.5 text-[12px] text-[#8B8C8E]">
                  {TIPO_PROCESO_LABELS[proceso.tipoProceso] ??
                    proceso.tipoProceso}
                </div>
              </td>
              <td className="px-4 py-3.5">
                <div className="font-data text-[13px] text-[#060606]">
                  {proceso.juzgado ?? "—"}
                </div>
                {proceso.ciudad && (
                  <div className="font-data mt-0.5 text-[12px] text-[#8B8C8E]">
                    {proceso.ciudad}
                  </div>
                )}
              </td>
              <td className="px-4 py-3.5">
                <EstadoBadge estado={proceso.estadoActual} />
              </td>
              <td className="px-4 py-3.5">
                {proceso.abogadoLider ? (
                  <span className="font-data text-[13px] text-[#060606]">
                    {proceso.abogadoLider.nombre}
                  </span>
                ) : (
                  <span className="font-data text-[13px] text-[#8B8C8E]">
                    Sin asignar
                  </span>
                )}
              </td>
              <td className="px-4 py-3.5">
                <span className="font-data text-[13px] text-[#060606]">
                  {proceso.proximoHito
                    ? formatDate(proceso.proximoHito.plazoVencimiento)
                    : "—"}
                </span>
              </td>
              <td className="px-4 py-3.5 text-center">
                <SemaforoBadge semaforo={proceso.semaforo} />
              </td>
              <td className="px-2 py-3.5 text-center">
                <ProcesoMenu proceso={proceso} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
