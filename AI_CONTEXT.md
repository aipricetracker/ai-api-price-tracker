# AI_CONTEXT.md

## Project Summary

AI API Price Tracker は、主要な AI API provider の価格情報を監視し、
価格変更履歴を保存し、静的サイトとして公開するプロジェクトです。

目的は以下です。

- AI API の価格を長期的に追跡する
- provider 間の価格比較を可能にする
- 価格変更履歴を公開する

このプロジェクトは **低コスト・自動運用・シンプル構成**を重視します。

重要な方針：

- ランタイムで AI API は使用しない
- AI は開発支援（Codex）のみで使用する
- サイトは静的生成する

source 選定と取得運用の判断基準は以下を参照します。

- `docs/provider-source-policy.md`
  - source の優先順位
  - HTML scraping の制約
  - provider ごとの source review / caution 判定
  - unattended 本番運用前の再確認条件
- `docs/collector-production-flow-v1.md`
  - collector 本番更新フロー v1
  - GitHub を正本とする更新単位
  - 失敗時の扱い

site のデザイン収束や UI 表現の判断基準は以下を参照します。

- `DESIGN.md`
  - visual theme / color / typography / component styling / layout principles
  - 古い英字新聞風、エディトリアル寄り、データアーカイブ風の審美ルール
- `SITE_SCORE.md`
  - Home / Changes / Providers / Model History の構成譜
  - ページごとの強弱、反復、変奏、下層ページへの展開方針


## Tech Stack

### Frontend / Site

- Astro

### Infrastructure

- Cloudflare Pages
- Cloudflare Workers

### Repository / CI

- GitHub

### Data Storage

- JSON files (Git managed)


## System Architecture

システムは以下の構成で動作します。

```text
GitHub Actions runner (collector v1 host)
        ↓
最新 pricing snapshot を取得・正規化
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

- `worker/` は collector ロジックの実装場所を表す
- unattended に近い v1 では、実行ホストは Cloudflare Worker runtime ではなく GitHub Actions runner を使う
- 起動方法はまず `workflow_dispatch` の手動実行のみとする

### Worker (collector)

役割

- 各 provider の pricing API / pricing page を取得
- 最新 pricing snapshot を正規化する
- `current-pricing.json` を更新する
- 前回 snapshot と比較して価格変更を検出する
- 価格変更があった場合のみ `pricing-history.json` に新規レコードを追加する
- GitHub に commit する

Worker は **定期実行（cron）**を想定しています。
source 選定と運用判断は `docs/provider-source-policy.md` に従います。

unattended に近い v1 運用では、
collector の実行ホストは Cloudflare Worker 本番 runtime ではなく
GitHub Actions runner を採用し、GitHub repository を正本として更新します。
詳細は `docs/collector-production-flow-v1.md` を参照します。

現時点では `workflow_dispatch` による manual run が成功しており、
差分あり run では `data/` の commit / push、差分なし run では no-op skip が確認済みです。


### Static Site

Astro により静的サイトを生成します。

表示内容

- 現在価格
- 価格履歴
- provider 比較
- recent changes 一覧

サイトは **完全静的**です。

`site/` では責務を以下に分離します。

- `src/layouts/`
  - 共通 `BaseLayout`
- `src/components/`
  - 共通 UI component
  - `SectionHeading` / `PageIntro` / `ButtonLink` / `TextLink` / `SummaryIcon` など、Home / `/changes` / `/providers` / `provider detail` / `model history` で確定した紙面文法を下層へ展開するための部品
- `src/lib/data.ts`
  - JSON 読み込みと UI 向け selector / formatter
  - current snapshot 用 selector と history archive 用 selector は分けて扱う
  - Top の Recent Changes は current snapshot に存在する provider/model の変更だけを表示する
  - `/changes` は visible pricing history 由来の append-only archive として扱い、current snapshot に存在しない history-only model も表示する
  - model detail route は current snapshot と visible pricing history の provider/model union で生成する
  - current に存在しないが history に存在する model は historical-only detail として生成し、current snapshot がないことを UI で明示する
- `src/lib/ui-text.ts`
  - UI 文言定義
- `src/lib/locale.ts`
  - デフォルト `lang` / `locale`
- `src/pages/`
  - 静的ページ本体


## Repository Structure

想定ディレクトリ構成：

```text
repo root
│
├─ worker/            # Cloudflare Worker
│
├─ site/              # Astro site
│
├─ DESIGN.md          # site design principles
├─ SITE_SCORE.md      # site-level visual score
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
   ├─ rules/
   ├─ workflows/
   └─ skills/
```


## Data Model

価格データは JSON で管理します。

```text
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

最新の正規化済み pricing 状態を保持します。  
サイトの「現在価格」表示は主にこのファイルを参照します。

