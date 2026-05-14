import type { PricingRecord } from "../../types";

const GEMINI_PRICING_URL = "https://ai.google.dev/gemini-api/docs/pricing.md.txt";
const FETCH_ATTEMPTS = 3;

export interface GeminiParserDebugInfo {
  modelSectionCandidateCount: number;
  standardPricingCandidateCount: number;
  skippedPreviewCount: number;
  skippedNonTextModelCount: number;
  skippedTieredPricingCount: number;
  normalizedRecordCount: number;
}

export interface CollectGeminiOptions {
  debug?: boolean;
}

export interface GeminiParseResult {
  records: PricingRecord[];
  debug: GeminiParserDebugInfo;
}

export async function collectGeminiTextModelPricing(
  options: CollectGeminiOptions = {},
): Promise<PricingRecord[]> {
  const recordedAt = new Date().toISOString();
  const markdown = await fetchGeminiPricingPage();
  const result = parseGeminiTextModelPricing(markdown, recordedAt);

  if (options.debug) {
    console.log("gemini parser debug", result.debug);
  }

  if (result.records.length < 1) {
    throw new Error("gemini pricing fetch returned 0 standard text pricing records");
  }

  return result.records;
}

async function fetchGeminiPricingPage(): Promise<string> {
  let lastError: unknown;

  for (let attempt = 0; attempt < FETCH_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(GEMINI_PRICING_URL, {
        headers: {
          accept: "text/markdown,text/plain;q=0.9,*/*;q=0.8",
          "accept-language": "en-US,en;q=0.9",
          "user-agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        },
      });

      if (!response.ok) {
        throw new Error(`gemini pricing fetch failed with status ${response.status}`);
      }

      const markdown = await response.text();

      if (
        !markdown.includes("Paid Tier, per 1M tokens in USD") ||
        !markdown.includes("Input price") ||
        !markdown.includes("Output price")
      ) {
        throw new Error("gemini pricing page structure not found");
      }

      return markdown;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("gemini pricing fetch failed");
}

export function parseGeminiTextModelPricing(markdown: string, recordedAt: string): GeminiParseResult {
  const records: PricingRecord[] = [];
  const modelSections = extractModelSections(markdown);
  let standardPricingCandidateCount = 0;
  let skippedPreviewCount = 0;
  let skippedNonTextModelCount = 0;
  let skippedTieredPricingCount = 0;

  for (const section of modelSections) {
    if (/\bpreview\b/i.test(section.title) || /\bpreview\b/i.test(section.model)) {
      skippedPreviewCount += 1;
      continue;
    }

    if (isNonTextModelSection(section)) {
      skippedNonTextModelCount += 1;
      continue;
    }

    const standardSection = extractStandardSection(section.text);

    if (!standardSection) {
      continue;
    }

    standardPricingCandidateCount += 1;

    if (/prompts?\s*(?:<=|>)/i.test(standardSection.text)) {
      skippedTieredPricingCount += 1;
      continue;
    }

    const input = extractInputTextPrice(standardSection.text);
    const output = extractOutputTextPrice(standardSection.text);

    if (typeof input !== "number" || typeof output !== "number") {
      continue;
    }

    records.push({
      provider: "gemini",
      model: section.model,
      pricing: {
        input,
        output,
      },
      currency: "USD",
      unit: "1M tokens",
      source_url: GEMINI_PRICING_URL,
      effective_date: recordedAt.slice(0, 10),
      recorded_at: recordedAt,
    });
  }

  return {
    records,
    debug: {
      modelSectionCandidateCount: modelSections.length,
      standardPricingCandidateCount,
      skippedPreviewCount,
      skippedNonTextModelCount,
      skippedTieredPricingCount,
      normalizedRecordCount: records.length,
    },
  };
}

interface ModelSection {
  title: string;
  model: string;
  text: string;
}

interface StandardSection {
  text: string;
}

function extractModelSections(markdown: string): ModelSection[] {
  const sections: ModelSection[] = [];
  const headingPattern = /^##\s+(.+)$/gm;
  const matches = [...markdown.matchAll(headingPattern)];

  for (let index = 0; index < matches.length; index += 1) {
    const match = matches[index];
    const title = (match[1] ?? "").trim();
    const start = match.index ?? 0;
    const next = matches[index + 1];
    const end = next?.index ?? markdown.length;
    const sectionText = markdown.slice(start, end);
    const model = extractGeminiModelId(sectionText);

    if (!model || !title.toLowerCase().includes("gemini")) {
      continue;
    }

    sections.push({
      title,
      model,
      text: sectionText,
    });
  }

  return sections;
}

function extractGeminiModelId(text: string): string | null {
  const emphasizedCodeMatch = text.match(/\*`(gemini-[a-z0-9.-]+)`\*/i);

  if (emphasizedCodeMatch?.[1]) {
    return emphasizedCodeMatch[1].trim();
  }

  const textMatch = text.match(/\b(gemini-[a-z0-9.-]+)\b/i);
  return textMatch?.[1]?.trim() ?? null;
}

function extractStandardSection(sectionText: string): StandardSection | null {
  const standardStart = sectionText.search(/^###\s+Standard\s*$/m);

  if (standardStart < 0) {
    return null;
  }

  const sectionEndCandidates = [
    findNextHeading(sectionText, standardStart, "Batch"),
    findNextHeading(sectionText, standardStart, "Flex"),
    findNextHeading(sectionText, standardStart, "Priority"),
    findNextHeading(sectionText, standardStart, "Live"),
  ].filter((value) => value > standardStart);
  const sectionEnd = sectionEndCandidates.length > 0 ? Math.min(...sectionEndCandidates) : sectionText.length;

  return {
    text: normalizeText(sectionText.slice(standardStart, sectionEnd)),
  };
}

function isNonTextModelSection(section: ModelSection): boolean {
  return /\b(image|live|tts|speech|audio|embedding|veo|imagen|lyria)\b/i.test(
    `${section.title} ${section.model}`,
  );
}

function findNextHeading(text: string, start: number, heading: string): number {
  const pattern = new RegExp(`^###\\s+${heading}\\s*$`, "im");
  const match = text.slice(start + 1).match(pattern);
  return match?.index === undefined ? -1 : start + 1 + match.index;
}

function extractInputTextPrice(text: string): number | undefined {
  const inputBlock = extractPricingRow(text, "Input price");
  return extractTextDollarAmount(inputBlock);
}

function extractOutputTextPrice(text: string): number | undefined {
  const outputBlock = extractPricingRow(text, "Output price");
  return extractTextDollarAmount(outputBlock);
}

function extractPricingRow(text: string, label: string): string {
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const rowMatch = text.match(new RegExp(`\\|\\s*${escapedLabel}[^|]*\\|[^|]*\\|([^|]+)\\|`, "i"));
  return rowMatch?.[1]?.trim() ?? "";
}

function extractTextDollarAmount(text: string): number | undefined {
  const modalityMatch = text.match(/\$([0-9]+(?:\.[0-9]+)?)\s*\((?:text|text\s*\/)/i);
  const fallbackMatch = text.match(/\$([0-9]+(?:\.[0-9]+)?)(?!\s*\/)/);
  const value = Number(modalityMatch?.[1] ?? fallbackMatch?.[1] ?? Number.NaN);

  return Number.isFinite(value) ? value : undefined;
}

function normalizeText(text: string): string {
  return text
    .replace(/\\&/g, "&")
    .replace(/\\<=/g, "<=")
    .replace(/\\>/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}
