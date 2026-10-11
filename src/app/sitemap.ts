import type { MetadataRoute } from "next";
import { tools } from "@/lib/tools";

const site = "https://qword.tech";
export default function sitemap(): MetadataRoute.Sitemap {
  const statics = ["", "/about", "/privacy", "/terms"].map((route) => ({ url: `${site}${route}`, changeFrequency: "weekly" as const, priority: route ? 0.7 : 1 }));
  return [...statics, ...tools.map((tool) => ({ url: `${site}/tool/${encodeURIComponent(tool.slug)}`, changeFrequency: "weekly" as const, priority: 0.7 }))];
}
