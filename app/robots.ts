import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://voltjo.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/vehicles",
          "/charging-map",
          "/charging-calculator",
          "/assistant",
          "/start",
        ],
        disallow: ["/account", "/dashboard", "/auth/", "/api/"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
