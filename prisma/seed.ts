import { PrismaClient, type Prisma } from "@prisma/client";

const prisma = new PrismaClient();

function unsplash(id: string, position: number) {
  return {
    url: `https://images.unsplash.com/photo-${id}?w=1200&h=1200&fit=crop&q=80`,
    altText: null,
    position,
  };
}

const CATEGORIES = [
  { name: "Smartphones", slug: "smartphones" },
  { name: "Notebooks", slug: "notebooks" },
  { name: "Audio", slug: "audio" },
  { name: "Wearables", slug: "wearables" },
  { name: "Gaming", slug: "gaming" },
  { name: "Cámaras", slug: "camaras" },
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
  imageIds: string[];
  variants: SeedVariant[];
};

const PRODUCTS: SeedProduct[] = [
  {
    categorySlug: "smartphones",
    name: "Halion Z9 Pro",
    slug: "halion-z9-pro",
    description:
      "Pantalla AMOLED de 6.7\", chip de 8 núcleos y cámara triple de 50MP con estabilización óptica. El buque insignia de Halion, pensado para uso intensivo todo el día.",
    imageIds: ["1505468726633-0069fc52f4b9"],
    variants: [
      { sku: "HZ9-128-GRA", priceCents: 118990000, compareAtCents: 129990000, attributes: { color: "Grafito", almacenamiento: "128GB" }, stock: 14 },
      { sku: "HZ9-256-GRA", priceCents: 134990000, attributes: { color: "Grafito", almacenamiento: "256GB" }, stock: 9 },
      { sku: "HZ9-128-ART", priceCents: 118990000, compareAtCents: 129990000, attributes: { color: "Blanco Ártico", almacenamiento: "128GB" }, stock: 6 },
      { sku: "HZ9-256-ART", priceCents: 134990000, attributes: { color: "Blanco Ártico", almacenamiento: "256GB" }, stock: 0 },
    ],
  },
  {
    categorySlug: "smartphones",
    name: "Kestrel Nova Lite",
    slug: "kestrel-nova-lite",
    description:
      "Gama media con batería de 5000mAh y carga rápida a 33W. Rinde todo el día sin vaciar el bolsillo.",
    imageIds: ["1562147458-0c12e8d29f50"],
    variants: [
      { sku: "KNL-BLA", priceCents: 64990000, attributes: { color: "Blanco" }, stock: 11 },
      { sku: "KNL-NEG", priceCents: 64990000, attributes: { color: "Negro" }, stock: 8 },
    ],
  },
  {
    categorySlug: "notebooks",
    name: "Vantage Air 14",
    slug: "vantage-air-14",
    description:
      "1.2kg, panel IPS de 14\" y hasta 18 horas de batería real. La ultrabook para trabajar desde cualquier lado sin cargador en la mochila.",
    imageIds: ["1578730260610-ff2ce31305f4"],
    variants: [
      { sku: "VA14-8-256", priceCents: 144990000, attributes: { memoria: "8GB", almacenamiento: "256GB SSD" }, stock: 7 },
      { sku: "VA14-16-512", priceCents: 179990000, compareAtCents: 199990000, attributes: { memoria: "16GB", almacenamiento: "512GB SSD" }, stock: 5 },
    ],
  },
  {
    categorySlug: "notebooks",
    name: "Rhomb 16 Creator",
    slug: "rhomb-16-creator",
    description:
      "Panel de 16\" calibrado de fábrica, GPU dedicada y chasis de aluminio. Pensada para edición de foto y video sin cuellos de botella.",
    imageIds: ["1575909812264-6902b55846ad"],
    variants: [
      { sku: "R16-16-512", priceCents: 219990000, attributes: { memoria: "16GB", almacenamiento: "512GB SSD" }, stock: 4 },
      { sku: "R16-32-1TB", priceCents: 269990000, attributes: { memoria: "32GB", almacenamiento: "1TB SSD" }, stock: 2 },
    ],
  },
  {
    categorySlug: "audio",
    name: "Sonora ANC Over-Ear",
    slug: "sonora-anc-over-ear",
    description:
      "Cancelación de ruido activa de dos micrófonos y 40 horas de batería. Almohadillas de espuma viscoelástica para sesiones largas.",
    imageIds: ["1505751104546-4b63c93054b1"],
    variants: [
      { sku: "SON-NEG", priceCents: 38990000, compareAtCents: 45990000, attributes: { color: "Negro" }, stock: 13 },
      { sku: "SON-BEI", priceCents: 38990000, attributes: { color: "Beige" }, stock: 6 },
    ],
  },
  {
    categorySlug: "audio",
    name: "Drift Studio Wireless",
    slug: "drift-studio-wireless",
    description:
      "Driver de 40mm con sonido cálido y bajos marcados. Plegables, con estuche rígido incluido.",
    imageIds: ["1528017486352-b49206ec821b"],
    variants: [
      { sku: "DSW-GRA", priceCents: 32990000, attributes: { color: "Gris Grafito" }, stock: 9 },
      { sku: "DSW-VER", priceCents: 32990000, attributes: { color: "Verde Musgo" }, stock: 0 },
    ],
  },
  {
    categorySlug: "audio",
    name: "Aeris Buds Pro",
    slug: "aeris-buds-pro",
    description:
      "Auriculares in-ear true wireless con cancelación activa y estuche de carga inalámbrica. 6 horas de autonomía, 24 con el estuche.",
    imageIds: ["1756902368926-eb9e5e9d2a69"],
    variants: [
      { sku: "AER-BLA", priceCents: 21990000, compareAtCents: 25990000, attributes: { color: "Blanco" }, stock: 16 },
      { sku: "AER-NEG", priceCents: 21990000, attributes: { color: "Negro" }, stock: 10 },
    ],
  },
  {
    categorySlug: "audio",
    name: "Basalt Portable Speaker",
    slug: "basalt-portable-speaker",
    description:
      "Parlante bluetooth resistente a salpicaduras (IPX6), 12 horas de batería y sonido 360°. Ideal para exteriores.",
    imageIds: ["1549400854-b4300f444934"],
    variants: [
      { sku: "BAS-NEG", priceCents: 15990000, attributes: { color: "Negro" }, stock: 12 },
      { sku: "BAS-AZU", priceCents: 15990000, attributes: { color: "Azul" }, stock: 0 },
    ],
  },
  {
    categorySlug: "wearables",
    name: "Pulse Watch SE",
    slug: "pulse-watch-se",
    description:
      "Monitoreo de frecuencia cardíaca, oxígeno en sangre y más de 90 modos deportivos. Resistente al agua hasta 50 metros.",
    imageIds: ["1434494745656-1aea7daa8f6f"],
    variants: [
      { sku: "PWSE-38-NEG", priceCents: 34990000, attributes: { tamaño: "38mm", correa: "Negro" }, stock: 8 },
      { sku: "PWSE-38-COR", priceCents: 34990000, attributes: { tamaño: "38mm", correa: "Coral" }, stock: 5 },
      { sku: "PWSE-42-NEG", priceCents: 38990000, attributes: { tamaño: "42mm", correa: "Negro" }, stock: 3 },
    ],
  },
  {
    categorySlug: "wearables",
    name: "Orbit Watch Active",
    slug: "orbit-watch-active",
    description:
      "Pantalla AMOLED siempre encendida y GPS integrado para trackear rutas sin depender del celular.",
    imageIds: ["1723622555972-37af178c623a"],
    variants: [
      { sku: "OWA-NEG", priceCents: 29990000, compareAtCents: 33990000, attributes: { correa: "Negro" }, stock: 7 },
      { sku: "OWA-COR", priceCents: 29990000, compareAtCents: 33990000, attributes: { correa: "Coral" }, stock: 4 },
    ],
  },
  {
    categorySlug: "gaming",
    name: "Draken Deck X",
    slug: "draken-deck-x",
    description:
      "Consola portátil con pantalla de 7\" a 120Hz. Corré tus juegos favoritos donde quieras, sin depender del televisor.",
    imageIds: ["1768560896018-186bbf942eda"],
    variants: [
      { sku: "DDX-512", priceCents: 89990000, attributes: { almacenamiento: "512GB" }, stock: 5 },
      { sku: "DDX-1TB", priceCents: 109990000, attributes: { almacenamiento: "1TB" }, stock: 2 },
    ],
  },
  {
    categorySlug: "camaras",
    name: "Obscura M100 Mirrorless",
    slug: "obscura-m100-mirrorless",
    description:
      "Sensor APS-C de 26MP y video 4K a 30fps. Cuerpo compacto de magnesio pensado para fotografía de calle y viajes.",
    imageIds: ["1755396518003-a738d3252437"],
    variants: [
      { sku: "OM100-BODY", priceCents: 129990000, attributes: { kit: "Solo cuerpo" }, stock: 4 },
      { sku: "OM100-1855", priceCents: 159990000, compareAtCents: 174990000, attributes: { kit: "Con lente 18-55mm" }, stock: 3 },
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
          create: product.imageIds.map((id, index) => unsplash(id, index)),
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
