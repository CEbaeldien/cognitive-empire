import type { MetadataRoute } from "next";

const SITE_URL = "https://store.cognitiveempire.com";

const ROUTES = [
  "/",
  "/products/operator-kernel",
  "/products/gravity-report",
  "/refunds",
  "/terms",
  "/privacy",
  "/legal",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: new Date(),
  }));
}
