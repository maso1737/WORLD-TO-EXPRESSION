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
sound-patterns/               L1d 音響の教材 SP-01〜06（6 本完結・11-10）。入口 index.html（APP と SCROLL を横並び）・計画 PLAN_SOUND_PATTERNS.md・法則 _law/・解説 LP は scroll/（記録は scroll/CLAUDE.md と scroll/notes/）。見た目は NATURAL
Emergence Engine/             L2 創発の作品 EE-01〜09（入口 index.html・構想 PROJECT_CONCEPT.md・制作の会話 chat/）。解説 LP は scroll/（EE-01〜08・記録は scroll/CLAUDE.md と scroll/notes/）。見た目は NOIR
natural-patterns/             L2 の単発 HTML（黄金比・フィボナッチ・反応拡散・ボロノイ）
expression-composer/          L7 代表作（v0.3・入口 README.md）。🆕11-12 触りがいを上げる案（本体は触らず別ラボで試す）＝ ../Gen-EX_Realtime Expression Lab/EXPRESSION PHYSICS/SPEC_EP_EXPANSION.md §E2・未着手
scroll-experience/            特設LP「From rules to worlds.」（2026-10-24 Codex から引継ぎ・申し送り HANDOFF_20261024.md・制作ルール AGENTS.md）
cognitive/                    完成HTML（Level 4 GESTALT）※git管理なし
（12原則 Level 6 の本体はルート直下 ../12-Principles-of-Animation/・独自リポジトリ。WTE 内の旧版は _Archive/12-Principles-of-Animation_old_20261024/）
Mindmap_GEN-EX/               Gen-EX 側にも同名あり。Mindmap 2.0 の修理は Gen-EX 側で行う（Gen-EX の CLAUDE.md）
```

## 編集ルール
- ノート同士のリンクは Obsidian の `[[ノート名]]`（wikilink）を使う。HTML成果物へは相対パスのmdリンク `[表示名](cognitive/xxx.html)`。
- 新しい知識・気づきは「散らさない」: 該当する `30_Levels/Lx` か `40_Primitives/Pxx` に追記し、作業の流れは `90_Log/YYYY-MM-DD.md` に書く。
- ファイル名・日本語・全角①②はそのまま使ってよい（Obsidianは basename で解決する）。

## 特設LP（scroll-experience）
- `index.html`（バンドル形式の1ファイル。中身は `__bundler/template` の JSON 文字列）の hero 下に **「【特設ページ公開中！】SPECIAL LP」** のリンク帯がある。
  LP を足すときはその JSON 文字列内の `<!-- ===== SPECIAL LP ===== -->` ブロックに `<a>` を1つ足す（Python で json.loads → 置換 → json.dumps(..., ensure_ascii=False)、`</` は `<\u002F` に戻す。書き戻す前に「読んで→そのまま書いた文字列」が元と完全一致するか確かめる）。
- 12原則 LP へは GitHub Pages の絶対 URL でリンク（別リポジトリのため）。
- `scroll-experience/verification/` は検証画像・レビュー zip。**git 管理外**。

## git について
- vault直下は git 管理（origin = GitHub `maso1737/WORLD-TO-EXPRESSION`・ブランチ `master`）。
- 12原則は WTE の外（ルート直下 `../12-Principles-of-Animation/`・独自リポジトリ）。運用ルールは [../12-Principles-of-Animation/CLAUDE.md](../12-Principles-of-Animation/CLAUDE.md)。

## NotebookLM CLI（稼働中・v0.8.0）
- 実行ファイル: `notebooklm-py-main\.venv\Scripts\notebooklm.exe`（venvはBlender Python 3.11製）。ログイン済み。
- 日本語を扱うときは `$env:PYTHONUTF8=1` を先に設定。
- **基本ループ**: `create "名前" --json` → `source add "<file>" -n <id> --type file --mime-type text/plain` → `source wait <source_id> -n <id>` → `summary -n <id> --topics` / `ask "質問" -n <id>` → 出力を `10_Research/` にmdノート化。
- ⚠️ **`.md`直アップは `error` になる**。`.txt`化して `--mime-type text/plain` で渡すと `ready`（`_Archive/`を変換置き場に使う・旧 `_済/`）。
- ⚠️ グローバルオプション（`--quiet` `-v` 等）は `notebooklm <opt> <command>` の順（サブコマンド後ろはNG）。
- 既存ノートブック: `Gen-EX Research` = `fedb41c0-c666-464a-be7e-79013df56af8`。
- 成果物への昇華は `ask --save-as-note` でNotebookLM側にも残せる。Obsidian側は人手/Claudeでmd化。
