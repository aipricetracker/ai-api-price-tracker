import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { createChangedOpenAiRecord, createInitialPricingData } from "../src/fixtures";
import {
  createFilePricingStore,
  createNodeFilePricingStoreIO,
} from "../src/storage";
import { hasPricingChanged, updateCurrentPricing, validatePricingRecord } from "../src/pricing";

async function main(): Promise<void> {
  const paths = dataPaths();
  const io = createNodeFilePricingStoreIO();
  const initialData = createInitialPricingData();

  await io.writeText(paths.currentPath, `${JSON.stringify(initialData.current, null, 2)}\n`);
  await io.writeText(paths.historyPath, `${JSON.stringify(initialData.history, null, 2)}\n`);

  const store = createFilePricingStore(io, paths);
  const fixedRecordedAt = "2026-03-13T00:00:00Z";
  const record = createChangedOpenAiRecord(fixedRecordedAt);

  const firstRun = await runOnce(store, record);
  const secondRun = await runOnce(store, record);

  console.log(JSON.stringify({
    firstRun,
    secondRun,
  }, null, 2));
}

async function runOnce(
  store: ReturnType<typeof createFilePricingStore>,
  record: ReturnType<typeof createChangedOpenAiRecord>,
): Promise<{
  changed: boolean;
  currentOpenAiInput: number | undefined;
  historyCount: number;
}> {
  const validation = validatePricingRecord(record);

  if (!validation.success) {
    throw new Error(`validation failed: ${validation.errors.join(", ")}`);
  }

  const current = await store.getCurrent();
  const previous = current[record.provider]?.[record.model];
  const changed = hasPricingChanged(previous, record);
  const nextCurrent = updateCurrentPricing(current, record);

  await store.saveCurrent(nextCurrent);

  if (changed) {
    await store.appendHistory(record);
  }

  const nextHistory = await store.getHistory();

  return {
    changed,
    currentOpenAiInput: nextCurrent.openai?.["gpt-4.1"]?.pricing.input,
    historyCount: nextHistory.length,
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
