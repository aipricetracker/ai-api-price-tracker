import {
  hasPricingChanged,
  replaceProviderPricing,
  validatePricingRecord,
} from "./pricing";
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

type CollectorResult =
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

async function runCollector(env: Env): Promise<CollectorResult> {
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
    const current = await store.getCurrent();
    const records = await collectOpenAiTextModelPricing();
    const validationErrors = validatePricingRecords(records);

    if (validationErrors.length > 0) {
      return {
        ok: false,
        errors: validationErrors,
      };
    }

    const previousProviderPricing = current.openai ?? {};
    const changedRecords = records.filter((record) =>
      hasPricingChanged(previousProviderPricing[record.model], record),
    );
    const nextCurrent = replaceProviderPricing(current, "openai", records);

    await store.saveCurrent(nextCurrent);

    for (const record of changedRecords) {
      await store.appendHistory(record);
    }

    const nextHistory = await store.getHistory();

    return {
      ok: true,
      changedCount: changedRecords.length,
      recordCount: records.length,
      records,
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
