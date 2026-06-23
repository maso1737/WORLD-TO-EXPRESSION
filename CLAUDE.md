# CLAUDE.md — WORLD TO EXPRESSION

このフォルダで作業する Claude Code 向けのコンテキスト。

## これは何か
- **Obsidian vault 兼 Claude Code 作業フォルダ**。「Gen-EX Realtime Expression Lab」という階層的知覚・表現教材プロジェクトの知識ベース（第2の脳）。
- 入口は [00_Hub/Gen-EX.md](00_Hub/Gen-EX.md)（MOC）。まずここを読むと全体像が掴める。

## 3ツールの役割分担
- **NotebookLM**＝調査・制作部。リサーチ/要約/図解を担当 → 成果物は `10_Research/` に保存（トークン節約のため重い調査は外部化）。
- **Obsidian**＝記憶・知識ベース。この vault 自体。`[[wikilink]]` でノート同士を繋ぐ。
- **Claude Code**＝司令塔。vaultを読み、md編集・HTML実装・git運用・判断を担当。

## フォルダ構成
```
00_Hub/         入口ノート(MOC)。ここから全体を辿る
10_Research/    NotebookLM等の調査・要約の置き場（① DeepResearch）
20_Design/      設計ドキュメント（② 設計コンパニオン＝本体）
30_Levels/      7階層ごとの知識ノート L1〜L7
40_Primitives/  Perception Primitive P-01〜P-30 の個票（_TEMPLATE.md あり）
90_Log/         日付ごとの作業ログ／申し送り
cognitive/                    完成HTML（Level 4 GESTALT）※git管理なし
12-Principles-of-Animation/   完成HTML（Level 6）※独自gitリポジトリ
```

## 編集ルール
- ノート同士のリンクは Obsidian の `[[ノート名]]`（wikilink）を使う。HTML成果物へは相対パスのmdリンク `[表示名](cognitive/xxx.html)`。
- 新しい知識・気づきは「散らさない」: 該当する `30_Levels/Lx` か `40_Primitives/Pxx` に追記し、作業の流れは `90_Log/YYYY-MM-DD.md` に書く。
- ファイル名・日本語・全角①②はそのまま使ってよい（Obsidianは basename で解決する）。

## git について
- **vault直下は現状 git 未init**（GitHub `maso1737/WORLD-TO-EXPRESSION` とは未連携）。連携するかは未定（[90_Log/2026-06-23.md](90_Log/2026-06-23.md) のTODO参照）。
- `12-Principles-of-Animation/` は**独自リポジトリ**。そのフォルダ内の運用ルールは [12-Principles-of-Animation/CLAUDE.md](12-Principles-of-Animation/CLAUDE.md) を参照（こちらが優先）。
- もし vault直下を git化する場合、`.obsidian/`（個人設定）をコミットするかは要相談。

## NotebookLM CLI
- 以前アクセスOKだったが、`notebooklm`/`nlm`/`notebook-lm` では現在見つからない。呼び出し方法をユーザーに確認してから再接続すること。
