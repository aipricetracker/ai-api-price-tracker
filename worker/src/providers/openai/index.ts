import type { Pricing, PricingRecord } from "../../types";

const OPENAI_PRICING_URL = "https://openai.com/api/pricing/";
const FETCH_ATTEMPTS = 3;

export interface OpenAiParserDebugInfo {
  flagshipSectionDetectionCount: number;
  priceCardCandidateCount: number;
  rawModelEntryCount: number;
  normalizedRecordCount: number;
}

export interface CollectOpenAiOptions {
  debug?: boolean;
}

export interface OpenAiParseResult {
  records: PricingRecord[];
  debug: OpenAiParserDebugInfo;
}

export async function collectOpenAiTextModelPricing(
  options: CollectOpenAiOptions = {},
): Promise<PricingRecord[]> {
  const recordedAt = new Date().toISOString();
  const html = await fetchOpenAiPricingPage();
  const result = parseOpenAiTextModelPricing(html, recordedAt);

  if (options.debug) {
    console.log("openai parser debug", result.debug);
  }

  if (result.records.length < 1) {
    throw new Error("openai pricing fetch returned 0 text pricing records");
  }

  return result.records;
}

async function fetchOpenAiPricingPage(): Promise<string> {
  let lastError: unknown;

  for (let attempt = 0; attempt < FETCH_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(OPENAI_PRICING_URL, {
        headers: {
          accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "accept-language": "en-US,en;q=0.9",
          "user-agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        },
      });

      if (!response.ok) {
        throw new Error(`openai pricing fetch failed with status ${response.status}`);
      }

      const html = await response.text();

      if (html.includes("<title>Just a moment...</title>")) {
        throw new Error("openai pricing fetch hit Cloudflare challenge");
      }

      if (!html.includes("Flagship models") || !html.includes("Our APIs")) {
        throw new Error("openai pricing page structure not found");
      }

      return html;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("openai pricing fetch failed");
}

export function parseOpenAiTextModelPricing(html: string, recordedAt: string): OpenAiParseResult {
  const flagshipSectionDetectionCount = countOccurrences(html, "Flagship models");
  const flagshipSectionStart = html.indexOf("Flagship models");
  const ourApisStart = html.indexOf("Our APIs");

  if (flagshipSectionStart < 0 || ourApisStart < 0 || flagshipSectionStart >= ourApisStart) {
    return {
      records: [],
      debug: {
        flagshipSectionDetectionCount,
        priceCardCandidateCount: 0,
        rawModelEntryCount: 0,
        normalizedRecordCount: 0,
      },
    };
  }

  const flagshipSection = html.slice(flagshipSectionStart, ourApisStart);
  const records: PricingRecord[] = [];
  let rawModelEntryCount = 0;

  const cardPattern =
    /<h2 class="text-h4">([^<]+)<\/h2>[\s\S]*?<h3 class="text-p2 !text-balance font-semibold">([^<]+)<\/h3>([\s\S]*?)(?=<\/div><\/div><div class="border border-primary-12|<\/section>)/g;
  const cardMatches = [...flagshipSection.matchAll(cardPattern)];

  for (const match of cardMatches) {
    const modelName = match[1]?.trim();
    const priceHeading = match[2]?.trim();
    const cardHtml = match[3] ?? "";

    if (!modelName || priceHeading !== "Price") {
      continue;
    }

    rawModelEntryCount += 1;
    const pricing = parsePricingBlock(cardHtml);

    if (!pricing.input && !pricing.output) {
      continue;
    }

    records.push({
      provider: "openai",
      model: toModelSlug(modelName),
      pricing,
      currency: "USD",
      unit: "1M tokens",
      source_url: OPENAI_PRICING_URL,
      effective_date: recordedAt.slice(0, 10),
      recorded_at: recordedAt,
    });
  }

  return {
    records,
    debug: {
      flagshipSectionDetectionCount,
      priceCardCandidateCount: cardMatches.length,
      rawModelEntryCount,
      normalizedRecordCount: records.length,
    },
  };
}

function parsePricingBlock(cardHtml: string): Pricing {
  const pricing: Pricing = {};
  const pricePattern = /<span>(Input|Cached input|Output):<br\/>\$([0-9.]+)\s*\/\s*1M tokens<\/span>/g;

  for (const match of cardHtml.matchAll(pricePattern)) {
    const label = match[1];
    const amount = Number(match[2]);

    if (!Number.isFinite(amount)) {
      continue;
    }

    if (label === "Input") {
      pricing.input = amount;
    } else if (label === "Cached input") {
      pricing.cached_input = amount;
    } else if (label === "Output") {
      pricing.output = amount;
    }
  }

  return pricing;
}

function toModelSlug(modelName: string): string {
  return modelName.toLowerCase().replace(/\s+/g, "-");
}

function countOccurrences(value: string, search: string): number {
  return value.split(search).length - 1;
}
