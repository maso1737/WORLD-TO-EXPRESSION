# HANDOFF — COGNITIVE STAGE 申し送り
> 次チャット冒頭に添付してそのまま続けられる状態。

---

## プロジェクト情報

- **プロジェクトID**: このプロジェクト（GEN-EX LOGO SVG）の `cognitive/` フォルダ
- **デザインシステム**: Mind Maps DS（プロジェクトにバインド済み）
  - トークン: `--bg #f2f2ef` / `--ink #0a0a0a` / `--acc #c8ff1a` / `--mute #999` ほか
  - フォント: Bank Gothic（local）/ Square 721（local）/ JetBrains Mono（Google）/ IBM Plex Sans JP（Google）
  - ローカルフォント: `cognitive/fonts/` に ttf コピー済み

---

## 制作済みファイル

| ファイル | 内容 | 状態 |
|---|---|---|
| `cognitive/fonts/` | Bank Gothic + Square 721 ttf | 完了 |
| `cognitive/index.html` | 4層 環マップ（ハブ）L1–L4 + 7原理 | 完了 |
| `cognitive/01-proximity.html` | 01 近接 — フォーマット鋳型 | 完了 ✦ LIVE |

---

## フォーマット仕様（01-proximity.html を鋳型に）

### シェル構造
```
#app { grid-template-rows: 46px 1fr 30px; grid-template-columns: 1fr 300px }
topbar → brand(mark+name+layer-tag) / title / ESC
main   → canvas + stage decor + verdict
aside  → 300px right panel (Control / Proof / Read / Params)
bottombar → readouts / SHORTCUTS
```

### デザイン語彙（Mind Maps DS 準拠）
- ステージ背景: `--grid` + `--grid-major` CSS 背景
- 装飾: 4隅 `+`、上部 tick ruler、右端 lime レール、ghost 数字、gh-word 縦ラベル、data overlay faint
- subject（主役要素）= `--ink` 黒
- proof overlay（真実オーバーレイ）= `--acc` lime 半透明帯 + ink 1px stroke
- off 状態 = dashed ink 境界 + lime fill + verdict に `.edge` クラス → lime ブロック背景
- verdict: Bank Gothic / `.edge` → lime bg + ink text

### パターン対応表（DEMO-SPEC 5型）
| # | パターン | 使用予定 |
|---|---|---|
| 1 | 閾値スライダー | 01 近接 ✓, 03 連続, 04 閉合, 07 対称 |
| 2 | 対抗スライダー | **02 類同 ← 次** |
| 3 | 真実オーバーレイ | 全原理 (proof toggle) |
| 4 | A/B トグル | 05 図と地 |
| 5 | 一斉アニメ (rAF) | 06 共通運命 |

### COPY/PASTE PARAMS 規約
```js
// 各アプリで payload に app id を必ず含める
{ app: 'gestalt-02-similarity', featDelta: ..., gapBias: ..., ... }
```

---

## 次にやること — 02 類同 (Similarity)

### 仕様（DEMO-SPEC より）
- **一言**: 似た見た目（色・形）の要素を1グループと見る。近接と競合する。
- **ステージ**: ドット格子。一部の行/列だけ色/形を変える。間隔は近接と逆向き設定。
- **触る対象 (2本=対抗スライダー)**:
  - `featDelta` : 色差 or 形差（類同の強さ）　← スライダー1
  - `gapBias` : 近接の対抗（どちらが勝つか）　← スライダー2
- **反転点**: 類同を強めると、近接由来の群を「上書き」する点。
- **off 状態**: `featDelta=0`（全要素を同一に）→ 類同消え、近接だけ残る。
- **proof**: 「近接の群」と「類同の群」を別色境界で同時表示。
- **COPY/PASTE**: `{ app, featDelta, featType, gapBias, cols, rows }`

### 実装メモ
- 01-proximity.html をシェルとして流用、canvas ロジックだけ差し替え。
- featType トグル: 色差（hue）or 形差（●/■）の2モード。
- ink 主役ドット、proof → lime(類同群) と mute(近接群) の2色帯。
- `gapBias` で colGap/rowGap の比率を暗黙制御 → 近接由来の群向きが決まる。

### 推奨 DEFAULTS
```js
{ cols:7, rows:5, featDelta:60, featType:'color', gapBias:0.5, showGroups:true }
```
- `featDelta 0–100`: 0 = 全同, 100 = 最大差
- `gapBias 0–1`: 0 = 横に近い(行群), 1 = 縦に近い(列群) — 近接の方向を決める

---

## 参照先

- `uploads/DEMO-SPEC_gestalt.md` — 仕様書テンプレート + 7原理の詳細
- `uploads/HANDOFF_cognitive-stage.md` — 前チャット申し送り（シリーズ設計確定経緯）
- `cognitive/01-proximity.html` — 鋳型HTML（シェルそのまま流用）
- バインド済みスキル: **Mind Maps (design system)**

---

## チェックリスト（全アプリ共通）

- [ ] `cognitive/NN-name.html` 単一 HTML, `file://` 動作
- [ ] `fonts/` 相対パス（bank-gothic / square-721 local）
- [ ] topbar: `COGNITIVE_STAGE // L1_GROUP`（L番号は原理に合わせて変更なし — 全て L1）
- [ ] off 状態に UIでたどり着ける
- [ ] proof/reveal トグルがある
- [ ] COPY/PASTE PARAMS（ok=lime ✓ / ng=red ✗ / 1.2s 復帰）
- [ ] `?` でショートカットモーダル, `ESC` で `index.html` へ
- [ ] 絵文字禁止・unicode 記号のみ（✦ ▸ ✓ など）
- [ ] `index.html` の当該原理チップに `href` を追加

---

## 将来の分岐（今は触らない）

- **index.html 更新**: 各アプリ完成後に `LIVE` チップのリンクを追加するだけ
- **L3 アナモルフォーシス**: CAMERA_RIG_SKILL を接続（資産あり）
- **L4 EDIT（間/Ma）**: 空間＋時間の蝶番。12原則シリーズとの連結点
- **音楽理論**: 時間エンジン側。別シーズン
