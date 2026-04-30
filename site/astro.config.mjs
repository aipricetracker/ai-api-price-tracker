import { defineConfig } from "astro/config";

const site = process.env.PUBLIC_SITE_URL ?? "https://ai-api-price-tracker.pages.dev";

export default defineConfig({
  site,
});
