import {
  hasPricingChanged,
  validatePricingRecord,
} from "./pricing";
import { appendPricingHistory, updateCurrentPricing } from "./pricing";
import { createInMemoryPricingStore } from "./storage";
import type { CurrentPricing, PricingHistory, PricingRecord } from "./types";

export interface Env {}

export default {
  async fetch(request: Request, _env: Env, _ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return Response.json({ status: "ok", service: "collector" });
    }

    const result = await runCollector();
    return Response.json(result, { status: result.ok ? 200 : 400 });
  },

  async scheduled(_event: ScheduledEvent, _env: Env, _ctx: ExecutionContext): Promise<void> {
    const result = await runCollector();

    if (!result.ok) {
      console.error("collector run failed", result.errors);
      return;
    }

    console.log("collector run completed", {
      currentProviders: Object.keys(result.current).length,
      historyCount: result.history.length,
      changed: result.changed,
    });
  },
};

type CollectorResult =
  | {
      ok: true;
      changed: boolean;
      record: PricingRecord;
      current: CurrentPricing;
      history: PricingHistory;
    }
  | {
      ok: false;
      errors: string[];
    };

async function runCollector(): Promise<CollectorResult> {
  const store = createInMemoryPricingStore();
  const current = await store.getCurrent();

  const record = createDummyOpenAiRecord();
  const validation = validatePricingRecord(record);

  if (!validation.success) {
    return {
      ok: false,
      errors: validation.errors,
    };
  }

  const previous = current[record.provider]?.[record.model];
  const changed = hasPricingChanged(previous, record);
  const nextCurrent = updateCurrentPricing(current, record);

  await store.saveCurrent(nextCurrent);

  if (changed) {
    await store.appendHistory(record);
  }

  const nextHistory = await store.getHistory();

  return {
    ok: true,
    changed,
    record,
    current: nextCurrent,
    history: nextHistory,
  };
}

function createDummyOpenAiRecord(): PricingRecord {
  const recordedAt = new Date().toISOString();

  return {
    provider: "openai",
    model: "gpt-4.1",
    pricing: {
      input: 0.00001,
      output: 0.00003,
    },
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
