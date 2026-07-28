import * as z from "zod";

export const ProductVariantInputSchema = z.object({
  id: z.string().optional(), // presente al editar una variante existente
  sku: z.string().min(1, { error: "El SKU es obligatorio." }).trim(),
  priceCents: z.coerce
    .number({ error: "Precio inválido." })
    .int({ error: "El precio debe ser un número entero de centavos." })
    .positive({ error: "El precio debe ser mayor a 0." }),
  compareAtCents: z.coerce
    .number({ error: "Precio de comparación inválido." })
    .int()
    .positive()
    .nullish(),
  stock: z.coerce
    .number({ error: "Stock inválido." })
    .int({ error: "El stock debe ser un número entero." })
    .min(0, { error: "El stock no puede ser negativo." }),
  lowStockAlert: z.coerce
    .number({ error: "Alerta de stock bajo inválida." })
    .int()
    .min(0)
    .default(5),
  attributes: z.record(z.string(), z.string()).default({}),
});

export type ProductVariantInput = z.infer<typeof ProductVariantInputSchema>;

export const ProductInputSchema = z.object({
  name: z.string().min(2, { error: "El nombre debe tener al menos 2 caracteres." }).trim(),
  slug: z
    .string()
    .min(2, { error: "El slug debe tener al menos 2 caracteres." })
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
      error: "El slug solo puede tener minúsculas, números y guiones.",
    }),
  description: z.string().min(10, { error: "La descripción debe tener al menos 10 caracteres." }),
  categoryId: z.string().min(1, { error: "Elegí una categoría." }),
  isActive: z.coerce.boolean().default(true),
  images: z
    .array(z.object({ url: z.string().url(), altText: z.string().nullish() }))
    .default([]),
  variants: z
    .array(ProductVariantInputSchema)
    .min(1, { error: "Agregá al menos una variante." }),
});

export type ProductInput = z.infer<typeof ProductInputSchema>;

export const AdjustStockSchema = z.object({
  variantId: z.string().min(1),
  delta: z.coerce
    .number({ error: "Cantidad inválida." })
    .int({ error: "La cantidad debe ser un número entero." })
    .refine((n) => n !== 0, { error: "La cantidad no puede ser 0." }),
  note: z.string().min(3, { error: "Explicá por qué se ajusta el stock." }).trim(),
});

export type AdjustStockInput = z.infer<typeof AdjustStockSchema>;

export type AdminFormState =
  | { status: "success"; message: string }
  | { status: "error"; message: string }
  | undefined;
