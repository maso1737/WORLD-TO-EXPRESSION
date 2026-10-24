"""Contact sheets from actual browser captures; no invented preview frames."""
from pathlib import Path
from PIL import Image, ImageDraw

folder = Path(__file__).resolve().parent.parent / 'verification/motion-20261021'
sequences = {
    1: ['0.9599', '0.9601', '0.967', '0.98', '0.995'],
    3: ['0.32', '0.36', '0.4', '0.46', '0.55', '0.6', '0.66', '0.78', '0.82', '0.9', '0.999'],
    6: ['0.53', '0.8', '0.81', '0.82', '0.835', '0.849', '0.95'],
}
for w, h in [(1440, 900), (390, 844), (390, 650), (844, 390)]:
    tw = 360 if w > h else 195
    th = round(tw * h / w)
    for scene, points in sequences.items():
        columns = 4
        rows = (len(points) + columns - 1) // columns
        sheet = Image.new('RGB', (tw * columns, (th + 24) * rows), '#d2d2cf')
        draw = ImageDraw.Draw(sheet)
        for i, p in enumerate(points):
            file = folder / f'motion-{w}x{h}-act{scene}-p{p}.png'
            frame = Image.open(file).convert('RGB').resize((tw, th), Image.Resampling.LANCZOS)
            x, y = (i % columns) * tw, (i // columns) * (th + 24)
            sheet.paste(frame, (x, y + 24))
            draw.text((x + 8, y + 5), f'ACT {scene:02} / p={p} / {w}x{h}', fill='#0a0a0a')
        sheet.save(folder / f'contact-{w}x{h}-act{scene}.jpg', quality=92)
print('12 motion contact sheets generated.')
