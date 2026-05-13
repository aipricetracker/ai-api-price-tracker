# Cloudflare Pages v1 設定メモ

Date: 2026-05-14
Scope: AI API Price Tracker の Cloudflare Pages v1 公開設定

## 1. 目的

この文書は、Cloudflare Pages に v1 公開するための設定値と、公開直後の確認手順を固定するためのメモです。

前提:

- Git integration を使う
- Direct Upload は使わない
- Production branch は `main`
- collector は Cloudflare Pages ではなく GitHub Actions で動かす
- `main` への push を契機に Cloudflare Pages が build / deploy する

## 2. Pages Project 設定

Cloudflare dashboard では、以下の値を使います。

| 項目 | 値 |
| --- | --- |
| Framework preset | `Astro` |
| Production branch | `main` |
| Root directory | `site` |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Install command | `npm ci` |
| Package manager | `npm` |
| Node.js version | `22` |

補足:

- [site/package.json](/Users/shioya/ai-workspace/ai-api-price-tracker/site/package.json) の `build` は `astro build`
- `site/package-lock.json` があるため、package manager は `npm` が自然
- [site/astro.config.mjs](/Users/shioya/ai-workspace/ai-api-price-tracker/site/astro.config.mjs) と [site/src/lib/site-meta.ts](/Users/shioya/ai-workspace/ai-api-price-tracker/site/src/lib/site-meta.ts) は `PUBLIC_SITE_URL` に依存
- この repo は monorepo 風構成なので、Pages project は `site/` を root directory に向ける

## 3. Environment Variables

### Production

設定するもの:

- `PUBLIC_SITE_URL`
- `NODE_VERSION`

推奨値:

- `pages.dev` で始める場合:
  - `PUBLIC_SITE_URL=https://ai-api-price-tracker.pages.dev`
  - `NODE_VERSION=22`
- custom domain で始める場合:
  - `PUBLIC_SITE_URL=https://<your-production-domain>`
  - `NODE_VERSION=22`

### Preview

強い理由がない限り、Production と同じ値を入れる運用を推奨します。

推奨:

- `PUBLIC_SITE_URL` は production canonical URL に揃える
- `NODE_VERSION=22`

理由:

- canonical / sitemap / robots / OGP URL は `PUBLIC_SITE_URL` を使って生成される
- preview hash URL をここに入れると、preview build が非 production canonical を吐く
- Cloudflare Pages の preview deployment は既定で noindex なので、この static site では production canonical のままで問題ない

## 4. PUBLIC_SITE_URL の扱い

現在の fallback:

- `https://ai-api-price-tracker.pages.dev`

repo 側の挙動:

- [site/astro.config.mjs](/Users/shioya/ai-workspace/ai-api-price-tracker/site/astro.config.mjs) は Astro の `site` に `PUBLIC_SITE_URL` を使う
- [site/src/lib/site-meta.ts](/Users/shioya/ai-workspace/ai-api-price-tracker/site/src/lib/site-meta.ts) は canonical URL 生成に同じ変数を使う
- [site/src/pages/robots.txt.ts](/Users/shioya/ai-workspace/ai-api-price-tracker/site/src/pages/robots.txt.ts) は sitemap URL に使う
- [site/src/pages/sitemap.xml.ts](/Users/shioya/ai-workspace/ai-api-price-tracker/site/src/pages/sitemap.xml.ts) は各 `<loc>` 生成に使う

ルール:

1. Production site が標準の `pages.dev` hostname なら、その URL を `PUBLIC_SITE_URL` に入れる
2. 後から custom domain を付ける場合は、`PUBLIC_SITE_URL` を custom domain に更新して再 deploy する
3. `PUBLIC_SITE_URL` を変えたら、live host 上で canonical / robots / sitemap を再確認する

## 5. Preview Deployment 方針

v1 の推奨方針:

- preview deployments は有効のままでよい
- preview URL を canonical base に使わない
- preview は verification 用として扱う

運用メモ:

- production deploy は `main` から出す
- preview deploy は非 production branch または pull request から出す
- preview を public に見せたくない場合は、Cloudflare dashboard 側で Cloudflare Access を有効化する

