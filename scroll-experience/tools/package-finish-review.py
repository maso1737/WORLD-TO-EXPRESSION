"""Package current sources; root manifest is canonical, dated manifests are history."""
from pathlib import Path
import hashlib
import json
import zipfile

app = Path(__file__).resolve().parent.parent
repo = app.parent
verification = app / 'verification'
out = verification / 'finish-20261022'
sources = sorted(f for f in app.rglob('*') if f.is_file() and 'verification' not in f.relative_to(app).parts)
manifest = {f.relative_to(app).as_posix(): hashlib.sha256(f.read_bytes()).hexdigest() for f in sources}
(verification / 'source-sha256.json').write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + '\n', encoding='utf-8', newline='\n')
files = sources + [f for f in verification.rglob('*') if f.is_file() and f.suffix != '.zip' and f.name != 'package-report.json']
for folder in ['cognitive', 'natural-patterns', 'Emergence Engine', 'Mindmap_GEN-EX/fonts']:
    files += [f for f in (repo / folder).rglob('*') if f.is_file() and f.suffix.lower() in ['.html', '.js', '.css', '.svg', '.ttf', '.woff2', '.md']]
for filename in ['index.html', 'README.md', 'HANDOFF_top-index.md', '00_Hub/Gen-EX.md', '30_Levels/L5 VISUAL LANGUAGE.md', '30_Levels/L7 EXPRESSION.md', '90_Log/2026-10-22-motion-finish.md']:
    files.append(repo / filename)
files += [f for f in (repo / '90_Log/backups/2026-10-22-motion-finish').rglob('*') if f.is_file()]
for filename in ['patterns.js', 'scenes/05-interpret.js', 'scenes/06-edit.js']:
    files.append(repo / '90_Log/backups/2026-10-21-motion-brushup/js' / filename)
target = verification / 'WORLD-TO-EXPRESSION-finish-review-20261022.zip'
with zipfile.ZipFile(target, 'w', zipfile.ZIP_DEFLATED, compresslevel=8) as archive:
    for f in sorted(set(files)):
        archive.write(f, f.relative_to(repo).as_posix())
with zipfile.ZipFile(target) as archive:
    assert archive.testzip() is None
    packaged_manifest = json.loads(archive.read('scroll-experience/verification/source-sha256.json'))
    assert packaged_manifest == manifest
    for filename, digest in packaged_manifest.items():
        assert hashlib.sha256(archive.read('scroll-experience/' + filename)).hexdigest() == digest, filename
report = {'archive': str(target), 'files': len(set(files)), 'sourceFilesVerified': len(manifest),
          'manifest': 'scroll-experience/verification/source-sha256.json', 'crcPassed': True,
          'bytes': target.stat().st_size, 'sha256': hashlib.sha256(target.read_bytes()).hexdigest()}
(out / 'package-report.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8', newline='\n')
print(json.dumps(report))
