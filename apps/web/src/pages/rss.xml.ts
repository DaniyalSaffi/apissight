import type { APIRoute } from "astro";
import { newsPosts } from "../data/news";
import { SITE } from "../site.config";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export const GET: APIRoute = ({ site }) => {
  const base = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");
  const siteUrl = (site ? site.toString() : SITE.siteUrl).replace(/\/$/, "");
  const items = newsPosts
    .map((post) => {
      const link = `${siteUrl}${base}/news/#${post.slug}`;
      const pubDate = new Date(`${post.date}T00:00:00Z`).toUTCString();
      return [
        "<item>",
        `<title>${escapeXml(post.title)}</title>`,
        `<link>${link}</link>`,
        `<guid>${link}</guid>`,
        `<pubDate>${pubDate}</pubDate>`,
        `<description>${escapeXml(post.summary)}</description>`,
        "</item>",
      ].join("\n");
    })
    .join("\n");
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0">',
    "<channel>",
    `<title>${escapeXml(SITE.name)} news</title>`,
    `<link>${siteUrl}${base}/news/</link>`,
    `<description>Updates about the ${escapeXml(SITE.name)} project.</description>`,
    "<language>en</language>",
    items,
    "</channel>",
    "</rss>",
    "",
  ].join("\n");
  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
};
