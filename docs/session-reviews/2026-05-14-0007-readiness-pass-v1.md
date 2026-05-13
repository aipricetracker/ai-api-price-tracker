# Session Review: readiness pass v1

Date: 2026-05-14 00:07
Scope: AI API Price Tracker public-site readiness pass before Cloudflare Pages setup
Summary: 公開前 readiness pass を実施し、public archive として不自然だった PoC seed 履歴を除去した。Top / Changes / Providers / Model Detail の意味整合、static site foundation、主要 route 生成、build 成功を確認した。

## 1. セッションの目的
- Cloudflare Pages 公開前に、public site として出して問題ない状態か確認する。
- 必要な blocker のみ最小修正する。
- data / page semantics / public-facing copy / sitemap / robots / route 生成 / build の最終確認を行う。

## 2. 実際にやったこと
- `AGENTS.md`、`AI_CONTEXT.md`、`PROJECT_SPEC.md`、`DESIGN.md`、`SITE_SCORE.md`、`docs/provider-source-policy.md`、`docs/collector-production-flow-v1.md`、`.codex/rules/architecture.md`、site/data 関連ファイルを読んだ。
- `Context Explorer` subagent で page semantics、history-only model、public-facing copy、static site foundation の read-only 整理を行った。
- `Reviewer` subagent で blocker / warning / later の観点レビューを行った。
- `data/pricing-history.json` を確認し、先頭 3 件の `gpt-4.1` / `claude-3-7-sonnet` PoC seed 履歴が public archive に不要と判断した。
- `site/src/lib/data.ts` から PoC seed UI 非表示ロジックと DEV fixture 注入を除去した。
- Home Hero の右端日付を build 日ではなく current snapshot の最新 `recorded_at` に変更した。
- Providers overview の `Total Changes` を `Current Changes` に改めた。
- Home copy の `major AI API providers` を `tracked AI API providers` に弱めた。
- `npm run build` を実行し、dist の主要 route、`robots.txt`、`sitemap.xml`、history-only detail route を確認した。

## 3. 変更したもの

### Files
- `data/pricing-history.json`
  - public archive に不要な PoC seed 3 件を削除した。
- `site/src/lib/data.ts`
  - PoC seed UI suppressor と DEV fixture 注入を除去した。
  - Home Hero 用に current snapshot の最新 `recorded_at` を返す helper を追加した。
- `site/src/lib/ui-text.ts`
  - Home / Providers の文言を readiness pass 判断に合わせて微修正した。
  - 未使用になった PoC seed 文言を削除した。
- `site/src/pages/index.astro`
  - Hero 右端の日付を current snapshot ベースに差し替えた。
- `docs/session-reviews/2026-05-14-0007-readiness-pass-v1.md`
  - このセッションレビューを追加した。

### Commands
- `sed -n ...`, `rg -n ...`, `nl -ba ...`
  - 目的: 前提ファイル、site 実装、data、文言、関連 docs の確認。
  - 結果: page semantics と data cleanup 論点を特定した。
- `git show 611c637:data/pricing-history.json`
  - 目的: `gpt-5-mini` と PoC seed 履歴の導入経緯確認。
  - 結果: `gpt-5-mini` は history-only archive として残し、PoC seed 3 件のみ cleanup 対象と判断した。
- `cd site && npm run build`
  - 目的: Astro production build と static route 生成確認。
  - 結果: 成功。23 page built。
- `find dist ...`
  - 目的: 主要 HTML、`robots.txt`、`sitemap.xml`、history-only detail の存在確認。
  - 結果: 主要生成物の存在を確認した。
- `rg -n ... dist/...`
  - 目的: canonical / noindex / history-only 表示 / route link / copy の確認。
  - 結果: `gpt-5-mini` が `/changes` に出て `/providers/openai` に出ないこと、`404` noindex、`Current Changes` 表示などを確認した。

## 4. 判断・意思決定
- 採用した方針:
  - `gpt-5-mini` は history-only model として残す。
  - `gpt-4.1` / `claude-3-7-sonnet` の PoC seed 履歴は公開前データ整理として削除する。
  - PoC seed を code 側で隠すのではなく、public archive に載せる data を明示的に整える。
  - Home / Providers の wording は current-only semantics に合わせる。
