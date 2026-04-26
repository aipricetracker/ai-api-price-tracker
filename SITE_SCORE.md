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
- Home の確定文法は以下を基準にする。
  - sticky header の直下に、紙面の題字として Hero を置く
  - Hero 内には brief lead と、`Discover / Compare / Monitor / Archive` のような小さな情報帯を含める
  - Hero の下は Recent Changes を最初の実データとして見せる
  - Providers は比較の入口として、列見出しを持つ静かな一覧にする
  - About は長文説明ではなく、短い lead と 3 つ程度の summary block で補足する
- Home では「見出し」「データ行」「導線」「補足」を同じ強さにしない。Hero と recent changes を主役にし、Providers と About は入口と補助に留める。

### Changes

- Changes は速報面、または更新台帳の一覧面である。
- サイト内で最も event-driven に見えるページにする。
- 主役は change event の連なりであり、各 event が「何がどう変わったか」をすぐ読めることを重視する。
- このページでは prose を増やしすぎず、summary と diff の反復でテンポを作る。
- Home より密度を上げてよいが、同じカード反復に見えて単調にならないよう、見出し・日付・差分の階層を明確に分ける。
- page の導入は、header 内 title ではなく本文先頭の page intro で行う。`h1 + short lead` を置き、その下に section heading と event list を続ける。
- event row は Home の Recent Changes と同じ grammar を使い、Changes では件数増加に耐えるよう card ではなく行反復として扱う。

### Providers

- Providers は比較面である。
- 主役は provider ごとの現在の監視対象規模と更新活発度であり、サイト全体の地図として機能する。
- 比較軸は曖昧にせず、読み手が provider 間で並べて見られることを重視する。監視対象数、更新活発度、最新更新のような軸が自然に読める構図が望ましい。
- このページは Changes より静かでよい。イベントよりも一覧性を優先する。
- 役割は「どこを見るべきか」を選ばせることなので、過剰な演出より整然さが重要である。
- Home 上の Providers preview でも、provider ごとの label を反復しすぎない。列見出しを 1 回置き、各行は provider 名と比較値に集中させる。
- Providers 本体も、header 内 title ではなく page intro から始める。導入は短く、その下に section heading と比較行を続ける。
- row 内の導線は button にせず、赤文字 + 小さな矢印 icon の text link で静かに次の階層へ渡す。

### Model History

- Model History は記録面であり、個別 model の差分文脈を読む場所である。
- サイト内で最も詳細度が高く、もっとも archive 的に見えるページにする。
- current snapshot の要約は必要だが、主役は history の連なりである。
- ここでは event の前後関係、差分、effective date / recorded_at の関係が静かに読めることが重要で、Home のような導入性は不要である。
- 読み順としては、まず現在値を確認し、その後に履歴をたどり、最後に caveat や補足を読む流れが自然である。
- page は `PageIntro -> Current Snapshot summary -> Pricing History rows` の順で構成する。current summary は導入であり、history rows が主役である。
- initial record には通常の before/after 記法をそのまま当てない。前値がないことを素直に見せ、不要な記号は足さない。

## Intensity & Emphasis

- サイト内の強弱は以下を基準に設計する。
  - 最も強い: Home の題字と recent changes 導入
  - 次に強い: Changes の event heading と diff
  - 中程度: Provider 一覧の比較軸
  - 静かに支える: metadata、注記、説明文、footer
- 強く見せる対象は毎ページ 1 つに絞る。同じページ内で複数の主役を作らない。
- 高級感は大きな余白と太い見出しで出し、装飾量では出さない。
- accent は「読んでほしい節目」にだけ打つ。常時点灯させない。
- Footer は全ページで最も静かな共通要素にする。logo / subpage links / copyright は中央で閉じ、罫線は紙面の終端を示すために使う。
- CTA は強くしすぎない。独立導線は button として明確にするが、marketing CTA のような大きさや丸みには寄せない。

## Rhythm of List and Detail

- 一覧ページは「走査する」ためのテンポを持たせる。
  - 短い summary
  - 規則的な区切り
  - 比較しやすい列構造
  - 次ページへ渡す素直な導線
