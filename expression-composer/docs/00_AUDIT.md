# 00 / READ & AUDIT

2026-10-26。ORDER 01 を正本への追加制約として適用。マスタープラン全文を確認。

- 開始時の expression-composer は仕様書、画像、アーカイブ、_codex、ショートカットのみ。制作ソースは新規。
- git コマンドは禁止のため、branch / HEAD / tracked / untracked の確認は未実施。既存資産の変更を行わない。
- README、CLAUDE、HANDOFF_top-index、L1/L7、Gen-EX、scroll-experience の README・制作/仕上げ資料・AGENTS・scroll-engine・06-edit、認識エンジン仕様と近接/共通運命/サイズ/余白/間、Emergence Engine の概念・index・04_flock、Mindmap のデザイントークンを参照。scroll-experience の AGENTS は同フォルダ専用で、本作の編集範囲を広げない。
- 既存トップはバンドル形式。README の作品一覧に scroll-experience / Emergence Engine がなく、L7 は未着手表記。更新文案だけを 04_NEXT_ROADMAP に残す。
- 12原則は別リポジトリ。Hub の相対参照と公開導線の全件確認は今回未完了。公開サイトへの変更なし。
- .gitignore は scroll-experience/verification を除外するが、本作の verification は除外しない。公開前に画像の容量を Claude が判断する。
- Mindmap/styles.css の JetBrains Mono / IBM Plex Sans JP は local() 参照。フォント実体はあるが同フォルダで配布ライセンス文書を確認できないためコピーしない。Bank Gothic / Square 721 も使用しない。システムフォールバックで外部通信をなくす。
- Canvas 2D + ES modules。依存パッケージ、ビルド、CDN、画像アセット不要。PRNG・固定時間・同時更新・不変スナップショット・共通描画を分離する。
- 既存の 04_flock は空間バケット、トーラス、Reynolds steering、270度視野、角度ノイズ、同期更新。本作はこの原理から小さく独立実装する。モデル差は 01_MODEL_NOTES。
- 本環境の PATH に python はない。Node と既存の検証用 Playwright / Chrome を確認。検証サーバーは本作 verification 内に設置し、静的 HTTP と同じ条件で検査する。
- 既存サイトは読み取りのみ。ブラウザで確認した範囲と未検証は最終 QA に記録する。

保護対象：expression-composer の仕様書 / images / _Archive / _codex（REPORT_01.md 以外）/ .lnk、および本作以外の全ファイル。PHASE 4 は未着手。
