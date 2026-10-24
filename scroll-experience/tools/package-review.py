"""Package the new experience, its evidence and selected read-only originals."""
from pathlib import Path
import hashlib
import json
import zipfile

app = Path(__file__).resolve().parent.parent
repo = app.parent
verification = app / 'verification'
checksums = {}
for f in sorted(app.rglob('*')):
    if f.is_file() and 'verification' not in f.relative_to(app).parts:
        checksums[str(f.relative_to(app)).replace('\\', '/')] = hashlib.sha256(f.read_bytes()).hexdigest()
(verification / 'source-sha256.json').write_text(json.dumps(checksums, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')

target = verification / 'WORLD-TO-EXPRESSION-brushup-review.zip'
files = [f for f in app.rglob('*') if f.is_file() and 'verification' not in f.relative_to(app).parts]
files += [f for f in verification.iterdir() if f.suffix == '.json' or f.name.startswith(('contact-sheet-', 'detail-', 'revision-')) or f.name == 'WORLD-TO-EXPRESSION-poster.png']
for folder in ['cognitive', 'natural-patterns', 'Emergence Engine', 'Mindmap_GEN-EX/fonts']:
    files += [f for f in (repo / folder).rglob('*') if f.is_file() and f.suffix.lower() in ['.html', '.js', '.css', '.svg', '.ttf', '.woff2', '.md']]
for filename in ['index.html', 'README.md', 'HANDOFF_top-index.md', '00_Hub/Gen-EX.md', '30_Levels/L5 VISUAL LANGUAGE.md', '30_Levels/L7 EXPRESSION.md']:
    files.append(repo / filename)
with zipfile.ZipFile(target, 'w', zipfile.ZIP_DEFLATED, compresslevel=8) as archive:
    for f in sorted(set(files)):
        archive.write(f, str(f.relative_to(repo)).replace('\\', '/'))
with zipfile.ZipFile(target) as archive:
    assert archive.testzip() is None
print(json.dumps({'archive': str(target), 'files': len(set(files)), 'bytes': target.stat().st_size, 'sha256': hashlib.sha256(target.read_bytes()).hexdigest()}))
