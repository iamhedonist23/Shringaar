import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = process.env.AUTH_URL || "http://localhost:3000";
  const updatedAt = new Date();
  return [
    { url: new URL("/", origin).toString(), lastModified: updatedAt },
    { url: new URL("/search", origin).toString(), lastModified: updatedAt },
    { url: new URL("/collections/festive-glow", origin).toString(), lastModified: updatedAt },
    { url: new URL("/collections/bridal-edit", origin).toString(), lastModified: updatedAt },
    { url: new URL("/occasion/bridal", origin).toString(), lastModified: updatedAt },
    { url: new URL("/budget/under-1500", origin).toString(), lastModified: updatedAt },
  ];
}