基本イメージ：

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

### pricing-history.json

価格変更イベントの履歴を保持します。  
このファイルは append-only です。

補足:

- `pricing-history.json` に存在する model が、常に `current-pricing.json` に存在するとは限らない
- history にだけ存在する provider/model は、公開サイトでは history archive として detail page を生成する
- ただし、current provider/model 一覧には混ぜない
- source から確定できない限り、history-only model を廃止済み・提供終了とは断定しない

基本イメージ：

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

重要ルール：

- append-only
- 既存履歴を削除しない
- 価格変更があった場合のみ新規レコード追加


## Effective Date Policy

`effective_date` は、その価格が provider 上で有効になったと解釈できる日付を表します。

- provider が適用日を明示している場合:
  - 明示された日付を `effective_date` とする
- provider が適用日を明示していない場合:
  - その価格を初めて観測した UTC 日付を `effective_date` とする

`recorded_at` は Worker がその価格を観測した UTC timestamp を表します。

重要ルール:

- `effective_date` は価格変更判定には使用しない
- 価格変更判定は pricing / currency / unit の差分で行う
- `pricing-history.json` に保存した `effective_date` は後から書き換えない


## Validation Policy

型定義は広めに許容し、保存前 validation を重視します。

保存前に最低限確認する項目:

- `provider`
- `model`
- `pricing`
- `pricing.input` または `pricing.output`
- `currency`
- `unit`
- `source_url`
- `effective_date`
- `recorded_at`

validation を行う自然な段階:

1. provider データを正規化した直後
2. 差分判定の前
3. JSON 保存の直前


## Worker Module Policy

Worker は責務を以下に分離します。

- `index.ts`
  - orchestration のみ担当
- `pricing.ts`
  - validation / diff / record update ロジックを担当
- `storage.ts`
  - current/history の読み書き抽象を担当
- `providers/{provider}/`
  - provider 固有の fetch / parse / normalize を担当

provider 実装の source review と fetch 運用判断は `docs/provider-source-policy.md` を前提にします。

PoC 段階では以下を使い分けます。

- Worker 本体
  - storage abstraction を通じて current/history を扱う
- ローカル確認
  - file-based store を使って `data/current-pricing.json` と `data/pricing-history.json` の更新を確認する
- parser 検証
  - provider ごとに fixture HTML と unit test を持ち、DOM 変更で静かに壊れないようにする

この構成により、storage 実装は差し替え可能な状態を維持します。


## Provider List

初期対象 provider

- OpenAI
- Anthropic
- Groq
- Replicate
- Together AI

provider slug ルール：

- lowercase
- hyphen-separated

例：

```text
openai
anthropic
together-ai
```


## URL Design

多言語対応：

```text
/en/
/ja/
```

provider ページ：

```text
/providers/{provider-slug}
```

- `/providers` index は `PageIntro + SectionHeading + provider comparison rows` を基本文法とする
- provider ごとの比較軸は列見出しを 1 回だけ置き、row 内の詳細導線は `TextLink` で静かに渡す
- `/providers/{provider}` detail は `PageIntro + Current Snapshot rows + short caveat` を基本文法とする

model 履歴ページ：

```text
/providers/{provider-slug}/{model-slug}
```

- `PageIntro + Current Snapshot summary + Pricing History rows` を基本文法とする
- 開発用の一時説明は visible UI に残さず、ユーザーに必要な注釈だけを短く見せる

変更一覧ページ：

```text
/changes
```

比較ページ：

```text
/compare/openai-vs-anthropic
```


## Important Rules

### Runtime AI usage

禁止：

- OpenAI API
- Anthropic API
- LLM runtime usage

AIは **開発時のみ使用**します。


### Data Integrity

履歴データは最重要資産です。

以下は禁止：

- pricing-history.json の履歴削除
- 過去データ改変
- retroactive editing

`pricing-history.json` は **append-only** です。


### Current Pricing Snapshot

`current-pricing.json` は **最新の pricing snapshot** を保持します。

- Worker により更新される
- 最新状態を表すため上書き更新される
- 履歴は `pricing-history.json` に保存される


### Repository Policy

- public repository
- single repo
- secrets は repo に保存しない


### Security

- `.env` は commit しない
- API keys は secrets 管理
- GitHub / Cloudflare は専用アカウント
- 2FA 必須


## AI Development Environment

このプロジェクトは AI 主導開発を前提とします。

作業環境：

```text
~/ai-workspace/
```

AI は以下を参照します：

```text
AGENTS.md
AI_CONTEXT.md
.codex/rules/
.codex/workflows/
```

AGENTS.md は **エントリーポイント**です。


## Development Principles

AI agent は以下を優先します。

1. シンプルな実装
2. 自動運用
3. 低コスト
4. 変更に強い設計
