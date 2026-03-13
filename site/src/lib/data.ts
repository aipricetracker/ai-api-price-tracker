import { readFile } from "node:fs/promises";
import type {
  CurrentPricing,
  HistoryFieldDiff,
  HistoryEntry,
  PricingHistory,
  PricingRecord,
  ProviderModelSummary,
  ProviderOverview,
} from "./types";

const CURRENT_PRICING_PATH = new URL("../../../data/current-pricing.json", import.meta.url);
const PRICING_HISTORY_PATH = new URL("../../../data/pricing-history.json", import.meta.url);

const PROVIDER_NOTES: Record<string, string | undefined> = {
  anthropic:
    "Anthropic の cached_input は Prompt caching Read price の近似マッピングです。",
};

const POC_HISTORY_SIGNATURES = new Set([
  "openai:gpt-4.1:1K tokens",
  "anthropic:claude-3-7-sonnet:1K tokens",
]);

export async function getProviderOverviewList(): Promise<ProviderOverview[]> {
  const current = await readCurrentPricing();

  return Object.entries(current)
    .map(([provider, models]) => {
      const modelNames = Object.keys(models).sort();

      return {
        provider,
        modelCount: modelNames.length,
        models: modelNames,
        cachedInputNote: PROVIDER_NOTES[provider],
      };
    })
    .sort((left, right) => left.provider.localeCompare(right.provider));
}

export async function getProviderModelList(provider: string): Promise<ProviderModelSummary[]> {
  const current = await readCurrentPricing();
  const providerModels = current[provider] ?? {};

  return Object.values(providerModels)
    .sort((left, right) => left.model.localeCompare(right.model))
    .map((record) => ({
      ...record,
      cachedInputNote: PROVIDER_NOTES[record.provider],
    }));
}

export async function getModelHistory(provider: string, model: string): Promise<HistoryEntry[]> {
  const history = await readPricingHistory();
  const visibleHistory = history
    .filter((record) => record.provider === provider && record.model === model)
    .filter((record) => !isHiddenPocRecord(record))
    .sort((left, right) => left.recorded_at.localeCompare(right.recorded_at));

  return visibleHistory.map((record, index) => ({
    record,
    changedFields: getChangedFields(visibleHistory[index - 1], record),
    fieldDiffs: getFieldDiffs(visibleHistory[index - 1], record),
    isHiddenPocRecord: false,
  }));
}

export async function getProviderSlugs(): Promise<string[]> {
  const providers = await getProviderOverviewList();
  return providers.map((provider) => provider.provider);
}

export async function getProviderModelSlugs(provider: string): Promise<string[]> {
  const models = await getProviderModelList(provider);
  return models.map((model) => model.model);
}

export async function getCurrentModel(provider: string, model: string): Promise<ProviderModelSummary | null> {
  const models = await getProviderModelList(provider);
  return models.find((record) => record.model === model) ?? null;
}

export function formatPrice(value: number | undefined): string {
  if (typeof value !== "number") {
    return "-";
  }

  return `${trimTrailingZeros(value)} USD`;
}

async function readCurrentPricing(): Promise<CurrentPricing> {
  return readJsonFile<CurrentPricing>(CURRENT_PRICING_PATH, {});
}

async function readPricingHistory(): Promise<PricingHistory> {
  return readJsonFile<PricingHistory>(PRICING_HISTORY_PATH, []);
}

async function readJsonFile<T>(path: URL, fallback: T): Promise<T> {
  try {
    const content = await readFile(path, "utf8");

    if (content.trim().length === 0) {
      return fallback;
    }

    return JSON.parse(content) as T;
  } catch {
    return fallback;
  }
}

function getChangedFields(previous: PricingRecord | undefined, next: PricingRecord): string[] {
  if (!previous) {
    return ["initial_record"];
  }

  const changedFields: string[] = [];
  const priceKeys = new Set([...Object.keys(previous.pricing), ...Object.keys(next.pricing)]);

  for (const key of priceKeys) {
    if (previous.pricing[key] !== next.pricing[key]) {
      changedFields.push(`pricing.${key}`);
    }
  }

  if (previous.currency !== next.currency) {
    changedFields.push("currency");
  }

  if (previous.unit !== next.unit) {
    changedFields.push("unit");
  }

  return changedFields.length > 0 ? changedFields : ["no_price_change"];
}

function getFieldDiffs(previous: PricingRecord | undefined, next: PricingRecord): HistoryFieldDiff[] {
  if (!previous) {
    return [
      {
        field: "initial_record",
        label: "Initial record",
        before: "-",
        after: "First visible record",
      },
    ];
  }

  const diffs: HistoryFieldDiff[] = [];

  for (const key of ["input", "cached_input", "output"]) {
    if (previous.pricing[key] !== next.pricing[key]) {
      diffs.push({
        field: `pricing.${key}`,
        label: toFieldLabel(key),
        before: formatPrice(previous.pricing[key]),
        after: formatPrice(next.pricing[key]),
        changeRate: formatChangeRate(previous.pricing[key], next.pricing[key]),
      });
    }
  }

  if (previous.currency !== next.currency) {
    diffs.push({
      field: "currency",
      label: "Currency",
      before: previous.currency,
      after: next.currency,
    });
  }

  if (previous.unit !== next.unit) {
    diffs.push({
      field: "unit",
      label: "Unit",
      before: previous.unit,
      after: next.unit,
    });
  }

  return diffs;
}

function isHiddenPocRecord(record: PricingRecord): boolean {
  // Temporary UI-only suppression for known PoC seed history.
  // The append-only history file stays untouched; the UI hides legacy sample noise until real history fully replaces it.
  return POC_HISTORY_SIGNATURES.has(`${record.provider}:${record.model}:${record.unit}`);
}

function trimTrailingZeros(value: number): string {
  return value.toLocaleString("en-US", {
    maximumFractionDigits: 6,
    minimumFractionDigits: 0,
  });
}

function toFieldLabel(field: string): string {
  if (field === "input") {
    return "Input";
  }

  if (field === "cached_input") {
    return "Cached input";
  }

  if (field === "output") {
    return "Output";
  }

  return field;
}

function formatChangeRate(previous: number | undefined, next: number | undefined): string | undefined {
  if (typeof previous !== "number" || typeof next !== "number") {
    return undefined;
  }

  if (previous === 0) {
    return undefined;
  }

  const rate = ((next - previous) / previous) * 100;
  const sign = rate > 0 ? "+" : "";

  return `${sign}${trimTrailingZeros(rate)}%`;
}