- Home の Recent Changes は、Changes ページの簡易版ではなく「最新の実データへの入口」である。1件でも複数件でも、recorded date / item title / summary / diff が同じリズムで読めることを優先する。
- page 内の独立導線は、テキストリンクとして浮かせず、再利用可能な button grammar に乗せる。
- ただし、一覧 row の内部導線は別扱いにする。比較の走査を壊さないよう、row 内では text link grammar を使う。
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
- section heading は共通 component として扱う。見出し直上の罫線、title、lead の位置関係を揃え、ページごとの差は密度と後続ブロックで出す。
- page intro も共通 component として扱う。下層ページでは、header から独立した本文先頭の導入として再利用する。
- 補足説明を置く場合は、長い 2 カラム prose よりも、短い lead と summary block の方が Home には合う。下層ページでは必要に応じて caveat / note に変奏する。

## Navigation Temperature

- navigation は機能として明確、見た目としては控えめにする。
- 常時ユーザーを誘導するサイトではなく、読み手が自分で掘るサイトとして扱う。
- そのため nav は大きな CTA 群にせず、紙面の目次に近い温度で設計する。
- current page の表示は必要だが、強すぎるハイライトは不要である。
- パンくずや戻り導線を入れる場合も、管理画面風ではなく編集面の案内として見せる。
- 回遊導線は控えめでよいが、途切れさせない。一覧から詳細へ、詳細から比較や変更一覧へ静かに戻れることを優先する。
- Header は常時の目次、Footer は読み終わり後の目次として扱う。Header は左 logo / 右 nav、Footer は中央 logo / links / copyright で役割を分ける。
- Header / Footer の罫線は共通フレームとして効く。header 下部と footer 上部は viewport 全幅に貫く線で、ページ本文の content-width 線とは区別する。

## Repetition and Variation

- このサイトの信頼感は、反復から生まれる。
- 反復させるべきもの:
  - 見出しの階層感
  - line / divider の使い方
  - metadata の温度
  - price / diff / date の表示規則
  - section の切り方
  - button link の形と hover/focus の反応
  - footer の閉じ方
- 変奏させるべきもの:
  - 各ページの主役の大きさ
  - 一覧の密度
  - lead 文の長さ
  - summary と detail の比率
  - hero 的導入の有無
  - summary block の有無と密度
- 反復は統一感のため、変奏はページごとの役割差のために使う。どちらか一方に寄せすぎない。

## Shared Grammar vs Page-Specific Moves

- 全ページで揃える部分:
  - archive / record media としての低温なトーン
  - typography 主導の hierarchy
  - muted paper + ink + restrained accent の色役割
  - 区切り線と余白による節分け
  - データを先に見せ、説明は後ろに置く姿勢
- common header / footer
- section heading component
- page intro component
- button link component
- text link component
- ページごとに変える部分:
  - Home は題字と導入の強さを持たせる
  - Changes は event の連打で rhythm を作る
  - Providers は table の整然さを主役にする
  - Model History は時系列の静かな読書体験を主役にする
- 参考カンプは主に Home の空気感を合わせるために使うが、Changes / Providers / Model History まで同じ表紙レイアウトを持ち込まない。

## Current Implementation Gap

- 現状の `site/` は必要情報は揃っているが、ページ群を横断する「紙面文法」がまだ薄い。
- Home は、Hero / Recent Changes / Providers / About / Footer の基本文法が概ね収束した。
- `Changes` は、page intro と event row grammar の first pass が入った。次は密度、複数件表示時のテンポ、diff の強弱を詰める段階である。
- `Providers` は、page intro と列見出し + provider row の比較文法が本体ページへ展開された。次は provider detail へ同じ低温な比較文法を移す段階である。
- `Providers detail` は、page intro、current snapshot の比較行、短い caveat、history 導線の文法が概ね収束した。
- `Model History` は、page intro、current summary、history row の first pass が入った。現行データでは複数の visible history が薄いため、今後は実データ増加後に history 反復の密度を再評価する余地がある。
- 今後の実装では、新機能を足すより先に、Home で確定した共通文法を下層ページへ段階的に移すことを優先する。
- 主要ページの first pass は一通り揃ったため、以後は実データ増加に応じた密度調整や、必要な補助導線の refinement を個別に進める段階である。
