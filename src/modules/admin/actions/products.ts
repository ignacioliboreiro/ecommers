"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import type { AdminFormState } from "@/src/modules/admin/types/product";
import { ProductInputSchema } from "@/src/modules/admin/types/product";
import { AdjustStockSchema } from "@/src/modules/admin/types/product";

import { requireAdmin } from "./require-admin";

function parseProductFormData(formData: FormData) {
  const imagesRaw = formData.get("imagesJson");
  const variantsRaw = formData.get("variantsJson");

  return ProductInputSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    categoryId: formData.get("categoryId"),
    isActive: formData.get("isActive") === "on",
    images: imagesRaw ? JSON.parse(String(imagesRaw)) : [],
    variants: variantsRaw ? JSON.parse(String(variantsRaw)) : [],
  });
}

function revalidateProductPaths(slug?: string) {
  revalidatePath("/products");
  revalidatePath("/admin/products");
  if (slug) revalidatePath(`/products/${slug}`);
}

export async function createProduct(
  _prev: AdminFormState,
  formData: FormData
): Promise<AdminFormState> {
  await requireAdmin();

  const parsed = parseProductFormData(formData);
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const { name, slug, description, categoryId, isActive, images, variants } = parsed.data;

  const existingSlug = await prisma.product.findUnique({ where: { slug }, select: { id: true } });
  if (existingSlug) {
    return { status: "error", message: "Ya existe un producto con ese slug." };
  }

  const skus = variants.map((v) => v.sku);
  const existingSkus = await prisma.productVariant.findMany({
    where: { sku: { in: skus } },
    select: { sku: true },
  });
  if (existingSkus.length > 0) {
    return {
      status: "error",
      message: `SKU ya en uso: ${existingSkus.map((v) => v.sku).join(", ")}.`,
    };
  }

  const product = await prisma.$transaction(async (tx) => {
    return tx.product.create({
      data: {
        name,
        slug,
        description,
        categoryId,
        isActive,
        images: { create: images.map((img, i) => ({ url: img.url, altText: img.altText ?? null, position: i })) },
        variants: {
          create: variants.map((v) => ({
            sku: v.sku,
            priceCents: v.priceCents,
            compareAtCents: v.compareAtCents ?? null,
            stock: v.stock,
            lowStockAlert: v.lowStockAlert,
            attributes: v.attributes,
          })),
        },
      },
    });
  });

  revalidateProductPaths(product.slug);
  redirect("/admin/products");
}

export async function updateProduct(
  _prev: AdminFormState,
  formData: FormData
): Promise<AdminFormState> {
  await requireAdmin();

  const productId = String(formData.get("productId") ?? "");
  if (!productId) return { status: "error", message: "Falta el id del producto." };

  const parsed = parseProductFormData(formData);
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const { name, slug, description, categoryId, isActive, images, variants } = parsed.data;

  const existing = await prisma.product.findUnique({
    where: { id: productId },
    include: { variants: { select: { id: true } } },
  });
  if (!existing) return { status: "error", message: "Producto no encontrado." };

  const slugTaken = await prisma.product.findFirst({
    where: { slug, id: { not: productId } },
    select: { id: true },
  });
  if (slugTaken) return { status: "error", message: "Ya existe otro producto con ese slug." };

  const skus = variants.map((v) => v.sku);
  const skuConflicts = await prisma.productVariant.findMany({
    where: { sku: { in: skus }, productId: { not: productId } },
    select: { sku: true },
  });
  if (skuConflicts.length > 0) {
    return {
      status: "error",
      message: `SKU ya en uso por otro producto: ${skuConflicts.map((v) => v.sku).join(", ")}.`,
    };
  }

  const submittedIds = new Set(variants.filter((v) => v.id).map((v) => v.id!));
  const existingIds = existing.variants.map((v) => v.id);
  const idsToRemove = existingIds.filter((id) => !submittedIds.has(id));

  let skippedDeletions = 0;

  await prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: { id: productId },
      data: { name, slug, description, categoryId, isActive },
    });

    // Reemplazar imágenes completo: no hay FKs externas a ProductImage, así
    // que borrar+recrear es más simple y confiable que diffear por posición.
    await tx.productImage.deleteMany({ where: { productId } });
    if (images.length > 0) {
      await tx.productImage.createMany({
        data: images.map((img, i) => ({
          productId,
          url: img.url,
          altText: img.altText ?? null,
          position: i,
        })),
      });
    }

    for (const variant of variants) {
      if (variant.id) {
        await tx.productVariant.update({
          where: { id: variant.id },
          data: {
            sku: variant.sku,
            priceCents: variant.priceCents,
            compareAtCents: variant.compareAtCents ?? null,
            stock: variant.stock,
            lowStockAlert: variant.lowStockAlert,
            attributes: variant.attributes,
          },
        });
      } else {
        await tx.productVariant.create({
          data: {
            productId,
            sku: variant.sku,
            priceCents: variant.priceCents,
            compareAtCents: variant.compareAtCents ?? null,
            stock: variant.stock,
            lowStockAlert: variant.lowStockAlert,
            attributes: variant.attributes,
          },
        });
      }
    }

    // Una variante con OrderItems asociados no se borra (rompería el
    // historial de órdenes que la referencian) — se deja intacta y se avisa.
    for (const id of idsToRemove) {
      const hasOrderItems = await tx.orderItem.findFirst({ where: { variantId: id } });
      if (hasOrderItems) {
        skippedDeletions++;
        continue;
      }
      await tx.stockMovement.deleteMany({ where: { variantId: id } });
      await tx.cartItem.deleteMany({ where: { variantId: id } });
      await tx.productVariant.delete({ where: { id } });
    }
  });

  revalidateProductPaths(slug);
  revalidateProductPaths(existing.slug);

  if (skippedDeletions > 0) {
    return {
      status: "success",
      message: `Producto actualizado. ${skippedDeletions} variante(s) no se pudieron eliminar porque tienen pedidos asociados.`,
    };
  }

  redirect("/admin/products");
}

export async function toggleProductActive(productId: string, nextValue: boolean): Promise<void> {
  await requireAdmin();

  const product = await prisma.product.update({
    where: { id: productId },
    data: { isActive: nextValue },
    select: { slug: true },
  });

  revalidateProductPaths(product.slug);
}

export interface AdjustStockResult {
  status: "success" | "error";
  message: string;
}

export async function adjustStock(
  _prev: AdjustStockResult | undefined,
  formData: FormData
): Promise<AdjustStockResult> {
  await requireAdmin();

  const parsed = AdjustStockSchema.safeParse({
    variantId: formData.get("variantId"),
    delta: formData.get("delta"),
    note: formData.get("note"),
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const { variantId, delta, note } = parsed.data;

  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    select: { stock: true, product: { select: { slug: true } } },
  });
  if (!variant) return { status: "error", message: "Variante no encontrada." };

  if (variant.stock + delta < 0) {
    return {
      status: "error",
      message: `No se puede ajustar: quedaría stock negativo (actual: ${variant.stock}).`,
    };
  }

  await prisma.$transaction(async (tx) => {
    await tx.stockMovement.create({
      data: { variantId, type: "ADJUSTMENT", quantity: delta, note },
    });
    await tx.productVariant.update({
      where: { id: variantId },
      data: { stock: { increment: delta } },
    });
  });

  revalidatePath("/admin/products");
  revalidatePath(`/products/${variant.product.slug}`);

  return { status: "success", message: "Stock ajustado correctamente." };
}
