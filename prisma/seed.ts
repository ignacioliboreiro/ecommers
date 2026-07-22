import { PrismaClient, type Prisma } from "@prisma/client";

const prisma = new PrismaClient();

function placeholderImage(seed: string, position: number) {
  return {
    url: `https://picsum.photos/seed/${seed}/900/900`,
    altText: null,
    position,
  };
}

const CATEGORIES = [
  { name: "Remeras", slug: "remeras" },
  { name: "Pantalones", slug: "pantalones" },
  { name: "Calzado", slug: "calzado" },
  { name: "Accesorios", slug: "accesorios" },
];

type SeedVariant = {
  sku: string;
  priceCents: number;
  compareAtCents?: number;
  attributes: Record<string, string>;
  stock: number;
};

type SeedProduct = {
  categorySlug: string;
  name: string;
  slug: string;
  description: string;
  imageSeeds: string[];
  variants: SeedVariant[];
};

const PRODUCTS: SeedProduct[] = [
  {
    categorySlug: "remeras",
    name: "Producto A",
    slug: "producto-a",
    description:
      "Remera de algodón de corte clásico, ideal para uso diario. Tela suave y transpirable.",
    imageSeeds: ["producto-a-1", "producto-a-2", "producto-a-3"],
    variants: [
      { sku: "PA-S-NEGRO", priceCents: 1500000, compareAtCents: 1800000, attributes: { talle: "S", color: "negro" }, stock: 12 },
      { sku: "PA-M-NEGRO", priceCents: 1500000, compareAtCents: 1800000, attributes: { talle: "M", color: "negro" }, stock: 8 },
      { sku: "PA-L-NEGRO", priceCents: 1500000, compareAtCents: 1800000, attributes: { talle: "L", color: "negro" }, stock: 5 },
      { sku: "PA-M-BLANCO", priceCents: 1500000, attributes: { talle: "M", color: "blanco" }, stock: 10 },
    ],
  },
  {
    categorySlug: "remeras",
    name: "Producto B",
    slug: "producto-b",
    description:
      "Remera oversize de algodón peinado. Estampa minimalista al frente.",
    imageSeeds: ["producto-b-1", "producto-b-2"],
    variants: [
      { sku: "PB-S", priceCents: 1700000, attributes: { talle: "S" }, stock: 6 },
      { sku: "PB-M", priceCents: 1700000, attributes: { talle: "M" }, stock: 9 },
      { sku: "PB-L", priceCents: 1700000, attributes: { talle: "L" }, stock: 4 },
      { sku: "PB-XL", priceCents: 1700000, attributes: { talle: "XL" }, stock: 0 },
    ],
  },
  {
    categorySlug: "pantalones",
    name: "Producto C",
    slug: "producto-c",
    description: "Pantalón de jean recto, cinco bolsillos, tiro medio.",
    imageSeeds: ["producto-c-1", "producto-c-2", "producto-c-3"],
    variants: [
      { sku: "PC-38-AZUL", priceCents: 3200000, attributes: { talle: "38", color: "azul" }, stock: 7 },
      { sku: "PC-40-AZUL", priceCents: 3200000, attributes: { talle: "40", color: "azul" }, stock: 5 },
      { sku: "PC-42-AZUL", priceCents: 3200000, attributes: { talle: "42", color: "azul" }, stock: 3 },
      { sku: "PC-40-NEGRO", priceCents: 3200000, compareAtCents: 3600000, attributes: { talle: "40", color: "negro" }, stock: 6 },
    ],
  },
  {
    categorySlug: "pantalones",
    name: "Producto D",
    slug: "producto-d",
    description: "Pantalón cargo con bolsillos laterales, tela resistente.",
    imageSeeds: ["producto-d-1", "producto-d-2"],
    variants: [
      { sku: "PD-38", priceCents: 3500000, attributes: { talle: "38" }, stock: 4 },
      { sku: "PD-40", priceCents: 3500000, attributes: { talle: "40" }, stock: 8 },
      { sku: "PD-42", priceCents: 3500000, attributes: { talle: "42" }, stock: 2 },
      { sku: "PD-44", priceCents: 3500000, attributes: { talle: "44" }, stock: 0 },
    ],
  },
  {
    categorySlug: "calzado",
    name: "Producto E",
    slug: "producto-e",
    description:
      "Zapatilla urbana de lona, suela de goma. No todas las combinaciones de talle y color tienen stock.",
    imageSeeds: ["producto-e-1", "producto-e-2", "producto-e-3"],
    // A propósito no cubre todas las combinaciones talle x color (ver "combinación no disponible" en el selector).
    variants: [
      { sku: "PE-39-BLANCO", priceCents: 4200000, attributes: { talle: "39", color: "blanco" }, stock: 5 },
      { sku: "PE-40-BLANCO", priceCents: 4200000, attributes: { talle: "40", color: "blanco" }, stock: 6 },
      { sku: "PE-41-BLANCO", priceCents: 4200000, attributes: { talle: "41", color: "blanco" }, stock: 3 },
      { sku: "PE-40-NEGRO", priceCents: 4200000, compareAtCents: 4800000, attributes: { talle: "40", color: "negro" }, stock: 4 },
      { sku: "PE-41-NEGRO", priceCents: 4200000, compareAtCents: 4800000, attributes: { talle: "41", color: "negro" }, stock: 2 },
      { sku: "PE-42-NEGRO", priceCents: 4200000, attributes: { talle: "42", color: "negro" }, stock: 0 },
    ],
  },
  {
    categorySlug: "calzado",
    name: "Producto F",
    slug: "producto-f",
    description: "Zapatilla running liviana, único talle disponible por color.",
    imageSeeds: ["producto-f-1", "producto-f-2"],
    variants: [
      { sku: "PF-ROJO", priceCents: 5100000, attributes: { color: "rojo" }, stock: 7 },
      { sku: "PF-AZUL", priceCents: 5100000, attributes: { color: "azul" }, stock: 5 },
      { sku: "PF-VERDE", priceCents: 5100000, attributes: { color: "verde" }, stock: 0 },
    ],
  },
  {
    categorySlug: "accesorios",
    name: "Producto G",
    slug: "producto-g",
    description: "Cinturón unisex, hebilla metálica.",
    imageSeeds: ["producto-g-1", "producto-g-2"],
    variants: [
      { sku: "PG-CUERO", priceCents: 1200000, attributes: { material: "cuero" }, stock: 9 },
      { sku: "PG-TELA", priceCents: 900000, attributes: { material: "tela" }, stock: 11 },
    ],
  },
  {
    categorySlug: "accesorios",
    name: "Producto H",
    slug: "producto-h",
    description: "Mochila urbana con compartimento acolchado para notebook.",
    imageSeeds: ["producto-h-1", "producto-h-2", "producto-h-3"],
    variants: [
      { sku: "PH-PEQ", priceCents: 2600000, attributes: { capacidad: "pequeña" }, stock: 6 },
      { sku: "PH-MED", priceCents: 3100000, compareAtCents: 3500000, attributes: { capacidad: "mediana" }, stock: 4 },
      { sku: "PH-GRA", priceCents: 3600000, attributes: { capacidad: "grande" }, stock: 0 },
    ],
  },
];

