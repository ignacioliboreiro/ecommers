import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

interface PaginationProps {
  page: number;
  pageCount: number;
  buildHref: (page: number) => string;
}

export function Pagination({ page, pageCount, buildHref }: PaginationProps) {
  if (pageCount <= 1) return null;

  const hasPrev = page > 1;
  const hasNext = page < pageCount;

  return (
    <nav className="flex items-center justify-center gap-3">
      <Button
        variant="outline"
        size="icon"
        disabled={!hasPrev}
        render={hasPrev ? <Link href={buildHref(page - 1)} aria-label="Página anterior" /> : undefined}
        nativeButton={hasPrev ? false : undefined}
      >
        <ChevronLeft aria-hidden />
      </Button>
      <span className="text-sm text-muted-foreground tabular-nums">
        Página {page} de {pageCount}
      </span>
      <Button
        variant="outline"
        size="icon"
        disabled={!hasNext}
        render={hasNext ? <Link href={buildHref(page + 1)} aria-label="Página siguiente" /> : undefined}
        nativeButton={hasNext ? false : undefined}
      >
        <ChevronRight aria-hidden />
      </Button>
    </nav>
  );
}
