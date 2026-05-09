# PROJECT_SPEC.md

## Project Name

AI API Price Tracker


---

## Project Overview

AI API Price Tracker は、主要な AI API provider の価格情報を監視し、
価格変更履歴を保存し、静的サイトとして公開するプロジェクトです。

主な目的:

- AI API の価格を長期的に追跡する
- provider 間の価格比較を可能にする
- 価格変更履歴を公開する

このプロジェクトは **低コスト・自動運用・シンプル構成**を重視します。

source 選定と collector 運用判断の基準は `docs/provider-source-policy.md` を参照します。
collector 本番更新フロー v1 は `docs/collector-production-flow-v1.md` を参照します。
site のデザイン原則は `DESIGN.md`、ページ群の構成譜は `SITE_SCORE.md` を参照します。
公開サイトとしての説明ページ、SEO meta、sitemap、robots、404 は `site/` の静的生成対象として扱います。


---

## Core Principles

- ランタイムで AI API は使用しない
- AI は開発支援（Codex）のみで使用する
- 静的サイトとして公開する
- インフラコストを最小化する
- 履歴データの整合性を最優先する


---

## System Architecture

システム構成:

```
GitHub Actions runner (collector v1 host)
        ↓
pricing snapshot 取得
        ↓
current-pricing.json 更新
        ↓
差分がある場合のみ pricing-history.json に追記
        ↓
GitHub commit
        ↓
Astro build
        ↓
Cloudflare Pages deploy
        ↓
Public website
```

補足:

- `worker/` は collector ロジックの実装場所
- v1 の実行ホストは GitHub Actions runner
- 起動はまず `workflow_dispatch` の手動実行のみ

特徴:

- 静的サイト中心
- database 不使用
- JSON データを Git 管理


---

## Technology Stack

Frontend / Site

- Astro

Infrastructure

- Cloudflare Workers
- Cloudflare Pages

Repository

- GitHub

Data Storage

- JSON files (Git managed)


---

## Repository Policy

- public repository
- single repository 構成
- secret 情報は repository に保存しない


---

## Repository Structure

想定ディレクトリ構成:

```
repo root
│
├─ worker/                 # Cloudflare Worker
│
├─ site/                   # Astro static site
│   ├─ public/              # Cloudflare Pages static files such as _headers
│   └─ src/
│       ├─ layouts/        # BaseLayout
│       ├─ components/     # reusable UI components
│       ├─ lib/            # UI selectors / text / locale / site meta
│       └─ pages/          # static pages
│
├─ DESIGN.md               # site design principles
├─ SITE_SCORE.md           # site-level visual score
│
├─ data/
│   ├─ current-pricing.json
│   └─ pricing-history.json
│
├─ AGENTS.md
├─ AI_CONTEXT.md
├─ PROJECT_SPEC.md
├─ .aiignore
│
└─ .codex/
    └─ rules/
```


---

## Data Model

価格データは JSON で管理します。

```
data/current-pricing.json
data/pricing-history.json
```

スキーマ方針:

- `current-pricing.json`
  - `provider -> model -> record` の最新 snapshot マップ
- `pricing-history.json`
  - 価格変更イベントの配列
- 両方で可能な限り同じ `PricingRecord` 構造を使う

### current-pricing.json

最新の pricing snapshot を保持します。

用途:

- 現在価格の表示
- provider / model の最新価格

特徴:

- Worker により更新される
- 上書き更新される
- 履歴は保持しない

基本イメージ:

```json
{
  "openai": {
    "gpt-4.1": {
      "provider": "openai",
      "model": "gpt-5.4",
      "pricing": {
        "input": 2.5,
        "cached_input": 0.25,
        "output": 15
      },
      "currency": "USD",
      "unit": "1M tokens",
      "source_url": "https://openai.com/api/pricing/",
      "effective_date": "2025-01-01",
      "recorded_at": "2025-01-01T00:00:00Z"
    }
  }
}
```


---

### pricing-history.json

価格変更イベントの履歴を保持します。

用途:

- 価格変更履歴表示
- 長期価格追跡

特徴:

