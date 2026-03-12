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
    const content = await readJsonText(io, paths.currentPath);
    return parseJsonContent(content, {});
  }

  async function readHistory(): Promise<PricingHistory> {
    const content = await readJsonText(io, paths.historyPath);
    return parseJsonContent(content, []);
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

export function createNodeFilePricingStoreIO(): FilePricingStoreIO {
  return {
    async readText(path: string): Promise<string> {
      const fs = await importNodeFs();
      return fs.readFile(path, "utf8");
    },

    async writeText(path: string, content: string): Promise<void> {
      const fs = await importNodeFs();
      await fs.writeFile(path, content, "utf8");
    },
  };
}

async function readJsonText(io: FilePricingStoreIO, path: string): Promise<string> {
  try {
    return await io.readText(path);
  } catch (error) {
    if (isFileNotFoundError(error)) {
      return "";
    }

    throw error;
  }
}

function parseJsonContent<T>(content: string, fallback: T): T {
  if (content.trim().length === 0) {
    return fallback;
  }

  return JSON.parse(content) as T;
}

function isFileNotFoundError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}

interface NodeFsPromisesModule {
  readFile(path: string, encoding: string): Promise<string>;
  writeFile(path: string, content: string, encoding: string): Promise<void>;
}

async function importNodeFs(): Promise<NodeFsPromisesModule> {
  // @ts-expect-error Local PoC only: runtime Node module for file-based storage.
  return import("node:fs/promises");
}
