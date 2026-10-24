# 2026-10-21 Motion Brushup

10月21日のMOTION_HANDOFF / REVIEW_BRUSHUPに対応。最終確認は10月22日未明（JST）。

- native scrollを保ち、全体位置の90ms追従、HOLD、resize、復元、reduced-motionを実装。
- Gray–Scott 96実状態、全560列×120サンプルの収束、GROUPの形態対応、EDITの短いエンブレム形成。
- ACT05はGPU/DPR別に計測。約347ms未再現のため、透視方式は維持。
- ブラウザの追加60項目＋既存91項目合格。基本140枚、修正回帰78枚、モーション104枚、詳細26枚。
- Node engine9条件、分岐図8条件、Gray–Scott全ビット再積分一致。実機の入力感は未検証。
- 完成ポスターは同一backendで変更前とバイト一致。旧GPU無効版PNGもハッシュ一致。
- 編集前保存: `backups/2026-10-21-motion-brushup/`。対象テキストはLF。既存トップ・教材、公開、commit/pushは変更なし。

詳細・合格条件・途中の失敗と解消は [MOTION_NOTES.md](../scroll-experience/MOTION_NOTES.md)。

成果物: [モーション改善版レビューZIP](../scroll-experience/verification/WORLD-TO-EXPRESSION-motion-review-20261021.zip)
