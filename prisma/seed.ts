import { PrismaClient, type Prisma } from "@prisma/client";

const prisma = new PrismaClient();

// Los 12 productos originales usaban fotos puntuales de Unsplash, elegidas a
// mano y ya verificadas — se mantienen (con `unsplash()`) para no perder esa
// curación. Los productos nuevos (para llegar a un catálogo grande) usan
// `picsum()`: un placeholder determinístico por seed, sin depender de elegir
// una foto real por producto uno por uno.
function unsplash(id: string, position: number) {
  return {
    url: `https://images.unsplash.com/photo-${id}?w=1200&h=1200&fit=crop&q=80`,
    altText: null,
    position,
  };
}

function picsum(seed: string, position: number) {
  return {
    url: `https://picsum.photos/seed/${seed}/1200/1200`,
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
  // Dos categorías nuevas para que el catálogo no sea solo "gadgets
  // portátiles": mismo rubro general (electrónica, coherente con "Voltio"),
  // pero tipos de producto y de atributo bien distintos (capacidad en
  // litros, pulgadas de un monitor) en vez de sumar más variaciones de
  // celular/notebook.
  { name: "Hogar", slug: "hogar" },
  { name: "Oficina", slug: "oficina" },
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
  images: { source: "unsplash" | "picsum"; ids: string[] };
  variants: SeedVariant[];
};

const PRODUCTS: SeedProduct[] = [
  // ---------------------------------------------------------------------
  // Smartphones
  // ---------------------------------------------------------------------
  {
    categorySlug: "smartphones",
    name: "Halion Z9 Pro",
    slug: "halion-z9-pro",
    description:
      "Pantalla AMOLED de 6.7\", chip de 8 núcleos y cámara triple de 50MP con estabilización óptica. El buque insignia de Halion, pensado para uso intensivo todo el día.",
    images: { source: "unsplash", ids: ["1505468726633-0069fc52f4b9"] },
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
    images: { source: "unsplash", ids: ["1562147458-0c12e8d29f50"] },
    variants: [
      { sku: "KNL-BLA", priceCents: 64990000, attributes: { color: "Blanco" }, stock: 11 },
      { sku: "KNL-NEG", priceCents: 64990000, attributes: { color: "Negro" }, stock: 8 },
    ],
  },
  {
    categorySlug: "smartphones",
    name: "Ferrous One 5G",
    slug: "ferrous-one-5g",
    description:
      "Entrada a la gama 5G con pantalla de 90Hz y batería de 5000mAh. Ideal como primer teléfono o equipo secundario.",
    images: { source: "picsum", ids: ["ferrous-one-5g"] },
    variants: [
      { sku: "FO5G-64-NEG", priceCents: 29990000, attributes: { color: "Negro", almacenamiento: "64GB" }, stock: 18 },
      { sku: "FO5G-128-NEG", priceCents: 35990000, attributes: { color: "Negro", almacenamiento: "128GB" }, stock: 12 },
      { sku: "FO5G-128-AZU", priceCents: 35990000, attributes: { color: "Azul", almacenamiento: "128GB" }, stock: 5 },
    ],
  },
  {
    categorySlug: "smartphones",
    name: "Solenne Fold 2",
    slug: "solenne-fold-2",
    description:
      "Plegable con pantalla interior de 7.6\" y bisagra reforzada para más de 200.000 ciclos. El teléfono que se convierte en tablet.",
    images: { source: "picsum", ids: ["solenne-fold-2"] },
    variants: [
      { sku: "SF2-256-NEG", priceCents: 219990000, compareAtCents: 249990000, attributes: { color: "Negro", almacenamiento: "256GB" }, stock: 3 },
      { sku: "SF2-512-NEG", priceCents: 249990000, attributes: { color: "Negro", almacenamiento: "512GB" }, stock: 2 },
    ],
  },
  {
    categorySlug: "smartphones",
    name: "Marbelle Compact 12",
    slug: "marbelle-compact-12",
    description:
      "El equipo más chico del catálogo: 6.1\" y 155 gramos, para quienes quieren potencia sin cargar un ladrillo en el bolsillo.",
    images: { source: "picsum", ids: ["marbelle-compact-12"] },
    variants: [
      { sku: "MC12-128-ROS", priceCents: 79990000, attributes: { color: "Rosa Arena", almacenamiento: "128GB" }, stock: 9 },
      { sku: "MC12-128-NEG", priceCents: 79990000, attributes: { color: "Negro", almacenamiento: "128GB" }, stock: 10 },
      { sku: "MC12-256-NEG", priceCents: 92990000, compareAtCents: 99990000, attributes: { color: "Negro", almacenamiento: "256GB" }, stock: 4 },
    ],
  },
  {
    categorySlug: "smartphones",
    name: "Tundra Rugged X1",
    slug: "tundra-rugged-x1",
    description:
      "Certificación IP68 y MIL-STD-810H: resiste caídas de 1.8m, polvo y agua. Pensado para obra, campo y uso extremo.",
    images: { source: "picsum", ids: ["tundra-rugged-x1"] },
    variants: [
      { sku: "TRX1-128", priceCents: 69990000, attributes: { almacenamiento: "128GB" }, stock: 7 },
    ],
  },

  // ---------------------------------------------------------------------
  // Notebooks
  // ---------------------------------------------------------------------
  {
    categorySlug: "notebooks",
    name: "Vantage Air 14",
    slug: "vantage-air-14",
    description:
      "1.2kg, panel IPS de 14\" y hasta 18 horas de batería real. La ultrabook para trabajar desde cualquier lado sin cargador en la mochila.",
    images: { source: "unsplash", ids: ["1578730260610-ff2ce31305f4"] },
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
    images: { source: "unsplash", ids: ["1575909812264-6902b55846ad"] },
    variants: [
      { sku: "R16-16-512", priceCents: 219990000, attributes: { memoria: "16GB", almacenamiento: "512GB SSD" }, stock: 4 },
      { sku: "R16-32-1TB", priceCents: 269990000, attributes: { memoria: "32GB", almacenamiento: "1TB SSD" }, stock: 2 },
    ],
  },
  {
    categorySlug: "notebooks",
    name: "Corvid Play 15 Gamer",
    slug: "corvid-play-15-gamer",
    description:
      "Panel de 15.6\" a 165Hz y GPU dedicada de gama media. Notebook gamer pensada para no perder frames por el camino.",
    images: { source: "picsum", ids: ["corvid-play-15"] },
    variants: [
      { sku: "CP15-16-512", priceCents: 249990000, compareAtCents: 279990000, attributes: { memoria: "16GB", almacenamiento: "512GB SSD" }, stock: 6 },
      { sku: "CP15-32-1TB", priceCents: 319990000, attributes: { memoria: "32GB", almacenamiento: "1TB SSD" }, stock: 2 },
    ],
  },
  {
    categorySlug: "notebooks",
    name: "Kindra Book 11 Go",
    slug: "kindra-book-11-go",
    description:
      "11.6\", menos de 1kg y arranque instantáneo. Pensada para trámites, estudio y navegación liviana — no para edición pesada.",
    images: { source: "picsum", ids: ["kindra-book-11"] },
    variants: [
      { sku: "KB11-4-64", priceCents: 54990000, attributes: { memoria: "4GB", almacenamiento: "64GB eMMC" }, stock: 15 },
      { sku: "KB11-8-128", priceCents: 69990000, attributes: { memoria: "8GB", almacenamiento: "128GB eMMC" }, stock: 9 },
    ],
  },
  {
    categorySlug: "notebooks",
    name: "Argent Fold 2-en-1",
    slug: "argent-fold-2-en-1",
    description:
      "Bisagra de 360° para usarla como notebook, tablet o en modo tienda. Pantalla táctil de 13\" con lápiz incluido.",
    images: { source: "picsum", ids: ["argent-fold-2en1"] },
    variants: [
      { sku: "AF2-8-256", priceCents: 159990000, attributes: { memoria: "8GB", almacenamiento: "256GB SSD" }, stock: 5 },
      { sku: "AF2-16-512", priceCents: 194990000, compareAtCents: 214990000, attributes: { memoria: "16GB", almacenamiento: "512GB SSD" }, stock: 3 },
    ],
  },
  {
    categorySlug: "notebooks",
    name: "Basilar Work 14 Business",
    slug: "basilar-work-14-business",
    description:
      "Chasis de magnesio con certificación militar de resistencia, lector de huella y webcam con obturador físico. Pensada para uso corporativo.",
    images: { source: "picsum", ids: ["basilar-work-14"] },
    variants: [
      { sku: "BW14-16-512", priceCents: 189990000, attributes: { memoria: "16GB", almacenamiento: "512GB SSD" }, stock: 4 },
    ],
  },

  // ---------------------------------------------------------------------
  // Audio
  // ---------------------------------------------------------------------
  {
    categorySlug: "audio",
    name: "Sonora ANC Over-Ear",
    slug: "sonora-anc-over-ear",
    description:
      "Cancelación de ruido activa de dos micrófonos y 40 horas de batería. Almohadillas de espuma viscoelástica para sesiones largas.",
    images: { source: "unsplash", ids: ["1505751104546-4b63c93054b1"] },
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
    images: { source: "unsplash", ids: ["1528017486352-b49206ec821b"] },
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
    images: { source: "unsplash", ids: ["1756902368926-eb9e5e9d2a69"] },
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
    images: { source: "unsplash", ids: ["1549400854-b4300f444934"] },
    variants: [
      { sku: "BAS-NEG", priceCents: 15990000, attributes: { color: "Negro" }, stock: 12 },
      { sku: "BAS-AZU", priceCents: 15990000, attributes: { color: "Azul" }, stock: 0 },
    ],
  },
  {
    categorySlug: "audio",
    name: "Trench Soundbar 2.1",
    slug: "trench-soundbar-21",
    description:
      "Barra de sonido con subwoofer inalámbrico incluido. Conexión óptica, HDMI ARC y bluetooth para sumar el televisor y el celular al mismo equipo.",
    images: { source: "picsum", ids: ["trench-soundbar"] },
    // Un solo SKU: no hay color/talle para elegir, es directamente "el
    // producto" — el caso de "sin variantes" que pide la consigna.
    variants: [{ sku: "TSB21-UNI", priceCents: 45990000, compareAtCents: 52990000, attributes: {}, stock: 8 }],
  },
  {
    categorySlug: "audio",
    name: "Halcyon Clip Mini",
    slug: "halcyon-clip-mini",
    description:
      "Parlante de bolsillo con clip integrado para colgarlo de la mochila. Resistente a salpicaduras, 8 horas de batería.",
    images: { source: "picsum", ids: ["halcyon-clip-mini"] },
    variants: [
      { sku: "HCM-NEG", priceCents: 11990000, attributes: { color: "Negro" }, stock: 20 },
      { sku: "HCM-ROJ", priceCents: 11990000, attributes: { color: "Rojo" }, stock: 14 },
      { sku: "HCM-VER", priceCents: 11990000, attributes: { color: "Verde" }, stock: 0 },
    ],
  },
  {
    categorySlug: "audio",
    name: "Corda Open-Ear Sport",
    slug: "corda-open-ear-sport",
    description:
      "Conducción ósea: no tapan el oído, así se sigue escuchando el entorno mientras se corre o se anda en bici. Resistentes al sudor (IPX5).",
    images: { source: "picsum", ids: ["corda-open-ear"] },
    variants: [
      { sku: "COE-NEG", priceCents: 28990000, attributes: { color: "Negro" }, stock: 11 },
      { sku: "COE-GRI", priceCents: 28990000, attributes: { color: "Gris" }, stock: 7 },
    ],
  },
  {
    categorySlug: "audio",
    name: "Ferrante Vinyl Turntable",
    slug: "ferrante-vinyl-turntable",
    description:
      "Bandeja giradiscos con salida bluetooth y phono incorporado, para conectar directo a un parlante activo sin previo aparte.",
    images: { source: "picsum", ids: ["ferrante-turntable"] },
    variants: [
      { sku: "FVT-MAD", priceCents: 42990000, attributes: { material: "Madera" }, stock: 4 },
      { sku: "FVT-NEG", priceCents: 39990000, attributes: { material: "Plástico negro" }, stock: 6 },
    ],
  },

  // ---------------------------------------------------------------------
  // Wearables
  // ---------------------------------------------------------------------
  {
    categorySlug: "wearables",
    name: "Pulse Watch SE",
    slug: "pulse-watch-se",
    description:
      "Monitoreo de frecuencia cardíaca, oxígeno en sangre y más de 90 modos deportivos. Resistente al agua hasta 50 metros.",
    images: { source: "unsplash", ids: ["1434494745656-1aea7daa8f6f"] },
    variants: [
      // Caso de "combinación no disponible" a propósito: existen las 3
      // combinaciones de acá, pero NO 42mm-Coral — ProductOptions debe
      // mostrar "Esta combinación no está disponible" al seleccionarla.
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
    images: { source: "unsplash", ids: ["1723622555972-37af178c623a"] },
    variants: [
      { sku: "OWA-NEG", priceCents: 29990000, compareAtCents: 33990000, attributes: { correa: "Negro" }, stock: 7 },
      { sku: "OWA-COR", priceCents: 29990000, compareAtCents: 33990000, attributes: { correa: "Coral" }, stock: 4 },
    ],
  },
  {
    categorySlug: "wearables",
    name: "Fenwick Band Fit 3",
    slug: "fenwick-band-fit-3",
    description:
      "Pulsera de actividad liviana (18g) con 14 días de batería. Sin pantalla táctil grande: pensada para no distraer, solo medir.",
    images: { source: "picsum", ids: ["fenwick-band-fit-3"] },
    variants: [
      { sku: "FBF3-NEG", priceCents: 12990000, attributes: { color: "Negro" }, stock: 22 },
      { sku: "FBF3-LAV", priceCents: 12990000, attributes: { color: "Lavanda" }, stock: 15 },
    ],
  },
  {
    categorySlug: "wearables",
    name: "Meridian Watch Classic",
    slug: "meridian-watch-classic",
    description:
      "Caja de acero inoxidable con esfera analógica y notificaciones discretas por vibración. Para quienes quieren funciones sin look deportivo.",
    images: { source: "picsum", ids: ["meridian-watch-classic"] },
    variants: [
      { sku: "MWC-COR-CUE", priceCents: 42990000, attributes: { caja: "Acero", correa: "Cuero" }, stock: 5 },
      { sku: "MWC-COR-MET", priceCents: 46990000, attributes: { caja: "Acero", correa: "Metálica" }, stock: 3 },
    ],
  },
  {
    categorySlug: "wearables",
    name: "Solstice Ring Sleep",
    slug: "solstice-ring-sleep",
    description:
      "Anillo inteligente que mide sueño y recuperación sin pantalla ni vibración — pensado para no interrumpir el descanso que analiza.",
    images: { source: "picsum", ids: ["solstice-ring-sleep"] },
    variants: [
      { sku: "SRS-T7", priceCents: 54990000, attributes: { talle: "7" }, stock: 6 },
      { sku: "SRS-T9", priceCents: 54990000, attributes: { talle: "9" }, stock: 4 },
      { sku: "SRS-T11", priceCents: 54990000, attributes: { talle: "11" }, stock: 0 },
    ],
  },
  {
    categorySlug: "wearables",
    name: "Grivane Kids Tracker",
    slug: "grivane-kids-tracker",
    description:
      "Reloj con GPS y llamadas a contactos preaprobados, pensado para chicos. Sin acceso a internet ni redes sociales.",
    images: { source: "picsum", ids: ["grivane-kids-tracker"] },
    variants: [{ sku: "GKT-CEL", priceCents: 19990000, attributes: { color: "Celeste" }, stock: 9 }],
  },

  // ---------------------------------------------------------------------
  // Gaming
  // ---------------------------------------------------------------------
  {
    categorySlug: "gaming",
    name: "Draken Deck X",
    slug: "draken-deck-x",
    description:
      "Consola portátil con pantalla de 7\" a 120Hz. Corré tus juegos favoritos donde quieras, sin depender del televisor.",
    images: { source: "unsplash", ids: ["1768560896018-186bbf942eda"] },
    variants: [
      { sku: "DDX-512", priceCents: 89990000, attributes: { almacenamiento: "512GB" }, stock: 5 },
      { sku: "DDX-1TB", priceCents: 109990000, attributes: { almacenamiento: "1TB" }, stock: 2 },
    ],
  },
  {
    categorySlug: "gaming",
    name: "Talon Pro Controller",
    slug: "talon-pro-controller",
    description:
      "Joystick con gatillos de recorrido ajustable y palancas intercambiables. Compatible con PC y las principales consolas.",
    images: { source: "picsum", ids: ["talon-pro-controller"] },
    variants: [
      { sku: "TPC-NEG", priceCents: 24990000, attributes: { color: "Negro" }, stock: 14 },
      { sku: "TPC-BLA", priceCents: 24990000, attributes: { color: "Blanco" }, stock: 9 },
    ],
  },
  {
    categorySlug: "gaming",
    name: "Ashgrove Mech Keyboard",
    slug: "ashgrove-mech-keyboard",
    description:
      "Teclado mecánico 75% con switches intercambiables en caliente y retroiluminación RGB por tecla.",
    images: { source: "picsum", ids: ["ashgrove-mech-keyboard"] },
    variants: [
      { sku: "AMK-LIN", priceCents: 34990000, attributes: { switch: "Lineal" }, stock: 10 },
      { sku: "AMK-TAC", priceCents: 34990000, attributes: { switch: "Táctil" }, stock: 8 },
      { sku: "AMK-CLI", priceCents: 34990000, compareAtCents: 39990000, attributes: { switch: "Clicky" }, stock: 6 },
    ],
  },
  {
    categorySlug: "gaming",
    name: "Ossuary Gaming Chair",
    slug: "ossuary-gaming-chair",
    description:
      "Respaldo reclinable a 165° con soporte lumbar ajustable y apoyabrazos 4D. Pensada para sesiones largas sin dolor de espalda.",
    images: { source: "picsum", ids: ["ossuary-gaming-chair"] },
    variants: [
      { sku: "OGC-NEG", priceCents: 64990000, compareAtCents: 74990000, attributes: { color: "Negro" }, stock: 4 },
      { sku: "OGC-ROJ", priceCents: 64990000, compareAtCents: 74990000, attributes: { color: "Negro/Rojo" }, stock: 3 },
    ],
  },
  {
    categorySlug: "gaming",
    name: "Wraith Capture Card 4K",
    slug: "wraith-capture-card-4k",
    description:
      "Placa capturadora externa 4K60 por USB-C, para streamear o grabar la consola en la PC sin pérdida perceptible de calidad.",
    images: { source: "picsum", ids: ["wraith-capture-card"] },
    variants: [{ sku: "WCC4K-UNI", priceCents: 39990000, attributes: {}, stock: 7 }],
  },

  // ---------------------------------------------------------------------
  // Cámaras
  // ---------------------------------------------------------------------
  {
    categorySlug: "camaras",
    name: "Obscura M100 Mirrorless",
    slug: "obscura-m100-mirrorless",
    description:
      "Sensor APS-C de 26MP y video 4K a 30fps. Cuerpo compacto de magnesio pensado para fotografía de calle y viajes.",
    images: { source: "unsplash", ids: ["1755396518003-a738d3252437"] },
    variants: [
      { sku: "OM100-BODY", priceCents: 129990000, attributes: { kit: "Solo cuerpo" }, stock: 4 },
      { sku: "OM100-1855", priceCents: 159990000, compareAtCents: 174990000, attributes: { kit: "Con lente 18-55mm" }, stock: 3 },
    ],
  },
  {
    categorySlug: "camaras",
    name: "Vireo Action Cam 5",
    slug: "vireo-action-cam-5",
    description:
      "Video 5.3K con estabilización electrónica avanzada, sumergible hasta 10m sin funda adicional. Para deportes y viajes.",
    images: { source: "picsum", ids: ["vireo-action-cam-5"] },
    variants: [
      { sku: "VAC5-STD", priceCents: 54990000, attributes: { kit: "Estándar" }, stock: 9 },
      { sku: "VAC5-AVE", priceCents: 69990000, compareAtCents: 76990000, attributes: { kit: "Aventura (con arnés y flotador)" }, stock: 5 },
    ],
  },
  {
    categorySlug: "camaras",
    name: "Ludwing Instant Print",
    slug: "ludwing-instant-print",
    description:
      "Cámara instantánea con lente de dos elementos y flash automático. Revelado en 90 segundos, sin necesidad de tinta.",
    images: { source: "picsum", ids: ["ludwing-instant-print"] },
    variants: [
      { sku: "LIP-CRE", priceCents: 32990000, attributes: { color: "Crema" }, stock: 11 },
      { sku: "LIP-NEG", priceCents: 32990000, attributes: { color: "Negro" }, stock: 7 },
    ],
  },
  {
    categorySlug: "camaras",
    name: "Halcón Zoom Bridge 60x",
    slug: "halcon-zoom-bridge-60x",
    description:
      "Superzoom óptico de 60x en un cuerpo tipo réflex sin necesidad de cambiar de lente. Pensada para fauna y espectáculos a distancia.",
    images: { source: "picsum", ids: ["halcon-zoom-bridge"] },
    variants: [{ sku: "HZB60-UNI", priceCents: 74990000, attributes: {}, stock: 3 }],
  },
  {
    categorySlug: "camaras",
    name: "Tripié Carbono Trek 70",
    slug: "tripie-carbono-trek-70",
    description:
      "Trípode de fibra de carbono, 700g, extensible a 1.5m con rótula de bola. Para foto y video en exteriores sin pesar la mochila.",
    images: { source: "picsum", ids: ["tripie-carbono-trek-70"] },
    variants: [{ sku: "TCT70-UNI", priceCents: 18990000, compareAtCents: 21990000, attributes: {}, stock: 12 }],
  },

  // ---------------------------------------------------------------------
  // Hogar
  // ---------------------------------------------------------------------
  {
    categorySlug: "hogar",
    name: "Ferro Air Fryer 5.5L",
    slug: "ferro-air-fryer-55l",
    description:
      "Freidora de aire con 8 programas preestablecidos y canasta antiadherente extraíble. Cocina con hasta 85% menos aceite.",
    images: { source: "picsum", ids: ["ferro-air-fryer"] },
    variants: [
      { sku: "FAF-35L", priceCents: 24990000, attributes: { capacidad: "3.5L" }, stock: 10 },
      { sku: "FAF-55L", priceCents: 31990000, compareAtCents: 35990000, attributes: { capacidad: "5.5L" }, stock: 7 },
      { sku: "FAF-80L", priceCents: 41990000, attributes: { capacidad: "8L" }, stock: 3 },
    ],
  },
  {
    categorySlug: "hogar",
    name: "Wisteria Robot Vacuum",
    slug: "wisteria-robot-vacuum",
    description:
      "Aspiradora robot con mapeo láser, vaciado automático de base y control por app. Programá la limpieza y olvidate.",
    images: { source: "picsum", ids: ["wisteria-robot-vacuum"] },
    variants: [
      { sku: "WRV-STD", priceCents: 69990000, attributes: { versión: "Estándar" }, stock: 6 },
      { sku: "WRV-BASE", priceCents: 94990000, compareAtCents: 104990000, attributes: { versión: "Con base autovaciante" }, stock: 4 },
    ],
  },
  {
    categorySlug: "hogar",
    name: "Nimbus Purificador HEPA",
    slug: "nimbus-purificador-hepa",
    description:
      "Filtro HEPA H13 que retiene el 99.95% de partículas finas. Cubre ambientes de hasta 45m² en modo silencioso.",
    images: { source: "picsum", ids: ["nimbus-purificador"] },
    variants: [
      { sku: "NPH-BLA", priceCents: 34990000, attributes: { color: "Blanco" }, stock: 8 },
      { sku: "NPH-GRI", priceCents: 34990000, attributes: { color: "Gris" }, stock: 5 },
    ],
  },
  {
    categorySlug: "hogar",
    name: "Cortez Cafetera Espresso",
    slug: "cortez-cafetera-espresso",
    description:
      "15 bares de presión y vaporizador de leche integrado. Cuerpo en acero inoxidable, para café de bar en casa.",
    images: { source: "picsum", ids: ["cortez-cafetera-espresso"] },
    variants: [
      { sku: "CCE-INOX", priceCents: 38990000, attributes: { material: "Acero inoxidable" }, stock: 6 },
      { sku: "CCE-NEG", priceCents: 35990000, compareAtCents: 39990000, attributes: { material: "Plástico negro" }, stock: 9 },
    ],
  },
  {
    categorySlug: "hogar",
    name: "Alderwood Smart Speaker",
    slug: "alderwood-smart-speaker",
    description:
      "Parlante inteligente con asistente de voz integrado, control de otros dispositivos del hogar y sonido a 360°.",
    images: { source: "picsum", ids: ["alderwood-smart-speaker"] },
    variants: [
      { sku: "ASS-GRI", priceCents: 17990000, attributes: { color: "Gris" }, stock: 15 },
      { sku: "ASS-COB", priceCents: 17990000, attributes: { color: "Cobre" }, stock: 8 },
    ],
  },
  {
    categorySlug: "hogar",
    name: "Pequeño Enchufe Inteligente",
    slug: "pequeno-enchufe-inteligente",
    description:
      "Enchufe wifi que se controla por app o por voz, con medición de consumo eléctrico en tiempo real. Instalación sin cables.",
    images: { source: "picsum", ids: ["enchufe-inteligente"] },
    variants: [{ sku: "PEI-UNI", priceCents: 6990000, attributes: {}, stock: 30 }],
  },
  {
    categorySlug: "hogar",
    name: "Bramwell Pava Eléctrica",
    slug: "bramwell-pava-electrica",
    description:
      "1.7 litros, hervido en menos de 3 minutos y apagado automático. Base giratoria 360° para zurdos y diestros por igual.",
    images: { source: "picsum", ids: ["bramwell-pava-electrica"] },
    variants: [
      { sku: "BPE-INOX", priceCents: 13990000, attributes: { material: "Acero inoxidable" }, stock: 14 },
      { sku: "BPE-NEG", priceCents: 12990000, attributes: { material: "Plástico negro" }, stock: 11 },
    ],
  },
  {
    categorySlug: "hogar",
    name: "Vervain Licuadora 1200W",
    slug: "vervain-licuadora-1200w",
    description:
      "Vaso de vidrio templado de 1.5L y cuchillas de acero quirúrgico. 6 velocidades más función pulso para hielo.",
    images: { source: "picsum", ids: ["vervain-licuadora"] },
    variants: [
      { sku: "VL1200-15L", priceCents: 21990000, attributes: { capacidad: "1.5L" }, stock: 9 },
      { sku: "VL1200-20L", priceCents: 26990000, compareAtCents: 29990000, attributes: { capacidad: "2L" }, stock: 5 },
    ],
  },

  // ---------------------------------------------------------------------
  // Oficina
  // ---------------------------------------------------------------------
  {
    categorySlug: "oficina",
    name: "Meridian Monitor UltraWide",
    slug: "meridian-monitor-ultrawide",
    description:
      "Panel curvo 21:9 a 100Hz con USB-C de 65W para cargar la notebook con un solo cable. Pensado para multitarea sin dos pantallas.",
    images: { source: "picsum", ids: ["meridian-monitor-ultrawide"] },
    variants: [
      { sku: "MMU-29", priceCents: 44990000, attributes: { pulgadas: "29\"" }, stock: 7 },
      { sku: "MMU-34", priceCents: 64990000, compareAtCents: 71990000, attributes: { pulgadas: "34\"" }, stock: 4 },
    ],
  },
  {
    categorySlug: "oficina",
    name: "Casement Monitor 27 4K",
    slug: "casement-monitor-27-4k",
    description:
      "Panel IPS 4K de 27\" con 99% sRGB, calibrado para diseño y edición de foto. Soporte ajustable en altura incluido.",
    images: { source: "picsum", ids: ["casement-monitor-27"] },
    variants: [
      { sku: "CM27-STD", priceCents: 54990000, attributes: { versión: "Estándar" }, stock: 6 },
      { sku: "CM27-HDR", priceCents: 69990000, compareAtCents: 76990000, attributes: { versión: "HDR400" }, stock: 3 },
    ],
  },
  {
    categorySlug: "oficina",
    name: "Postern Teclado Mecánico TKL",
    slug: "postern-teclado-mecanico-tkl",
    description:
      "Sin teclado numérico para ganar espacio de escritorio, con perfil bajo y conexión inalámbrica o por cable a elección.",
    images: { source: "picsum", ids: ["postern-teclado-tkl"] },
    variants: [
      { sku: "PTM-CAB", priceCents: 19990000, attributes: { conexión: "Con cable" }, stock: 12 },
      { sku: "PTM-INA", priceCents: 27990000, attributes: { conexión: "Inalámbrico" }, stock: 8 },
    ],
  },
  {
    categorySlug: "oficina",
    name: "Ondine Mouse Ergonómico",
    slug: "ondine-mouse-ergonomico",
    description:
      "Diseño vertical que reduce la tensión de la muñeca en jornadas largas. Sensor óptico de precisión y 6 botones programables.",
    images: { source: "picsum", ids: ["ondine-mouse-ergonomico"] },
    variants: [
      { sku: "OME-NEG", priceCents: 14990000, attributes: { color: "Negro" }, stock: 16 },
      { sku: "OME-GRI", priceCents: 14990000, attributes: { color: "Gris" }, stock: 10 },
    ],
  },
  {
    categorySlug: "oficina",
    name: "Corvette Multifunción Láser",
    slug: "corvette-multifuncion-laser",
    description:
      "Impresora, escáner y copiadora láser monocromática con dúplex automático y conexión wifi directa desde el celular.",
    images: { source: "picsum", ids: ["corvette-multifuncion"] },
    variants: [{ sku: "CML-UNI", priceCents: 49990000, compareAtCents: 56990000, attributes: {}, stock: 5 }],
  },
  {
    categorySlug: "oficina",
    name: "Wexley Webcam 2K",
    slug: "wexley-webcam-2k",
    description:
      "Resolución 2K a 30fps con enfoque automático y micrófono dual con reducción de ruido. Clip universal para monitor o notebook.",
    images: { source: "picsum", ids: ["wexley-webcam-2k"] },
    variants: [{ sku: "WW2K-UNI", priceCents: 17990000, attributes: {}, stock: 13 }],
  },
  {
    categorySlug: "oficina",
    name: "Halcott Silla Ergonómica",
    slug: "halcott-silla-ergonomica",
    description:
      "Respaldo de malla transpirable con soporte lumbar ajustable en altura y profundidad. Pensada para 8 horas sentado sin dolor.",
    images: { source: "picsum", ids: ["halcott-silla-ergonomica"] },
    variants: [
      { sku: "HSE-NEG", priceCents: 54990000, attributes: { color: "Negro" }, stock: 5 },
      { sku: "HSE-GRI", priceCents: 54990000, compareAtCents: 61990000, attributes: { color: "Gris" }, stock: 3 },
    ],
  },
  {
    categorySlug: "oficina",
    name: "Grendel Soporte Monitor",
    slug: "grendel-soporte-monitor",
    description:
      "Brazo articulado de escritorio con abrazadera, ajustable en altura, giro e inclinación. Compatible con VESA 75x75 y 100x100.",
    images: { source: "picsum", ids: ["grendel-soporte-monitor"] },
    variants: [{ sku: "GSM-UNI", priceCents: 12990000, attributes: {}, stock: 18 }],
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
          create: product.images.ids.map((id, index) =>
            product.images.source === "unsplash" ? unsplash(id, index) : picsum(id, index)
          ),
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

  const variantCount = PRODUCTS.reduce((sum, p) => sum + p.variants.length, 0);
  console.log(
    `Seed completo: ${categories.length} categorías, ${PRODUCTS.length} productos, ${variantCount} variantes.`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
