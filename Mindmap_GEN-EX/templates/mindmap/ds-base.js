// Loads this design system into the template. In a consuming project, point
// base at the bound DS folder relative to this file (e.g. '_ds/<folder>' at
// the project root, '../_ds/<folder>' one level down) — one line to edit.
(() => {
  const base = '../..';
  // Stylesheets only. The runtime (_ds_bundle.js, which contains app.js +
  // extras.js + wipeout.js) is injected by Mindmap.dc.html AFTER the shell
  // mounts — the vanilla app runs init() on load and needs the DOM present.
  for (const p of ["styles.css", "extras.css", "wipeout.css"]) {
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = base + '/' + p;
    document.head.appendChild(l);
  }
})();
