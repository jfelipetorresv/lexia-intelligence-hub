import Link from "next/link";
import { Plus } from "lucide-react";
import { ProcesosFilterBar } from "@/components/procesos/procesos-filter-bar";
import { ProcesosTable } from "@/components/procesos/procesos-table";
import { Pagination } from "@/components/procesos/pagination";
import { fetchProcesos, fetchAbogadosActivos } from "@/lib/queries/procesos";

interface PageProps {
  searchParams: {
    busqueda?: string;
    estado?: string;
    jurisdiccion?: string;
    abogadoId?: string;
    pagina?: string;
  };
}

export default async function ProcesosPage({ searchParams }: PageProps) {
  const [data, abogados] = await Promise.all([
    fetchProcesos({
      busqueda: searchParams.busqueda,
      estado: searchParams.estado,
      jurisdiccion: searchParams.jurisdiccion,
      abogadoId: searchParams.abogadoId,
      pagina: searchParams.pagina ? parseInt(searchParams.pagina) : 1,
    }),
    fetchAbogadosActivos(),
  ]);

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1
            className="text-[1.75rem] font-light tracking-[0.02em] text-[#060606]"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Procesos Judiciales
          </h1>
          <p className="font-data mt-1 text-[13px] text-[#8B8C8E]">
            {data.total} {data.total === 1 ? "registro" : "registros"}
          </p>
        </div>
        <Link href="/procesos/nuevo">
          <button
            className="flex h-9 items-center gap-2 bg-[#060606] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#008080]"
            style={{ borderRadius: "2px", fontFamily: "'DM Sans', sans-serif" }}
          >
            <Plus className="h-4 w-4" />
            Nuevo Proceso
          </button>
        </Link>
      </div>

      <ProcesosFilterBar abogados={abogados} />

      <ProcesosTable procesos={data.procesos} />

      <Pagination
        pagina={data.pagina}
        totalPaginas={data.totalPaginas}
        total={data.total}
      />
    </div>
  );
}
