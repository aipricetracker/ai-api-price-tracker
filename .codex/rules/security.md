# security.md

このファイルは、このリポジトリでのセキュリティルールを定義します。

AI Agent はこれらのルールを必ず守る必要があります。

---

# Secrets

以下は **リポジトリに保存してはいけません**。

- API keys
- tokens
- private keys
- passwords
- secrets

---

# Environment Variables

`.env` ファイルは commit しない。

例：

```
.env
.env.local
.env.production
```

---

# Secret Management

Secrets は以下で管理する。

- Cloudflare secrets
- GitHub secrets

---

# Dependency Safety

新しい dependency を追加する場合：

- widely used
- maintained
- minimal permissions

を確認する。

---

# External Requests

外部 API を利用する場合：

- HTTPS を使用する
- 信頼できる provider のみ使用する

---

# Principle of Least Privilege

必要最小限の権限のみ使用する。

例：

- GitHub token
- Cloudflare token