"""Assemble QA screenshots; these are contact sheets of real browser renders."""
from pathlib import Path
from PIL import Image, ImageDraw

folder = Path(__file__).resolve().parent.parent / 'verification'
for width, height in [(1440, 900), (1280, 800), (768, 1024), (390, 844)]:
    tw = 320 if width > height else 180
    th = round(tw * height / width)
    sheet = Image.new('RGB', (tw * 5, (th + 24) * 7), '#d2d2cf')
    draw = ImageDraw.Draw(sheet)
    for row in range(7):
        for col, progress in enumerate([0, 25, 50, 75, 100]):
            file = folder / f'{width}x{height}-act{row}-{progress}.png'
            if not file.exists():
                continue
            image = Image.open(file).convert('RGB').resize((tw, th), Image.Resampling.LANCZOS)
            x, y = col * tw, row * (th + 24)
            sheet.paste(image, (x, y + 24))
            draw.text((x + 8, y + 6), f'ACT {row:02} / {progress:03}% / {width}x{height}', fill='#0a0a0a')
    sheet.save(folder / f'contact-sheet-{width}.jpg', quality=90)
print('Contact sheets saved for all four viewports.')

revision_frames = [
    'cells-before', 'cells-after', 'cells-opening', 'reaction', 'bifurcation',
    'count-before', 'count-after', 'count-forming', 'group-end', 'focus-start',
    'focus-merge', 'focus-poster', 'equal-lines', 'ponzo', 'equal-circles',
    'silence', 'break', 'recompose', 'finale',
]
for width, height in [(1440, 900), (390, 844), (844, 390), (390, 650)]:
    tw = 300 if width > height else 180
    th = round(tw * height / width)
    sheet = Image.new('RGB', (tw * 4, (th + 24) * 5), '#d2d2cf')
    draw = ImageDraw.Draw(sheet)
    for i, name in enumerate(revision_frames):
        file = folder / f'revision-{width}x{height}-{name}.png'
        image = Image.open(file).convert('RGB').resize((tw, th), Image.Resampling.LANCZOS)
        x, y = (i % 4) * tw, (i // 4) * (th + 24)
        sheet.paste(image, (x, y + 24))
        draw.text((x + 6, y + 6), f'{name} / {width}x{height}', fill='#0a0a0a')
    sheet.save(folder / f'revision-contact-{width}x{height}.jpg', quality=90)
print('Revision contact sheets saved for all four viewports.')
