import type { CurrentPricing, PricingHistory } from "./types";

export interface PricingStore {
  getCurrent(): Promise<CurrentPricing>;
  getHistory(): Promise<PricingHistory>;
  saveCurrent(current: CurrentPricing): Promise<void>;
  appendHistory(record: PricingHistory[number]): Promise<void>;
}

export interface PricingStoreData {
  current: CurrentPricing;
  history: PricingHistory;
}

export interface FilePricingStoreIO {
  readText(path: string): Promise<string>;
  writeText(path: string, content: string): Promise<void>;
}

export interface FilePricingStorePaths {
  currentPath: string;
  historyPath: string;
}

export function createInMemoryPricingStore(
  initialData: PricingStoreData = createInitialPricingData(),
): PricingStore {
  let current = structuredClone(initialData.current);
  let history = structuredClone(initialData.history);

  return {
    async getCurrent(): Promise<CurrentPricing> {
      return structuredClone(current);
    },

    async getHistory(): Promise<PricingHistory> {
      return structuredClone(history);
    },

    async saveCurrent(nextCurrent: CurrentPricing): Promise<void> {
      current = structuredClone(nextCurrent);
    },

    async appendHistory(record: PricingHistory[number]): Promise<void> {
      history = [...history, structuredClone(record)];
    },
  };
}

export function createFilePricingStore(
  io: FilePricingStoreIO,
  paths: FilePricingStorePaths,
): PricingStore {
  async function readCurrent(): Promise<CurrentPricing> {
    const content = await io.readText(paths.currentPath);
    return JSON.parse(content) as CurrentPricing;
  }

  async function readHistory(): Promise<PricingHistory> {
    const content = await io.readText(paths.historyPath);
    return JSON.parse(content) as PricingHistory;
  }

  return {
    async getCurrent(): Promise<CurrentPricing> {
      return readCurrent();
    },

    async getHistory(): Promise<PricingHistory> {
      return readHistory();
    },

    async saveCurrent(current: CurrentPricing): Promise<void> {
      await io.writeText(paths.currentPath, serializeJson(current));
    },

    async appendHistory(record: PricingHistory[number]): Promise<void> {
      const history = await readHistory();
      history.push(record);
      await io.writeText(paths.historyPath, serializeJson(history));
    },
  };
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

function serializeJson(value: CurrentPricing | PricingHistory): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}
