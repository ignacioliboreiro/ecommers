"use client";

import Image from "next/image";
import { Loader2, Trash2, Upload } from "lucide-react";
import { useRef, useState, useTransition } from "react";

import { uploadProductImage } from "@/src/modules/admin/actions/upload-image";

export interface ProductImageValue {
  url: string;
  altText?: string | null;
}

interface ImageUploaderProps {
  images: ProductImageValue[];
  onChange: (images: ProductImageValue[]) => void;
}

export function ImageUploader({ images, onChange }: ImageUploaderProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileSelected(file: File) {
    setError(null);
    const formData = new FormData();
    formData.set("file", file);

    startTransition(async () => {
      const result = await uploadProductImage(formData);
      if (result.status === "error") {
        setError(result.message ?? "No se pudo subir la imagen.");
        return;
      }
      onChange([...images, { url: result.url!, altText: null }]);
    });
  }

  function removeImage(index: number) {
    onChange(images.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-3">
        {images.map((img, i) => (
          <div key={img.url} className="relative size-24 overflow-hidden rounded-md border border-border">
            <Image src={img.url} alt={img.altText ?? ""} fill className="object-cover" sizes="96px" />
            <button
              type="button"
              onClick={() => removeImage(i)}
              aria-label="Eliminar imagen"
              className="absolute top-1 right-1 rounded-full bg-background/80 p-1 text-destructive outline-none hover:bg-background focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Trash2 className="size-3" aria-hidden />
            </button>
          </div>
        ))}

        <button
          type="button"
          disabled={pending}
          onClick={() => inputRef.current?.click()}
          className="flex size-24 flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border text-muted-foreground outline-none hover:border-foreground/40 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
        >
          {pending ? (
            <Loader2 className="size-5 animate-spin" aria-hidden />
          ) : (
            <Upload className="size-5" aria-hidden />
          )}
          <span className="text-xs">{pending ? "Subiendo…" : "Subir"}</span>
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelected(file);
          e.target.value = "";
        }}
      />

      <div aria-live="polite">
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
