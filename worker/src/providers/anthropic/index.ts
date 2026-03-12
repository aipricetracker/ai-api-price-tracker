import type { Pricing, PricingRecord } from "../../types";

const ANTHROPIC_PRICING_URL = "https://claude.com/pricing";
const FETCH_ATTEMPTS = 3;

export interface AnthropicParserDebugInfo {
  apiCardCandidateCount: number;
  rawModelEntryCount: number;
  normalizedRecordCount: number;
}

export interface CollectAnthropicOptions {
  debug?: boolean;
}

export interface AnthropicParseResult {
  records: PricingRecord[];
  debug: AnthropicParserDebugInfo;
}

export async function collectAnthropicTextModelPricing(
  options: CollectAnthropicOptions = {},
): Promise<PricingRecord[]> {
  const recordedAt = new Date().toISOString();
  const html = await fetchAnthropicPricingPage();
  const result = parseAnthropicTextModelPricing(html, recordedAt);

  if (options.debug) {
    console.log("anthropic parser debug", result.debug);
  }

  if (result.records.length < 1) {
    throw new Error("anthropic pricing fetch returned 0 text pricing records");
  }

  return result.records;
}

async function fetchAnthropicPricingPage(): Promise<string> {
  let lastError: unknown;

  for (let attempt = 0; attempt < FETCH_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(ANTHROPIC_PRICING_URL, {
        headers: {
          accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "accept-language": "en-US,en;q=0.9",
          "user-agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        },
      });

      if (!response.ok) {
        throw new Error(`anthropic pricing fetch failed with status ${response.status}`);
      }

      const html = await response.text();

      if (!html.includes("card_pricing_api_wrap") || !html.includes("data-api-price")) {
        throw new Error("anthropic pricing page structure not found");
      }

      return html;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("anthropic pricing fetch failed");
}

export function parseAnthropicTextModelPricing(html: string, recordedAt: string): AnthropicParseResult {
  const records: PricingRecord[] = [];
  let rawModelEntryCount = 0;
  const cardSegments = html.split('card_pricing_api_wrap u-theme-white').slice(1);

  for (const segment of cardSegments) {
    const cardHtml = segment;
    const modelName = extractCardTitle(cardHtml);

    if (!modelName || !isTextModelCard(modelName)) {
      continue;
    }

    rawModelEntryCount += 1;
    const pricing = parsePricingBlock(cardHtml);

    if (typeof pricing.input !== "number" || typeof pricing.output !== "number") {
      continue;
    }

    records.push({
      provider: "anthropic",
      model: toModelSlug(modelName),
      pricing,
      currency: "USD",
      unit: "1M tokens",
      source_url: ANTHROPIC_PRICING_URL,
      effective_date: recordedAt.slice(0, 10),
      recorded_at: recordedAt,
    });
  }

  return {
    records,
    debug: {
      apiCardCandidateCount: cardSegments.length,
      rawModelEntryCount,
      normalizedRecordCount: records.length,
    },
  };
}

function extractCardTitle(cardHtml: string): string | null {
  const match = cardHtml.match(/card_pricing_title_text[^>]*>([^<]+)<\/h3>/);
  return match?.[1]?.trim() ?? null;
}

function isTextModelCard(modelName: string): boolean {
  return /^(Opus|Sonnet|Haiku)\s/i.test(modelName);
}

function parsePricingBlock(cardHtml: string): Pricing {
  const pricing: Pricing = {};

  pricing.input = extractSingleValue(cardHtml, "Input");
  pricing.output = extractSingleValue(cardHtml, "Output");
  // Anthropic exposes prompt caching as Write/Read prices instead of a direct cached input field.
  // For the current shared schema, we map the Read price to cached_input as the closest equivalent.
  pricing.cached_input = extractPromptCachingReadValue(cardHtml);

  return pricing;
}

function extractSingleValue(cardHtml: string, label: "Input" | "Output"): number | undefined {
  const pattern = new RegExp(
    `tokens_main_label u-text-style-body-2">${label}<\\/div>[\\s\\S]*?<span data-value="([0-9.]+)" class="tokens_main_val_number">`,
  );
  const match = cardHtml.match(pattern);
  const value = match?.[1] ? Number(match[1]) : Number.NaN;
  return Number.isFinite(value) ? value : undefined;
}

function extractPromptCachingReadValue(cardHtml: string): number | undefined {
  const cachingSectionMatch = cardHtml.match(
    /tokens_main_label u-text-style-body-2">Prompt caching<\/div>[\s\S]*?(?=<div class="tokens_l1_wrap|$)/,
  );

  if (!cachingSectionMatch) {
    return undefined;
  }

  const readMatch = cachingSectionMatch[0].match(
    /tokens_main_label u-text-style-body-3 u-foreground-tertiary">Read<\/div><div data-api-price="" class="tokens_main_val u-text-style-body-1 u-weight-semibold"><span class="tokens_main_val_span">\$<\/span><span data-value="([0-9.]+)" class="tokens_main_val_number">/,
  );
  const value = readMatch?.[1] ? Number(readMatch[1]) : Number.NaN;
  return Number.isFinite(value) ? value : undefined;
}

function toModelSlug(modelName: string): string {
  return `claude-${modelName.toLowerCase().replace(/\s+/g, "-")}`;
}
