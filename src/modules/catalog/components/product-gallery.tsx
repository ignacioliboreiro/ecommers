import Image from "next/image";

import type { ProductImageItem } from "@/src/modules/catalog/types/catalog";

interface ProductGalleryProps {
  images: ProductImageItem[];
  productName: string;
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [main, ...rest] = images;

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
        {main ? (
          <Image
            src={main.url}
            alt={main.altText ?? productName}
            fill
            priority
            className="object-cover"
            sizes="(min-width: 1024px) 50vw, 100vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Sin imagen
          </div>
        )}
      </div>

      {rest.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {rest.map((image) => (
            <div
              key={image.id}
              className="relative aspect-square overflow-hidden rounded-lg bg-muted"
            >
              <Image
                src={image.url}
                alt={image.altText ?? productName}
                fill
                className="object-cover"
                sizes="25vw"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
