# Session Review: history-only model routes

Date: 2026-04-29 22:26
Scope: AI API Price Tracker site route/data selector alignment
Summary: history-only model の detail route を正式な archive 仕様として扱い、Top Recent Changes は current snapshot 対象に限定した。`/changes` は append-only history archive として維持した。

## 1. セッションの目的

- `current-pricing.json` には存在しないが `pricing-history.json` には残る model の detail page を生成する。
- `/changes` から history-only model detail へリンク切れなく遷移できるようにする。
- Top の `Recent Changes` が history-only model を current change のように見せないようにする。
- data model と collector には触れない。

## 2. 実際にやったこと

- project rules と `AI_CONTEXT.md` / `docs/provider-source-policy.md` を確認した。
- `Context Explorer` subagent で existing route/data helper/link 生成箇所を read-only 調査した。
- model detail route の static paths を current snapshot と visible pricing history の union に変更した。
- current record がない model を error ではなく `historical-only` UI state として扱う helper を追加した。
- model detail page で current model と history-only model の表示を分岐した。
- `/changes` の link 生成は変更せず、route 側で history-only URL を受けられるようにした。
- `Reviewer` subagent で変更後の要件適合を read-only レビューした。
- Top page の `Recent Changes` を Home 専用 helper に差し替え、current snapshot に存在する provider/model の変更だけを表示するようにした。
- current 対象の non-initial change が 0 件の場合に備え、Home Recent Changes に empty state を追加した。
- in-app browser で Top / `/changes` / history-only detail の主要導線を確認した。

## 3. 変更したもの

### Files

- `site/src/lib/data.ts`
  - `getModelDetailSlugs()` を追加し、current snapshot と visible pricing history の union で detail route slugs を返すようにした。
  - `getModelDetail()` を追加し、current record がある場合と history-only の場合を同じ detail page で扱えるようにした。
  - `getRecentCurrentChanges()` を追加し、Home 用に current snapshot に存在する provider/model の non-initial changes だけを返すようにした。
- `site/src/lib/types.ts`
  - `ModelDetail` type を追加した。
- `site/src/lib/ui-text.ts`
  - history-only model 表示用文言を追加した。
  - Home Recent Changes の empty state 文言を追加した。
- `site/src/pages/providers/[provider]/[model].astro`
  - `getStaticPaths()` を union slug helper に変更した。
  - current record がない場合も history があれば redirect せず、historical-only panel と history rows を表示するようにした。
- `site/src/pages/index.astro`
  - Home Recent Changes を `getRecentCurrentChanges(3)` に差し替えた。
  - recent current changes が 0 件のときの empty state を追加した。
- `docs/session-reviews/2026-04-29-2226-history-only-model-routes.md`
  - このセッションレビューを追加した。

### Commands

- `npm run build`
  - 目的: Astro build / static route generation / type generation の確認。
  - 結果: 成功。`/providers/openai/gpt-5-mini/index.html` が生成された。
- `rg -n "Historical model|Not in current snapshot|This model appears" site/dist/providers/openai/gpt-5-mini/index.html`
  - 目的: history-only detail の生成 HTML 確認。
  - 結果: history-only 表示文言を確認。
- `rg -n "/providers/openai/gpt-5-mini" site/dist/changes/index.html`
  - 目的: `/changes` の history-only link 維持確認。
  - 結果: link が残っていることを確認。
- `rg -n "gpt-5-mini" site/dist/providers/openai/index.html`
  - 目的: provider detail の current 一覧に history-only model が混ざらないことの確認。
  - 結果: match なし。
- in-app browser via browser-use
  - 目的: Top / `/changes` / history-only detail の導線確認。
  - 結果: Top には `gpt-5-mini` が出ず、`/changes` には出る。`/changes` から `/providers/openai/gpt-5-mini` に遷移し、`Historical model` 表示を確認。

## 4. 判断・意思決定

