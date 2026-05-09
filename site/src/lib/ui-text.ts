export const text = {
  siteName: "AI API Price Tracker",
  home: "Home",
  changes: "Changes",
  sources: "Sources",
  disclaimer: "Disclaimer",
  privacy: "Privacy",
  defaultMetaDescription: "Static pricing tracker for AI API models.",
  homepageMetaDescription:
    "Static pricing views generated from current-pricing.json and pricing-history.json.",

  heroTitle: "AI API Pricing Snapshot",
  heroSubtitle: "Track pricing changes across major AI API providers.",
  homeKicker: "The AI API Archive",
  homeLead:
    "A quiet record of pricing shifts across major AI API providers, built for checking what changed and where to look next.",
  homeRecentChangesLink: "Open the full change log",
  homeProvidersLead:
    "Use providers as the first index for current snapshot comparison, current-model activity, and drill-down.",
  homeAboutLead:
    "A static record for tracking AI API pricing changes without turning the site into a dashboard.",
  homeAboutSummaries: [
    {
      icon: "current",
      title: "Current snapshot",
      body: "Provider and model pricing are published from the latest normalized snapshot.",
    },
    {
      icon: "history",
      title: "Append-only history",
      body: "Pricing changes are preserved as a chronological record instead of being rewritten.",
    },
    {
      icon: "static",
      title: "Static archive",
      body: "The site stays simple, readable, and deployable as generated Astro pages.",
    },
  ],

  recentChanges: "Recent Changes",
  recentChangesDescription:
    "Latest visible pricing changes for models still present in the current snapshot.",
  noRecentCurrentChanges:
    "No current-snapshot model changes are available yet. Open the full change log for archived history.",
  pricingChangedFallback: "Pricing changed",
  recordedPrefix: "Recorded",
  effectivePrefix: "Effective",
  viewAllChanges: "View all changes →",

  providers: "Providers",
  providersMetaDescription: "Provider-level view of current AI API pricing data.",
  providersPageDescription:
    "Compare providers by current model count, current-model change activity, and the latest current-model change.",
  providerIndex: "Provider Index",
  providerIndexDescription:
    "Use providers as the first index for current snapshot comparison, update activity, and model-level drill-down.",
  providerIndexColumnsDescription:
    "Rows are ordered for scanning first, then for choosing where to drill down.",
  providerColumn: "Provider",
  modelsColumn: "Models",
  totalChangesColumn: "Total Changes",
  latestChangeColumn: "Latest Change",
  detailColumn: "Detail",
  viewProvider: "View provider",
  pricingTitleSuffix: "Pricing",

  aboutTitle: "About this site",
  aboutDescription:
    "This site tracks pricing changes across major AI API providers. Data is collected into an append-only history and rendered as a static Astro site.",
  aboutDescriptionShort:
    "Current snapshots and append-only history are published as a static site so changes stay legible over time.",
  footerText: "Static pricing tracker built from append-only change history.",
  footerCopyright: "© 2026 AI API Price Tracker",

  changesPageTitle: "AI API Price Changes",
  changesMetaDescription: "Full list of AI API pricing change events.",
  allChangeEvents: "All Change Events",
  changesPageDescription:
    "Newest change events first. Initial observation records are excluded from this view.",

  currentSnapshot: "Current Snapshot",
  currentSnapshotMetaDescriptionPrefix: "Current pricing snapshot for",
  providerPageDescriptionPrefix: "Current pricing snapshot and model-level history for",
  modelPageDescriptionPrefix: "Current pricing snapshot and recorded change history for",
  historicalModelPageDescriptionPrefix: "Recorded pricing history for",
  modelDetail: "Model Detail",
  pricingHistory: "Pricing History",
  forConnector: "for",
  historyTitleSuffix: "History",
  historyView: "View history",
  currentSnapshotCountSuffix: "models in the current snapshot.",
  historicalModel: "Historical model",
  historicalModelDescription:
    "This model appears in pricing history but is not present in the current snapshot.",
  notInCurrentSnapshot: "Not in current snapshot",
  cachedInputNoteAnthropic:
    "Cached input is shown as an approximate mapping of Anthropic Prompt caching read pricing.",
  pricingHistoryDescription:
    "PoC seed records are temporarily hidden in the UI to avoid noise while keeping the underlying history append-only.",
  recordedAt: "Recorded at",
  effectiveDate: "Effective date",
  changedFields: "Changed fields",
  currentInput: "Current input",
  currentCachedInput: "Current cached input",
  currentOutput: "Current output",
  providerDataLabel: "Provider",
  modelsDataLabel: "Models",
  totalChangesDataLabel: "Total Changes",
  latestChangeDataLabel: "Latest Change",
  detailDataLabel: "Detail",
  modelDataLabel: "Model",
  inputDataLabel: "Input",
  cachedInputDataLabel: "Cached input",
  outputDataLabel: "Output",
  historyDataLabel: "History",
  modelColumn: "Model",
  inputColumn: "Input",
  cachedInputColumn: "Cached input",
  outputColumn: "Output",
  historyColumn: "History",
  initialRecordLabel: "Initial record",
  firstVisibleRecordLabel: "First visible record",
  currencyLabel: "Currency",
  unitLabel: "Unit",
  inputPriceChanged: "Input price changed",
  cachedInputPriceChanged: "Cached input price changed",
  outputPriceChanged: "Output price changed",
  currencyChanged: "Currency changed",
  unitChanged: "Unit changed",
} as const;
