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
Cloudflare Worker (collector)
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

### Worker (collector)

役割

- 各 provider の pricing API / pricing page を取得
- 最新 pricing snapshot を正規化する
- `current-pricing.json` を更新する
- 前回 snapshot と比較して価格変更を検出する
- 価格変更があった場合のみ `pricing-history.json` に新規レコードを追加する
- GitHub に commit する

Worker は **定期実行（cron）**を想定しています。


### Static Site

Astro により静的サイトを生成します。

表示内容

- 現在価格
- 価格履歴
- provider 比較

サイトは **完全静的**です。


## Repository Structure

想定ディレクトリ構成：

```text
repo root
│
├─ worker/            # Cloudflare Worker
│
├─ site/              # Astro site
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

### current-pricing.json

最新の正規化済み pricing 状態を保持します。  
サイトの「現在価格」表示は主にこのファイルを参照します。

基本イメージ：

```json
{
  "provider": "openai",
  "model": "gpt-4.1",
  "pricing": {
    "input": 0.00001,
    "output": 0.00003
  },
  "effective_date": "2025-01-01",
  "recorded_at": "2025-01-01T00:00:00Z"
}
```

### pricing-history.json

価格変更イベントの履歴を保持します。  
このファイルは append-only です。

基本イメージ：

```json
{
  "provider": "openai",
  "model": "gpt-4.1",
  "pricing": {
    "input": 0.00001,
    "output": 0.00003
  },
  "effective_date": "2025-01-01",
  "recorded_at": "2025-01-01T00:00:00Z"
}
```

重要ルール：

- append-only
- 既存履歴を削除しない
- 価格変更があった場合のみ新規レコード追加


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

履歴ページ：

```text
/providers/{provider-slug}/history
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