async function main() {
  console.log("Limpiando datos de catálogo existentes...");
  await prisma.$transaction([
    prisma.stockMovement.deleteMany(),
    prisma.orderItem.deleteMany(),
    prisma.cartItem.deleteMany(),
    prisma.review.deleteMany(),
    prisma.productImage.deleteMany(),
    prisma.productVariant.deleteMany(),
    prisma.product.deleteMany(),
    prisma.category.deleteMany(),
  ]);

  console.log("Creando categorías...");
  const categories = await Promise.all(
    CATEGORIES.map((category) => prisma.category.create({ data: category }))
  );
  const categoryIdBySlug = new Map(categories.map((c) => [c.slug, c.id]));

  console.log("Creando productos, variantes e imágenes...");
  for (const product of PRODUCTS) {
    const categoryId = categoryIdBySlug.get(product.categorySlug);
    if (!categoryId) {
      throw new Error(`Categoría no encontrada: ${product.categorySlug}`);
    }

    await prisma.product.create({
      data: {
        name: product.name,
        slug: product.slug,
        description: product.description,
        categoryId,
        images: {
          create: product.imageSeeds.map((seed, index) => placeholderImage(seed, index)),
        },
        variants: {
          create: product.variants.map(
            (variant): Prisma.ProductVariantCreateWithoutProductInput => ({
              sku: variant.sku,
              priceCents: variant.priceCents,
              compareAtCents: variant.compareAtCents,
              attributes: variant.attributes,
              stock: variant.stock,
            })
          ),
        },
      },
    });
  }

  console.log(`Seed completo: ${categories.length} categorías, ${PRODUCTS.length} productos.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
