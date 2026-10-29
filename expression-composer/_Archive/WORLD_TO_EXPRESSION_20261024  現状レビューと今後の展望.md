Claude CodeとCodexの役割分担

Claude Code：司令塔

既存リポジトリの解析

芸術的コンセプトの立案

作品候補の比較と選定

技術アーキテクチャ

段階的な仕様設計

Codexへのタスク分解と発注

実装結果のレビュー

芸術的品質・体験品質の最終評価

次の改善方針の決定

Codex：制作エンジニア

MCPを介して、独立した明確な作業単位ごとに実装を担当。

コード調査

実装

シェーダー制作

音響処理

UI制作

パフォーマンス改善

ブラウザテスト

比較画像・動画・ログの出力

不具合修正

MCPの利用可能なツールと権限を最初に確認してください。

存在しないツール名や呼び出し形式を仮定せず、実際の接続環境に従ってください。

Codexへの指示は毎回、

目的と芸術的意図

対象ファイル

実装範囲

保持すべき既存機能

技術的な制約

検証項目と合格条件

提出成果物

を明記してください。

Codexの「実装完了」報告だけで承認せず、Claude Code自身が結果をレビューしてください。

ブラウザ操作・聴感・GPU性能の検証をしていない場合は未検証と明記すること。

複数の試作を際限なく並列制作せず、発見と品質の高い候補に集中してください。

-------------


# WORLD TO EXPRESSION — 現状レビューと今後の展望

2026.10.25 ｜ Creative Direction Review

