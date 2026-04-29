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
import { DEFAULT_LOCALE } from "./locale";
import { text } from "./ui-text";

const CURRENT_PRICING_PATH = new URL("../../../data/current-pricing.json", import.meta.url);
const PRICING_HISTORY_PATH = new URL("../../../data/pricing-history.json", import.meta.url);

const PROVIDER_NOTES: Record<string, string | undefined> = {
  anthropic: text.cachedInputNoteAnthropic,
};

const POC_HISTORY_SIGNATURES = new Set([
  "openai:gpt-4.1:1K tokens",
  "anthropic:claude-3-7-sonnet:1K tokens",
]);

const DEV_MODEL_HISTORY_FIXTURES: Record<string, PricingRecord[]> = {
  "openai:gpt-5.4-mini": [
    {
      provider: "openai",
      model: "gpt-5.4-mini",
      pricing: {
        input: 0.3,
        cached_input: 0.03,
        output: 1.2,
      },
      currency: "USD",
      unit: "1M tokens",
      source_url: "https://openai.com/api/pricing/",
      effective_date: "2026-03-18",
      recorded_at: "2026-03-18T09:00:00Z",
    },
    {
      provider: "openai",
      model: "gpt-5.4-mini",
      pricing: {
        input: 0.35,
        cached_input: 0.035,
        output: 1.4,
      },
      currency: "USD",
      unit: "1M tokens",
      source_url: "https://openai.com/api/pricing/",
      effective_date: "2026-04-03",
      recorded_at: "2026-04-03T09:00:00Z",
    },
    {
      provider: "openai",
      model: "gpt-5.4-mini",
      pricing: {
        input: 0.4,
        cached_input: 0.04,
        output: 1.6,
      },
      currency: "USD",
      unit: "1M tokens",
      source_url: "https://openai.com/api/pricing/",
      effective_date: "2026-04-18",
      recorded_at: "2026-04-18T09:00:00Z",
    },
  ],
};

