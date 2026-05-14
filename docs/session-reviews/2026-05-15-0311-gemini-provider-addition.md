# Session Review: Gemini Provider Addition

Date: 2026-05-15 03:11 JST
Scope: API pricing provider 追加、source policy review、Gemini collector 実装、manual collector 更新確認
Summary: Groq は Terms 上の懸念により collector source として使わず、Terms-first の選定を経て Gemini を `caution` 扱いで追加した。Gemini は公式 docs の `pricing.md.txt` を primary source とし、manual collector update から site 反映まで確認した。

## 1. セッションの目的

- API pricing tracker に新しい provider を追加する。
- Groq のような Terms / source suitability 上の問題を避けるため、実装前に source policy を確認する。
- 追加後、collector manual update と site 反映までの流れを確認する。

## 2. 実際にやったこと

- Groq を候補として調査し、Terms 上の crawl / scrape / data gathering 制限が強いため collector source として使わない判断を記録した。
- 次候補の選定方針を Terms-first に変更し、Gemini / xAI / Mistral / Replicate / Together AI などを source policy 上で分類した。
- Gemini を第1実装候補とし、公式 docs の `pricing.md.txt` に Paid Tier / Standard / text input-output pricing が含まれることを確認した。
- Gemini provider collector を追加し、`providerCollectors()` に登録した。
- fixture は実ページ全文コピーではなく、parser に必要な最小 synthetic Markdown fixture にした。
- `Collector Manual Update` 失敗時、Gemini fetch の Chrome 風 `user-agent` header が `redirect count exceeded` を引き起こすことを特定し、Gemini fetch header を最小化した。
- provider fetch 失敗時に provider 名付き error を返すようにし、今後の切り分けを容易にした。
- 新規 workflow run で manual collector update が通り、site 側に Gemini が表示されたことをユーザー確認した。

## 3. 変更したもの

### Files

- `docs/provider-source-policy.md`
  - Gemini の source review を追加し、`pricing.md.txt` を primary source として記録した。
  - xAI / Mistral / Replicate / Together AI / Fireworks / Cerebras / OpenRouter の screening notes を追加した。
- `worker/src/providers/gemini/index.ts`
  - Gemini Paid Tier / Standard / text input-output pricing parser / collector を追加した。
  - Chrome 風 `user-agent` header を削除し、`pricing.md.txt` の redirect loop を回避した。
- `worker/src/index.ts`
  - Gemini collector を `providerCollectors()` に登録した。
  - provider fetch 失敗時に provider 名付き error を返すようにした。
- `worker/fixtures/gemini-pricing-page.md.txt`
  - 最小 synthetic Markdown fixture を追加した。
- `worker/tests/gemini-parser.test.mjs`
  - Gemini parser の record 抽出、必須 field、対象外カテゴリ除外を確認する test を追加した。
- `AI_CONTEXT.md`
  - 現在の collector 登録 provider と Gemini source 方針を追記した。
- `PROJECT_SPEC.md`
  - provider list と fixture 方針を現在の運用に合わせて更新した。
- `docs/collector-production-flow-v1.md`
  - Gemini 追加後の manual collector update 確認事項を追記した。
- `docs/session-reviews/2026-05-15-0311-gemini-provider-addition.md`
  - このレビューを追加した。

### Commands

- `npm test`
  - 目的: worker parser unit test の確認。
  - 結果: pass。
- `./node_modules/.bin/tsc --noEmit`
  - 目的: worker TypeScript check。
  - 結果: pass。
- Gemini `pricing.md.txt` live smoke
  - 目的: 実 source で Paid Tier / Standard / Input / Output と record 抽出を確認。
  - 結果: pass。5 Gemini records を抽出。
- 一時 `DATA_DIR` で `npm run run:collector -- --data-dir <tmp>`
  - 目的: OpenAI / Anthropic / Gemini の同時 collector 実行と current/history 更新を確認。
  - 結果: pass。実 source で `openai: 3`, `anthropic: 9`, `gemini: 5` を確認。
- `npm run build` in `site`
  - 目的: data-driven site build の確認。
  - 結果: pass。Vite chunk size warning は出たが build failure ではない。
- `git push origin codex/provider-terms-screening`
  - 目的: PR branch 更新。
  - 結果: push 済み。

## 4. 判断・意思決定

