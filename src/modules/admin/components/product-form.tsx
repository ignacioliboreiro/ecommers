"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { CategoryNavItem } from "@/src/modules/catalog/types/catalog";
import { createProduct, updateProduct } from "@/src/modules/admin/actions/products";
import type { AdminFormState } from "@/src/modules/admin/types/product";
import { ImageUploader, type ProductImageValue } from "./image-uploader";
import { EMPTY_VARIANT, VariantEditor, type VariantFormValue } from "./variant-editor";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export interface ProductFormInitialValues {
  id?: string;
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  isActive: boolean;
  images: ProductImageValue[];
  variants: VariantFormValue[];
}

interface ProductFormProps {
  categories: CategoryNavItem[];
  initialValues?: ProductFormInitialValues;
}

export function ProductForm({ categories, initialValues }: ProductFormProps) {
  const isEditing = !!initialValues?.id;
  const action = isEditing ? updateProduct : createProduct;
  const [state, formAction, pending] = useActionState<AdminFormState, FormData>(action, undefined);

  const [name, setName] = useState(initialValues?.name ?? "");
  const [slug, setSlug] = useState(initialValues?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(false);
  const [images, setImages] = useState<ProductImageValue[]>(initialValues?.images ?? []);
  const [variants, setVariants] = useState<VariantFormValue[]>(
    initialValues?.variants ?? [{ ...EMPTY_VARIANT }]
  );

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {isEditing && <input type="hidden" name="productId" value={initialValues!.id} />}
      <input type="hidden" name="imagesJson" value={JSON.stringify(images)} />
      <input type="hidden" name="variantsJson" value={JSON.stringify(variants)} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Nombre</Label>
          <Input
            id="name"
            name="name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!slugTouched) setSlug(slugify(e.target.value));
            }}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            name="slug"
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value);
            }}
            required
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={initialValues?.description}
          rows={4}
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="categoryId">Categoría</Label>
          <select
            id="categoryId"
            name="categoryId"
            defaultValue={initialValues?.categoryId ?? ""}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
            required
          >
            <option value="" disabled>
              Elegí una categoría
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 self-end pb-1.5">
          <Switch id="isActive" name="isActive" defaultChecked={initialValues?.isActive ?? true} />
          <Label htmlFor="isActive">Producto activo (visible en el catálogo)</Label>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Imágenes</Label>
        <ImageUploader images={images} onChange={setImages} />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Variantes</Label>
        <VariantEditor variants={variants} onChange={setVariants} />
      </div>

      {state?.status === "error" && (
        <p className="text-sm text-destructive" role="alert">
          {state.message}
        </p>
      )}
      {state?.status === "success" && (
        <p className="text-sm text-primary" role="status">
          {state.message}
        </p>
      )}

      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Guardando..." : isEditing ? "Guardar cambios" : "Crear producto"}
      </Button>
    </form>
  );
}
