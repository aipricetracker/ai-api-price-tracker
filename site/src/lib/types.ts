export interface Pricing {
  input?: number;
  output?: number;
  [key: string]: number | undefined;
}

export interface PricingRecord {
  provider: string;
  model: string;
  pricing: Pricing;
  currency: string;
  unit: string;
  source_url: string;
  effective_date: string;
  recorded_at: string;
}

export type ProviderPricingMap = Record<string, PricingRecord>;

export type CurrentPricing = Record<string, ProviderPricingMap>;

export type PricingHistory = PricingRecord[];

export interface ProviderOverview {
  provider: string;
  modelCount: number;
  models: string[];
  cachedInputNote?: string;
  latestUpdate?: string;
  recentChangeCount: number;
}

export interface ProviderModelSummary extends PricingRecord {
  cachedInputNote?: string;
}

export interface HistoryEntry {
  record: PricingRecord;
  changedFields: string[];
  fieldDiffs: HistoryFieldDiff[];
  isHiddenPocRecord: boolean;
}

export interface HistoryFieldDiff {
  field: string;
  label: string;
  before: string;
  after: string;
  changeRate?: string;
}