対象：[GitHub リポジトリ](https://github.com/maso1737/WORLD-TO-EXPRESSION?utm_source=chatgpt.com) ／ [公開サイト](https://maso1737.github.io/WORLD-TO-EXPRESSION/?utm_source=chatgpt.com)

まず、以前一緒に考えていた構想から、かなり重要な進化をしています。

当初のテーマは、

「世界の仕組みを、触れば理解できるようにする」

でした。

現在はそこからさらに、

「世界を生み出すルールを発見し、そのルールを使って自分で表現する」

という方向まで育っています。

これは単なる教材数の増加ではありません。作品の目的そのものが、理解から創造へ広がっています。

実際、今回のリポジトリには、7階層の知識体系、数理・知覚のインタラクティブ教材、Emergence Engine、そして新しいスクロール作品「FROM RULES TO WORLDS」が共存しています。

[image](https://www.google.com/s2/favicons?domain=https://github.com\&sz=32)

GitHub



私が特に評価しているのは、完成した絵を見せるのではなく、絵が成立する条件そのものを体験させるという思想が、実際のプログラムや作品群に落とし込まれてきた点です。

一方で、ここまで充実したからこそ、次の課題は「さらに種類を増やすこと」ではなく、それぞれの実験が、どうやってひとつの表現へ収束するかだと考えます。

## 1. 現在地：ひとつのプロジェクトに、3つの強みが生まれた

[Universal trend halftone geometric shapes set](https://images.openai.com/static-rsc-4/toicVqLLm22GNkQbOzhUX87_1EuC2p7thlvgAnGkm6rWAdrrjW72_9dcJlfsI-xPws59txejWakh6-jO76mhAnzdlhg9vUQA6ey-fy4CK4IIWx9WQGQm-c9OnVISd6D0g-bPxsMlWkCDZE7Pz6DUsefYUhYdqz4vLNAtbUwc7Egoa61VBnQovRtbmYDOaBYO?purpose=inline)

01 — SCROLL EXPERIENCE

鑑賞する作品

[FROM RULES TO WORLDS](https://github.com/maso1737/WORLD-TO-EXPRESSION/tree/master/scroll-experience?utm_source=chatgpt.com)

点の誕生から生成・群化・解釈・編集までを7幕で描く。スクロールを編集のプレイヘッドにした、全体の思想を体感させる入口。

[Fantastic, it's for real: songs about illusion — Song Bar](https://images.openai.com/static-rsc-4/46j3WqXDlSAZvECcS6JTInG4Ae_4g8taFA3zaKmD0L81Wfooonj91x33IVODbk_Z4lVjUo1_OKy7WvQXv-nGTwoTKhA3FcY8LRzj1XtHA9-XpwLQnHau1TSM7dlpzwAJnhhxNwa6xQupimgEVSBkJndGiQk51a7l9F6aBgQ_n1U?purpose=inline)

02 — COGNITIVE / NATURAL PATTERNS

理解する実験室

[認識エンジン](https://github.com/maso1737/WORLD-TO-EXPRESSION/tree/master/cognitive?utm_source=chatgpt.com) ／ [自然パターン](https://github.com/maso1737/WORLD-TO-EXPRESSION/tree/master/natural-patterns?utm_source=chatgpt.com)

ゲシュタルト、錯視、余白、黄金比、反応拡散など。実際にパラメータを動かし、何が変化を引き起こすのかを検証する教材群。

[Metaverse for Creative People - Vagon](https://images.openai.com/static-rsc-4/U0t5RRww3BNTm6TRP7IhwPgiEE8Q3z8VNPi_4AtFcydP8oZGWPPXi6F2BJu5zyD0pi5vhJFQKHVr-8NHD2C-Rw8MDUm7urL_1kJ0feRFTfgUQtQcc67at520nFH_R0kX_NPws_OWMBp1qG6qrXKDu99b0NNkq3Ny9iWgRufBKPA?purpose=inline)

03 — EMERGENCE ENGINE

生成そのものを体験する場

[Emergence Engine](https://github.com/maso1737/WORLD-TO-EXPRESSION/tree/master/Emergence%20Engine?utm_source=chatgpt.com)

Bifurcation Walk、Highway、Slime Network、Flockの4作品。局所ルールから秩序が生まれ、崩壊し、再構成する過程が主役。

画像は方向性を説明する参考イメージで、リポジトリの実際のスクリーンショットではありません。

この3つの役割を分けた判断は、今後かなり効いてくると思います。

## 2. 特に評価している制作上の進化

### A. 現象の「本物らしさ」ではなく、実際の生成法則を扱っている

SCROLL EXPERIENCEの制作記録を見ると、反応拡散はGray–Scottモデルから生成した96状態を使用し、分岐図も560列それぞれに120サンプルを保持しています。

単に数理っぽい絵を描くのではなく、数学的な意味を保ちながらグラフィック演出に変換する方針です。

さらに、GROUPでは同じ96マークを点から線分、円弧へ対応付けています。別の映像素材に差し替えているのではなく、同じ要素が役割と意味を変えていく。

これは映像演出としても重要な達成です。[実装・検証記録](https://github.com/maso1737/WORLD-TO-EXPRESSION/blob/master/scroll-experience/MOTION_NOTES.md?utm_source=chatgpt.com)

### B. EMERGENCE ENGINEの演出思想が独特

Highwayでは混沌の中から道が現れ、Flockでは3つの基本ルールを無効化すると群れの性質が壊れる。さらに秩序の変化を数値とグラフでも示しています。

特に「ルールを1つ消すと何が壊れるか」は、強力な教育・演出手法です。

現象が成立している状態を見せるだけではなく、壊すことで成立条件を発見させる。

これは、従来のCGソフトのパラメータ操作とは異なる学習体験です。

### C. 制作検証が体系化されている

最新の仕上げ記録には、headless Chromeでの対象88項目・回帰91項目の合格、画面サイズ別の比較、数理検証、reduced-motionへの対応が記録されています。

ただし、これは記録上の結果です。今回、私自身は公開ページをブラウザで実際に操作・描画確認できていません。実機でのスクロール感、錯視の知覚、iPad・Safariでの品質は別途評価が必要です。

## 3. ここからの最大の課題

私は L7 — EXPRESSIONが未完成であること に、最大の可能性を感じています。

現状のスクロール作品は、最終的に完成ポスターへ到達します。しかしコード上は、作者が設計した構図を鑑賞し、PNGとして保存する仕組みです。

これ自体は作品として正しい。ただ、プロジェクト全体の「理解から創造へ」という目標から見ると、最後の一歩が残っています。

NEXT CONCEPT

## FROM SEEING TO MAKING.

発見した法則を、観客自身が使って表現する。

### 提案：EXPRESSION COMPOSER

例えば「群れ」を素材にして一枚のグラフィックを作る実験です。

最初はBoidsの群れが動いている。そこで観客がALIGN（整列）の強さを変えると、群れの形が変わる。

次に、FOCUSの原理を使って一部の粒子だけを主役にする。

さらにEDITで粒子の90%を消す。

残された粒子は、もはや群れのシミュレーションではなく、意図的な構図になります。

最後に文字や余白を選んで、一枚のポスターへ変換する。

重要なのは、多機能なデザインソフトを作ることではありません。

自然に発生した形が、人間の判断によって「作品」になる境界を体験すること。

これなら、7階層の最後に相応しい内容になります。

## 4. さらに先に見えている、新しい方向

### 「原理の組み合わせ」を作品にする

現在は各実験が独立しています。しかし、最終的には原理同士の掛け合わせに可能性があります。

例えば、

GESTALT

ANIMATION

EDIT

「存在しない生き物を感じさせる」

少数の点が共通運命で動く → 輪郭を知覚する → 必要な情報だけ残す → キャラクター性が成立する

これは単なるエフェクトの組み合わせではありません。

「どの原理が、何を感じさせるのか」という因果を使って、新しい作品を発明する仕組みです。

将来的には、原理を部品として組み合わせる Grammar Composer（表現文法の作曲装置） という考え方も成立します。

ただし、これは長期的な構想で十分です。先にひとつだけ完成度の高い作例を作るほうが良いでしょう。

### 各リポジトリの役割も明確にしたい

以前考えていた別プロジェクトとの対比も、ここで活きます。

| プロジェクト                         | 固有の役割                       |
| ------------------------------ | --------------------------- |
| WORLD TO EXPRESSION            | なぜ成立するのか。世界と知覚の文法           |
| 12 PRINCIPLES                  | なぜ生きて見えるのか。動きの文法            |
| Gen-EX Realtime Expression Lab | その法則が音・リアルタイム操作・空間でどう体験になるか |
| ANIxOBNxCOM                    | その表現をどう物語・演技・編集に変換するか       |

このように考えると、別々の作品群が互いの価値を高め合います。

あえて統合アプリにせず、それぞれの美術性と操作思想を残したほうがよいと思います。

## 5. 現実的な次の優先順位

ここは少し厳密に考えたいです。現状は作品群が増えているぶん、情報設計にも改善余地があります。

GitHub上では、ルートの`index.html`が約8.5MBあり、`notebooklm-py-main/`がリポジトリ内のファイル・ディレクトリエントリの大部分を占めています。またREADMEは、追加されたEmergence Engineや特設LPを十分に案内できていません。

実際のページ転送量とは別ですが、今後の保守・公開構造は整理する価値があります。フォントの公開配布ライセンスも確認しておきたいところです。

私なら次の3段階で進めます。

1\. Phase 1｜体験と入口の完成度を上げる。 既存作品は大きく改変せず、実機のスクロール・表示・操作を確認。トップページを「見る／触る／作る」の導線として整理し、READMEと現在の公開状態を一致させる。

2\. Phase 2｜L7 EXPRESSIONの代表作を1本制作。 既存のBoids、ゲシュタルト、構図原理などを組み合わせ、法則からオリジナルの静止画を生み出す小さな実験室を完成させる。最初から総合編集ソフトにはしない。

3\. Phase 3｜横断的な表現文法へ発展。 各原理を「入力・規則・知覚効果・表現への応用」で記述し、実験から別の実験へ原理を持ち運べる仕組みを検討する。未着手のL1やプリミティブ辞書も、この段階で目的に応じて拡充する。

## 最後に：作品として目指すもの

Emergence Engineのコンセプト文書には、「形を作るのではなく、ルールを作る」という思想があります。

私はこれを、WORLD TO EXPRESSION全体ではさらに一段進められると考えています。

自然はルールから形を生む。

人間はその形から意味を見つける。

表現者は、見つけた意味をもう一度組み替える。

この3つの違いを、観客が自分で体感できる作品です。

それが成立すると、単に「数理の美しさが分かるWeb教材」でも「高品質なジェネラティブアート集」でもなくなります。

世界の見方を学び、世界の見え方を変え、最後には自分の表現を生み出せる場所。

その方向なら、今まで積み上げた教材、数理実験、認識研究、スクロール演出がひとつの明確な目的を持ちます。

そして次の大きな飛躍は、エフェクトをもう10種類作ることではなく、すでに存在する原理を使って、今までにないひとつの「表現」が生まれる瞬間を作ることだと思います。