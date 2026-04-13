# Provider Source Policy

## 目的

この文書は、collector がどのソースから pricing 情報を取得してよいか、そのソースにどの程度の運用リスクがあるか、本番運用前に何を再確認すべきかを記録するための運用メモです。

これは本プロジェクトの内部用ドキュメントです。
法的助言ではなく、「このソースは契約上必ず許可されている」と断定する文書でもありません。
判断に迷う場合は、より保守的な分類を優先し、provider の公式 terms / policy を再確認します。

最終確認日: 2026-04-09

---

## ステータス定義

- `allow`
  - 運用上、主要な取得元として扱ってよい
  - 公式 API や公式の機械可読ソースなど、provider 側がその用途を強く想定していると見なせる場合

- `caution`
  - 開発用途、または低頻度・保守的な本番運用に限って利用可能
  - 取得頻度の増加、対象拡大、長期運用の前には再レビューが必要

- `manual-review`
  - まだ自動化しない
  - 実装または継続利用の前に人間レビューが必要

- `blocked`
  - 取得元として使わない

---

## 共通ルール

### 優先する source の順序

1. 公式 API または公式の機械可読ソース
2. 公式 developer documentation / changelog / pricing page
3. 人間向け pricing page の HTML 解析

HTML scraping は最後の手段であり、デフォルトの第一候補ではありません。

### 取得時のルール

- 取得頻度は低く保つ
- 必要最小限のページだけを取得する
- 必要最小限の pricing 情報だけを抽出する
- 広範囲の crawl はしない
- ログイン必須領域にはアクセスしない
- challenge page / CAPTCHA / 認証 / rate limit 保護の回避はしない
- `robots.txt` だけで十分な許可判断をしたことにしない
- 開発用途から継続的な本番運用へ移る前に、terms / policy を再確認する

### レビューの見直しトリガー

次のいずれかが起きたら、本ドキュメントを再レビューします。

- provider の pricing page 構造が大きく変わった
- provider の terms / usage policy が更新された
- より適切な公式の機械可読ソースが公開された
- collector の取得頻度を上げる
- 新しい provider を追加する
- ローカル / 手動運用から unattended な本番運用へ移行する

---

## Provider: OpenAI

### Source summary

- Provider: OpenAI
- 主な候補 source: `https://openai.com/api/pricing/`
- 関連する確認先:
  - `https://openai.com/policies/services-agreement/`
  - `https://openai.com/policies/`
  - `https://openai.com/robots.txt`

### Source type

- 公開された公式 pricing page
- 人間向けの HTML ページ
- 今回の確認時点では、pricing 専用の機械可読 feed は未確認

### Robots check

- site 全体の `robots.txt` は概ね permissive
- 現時点で見える範囲では、`/microsoft-for-startups/` を除いて広く allow 寄り

### Terms / policy check

- OpenAI は API や開発者向け利用に関する Services Agreement を公開している
- 公式 policy ページ群は確認対象として扱うべき
- ただし、pricing page 自体が「安定した scraping interface として提供されている」と明示されているわけではない

### Technical stability

- pricing page 自体は公式情報源として価値が高い
- ただし human-facing な HTML ページなので、構造変更の可能性はある
- parser は狭いスコープで実装し、安全に fail する前提にする

### Classification

`caution`

### このプロジェクトで許容する使い方

以下をすべて満たす場合に限って利用可とする。

- 低頻度 fetch
- 単一ページ、または必要最小限ページのみの取得
- 公開 pricing 情報の必要最小限フィールドのみ抽出
- challenge / auth / login の回避をしない
- 広範囲 crawl をしない
- parser failure を破壊的変更につなげない

### 許容しないこと

- 攻撃的な crawl
- 必要性のない高頻度 polling
- 関連の薄い marketing page まで広げた scraping
- 保護回避や restricted content へのアクセス
- `robots.txt` だけで契約上問題ないと判断すること

