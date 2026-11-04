キック・連番PNG・WebM音すべてOKとのユーザー確認を受け、次はEE-05として「細胞→生命」の枠にLeniaを配置します。まず04の骨格を読み込みます。

Lenia（連続版ライフゲーム）で進めます。まず実装前に、Nodeでランダムな種から自然に生命体が立ち上がるパラメータを実測で探索します。

ただの丸い種は全部死にました（Lenia の生きものは「形」が要る）。有名な Orbium（オービウム＝Lenia の代表種）の初期形で試します。

Orbiumは質量71を保って安定に泳ぎ続け、σ 0.014〜0.017でも崩れない丈夫さが確認できました。ここからの種探しはCPUだと遅いため、作品本体をWebGL2で組み、ブラウザ上で直接実験します。

Now writing EE-05 itself. The VJ common code gets copied verbatim from 04 (as the handoff requires), and only the Lenia-specific parts are new.

動きました！Orbium（泳ぐ粒）が泳ぎ、ぶつかった所から迷路状の「組織」が広がっています。次は6つの種族を1つずつ走らせて、絵になるか確認します。

All four soup species just fill the world with a uniform pattern after 10 seconds rather than forming distinct creatures. I'll do a fast GPU sweep across parameters to find species that actually produce separate creatures instead.

The boundary between soup dying out and taking over is razor-thin — tiny shifts near μ 0.15 flip the outcome. Next I'll measure how wide the parameter band is for a planted Orbium to survive.

GPU output matches CPU to within 0.000005, and an unrotated Orbium survives 4,000 steps at σ 0.014–0.016, so the issue must be in rotation during stamping or in collisions — checking that next.

Rotated stamps are fragile at the lower edge (σ 0.014). I'll test with only exact orientations (90° turns and mirrors, no interpolation) and see how collisions end.

Collisions mostly result in mutual extinction (7 → 2–4 survivors after 750 steps), fitting the "born, collide, vanish" pattern rather than an explosion. Next, I'll check whether the soup-type species keep moving after they settle.

Found one: with an outer-heavy ring (β=[0.5, 1]) the world keeps boiling and never settles (change per step stays at 0.17–0.42). Taking a look at it.

The β=[0.5, 1] species forms a "boiling cell soup" of ring-shaped cells that jostle endlessly. Next, I'll test whether a bitten Orbium can self-heal and what happens when morphing between species.

Orbium turns out to be fragile—shallow bites heal it, but deep ones kill it, which gives the honest caption "a shallow wound heals itself, a deep one kills it." Next I'll test whether morphing the species' numbers while keeping its matter makes for a good story.

A single seed patch went extinct (too small). I'll measure how big a soup patch must be to survive, since the hand seeding has to work too.

The story checks out: an inverted ring boils the tissue cells, and narrowing σ below ~0.009 causes everything to collapse simultaneously (20%→0%). I'll now code this up as the auto-show.

Shell quoting broke, so I'll put the edit scripts in files and run them.

The auto-show plays through as expected: swimming creatures seed a maze that fills the world in 4 seconds, then boils and collapses as σ drops to 0%. Next I'll check the REVEAL screen, including the HUD and rule diagrams.

The REVEAL screen checks out — the GROW plot shows the world's crowding bars aligning with the gold growth-curve peak, confirming the proof element works. Next I'll test every parameter at its minimum and maximum extremes.

I've confirmed each parameter's effect: μ 0.17 or σ 0.008 causes extinction, σ 0.03 overruns the world, dt 0.3 kills it, and SPEED scales from 60 to 480 steps across its range. Next I'll check the visual controls (GLOW, GROWTH MAP) via pixel readout, along with Conway and the hand.

The growth map is too weak since gold blends into the icy-blue and washes out white. I'll darken the body so the gold and rouge regions stand out more clearly.

Readable now: **gold at the front edge (wants to grow), rouge at the back (shrinking)**. You can see Orbium moves because it grows forward and fades behind. Next, the VJ panel.

BREATHE (μ swinging on each beat) kills Orbium at the current swing of ±0.012. I'll measure how far the swing can go before it dies.

Orbium survives swings up to ±0.009, so I'll set it to ±0.008 (tissue and cells "breathe" by about ±4%).

GLOW 0→1 raises brightness 179→315, HIGH adds 245→322, and REC produced 2.4 MB in 1.5 s. Last checks: actual pointer and keyboard input.

Hand, bite (41.7 → 0.2 → healed back to 37.3) and every key behave as intended. Last, COPY → PASTE round trip (with the clipboard stubbed).

COPY → PASTE round-trips correctly too (including the kernel). Taking screenshots of the remaining species next.

All six species look distinct. Now adding 05 to the series entrance (index.html).

Found a real bug: after copy/paste, the "✓ COPIED" confirmation flash fails because `e.currentTarget` becomes null after `await`, even though the clipboard write itself succeeds. I'll check whether files 01–04 have this same issue.

