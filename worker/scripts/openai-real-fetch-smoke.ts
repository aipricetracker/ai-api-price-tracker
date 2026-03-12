import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { collectOpenAiTextModelPricing } from "../src/providers/openai";
import {
  hasPricingChanged,
  replaceProviderPricing,
  validatePricingRecord,
} from "../src/pricing";
import {
  createFilePricingStore,
  createNodeFilePricingStoreIO,
} from "../src/storage";

async function main(): Promise<void> {
  const store = createFilePricingStore(createNodeFilePricingStoreIO(), dataPaths());
  const records = await collectOpenAiTextModelPricing();
  const firstRun = await runOnce(store, records);
  const secondRun = await runOnce(store, records);

  console.log(
    JSON.stringify(
      {
        recordCount: records.length,
        models: records.map((record) => record.model),
        firstRun,
        secondRun,
      },
      null,
      2,
    ),
  );
}

async function runOnce(
  store: ReturnType<typeof createFilePricingStore>,
  records: Awaited<ReturnType<typeof collectOpenAiTextModelPricing>>,
): Promise<{
  changedCount: number;
  historyCount: number;
  openAiModels: string[];
}> {
  const current = await store.getCurrent();
  const previousProviderPricing = current.openai ?? {};
  const validationErrors = records.flatMap((record) => {
    const validation = validatePricingRecord(record);
    return validation.success ? [] : validation.errors.map((error) => `${record.model}: ${error}`);
  });

  if (validationErrors.length > 0) {
    throw new Error(`validation failed: ${validationErrors.join(", ")}`);
  }

  const changedRecords = records.filter((record) =>
    hasPricingChanged(previousProviderPricing[record.model], record),
  );
  const nextCurrent = replaceProviderPricing(current, "openai", records);

  await store.saveCurrent(nextCurrent);

  for (const record of changedRecords) {
    await store.appendHistory(record);
  }

  const history = await store.getHistory();

  return {
    changedCount: changedRecords.length,
    historyCount: history.length,
    openAiModels: Object.keys(nextCurrent.openai ?? {}),
  };
}

function dataPaths(): { currentPath: string; historyPath: string } {
  const scriptsDir = dirname(fileURLToPath(import.meta.url));
  const repoRoot = resolve(scriptsDir, "../..");

  return {
    currentPath: resolve(repoRoot, "data/current-pricing.json"),
    historyPath: resolve(repoRoot, "data/pricing-history.json"),
  };
}

void main();
