# AI API Price Tracker — PROJECT_SPEC

## 1. プロジェクト概要

AI API Price Tracker は、主要な **AI API provider の価格変更を監視するサイト**。

自動で価格情報を収集し、履歴を保存し、静的サイトとして公開する。

主な表示内容

* 現在の価格
* 価格履歴
* provider比較

目標

* 自動運用
* 低コスト
* シンプル構成

---

# 2. システム構成

```
Cloudflare Worker (collector)
        ↓
pricing-history.json 更新
        ↓
GitHub commit
        ↓
Astro build
        ↓
Cloudflare Pages deploy
        ↓
公開サイト
```

---

# 3. 技術スタック

Frontend

* Astro
* Static HTML

Infrastructure

* Cloudflare Pages
* Cloudflare Workers
* GitHub

Data

* JSON

---

# 4. リポジトリ構成

```
ai-api-price-tracker/
│
├ worker/        # collector
├ site/          # Astro site
├ data/
│   ├ providers.json
│   └ pricing-history.json
│
├ PROJECT_SPEC.md
└ README.md
```

---

# 5. 初期 provider

```
OpenAI
Anthropic
Groq
Replicate
Together AI
```

選定理由

* APIドキュメントが整備
* 価格情報が安定
* AI APIエコシステムをカバー

---

# 6. データ構造

価格履歴は **append-only**。

例

```
{
  "provider": "openai",
  "model": "gpt-4.2",
  "input_price": 8,
  "output_price": 24,
  "currency": "USD",
  "date": "2026-03-09",
  "source": "URL"
}
```

ルール

* 履歴削除なし
* 変更時のみ追加

---

# 7. URL設計

言語プレフィックス

```
/en/
/ja/
```

例

Provider

```
/en/providers/openai
/ja/providers/openai
```

Pricing history

```
/en/providers/openai/history
```

Pricing changes

```
/en/pricing-changes
```

Comparison

```
/en/compare/openai-vs-anthropic
```

slugルール

* lowercase
* hyphen-separated

---

# 8. デプロイフロー

1. Worker cron 実行
2. pricing取得
3. 差分検出
4. pricing-history.json 更新
5. GitHub commit
6. Pages build
7. Astro static生成
8. サイト更新

---

# 9. セキュリティ

ルール

* API key は repo に保存しない
* Cloudflare Secrets 使用
* `.env` は commitしない

全サービス

```
2FA 必須
```

---

# 10. コスト方針

基本

```
無料枠で運用
```

使用サービス

* Cloudflare Workers Free
* Cloudflare Pages Free
* GitHub Free

独自ドメインと広告は後から追加。

---

# 11. 将来拡張

可能な機能

* provider追加
* price comparison強化
* price history chart
* API limit tracking
* 週次レポート
* 多言語追加

---

# 12. 開発方針

原則

* シンプル構成
* static優先
* コスト最小

AI（Codex）は **開発支援のみ**で使用。
