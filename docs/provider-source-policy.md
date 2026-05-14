# Provider Source Policy

## 目的

この文書は、collector がどのソースから pricing 情報を取得してよいか、そのソースにどの程度の運用リスクがあるか、本番運用前に何を再確認すべきかを記録するための運用メモです。

これは本プロジェクトの内部用ドキュメントです。
法的助言ではなく、「このソースは契約上必ず許可されている」と断定する文書でもありません。
判断に迷う場合は、より保守的な分類を優先し、provider の公式 terms / policy を再確認します。

最終確認日: 2026-05-15

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

- `future-review`
  - 今回は実装候補にしない
  - 将来、対象範囲や provider 方針が変わった場合に改めて review する

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

## Provider: Gemini

### Source summary

- Provider: Gemini
- 主な候補 source:
  - `https://ai.google.dev/gemini-api/docs/pricing.md.txt`
- 関連する確認先:
  - `https://ai.google.dev/gemini-api/docs/pricing`
  - `https://ai.google.dev/gemini-api/terms`
  - `https://developers.google.com/terms`
  - `https://ai.google.dev/robots.txt`

### Source type

- 公開 developer documentation
- 公開 Gemini Developer API pricing page の Markdown/text source
- HTML pricing page は fallback / reference 扱い
- 現時点では、pricing 専用の公式 machine-readable feed は未確認

### Robots check

- `robots.txt` だけでは十分な許可判断にしない
- Google Developers / Google AI docs は公式 developer documentation として扱う
- `pricing.md.txt` は公開 docs 由来の Markdown/text source だが、安定した machine-readable pricing API ではない

### Terms / policy check

- Gemini API は Google APIs Terms of Service と Gemini API Additional Terms of Service の対象
- Google APIs Terms は documented method / API limits / credentials / content restrictions を定める
- Gemini API Additional Terms では Paid Services の fees が pricing page で指定され、pricing は変更されうる
- Grounding with Google Search には追加の強い制限があるため、pricing collector の対象にはしない
- `pricing.md.txt` docs の低頻度取得自体を明確に禁止する記載は、今回確認した範囲では未確認

### Technical stability

- `pricing.md.txt` は今回対象にする Paid Tier / Standard / text input-output pricing を含む
- Markdown/text parser は HTML parser より presentation / DOM / locale 変更の影響を受けにくい
- ただし公開 docs source であり、見出し・表記・価格表構造が変わる可能性はある
- Standard / Batch / Flex / Priority、media modality、context caching、grounding、prompt-size tiered pricing が混在する
- parser は Paid Tier / Standard / text input-output pricing のみに限定し、安全に fail する前提にする

### Normalization caveats

- 初回対象は Paid Tier / Standard / text input-output pricing のみ
- Batch / Flex / Priority は対象外
- audio / image / video / Live / TTS / embedding / grounding / context caching / storage price は対象外
- prompt-size tiered pricing は現行 schema で表現できないため対象外
- Preview models は対象外
- provider が価格の effective date を明示しない場合、観測 UTC 日付を `effective_date` にする

### Classification

`caution`

### このプロジェクトで許容する使い方

以下をすべて満たす場合に限って利用可とする。

- 低頻度 fetch
- pricing docs の `pricing.md.txt` 単一ページのみ取得
- Paid Tier / Standard / text input-output price のみ抽出
- Preview / tiered pricing / media / Live / TTS / embedding / tools / grounding / caching を抽出しない
- login / challenge / auth / rate limit 保護の回避をしない
- parser failure を破壊的変更につなげない
- HTML pricing page は必要時の reference / fallback に留める

### 許容しないこと

- 広範囲 crawl
- 高頻度 polling
- Google Search grounding pricing や Grounded Results / Search Suggestions の収集
- 現行 schema に合わない tiered / media / storage pricing の無理な正規化
- `robots.txt` だけで契約上問題ないと判断すること

### `allow` にしない理由

主要 source は公式 docs の Markdown/text source だが、pricing 専用の公式 machine-readable feed ではありません。
また Gemini pricing は複数 service tier / modality / prompt-size tier を含むため、対象範囲を狭く保つ必要があります。

### Next review action

- unattended な本番運用前に Gemini API Terms / Google APIs Terms を再確認する
- pricing page 構造、service tier、model status が変わった場合は再レビューする
- 公式 machine-readable pricing source が出た場合は優先的に切り替える
- prompt-size tiered pricing を扱う場合は schema 変更を別途検討する

---

## Provider screening notes

### xAI

- Source candidates:
  - `https://docs.x.ai/developers/pricing`
  - `https://x.ai/legal/terms-of-service`
  - `https://x.ai/legal/terms-of-service-enterprise/previous-2025-06-27`
- Pricing docs は token pricing を公開しており現行 schema との相性はよい
- Consumer Terms は Service / Output に関する scraping / competing service 制限がある
- Enterprise Terms の現行適用条件と pricing docs HTML 取得可否は追加確認が必要
- Classification: `manual-review`
- Next review action: Gemini が不適になった場合、Enterprise Terms と docs source の扱いを再確認する

### Mistral

- Source candidates:
  - `https://mistral.ai/pricing`
  - `https://legal.mistral.ai/terms/commercial-terms-of-service`
- Commercial Terms には Mistral AI Products から許可された方法以外で content を抽出しない旨の制限がある
- pricing page は公開されているが、collector source として扱うには追加 review が必要
- Classification: `manual-review`
- Next review action: docs / pricing source の機械可読性と Terms 上の許容範囲を再確認する

### Replicate

- Source candidates:
  - `https://replicate.com/terms`
- Terms は Services / Documentation / Third-Party Terms の扱いが複雑
- pricing は model / hardware / time-based などが混在し、現行 token input-output schema と相性が悪い
- Classification: `manual-review`
- Next review action: token pricing に限定できる official source があるか確認する

### Together AI

- Source candidates:
  - `https://www.together.ai/terms-of-service`
- Terms は competitive analysis / benchmarking を禁止している
- この project は provider 間価格比較を目的に含むため、source としては保守的に扱う
- Classification: `blocked`
- Next review action: 明示的な許可または machine-readable pricing source が出た場合のみ再レビューする

### Fireworks

- Source candidates:
  - `https://fireworks.ai/terms-of-service`
- Terms は automated means による access、scraping、competitive analysis / benchmarking を制限している
- Classification: `blocked`
- Next review action: 明示的な許可または別契約がある場合のみ再レビューする

### Cerebras

- Source candidates:
  - `https://www.cerebras.ai/terms-of-service`
- Terms は automated means / scraping / data extraction と competitive analysis / benchmarking を制限している
- Classification: `blocked`
- Next review action: 明示的な許可または別契約がある場合のみ再レビューする

### OpenRouter

- Source candidates:
  - `https://openrouter.ai/docs/overview/models`
  - `https://openrouter.ai/terms`
- Models API は pricing metadata を返す公式 API として有望
- 今回は first-party provider を優先するため、将来候補として扱う
- Classification: `future-review`
- Next review action: aggregator / gateway provider を対象に含める方針を決めた段階で再レビューする

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
- Gemini: `caution`
- xAI: `manual-review`
- Mistral: `manual-review`
- Replicate: `manual-review`
- Together AI: `blocked`
- Fireworks: `blocked`
- Cerebras: `blocked`
- OpenRouter: `future-review`

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