- 採用した方針: model detail route は current snapshot と visible history の union で生成する。
- 採用した方針: `/providers` と `/providers/[provider]` は current snapshot の一覧として維持する。
- 採用した方針: `/changes` は append-only history archive として history-only model も表示する。
- 採用した方針: Top Recent Changes は Home の入口として current snapshot に存在する model の変更に限定する。
- 見送った案: `/changes` の history-only model link を外す。
- 見送った案: `/providers` や provider detail current list に history-only model を混ぜる。
- 理由: current と history の役割を UI 上で混同させないため。history-only model は archive detail で辿れるが、現在監視対象であるかのようには見せない。

## 5. 検証・確認結果

- 確認内容: current model detail page が従来通り current snapshot summary を表示する。
- 結果: `gpt-5.4-mini` detail で `Current Snapshot` 表示を確認。
- 確認内容: history-only model detail page が生成される。
- 結果: build log と generated HTML で `/providers/openai/gpt-5-mini/index.html` を確認。
- 確認内容: `/changes` から history-only model detail page へ遷移できる。
- 結果: in-app browser で遷移と `Historical model` 表示を確認。
- 確認内容: `/providers/openai` に history-only model が混ざらない。
- 結果: generated HTML と browser 確認で `gpt-5-mini` が出ないことを確認。
- 確認内容: Top Recent Changes に history-only model が出ない。
- 結果: in-app browser で `gpt-5-mini` link が 0 件であることを確認。
- 未確認事項: visual screenshot ベースの細かい余白・デザイン QA は未実施。
- 仮説: current model の non-initial change が追加されると、Top Recent Changes に通常行として表示される。

## 6. 未完了・懸念点

- 残作業: current model の実変更履歴が増えた時点で、Top Recent Changes の行表示を再確認する。
- リスク: 現在の実データでは current model の non-initial change がないため、Home Recent Changes は empty state になる。
- 次回触る前の注意点: `/changes` は history archive、Top Recent Changes は current snapshot entry point として selector を分けて扱う。

## 7. 次回の最初の一手

1. current model の non-initial history fixture または実データが増えたら、Top Recent Changes の行表示を確認する。
2. Home Recent Changes の lead が current-only selector と完全に一致しているか文言を再評価する。
3. 必要なら provider overview の `recentChangeCount` / `latestUpdate` も current-only に寄せるか、history archive count として維持するかを別タスクで整理する。

## 8. 再利用できる手順

- 手順名: archive route と current list の責務分離確認
  - どういう場面で使えるか: append-only history と current snapshot の両方を UI に出す page / route を修正するとき。
  - 実際の流れ: current selector、history selector、route generator、一覧導線、detail state を分けて確認する。
  - 前提条件: data model を変更せず、UI selector/helper で責務を分けられること。

## 9. skill 化候補

### 候補 1: static-archive-route-audit

- Summary: current snapshot と append-only history を持つ静的サイトで、リンク切れや current/history 混同を検出する手順。
- Input: route generator、current selector、history selector、主要一覧 page。
- Steps: route source の確認、link source の確認、current-only list と archive list の分類、build output 確認、browser 導線確認。
- Output: 修正候補と検証項目。
- Why reusable: 今後 provider/model や archive page が増えると同じ問題が再発しうる。
- Priority: Medium
- まだ skill 化しない方がよい理由があれば: 現時点ではこの repository 固有の判断が多く、もう 1 回以上似た修正が出てから抽出する方がよい。

## 10. 引き継ぎメモ

- 次回すぐ読むべきファイル:
  - `AI_CONTEXT.md`
  - `SITE_SCORE.md`
  - `site/src/lib/data.ts`
  - `site/src/pages/index.astro`
  - `site/src/pages/providers/[provider]/[model].astro`
- 次回そのまま使える指示:
  - `/changes` は append-only history archive として history-only model を含める。
  - Top Recent Changes は current snapshot に存在する provider/model に限定する。
  - `/providers` と provider detail current list には history-only model を混ぜない。
- 詰まりそうな点:
  - `pricing-history.json` の visible history と `current-pricing.json` の current snapshot は、同じ provider/model でも役割が異なる。
  - source から確認できない限り、history-only model を discontinued / removed / deprecated と断定しない。
