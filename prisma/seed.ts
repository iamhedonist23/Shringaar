import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { getPostgresSchema } from "../scripts/postgres-schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required to seed the catalog.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg(
    { connectionString, max: 1 },
    { schema: getPostgresSchema(connectionString) },
  ),
});

const categories = [
  { name: "Jhumkas", slug: "jhumkas", description: "Traditional and contemporary bell-shaped earrings." },
  { name: "Chandbalis", slug: "chandbalis", description: "Moon-inspired statement earrings with Indian detailing." },
  { name: "Stud Earrings", slug: "studs", description: "Everyday studs with pearls, crystals and classic motifs." },
  { name: "Necklaces", slug: "necklaces", description: "Versatile necklaces for celebrations and everyday styling." },
  { name: "Chokers", slug: "chokers", description: "Close-fitting chokers with festive, heritage-inspired finishes." },
  { name: "Bangles", slug: "bangles", description: "Stackable bangles and cuffs for festive dressing." },
  { name: "Rings", slug: "rings", description: "Adjustable and statement rings with sparkling accents." },
  { name: "Maang Tikkas", slug: "maang-tikka", description: "Traditional forehead jewellery for weddings and celebrations." },
  { name: "Bridal Sets", slug: "bridal-sets", description: "Coordinated jewellery sets for the modern Indian bride." },
];

const productNames: Record<string, string[]> = {
  jhumkas: [
    "Noor Kundan Dome Jhumkas",
    "Meher Pearl Drop Jhumkas",
    "Ziya Antique Temple Jhumkas",
    "Gulabi Floral Jhumkas",
    "Aarohi Polki Bell Jhumkas",
    "Saanvi Emerald Look Jhumkas",
  ],
  chandbalis: [
    "Chaand Kundan Chandbalis",
    "Sitara Pearl Crescent Chandbalis",
    "Gulnaar Polki Chandbalis",
    "Mehrunisa Floral Chandbalis",
    "Adaa Crystal Fringe Chandbalis",
    "Ruhani Meenakari Chandbalis",
  ],
  studs: [
    "Ira Pearl Halo Studs",
    "Kiara CZ Cluster Studs",
    "Mogra Floral Kundan Studs",
    "Tara Solitaire Look Studs",
    "Naina Ruby Look Studs",
    "Avni Minimal Gold Studs",
  ],
  necklaces: [
    "Meher Layered Kundan Necklace",
    "Anaya Pearl Collar Necklace",
    "Sunehri CZ Pendant Necklace",
    "Maya Temple Coin Necklace",
    "Ishani Polki Rani Haar",
    "Tara Floral Everyday Necklace",
  ],
  chokers: [
    "Rajwadi Kundan Choker",
    "Gulab Pearl Choker",
    "Aadhya Polki Collar Choker",
    "Noor Emerald Look Choker",
    "Madhavi Meenakari Choker",
    "Zara CZ Tennis Choker",
  ],
  bangles: [
    "Zari Pavé Kada Bangle",
    "Riva Pearl Stack Bangles",
    "Kavya Kundan Open Kada",
    "Tanishka Floral Bangle Pair",
    "Mira CZ Slim Bangles",
    "Aarna Temple Motif Kada",
  ],
  rings: [
    "Ishita Kundan Cocktail Ring",
    "Tia Pearl Bloom Ring",
    "Rhea Adjustable CZ Ring",
    "Vanya Polki Statement Ring",
    "Nitya Floral Temple Ring",
    "Sia Emerald Look Ring",
  ],
  "maang-tikka": [
    "Aaradhya Kundan Maang Tikka",
    "Sitara Pearl Passa Tikka",
    "Roshni Polki Matha Patti",
    "Nargis Floral Maang Tikka",
    "Ira CZ Bridal Tikka",
    "Madhurya Meenakari Tikka",
  ],
  "bridal-sets": [
    "Saanjh Royal Kundan Bridal Set",
    "Aafreen Pearl Rani Haar Set",
    "Shagun Polki Necklace Set",
    "Devika Temple Bridal Jewellery Set",
    "Gulbahar Meenakari Bridal Set",
    "Rajlakshmi CZ Celebration Set",
  ],
};

const imagesByCategory: Record<string, string> = {
  jhumkas: "/images/festival-earrings.jpg",
  chandbalis: "/images/festival-earrings.jpg",
  studs: "/images/festival-earrings.jpg",
  necklaces: "/images/layered-necklace.jpg",
  chokers: "/images/polki-necklace.jpg",
  bangles: "/images/gold-bracelet.jpg",
  rings: "/images/gold-bracelet.jpg",
  "maang-tikka": "/images/polki-necklace.jpg",
  "bridal-sets": "/images/layered-necklace.jpg",
};

const materials = ["Brass", "Copper", "Brass", "Brass", "Copper", "Brass"];
const stones = ["Kundan", "Cubic zirconia", "Pearls", "American diamond", "Polki-look glass", "Meenakari enamel"];
const occasions = ["Festive", "Bridal", "Daily Wear", "Office Wear", "Festive", "Bridal"];
const priceByCategory: Record<string, number> = {
  jhumkas: 1490,
  chandbalis: 1890,
  studs: 790,
  necklaces: 2490,
  chokers: 2190,
  bangles: 1290,
  rings: 690,
  "maang-tikka": 1390,
  "bridal-sets": 5990,
};