## 6. 初回 Deploy 後の確認

最初の production deploy が成功したら、live host で以下を確認します。

### 確認 route

- `/`
- `/changes`
- `/providers`
- `/providers/openai`
- `/providers/anthropic`
- current model detail:
  - `/providers/openai/gpt-5.4-mini`
- history-only model detail:
  - `/providers/openai/gpt-5-mini`
- `/about`
- `/sources`
- `/disclaimer`
- `/privacy`
- `/404`
- `/sitemap.xml`
- `/robots.txt`

### 確認観点

- 期待 route が `200` で返る
- `/404` は custom 404 page が出る
- CSS と asset が正常に読み込まれる
- canonical URL が期待した production base URL を使っている
- OGP / Twitter meta tags が入っている
- `robots.txt` に正しい sitemap URL が入っている
- `sitemap.xml` に以下が含まれる
  - static pages
  - provider pages
  - current model detail pages
  - history-only model detail pages
- `/changes` から `/providers/openai/gpt-5-mini` へ遷移できる
- [_headers](/Users/shioya/ai-workspace/ai-api-price-tracker/site/public/_headers) の policy が response に乗っている
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `X-Frame-Options: DENY`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`

## 7. Collector Manual Update -> Pages Redeploy 確認

期待する責務分離:

- GitHub Actions:
  - pricing を取得する
  - `data/current-pricing.json` を更新する
  - 必要時だけ `data/pricing-history.json` に追記する
  - 差分があるときだけ `main` に commit / push する
- Cloudflare Pages:
  - `main` への push を検知する
  - site build を実行する
  - static output を deploy する

確認手順:

1. GitHub Actions から `Collector Manual Update` を手動実行する
2. 差分なし run の場合:
   - data commit は作られない
   - Pages production redeploy も発生しない想定でよい
3. 差分あり run の場合:
   - `data/current-pricing.json` と `data/pricing-history.json` が同一 commit で更新される
   - その commit が `main` に入る
   - Cloudflare Pages がその commit を起点に production deploy を開始する
4. deploy 完了後、live site で updated snapshot が見えることを確認する

入れないもの:

- Cloudflare API token を GitHub Actions に入れない
- Actions から Pages を deploy する logic を足さない
- collector workflow から Pages API を直接叩かない

## 8. repo 側の追加修正要否

現時点の判断:

- Pages v1 設定に入る前の repo-side blocker はない
- Cloudflare dashboard に入る前に必須の code change もない

後で検討できる改善:

- 実公開 URL での verification checklist を運用メモとして追加する
- OGP image が必要になった段階で追加する

## 9. 残リスク / 注意点

- `PUBLIC_SITE_URL` は実際の production URL と一致している必要がある。ズレると canonical / robots / sitemap / OGP URL もズレる
- custom domain を後から付ける場合は、`PUBLIC_SITE_URL` を更新して再 deploy する
- current snapshot の `recorded_at` は「最後に取得したデータ時刻」であり、live な `last checked now` ではない
- OGP image は未設定
- analytics は未導入
- schedule は未有効化で、collector は引き続き manual `workflow_dispatch`

## 10. 2026-05-14 時点の確認結果

確認済み事項:

- `https://ai-api-price-tracker.pages.dev/` で v1 公開済み
- `robots.txt` と `sitemap.xml` は `https://ai-api-price-tracker.pages.dev` を base URL として返している
- `_headers` の security headers は live response に反映されている
- mobile 幅で以下の崩れがないことを確認済み
  - Top
  - `/changes`
  - `/providers`
  - history-only model detail
- GitHub Actions `Collector Manual Update` 実行後、`main` に data update commit が作成された
- Cloudflare Pages はその commit を検知して production deploy を開始した

確認された data update commit:

- `c2ae780 chore(data): update pricing snapshot`

この時点の判断:

- Cloudflare Pages v1 の build / deploy 導線は成立している
- GitHub Actions collector と Pages deploy の責務分離も意図どおりに動作している
