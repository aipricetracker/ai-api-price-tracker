import { text } from "./ui-text";

export const SITE_URL = import.meta.env.PUBLIC_SITE_URL ?? "https://ai-api-price-tracker.pages.dev";

export const SITE_NAME = text.siteName;

export const DEFAULT_OG_TYPE = "website";

export const TWITTER_CARD = "summary";

export function buildCanonicalUrl(pathname: string): string {
  const url = new URL(pathname, SITE_URL);
  url.hash = "";
  url.search = "";
  return url.toString();
}
