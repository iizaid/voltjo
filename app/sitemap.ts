import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://voltjo.com";

  const routes: Array<{ path: string; priority: number }> = [
    { path: "/", priority: 1.0 },
    { path: "/vehicles", priority: 0.9 },
    { path: "/charging-map", priority: 0.8 },
    { path: "/charging-calculator", priority: 0.8 },
    { path: "/assistant", priority: 0.8 },
    { path: "/start", priority: 0.7 },
  ];

  return routes.map(({ path, priority }) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority,
  }));
}
