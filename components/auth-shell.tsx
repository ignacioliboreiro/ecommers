import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Zap } from "lucide-react";

export function AuthShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="grid flex-1 lg:grid-cols-2">
      <div className="relative hidden lg:block">
        <Image
          src="https://images.unsplash.com/photo-1575909812264-6902b55846ad?w=1200&h=1600&fit=crop&q=80"
          alt=""
          fill
          className="object-cover"
          sizes="50vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-background/10" />
        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-10">
          <Link href="/" className="inline-flex items-center gap-1.5 text-lg font-semibold tracking-tight">
            <Zap className="size-5 fill-primary text-primary" aria-hidden />
            Voltio
          </Link>
          <p className="max-w-sm text-sm text-muted-foreground">
            Guardá tus pedidos, direcciones y seguí el estado de tus envíos desde tu cuenta.
          </p>
        </div>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-2 flex flex-1 flex-col items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm">
          <Link href="/" className="mb-8 inline-flex items-center gap-1.5 text-lg font-semibold tracking-tight lg:hidden">
            <Zap className="size-5 fill-primary text-primary" aria-hidden />
            Voltio
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
