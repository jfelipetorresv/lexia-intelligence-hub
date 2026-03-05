"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  pagina: number;
  totalPaginas: number;
  total: number;
}

export function Pagination({ pagina, totalPaginas, total }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page <= 1) {
      params.delete("pagina");
    } else {
      params.set("pagina", String(page));
    }
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  if (total === 0) return null;

  const from = (pagina - 1) * 20 + 1;
  const to = Math.min(pagina * 20, total);

  return (
    <div className="mt-4 flex items-center justify-between">
      <p className="text-sm text-muted-foreground">
        Mostrando {from}–{to} de {total} registros
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => goToPage(pagina - 1)}
          disabled={pagina <= 1 || isPending}
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Anterior
        </Button>
        <span className="text-sm text-muted-foreground">
          {pagina} / {totalPaginas}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => goToPage(pagina + 1)}
          disabled={pagina >= totalPaginas || isPending}
        >
          Siguiente
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
