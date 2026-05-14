# change-policy.md

このファイルは、このリポジトリでの変更ポリシーを定義します。

AI Agent は変更を行う前にこのポリシーに従う必要があります。

---

# Change Principles

## 1. Understand Before Changing

変更前に以下を理解する。

- existing code
- repository structure
- related components

---

## 2. Minimal Changes

変更は最小限にする。

- 必要な部分のみ変更
- 不必要なリファクタリングを行わない

---

## 3. Avoid Breaking Behavior

既存の動作を壊さない。

特に注意：

- data format
- pricing-history.json
- public URL structure

---

## 4. Preserve Data History

以下は禁止：

- 履歴データ削除
- 過去データ改変
- data reset

---

## 5. Incremental Development

実装は段階的に進める。

例：

1. 最小実装
2. 動作確認
3. 改善

---

# Branch Operation Rules

## 6. `main` Is Production

- `main` branch は production branch として扱う
- `main` への反映は Cloudflare Pages の production deploy につながる前提で扱う
- `main` 上で直接作業しない
- AI Agent は、通常作業で `main` に直接 commit しない

例外:

- 緊急 hotfix
- deploy failure を止めるための最小修正

ただし、例外でも変更範囲は最小に保つ。

## 7. Work On `codex/...` Branches

- 通常作業は `main` から branch を切って行う
- branch 名は原則として `codex/...` を使う

例:

- `codex/site-...`
- `codex/docs-...`
- `codex/collector-...`
- `codex/deploy-...`

AI Agent は、新しい作業を始めるときに、現在の branch が `main` なら branch 作成が必要かを確認する。

## 8. Conditions For Updating `main`

- `main` に反映する前に、変更内容が今回の目的に対して最小であることを確認する
- public deploy に影響する変更では、原則として `site/` で build を確認してから `main` に反映する
- route, meta, analytics, headers, public copy, asset など公開面に触る変更は、特に build と出力確認を優先する
- `main` に反映した後は、必要に応じて Pages deploy や live host を確認する

## 9. Handling Of `data/`

- `data/current-pricing.json` と `data/pricing-history.json` は、原則として collector workflow により更新される
- 通常の site 作業、docs 作業、UI 改修では `data/` を手で変更しない
- `pricing-history.json` の削除・改変・reset は禁止
- 公開前データ整理のような特例が必要な場合でも、通常運用の collector update と混同しないよう理由を明示する

## 10. Scope Discipline For Agents

- 小さな docs 修正でも、production deploy に乗る前提なら branch 運用を優先する
- `main` 直作業が許容されるか不明な場合は、`main` に書かず branch を切る
- 既存の dirty state がある場合、無関係な変更は巻き込まない
- 運用ルールを変える変更は、docs メモではなくこの rule file で管理する

---

# When Unsure

設計に不明点がある場合：

- 推測で大きな変更をしない
- 既存ルールを優先する
