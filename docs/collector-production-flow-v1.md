# Collector Production Flow v1

## 目的

この文書は、AI API Price Tracker の collector を
ローカル PoC から unattended に近い運用へ進めるための
最小本番更新フロー v1 を整理する設計メモです。

対象は以下です。

- pricing 取得
- normalize / validate
- diff 判定
- `current-pricing.json` / `pricing-history.json` 更新
- GitHub 反映

今回は実装仕様の固定ではなく、
今後の実装判断でぶれないための運用設計を明文化します。

---

## 現状

現時点の前提は以下です。

- `worker/` には OpenAI / Anthropic の collector 実装がある
- ローカルでは `DATA_DIR` 前提の file-based store で動作確認済み
- `current-pricing.json` は current snapshot
- `pricing-history.json` は append-only history
- parser は fixture / unit test を持つ
- source policy は `docs/provider-source-policy.md` を基準にする
- OpenAI / Anthropic の source classification は現時点でどちらも `caution`

重要な前提:

- 「parser が技術的に動くこと」と
  「長期 unattended 運用として妥当であること」は分けて扱う
- provider source は保守的に扱う
- challenge / CAPTCHA / login / 保護回避はしない

---

## 候補案

### 案 A: Cloudflare Worker が本番で直接 GitHub を更新する

概要:

- Cloudflare Worker が定期実行される
- Worker が pricing 取得、diff 判定、JSON 更新、GitHub commit / push まで行う

利点:

- 構成が一見シンプル
- `worker/` というディレクトリ名と直感的に整合しやすい

欠点:

- 現在の実装は Node file I/O 前提であり、そのままでは使えない
- GitHub 認証情報の保持と API 経由の更新実装が必要
- current/history の原子的更新を GitHub API 上で慎重に扱う必要がある
- source policy が `caution` の段階で unattended を強く進めるには観測性が弱い

評価:

- v1 としては複雑すぎる
- **不採用**

---

### 案 B: GitHub を正本として、GitHub Actions で collector を実行する

概要:

- GitHub Actions が schedule / manual dispatch で起動する
- runner 上で repo を checkout する
- `worker/` の collector ロジックを Node 実行で呼ぶ
- `data/current-pricing.json` と `data/pricing-history.json` を更新する
- 変更があれば同じ repo に commit / push する

利点:

- 現在の file-based store を最小変更で流用しやすい
- GitHub 上の repo が正本になるため説明しやすい
- current/history の整合性を「1 回の commit」で扱える
- 失敗時に main を壊さず fail closed しやすい
- Cloudflare Pages 側の build / deploy とも相性がよい

欠点:

- 実行ホストは Cloudflare Worker ではなく Actions runner になる
- `worker/` の命名と実行環境が完全一致しない
- GitHub Actions ワークフロー設計が別途必要

評価:

- 現状実装との整合が最も高い
- **v1 採用案**

---

### 案 C: 外部 cron / VPS / self-hosted job で collector を実行する

概要:

- 外部実行基盤で collector を動かし、GitHub に反映する

利点:

- 実行環境の自由度が高い
- Node 実行しやすい

欠点:

- infra が増える
- secrets / runner 管理が増える
- 「低コスト・シンプル構成」に反する

評価:

- v1 では過剰
- **不採用**

---

## v1 採用案

### 採用する構成

v1 では **GitHub repository を正本**とし、
**GitHub Actions runner を collector 実行ホスト**として使います。

整理すると以下です。

- 正本:
  - `main` branch 上の `data/current-pricing.json`
  - `main` branch 上の `data/pricing-history.json`
- 実行ホスト:
  - GitHub Actions
- collector ロジック:
  - `worker/` 配下の既存ロジックを流用
- 静的サイト公開:
  - GitHub に反映された JSON を Astro build が読む

### 役割分担

- `worker/`
  - pricing 取得
  - normalize
  - validate
  - diff 判定
  - current/history 更新ロジック
- GitHub Actions
  - スケジュール起動
  - repo checkout
  - collector 実行
  - 変更 commit / push
  - 失敗時の job failure
- GitHub repository
  - データの正本
  - append-only history の保管場所

### 採用理由

- 現在の file-based store と repo 構成をそのまま活かしやすい
- append-only history を Git commit 単位で安全に扱いやすい
- 壊れた更新を main に反映しない設計にしやすい
- source policy が `caution` の provider を含む段階では、
  強い自動化よりも「失敗時に止まりやすい」構成の方が適切

### v1 の起動方法

最初の v1 実装では、GitHub Actions の **`workflow_dispatch` による手動実行のみ**を有効にします。

- schedule はまだ有効化しない
- まず manual run で挙動を確認する
- manual run が安定してから schedule を検討する

### 現時点の確認済み挙動

manual run により、以下は確認済みです。

- collector job は GitHub Actions 上で成功する
- 差分がある run では `github-actions[bot]` により `data/` 更新 commit が作成される
- `data/current-pricing.json` と `data/pricing-history.json` は同じ workflow 経路で更新可能
- 差分がない run では `commit / push` job は skip される
- `recorded_at` だけの no-op current 更新は commit しないよう修正済み
- Node 20 deprecation warning は、workflow action version 更新により解消済み

### v1 の権限分離

最初の Actions 実装では、job を 2 つに分けます。

- collect job
  - `contents: read`
  - collector 実行
  - `data/` 差分確認
  - 更新済み JSON を artifact 化
- commit / push job
  - `contents: write`
  - artifact を受け取る
  - `main` への commit / push のみ実行する

この分離により、collector 実行中に write 権限を持たせない構成にします。

---

## 不採用案と理由

