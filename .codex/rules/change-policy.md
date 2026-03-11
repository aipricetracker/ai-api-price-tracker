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

# When Unsure

設計に不明点がある場合：

- 推測で大きな変更をしない
- 既存ルールを優先する