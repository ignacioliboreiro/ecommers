import Link from "next/link";
import { Zap } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <Link href="/" className="mb-8 inline-flex items-center gap-1.5 text-lg font-semibold tracking-tight">
        <Zap className="size-5 fill-primary text-primary" aria-hidden />
        Voltio
      </Link>
      <span className="text-sm font-medium text-muted-foreground">Error 404</span>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">
        Esta página se descargó.
      </h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        No encontramos lo que buscabas. Puede que el producto se haya agotado o el link esté
        roto.
      </p>
      <div className="mt-8 flex gap-3">
        <Button render={<Link href="/">Volver al inicio</Link>} nativeButton={false} />
        <Button
          render={<Link href="/products">Ver catálogo</Link>}
          nativeButton={false}
          variant="outline"
        />
      </div>
    </div>
  );
}