- 見送った案:
  - `gpt-5-mini` を削除する案。
  - PoC seed を data に残したまま UI 非表示で継続する案。
  - 大きな再設計や route 仕様変更。
- 理由:
  - `gpt-5-mini` は 2 件の観測があり、history-only archive として自然に読める。
  - UI suppressor は public archive の信頼性説明を弱める。
  - readiness pass の目的は「何を公開するか」を明確にすることであり、見せ方だけで曖昧にしない方がよい。

## 5. 検証・確認結果
- 確認内容: `npm run build`
  - 結果: 成功。
- 確認内容: history-only detail route 生成
  - 結果: `/providers/openai/gpt-5-mini/index.html` が生成された。
- 確認内容: Top に history-only model が出ない
  - 結果: `dist/index.html` で `gpt-5-mini` match なし。
- 確認内容: `/changes` に history-only model が出る
  - 結果: `dist/changes/index.html` に `gpt-5-mini` link を確認。
- 確認内容: `/providers/openai` に history-only model が混ざらない
  - 結果: `dist/providers/openai/index.html` に `gpt-5-mini` match なし。
- 確認内容: `404` noindex
  - 結果: `dist/404.html` に `noindex, follow` を確認。
- 確認内容: `robots.txt` / `sitemap.xml`
  - 結果: 生成あり。`robots.txt` に sitemap URL、`sitemap.xml` に history-only detail を確認。
- 未確認事項:
  - in-app browser での最終表示確認は、DevTools MCP 既存 browser session 競合により未実施。
- 仮説:
  - Cloudflare Pages 上でも static output は同様に配信される見込み。

## 6. 未完了・懸念点
- 残作業:
  - custom domain を使う場合は `PUBLIC_SITE_URL` を本番 URL に設定する。
- リスク:
  - current snapshot の最新 `recorded_at` は 2026-04-13 で、公開日より古い。
  - `/changes` / model detail で source URL を直接出していないため、出典確認導線は補助ページ依存。
- 次回触る前の注意点:
  - `pricing-history.json` の今回の削除は通常 collector update ではなく、公開前データ整理として扱う。
  - 今後は UI suppressor ではなく data/source 側で判断する。

## 7. 次回の最初の一手
1. Cloudflare Pages 側の `PUBLIC_SITE_URL` を確定する。
2. 実公開 URL で Home / Changes / Providers / history-only detail を実ブラウザ確認する。
3. 必要なら source URL の page-level 表示を別タスクで検討する。

## 8. 再利用できる手順
- 手順名: static archive readiness pass
  - どういう場面で使えるか
    - current snapshot と append-only history を併用する静的サイトの公開前確認。
  - 実際の流れ
    - data 信頼性確認 → selector/semantics 確認 → public-facing copy 確認 → build → dist route / sitemap / robots 確認。
  - 前提条件
    - static build がローカルで通ること。

## 9. skill 化候補

### 候補 1: static-archive-readiness-pass
- Summary:
  - current snapshot / history archive を持つ静的サイトの公開前チェック手順。
- Input:
  - data files, site selectors, route files, metadata files.
- Steps:
  - data hygiene review, semantics audit, build, generated output inspection, blocker triage.
- Output:
  - blocker / warning / later と最小修正。
- Why reusable:
  - 同種の static archive 公開前チェックで再利用しやすい。
- Priority: Medium
- まだ skill 化しない方がよい理由があれば:
  - この repo 固有の history-only semantics が多く、もう 1 回以上の反復を見てからの方がよい。

## 10. 引き継ぎメモ
- 次回すぐ読むべきファイル:
  - `AI_CONTEXT.md`
  - `docs/provider-source-policy.md`
  - `site/src/lib/data.ts`
  - `site/src/pages/index.astro`
  - `docs/session-reviews/2026-05-14-0007-readiness-pass-v1.md`
- 次回そのまま使える指示:
  - `gpt-5-mini` は history-only archive として残す。
  - Top は current-only、`/changes` は history archive、`/providers` は current-only 一覧。
  - custom domain 公開時は `PUBLIC_SITE_URL` を忘れずに設定する。
- 詰まりそうな点:
  - append-only 原則と公開前データ整理の境界。
  - current snapshot freshness と public-facing wording のバランス。