### `allow` にしない理由

現時点の主要 source は公開 HTML pricing page であり、専用の機械可読 developer endpoint ではないためです。
この文書では、保守的な運用基準を採用します。

### Next review action

- unattended な本番運用前に OpenAI の terms / policy を再確認する
- より構造化された公式 pricing source が出たら優先的に切り替える
- OpenAI provider 実装近傍に source 前提をコードコメントで残す
- parser の対象範囲は必要最小限に保つ

---

## Provider: Anthropic

### Source summary

- Provider: Anthropic
- 主な候補 source:
  - `https://www.anthropic.com/pricing`
- 関連する確認先:
  - `https://docs.anthropic.com/en/docs/about-claude/pricing`
  - `https://www.anthropic.com/legal/commercial-terms`
  - `https://www.anthropic.com/legal/aup`
  - `https://www.anthropic.com/robots.txt`

### Source type

- 公開された公式 pricing page
- 公開 developer documentation
- 公開 commercial terms / usage policy
- 人間向けの HTML source

### Robots check

- site 全体の `robots.txt` は概ね permissive

### Terms / policy check

- Anthropic は Commercial Terms of Service と Usage Policy を公開している
- Commercial Terms は API keys や関連サービス利用を govern する文脈を持つ
- docs 側でも最新 pricing は main pricing page を確認する前提が示されている
- ただし、pricing page 自体が「安定した scraping interface として提供されている」と明示されているわけではない

### Technical stability

- pricing 情報は公式情報として有用
- ただし公開 pricing page は構造変更の可能性がある
- prompt caching 系の価格概念は、このプロジェクトの normalized model に 1:1 で乗らない場合がある
- 近似マッピングを使う場合は caveat を明示する必要がある

### Classification

`caution`

### このプロジェクトで許容する使い方

以下をすべて満たす場合に限って利用可とする。

- 低頻度 fetch
- 必要最小限フィールドのみ抽出
- login / challenge 回避をしない
- 広範囲 crawl をしない
- parser は安全に fail する
- 近似 normalization を行う箇所は Anthropic 固有の caveat を明示する

### 許容しないこと

- 攻撃的または高頻度な crawl
- 無関係なサイト領域の収集
- 制限や保護の回避
- Anthropic 特有の pricing semantics を caveat なしで OpenAI 風フィールドへ単純に押し込むこと

### `allow` にしない理由

主要 source は公開 human-facing pricing page であり、さらに normalization 層に provider 固有の解釈リスクがあるためです。

### Next review action

- unattended な本番運用前に Anthropic の legal pages を再確認する
- cached_input / prompt caching の近似マッピング caveat をコードと文書に明示し続ける
- より構造化された公式 pricing source が出たら優先する
- pricing concepts や prompt caching の見せ方が変わったら再レビューする

---

## 実装ガイドライン

このプロジェクトの collector は、以下を守ること。

- 取得先は原則として公式 provider の pricing source のみに限定する
- 取得頻度は低く保つ
- parser breakage 時は fail closed 寄りで扱う
- 自動的に取得範囲を広げない
- fixture 保存は parser test / debug 用に限定する
- 「技術的に parser が動くこと」と「source policy 上問題ないこと」は分けて扱う

parser が動いたこと自体は、その source が長期本番運用に適していることを意味しません。

---

## 現時点の判断

現時点の作業上の判断は以下です。

- OpenAI: `caution`
- Anthropic: `caution`

この意味は以下の通りです。

- 保守的な開発利用、または限定的な制御下の運用には使える
- ただし将来にわたって完全にクリア済みとは扱わない
- より強い自動化や provider 拡張の前には再レビューが必要

---

## Future Providers

新しい provider を追加する場合は、少なくとも以下を記録すること。

- provider name
- source URL
- source type
- robots check result
- terms / policy review result
- technical stability
- normalization caveats
- classification
- next review action