export async function getProviderOverviewList(): Promise<ProviderOverview[]> {
  const current = await readCurrentPricing();
  const history = await readPricingHistory();
  const visibleHistory = history.filter((record) => !isHiddenPocRecord(record));
  const changeEventCounts = countProviderChangeEvents(visibleHistory);

  return Object.entries(current)
    .map(([provider, models]) => {
      const modelNames = Object.keys(models).sort();
      const providerHistory = visibleHistory.filter((record) => record.provider === provider);
      const latestUpdate = providerHistory
        .map((record) => record.recorded_at)
        .sort((left, right) => right.localeCompare(left))[0];

      return {
        provider,
        modelCount: modelNames.length,
        models: modelNames,
        cachedInputNote: PROVIDER_NOTES[provider],
        latestUpdate,
        recentChangeCount: changeEventCounts.get(provider) ?? 0,
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

  return buildHistoryEntries(applyDevHistoryFixture(provider, model, visibleHistory));
}

export async function getRecentChanges(limit = 8): Promise<HistoryEntry[]> {
  const entries = await getAllChanges();
  return entries.slice(0, limit);
}

export async function getAllChanges(): Promise<HistoryEntry[]> {
  const history = await readPricingHistory();
  const visibleHistory = history.filter((record) => !isHiddenPocRecord(record));

  return buildChangeEntriesForDisplay(visibleHistory);
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

export function summarizeChangedFields(changedFields: string[]): string {
  const labels = changedFields
    .map((field) => toChangedFieldSummary(field))
    .filter((label, index, values) => label !== null && values.indexOf(label) === index);

  return labels.length > 0 ? labels.join(" / ") : text.pricingChangedFallback;
}

export function formatRecentChangeDate(recordedAt: string, effectiveDate: string): string {
  const recordedLabel = formatDateLabel(recordedAt);

  if (recordedAt.slice(0, 10) === effectiveDate) {
    return `${text.recordedPrefix} ${recordedLabel}`;
  }

  return `${text.recordedPrefix} ${recordedLabel} | ${text.effectivePrefix} ${formatDateLabel(effectiveDate)}`;
}

export function formatDateShort(value: string | undefined): string {
  if (!value) {
    return "-";
  }

  return formatDateLabel(value);
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

function buildHistoryEntries(records: PricingRecord[]): HistoryEntry[] {
  return records.map((record, index) => ({
    record,
    changedFields: getChangedFields(records[index - 1], record),
    fieldDiffs: getFieldDiffs(records[index - 1], record),
    isHiddenPocRecord: false,
  }));
}

function countProviderChangeEvents(records: PricingRecord[]): Map<string, number> {
  const groupedRecords = new Map<string, PricingRecord[]>();

  for (const record of records) {
    const key = `${record.provider}:${record.model}`;
    const modelHistory = groupedRecords.get(key) ?? [];
    modelHistory.push(record);
    groupedRecords.set(key, modelHistory);
  }

  const counts = new Map<string, number>();

  for (const modelHistory of groupedRecords.values()) {
    const entries = buildHistoryEntries(
      modelHistory.sort((left, right) => left.recorded_at.localeCompare(right.recorded_at)),
    );

    for (const entry of entries) {
      if (entry.changedFields.includes("initial_record")) {
        continue;
      }

      counts.set(entry.record.provider, (counts.get(entry.record.provider) ?? 0) + 1);
    }
  }

  return counts;
}

function buildChangeEntriesForDisplay(records: PricingRecord[]): HistoryEntry[] {
  const recordsByModel = new Map<string, PricingRecord[]>();

  for (const record of records) {
    const key = `${record.provider}:${record.model}`;
    const modelHistory = recordsByModel.get(key) ?? [];
    modelHistory.push(record);
    recordsByModel.set(key, modelHistory);
  }

  const entries = [...recordsByModel.values()].flatMap((modelHistory) =>
    buildHistoryEntries(modelHistory.sort((left, right) => left.recorded_at.localeCompare(right.recorded_at))),
  );

  return entries
    .filter((entry) => !entry.changedFields.includes("initial_record"))
    .sort((left, right) => right.record.recorded_at.localeCompare(left.record.recorded_at));
}

function getFieldDiffs(previous: PricingRecord | undefined, next: PricingRecord): HistoryFieldDiff[] {
  if (!previous) {
    return [
      {
        field: "initial_record",
        label: text.initialRecordLabel,
        before: "-",
        after: text.firstVisibleRecordLabel,
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
      label: text.currencyLabel,
      before: previous.currency,
      after: next.currency,
    });
  }

  if (previous.unit !== next.unit) {
    diffs.push({
      field: "unit",
      label: text.unitLabel,
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

function applyDevHistoryFixture(provider: string, model: string, records: PricingRecord[]): PricingRecord[] {
  if (!import.meta.env.DEV) {
    return records;
  }

  const key = `${provider}:${model}`;
  const fixture = DEV_MODEL_HISTORY_FIXTURES[key];

  if (!fixture || records.length > 1) {
    return records;
  }

  return fixture;
}

function trimTrailingZeros(value: number): string {
  return value.toLocaleString("en-US", {
    maximumFractionDigits: 6,
    minimumFractionDigits: 0,
  });
}

function toFieldLabel(field: string): string {
  if (field === "input") {
    return text.inputColumn;
  }

  if (field === "cached_input") {
    return text.cachedInputColumn;
  }

  if (field === "output") {
    return text.outputColumn;
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

function toChangedFieldSummary(field: string): string | null {
  if (field === "pricing.input") {
    return text.inputPriceChanged;
  }

  if (field === "pricing.cached_input") {
    return text.cachedInputPriceChanged;
  }

  if (field === "pricing.output") {
    return text.outputPriceChanged;
  }

  if (field === "currency") {
    return text.currencyChanged;
  }

  if (field === "unit") {
    return text.unitChanged;
  }

  return null;
}

function formatDateLabel(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}