- 採用した方針:
  - Groq は collector source として使わない。
  - Gemini は `caution` 扱いで限定利用する。
  - Gemini primary source は HTML ではなく、公式 docs の `pricing.md.txt` にする。
  - 初回対象は Paid Tier / Standard / text input-output pricing のみにする。
- 見送った案:
  - Groq pricing の collector 登録。
  - Gemini HTML parser を primary source にする案。
  - Gemini の Batch / Flex / Priority / media / tiered pricing を初回対象に含める案。
- 理由:
  - Groq は Terms 上の制限が強い。
  - `pricing.md.txt` は今回対象の pricing を含み、HTML DOM より parser が安定しやすい。
  - 現行 schema では Gemini の prompt-size tiered pricing や media pricing を安全に正規化しにくい。

## 5. 検証・確認結果

- 確認内容:
  - worker test / typecheck。
  - Gemini `pricing.md.txt` live smoke。
  - 一時 `DATA_DIR` で collector 全体実行。
  - site build。
  - GitHub Actions の Collector Manual Update。
  - site 側の Gemini 表示。
- 結果:
  - すべて pass またはユーザー確認済み。
  - GitHub Actions の古い job rerun は古い commit を再実行するため、新規 run が必要だった。
- 未確認事項:
  - schedule 実行の長期安定性。
  - Gemini pricing docs の将来構造変更への追随。
- 仮説:
  - Gemini `pricing.md.txt` の Markdown/text source は HTML parser より構造変更耐性が高いが、公式 machine-readable pricing API ではないため `caution` のまま運用する。

## 6. 未完了・懸念点

- 残作業:
  - schedule 有効化はまだ別判断。
  - PR / main merge の最終状態はこのローカル作業ツリーでは未確認。
- リスク:
  - `caution` source は Terms / docs 構造変更時に再レビューが必要。
  - fail-closed 寄りの collector なので、Gemini 失敗は全体 update failure になる。
- 次回触る前の注意点:
  - GitHub Actions の rerun はその run の元 commit を使う。
  - collector 失敗ログでは provider 名付き error を見る。
  - `data/` は manual collector workflow 以外で手編集しない。

## 7. 次回の最初の一手

1. `docs/provider-source-policy.md` の Gemini `caution` 前提を保ったまま運用する。
2. Collector Manual Update は rerun ではなく、必要に応じて新規 run で確認する。
3. schedule 有効化の要否を別途判断する。

## 8. 再利用できる手順

- 手順名: Terms-first provider addition
  - どういう場面で使えるか: 新しい API pricing provider を追加するとき。
  - 実際の流れ: Terms / source suitability review、source policy 更新、primary source 選定、最小 synthetic fixture、parser test、collector registry、live smoke、一時 `DATA_DIR` collector、site build、manual workflow 確認。
  - 前提条件: provider source が `caution` 以上で、現行 schema に安全に正規化できること。

## 9. skill 化候補

### 候補 1: provider-pricing-addition

- Summary: 新規 provider pricing collector を Terms-first で追加する標準手順。
- Input: provider 名、候補 source URL、Terms / policy URL、対象 pricing scope。
- Steps: source review、classification、fixture 方針、parser 実装、registry 登録、worker/site/manual workflow 検証。
- Output: source policy 更新、provider collector、parser test、session review。
- Why reusable: provider 追加時に毎回ほぼ同じ判断と検証が必要。
- Priority: Medium
- まだ skill 化しない方がよい理由があれば: provider ごとの Terms と pricing model の揺れが大きく、もう1件程度の追加実績を見てからの方が安定する。

## 10. 引き継ぎメモ

- 次回すぐ読むべきファイル:
  - `docs/provider-source-policy.md`
  - `docs/collector-production-flow-v1.md`
  - `worker/src/providers/gemini/index.ts`
  - `worker/src/index.ts`
- 次回そのまま使える指示:
  - 新 provider は Terms / source suitability を先に確認し、`manual-review` 以下なら parser 実装に進まない。
  - fixture は synthetic minimal にする。
  - collector registry 追加後は一時 `DATA_DIR` で全 provider 同時実行を確認する。
- 詰まりそうな点:
  - GitHub Actions の rerun と新規 run の違い。
  - provider source が technically fetchable でも policy 上使えるとは限らない点。
