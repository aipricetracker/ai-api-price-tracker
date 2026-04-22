# SITE_SCORE.md

## Site Role

- このサイトは「AI API の pricing を記録し、差分を追い、あとから参照できる公開アーカイブ」として見せる。
- 主役はブランドでもプロダクト訴求でもなく、更新記録そのものである。
- サイト全体は以下の 3 つの行為を支える構成にする。
  - いま何が変わったかを見る
  - provider ごとの現在地を比べる
  - 個別 model の変遷をたどる
- そのため、サイト全体の温度は低めに保つ。案内はするが、煽らない。説明はするが、語りすぎない。
- Home と Providers は、情報そのものを見せるだけでなく、「どこから見始めるべきか」の入口を与える面としても機能させる。
- `docs/design-references/home-reference-01.png` は、この温度感と紙面方向を確認するための補助資料として扱う。
- ただし site 全体の score は reference image に従属しない。各ページの役割差、既存データ構造、閲覧体験を優先して再構成する。

## Page Families

### Home

- Home は表紙であり、最初の要約面である。
- 役割は「このサイトは何を追う媒体か」を一目で伝えたうえで、「直近で何が変わったか」へ最短で入れること。
- Home で最も強く見せるべきもの:
  - site identity
  - recent changes の存在
  - providers / history への入口
- Home は情報を全部載せる場所ではない。全体の読み筋を作る場所と考える。
- Hero は marketing の宣伝欄ではなく、紙面の題字 + brief lead に近い扱いにする。

### Changes

- Changes は速報面、または更新台帳の一覧面である。
- サイト内で最も event-driven に見えるページにする。
- 主役は change event の連なりであり、各 event が「何がどう変わったか」をすぐ読めることを重視する。
- このページでは prose を増やしすぎず、summary と diff の反復でテンポを作る。
- Home より密度を上げてよいが、同じカード反復に見えて単調にならないよう、見出し・日付・差分の階層を明確に分ける。

### Providers

- Providers は比較面である。
- 主役は provider ごとの現在の監視対象規模と更新活発度であり、サイト全体の地図として機能する。
- 比較軸は曖昧にせず、読み手が provider 間で並べて見られることを重視する。監視対象数、更新活発度、最新更新のような軸が自然に読める構図が望ましい。
- このページは Changes より静かでよい。イベントよりも一覧性を優先する。
- 役割は「どこを見るべきか」を選ばせることなので、過剰な演出より整然さが重要である。

### Model History

- Model History は記録面であり、個別 model の差分文脈を読む場所である。
- サイト内で最も詳細度が高く、もっとも archive 的に見えるページにする。
- current snapshot の要約は必要だが、主役は history の連なりである。
- ここでは event の前後関係、差分、effective date / recorded_at の関係が静かに読めることが重要で、Home のような導入性は不要である。
- 読み順としては、まず現在値を確認し、その後に履歴をたどり、最後に caveat や補足を読む流れが自然である。

## Intensity & Emphasis

- サイト内の強弱は以下を基準に設計する。
  - 最も強い: Home の題字と recent changes 導入
  - 次に強い: Changes の event heading と diff
  - 中程度: Provider 一覧の比較軸
  - 静かに支える: metadata、注記、説明文、footer
- 強く見せる対象は毎ページ 1 つに絞る。同じページ内で複数の主役を作らない。
- 高級感は大きな余白と太い見出しで出し、装飾量では出さない。
- accent は「読んでほしい節目」にだけ打つ。常時点灯させない。

## Rhythm of List and Detail

- 一覧ページは「走査する」ためのテンポを持たせる。
  - 短い summary
  - 規則的な区切り
  - 比較しやすい列構造
  - 次ページへ渡す素直な導線
- 詳細ページは「たどる」ためのテンポを持たせる。
  - 現在値の要約
  - 変更履歴の時系列
  - before / after / rate の反復
  - caveat の静かな挿入
- 一覧から詳細へ行くほど、見出しの派手さはやや下げ、履歴の読みやすさを上げる。
- 同じ情報でも一覧ではラベル化して短く、詳細では文脈つきで読ませる。

## Tables, Prose, and Headings

- このサイトの主文法は `heading + lead + table/list + note` で構成する。
- table は単なる付属物ではなく、本文に近い主要読書面として扱う。
- prose は説明しすぎず、読み方を整えるために置く。
- headings は節ごとの温度差を作るために使う。
  - page title: 面のタイトル
  - section title: 節の焦点
  - row / item title: 個別データへの入口
- prose は table の前後で役割を変える。
  - 前: 何を見る面かを短く示す
  - 後: caveat や補足に限定する

## Navigation Temperature

- navigation は機能として明確、見た目としては控えめにする。
- 常時ユーザーを誘導するサイトではなく、読み手が自分で掘るサイトとして扱う。
- そのため nav は大きな CTA 群にせず、紙面の目次に近い温度で設計する。
- current page の表示は必要だが、強すぎるハイライトは不要である。
- パンくずや戻り導線を入れる場合も、管理画面風ではなく編集面の案内として見せる。
- 回遊導線は控えめでよいが、途切れさせない。一覧から詳細へ、詳細から比較や変更一覧へ静かに戻れることを優先する。

## Repetition and Variation

- このサイトの信頼感は、反復から生まれる。
- 反復させるべきもの:
  - 見出しの階層感
  - line / divider の使い方
  - metadata の温度
  - price / diff / date の表示規則
  - section の切り方
- 変奏させるべきもの:
  - 各ページの主役の大きさ
  - 一覧の密度
  - lead 文の長さ
  - summary と detail の比率
  - hero 的導入の有無
- 反復は統一感のため、変奏はページごとの役割差のために使う。どちらか一方に寄せすぎない。

## Shared Grammar vs Page-Specific Moves

- 全ページで揃える部分:
  - archive / record media としての低温なトーン
  - typography 主導の hierarchy
  - muted paper + ink + restrained accent の色役割
  - 区切り線と余白による節分け
  - データを先に見せ、説明は後ろに置く姿勢
- ページごとに変える部分:
  - Home は題字と導入の強さを持たせる
  - Changes は event の連打で rhythm を作る
  - Providers は table の整然さを主役にする
  - Model History は時系列の静かな読書体験を主役にする
- 参考カンプは主に Home の空気感を合わせるために使うが、Changes / Providers / Model History まで同じ表紙レイアウトを持ち込まない。

## Current Implementation Gap

- 現状の `site/` は必要情報は揃っているが、ページ群を横断する「紙面文法」がまだ薄い。
- `Recent Changes` と `Changes` は類似 UI の重複があり、同じ反復が続いて見えやすい。
- `Providers` は情報整理としては成立しているが、比較面としての格がまだ弱い。
- `Model History` は詳細情報を読めるが、archive 面としての静かな重心と履歴のテンポがまだ十分に整理されていない。
- 今後の実装では、新機能を足すより先に、各ページの主役と静かな補助線を明確にすることを優先する。
- 収束順としては、まず Home と全ページ共通文法を整え、その後に Changes / Providers の一覧面を揃え、最後に Model History の詳細面を詰めるのが自然である。
