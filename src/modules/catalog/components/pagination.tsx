import Link from "next/link";

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
    <nav className="flex items-center justify-center gap-4">
      {hasPrev ? (
        <Link href={buildHref(page - 1)} className="text-sm underline">
          Anterior
        </Link>
      ) : (
        <span className="text-sm text-muted-foreground">Anterior</span>
      )}
      <span className="text-sm text-muted-foreground">
        Página {page} de {pageCount}
      </span>
      {hasNext ? (
        <Link href={buildHref(page + 1)} className="text-sm underline">
          Siguiente
        </Link>
      ) : (
        <span className="text-sm text-muted-foreground">Siguiente</span>
      )}
    </nav>
  );
}
