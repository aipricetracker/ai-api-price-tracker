# AGENTS.md

このリポジトリで作業する AI Agent は、まず次のファイルを読んでください。

1. `AI_CONTEXT.md`
2. `docs/provider-source-policy.md`

その後、以下のルールとワークフローに従ってください。

## Rules

- `.codex/rules/architecture.md`
- `.codex/rules/coding.md`
- `.codex/rules/security.md`
- `.codex/rules/change-policy.md`

特に branch 運用、`main` 反映条件、`data/` の扱いは `.codex/rules/change-policy.md` を読むこと。

## Project Specification

- `PROJECT_SPEC.md`

## Design Policy

site の UI / UX / 情報設計 / デザイン収束を行う場合は、以下も参照してください。

- `DESIGN.md`
- `SITE_SCORE.md`

## Operational Policy

- `docs/provider-source-policy.md`

## Agent Principles

- シンプルで最小構成を優先する
- 既存のデータ履歴を壊さない
- `pricing-history.json` の履歴は削除・改変しない
- ランタイムで AI API を利用しない
