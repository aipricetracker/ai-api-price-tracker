import type { CurrentPricing, PricingHistory } from "./types";
import type { PricingStoreData } from "./fixtures";

export interface PricingStore {
  getCurrent(): Promise<CurrentPricing>;
  getHistory(): Promise<PricingHistory>;
  saveCurrent(current: CurrentPricing): Promise<void>;
  appendHistory(record: PricingHistory[number]): Promise<void>;
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
  initialData: PricingStoreData,
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

function serializeJson(value: CurrentPricing | PricingHistory): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}
