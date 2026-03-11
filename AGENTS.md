# AGENTS.md

このリポジトリで作業する AI Agent は、まず次のファイルを読んでください。

1. `AI_CONTEXT.md`

その後、以下のルールとワークフローに従ってください。

## Rules

- `.codex/rules/architecture.md`
- `.codex/rules/coding.md`
- `.codex/rules/security.md`
- `.codex/rules/change-policy.md`

## Project Specification

- `PROJECT_SPEC.md`

## Agent Principles

- シンプルで最小構成を優先する
- 既存のデータ履歴を壊さない
- `pricing-history.json` の履歴は削除・改変しない
- ランタイムで AI API を利用しない