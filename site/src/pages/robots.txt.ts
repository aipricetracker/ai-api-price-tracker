import { buildCanonicalUrl } from "../lib/site-meta";

export function GET() {
  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${buildCanonicalUrl("/sitemap.xml")}\n`, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
