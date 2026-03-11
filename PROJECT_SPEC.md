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
Cloudflare Worker (collector)
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

### current-pricing.json

最新の pricing snapshot を保持します。

用途:

- 現在価格の表示
- provider / model の最新価格

特徴:

- Worker により更新される
- 上書き更新される
- 履歴は保持しない


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

履歴ページ:

```
/providers/{provider-slug}/history
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


---

## Data Integrity Rules

履歴データはこのプロジェクトの最重要資産です。

禁止事項:

- pricing-history.json の履歴削除
- pricing-history.json の履歴編集
- retroactive modification


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