- append-only
- 過去履歴を削除しない
- 過去履歴を変更しない
- 価格変更があった場合のみ追加

基本イメージ:

```json
[
  {
    "provider": "openai",
    "model": "gpt-5.4",
    "pricing": {
      "input": 2.5,
      "cached_input": 0.25,
      "output": 15
    },
    "currency": "USD",
    "unit": "1M tokens",
    "source_url": "https://openai.com/api/pricing/",
    "effective_date": "2025-01-01",
    "recorded_at": "2025-01-01T00:00:00Z"
  }
]
```


---

## Provider List

初期対象 provider:

- OpenAI
- Anthropic
- Groq
- Replicate
- Together AI


---

## Provider Slug Rules

provider slug は以下のルールに従う:

- lowercase
- hyphen-separated

例:

```
openai
anthropic
together-ai
```


---

## URL Design

多言語対応:

```
/en/
/ja/
```

provider ページ:

```
/providers/{provider-slug}
```

model 履歴ページ:

```
/providers/{provider-slug}/{model-slug}
```

変更一覧ページ:

```
/changes
```

比較ページ:

```
/compare/openai-vs-anthropic
```


---

## Worker Responsibilities

Worker (collector) の役割:

- provider pricing 情報取得
- pricing 正規化
- 最新 snapshot 作成
- 差分検出
- current-pricing.json 更新
- pricing-history.json append
- GitHub commit

Worker は **cron による定期実行**を想定します。
source 選定と運用判断は `docs/provider-source-policy.md` に従います。

unattended に近い v1 では、collector 実行ホストとして GitHub Actions runner を採用し、
GitHub repository 上の `data/` を正本として更新します。

また、`workflow_dispatch` の manual run により、
差分あり時のみ `data/` を commit / push し、差分なし時は skip する挙動を確認済みです。

Worker の責務分割方針:

- `index.ts`
  - orchestration
- `pricing.ts`
  - validation / diff / record update
- `storage.ts`
  - persistence abstraction
- `providers/{provider}/`
  - provider-specific fetch / parse / normalize

PoC では storage abstraction を維持しつつ、ローカル確認では file-based storage を使って
`data/current-pricing.json` と `data/pricing-history.json` の更新を確認できる構成とします。

また、provider parser は fixture HTML と unit test を持ち、
pricing page の DOM 変更で静かに壊れないようにします。


---

## Data Integrity Rules

履歴データはこのプロジェクトの最重要資産です。

禁止事項:

- pricing-history.json の履歴削除
- pricing-history.json の履歴編集
- retroactive modification


---

## Effective Date Policy

`effective_date` は、その価格が provider 上で有効になったと解釈できる日付を表します。

- provider が適用日を明示している場合:
  - その明示日を採用する
- provider が適用日を明示していない場合:
  - その価格を初めて観測した UTC 日付を採用する

`recorded_at` は Worker が価格を観測した UTC timestamp を表します。

差分判定ルール:

- `hasPricingChanged()` は `effective_date` を比較対象にしない
- pricing / currency / unit の差分のみを履歴追加条件とする


---

## Validation Policy

PoC では、型による厳格制約より保存前 validation を優先します。

保存前の最低限チェック項目:

- `provider`
- `model`
- `pricing`
- `pricing.input` または `pricing.output`
- `currency`
- `unit`
- `source_url`
- `effective_date`
- `recorded_at`

validation の主な実施段階:

1. normalize 後
2. diff 判定前
3. 保存直前


---

## Cost Strategy

このプロジェクトは **低コスト運用**を前提とします。

避ける構成:

- database
- server hosting
- paid API services


---

## Security Policy

- `.env` は commit しない
- API keys は secrets 管理
- GitHub / Cloudflare は専用アカウント
- 2FA 必須


---

## Development Environment

AI 主導開発を前提とします。

作業環境:

```
~/ai-workspace/
```

AI Agent は以下を参照します:

```
AGENTS.md
AI_CONTEXT.md
.codex/rules/
```


---

## Development Principles

AI Agent は以下を優先します:

1. シンプルな実装
2. 自動運用
3. 低コスト
4. 変更に強い設計
