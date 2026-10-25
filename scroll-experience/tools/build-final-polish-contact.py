"""Contact sheets and a local comparison viewer from real browser screenshots."""
import json
from pathlib import Path
from PIL import Image, ImageDraw

root = Path(__file__).resolve().parents[1] / 'verification/final-polish-20261025'
report = json.loads((root / 'after/report.json').read_text(encoding='utf-8'))
hero = ['opening', 'bifurcation', 'threshold', 'group', 'focus', 'alignment', 'finale']
for size in ['1440x900', '768x1024', '390x844', '390x650', '844x390']:
    images = [Image.open(root / 'after' / f'{size}-{s}.png').convert('RGB') for s in hero]
    width = 300
    height = round(images[0].height * width / images[0].width)
    sheet = Image.new('RGB', (width * 4, (height + 28) * 2), '#dddcd7')
    draw = ImageDraw.Draw(sheet)
    for i, (name, im) in enumerate(zip(hero, images)):
        x, y = i % 4 * width, i // 4 * (height + 28)
        draw.text((x + 8, y + 8), f'{size} / {name}', fill='#111')
        sheet.paste(im.resize((width, height)), (x, y + 28))
    sheet.save(root / f'contact-{size}.jpg', quality=92)

for size, scene in [('1440x900', 'finale'), ('390x650', 'finale'), ('521x900', 'finale'), ('844x390', 'bifurcation')]:
    a, b = [Image.open(root / version / f'{size}-{scene}.png').convert('RGB') for version in ['before', 'after']]
    sheet = Image.new('RGB', (a.width * 2, a.height + 30), '#dddcd7')
    draw = ImageDraw.Draw(sheet)
    for i, (title, im) in enumerate([('BEFORE', a), ('AFTER', b)]):
        draw.text((i * a.width + 12, 9), title, fill='#111')
        sheet.paste(im, (i * a.width, 30))
    sheet.save(root / f'compare-{size}-{scene}.jpg', quality=94)

files = [f['file'] for f in report['frames']]
html = '''<!doctype html><html lang="ja"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>WORLD TO EXPRESSION | Final polish comparison</title>
<style>body{margin:24px;background:#f2f2ef;color:#0a0a0a;font:15px Arial,sans-serif}h1{font-size:22px}select{padding:12px;max-width:100%}.pair{display:grid;grid-template-columns:1fr 1fr;gap:16px}figure{margin:20px 0}img{width:100%;max-height:85vh;object-fit:contain;object-position:top}figcaption{margin:0 0 12px;font-weight:bold}a{color:inherit}@media(max-width:700px){.pair{grid-template-columns:1fr}}</style>
<h1>WORLD TO EXPRESSION — 完成仕上げ比較</h1><p>2026-10-25 / 同一Chrome・GPU無効・DPR 1。変更前は作業開始時のバックアップ。画像をクリックして原寸を開けます。</p>
<label>画面・場面 <select id="select"></select></label><div class="pair"><figure><figcaption>BEFORE</figcaption><a id="beforeLink"><img id="before" alt="変更前"></a></figure><figure><figcaption>AFTER</figcaption><a id="afterLink"><img id="after" alt="変更後"></a></figure></div>
<p><a href="after/WORLD-TO-EXPRESSION-poster.png">今回保存した1800×2400 PNG</a> · <a href="../../FINAL_POLISH_NOTES.md">検証記録</a></p>
<script>const files=FILES;const select=document.getElementById('select');for(const f of files){const o=document.createElement('option');o.textContent=f;o.value=f;select.append(o)}function show(){for(const v of ['before','after']){document.getElementById(v).src=v+'/'+select.value;document.getElementById(v+'Link').href=v+'/'+select.value}}select.value='390x650-finale.png';select.addEventListener('change',show);show();</script></html>'''.replace('FILES', json.dumps(files))
(root / 'compare.html').write_text(html + '\n', encoding='utf-8', newline='\n')
