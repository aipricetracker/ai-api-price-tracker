import {
  hasPricingChanged,
  replaceProviderPricing,
  validatePricingRecord,
} from "./pricing";
import { collectAnthropicTextModelPricing } from "./providers/anthropic";
import { collectOpenAiTextModelPricing } from "./providers/openai";
import { createFilePricingStore, createNodeFilePricingStoreIO } from "./storage";
import type { CurrentPricing, PricingHistory, PricingRecord } from "./types";

export interface Env {
  DATA_DIR?: string;
}

export default {
  async fetch(request: Request, _env: Env, _ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return Response.json({ status: "ok", service: "collector" });
    }

    const result = await runCollector(_env);
    return Response.json(result, { status: result.ok ? 200 : 400 });
  },

  async scheduled(_event: ScheduledEvent, _env: Env, _ctx: ExecutionContext): Promise<void> {
    const result = await runCollector(_env);

    if (!result.ok) {
      console.error("collector run failed", result.errors);
      return;
    }

    console.log("collector run completed", {
      currentProviders: Object.keys(result.current).length,
      historyCount: result.history.length,
      changedCount: result.changedCount,
      recordCount: result.recordCount,
    });
  },
};

export type CollectorResult =
  | {
      ok: true;
      changedCount: number;
      recordCount: number;
      records: PricingRecord[];
      current: CurrentPricing;
      history: PricingHistory;
    }
  | {
      ok: false;
      errors: string[];
    };

interface ProviderCollector {
  provider: string;
  collect: () => Promise<PricingRecord[]>;
}

export async function runCollector(env: Env): Promise<CollectorResult> {
  const dataDir = env.DATA_DIR;

  if (!dataDir) {
    return {
      ok: false,
      errors: ["DATA_DIR is required"],
    };
  }

  try {
    const store = createFilePricingStore(createNodeFilePricingStoreIO(), {
      currentPath: `${dataDir}/current-pricing.json`,
      historyPath: `${dataDir}/pricing-history.json`,
    });
    let nextCurrent = await store.getCurrent();
    const allRecords: PricingRecord[] = [];
    const changedRecords: PricingRecord[] = [];

    for (const collector of providerCollectors()) {
      const records = await collector.collect();
      const validationErrors = validatePricingRecords(records);

      if (validationErrors.length > 0) {
        return {
          ok: false,
          errors: validationErrors,
        };
      }

      const previousProviderPricing = nextCurrent[collector.provider] ?? {};
      const providerChangedRecords = records.filter((record) =>
        hasPricingChanged(previousProviderPricing[record.model], record),
      );

      nextCurrent = replaceProviderPricing(nextCurrent, collector.provider, records);
      allRecords.push(...records);
      changedRecords.push(...providerChangedRecords);
    }

    await store.saveCurrent(nextCurrent);

    for (const record of changedRecords) {
      await store.appendHistory(record);
    }

    const nextHistory = await store.getHistory();

    return {
      ok: true,
      changedCount: changedRecords.length,
      recordCount: allRecords.length,
      records: allRecords,
      current: nextCurrent,
      history: nextHistory,
    };
  } catch (error) {
    return {
      ok: false,
      errors: [error instanceof Error ? error.message : "collector run failed"],
    };
  }
}

function validatePricingRecords(records: PricingRecord[]): string[] {
  const errors: string[] = [];

  for (const record of records) {
    const validation = validatePricingRecord(record);

    if (!validation.success) {
      errors.push(...validation.errors.map((error) => `${record.provider}/${record.model}: ${error}`));
    }
  }

  return errors;
}

function providerCollectors(): ProviderCollector[] {
  return [
    {
      provider: "openai",
      collect: () => collectOpenAiTextModelPricing(),
    },
    {
      provider: "anthropic",
      collect: () => collectAnthropicTextModelPricing(),
    },
  ];
}
