import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { parseAnthropicTextModelPricing } from "../src/providers/anthropic/index.ts";

const testDir = dirname(fileURLToPath(import.meta.url));
const fixturePath = resolve(testDir, "../fixtures/anthropic-pricing-page.html");

test("Anthropic parser normalizes at least one text pricing record", async () => {
  const html = await readFile(fixturePath, "utf8");
  const result = parseAnthropicTextModelPricing(html, "2026-03-13T00:00:00Z");

  assert.ok(result.debug.apiCardCandidateCount >= 1);
  assert.ok(result.debug.rawModelEntryCount >= 1);
  assert.ok(result.records.length >= 1);
});

test("Anthropic parser records include model and numeric input/output pricing", async () => {
  const html = await readFile(fixturePath, "utf8");
  const result = parseAnthropicTextModelPricing(html, "2026-03-13T00:00:00Z");

  for (const record of result.records) {
    assert.ok(record.model);
    assert.equal(typeof record.pricing.input, "number");
    assert.equal(typeof record.pricing.output, "number");
  }
});
