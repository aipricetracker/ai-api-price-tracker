import {
  getModelDetailSlugs,
  getProviderSlugs,
} from "../lib/data";
import { buildCanonicalUrl } from "../lib/site-meta";

const STATIC_PATHS = [
  "/",
  "/changes/",
  "/providers/",
  "/about/",
  "/sources/",
  "/disclaimer/",
  "/privacy/",
];

export async function GET() {
  const [providers, modelSlugs] = await Promise.all([getProviderSlugs(), getModelDetailSlugs()]);
  const paths = new Set<string>(STATIC_PATHS);

  for (const provider of providers) {
    paths.add(`/providers/${encodeURIComponent(provider)}/`);
  }

  for (const { provider, model } of modelSlugs) {
    paths.add(`/providers/${encodeURIComponent(provider)}/${encodeURIComponent(model)}/`);
  }

  const urls = [...paths]
    .sort()
    .map((path) => `  <url><loc>${escapeXml(buildCanonicalUrl(path))}</loc></url>`)
    .join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}
