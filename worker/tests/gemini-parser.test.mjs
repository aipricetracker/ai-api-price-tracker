import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { parseGeminiTextModelPricing } from "../src/providers/gemini/index.ts";

const testDir = dirname(fileURLToPath(import.meta.url));
const fixturePath = resolve(testDir, "../fixtures/gemini-pricing-page.md.txt");

test("Gemini parser normalizes standard paid text pricing records", async () => {
  const markdown = await readFile(fixturePath, "utf8");
  const result = parseGeminiTextModelPricing(markdown, "2026-05-15T00:00:00Z");

  assert.ok(result.debug.modelSectionCandidateCount >= 1);
  assert.ok(result.debug.standardPricingCandidateCount >= 1);
  assert.equal(result.records.length, 1);
});

test("Gemini parser records include required normalized pricing fields", async () => {
  const markdown = await readFile(fixturePath, "utf8");
  const result = parseGeminiTextModelPricing(markdown, "2026-05-15T00:00:00Z");
  const record = result.records[0];

  assert.equal(record.provider, "gemini");
  assert.equal(record.model, "gemini-example-stable");
  assert.equal(record.pricing.input, 0.25);
  assert.equal(record.pricing.output, 1.5);
  assert.equal(record.currency, "USD");
  assert.equal(record.unit, "1M tokens");
  assert.equal(record.source_url, "https://ai.google.dev/gemini-api/docs/pricing.md.txt");
  assert.equal(record.effective_date, "2026-05-15");
  assert.equal(record.recorded_at, "2026-05-15T00:00:00Z");
});

test("Gemini parser excludes preview and tiered pricing models", async () => {
  const markdown = await readFile(fixturePath, "utf8");
  const result = parseGeminiTextModelPricing(markdown, "2026-05-15T00:00:00Z");
  const models = result.records.map((record) => record.model);

  assert.ok(models.includes("gemini-example-stable"));
  assert.ok(!models.includes("gemini-example-preview"));
  assert.ok(!models.includes("gemini-example-tiered"));
  assert.ok(!models.includes("gemini-example-image"));
  assert.equal(result.debug.skippedPreviewCount, 1);
  assert.equal(result.debug.skippedTieredPricingCount, 1);
  assert.equal(result.debug.skippedNonTextModelCount, 1);
});
