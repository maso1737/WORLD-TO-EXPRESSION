03c 完了しました。

- `js/composition.js` の `LAYOUTS / framedGeometry / compositionGeometry / posterLayout` を修正。候補ごとの枠で独立評価し、実使用枠を `getState().layout.frame` に公開。
- `verify-posters.cjs / verify-browser.cjs / verify-v02.cjs` を更新。
- 全54枚で文字への点・点半径・速度線中点の衝突 **0**。
- CURRENT／SIGNALの群れ寸法は最小 **55.06%**。
- 黄色点非衝突、PNG再生成、FREEZE終端、旧JSON互換を確認。
- 18シートと一覧を再生成。`verify-all.cjs` は **全PASS、178 PASS／0 FAIL**。

[03c詳細・最も窮屈な例](</C:/Users/so173/Documents/Claude/Projects/WORLD TO EXPRESSION/expression-composer/docs/05_V03_REVIEW.md>) に記録しました。バックアップ保存済み、UTF-8／LF維持、gitコマンド不使用です。