const collectionDefinitions = [
  { name: "The Bridal Edit", slug: "bridal-edit", description: "Keepsake-inspired statement pieces for wedding celebrations.", categories: ["bridal-sets", "maang-tikka", "chokers"] },
  { name: "Festive Glow", slug: "festive-glow", description: "Colour, sparkle and heirloom-inspired accents for festive days.", categories: ["jhumkas", "chandbalis", "bangles", "necklaces"] },
  { name: "Everyday Adornment", slug: "everyday-adornment", description: "Lightweight favourites made for repeat wear.", categories: ["studs", "rings", "necklaces"] },
  { name: "Office Polish", slug: "office-polish", description: "Refined, versatile accents for work and after-hours.", categories: ["studs", "rings", "bangles"] },
];

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function requireSeedId(ids: Map<string, string>, slug: string, kind: string) {
  const id = ids.get(slug);
  if (!id) {
    throw new Error(`Seeded ${kind} is missing for slug "${slug}".`);
  }
  return id;
}

async function seed() {
  const categoryIds = new Map<string, string>();
  for (const [sortOrder, category] of categories.entries()) {
    const saved = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        description: category.description,
        imageUrl: imagesByCategory[category.slug],
        active: true,
        sortOrder,
        seoTitle: `${category.name} | Shringaar`,
        seoDescription: category.description,
      },
      create: {
        ...category,
        imageUrl: imagesByCategory[category.slug],
        sortOrder,
        seoTitle: `${category.name} | Shringaar`,
        seoDescription: category.description,
      },
    });
    categoryIds.set(category.slug, saved.id);
  }

  const collectionIds = new Map<string, string>();
  for (const [sortOrder, collection] of collectionDefinitions.entries()) {
    const saved = await prisma.collection.upsert({
      where: { slug: collection.slug },
      update: {
        name: collection.name,
        description: collection.description,
        active: true,
        sortOrder,
        seoTitle: `${collection.name} | Shringaar`,
        seoDescription: collection.description,
      },
      create: {
        name: collection.name,
        slug: collection.slug,
        description: collection.description,
        sortOrder,
        seoTitle: `${collection.name} | Shringaar`,
        seoDescription: collection.description,
      },
    });
    collectionIds.set(collection.slug, saved.id);
  }

  let productCount = 0;
  for (const category of categories) {
    const names = productNames[category.slug];
    for (const [index, name] of names.entries()) {
      const slug = slugify(name);
      const material = materials[index];
      const stoneType = stones[index];
      const occasion = occasions[index];
      const price = priceByCategory[category.slug] + index * 170;
      const categoryId = requireSeedId(categoryIds, category.slug, "category");
      const productData = {
        name,
        description: `${name} pairs ${stoneType.toLowerCase()} detailing with a comfortable, lightweight ${material.toLowerCase()} base. Finished in rich 1g gold plating, this versatile piece is designed for Indian celebrations and thoughtful gifting.`,
        shortDescription: `${stoneType} detailing with a 1g gold-plated finish.`,
        categoryId,
        material,
        plating: "1g gold plating",
        stoneType,
        occasions: [occasion, index % 2 === 0 ? "Festive" : "Daily Wear"],
        specifications: {
          baseMaterial: material,
          finish: "1g gold plating",
          stone: stoneType,
          care: "Keep away from water, perfume and household chemicals.",
        },
        imageUrls: [imagesByCategory[category.slug]],
        active: true,
        featured: index === 0,
        seoTitle: `${name} | Shringaar`,
        seoDescription: `${name} by Shringaar. Shop imitation jewellery with ${stoneType.toLowerCase()} detailing and a 1g gold-plated finish.`,
      };
      const product = await prisma.product.upsert({
        where: { slug },
        update: productData,
        create: { ...productData, slug },
      });
      productCount += 1;

      for (const [finishIndex, finish] of ["Antique Gold", "Rose Gold"].entries()) {
        const sku = `${category.slug}-${String(index + 1).padStart(2, "0")}-${finishIndex === 0 ? "AG" : "RG"}`.toUpperCase();
        await prisma.productVariant.upsert({
          where: { sku },
          update: {
            productId: product.id,
            name: finish,
            color: finishIndex === 0 ? "Gold" : "Rose Gold",
            options: { finish, size: "One size" },
            price: (price + finishIndex * 100).toFixed(2),
            compareAtPrice: (price + 500 + finishIndex * 100).toFixed(2),
            inventoryQuantity: 8 + ((index * 7 + finishIndex * 5) % 28),
            active: true,
          },
          create: {
            productId: product.id,
            sku,
            name: finish,
            color: finishIndex === 0 ? "Gold" : "Rose Gold",
            options: { finish, size: "One size" },
            price: (price + finishIndex * 100).toFixed(2),
            compareAtPrice: (price + 500 + finishIndex * 100).toFixed(2),
            inventoryQuantity: 8 + ((index * 7 + finishIndex * 5) % 28),
          },
        });
      }

      for (const [sortOrder, collection] of collectionDefinitions.entries()) {
        if (collection.categories.includes(category.slug)) {
          const collectionId = requireSeedId(
            collectionIds,
            collection.slug,
            "collection",
          );
          await prisma.collectionProduct.upsert({
            where: {
              collectionId_productId: {
                collectionId,
                productId: product.id,
              },
            },
            update: { sortOrder: sortOrder * 100 + index },
            create: {
              collectionId,
              productId: product.id,
              sortOrder: sortOrder * 100 + index,
            },
          });
        }
      }
    }
  }

  console.info(`Catalog seed complete: ${categories.length} categories, ${productCount} products, ${productCount * 2} variants.`);
}

seed()
  .catch((error: unknown) => {
    console.error("Catalog seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
