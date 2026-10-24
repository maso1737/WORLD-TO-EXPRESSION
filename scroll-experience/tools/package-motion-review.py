"""Package the October 21 motion revision without overwriting earlier review ZIPs."""
from pathlib import Path
import hashlib
import json
import zipfile

app = Path(__file__).resolve().parent.parent
repo = app.parent
verification = app / 'verification'
out = verification / 'motion-20261021'
sources = [f for f in app.rglob('*') if f.is_file() and 'verification' not in f.relative_to(app).parts]
manifest = {str(f.relative_to(app)).replace('\\', '/'): hashlib.sha256(f.read_bytes()).hexdigest() for f in sorted(sources)}
(out / 'source-sha256.json').write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
files = sources + [f for f in out.rglob('*') if f.is_file()]
files += [f for f in verification.iterdir() if f.suffix == '.json' or f.name.startswith(('contact-sheet-', 'detail-', 'revision-')) or f.name == 'WORLD-TO-EXPRESSION-poster.png']
for folder in ['cognitive', 'natural-patterns', 'Emergence Engine', 'Mindmap_GEN-EX/fonts']:
    files += [f for f in (repo / folder).rglob('*') if f.is_file() and f.suffix.lower() in ['.html', '.js', '.css', '.svg', '.ttf', '.woff2', '.md']]
for filename in ['index.html', 'README.md', 'HANDOFF_top-index.md', '00_Hub/Gen-EX.md', '30_Levels/L5 VISUAL LANGUAGE.md', '30_Levels/L7 EXPRESSION.md', '90_Log/2026-10-21-motion-brushup.md']:
    files.append(repo / filename)
for filename in ['patterns.js', 'scenes/05-interpret.js', 'scenes/06-edit.js']:
    files.append(repo / '90_Log/backups/2026-10-21-motion-brushup/js' / filename)
target = verification / 'WORLD-TO-EXPRESSION-motion-review-20261021.zip'
with zipfile.ZipFile(target, 'w', zipfile.ZIP_DEFLATED, compresslevel=8) as archive:
    for f in sorted(set(files)):
        archive.write(f, str(f.relative_to(repo)).replace('\\', '/'))
with zipfile.ZipFile(target) as archive:
    assert archive.testzip() is None
    for filename, digest in manifest.items():
        assert hashlib.sha256(archive.read('scroll-experience/' + filename)).hexdigest() == digest
print(json.dumps({'archive': str(target), 'files': len(set(files)), 'sourceFilesVerified': len(manifest), 'bytes': target.stat().st_size, 'sha256': hashlib.sha256(target.read_bytes()).hexdigest()}))