All five pieces share it. I'll fix it the same way everywhere (grab the button before the `await`).

01 is written differently (`document.getElementById`), so the `btn` declaration didn't go in. Fixing it.

Verifying COPY/PASTE in all five pieces in the browser (clipboard stubbed).

The flash now works in all five. One last cold load of 05 to check for console errors, then I'll write the log.

No new errors (the ones listed are from the old v1/v6 loads). Five Orbiums swimming at 8 s, 120 steps/s. Now writing the log and handoff.

Now updating the top of the HANDOFF.

Updating memory and the PROJECT HUB index.

I've built the fifth piece, **EE-05 LENIA "Nobody knows the shape"** ([05_lenia.html](WORLD%20TO%20EXPRESSION/Emergence%20Engine/05_lenia.html)). It fills the open seat in the series order: "point → particle → network → **cell → life** → flock". I also recorded your three confirmations (kick response, saving the PNG sequence, sound in the WebM) as done in the handoff.

## What it is
Lenia is a smooth version of the Game of Life. The rule is three lines:
1. **LOOK**: each square looks at the average of the squares in a ring around it.
2. **GROW**: if that crowding is just right (μ), it grows a little; if not, it shrinks a little.
3. **STEP**: it changes only a little at a time.

There are six species. They share the same three lines; only the numbers differ:
- **ORBIUM**: swimming creatures
- **TISSUE**: a maze of tissue
- **FROTH**: cells that keep boiling
- **CRYSTAL**: bubbles that line up and stop
- **CORAL**: coral made of three rings
- **CONWAY**: the ancestor, the Game of Life. It reveals that Lenia is "this rule made smooth".

**Auto-show (64 s):**
1. Creatures are born one at a time and swim.
2. When they collide, they vanish.
3. Loosening the rule slightly lets a single seed grow into a maze that eats the whole world (in about 4 seconds).
4. Turning the ring inside out breaks the maze into boiling cells.
5. Narrowing σ makes everything die at once at about 0.009.

## The interesting part (why it moves)
- **GROWTH MAP (G key)** shows each square's "wish". Orbium is **gold at the front (wants to grow) and red at the back (wants to shrink)**: it grows forward and fades behind, so it moves.
- In the GROW plot, the world's crowding (white bars) **sits right on top of the gold peak**. The proof that life survives only where things are "just right" is visible as a graph.
- **A round seed always dies.** The creatures need a specific shape, which is why Orbium is a shape that was *discovered*, not drawn.
- **Bitten creatures:** a shallow wound heals back to the original shape (mass 65 → 71), and a deep one kills them. Tissue fills the hole in a few seconds.

## Check table (all exercised in the browser)
| Parameter | Expected change | When it works | Result |
|---|---|---|---|
| RADIUS / μ / σ / dt | Size of the ring, extinction, sea | Lenia species (grayed out for CONWAY) | ✅ μ 0.17 → extinct, σ 0.03 → covers the world, dt 0.5 → extinct |
| SPEED / GLOW | Steps per frame / edge light | Always | ✅ 60 → 480 steps, brightness 179 → 315 |
| GROWTH MAP | Gold = grow / red = shrink | Always | ❌ fixed (it was too faint, so the body now dims while it's on) → ✅ |
| Press / Shift + press | Born there / bite | Always | ✅ 4 creatures from a drag, a bite heals 41.7 → 0.2 → 37.3 |
| BIRTH / BITE / BREATHE | One on each beat / one bite / breathing | BEAT FROM is not OFF | ❌ fixed (BREATHE killed Orbium, so I reduced its swing) → ✅ all three work |
| NEXT SPECIES | Changes only the numbers | "Every N beats" is not off | ✅ skips CONWAY |
| MID / HIGH | Faster time / edge light | Only while an MP3 plays | ✅ 120 → 240 steps, 245 → 322 |
| REC / PNG sequence | Recording / exact to the beat | — | ✅ 2.4 MB in 1.5 s. 240 frames and 16 beats in a fake folder. Sound uses the same code as 04, which you already confirmed |
| COPY / PASTE | Save and restore values | — | ❌ fixed → ✅ |

## Fixed along the way (01–05)
**The "✓ COPIED" confirmation never appeared** after COPY / PASTE. Copying itself worked; only the confirmation was failing. I fixed all five pieces and confirmed each one shows the confirmation with no errors.

## Not checked yet
- **How heavy it is on your PC.** In the browser pane it held 120 steps per second. If **STEPS / s** in the READOUT stays near 120, it's fine; if it drops, lower SPEED.
- How BREATHE and BIRTH look with real music.

It's on the series entrance ([index.html](WORLD%20TO%20EXPRESSION/Emergence%20Engine/index.html)) as card 05 with a NEW tag. The details and the discoveries are in [90_Log/2026-10-29.md](WORLD%20TO%20EXPRESSION/90_Log/2026-10-29.md).