### Cloudflare Worker 直接更新を v1 で採らない理由

- GitHub API 更新と secrets 管理の複雑さが増える
- 既存 file-based 実装との乖離が大きい
- v1 の目的は「小さく、壊れにくく、説明しやすい」ことであり、
  Worker 本番化を急ぐメリットが小さい

### 外部ジョブを v1 で採らない理由

- 実行基盤が増えて構成説明が複雑になる
- GitHub Actions で十分な範囲に対して infra を足しすぎる

---

## 更新フローの手順

v1 の更新フローは以下を想定します。

1. GitHub Actions が `workflow_dispatch` で起動する
2. runner が repository を checkout する
3. collector 実行前に、対象 provider の source policy が許容範囲かを確認する
   - `docs/provider-source-policy.md`
   - `caution` の provider は低頻度運用前提
4. collector が各 provider の source から pricing を取得する
5. provider ごとに normalize する
6. provider ごとに validation を行う
7. validation を通過した record だけを in-memory で次状態へ反映する
8. 既存 `current-pricing.json` と比較し、価格変更 record を抽出する
9. 全 provider の処理が終わった後に、workspace 上で以下を更新する
   - `data/current-pricing.json`
   - `data/pricing-history.json`
10. 差分がある場合のみ commit を作る
11. `main` へ push する
12. GitHub 上の更新を起点に Astro build / deploy が走る

補足:

- 差分なしの場合、`commit / push` job は実行しない
- `recorded_at` だけが変わる no-op 更新では commit を作らない

### 重要な更新単位

v1 では、**Git commit を整合性の最小単位**として扱います。

つまり:

- workspace 内で `current` と `history` の両方を書き換えても
- commit / push に失敗すれば GitHub 上の正本は変わらない

これにより、公開系の正本整合性は守りやすくなります。

---

## 失敗時の扱い

### 0 件取得時

- provider 単位で **hard fail**
- その provider は parser break / source break の可能性が高い
- 静かに 0 件として扱わない

v1 方針:

- 0 件取得 provider が 1 つでもあれば job は failure にする
- GitHub への反映は行わない

理由:

- source policy 上、parser break は安全側に倒すべき
- 壊れた snapshot を正本へ反映しないため

### 一部 provider 失敗時

候補は 2 つあります。

- 成功 provider だけ反映する
- その回は全体を反映しない

v1 では後者を採用します。

- **1 provider でも取得 / parse / validate に失敗したら、その run 全体を失敗扱いにする**
- その回は `current/history` を更新しない

理由:

- v1 では可用性より説明しやすさと安全性を優先する
- `caution` source を含む段階で partial success を許すと運用判断が複雑になる

### parser break 時

- hard fail
- GitHub 反映しない
- job を失敗として可視化する

前提:

- parser fixture / unit test
- 実行時 0 件 hard fail

で「静かに壊れない」ことを優先する

### validation failure 時

- hard fail
- GitHub 反映しない

理由:

- 保存前 validation は正本保護の最後の関門だから

### current 更新と history 更新の整合性

v1 では以下を原則とします。

- `current` と `history` は同じ run の中でまとめて生成する
- どちらか一方だけを GitHub に反映しない
- commit は両方を含んだ状態で作る

つまり、整合性の保証点は以下です。

- runner workspace 内の 1 回の更新
- GitHub 上では 1 回の commit

### GitHub 反映失敗時

- push 失敗時は run failure
- main 上の正本は未更新のまま
- 次回 run または manual rerun で再試行する

GitHub 更新にはまず `GITHUB_TOKEN` を使い、
権限は更新 job に必要な最小限、具体的には `contents: write` に留めます。

補足:

- runner workspace に途中書き込みが残っても、正本は GitHub なので破壊的ではない

---

## 自動運用へ移る前提条件

以下が揃ったら、v1 を unattended に近い運用と見なせます。

### 必須

- OpenAI / Anthropic の source review が最新である
- `docs/provider-source-policy.md` が更新されている
- parser unit test が通る
- collector の dry-run または smoke run が通る
- GitHub Actions で manual run が成功する
- 差分なし / 差分あり / 失敗時の挙動が確認できている
- commit 権限と branch 保護ルールが整理されている

### まだ手動確認前提のもの

- provider terms / policy の最終確認
- schedule の初期頻度決定
- 初回数回の run 監視
- parser break 時の運用フロー確認

### v1 で想定する運用レベル

- low frequency
- conservative failure policy
- provider は少数
- source review 前提
- 失敗時は止める

完全自律よりも、
**安全に止まり、履歴を壊さない unattended に近い運用** を目指します。

---

## 今後の実装タスク候補

1. collector を GitHub Actions から呼べる実行入口を明確化する
   - 例: `worker` 側に CLI entrypoint を追加
2. GitHub Actions workflow を追加する
   - manual dispatch
   - schedule
3. 差分がない場合は commit しないフローを追加する
4. failure / success のログ出力方針を決める
5. provider ごとの source review 状態を code / docs のどちらで持つか整理する
6. 初回 unattended 運用前に OpenAI / Anthropic の terms / policy を再確認する
7. partial failure を将来許容するかは v2 以降で再検討する

---

## v1 の結論

collector 本番更新フロー v1 では、

- **GitHub repository を正本**
- **GitHub Actions runner を実行ホスト**
- **collector は fail closed 寄り**
- **1 provider でも失敗したらその run 全体を反映しない**

を採用します。

この構成は、

- append-only history を壊しにくい
- source policy と矛盾しにくい
- 現在の repo / file-based 実装と整合しやすい
- 今後の実装タスクへ素直につながる

という点で、v1 として最も現実的です。
