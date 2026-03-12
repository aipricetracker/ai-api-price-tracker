import type { CurrentPricing, PricingHistory, PricingRecord } from "./types";

export interface PricingStoreData {
  current: CurrentPricing;
  history: PricingHistory;
}

export function createInitialPricingData(): PricingStoreData {
  return {
    current: {
      openai: {
        "gpt-4.1": {
          provider: "openai",
          model: "gpt-4.1",
          pricing: {
            input: 0.00001,
            output: 0.00003,
          },
          currency: "USD",
          unit: "1K tokens",
          source_url: "https://openai.com/api/pricing/",
          effective_date: "2026-03-12",
          recorded_at: "2026-03-12T00:00:00Z",
        },
      },
      anthropic: {
        "claude-3-7-sonnet": {
          provider: "anthropic",
          model: "claude-3-7-sonnet",
          pricing: {
            input: 0.000003,
            output: 0.000015,
          },
          currency: "USD",
          unit: "1K tokens",
          source_url: "https://www.anthropic.com/pricing#api",
          effective_date: "2026-03-12",
          recorded_at: "2026-03-12T00:00:00Z",
        },
      },
    },
    history: [
      {
        provider: "openai",
        model: "gpt-4.1",
        pricing: {
          input: 0.00001,
          output: 0.00003,
        },
        currency: "USD",
        unit: "1K tokens",
        source_url: "https://openai.com/api/pricing/",
        effective_date: "2026-03-12",
        recorded_at: "2026-03-12T00:00:00Z",
      },
      {
        provider: "anthropic",
        model: "claude-3-7-sonnet",
        pricing: {
          input: 0.000003,
          output: 0.000015,
        },
        currency: "USD",
        unit: "1K tokens",
        source_url: "https://www.anthropic.com/pricing#api",
        effective_date: "2026-03-12",
        recorded_at: "2026-03-12T00:00:00Z",
      },
    ],
  };
}

export function createDummyOpenAiRecord(): PricingRecord {
  const recordedAt = new Date().toISOString();

  return createOpenAiRecord({
    pricing: {
      input: 0.00001,
      output: 0.00003,
    },
    recordedAt,
  });
}

export function createChangedOpenAiRecord(recordedAt: string): PricingRecord {
  return createOpenAiRecord({
    pricing: {
      input: 0.00002,
      output: 0.00003,
    },
    recordedAt,
  });
}

function createOpenAiRecord({
  pricing,
  recordedAt,
}: {
  pricing: PricingRecord["pricing"];
  recordedAt: string;
}): PricingRecord {
  return {
    provider: "openai",
    model: "gpt-4.1",
    pricing,
    currency: "USD",
    unit: "1K tokens",
    source_url: "https://openai.com/api/pricing/",
    effective_date: toUtcDate(recordedAt),
    recorded_at: recordedAt,
  };
}

function toUtcDate(timestamp: string): string {
  return timestamp.slice(0, 10);
}
