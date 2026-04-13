# architecture.md

このファイルは、このリポジトリのシステム構造を定義します。  
AI Agent は実装・変更を行う前に、この構造を理解する必要があります。

このプロジェクトは **AI API pricing を追跡する静的サイト**です。


---

# System Overview

システムは以下の構成で動作します。

```text
GitHub Actions runner (collector v1 host)
        ↓
最新 pricing snapshot を取得
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

- `worker/` は collector ロジックの配置場所
- unattended に近い v1 では GitHub Actions runner が実行ホスト
- schedule はまだ有効化せず、まず `workflow_dispatch` の手動実行から始める

このシステムは **静的サイト + データ更新 Worker** という構成を採用しています。


---

# Core Components


## 1. Worker (collector)

場所

```text
/worker
```

役割

- provider pricing を取得
- pricing snapshot を正規化
- `current-pricing.json` を更新
- 価格変更を検出
- 変更がある場合のみ `pricing-history.json` に履歴追加
- GitHub commit を行う

Worker は **cron による定期実行**を想定しています。

Worker は **データ収集と履歴更新のみを担当**します。
取得元 source の選定と運用判断は `docs/provider-source-policy.md` に従います。
unattended に近い v1 の更新フローは `docs/collector-production-flow-v1.md` に従います。


---

## 2. Data Layer

場所

```text
/data
```

主要ファイル

```text
current-pricing.json
pricing-history.json
```


### current-pricing.json

役割

- 最新の pricing snapshot を保持
- 各 provider / model の現在価格
- Worker によって更新される

特徴

- 上書き更新される
- 履歴は保持しない


### pricing-history.json

役割

- 価格変更イベントの履歴

重要ルール

- append-only
- 過去履歴は削除しない
- 過去履歴は変更しない

このファイルは **価格変更が発生したときのみ更新されます。**


---

## 3. Static Site

場所

```text
/site
```

技術

```text
Astro
```

役割

- JSON データを読み込む
- provider ページ生成
- 比較ページ生成
- 履歴ページ生成
- recent changes ページ生成

サイトは **完全静的**です。


---

# Repository Layout

```text
repo root
│
├─ worker/
│
├─ site/
│
├─ data/
│   ├─ current-pricing.json
│   └─ pricing-history.json
│
├─ AGENTS.md
├─ AI_CONTEXT.md
├─ PROJECT_SPEC.md
│
└─ .codex/
    └─ rules/
```


---

# Architectural Principles


## 1. Simplicity

システムはシンプルに保つ。

禁止：

- 不必要なサービス追加
- 不必要な dependency
- 不必要な複雑化


---

## 2. Static-first

サイトは静的生成を前提とする。

禁止：

- server runtime
- dynamic backend
- database


---

## 3. Data Integrity

履歴データは最重要資産。

禁止：

- pricing-history.json の履歴削除
- pricing-history.json の履歴編集
- retroactive modification


---

## 4. Snapshot + History Model

このプロジェクトは **Snapshot + History モデル**を採用します。

```text
current-pricing.json
  ↓
現在状態

pricing-history.json
  ↓
変更履歴
```

AI Agent はこのデータモデルを維持する必要があります。


---

## 5. Cost Efficiency

このプロジェクトは **低コスト運用**を目的とします。

高コスト構成は禁止：

- database
- server hosting
- paid APIs


---

# AI Agent Constraints

AI Agent は以下を守る必要があります。

- pricing-history.json を破壊しない
- history を rewrite しない
- current と history の役割を混同しない
- Worker の責務を拡張しすぎない
