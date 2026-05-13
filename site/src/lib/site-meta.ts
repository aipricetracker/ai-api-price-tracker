import { text } from "./ui-text";

export const SITE_URL = import.meta.env.PUBLIC_SITE_URL ?? "https://ai-api-price-tracker.pages.dev";

export const SITE_NAME = text.siteName;

export const DEFAULT_OG_TYPE = "website";

export const TWITTER_CARD = "summary";

export const OG_IMAGE_PATH = "/og-image.png";

export const FAVICON_PATH = "/favicon.ico";

export const APPLE_TOUCH_ICON_PATH = "/apple-touch-icon.png";

export function buildCanonicalUrl(pathname: string): string {
  const url = new URL(pathname, SITE_URL);
  url.hash = "";
  url.search = "";
  return url.toString();
}

export function buildSiteAssetUrl(pathname: string): string {
  return new URL(pathname, SITE_URL).toString();
}
