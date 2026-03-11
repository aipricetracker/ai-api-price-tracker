import type { CurrentPricing, Pricing, PricingHistory, PricingRecord } from "./types";

export type ValidationResult =
  | { success: true }
  | { success: false; errors: string[] };

export function validatePricingRecord(record: PricingRecord): ValidationResult {
  const errors: string[] = [];

  if (!isNonEmptyString(record.provider)) {
    errors.push("provider is required");
  }

  if (!isNonEmptyString(record.model)) {
    errors.push("model is required");
  }

  if (!isPlainObject(record.pricing)) {
    errors.push("pricing must be an object");
  } else {
    const numericEntries = Object.entries(record.pricing);
    const hasInputOrOutput =
      typeof record.pricing.input === "number" || typeof record.pricing.output === "number";

    if (!hasInputOrOutput) {
      errors.push("pricing.input or pricing.output is required");
    }

    for (const [key, value] of numericEntries) {
      if (value === undefined) {
        continue;
      }

      if (!Number.isFinite(value)) {
        errors.push(`pricing.${key} must be a finite number`);
        continue;
      }

      if (value < 0) {
        errors.push(`pricing.${key} must be zero or greater`);
      }
    }
  }

  if (!isNonEmptyString(record.currency)) {
    errors.push("currency is required");
  }

  if (!isNonEmptyString(record.unit)) {
    errors.push("unit is required");
  }

  if (!isValidUrl(record.source_url)) {
    errors.push("source_url must be a valid URL");
  }

  if (!isValidDateOnly(record.effective_date)) {
    errors.push("effective_date must be a valid YYYY-MM-DD date");
  }

  if (!isValidTimestamp(record.recorded_at)) {
    errors.push("recorded_at must be a valid ISO 8601 timestamp");
  }

  return errors.length === 0 ? { success: true } : { success: false, errors };
}

export function hasPricingChanged(previous: PricingRecord | undefined, next: PricingRecord): boolean {
  if (!previous) {
    return true;
  }

  if (previous.currency !== next.currency) {
    return true;
  }

  if (previous.unit !== next.unit) {
    return true;
  }

  return !isSamePricing(previous.pricing, next.pricing);
}

export function updateCurrentPricing(current: CurrentPricing, record: PricingRecord): CurrentPricing {
  return {
    ...current,
    [record.provider]: {
      ...(current[record.provider] ?? {}),
      [record.model]: record,
    },
  };
}

export function appendPricingHistory(history: PricingHistory, record: PricingRecord): PricingHistory {
  return [...history, record];
}

function isSamePricing(left: Pricing, right: Pricing): boolean {
  const keys = new Set([...Object.keys(left), ...Object.keys(right)]);

  for (const key of keys) {
    if (left[key] !== right[key]) {
      return false;
    }
  }

  return true;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: string): boolean {
  return value.trim().length > 0;
}

function isValidUrl(value: string): boolean {
  if (!isNonEmptyString(value)) {
    return false;
  }

  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function isValidDateOnly(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

function isValidTimestamp(value: string): boolean {
  if (!isNonEmptyString(value)) {
    return false;
  }

  const timestamp = Date.parse(value);
  return !Number.isNaN(timestamp);
}
