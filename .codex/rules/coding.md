# coding.md

このファイルは、このリポジトリでの実装ルールを定義します。

AI Agent はコードを書く前にこのルールに従ってください。

---

# Coding Principles

## 1. Keep It Simple

実装は可能な限りシンプルに保つ。

- 不必要な abstraction を作らない
- 不必要な dependency を追加しない
- 小さく理解しやすいコードを書く

---

## 2. Small Changes

変更は小さく行う。

- 1つの目的ごとに変更する
- 大きな refactor を一度に行わない
- 影響範囲を最小にする

---

## 3. Readability

コードは読みやすさを優先する。

- 明確な命名
- 短い関数
- 明確な責務

---

## 4. Avoid Premature Optimization

最適化は必要になるまで行わない。

まずはシンプルに実装する。

---

## 5. Prefer Standard Tools

新しいツールより既存の標準機能を優先する。

例：

- 標準ライブラリ
- framework の標準機能
- シンプルなユーティリティ

---

# File Organization

AI Agent は既存のディレクトリ構造を尊重する。

新しいディレクトリを作る場合は、明確な理由が必要。

---

# Comments

コメントは以下の場合に書く。

- 非自明な処理
- アルゴリズムの意図
- 将来の注意点

明らかなコードにはコメントを付けない。