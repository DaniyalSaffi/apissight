import type { APIRoute } from "astro";
import { SITE } from "../site.config";

/**
 * Sitemap. Gated by the single allowIndexing switch: while it is false, the
 * sitemap is an empty urlset, matching the noindex meta tags on every page.
 * When the owner flips allowIndexing, this lists every route. Keep this list
 * in sync with the pages under src/pages (the link checker counts them).
 */
const routes = [
  "/",
  "/awards/",
  "/contact/",
  "/credits/",
  "/de/",
  "/detector/",
  "/faq/",
  "/field-work/",
  "/imprint/",
  "/journey/",
  "/learn/",
  "/models-data/",
  "/news/",
  "/partnership/",
  "/press/",
  "/privacy/",
  "/project/",
  "/research/",
  "/roadmap/",
  "/search/",
  "/team/",
  "/terms/",
  "/ur/",
];

export const GET: APIRoute = ({ site }) => {
  const base = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");
  const siteUrl = (site ? site.toString() : SITE.siteUrl).replace(/\/$/, "");
  const lastmod = new Date().toISOString().slice(0, 10);
  const urls = SITE.allowIndexing
    ? routes
        .map(
          (route) =>
            `<url><loc>${siteUrl}${base}${route}</loc><lastmod>${lastmod}</lastmod></url>`,
        )
        .join("\n")
    : "";
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urls,
    "</urlset>",
    "",
  ].join("\n");
  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
};
