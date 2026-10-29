(() => {
'use strict';
window.EC = window.EC || {};
const { renderComposition } = window.EC.render;
const { SCHEMA_VERSION, MAX_JSON_BYTES, validateDocument } = window.EC.snapshot;
function exportDocument(state) {
  if (!state.snapshot) throw new Error('先に TAKE STATE で素材を採取してください。');
  return { schemaVersion: SCHEMA_VERSION, model: 'ec-boids-1', snapshot: structuredClone(state.snapshot), preset: state.preset, edit: { ...state.edit } };
}
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob), link = document.createElement('a');
  link.href = url; link.download = filename; document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
async function exportPNG(state, { download = true } = {}) {
  const captured = exportDocument(state);
  await document.fonts.ready;
  const canvas = document.createElement('canvas'); canvas.width = 1800; canvas.height = 2400;
  renderComposition(captured, canvas);
  const dataURL = canvas.toDataURL('image/png');
  if (download) {
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error('PNG を作成できませんでした。');
    downloadBlob(blob, `EC-${captured.preset}-${captured.snapshot.hash}.png`);
  }
  return { width: canvas.width, height: canvas.height, dataURL };
}
function saveJSON(state) {
  const doc = exportDocument(state);
  downloadBlob(new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' }), `EC-${doc.snapshot.hash}.json`);
}
async function readJSONFile(file) {
  if (!file || !/\.json$/i.test(file.name)) throw new Error('拡張子 .json のファイルを選んでください。');
  if (file.size > MAX_JSON_BYTES) throw new Error('JSON は 2 MiB 以下にしてください。');
  return validateDocument(await file.text());
}

window.EC.exporter = Object.freeze({ exportDocument, downloadBlob, exportPNG, saveJSON, readJSONFile });
})();
