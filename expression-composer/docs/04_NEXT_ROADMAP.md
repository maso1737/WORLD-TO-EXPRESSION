# 04 / NEXT & HANDOFF

PHASE 4 は実装しない。受け入れ後の次の作業は以下の3件。

ORDER 02（v0.2）では file://、ZOOM＋重心追跡、押せる工程チップまで実装済み。READMEの起動手順はダブルクリックが標準。①②は同じ世界、③は比較、④⑤は採取後という対応を採用した。公開側の入口更新は引き続き別担当で、本発注では変更しない。

1. Claude が実機で45〜90秒の導線、スマホの操作展開、FREEZEの印象をレビュー。iOS/Safari/低性能端末での性能とフォント差を確認。
2. 下の文案からルートと L7 の入口を小さく更新。本セッションでは対象ファイルを変更していない。
3. 公開前に verification の画像容量と公開対象を判断。別リポジトリの12原則リンクを確認し、必要なら絶対URLへ修正する。

## Claude に頼む更新内容

### ルート README.md の構成表へ追加する文案

| パス | 内容 |
|---|---|
| `scroll-experience/` | 鑑賞作品 — From rules to worlds. 世界の生成から知覚・編集へ進むスクロール体験 |
| `Emergence Engine/` | 生成研究 — 局所ルールから生じる現象を観察・操作する作品群 |
| `expression-composer/` | L7 制作体験 — Boidsのルール比較→実粒子の採取→3構図の編集→PNG/再現JSON |

追加リンク文案：`[EXPRESSION COMPOSER — 発見した法則を、自分の表現へ](expression-composer/)`

### 30_Levels/L7 EXPRESSION.md の文案

status の「未着手」を、受け入れ結果を確認して「代表作 v0.1 実装（実機レビュー範囲はQA参照）」へ変更する案。

> 代表作：[EXPRESSION COMPOSER](../expression-composer/index.html)。Boidsの ALIGN ON/OFF を同条件で比較し、実際の粒子状態を採取。同じ素材から SILENCE / CURRENT / SIGNAL を編集し、1800×2400 PNGと再現用JSONを保存できる。これはL7の制作体験の初版であり、音楽同期・3D・複数モデル・タイムライン等は未着手。

既存のL7の射程・研究ノートは残し、代表作と未着手の領域を分ける。

### ルート index.html の入口文案

既存の `__bundler/template` JSON にある SPECIAL LP 帯の構造を保ち、次の一件だけを追加する案（通常HTMLとして全文を置換しない）。

```html
<a href="expression-composer/">EXPRESSION COMPOSER — FROM SEEING TO MAKING. / 法則から、一枚をつくる →</a>
```

既存トップのリンク分類やL7未着手ラベルも受け入れ結果に合わせ最小差分で調整。ルート・L7・公開導線は Claude の担当。本作から既存トップへの戻りリンクは実装済み。

## 今足さないもの

反応拡散・粘菌・L-system、3D、AI画像、音・BPM、動画、SVG、JPG、履歴タイムライン、ギャラリーは別発注。次にモデルを追加する場合も snapshot の由来と同条件比較を先に設計する。未実装機能の空ボタンは置かない。

## v0.2 受け入れ時の確認

1. `index.html`をダブルクリックし、③→TAKE A→3構図→PNG／JSON保存→JSON読込を実操作で確認する。Chrome headlessの自動検証結果は03とtest-results.jsonを参照。
2. ZOOM=1/1.8/3で粒子のタイル、重心追跡、FREEZEの連続性を確認。実機の手触り、Safari/iOS、GPU負荷は未検証。
3. `verification/claude-review/*.cjs` のES module動的importは、Claude側で `window.EC.composition` / `window.EC.render` 等へ移す必要がある。保護されたレビューコードはこちらでは変更していない。既存`__EC`メソッドと指定DOM IDの改名なし。viewとsetZoomのみ追加。
4. 提出物はビルド不要のclassic script。npmやCDNを導入しない。画像・masterplan・既存トップ・.lnk・_Archiveは触らない。

## v0.3 / Claude受入へ

今回の実装・数値・画像・未達は[05_V03_REVIEW.md](05_V03_REVIEW.md)を正とする。LOCK/FOLLOW、4区間FREEZE、各3案の組版、CTA移動まで。モデル追加・音・3D・ギャラリー・公開導線更新は行わない。

受入は旧JSONのhash/編集復元、LOCK step0の一致、FOLLOWの個別追跡、PNG再生成、4幅での実操作に加え、18シートと最も見づらいSIGNAL/ CURRENT例を確認する。5人観察の実施手順は05に用意した。45〜90秒は目標であり実測結果ではない。保護されたClaude検証スクリプトは未変更。

