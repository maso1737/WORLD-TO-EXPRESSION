/* @ds-bundle: {"format":3,"namespace":"MindMaps_9bcdb2","components":[],"sourceHashes":{"app.js":"4634329945c5","extras.js":"a868fd638d48","skills/genex-mindmap/app/app.js":"4634329945c5","skills/genex-mindmap/app/extras.js":"a868fd638d48","skills/genex-mindmap/app/wipeout.js":"ad5d0c0ed017","wipeout.js":"ad5d0c0ed017"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.MindMaps_9bcdb2 = window.MindMaps_9bcdb2 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// app.js
try { (() => {
/* =========================================================
   tDR-INSPIRED MINDMAP — APP  (build v8)
   - per-category view state
   - undo/redo
   - collapse toggle
   - draggable tweaks panel
   - layout-only reset
   - high-DPI zoom (no pixelation)
   ========================================================= */

window.CATEGORIES = [{
  id: "ZBRUSH",
  file: "data/ZBRUSH.md",
  label: "ZBRUSH",
  sub: "FLEE / ANIMATION",
  jp: ""
}, {
  id: "3dsmax",
  file: "data/3dsmax.md",
  label: "3DS · MAX",
  sub: "MODEL / LAYOUT / RIG",
  jp: ""
}, {
  id: "design",
  file: "data/design.md",
  label: "DESIGN",
  sub: "SHAPE / COLOR / MOTION",
  jp: ""
}, {
  id: "hud",
  file: "data/hud.md",
  label: "HUD",
  sub: "UI / SCI-FI / SPECS",
  jp: ""
}, {
  id: "music-video",
  file: "data/music-video.md",
  label: "MUSIC · VIDEO",
  sub: "AE / 3D / REFERENCE",
  jp: ""
}, {
  id: "prepro",
  file: "data/prepro.md",
  label: "PRE · PROD",
  sub: "CONCEPT / STORYBOARD",
  jp: "プリプロダクション"
}];
const CATEGORIES = window.CATEGORIES;
window.state = null;
const STORE_KEY = "tdr-mindmap-v4";
const CUSTOM_CATS_KEY = "tdr-mindmap-custom-cats-v1";
const CAT_ORDER_KEY = "tdr-mindmap-cat-order-v1";
const DEFAULT_LAYOUTS_KEY = "tdr-mindmap-default-layouts-v1";

/* Load custom cats + ordering at startup */
(function bootstrapCats() {
  try {
    const customs = JSON.parse(localStorage.getItem(CUSTOM_CATS_KEY) || "[]");
    customs.forEach(c => {
      if (!CATEGORIES.find(x => x.id === c.id)) CATEGORIES.push(c);
    });
    const order = JSON.parse(localStorage.getItem(CAT_ORDER_KEY) || "null");
    if (Array.isArray(order)) {
      const map = new Map(CATEGORIES.map(c => [c.id, c]));
      const reordered = [];
      order.forEach(id => {
        if (map.has(id)) {
          reordered.push(map.get(id));
          map.delete(id);
        }
      });
      map.forEach(c => reordered.push(c));
      CATEGORIES.length = 0;
      reordered.forEach(c => CATEGORIES.push(c));
    }
  } catch {}
})();

/* ---------- markdown parsing ---------- */
function parseMarkdown(md) {
  md = md.replace(/<!--[\s\S]*?-->/g, "");
  const lines = md.split(/\r?\n/);
  let root = null;
  const stack = [];
  let counter = 1;
  const mkId = () => `n_${counter++}`;
  const headRe = /^(#{1,6})\s+(.+)$/;
  const bullRe = /^(\s*)[-*]\s+(.+)$/;
  const numRe = /^(\s*)\d+\.\s+(.+)$/;
  const quoteRe = /^>\s*(.+)$/;
  for (let raw of lines) {
    const line = raw.replace(/\s+$/, "");
    if (!line.trim()) continue;
    const h = line.match(headRe);
    if (h) {
      const lvl = h[1].length;
      let text = h[2].trim();
      // strip leading "1. " "■ " "1) " decorations from heading text
      text = text.replace(/^[■●◆▪︎▸►]\s*/, "").replace(/^\d+[\.\)]\s*/, "").trim();
      if (!root && lvl === 1) {
        const r = makeNode(text, 0, "n_root");
        r.id = "n_root";
        root = r;
        stack.push(root);
        continue;
      }
      if (!root) {
        root = {
          id: "n_root",
          title: "ROOT",
          url: null,
          notes: [],
          children: [],
          level: 0,
          _open: true
        };
        stack.push(root);
      }
      const node = makeNode(text, lvl, mkId());
      while (stack.length && stack[stack.length - 1].level >= lvl) stack.pop();
      const parent = stack[stack.length - 1] || root;
      parent.children.push(node);
      stack.push(node);
      continue;
    }
    const b = line.match(bullRe) || line.match(numRe) || line.match(quoteRe);
    if (b) {
      const text = (b[2] || b[1]).trim();
      const cur = stack[stack.length - 1];
      if (cur && cur.notes.length < 3) cur.notes.push(stripLinks(text));
    }
  }
  if (!root) root = {
    id: "n_root",
    title: "ROOT",
    url: null,
    notes: [],
    children: [],
    level: 0,
    _open: true
  };
  return root;
}
function makeNode(text, level, id) {
  const linkRe = /\[([^\]]+)\]\(([^)]+)\)/;
  let url = null,
    title = text;
  const m = text.match(linkRe);
  if (m) {
    title = m[1];
    url = m[2];
  }
  title = title.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1").trim();
  return {
    id,
    title,
    url,
    notes: [],
    children: [],
    level,
    _open: true
  };
}
function stripLinks(text) {
  return text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1").trim();
}

/* ---------- layout (tidy tree) ---------- */
function layoutTree(root) {
  const COL = 280,
    ROW = 64,
    SNAP = 8;
  let leafCounter = 0;
  function assign(node, depth) {
    node._depth = depth;
    const visKids = node._open !== false ? node.children || [] : [];
    if (visKids.length === 0) {
      node._row = leafCounter++;
      return;
    }
    visKids.forEach(c => assign(c, depth + 1));
    const first = visKids[0],
      last = visKids[visKids.length - 1];
    node._row = (first._row + last._row) / 2;
  }
  assign(root, 0);
  const totalRows = Math.max(1, leafCounter);
  const yCenter = (totalRows - 1) * ROW / 2;
  function place(node) {
    node.x = Math.round(node._depth * COL / SNAP) * SNAP;
    node.y = Math.round((node._row * ROW - yCenter) / SNAP) * SNAP;
    delete node._depth;
    delete node._row;
    (node.children || []).forEach(place);
  }
  place(root);
}

/* ---------- DOM helpers ---------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
function el(tag, attrs = {}, ...children) {
  const e = document.createElement(tag);
  for (const k in attrs) {
    if (k === "class") e.className = attrs[k];else if (k === "style") e.style.cssText = attrs[k];else if (k.startsWith("on")) e.addEventListener(k.slice(2), attrs[k]);else if (attrs[k] != null) e.setAttribute(k, attrs[k]);
  }
  for (const c of children) {
    if (c == null) continue;
    e.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  }
  return e;
}
function hasJP(s) {
  return /[\u3000-\u9fff\uff00-\uffef]/.test(s || "");
}
function fmtCoord(x, y) {
  const sign = n => (n >= 0 ? "+" : "-") + Math.abs(Math.round(n)).toString().padStart(4, "0");
  return `[ X${sign(x)} · Y${sign(y)} ]`;
}
function shortUrl(u) {
  try {
    const url = new URL(u);
    return url.host.replace(/^www\./, "") + (url.pathname === "/" ? "" : url.pathname.slice(0, 24));
  } catch {
    return u.slice(0, 28);
  }
}
function countNodes(root) {
  let n = 0;
  (function w(x) {
    n++;
    (x.children || []).forEach(w);
  })(root);
  return n;
}
function maxDepth(root) {
  let d = 0;
  (function w(x, l) {
    d = Math.max(d, l);
    (x.children || []).forEach(c => w(c, l + 1));
  })(root, 0);
  return d;
}

/* =========================================================
   STATE  (per-category views)
   ========================================================= */
window.state = {
  trees: {},
  meta: {},
  views: {},
  // { catId: {x,y,k} }
  active: "ZBRUSH",
  selected: null,
  theme: "light",
  showCoords: false,
  nodeStyle: "block",
  accent: "yellow",
  twPos: {
    right: 16,
    bottom: 48
  }
};
const state = window.state;
const ACCENTS = {
  yellow: "#ffd400",
  lime: "#c8ff1a",
  pink: "#ff3da6",
  orange: "#ff5a1a",
  ink: "#0a0a0a"
};
function getView() {
  if (!state.views[state.active]) state.views[state.active] = {
    x: 600,
    y: 400,
    k: 0.85
  };
  return state.views[state.active];
}

/* =========================================================
   PERSIST
   ========================================================= */
function saveState() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({
      trees: state.trees,
      views: state.views,
      active: state.active,
      theme: state.theme,
      showCoords: state.showCoords,
      nodeStyle: state.nodeStyle,
      accent: state.accent,
      twPos: state.twPos
    }));
  } catch {}
}
function loadStateRaw() {
  try {
    const r = localStorage.getItem(STORE_KEY);
    return r ? JSON.parse(r) : null;
  } catch {
    return null;
  }
}

/* =========================================================
   UNDO / REDO  (snapshots of trees+views)
   ========================================================= */
const history = {
  past: [],
  future: []
};
const HIST_MAX = 60;
function snapshot() {
  return JSON.stringify({
    trees: state.trees,
    views: state.views
  });
}
function restoreSnap(s) {
  const o = JSON.parse(s);
  state.trees = o.trees;
  state.views = o.views;
}
function pushHistory() {
  history.past.push(snapshot());
  if (history.past.length > HIST_MAX) history.past.shift();
  history.future.length = 0;
}
function undo() {
  if (!history.past.length) return;
  const cur = snapshot();
  const prev = history.past.pop();
  history.future.push(cur);
  restoreSnap(prev);
  renderStage();
  updateCrumbs();
  saveState();
  toast("UNDO");
}
function redo() {
  if (!history.future.length) return;
  const cur = snapshot();
  const nxt = history.future.pop();
  history.past.push(cur);
  restoreSnap(nxt);
  renderStage();
  updateCrumbs();
  saveState();
  toast("REDO");
}

/* =========================================================
   LOAD MAPS
   ========================================================= */
async function loadAllMaps() {
  const stored = loadStateRaw();
  // Drop any orphaned trees from old/removed categories
  if (stored && stored.trees) {
    const ids = new Set(CATEGORIES.map(c => c.id));
    Object.keys(stored.trees).forEach(k => {
      if (!ids.has(k)) delete stored.trees[k];
    });
  }
  for (const cat of CATEGORIES) {
    if (stored && stored.trees && stored.trees[cat.id]) {
      state.trees[cat.id] = stored.trees[cat.id];
    } else if (cat.file) {
      try {
        const res = await fetch(cat.file);
        const txt = await res.text();
        const root = parseMarkdown(txt);
        layoutTree(root);
        state.trees[cat.id] = root;
      } catch (e) {
        state.trees[cat.id] = {
          id: "n_root",
          title: cat.label,
          url: null,
          notes: [],
          children: [],
          level: 0,
          _open: true,
          x: 0,
          y: 0
        };
      }
    } else {
      state.trees[cat.id] = {
        id: "n_root",
        title: cat.label,
        url: null,
        notes: [],
        children: [],
        level: 0,
        _open: true,
        x: 0,
        y: 0
      };
    }
    state.meta[cat.id] = {
      count: countNodes(state.trees[cat.id]),
      depth: maxDepth(state.trees[cat.id])
    };
  }
  if (stored) {
    state.active = stored.active || "ZBRUSH";
    // guard: if saved active no longer matches a registered category, fall back
    if (!CATEGORIES.find(c => c.id === state.active)) state.active = "ZBRUSH";
    state.views = stored.views || {};
    state.theme = (stored.theme === "dark" ? "white" : stored.theme) || "light";
    state.showCoords = !!stored.showCoords;
    state.nodeStyle = stored.nodeStyle || "block";
    state.accent = stored.accent || "yellow";
    state.twPos = stored.twPos || state.twPos;
  }
}

/* =========================================================
   SIDEBAR
   ========================================================= */
function renderSidebar() {
  const list = $(".sb__list");
  list.innerHTML = "";
  CATEGORIES.forEach((cat, i) => {
    const meta = state.meta[cat.id];
    const btn = el("button", {
      class: "cat" + (cat.id === state.active ? " is-active" : ""),
      "data-id": cat.id,
      onclick: () => {
        state.active = cat.id;
        state.selected = null;
        renderAll();
      }
    }, el("div", {
      class: "cat__idx"
    }, String(i).padStart(2, "0")), el("div", {
      class: "cat__body"
    }, el("div", {
      class: "cat__t"
    }, cat.label), el("div", {
      class: "cat__sub"
    }, cat.sub)), el("div", {
      class: "cat__meta"
    }, el("span", {
      class: "n"
    }, "N=" + meta.count), el("span", {}, "D" + meta.depth)));
    list.appendChild(btn);
  });
  const foot = $(".sb__foot");
  if (foot) {
    const total = Object.values(state.meta).reduce((s, m) => s + m.count, 0);
    foot.innerHTML = "";
    foot.appendChild(makeFootRow("DOC", "MINDMAP/2026"));
    foot.appendChild(makeFootRow("NODES", "T=" + total));
    foot.appendChild(makeFootRow("REV", "A2 · ISO 216"));
  }
}
function makeFootRow(k, v) {
  return el("div", {
    class: "row"
  }, el("span", {}, k), el("span", {
    class: "v"
  }, v));
}

/* =========================================================
   STAGE
   ========================================================= */
function renderStage() {
  const root = state.trees[state.active];
  const vp = $(".stg__viewport");
  if (!vp) return;
  vp.innerHTML = "";
  if (!root) return;
  const idx = CATEGORIES.findIndex(c => c.id === state.active);
  const num1 = $(".gh-num1"),
    num2 = $(".gh-num2");
  if (num1) num1.textContent = String(idx).padStart(2, "0");
  if (num2) num2.textContent = idx + 1 + "A";

  // SVG edges (rendered FIRST so nodes layer above)
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "edges");
  svg.style.position = "absolute";
  svg.style.left = "-3000px";
  svg.style.top = "-3000px";
  svg.style.width = "9000px";
  svg.style.height = "9000px";
  svg.setAttribute("viewBox", "-3000 -3000 9000 9000");
  vp.appendChild(svg);

  // visible flat (skip children of collapsed nodes)
  const flat = [];
  (function walk(n, parent) {
    flat.push({
      n,
      parent
    });
    if (n._open !== false) (n.children || []).forEach(c => walk(c, n));
  })(root, null);

  // edges
  flat.forEach(({
    n,
    parent
  }) => {
    if (!parent) return;
    const x1 = parent.x,
      y1 = parent.y;
    const x2 = n.x,
      y2 = n.y;
    const isAccent = parent === root;
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const midX = (x1 + x2) / 2;
    path.setAttribute("d", `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`);
    if (isAccent) path.setAttribute("class", "edge-acc");
    path.setAttribute("data-edge-from", parent.id);
    path.setAttribute("data-edge-to", n.id);
    svg.appendChild(path);
  });

  // nodes
  flat.forEach(({
    n,
    parent
  }, i) => {
    const isRoot = !parent;
    const lvl = computeLevel(n, root);
    const isMin = state.nodeStyle === "minimal";
    const node = el("div", {
      class: "node lvl-" + lvl + (isRoot ? " is-root" : "") + (state.selected === n.id ? " is-selected" : "") + (isMin ? " is-minimal" : "") + (n._open === false ? " is-collapsed" : ""),
      "data-id": n.id,
      style: `left:${n.x}px; top:${n.y}px; transform: translate(-50%, -50%);`
    });
    const idxStr = isRoot ? "ROOT" : padIdx(i, lvl);
    const head = el("div", {
      class: "node__head"
    }, el("span", {
      class: "node__idx"
    }, idxStr), el("span", {
      class: "node__lvl"
    }, "L" + lvl));
    node.appendChild(head);

    // collapse toggle: if node has children
    if ((n.children || []).length > 0 && !isRoot) {
      const tog = el("button", {
        class: "node__tog",
        title: n._open === false ? "Expand" : "Collapse",
        onclick: e => {
          e.stopPropagation();
          toggleCollapse(n);
        }
      }, n._open === false ? "+" : "−");
      node.appendChild(tog);
    }
    if (isRoot && (n.children || []).length > 0) {
      const tog = el("button", {
        class: "node__tog node__tog--root",
        title: n._open === false ? "Expand" : "Collapse",
        onclick: e => {
          e.stopPropagation();
          toggleCollapse(n);
        }
      }, n._open === false ? "+" : "−");
      node.appendChild(tog);
    }
    if (state.nodeStyle === "block" && n.thumb) {
      const t = el("div", {
        class: "node__thumb"
      });
      t.style.backgroundImage = `url(${n.thumb})`;
      node.appendChild(t);
    }
    const body = el("div", {
      class: "node__body"
    });
    const title = el("div", {
      class: "node__title" + (hasJP(n.title) ? " has-jp" : ""),
      contenteditable: "true",
      spellcheck: "false"
    }, n.title || "Untitled");
    title.addEventListener("focus", () => pushHistory());
    title.addEventListener("blur", () => {
      n.title = title.textContent.trim();
      saveState();
    });
    title.addEventListener("keydown", ev => {
      if (ev.key === "Enter") {
        ev.preventDefault();
        title.blur();
      }
    });
    body.appendChild(title);
    if (!isMin) {
      const notes = el("div", {
        class: "node__notes"
      });
      const noteCount = Math.max(1, Math.min(3, (n.notes || []).length || 1));
      for (let ni = 0; ni < noteCount; ni++) {
        const noteText = n.notes && n.notes[ni] || "";
        const noteEl = el("div", {
          class: "n" + (noteText ? "" : " is-empty"),
          contenteditable: "true",
          spellcheck: "false",
          "data-placeholder": "+ NOTE",
          "data-note-idx": String(ni)
        }, noteText);
        noteEl.addEventListener("focus", () => {
          pushHistory();
          noteEl.classList.remove("is-empty");
        });
        noteEl.addEventListener("input", () => {
          const v = noteEl.textContent;
          if (!n.notes) n.notes = [];
          n.notes[ni] = v;
        });
        noteEl.addEventListener("blur", () => {
          const v = noteEl.textContent.trim();
          if (!n.notes) n.notes = [];
          n.notes[ni] = v;
          // trim trailing empties
          while (n.notes.length && !n.notes[n.notes.length - 1]) n.notes.pop();
          if (!v) noteEl.classList.add("is-empty");
          saveState();
        });
        noteEl.addEventListener("keydown", ev => {
          if (ev.key === "Enter") {
            ev.preventDefault();
            // move to next note slot or add new one if room
            const next = noteEl.parentElement.querySelector(`[data-note-idx="${ni + 1}"]`);
            if (next) next.focus();else if (ni < 2) {
              noteEl.blur();
              renderStage();
              // focus newly-rendered last note
              setTimeout(() => {
                const dom = $(`.node[data-id="${n.id}"] [data-note-idx="${ni + 1}"]`);
                if (dom) dom.focus();
              }, 0);
            } else {
              noteEl.blur();
            }
          }
        });
        notes.appendChild(noteEl);
      }
      body.appendChild(notes);
    }
    if (!isMin && (n.url || !isRoot)) {
      const urlRow = el("div", {
        class: "node__url"
      });
      urlRow.appendChild(el("span", {
        class: "lbl"
      }, "URL"));
      const a = n.url ? el("a", {
        href: n.url,
        target: "_blank",
        rel: "noreferrer noopener"
      }, shortUrl(n.url)) : el("span", {
        style: "color:var(--mute);font-style:italic;"
      }, "—");
      urlRow.appendChild(a);
      body.appendChild(urlRow);
    }
    node.appendChild(body);
    node.appendChild(el("div", {
      class: "node__coord"
    }, fmtCoord(n.x, n.y)));
    const actions = el("div", {
      class: "node__actions"
    }, el("button", {
      onclick: e => {
        e.stopPropagation();
        editURL(n);
      }
    }, "URL"), el("button", {
      onclick: e => {
        e.stopPropagation();
        pickThumb(n);
      }
    }, "IMG"), el("button", {
      onclick: e => {
        e.stopPropagation();
        addChild(n);
      }
    }, "+ CHILD"), el("button", {
      class: "del",
      onclick: e => {
        e.stopPropagation();
        delNode(n);
      }
    }, "DEL"));
    node.appendChild(actions);
    attachNodeDrag(node, n);
    node.addEventListener("click", ev => {
      if (ev.target.closest(".node__title")) return;
      if (ev.target.closest(".node__notes")) return;
      if (ev.target.closest(".node__url a")) return;
      if (ev.target.closest(".node__tog")) return;
      ev.stopPropagation();
      state.selected = n.id;
      $$(".node.is-selected").forEach(el => el.classList.remove("is-selected"));
      node.classList.add("is-selected");
      markSelectedEdges(n);
      updateCrumbs();
    });

    // hover: fade non-related, highlight ancestors+descendants+self
    node.addEventListener("mouseenter", () => {
      if (node.classList.contains("dragging")) return;
      const stg = $(".stg");
      stg.classList.add("is-hovering");
      const related = collectRelatedIds(state.trees[state.active], n);
      $$(".node").forEach(el => {
        const id = el.getAttribute("data-id");
        el.classList.toggle("is-related", related.has(id));
        el.classList.toggle("is-hovered", id === n.id);
      });
      // edges: highlight related
      $$(".edges path").forEach(p => {
        const f = p.getAttribute("data-edge-from");
        const t = p.getAttribute("data-edge-to");
        p.classList.toggle("edge-related", related.has(f) && related.has(t));
      });
    });
    node.addEventListener("mouseleave", () => {
      const stg = $(".stg");
      stg.classList.remove("is-hovering");
      $$(".node").forEach(el => el.classList.remove("is-related", "is-hovered"));
      $$(".edges path").forEach(p => p.classList.remove("edge-related"));
    });
    node.addEventListener("dragover", ev => {
      if (ev.dataTransfer && ev.dataTransfer.types && ev.dataTransfer.types.includes("Files")) {
        ev.preventDefault();
        node.classList.add("drop-target");
      }
    });
    node.addEventListener("dragleave", () => node.classList.remove("drop-target"));
    node.addEventListener("drop", async ev => {
      ev.preventDefault();
      node.classList.remove("drop-target");
      const f = ev.dataTransfer.files && ev.dataTransfer.files[0];
      if (f && f.type.startsWith("image/")) {
        pushHistory();
        const url = await fileToDataURL(f);
        n.thumb = url;
        renderStage();
        saveState();
        toast("IMAGE ATTACHED");
      }
    });
    vp.appendChild(node);
  });
  applyTransform();
  $(".stg")?.classList.toggle("show-coords", state.showCoords);
}
function computeLevel(node, root) {
  if (node === root) return 0;
  let lvl = -1;
  (function w(n, l) {
    if (lvl !== -1) return;
    if (n === node) {
      lvl = l;
      return;
    }
    (n.children || []).forEach(c => w(c, l + 1));
  })(root, 0);
  return lvl < 0 ? 0 : lvl;
}
function padIdx(i, lvl) {
  const a = "0123456789ABCDEF";
  return String(lvl) + a[i % 16];
}
function toggleCollapse(n) {
  pushHistory();
  const wasOpen = n._open !== false;
  n._open = wasOpen ? false : true;
  renderStage();
  saveState();
  // Time-staggered reveal on expand: 30~80ms apart
  if (!wasOpen) {
    const root = state.trees[state.active];
    const order = [];
    (function w(node, depth) {
      (node.children || []).forEach((c, i) => {
        order.push({
          id: c.id,
          depth
        });
        w(c, depth + 1);
      });
    })(n, 0);
    order.forEach((o, i) => {
      const dom = $(`.node[data-id="${o.id}"]`);
      if (!dom) return;
      dom.style.opacity = "0";
      dom.style.transform = (dom.style.transform || "") + " translateY(-4px)";
      // base transform from inline style is "translate(-50%, -50%)"
      const base = `translate(-50%, -50%)`;
      dom.style.transform = base + " translateY(-4px)";
      setTimeout(() => {
        dom.style.transition = "opacity 220ms var(--ez), transform 260ms var(--ez)";
        dom.style.opacity = "1";
        dom.style.transform = base;
      }, 30 + i * 24);
    });
  }
  toast(wasOpen ? "COLLAPSED" : "EXPANDED");
}

/* =========================================================
   TRANSFORM
   ========================================================= */
function applyTransform(smooth) {
  const v = getView();
  const vp = $(".stg__viewport");
  if (vp) {
    if (smooth) {
      vp.classList.add("is-smooth");
      clearTimeout(applyTransform._t);
      applyTransform._t = setTimeout(() => vp.classList.remove("is-smooth"), 400);
    } else {
      vp.classList.remove("is-smooth");
    }
    vp.style.transform = `translate(${v.x}px, ${v.y}px) scale(${v.k})`;
  }
  const lvl = $(".zoom .lvl");
  if (lvl) lvl.textContent = Math.round(v.k * 100) + "%";
}
function attachStagePanZoom() {
  const stg = $(".stg");
  let dragging = false,
    sx = 0,
    sy = 0,
    ox = 0,
    oy = 0;
  function startPan(e) {
    // allow pan from anywhere on the stage that's NOT a node, button, panel
    if (e.target.closest(".node")) return;
    if (e.target.closest(".tw")) return;
    if (e.target.closest(".zoom")) return;
    if (e.target.closest(".hint")) return;
    if (e.target.closest(".stg__axis")) return;
    if (e.button !== 0) return;
    dragging = true;
    sx = e.clientX;
    sy = e.clientY;
    const v = getView();
    ox = v.x;
    oy = v.y;
    stg.classList.add("is-panning");
    state.selected = null;
    $$(".node.is-selected").forEach(el => el.classList.remove("is-selected"));
  }
  stg.addEventListener("mousedown", startPan);
  window.addEventListener("mousemove", e => {
    if (!dragging) return;
    const v = getView();
    v.x = ox + (e.clientX - sx);
    v.y = oy + (e.clientY - sy);
    applyTransform();
  });
  window.addEventListener("mouseup", () => {
    if (dragging) {
      dragging = false;
      stg.classList.remove("is-panning");
      saveState();
    }
  });
  stg.addEventListener("wheel", e => {
    e.preventDefault();
    const v = getView();
    const delta = -e.deltaY * 0.0015;
    const newK = Math.min(2.5, Math.max(0.25, v.k * (1 + delta)));
    const rect = stg.getBoundingClientRect();
    const cx = e.clientX - rect.left,
      cy = e.clientY - rect.top;
    const dx = (cx - v.x) / v.k;
    const dy = (cy - v.y) / v.k;
    v.k = newK;
    v.x = cx - dx * newK;
    v.y = cy - dy * newK;
    applyTransform();
    saveState();
  }, {
    passive: false
  });
}

/* =========================================================
   NODE DRAG
   ========================================================= */
function attachNodeDrag(elNode, n) {
  let dragging = false,
    started = false,
    sx = 0,
    sy = 0,
    ox = 0,
    oy = 0;
  elNode.addEventListener("mousedown", e => {
    if (e.target.closest(".node__title")) return;
    if (e.target.closest(".node__notes")) return;
    if (e.target.closest(".node__url a")) return;
    if (e.target.closest(".node__actions")) return;
    if (e.target.closest(".node__tog")) return;
    if (e.button !== 0) return;
    dragging = true;
    started = false;
    sx = e.clientX;
    sy = e.clientY;
    ox = n.x;
    oy = n.y;
    e.stopPropagation();
  });
  window.addEventListener("mousemove", e => {
    if (!dragging) return;
    const k = getView().k;
    const dx = (e.clientX - sx) / k;
    const dy = (e.clientY - sy) / k;
    if (!started && Math.hypot(dx, dy) < 3) return;
    if (!started) {
      started = true;
      pushHistory();
      elNode.classList.add("dragging");
    }
    n.x = Math.round((ox + dx) / 10) * 10;
    n.y = Math.round((oy + dy) / 10) * 10;
    elNode.style.left = n.x + "px";
    elNode.style.top = n.y + "px";
    const cd = elNode.querySelector(".node__coord");
    if (cd) cd.textContent = fmtCoord(n.x, n.y);
    updateEdgesForNode(n);
    if (e.shiftKey) {
      const target = pickNodeAt(e.clientX, e.clientY, n);
      $$(".node.drop-target").forEach(x => x.classList.remove("drop-target"));
      if (target) target.dom.classList.add("drop-target");
    }
  });
  window.addEventListener("mouseup", e => {
    if (!dragging) return;
    if (started && e.shiftKey) {
      const target = pickNodeAt(e.clientX, e.clientY, n);
      if (target && target.node !== n) reparent(n, target.node);
    }
    dragging = false;
    if (started) {
      elNode.classList.remove("dragging");
      $$(".node.drop-target").forEach(x => x.classList.remove("drop-target"));
      saveState();
    }
  });
}
function pickNodeAt(cx, cy, exclude) {
  const els = document.elementsFromPoint(cx, cy);
  for (const e of els) {
    if (!e.classList || !e.classList.contains("node")) continue;
    const id = e.getAttribute("data-id");
    if (!id) continue;
    const node = findNodeById(state.trees[state.active], id);
    if (node && node !== exclude) return {
      dom: e,
      node
    };
  }
  return null;
}
function findNodeById(root, id) {
  if (!root) return null;
  if (root.id === id) return root;
  for (const c of root.children || []) {
    const f = findNodeById(c, id);
    if (f) return f;
  }
  return null;
}

/* collect ancestors + descendants + self for hover fade */
function collectRelatedIds(root, target) {
  const set = new Set();
  // descendants
  (function w(n) {
    set.add(n.id);
    (n.children || []).forEach(w);
  })(target);
  // ancestors
  (function w(n, path) {
    if (n === target) {
      path.forEach(p => set.add(p.id));
      return true;
    }
    for (const c of n.children || []) {
      if (w(c, [...path, n])) return true;
    }
    return false;
  })(root, []);
  return set;
}

/* highlight edges from root → selected node path */
function markSelectedEdges(target) {
  const root = state.trees[state.active];
  $$(".edges path").forEach(p => p.classList.remove("edge-selected"));
  // find ancestor chain
  const chain = [];
  (function w(n, path) {
    if (n === target) {
      chain.push(...path, n);
      return true;
    }
    for (const c of n.children || []) {
      if (w(c, [...path, n])) return true;
    }
    return false;
  })(root, []);
  for (let i = 0; i < chain.length - 1; i++) {
    const a = chain[i],
      b = chain[i + 1];
    $$(`.edges path[data-edge-from="${a.id}"][data-edge-to="${b.id}"]`).forEach(p => p.classList.add("edge-selected"));
  }
}
function findParent(root, id) {
  for (const c of root.children || []) {
    if (c.id === id) return root;
    const f = findParent(c, id);
    if (f) return f;
  }
  return null;
}
function isDescendant(a, b) {
  for (const c of a.children || []) {
    if (c === b) return true;
    if (isDescendant(c, b)) return true;
  }
  return false;
}
function reparent(node, newParent) {
  const root = state.trees[state.active];
  if (node === root || newParent === node) return;
  if (isDescendant(node, newParent)) {
    toast("CIRCULAR · BLOCKED");
    return;
  }
  const oldParent = findParent(root, node.id);
  if (!oldParent) return;
  oldParent.children = oldParent.children.filter(c => c !== node);
  newParent.children.push(node);
  toast("RE · PARENTED");
  renderStage();
  saveState();
}
function updateEdgesForNode(n) {
  const root = state.trees[state.active];
  const svg = $(".stg__viewport .edges");
  if (!svg) return;
  $$(`path[data-edge-to="${n.id}"], path[data-edge-from="${n.id}"]`, svg).forEach(p => {
    const fromId = p.getAttribute("data-edge-from");
    const toId = p.getAttribute("data-edge-to");
    const a = findNodeById(root, fromId);
    const b = findNodeById(root, toId);
    if (!a || !b) return;
    const midX = (a.x + b.x) / 2;
    p.setAttribute("d", `M ${a.x} ${a.y} L ${midX} ${a.y} L ${midX} ${b.y} L ${b.x} ${b.y}`);
  });
}

/* =========================================================
   NODE OPS
   ========================================================= */
function addChild(parent) {
  pushHistory();
  const id = "n_" + Math.random().toString(36).slice(2, 8);
  const newNode = {
    id,
    title: "NEW NODE",
    url: null,
    notes: [],
    children: [],
    _open: true,
    x: (parent.x || 0) + 240,
    y: (parent.y || 0) + 60
  };
  parent.children.push(newNode);
  parent._open = true;
  state.selected = id;
  state.meta[state.active].count = countNodes(state.trees[state.active]);
  state.meta[state.active].depth = maxDepth(state.trees[state.active]);
  renderStage();
  renderSidebar();
  saveState();
  toast("NODE ADDED");
  // auto-focus + select the new title so the user can immediately rename
  setTimeout(() => {
    const titleEl = document.querySelector(`.node[data-id="${id}"] .node__title`);
    if (titleEl) {
      titleEl.focus();
      const range = document.createRange();
      range.selectNodeContents(titleEl);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }, 30);
}
function delNode(n) {
  const root = state.trees[state.active];
  if (n === root) {
    toast("CANNOT DELETE ROOT");
    return;
  }
  const proceed = () => {
    pushHistory();
    const p = findParent(root, n.id);
    if (!p) return;
    p.children = p.children.filter(c => c !== n);
    state.selected = null;
    state.meta[state.active].count = countNodes(root);
    state.meta[state.active].depth = maxDepth(root);
    renderStage();
    renderSidebar();
    saveState();
    toast("DELETED");
  };
  if (window.exModal && window.exModal.confirm) {
    window.exModal.confirm({
      title: "DELETE NODE",
      message: `“${(n.title || "Untitled").slice(0, 40)}” and all children will be removed.`,
      okLabel: "DELETE",
      danger: true
    }).then(ok => {
      if (ok) proceed();
    });
    return;
  }
  if (!confirm("Delete this node and all children?")) return;
  proceed();
}
function editURL(n) {
  if (window.exModal && window.exModal.prompt) {
    window.exModal.prompt({
      title: "URL",
      label: "URL",
      value: n.url || "https://"
    }).then(u => {
      if (u === null) return;
      pushHistory();
      n.url = u.trim() || null;
      renderStage();
      saveState();
    });
    return;
  }
  const u = prompt("URL:", n.url || "https://");
  if (u === null) return;
  pushHistory();
  n.url = u.trim() || null;
  renderStage();
  saveState();
}
function pickThumb(n) {
  const inp = document.createElement("input");
  inp.type = "file";
  inp.accept = "image/*";
  inp.onchange = async () => {
    const f = inp.files[0];
    if (!f) return;
    pushHistory();
    n.thumb = await fileToDataURL(f);
    renderStage();
    saveState();
    toast("IMAGE ATTACHED");
  };
  inp.click();
}
function fileToDataURL(f) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(f);
  });
}

/* =========================================================
   CRUMBS
   ========================================================= */
function updateCrumbs() {
  const cat = CATEGORIES.find(c => c.id === state.active);
  const root = state.trees[state.active];
  const meta = state.meta[state.active];
  const sel = state.selected ? findNodeById(root, state.selected) : null;
  const c = $(".hd__crumbs");
  c.innerHTML = "";
  c.appendChild(el("span", {
    class: "coord"
  }, "M/" + String(CATEGORIES.indexOf(cat)).padStart(2, "0")));
  c.appendChild(el("span", {
    class: "sep"
  }, "/"));
  c.appendChild(el("span", {}, cat.label));
  c.appendChild(el("span", {
    class: "sep"
  }, "—"));
  c.appendChild(el("span", {
    class: "coord"
  }, "N=" + meta.count + " · D=" + meta.depth));
  c.appendChild(el("span", {
    class: "sep"
  }, "—"));
  c.appendChild(el("span", {
    class: "pin"
  }, sel ? "SEL: " + (sel.title || "").slice(0, 30) : "—"));
  $$(".foot .v").forEach((e, i) => {
    if (i === 0) e.textContent = cat.label;
    if (i === 1) e.textContent = "N=" + meta.count;
    if (i === 2) e.textContent = "Z=" + Math.round(getView().k * 100) + "%";
  });
}

/* =========================================================
   TWEAKS  (draggable panel)
   ========================================================= */
function applyTheme() {
  document.documentElement.setAttribute("data-theme", state.theme);
  document.documentElement.style.setProperty("--acc", ACCENTS[state.accent] || ACCENTS.lime);
  document.documentElement.style.setProperty("--acc-ink", state.accent === "ink" ? "#ffffff" : "#0a0a0a");
  // accent color for use ON the dark root slab — falls back to light when accent itself is ink
  document.documentElement.style.setProperty("--acc-link", state.accent === "ink" ? "#f2f2ef" : ACCENTS[state.accent] || ACCENTS.lime);
}
function renderTweaks() {
  const tw = $(".tw");
  tw.innerHTML = "";
  // position from state
  if (state.twPos.left != null) {
    tw.style.left = state.twPos.left + "px";
    tw.style.right = "auto";
  } else {
    tw.style.right = (state.twPos.right ?? 16) + "px";
    tw.style.left = "auto";
  }
  if (state.twPos.top != null) {
    tw.style.top = state.twPos.top + "px";
    tw.style.bottom = "auto";
  } else {
    tw.style.bottom = (state.twPos.bottom ?? 48) + "px";
    tw.style.top = "auto";
  }
  const hd = el("div", {
    class: "tw__hd"
  }, el("span", {
    class: "tw__grip"
  }, "··· TWEAKS"), el("button", {
    class: "x",
    onclick: () => closeTweaks()
  }, "×"));
  tw.appendChild(hd);
  attachTwDrag(hd);
  const body = el("div", {
    class: "tw__body"
  });
  body.appendChild(makeSeg("THEME", ["light", "white"], state.theme, v => {
    state.theme = v;
    applyTheme();
    saveState();
    renderTweaks();
  }));
  body.appendChild(makeSwatch("ACCENT", state.accent, v => {
    state.accent = v;
    applyTheme();
    saveState();
    renderTweaks();
  }));
  body.appendChild(makeSeg("COORDS", ["off", "on"], state.showCoords ? "on" : "off", v => {
    state.showCoords = v === "on";
    saveState();
    $(".stg")?.classList.toggle("show-coords", state.showCoords);
    renderTweaks();
  }));
  body.appendChild(makeSeg("NODE", ["block", "minimal"], state.nodeStyle, v => {
    state.nodeStyle = v;
    saveState();
    renderStage();
    renderTweaks();
  }));

  // full reset (with confirm)
  const resetAllBtn = el("button", {
    style: "appearance:none;background:transparent;border:1px dashed var(--mute);padding:8px;font-family:inherit;font-size:9px;letter-spacing:0.08em;text-transform:uppercase;color:var(--mute);cursor:pointer;",
    onclick: () => {
      const proceed = () => {
        localStorage.removeItem(STORE_KEY);
        localStorage.removeItem(CUSTOM_CATS_KEY);
        localStorage.removeItem(CAT_ORDER_KEY);
        localStorage.removeItem(DEFAULT_LAYOUTS_KEY);
        location.reload();
      };
      if (window.exModal && window.exModal.confirm) {
        window.exModal.confirm({
          title: "RESET ALL DATA",
          message: "All maps, custom categories and saved defaults will be erased. This cannot be undone.",
          okLabel: "RESET",
          danger: true
        }).then(ok => {
          if (ok) proceed();
        });
      } else {
        if (confirm("Reset all maps and lose all edits?")) proceed();
      }
    }
  }, "RESET ALL DATA");
  body.appendChild(resetAllBtn);
  tw.appendChild(body);
}
function attachTwDrag(handle) {
  let dragging = false,
    sx = 0,
    sy = 0,
    ol = 0,
    ot = 0;
  handle.style.cursor = "move";
  handle.addEventListener("mousedown", e => {
    if (e.target.closest(".x")) return;
    const tw = $(".tw");
    const r = tw.getBoundingClientRect();
    dragging = true;
    sx = e.clientX;
    sy = e.clientY;
    ol = r.left;
    ot = r.top;
    e.preventDefault();
  });
  window.addEventListener("mousemove", e => {
    if (!dragging) return;
    const tw = $(".tw");
    const nx = ol + (e.clientX - sx);
    const ny = ot + (e.clientY - sy);
    tw.style.left = Math.max(8, Math.min(window.innerWidth - 100, nx)) + "px";
    tw.style.right = "auto";
    tw.style.top = Math.max(8, Math.min(window.innerHeight - 60, ny)) + "px";
    tw.style.bottom = "auto";
  });
  window.addEventListener("mouseup", () => {
    if (!dragging) return;
    dragging = false;
    const tw = $(".tw");
    const r = tw.getBoundingClientRect();
    state.twPos = {
      left: r.left,
      top: r.top
    };
    saveState();
  });
}
function makeSeg(label, opts, current, onPick) {
  const row = el("div", {
    class: "tw__row"
  });
  row.appendChild(el("div", {
    class: "lbl"
  }, el("span", {}, label), el("span", {
    style: "color:var(--ink);"
  }, current.toUpperCase())));
  const seg = el("div", {
    class: "tw__seg"
  });
  opts.forEach(o => {
    const b = el("button", {
      class: o === current ? "on" : "",
      onclick: () => onPick(o)
    }, o.toUpperCase());
    seg.appendChild(b);
  });
  row.appendChild(seg);
  return row;
}
function makeSwatch(label, current, onPick) {
  const row = el("div", {
    class: "tw__row"
  });
  row.appendChild(el("div", {
    class: "lbl"
  }, el("span", {}, label), el("span", {
    style: "color:var(--ink);"
  }, current.toUpperCase())));
  const sw = el("div", {
    class: "tw__sw"
  });
  Object.keys(ACCENTS).forEach(k => {
    const b = el("button", {
      class: k === current ? "on" : "",
      style: `--c:${ACCENTS[k]}`,
      onclick: () => onPick(k),
      title: k
    });
    sw.appendChild(b);
  });
  row.appendChild(sw);
  return row;
}
function openTweaks() {
  $(".tw").classList.add("is-open");
  renderTweaks();
}
function closeTweaks() {
  $(".tw").classList.remove("is-open");
  window.parent.postMessage({
    type: "__edit_mode_dismissed"
  }, "*");
}

/* =========================================================
   IMPORT / EXPORT
   ========================================================= */
function exportJSON() {
  const out = JSON.stringify({
    version: 1,
    trees: state.trees
  }, null, 2);
  download(out, "mindmap-" + Date.now() + ".json", "application/json");
  toast("EXPORTED · JSON");
}
function exportMD() {
  const root = state.trees[state.active];
  let out = "";
  function walk(n, lvl) {
    if (lvl > 0) {
      const hashes = "#".repeat(Math.min(6, lvl));
      const ttl = n.url ? `[${n.title}](${n.url})` : n.title;
      out += `${hashes} ${ttl}\n`;
      (n.notes || []).forEach(t => out += `- ${t}\n`);
    } else {
      const ttl = n.url ? `[${n.title}](${n.url})` : n.title;
      out += `# ${ttl}\n\n`;
    }
    (n.children || []).forEach(c => walk(c, lvl + 1));
  }
  walk(root, 0);
  download(out, state.active + "-" + Date.now() + ".md", "text/markdown");
  toast("EXPORTED · MARKDOWN");
}
function download(content, name, type) {
  const blob = new Blob([content], {
    type
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

/* =========================================================
   IMPORT
   ========================================================= */
function importJSON() {
  const inp = document.createElement("input");
  inp.type = "file";
  inp.accept = ".json,application/json";
  inp.onchange = async () => {
    const f = inp.files[0];
    if (!f) return;
    try {
      const txt = await f.text();
      const data = JSON.parse(txt);
      if (!data.trees) {
        toast("INVALID JSON FORMAT");
        return;
      }
      pushHistory();
      // merge imported trees into state, keeping existing cats intact
      Object.assign(state.trees, data.trees);
      // recalc meta for all cats
      CATEGORIES.forEach(cat => {
        if (state.trees[cat.id]) {
          state.meta[cat.id] = {
            count: countNodes(state.trees[cat.id]),
            depth: maxDepth(state.trees[cat.id])
          };
        }
      });
      renderAll();
      saveState();
      toast("IMPORTED · JSON");
    } catch (e) {
      toast("ERROR · INVALID FILE");
    }
  };
  inp.click();
}
function importMD() {
  const inp = document.createElement("input");
  inp.type = "file";
  inp.accept = ".md,.markdown,text/markdown,text/plain";
  inp.onchange = async () => {
    const f = inp.files[0];
    if (!f) return;
    try {
      const txt = await f.text();
      pushHistory();
      const root = parseMarkdown(txt);
      layoutTree(root);
      state.trees[state.active] = root;
      state.meta[state.active] = {
        count: countNodes(root),
        depth: maxDepth(root)
      };
      // reset view for fresh import
      state.views[state.active] = {
        x: 600,
        y: 400,
        k: 0.85
      };
      renderAll();
      saveState();
      toast("IMPORTED · MARKDOWN");
    } catch (e) {
      toast("ERROR · INVALID FILE");
    }
  };
  inp.click();
}

/* =========================================================
   TOAST
   ========================================================= */
let toastT;
function toast(msg) {
  const t = $(".toast");
  t.innerHTML = `<span class="acc">●</span>${msg}`;
  t.classList.add("show");
  clearTimeout(toastT);
  toastT = setTimeout(() => t.classList.remove("show"), 1600);
}

/* =========================================================
   INIT
   ========================================================= */
function renderAll() {
  applyTheme();
  renderSidebar();
  renderStage();
  updateCrumbs();
  saveState();
}
async function init() {
  await loadAllMaps();
  renderAll();
  attachStagePanZoom();
  $("#btn-add").addEventListener("click", () => {
    const root = state.trees[state.active];
    const parent = state.selected ? findNodeById(root, state.selected) : root;
    addChild(parent || root);
  });
  $("#btn-fit").addEventListener("click", () => {
    const v = getView();
    v.x = window.innerWidth / 2 - 140;
    v.y = window.innerHeight / 2 - 80;
    v.k = 0.7;
    applyTransform(true);
    saveState();
  });
  $("#btn-export").addEventListener("click", exportJSON);
  $("#btn-export-md").addEventListener("click", exportMD);
  $("#btn-import").addEventListener("click", importJSON);
  $("#btn-import-md").addEventListener("click", importMD);
  $("#btn-tweaks").addEventListener("click", () => openTweaks());
  $(".zoom .zin").addEventListener("click", () => {
    const v = getView();
    v.k = Math.min(2.5, v.k * 1.15);
    applyTransform(true);
    saveState();
    updateCrumbs();
  });
  $(".zoom .zout").addEventListener("click", () => {
    const v = getView();
    v.k = Math.max(0.25, v.k / 1.15);
    applyTransform(true);
    saveState();
    updateCrumbs();
  });
  $(".zoom .zfit").addEventListener("click", () => $("#btn-fit").click());

  // initial center
  const stg = $(".stg");
  const v0 = getView();
  if (v0.x === 600 && v0.y === 400) {
    v0.x = stg.clientWidth / 2 - 140;
    v0.y = stg.clientHeight / 2 - 60;
  }
  applyTransform();

  // keyboard shortcuts
  window.addEventListener("keydown", e => {
    if (e.target && (e.target.isContentEditable || /input|textarea/i.test(e.target.tagName))) return;
    const meta = e.ctrlKey || e.metaKey;
    if (meta && !e.shiftKey && e.key.toLowerCase() === "z") {
      e.preventDefault();
      undo();
    } else if (meta && (e.shiftKey && e.key.toLowerCase() === "z" || e.key.toLowerCase() === "y")) {
      e.preventDefault();
      redo();
    }
  });

  // edit mode protocol
  window.addEventListener("message", ev => {
    if (!ev.data) return;
    if (ev.data.type === "__activate_edit_mode") openTweaks();
    if (ev.data.type === "__deactivate_edit_mode") $(".tw").classList.remove("is-open");
  });
  window.parent.postMessage({
    type: "__edit_mode_available"
  }, "*");
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);else init();

/* expose for extras.js */
window.renderAll = renderAll;
window.renderStage = renderStage;
window.renderSidebar = renderSidebar;
window.updateCrumbs = updateCrumbs;
window.applyTransform = applyTransform;
window.pushHistory = pushHistory;
window.saveState = saveState;
window.toast = toast;
window.findNodeById = findNodeById;
window.getView = getView;
})(); } catch (e) { __ds_ns.__errors.push({ path: "app.js", error: String((e && e.message) || e) }); }

// extras.js
try { (() => {
/* =========================================================
   EXTRAS — addons applied alongside app.js
   - Unified MODAL (prompt / confirm / form) — exposed as window.exModal
   - Sidebar: + NEW CATEGORY + reorder up/down + delete custom cat
   - Notes: Enter -> newline, resizable column
   - IMG: 90x90 thumb, hover popup with original-resolution image, DEL-IMG button
   - Header: SAVE / LOAD DEFAULT (per-category layout)
   ========================================================= */

(function () {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const escHtml = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[c]);

  /* =====================================================
     UNIFIED MODAL
     window.exModal.prompt({title,label,value,placeholder})  -> Promise<string|null>
     window.exModal.confirm({title,message,okLabel,cancelLabel,danger}) -> Promise<bool>
     window.exModal.form({title,fields:[{name,label,value}]}) -> Promise<{...}|null>
     ===================================================== */
  const modal = document.createElement("div");
  modal.className = "ex-modal";
  modal.innerHTML = `
    <div class="ex-modal__bg"></div>
    <div class="ex-modal__panel" role="dialog" aria-modal="true">
      <div class="ex-modal__hd">
        <span class="ex-modal__title">DIALOG</span>
        <button class="ex-modal__x" aria-label="Close" type="button">×</button>
      </div>
      <form class="ex-modal__body"></form>
      <div class="ex-modal__ft">
        <button class="ex-modal__cancel" type="button">CANCEL</button>
        <button class="ex-modal__ok" type="button">OK</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  let resolver = null;
  function close(result) {
    modal.classList.remove("is-open");
    if (resolver) {
      const r = resolver;
      resolver = null;
      r(result);
    }
  }
  $(".ex-modal__bg", modal).addEventListener("click", () => close(null));
  $(".ex-modal__x", modal).addEventListener("click", () => close(null));
  $(".ex-modal__cancel", modal).addEventListener("click", () => close(null));
  $(".ex-modal__ok", modal).addEventListener("click", () => submitOk());
  $(".ex-modal__body", modal).addEventListener("submit", e => {
    e.preventDefault();
    submitOk();
  });
  document.addEventListener("keydown", e => {
    if (!modal.classList.contains("is-open")) return;
    if (e.key === "Escape") close(null);
  });
  let _submit = () => true; // returns the result value
  function submitOk() {
    const v = _submit();
    close(v);
  }
  function openConfirm({
    title = "CONFIRM",
    message = "",
    okLabel = "OK",
    cancelLabel = "CANCEL",
    danger = false
  } = {}) {
    return new Promise(resolve => {
      resolver = resolve;
      $(".ex-modal__title", modal).textContent = title;
      $(".ex-modal__body", modal).innerHTML = `<div class="ex-modal__msg">${escHtml(message)}</div>`;
      $(".ex-modal__ok", modal).textContent = okLabel;
      $(".ex-modal__cancel", modal).textContent = cancelLabel;
      $(".ex-modal__ok", modal).classList.toggle("is-danger", !!danger);
      _submit = () => true;
      modal.classList.add("is-open");
      setTimeout(() => $(".ex-modal__ok", modal).focus(), 30);
    });
  }
  function openPrompt({
    title = "INPUT",
    label = "VALUE",
    value = "",
    placeholder = ""
  } = {}) {
    return new Promise(resolve => {
      resolver = resolve;
      $(".ex-modal__title", modal).textContent = title;
      $(".ex-modal__body", modal).innerHTML = `
        <label class="ex-label">${escHtml(label)}</label>
        <input type="text" class="ex-input" value="${escHtml(value)}" placeholder="${escHtml(placeholder)}" />`;
      $(".ex-modal__ok", modal).textContent = "SAVE";
      $(".ex-modal__cancel", modal).textContent = "CANCEL";
      $(".ex-modal__ok", modal).classList.remove("is-danger");
      _submit = () => $(".ex-input", modal).value;
      modal.classList.add("is-open");
      setTimeout(() => {
        const i = $(".ex-input", modal);
        i.focus();
        i.select();
      }, 30);
    });
  }
  function openForm({
    title = "FORM",
    okLabel = "OK",
    fields = []
  } = {}) {
    return new Promise(resolve => {
      resolver = resolve;
      $(".ex-modal__title", modal).textContent = title;
      $(".ex-modal__body", modal).innerHTML = fields.map(f => `
        <label class="ex-label">${escHtml(f.label || f.name)}</label>
        <input type="text" class="ex-input" data-name="${escHtml(f.name)}" value="${escHtml(f.value || "")}" placeholder="${escHtml(f.placeholder || "")}" />`).join("");
      $(".ex-modal__ok", modal).textContent = okLabel;
      $(".ex-modal__cancel", modal).textContent = "CANCEL";
      $(".ex-modal__ok", modal).classList.remove("is-danger");
      _submit = () => {
        const out = {};
        $$(".ex-input", modal).forEach(i => {
          out[i.getAttribute("data-name")] = i.value;
        });
        return out;
      };
      modal.classList.add("is-open");
      setTimeout(() => {
        const i = $(".ex-input", modal);
        if (i) {
          i.focus();
          i.select();
        }
      }, 30);
    });
  }
  window.exModal = {
    prompt: openPrompt,
    confirm: openConfirm,
    form: openForm
  };

  /* =====================================================
     CATEGORY: + NEW + reorder + delete custom
     Relies on window.CATEGORIES (exposed by app.js) and window.state
     ===================================================== */
  const CUSTOM_CATS_KEY = "tdr-mindmap-custom-cats-v1";
  const CAT_ORDER_KEY = "tdr-mindmap-cat-order-v1";
  function persistCustoms() {
    const customs = window.CATEGORIES.filter(c => c.custom);
    try {
      localStorage.setItem(CUSTOM_CATS_KEY, JSON.stringify(customs));
    } catch {}
  }
  function persistOrder() {
    try {
      localStorage.setItem(CAT_ORDER_KEY, JSON.stringify(window.CATEGORIES.map(c => c.id)));
    } catch {}
  }
  async function addCategoryFlow() {
    const r = await openForm({
      title: "NEW CATEGORY",
      okLabel: "CREATE",
      fields: [{
        name: "label",
        label: "LABEL",
        placeholder: "MY · CATEGORY"
      }, {
        name: "sub",
        label: "SUB",
        placeholder: "TAGS / DESCRIPTION"
      }]
    });
    if (!r || !r.label || !r.label.trim()) return;
    const id = "cat_" + Math.random().toString(36).slice(2, 8);
    const cat = {
      id,
      label: r.label.trim().toUpperCase(),
      sub: (r.sub || "").trim().toUpperCase(),
      jp: "",
      custom: true
    };
    window.CATEGORIES.push(cat);
    const root = {
      id: "n_root",
      title: cat.label,
      url: null,
      notes: [],
      children: [],
      level: 0,
      _open: true,
      x: 0,
      y: 0
    };
    window.state.trees[id] = root;
    window.state.meta[id] = {
      count: 1,
      depth: 0
    };
    window.state.active = id;
    window.state.selected = null;
    persistCustoms();
    persistOrder();
    window.saveState && window.saveState();
    window.renderAll && window.renderAll();
    setTimeout(decorateSidebar, 30);
    window.toast && window.toast("CATEGORY ADDED");
  }
  function moveCat(idx, dir) {
    const j = idx + dir;
    const C = window.CATEGORIES;
    if (j < 0 || j >= C.length) return;
    [C[idx], C[j]] = [C[j], C[idx]];
    persistOrder();
    window.renderSidebar && window.renderSidebar();
    setTimeout(decorateSidebar, 10);
  }
  async function delCustomCat(idx) {
    const C = window.CATEGORIES;
    const cat = C[idx];
    if (!cat || !cat.custom) return;
    const ok = await openConfirm({
      title: "DELETE CATEGORY",
      message: `Category “${cat.label}” and its mind map will be removed.`,
      okLabel: "DELETE",
      danger: true
    });
    if (!ok) return;
    C.splice(idx, 1);
    delete window.state.trees[cat.id];
    delete window.state.meta[cat.id];
    if (window.state.active === cat.id) window.state.active = C[0]?.id || "ZBRUSH";
    persistCustoms();
    persistOrder();
    window.saveState && window.saveState();
    window.renderAll && window.renderAll();
    setTimeout(decorateSidebar, 30);
  }
  function decorateSidebar() {
    const list = $(".sb__list");
    if (!list) return;

    // Add "+ NEW CATEGORY" once at top of list
    if (!$(".sb__add")) {
      const add = document.createElement("button");
      add.className = "sb__add";
      add.type = "button";
      add.innerHTML = `<span class="dot"></span>+ NEW CATEGORY`;
      add.addEventListener("click", addCategoryFlow);
      list.parentNode.insertBefore(add, list);
    }

    // Inject reorder/delete controls into each .cat
    $$(".cat", list).forEach((row, i) => {
      if (row.querySelector(".cat__ord")) return;
      const cat = window.CATEGORIES[i];
      const ord = document.createElement("div");
      ord.className = "cat__ord";
      ord.innerHTML = `
        <button class="ord-up" type="button" title="Move up">▲</button>
        <button class="ord-dn" type="button" title="Move down">▼</button>
        ${cat && cat.custom ? `<button class="ord-del" type="button" title="Delete category">×</button>` : ""}`;
      ord.addEventListener("click", e => e.stopPropagation());
      ord.addEventListener("mousedown", e => e.stopPropagation());
      $(".ord-up", ord).addEventListener("click", () => moveCat(i, -1));
      $(".ord-dn", ord).addEventListener("click", () => moveCat(i, +1));
      const delBtn = $(".ord-del", ord);
      if (delBtn) delBtn.addEventListener("click", () => delCustomCat(i));
      row.appendChild(ord);
    });
  }
  function syncNoteBlocks(noteEl) {
    // Determine whether this note has any block-level children.
    let hasBlock = false;
    for (const k of noteEl.children) {
      const t = k.tagName;
      if (t === "DIV" || t === "P") {
        hasBlock = true;
        break;
      }
    }
    if (!hasBlock) {
      noteEl.removeAttribute("data-has-blocks");
      return;
    }
    // Wrap any leading bare text nodes / <br>s into a <div> so the FIRST
    // line also gets the leading "—" dash.
    const firstBlockIdx = [...noteEl.childNodes].findIndex(n => n.nodeType === 1 && (n.tagName === "DIV" || n.tagName === "P"));
    if (firstBlockIdx > 0) {
      const wrap = document.createElement("div");
      const before = [...noteEl.childNodes].slice(0, firstBlockIdx);
      // Drop trailing <br> immediately before the first block (it's the
      // separator the browser inserted)
      while (before.length && before[before.length - 1].nodeName === "BR") {
        before.pop().remove();
      }
      before.forEach(n => wrap.appendChild(n));
      if (wrap.childNodes.length) {
        noteEl.insertBefore(wrap, noteEl.firstChild);
      }
    }
    noteEl.setAttribute("data-has-blocks", "1");
  }
  function enhanceNotes() {
    $$(".node__notes .n").forEach(n => {
      // re-sync block flag on every render pass
      syncNoteBlocks(n);
      if (n.__exEnh) return;
      n.__exEnh = true;
      n.addEventListener("keydown", function (ev) {
        if (ev.key !== "Enter") return;
        if (ev.shiftKey) return; // existing app.js: Shift+Enter -> next slot
        ev.stopImmediatePropagation();
        ev.preventDefault();
        // If the note has no block children yet, wrap current content first
        // so that the first line also gets a dash.
        if (!n.getAttribute("data-has-blocks")) {
          const txt = n.textContent;
          // wipe and rebuild as: <div>{existing}</div><div><br></div>
          n.innerHTML = "";
          const a = document.createElement("div");
          a.textContent = txt;
          const b = document.createElement("div");
          b.appendChild(document.createElement("br"));
          n.appendChild(a);
          n.appendChild(b);
          n.setAttribute("data-has-blocks", "1");
          // place caret at start of new empty block
          const range = document.createRange();
          range.setStart(b, 0);
          range.collapse(true);
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
          // dispatch input so app.js persists
          n.dispatchEvent(new Event("input", {
            bubbles: true
          }));
          return;
        }
        document.execCommand("insertParagraph");
        // re-sync after the browser mutates the DOM
        setTimeout(() => syncNoteBlocks(n), 0);
      }, true);
      n.addEventListener("input", () => {
        // if user deletes back to flat text, drop the flag
        let hasBlock = false;
        for (const k of n.children) {
          const t = k.tagName;
          if (t === "DIV" || t === "P") {
            hasBlock = true;
            break;
          }
        }
        if (!hasBlock) n.removeAttribute("data-has-blocks");else n.setAttribute("data-has-blocks", "1");
      });
    });
  }

  /* =====================================================
     IMG: 90x90 thumb, hover popup, DEL-IMG button
     ===================================================== */
  let popupEl;
  function ensurePopup() {
    if (popupEl) return popupEl;
    popupEl = document.createElement("div");
    popupEl.className = "ex-imgpop";
    popupEl.innerHTML = `<img alt="" />`;
    document.body.appendChild(popupEl);
    return popupEl;
  }
  function attachThumbHover(t) {
    if (t.__exImgHover) return;
    t.__exImgHover = true;
    t.addEventListener("mouseenter", () => {
      const m = (t.style.backgroundImage || "").match(/url\(["']?(.+?)["']?\)/);
      const src = m && m[1];
      if (!src) return;
      const p = ensurePopup();
      const img = p.querySelector("img");
      img.onload = () => {
        const r = t.getBoundingClientRect();
        const pr = p.getBoundingClientRect();
        let x = r.right + 16;
        let y = r.top - 12;
        if (x + pr.width > window.innerWidth - 16) x = r.left - pr.width - 16;
        if (y + pr.height > window.innerHeight - 16) y = window.innerHeight - pr.height - 16;
        if (y < 16) y = 16;
        if (x < 16) x = 16;
        p.style.left = x + "px";
        p.style.top = y + "px";
      };
      img.src = src;
      p.classList.add("show");
    });
    t.addEventListener("mouseleave", () => {
      if (popupEl) popupEl.classList.remove("show");
    });
  }
  function injectImgDelete() {
    $$(".node__actions").forEach(act => {
      if (act.__exImgDel) return;
      act.__exImgDel = true;
      const node = act.closest(".node");
      const id = node && node.getAttribute("data-id");
      if (!id) return;
      const hasThumb = !!node.querySelector(".node__thumb");
      if (!hasThumb) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "del-img";
      btn.textContent = "DEL · IMG";
      btn.addEventListener("click", e => {
        e.stopPropagation();
        const root = window.state && window.state.trees[window.state.active];
        if (!root) return;
        const n = window.findNodeById(root, id);
        if (!n) return;
        window.pushHistory && window.pushHistory();
        delete n.thumb;
        window.renderStage && window.renderStage();
        window.saveState && window.saveState();
        window.toast && window.toast("IMAGE REMOVED");
      });
      // place after IMG button if found
      const imgBtn = [...act.children].find(b => b.textContent && b.textContent.trim() === "IMG");
      if (imgBtn) act.insertBefore(btn, imgBtn.nextSibling);else act.appendChild(btn);
    });
  }
  function enhanceThumbs() {
    $$(".node__thumb").forEach(attachThumbHover);
    injectImgDelete();
  }

  /* =====================================================
     SAVE / LOAD DEFAULT layout per category
     ===================================================== */
  const DEFAULT_LAYOUTS_KEY = "tdr-mindmap-default-layouts-v1";
  function loadLayouts() {
    try {
      return JSON.parse(localStorage.getItem(DEFAULT_LAYOUTS_KEY) || "{}");
    } catch {
      return {};
    }
  }
  function saveLayouts(l) {
    try {
      localStorage.setItem(DEFAULT_LAYOUTS_KEY, JSON.stringify(l));
    } catch {}
  }
  function snapshotLayout(tree) {
    const m = {};
    (function w(n) {
      if (!n) return;
      m[n.id] = {
        x: n.x,
        y: n.y,
        _open: n._open !== false
      };
      (n.children || []).forEach(w);
    })(tree);
    return m;
  }
  function applyLayout(tree, m) {
    if (!m) return;
    (function w(n) {
      if (m[n.id]) {
        n.x = m[n.id].x;
        n.y = m[n.id].y;
        n._open = m[n.id]._open;
      }
      (n.children || []).forEach(w);
    })(tree);
  }
  function saveCurrentDefault() {
    if (!window.state) return;
    const cat = window.state.active;
    const tree = window.state.trees[cat];
    if (!tree) return;
    const view = window.state.views && window.state.views[cat];
    const layouts = loadLayouts();
    layouts[cat] = {
      layout: snapshotLayout(tree),
      view: view ? {
        ...view
      } : null,
      ts: Date.now()
    };
    saveLayouts(layouts);
    window.toast && window.toast("LAYOUT · SAVED · DEFAULT");
  }
  async function restoreDefault() {
    if (!window.state) return;
    const cat = window.state.active;
    const tree = window.state.trees[cat];
    if (!tree) return;
    const layouts = loadLayouts();
    const saved = layouts[cat];
    if (!saved) {
      window.toast && window.toast("NO DEFAULT SAVED");
      return;
    }
    const ok = await openConfirm({
      title: "LOAD DEFAULT LAYOUT",
      message: "Apply the saved default layout for this category? Current node positions will be replaced.",
      okLabel: "LOAD"
    });
    if (!ok) return;
    window.pushHistory && window.pushHistory();
    applyLayout(tree, saved.layout);
    if (saved.view && window.state.views) window.state.views[cat] = {
      ...saved.view
    };
    window.renderStage && window.renderStage();
    window.applyTransform && window.applyTransform(true);
    window.saveState && window.saveState();
    window.toast && window.toast("LAYOUT · RESTORED");
  }
  function injectHeaderButtons() {
    const tools = $(".hd__tools");
    if (!tools || $("#btn-save-default", tools)) return;
    const tweaks = $("#btn-tweaks", tools);
    const mk = (id, label, dotColor, onclick, title) => {
      const b = document.createElement("button");
      b.id = id;
      b.type = "button";
      b.title = title;
      b.innerHTML = `<span class="dot" style="background:${dotColor}"></span>${label}`;
      b.addEventListener("click", onclick);
      return b;
    };
    tools.insertBefore(mk("btn-save-default", "SAVE · DEFAULT", "var(--acc)", saveCurrentDefault, "Save current layout as default for this category"), tweaks);
    tools.insertBefore(mk("btn-load-default", "LOAD · DEFAULT", "var(--ink)", restoreDefault, "Restore saved default layout"), tweaks);
  }

  /* =====================================================
     WHITE-PLATE HUD (per "白地問題" spec)
     - Scattered low-opacity noise glyphs (~50, deterministic per session)
     - Live readout: hovered ID, active ID, cursor coords
     - Ticking timecode + REC dot
     ===================================================== */
  const HUD_NOISE_TOKENS = ["X", "Y", "Z", "ID", "REV", "SET", "TC", "FR", "PT", "L1", "L2", "L3", "L4", "L5", "AR", "ISO", "BTM", "TOP", "MM", "PX", "01", "02", "03", "04", "05", "06", "07", "08", "09", "0A", "1B", "2C", "3D", "4E", "5F", "OK", "NUL", "SET-A", "SET-B", "REF", "//", "—", "·", "▣", "▢"];
  function rand(seed) {
    // mulberry32
    let s = seed >>> 0;
    return function () {
      s = s + 0x6D2B79F5 >>> 0;
      let t = s;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function buildHud() {
    const stg = $(".stg");
    if (!stg) return null;
    let hud = $(".stg__hud", stg);
    if (hud) return hud;
    hud = document.createElement("div");
    hud.className = "stg__hud";
    hud.setAttribute("aria-hidden", "true");

    // corner crosses
    ["tl", "tr", "bl", "br"].forEach(c => {
      const x = document.createElement("div");
      x.className = "hud-crx " + c;
      hud.appendChild(x);
    });

    // timecode + REC
    const tc = document.createElement("div");
    tc.className = "hud-tc";
    tc.textContent = "00:00:00:00";
    hud.appendChild(tc);
    const rec = document.createElement("div");
    rec.className = "hud-rec";
    rec.textContent = "REC · ACTIVE";
    hud.appendChild(rec);

    // sector + scale
    const sec = document.createElement("div");
    sec.className = "hud-sector";
    sec.textContent = "SECTOR · 04 · DAILY";
    hud.appendChild(sec);
    const scale = document.createElement("div");
    scale.className = "hud-scale";
    hud.appendChild(scale);

    // live readout
    const rd = document.createElement("div");
    rd.className = "hud-readout";
    rd.innerHTML = `
      <span class="k">HOV</span><span class="v hud-hov">—</span>
      <span class="k">SEL</span><span class="v hud-sel">—</span>
      <span class="k">CUR</span><span class="v hud-cur">+0000 +0000</span>
      <span class="k">N·D</span><span class="v hud-nd">— · —</span>`;
    hud.appendChild(rd);

    // scatter noise
    const r = rand(0xC8FF1A);
    const N = 56;
    for (let i = 0; i < N; i++) {
      const s = document.createElement("div");
      const cls = i % 11 === 0 ? "hud-noise acc" : i % 3 === 0 ? "hud-noise" : "hud-noise dim";
      s.className = cls;
      const tok = HUD_NOISE_TOKENS[Math.floor(r() * HUD_NOISE_TOKENS.length)];
      const num = String(Math.floor(r() * 9999)).padStart(4, "0");
      s.textContent = i % 5 === 0 ? `${tok}·${num}` : i % 4 === 0 ? num : `${tok}.${String(Math.floor(r() * 99)).padStart(2, "0")}`;
      // keep a ~12% margin from each edge so noise sits "around" content
      s.style.left = (4 + r() * 92).toFixed(2) + "%";
      s.style.top = (8 + r() * 84).toFixed(2) + "%";
      // small rotation on a few for texture
      if (i % 9 === 0) s.style.transform = "rotate(-90deg)";
      hud.appendChild(s);
    }

    // insert AFTER plate, BEFORE viewport (so nodes draw over noise)
    const plate = $(".stg__plate", stg);
    const vp = $(".stg__viewport", stg);
    if (vp) stg.insertBefore(hud, vp);else if (plate && plate.nextSibling) stg.insertBefore(hud, plate.nextSibling);else stg.appendChild(hud);
    return hud;
  }
  function startHudClock() {
    const start = Date.now();
    function pad(n, w = 2) {
      return String(n).padStart(w, "0");
    }
    setInterval(() => {
      const tcEl = document.querySelector(".stg__hud .hud-tc");
      if (!tcEl) return;
      const t = Math.floor((Date.now() - start) / 1000);
      const h = Math.floor(t / 3600);
      const m = Math.floor(t % 3600 / 60);
      const s = t % 60;
      const f = Math.floor((Date.now() - start) % 1000 / 1000 * 24);
      tcEl.textContent = `${pad(h)}:${pad(m)}:${pad(s)}:${pad(f)}`;
    }, 1000 / 12);
  }
  function wireHudReadout() {
    const stg = $(".stg");
    if (!stg || stg.__exHudWired) return;
    stg.__exHudWired = true;
    function setText(sel, txt) {
      const el = document.querySelector(".stg__hud " + sel);
      if (el) el.textContent = txt;
    }
    function fmtCoord(n) {
      const sign = n < 0 ? "-" : "+";
      return sign + String(Math.abs(Math.round(n))).padStart(4, "0");
    }
    stg.addEventListener("mousemove", e => {
      const rect = stg.getBoundingClientRect();
      setText(".hud-cur", `${fmtCoord(e.clientX - rect.left - rect.width / 2)} ${fmtCoord(e.clientY - rect.top - rect.height / 2)}`);
      const overNode = e.target.closest && e.target.closest(".node");
      if (overNode) {
        const id = overNode.getAttribute("data-id") || "—";
        const ttl = (overNode.querySelector(".node__title")?.textContent || "").trim().slice(0, 18) || id;
        setText(".hud-hov", ttl.toUpperCase());
      } else {
        setText(".hud-hov", "—");
      }
    });

    // update SEL + N·D periodically (simpler than hooking app.js events)
    setInterval(() => {
      const sel = document.querySelector(".node.is-selected");
      const selTxt = sel ? (sel.querySelector(".node__title")?.textContent || sel.getAttribute("data-id") || "—").trim().slice(0, 18) : "—";
      setText(".hud-sel", selTxt.toUpperCase());
      const nodes = document.querySelectorAll(".stg__viewport .node").length;
      const depth = (window.state && window.state.meta && window.state.active && window.state.meta[window.state.active]?.depth) ?? "—";
      setText(".hud-nd", `${nodes} · ${depth}`);
    }, 600);
  }

  /* =====================================================
     BOOT
     ===================================================== */
  function tick() {
    decorateSidebar();
    enhanceNotes();
    enhanceThumbs();
    injectHeaderButtons();
    wireRelax();
    if (!document.querySelector(".stg__hud")) {
      const h = buildHud();
      if (h) {
        startHudClock();
        wireHudReadout();
      }
    }
  }

  /* =====================================================
     AUTO COLLISION AVOIDANCE
     After expand/collapse, push overlapping nodes
     vertically so expanded blocks don't sit on top of others.
     ===================================================== */
  const RELAX_GAP = 24; // px vertical gap between nodes (data coords)
  const RELAX_MAX_PASS = 8;
  const RELAX_COL_BIN = 160; // group nodes into column buckets of this width

  function relaxOverlaps() {
    if (!window.state) return false;
    const root = window.state.trees[window.state.active];
    if (!root) return false;
    const view = window.state.views && window.state.views[window.state.active] || {};
    const k = view.k || 1;

    // Collect rendered nodes (skip root)
    const items = [];
    document.querySelectorAll(".stg__viewport .node").forEach(elN => {
      const id = elN.getAttribute("data-id");
      if (!id) return;
      const node = window.findNodeById(root, id);
      if (!node) return;
      if (!node.level && node.id === root.id) return; // skip root
      const r = elN.getBoundingClientRect();
      if (r.height < 2) return; // not visible yet
      const hData = r.height / k;
      items.push({
        node,
        el: elN,
        hData
      });
    });
    if (items.length < 2) return false;

    // Group by approximate x-column
    const cols = new Map();
    items.forEach(it => {
      const key = Math.round(it.node.x / RELAX_COL_BIN);
      const arr = cols.get(key) || [];
      arr.push(it);
      cols.set(key, arr);
    });
    let moved = false;
    cols.forEach(col => {
      if (col.length < 2) return;
      col.sort((a, b) => a.node.y - b.node.y);
      for (let i = 1; i < col.length; i++) {
        const prev = col[i - 1];
        const cur = col[i];
        // node center is at node.y; top/bottom = center ± h/2
        const prevBottom = prev.node.y + prev.hData / 2;
        const curTop = cur.node.y - cur.hData / 2;
        if (curTop < prevBottom + RELAX_GAP) {
          const newY = Math.round((prevBottom + RELAX_GAP + cur.hData / 2) / 8) * 8;
          if (Math.abs(newY - cur.node.y) > 1) {
            cur.node.y = newY;
            cur.el.style.top = newY + "px";
            moved = true;
          }
        }
      }
    });
    return moved;
  }
  function relaxLoop() {
    let pass = 0;
    let anyMoved = false;
    while (pass++ < RELAX_MAX_PASS) {
      if (!relaxOverlaps()) break;
      anyMoved = true;
    }
    if (anyMoved) {
      // Redraw edges + persist; don't re-render entire stage (avoids flicker)
      window.renderStage && window.renderStage();
      window.saveState && window.saveState();
    }
  }

  // Hook into toggleCollapse: after animation completes, relax
  function wireRelax() {
    const stg = $(".stg");
    if (!stg || stg.__exRelaxWired) return;
    stg.__exRelaxWired = true;
    stg.addEventListener("click", e => {
      if (!e.target.closest(".node__tog")) return;
      // Wait for animation to finish: stagger is 30 + i*24ms + 260ms transition
      // Be safe: fire at 500ms and again at 900ms for cascading pushes
      setTimeout(relaxLoop, 500);
      setTimeout(relaxLoop, 900);
    }, true);
    window.relaxOverlaps = relaxLoop;
  }

  /* =====================================================
     READONLY MODE — URL ?readonly or ?readonly=1
     Disables all editing; shows VIEW ONLY badge
     ===================================================== */
  function applyReadonly() {
    const params = new URLSearchParams(window.location.search);
    const isRO = params.has("readonly") || params.get("mode") === "view";
    if (!isRO) return;
    document.body.classList.add("is-readonly");

    // badge
    const badge = document.createElement("div");
    badge.className = "ro-badge";
    badge.textContent = "VIEW ONLY — EDITING DISABLED";
    document.body.appendChild(badge);

    // kill contenteditable on existing + future nodes
    function disableEdits() {
      document.querySelectorAll("[contenteditable='true']").forEach(el => {
        el.setAttribute("contenteditable", "false");
        el.style.cursor = "default";
      });
    }
    disableEdits();
    const roObs = new MutationObserver(disableEdits);
    roObs.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
  function boot() {
    applyReadonly();
    const obs = new MutationObserver(() => {
      clearTimeout(boot._t);
      boot._t = setTimeout(tick, 30);
    });
    obs.observe(document.body, {
      childList: true,
      subtree: true
    });
    setTimeout(tick, 60);
    setTimeout(tick, 400);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);else boot();
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "extras.js", error: String((e && e.message) || e) }); }

// skills/genex-mindmap/app/app.js
try { (() => {
/* =========================================================
   tDR-INSPIRED MINDMAP — APP  (build v8)
   - per-category view state
   - undo/redo
   - collapse toggle
   - draggable tweaks panel
   - layout-only reset
   - high-DPI zoom (no pixelation)
   ========================================================= */

window.CATEGORIES = [{
  id: "ZBRUSH",
  file: "data/ZBRUSH.md",
  label: "ZBRUSH",
  sub: "FLEE / ANIMATION",
  jp: ""
}, {
  id: "3dsmax",
  file: "data/3dsmax.md",
  label: "3DS · MAX",
  sub: "MODEL / LAYOUT / RIG",
  jp: ""
}, {
  id: "design",
  file: "data/design.md",
  label: "DESIGN",
  sub: "SHAPE / COLOR / MOTION",
  jp: ""
}, {
  id: "hud",
  file: "data/hud.md",
  label: "HUD",
  sub: "UI / SCI-FI / SPECS",
  jp: ""
}, {
  id: "music-video",
  file: "data/music-video.md",
  label: "MUSIC · VIDEO",
  sub: "AE / 3D / REFERENCE",
  jp: ""
}, {
  id: "prepro",
  file: "data/prepro.md",
  label: "PRE · PROD",
  sub: "CONCEPT / STORYBOARD",
  jp: "プリプロダクション"
}];
const CATEGORIES = window.CATEGORIES;
window.state = null;
const STORE_KEY = "tdr-mindmap-v4";
const CUSTOM_CATS_KEY = "tdr-mindmap-custom-cats-v1";
const CAT_ORDER_KEY = "tdr-mindmap-cat-order-v1";
const DEFAULT_LAYOUTS_KEY = "tdr-mindmap-default-layouts-v1";

/* Load custom cats + ordering at startup */
(function bootstrapCats() {
  try {
    const customs = JSON.parse(localStorage.getItem(CUSTOM_CATS_KEY) || "[]");
    customs.forEach(c => {
      if (!CATEGORIES.find(x => x.id === c.id)) CATEGORIES.push(c);
    });
    const order = JSON.parse(localStorage.getItem(CAT_ORDER_KEY) || "null");
    if (Array.isArray(order)) {
      const map = new Map(CATEGORIES.map(c => [c.id, c]));
      const reordered = [];
      order.forEach(id => {
        if (map.has(id)) {
          reordered.push(map.get(id));
          map.delete(id);
        }
      });
      map.forEach(c => reordered.push(c));
      CATEGORIES.length = 0;
      reordered.forEach(c => CATEGORIES.push(c));
    }
  } catch {}
})();

/* ---------- markdown parsing ---------- */
function parseMarkdown(md) {
  md = md.replace(/<!--[\s\S]*?-->/g, "");
  const lines = md.split(/\r?\n/);
  let root = null;
  const stack = [];
  let counter = 1;
  const mkId = () => `n_${counter++}`;
  const headRe = /^(#{1,6})\s+(.+)$/;
  const bullRe = /^(\s*)[-*]\s+(.+)$/;
  const numRe = /^(\s*)\d+\.\s+(.+)$/;
  const quoteRe = /^>\s*(.+)$/;
  for (let raw of lines) {
    const line = raw.replace(/\s+$/, "");
    if (!line.trim()) continue;
    const h = line.match(headRe);
    if (h) {
      const lvl = h[1].length;
      let text = h[2].trim();
      // strip leading "1. " "■ " "1) " decorations from heading text
      text = text.replace(/^[■●◆▪︎▸►]\s*/, "").replace(/^\d+[\.\)]\s*/, "").trim();
      if (!root && lvl === 1) {
        const r = makeNode(text, 0, "n_root");
        r.id = "n_root";
        root = r;
        stack.push(root);
        continue;
      }
      if (!root) {
        root = {
          id: "n_root",
          title: "ROOT",
          url: null,
          notes: [],
          children: [],
          level: 0,
          _open: true
        };
        stack.push(root);
      }
      const node = makeNode(text, lvl, mkId());
      while (stack.length && stack[stack.length - 1].level >= lvl) stack.pop();
      const parent = stack[stack.length - 1] || root;
      parent.children.push(node);
      stack.push(node);
      continue;
    }
    const b = line.match(bullRe) || line.match(numRe) || line.match(quoteRe);
    if (b) {
      const text = (b[2] || b[1]).trim();
      const cur = stack[stack.length - 1];
      if (cur && cur.notes.length < 3) cur.notes.push(stripLinks(text));
    }
  }
  if (!root) root = {
    id: "n_root",
    title: "ROOT",
    url: null,
    notes: [],
    children: [],
    level: 0,
    _open: true
  };
  return root;
}
function makeNode(text, level, id) {
  const linkRe = /\[([^\]]+)\]\(([^)]+)\)/;
  let url = null,
    title = text;
  const m = text.match(linkRe);
  if (m) {
    title = m[1];
    url = m[2];
  }
  title = title.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1").trim();
  return {
    id,
    title,
    url,
    notes: [],
    children: [],
    level,
    _open: true
  };
}
function stripLinks(text) {
  return text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1").trim();
}

/* ---------- layout (tidy tree) ---------- */
function layoutTree(root) {
  const COL = 280,
    ROW = 64,
    SNAP = 8;
  let leafCounter = 0;
  function assign(node, depth) {
    node._depth = depth;
    const visKids = node._open !== false ? node.children || [] : [];
    if (visKids.length === 0) {
      node._row = leafCounter++;
      return;
    }
    visKids.forEach(c => assign(c, depth + 1));
    const first = visKids[0],
      last = visKids[visKids.length - 1];
    node._row = (first._row + last._row) / 2;
  }
  assign(root, 0);
  const totalRows = Math.max(1, leafCounter);
  const yCenter = (totalRows - 1) * ROW / 2;
  function place(node) {
    node.x = Math.round(node._depth * COL / SNAP) * SNAP;
    node.y = Math.round((node._row * ROW - yCenter) / SNAP) * SNAP;
    delete node._depth;
    delete node._row;
    (node.children || []).forEach(place);
  }
  place(root);
}

/* ---------- DOM helpers ---------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
function el(tag, attrs = {}, ...children) {
  const e = document.createElement(tag);
  for (const k in attrs) {
    if (k === "class") e.className = attrs[k];else if (k === "style") e.style.cssText = attrs[k];else if (k.startsWith("on")) e.addEventListener(k.slice(2), attrs[k]);else if (attrs[k] != null) e.setAttribute(k, attrs[k]);
  }
  for (const c of children) {
    if (c == null) continue;
    e.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  }
  return e;
}
function hasJP(s) {
  return /[\u3000-\u9fff\uff00-\uffef]/.test(s || "");
}
function fmtCoord(x, y) {
  const sign = n => (n >= 0 ? "+" : "-") + Math.abs(Math.round(n)).toString().padStart(4, "0");
  return `[ X${sign(x)} · Y${sign(y)} ]`;
}
function shortUrl(u) {
  try {
    const url = new URL(u);
    return url.host.replace(/^www\./, "") + (url.pathname === "/" ? "" : url.pathname.slice(0, 24));
  } catch {
    return u.slice(0, 28);
  }
}
function countNodes(root) {
  let n = 0;
  (function w(x) {
    n++;
    (x.children || []).forEach(w);
  })(root);
  return n;
}
function maxDepth(root) {
  let d = 0;
  (function w(x, l) {
    d = Math.max(d, l);
    (x.children || []).forEach(c => w(c, l + 1));
  })(root, 0);
  return d;
}

/* =========================================================
   STATE  (per-category views)
   ========================================================= */
window.state = {
  trees: {},
  meta: {},
  views: {},
  // { catId: {x,y,k} }
  active: "ZBRUSH",
  selected: null,
  theme: "light",
  showCoords: false,
  nodeStyle: "block",
  accent: "yellow",
  twPos: {
    right: 16,
    bottom: 48
  }
};
const state = window.state;
const ACCENTS = {
  yellow: "#ffd400",
  lime: "#c8ff1a",
  pink: "#ff3da6",
  orange: "#ff5a1a",
  ink: "#0a0a0a"
};
function getView() {
  if (!state.views[state.active]) state.views[state.active] = {
    x: 600,
    y: 400,
    k: 0.85
  };
  return state.views[state.active];
}

/* =========================================================
   PERSIST
   ========================================================= */
function saveState() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({
      trees: state.trees,
      views: state.views,
      active: state.active,
      theme: state.theme,
      showCoords: state.showCoords,
      nodeStyle: state.nodeStyle,
      accent: state.accent,
      twPos: state.twPos
    }));
  } catch {}
}
function loadStateRaw() {
  try {
    const r = localStorage.getItem(STORE_KEY);
    return r ? JSON.parse(r) : null;
  } catch {
    return null;
  }
}

/* =========================================================
   UNDO / REDO  (snapshots of trees+views)
   ========================================================= */
const history = {
  past: [],
  future: []
};
const HIST_MAX = 60;
function snapshot() {
  return JSON.stringify({
    trees: state.trees,
    views: state.views
  });
}
function restoreSnap(s) {
  const o = JSON.parse(s);
  state.trees = o.trees;
  state.views = o.views;
}
function pushHistory() {
  history.past.push(snapshot());
  if (history.past.length > HIST_MAX) history.past.shift();
  history.future.length = 0;
}
function undo() {
  if (!history.past.length) return;
  const cur = snapshot();
  const prev = history.past.pop();
  history.future.push(cur);
  restoreSnap(prev);
  renderStage();
  updateCrumbs();
  saveState();
  toast("UNDO");
}
function redo() {
  if (!history.future.length) return;
  const cur = snapshot();
  const nxt = history.future.pop();
  history.past.push(cur);
  restoreSnap(nxt);
  renderStage();
  updateCrumbs();
  saveState();
  toast("REDO");
}

/* =========================================================
   LOAD MAPS
   ========================================================= */
async function loadAllMaps() {
  const stored = loadStateRaw();
  // Drop any orphaned trees from old/removed categories
  if (stored && stored.trees) {
    const ids = new Set(CATEGORIES.map(c => c.id));
    Object.keys(stored.trees).forEach(k => {
      if (!ids.has(k)) delete stored.trees[k];
    });
  }
  for (const cat of CATEGORIES) {
    if (stored && stored.trees && stored.trees[cat.id]) {
      state.trees[cat.id] = stored.trees[cat.id];
    } else if (cat.file) {
      try {
        const res = await fetch(cat.file);
        const txt = await res.text();
        const root = parseMarkdown(txt);
        layoutTree(root);
        state.trees[cat.id] = root;
      } catch (e) {
        state.trees[cat.id] = {
          id: "n_root",
          title: cat.label,
          url: null,
          notes: [],
          children: [],
          level: 0,
          _open: true,
          x: 0,
          y: 0
        };
      }
    } else {
      state.trees[cat.id] = {
        id: "n_root",
        title: cat.label,
        url: null,
        notes: [],
        children: [],
        level: 0,
        _open: true,
        x: 0,
        y: 0
      };
    }
    state.meta[cat.id] = {
      count: countNodes(state.trees[cat.id]),
      depth: maxDepth(state.trees[cat.id])
    };
  }
  if (stored) {
    state.active = stored.active || "ZBRUSH";
    // guard: if saved active no longer matches a registered category, fall back
    if (!CATEGORIES.find(c => c.id === state.active)) state.active = "ZBRUSH";
    state.views = stored.views || {};
    state.theme = (stored.theme === "dark" ? "white" : stored.theme) || "light";
    state.showCoords = !!stored.showCoords;
    state.nodeStyle = stored.nodeStyle || "block";
    state.accent = stored.accent || "yellow";
    state.twPos = stored.twPos || state.twPos;
  }
}

/* =========================================================
   SIDEBAR
   ========================================================= */
function renderSidebar() {
  const list = $(".sb__list");
  list.innerHTML = "";
  CATEGORIES.forEach((cat, i) => {
    const meta = state.meta[cat.id];
    const btn = el("button", {
      class: "cat" + (cat.id === state.active ? " is-active" : ""),
      "data-id": cat.id,
      onclick: () => {
        state.active = cat.id;
        state.selected = null;
        renderAll();
      }
    }, el("div", {
      class: "cat__idx"
    }, String(i).padStart(2, "0")), el("div", {
      class: "cat__body"
    }, el("div", {
      class: "cat__t"
    }, cat.label), el("div", {
      class: "cat__sub"
    }, cat.sub)), el("div", {
      class: "cat__meta"
    }, el("span", {
      class: "n"
    }, "N=" + meta.count), el("span", {}, "D" + meta.depth)));
    list.appendChild(btn);
  });
  const foot = $(".sb__foot");
  if (foot) {
    const total = Object.values(state.meta).reduce((s, m) => s + m.count, 0);
    foot.innerHTML = "";
    foot.appendChild(makeFootRow("DOC", "MINDMAP/2026"));
    foot.appendChild(makeFootRow("NODES", "T=" + total));
    foot.appendChild(makeFootRow("REV", "A2 · ISO 216"));
  }
}
function makeFootRow(k, v) {
  return el("div", {
    class: "row"
  }, el("span", {}, k), el("span", {
    class: "v"
  }, v));
}

/* =========================================================
   STAGE
   ========================================================= */
function renderStage() {
  const root = state.trees[state.active];
  const vp = $(".stg__viewport");
  if (!vp) return;
  vp.innerHTML = "";
  if (!root) return;
  const idx = CATEGORIES.findIndex(c => c.id === state.active);
  const num1 = $(".gh-num1"),
    num2 = $(".gh-num2");
  if (num1) num1.textContent = String(idx).padStart(2, "0");
  if (num2) num2.textContent = idx + 1 + "A";

  // SVG edges (rendered FIRST so nodes layer above)
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "edges");
  svg.style.position = "absolute";
  svg.style.left = "-3000px";
  svg.style.top = "-3000px";
  svg.style.width = "9000px";
  svg.style.height = "9000px";
  svg.setAttribute("viewBox", "-3000 -3000 9000 9000");
  vp.appendChild(svg);

  // visible flat (skip children of collapsed nodes)
  const flat = [];
  (function walk(n, parent) {
    flat.push({
      n,
      parent
    });
    if (n._open !== false) (n.children || []).forEach(c => walk(c, n));
  })(root, null);

  // edges
  flat.forEach(({
    n,
    parent
  }) => {
    if (!parent) return;
    const x1 = parent.x,
      y1 = parent.y;
    const x2 = n.x,
      y2 = n.y;
    const isAccent = parent === root;
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const midX = (x1 + x2) / 2;
    path.setAttribute("d", `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`);
    if (isAccent) path.setAttribute("class", "edge-acc");
    path.setAttribute("data-edge-from", parent.id);
    path.setAttribute("data-edge-to", n.id);
    svg.appendChild(path);
  });

  // nodes
  flat.forEach(({
    n,
    parent
  }, i) => {
    const isRoot = !parent;
    const lvl = computeLevel(n, root);
    const isMin = state.nodeStyle === "minimal";
    const node = el("div", {
      class: "node lvl-" + lvl + (isRoot ? " is-root" : "") + (state.selected === n.id ? " is-selected" : "") + (isMin ? " is-minimal" : "") + (n._open === false ? " is-collapsed" : ""),
      "data-id": n.id,
      style: `left:${n.x}px; top:${n.y}px; transform: translate(-50%, -50%);`
    });
    const idxStr = isRoot ? "ROOT" : padIdx(i, lvl);
    const head = el("div", {
      class: "node__head"
    }, el("span", {
      class: "node__idx"
    }, idxStr), el("span", {
      class: "node__lvl"
    }, "L" + lvl));
    node.appendChild(head);

    // collapse toggle: if node has children
    if ((n.children || []).length > 0 && !isRoot) {
      const tog = el("button", {
        class: "node__tog",
        title: n._open === false ? "Expand" : "Collapse",
        onclick: e => {
          e.stopPropagation();
          toggleCollapse(n);
        }
      }, n._open === false ? "+" : "−");
      node.appendChild(tog);
    }
    if (isRoot && (n.children || []).length > 0) {
      const tog = el("button", {
        class: "node__tog node__tog--root",
        title: n._open === false ? "Expand" : "Collapse",
        onclick: e => {
          e.stopPropagation();
          toggleCollapse(n);
        }
      }, n._open === false ? "+" : "−");
      node.appendChild(tog);
    }
    if (state.nodeStyle === "block" && n.thumb) {
      const t = el("div", {
        class: "node__thumb"
      });
      t.style.backgroundImage = `url(${n.thumb})`;
      node.appendChild(t);
    }
    const body = el("div", {
      class: "node__body"
    });
    const title = el("div", {
      class: "node__title" + (hasJP(n.title) ? " has-jp" : ""),
      contenteditable: "true",
      spellcheck: "false"
    }, n.title || "Untitled");
    title.addEventListener("focus", () => pushHistory());
    title.addEventListener("blur", () => {
      n.title = title.textContent.trim();
      saveState();
    });
    title.addEventListener("keydown", ev => {
      if (ev.key === "Enter") {
        ev.preventDefault();
        title.blur();
      }
    });
    body.appendChild(title);
    if (!isMin) {
      const notes = el("div", {
        class: "node__notes"
      });
      const noteCount = Math.max(1, Math.min(3, (n.notes || []).length || 1));
      for (let ni = 0; ni < noteCount; ni++) {
        const noteText = n.notes && n.notes[ni] || "";
        const noteEl = el("div", {
          class: "n" + (noteText ? "" : " is-empty"),
          contenteditable: "true",
          spellcheck: "false",
          "data-placeholder": "+ NOTE",
          "data-note-idx": String(ni)
        }, noteText);
        noteEl.addEventListener("focus", () => {
          pushHistory();
          noteEl.classList.remove("is-empty");
        });
        noteEl.addEventListener("input", () => {
          const v = noteEl.textContent;
          if (!n.notes) n.notes = [];
          n.notes[ni] = v;
        });
        noteEl.addEventListener("blur", () => {
          const v = noteEl.textContent.trim();
          if (!n.notes) n.notes = [];
          n.notes[ni] = v;
          // trim trailing empties
          while (n.notes.length && !n.notes[n.notes.length - 1]) n.notes.pop();
          if (!v) noteEl.classList.add("is-empty");
          saveState();
        });
        noteEl.addEventListener("keydown", ev => {
          if (ev.key === "Enter") {
            ev.preventDefault();
            // move to next note slot or add new one if room
            const next = noteEl.parentElement.querySelector(`[data-note-idx="${ni + 1}"]`);
            if (next) next.focus();else if (ni < 2) {
              noteEl.blur();
              renderStage();
              // focus newly-rendered last note
              setTimeout(() => {
                const dom = $(`.node[data-id="${n.id}"] [data-note-idx="${ni + 1}"]`);
                if (dom) dom.focus();
              }, 0);
            } else {
              noteEl.blur();
            }
          }
        });
        notes.appendChild(noteEl);
      }
      body.appendChild(notes);
    }
    if (!isMin && (n.url || !isRoot)) {
      const urlRow = el("div", {
        class: "node__url"
      });
      urlRow.appendChild(el("span", {
        class: "lbl"
      }, "URL"));
      const a = n.url ? el("a", {
        href: n.url,
        target: "_blank",
        rel: "noreferrer noopener"
      }, shortUrl(n.url)) : el("span", {
        style: "color:var(--mute);font-style:italic;"
      }, "—");
      urlRow.appendChild(a);
      body.appendChild(urlRow);
    }
    node.appendChild(body);
    node.appendChild(el("div", {
      class: "node__coord"
    }, fmtCoord(n.x, n.y)));
    const actions = el("div", {
      class: "node__actions"
    }, el("button", {
      onclick: e => {
        e.stopPropagation();
        editURL(n);
      }
    }, "URL"), el("button", {
      onclick: e => {
        e.stopPropagation();
        pickThumb(n);
      }
    }, "IMG"), el("button", {
      onclick: e => {
        e.stopPropagation();
        addChild(n);
      }
    }, "+ CHILD"), el("button", {
      class: "del",
      onclick: e => {
        e.stopPropagation();
        delNode(n);
      }
    }, "DEL"));
    node.appendChild(actions);
    attachNodeDrag(node, n);
    node.addEventListener("click", ev => {
      if (ev.target.closest(".node__title")) return;
      if (ev.target.closest(".node__notes")) return;
      if (ev.target.closest(".node__url a")) return;
      if (ev.target.closest(".node__tog")) return;
      ev.stopPropagation();
      state.selected = n.id;
      $$(".node.is-selected").forEach(el => el.classList.remove("is-selected"));
      node.classList.add("is-selected");
      markSelectedEdges(n);
      updateCrumbs();
    });

    // hover: fade non-related, highlight ancestors+descendants+self
    node.addEventListener("mouseenter", () => {
      if (node.classList.contains("dragging")) return;
      const stg = $(".stg");
      stg.classList.add("is-hovering");
      const related = collectRelatedIds(state.trees[state.active], n);
      $$(".node").forEach(el => {
        const id = el.getAttribute("data-id");
        el.classList.toggle("is-related", related.has(id));
        el.classList.toggle("is-hovered", id === n.id);
      });
      // edges: highlight related
      $$(".edges path").forEach(p => {
        const f = p.getAttribute("data-edge-from");
        const t = p.getAttribute("data-edge-to");
        p.classList.toggle("edge-related", related.has(f) && related.has(t));
      });
    });
    node.addEventListener("mouseleave", () => {
      const stg = $(".stg");
      stg.classList.remove("is-hovering");
      $$(".node").forEach(el => el.classList.remove("is-related", "is-hovered"));
      $$(".edges path").forEach(p => p.classList.remove("edge-related"));
    });
    node.addEventListener("dragover", ev => {
      if (ev.dataTransfer && ev.dataTransfer.types && ev.dataTransfer.types.includes("Files")) {
        ev.preventDefault();
        node.classList.add("drop-target");
      }
    });
    node.addEventListener("dragleave", () => node.classList.remove("drop-target"));
    node.addEventListener("drop", async ev => {
      ev.preventDefault();
      node.classList.remove("drop-target");
      const f = ev.dataTransfer.files && ev.dataTransfer.files[0];
      if (f && f.type.startsWith("image/")) {
        pushHistory();
        const url = await fileToDataURL(f);
        n.thumb = url;
        renderStage();
        saveState();
        toast("IMAGE ATTACHED");
      }
    });
    vp.appendChild(node);
  });
  applyTransform();
  $(".stg")?.classList.toggle("show-coords", state.showCoords);
}
function computeLevel(node, root) {
  if (node === root) return 0;
  let lvl = -1;
  (function w(n, l) {
    if (lvl !== -1) return;
    if (n === node) {
      lvl = l;
      return;
    }
    (n.children || []).forEach(c => w(c, l + 1));
  })(root, 0);
  return lvl < 0 ? 0 : lvl;
}
function padIdx(i, lvl) {
  const a = "0123456789ABCDEF";
  return String(lvl) + a[i % 16];
}
function toggleCollapse(n) {
  pushHistory();
  const wasOpen = n._open !== false;
  n._open = wasOpen ? false : true;
  renderStage();
  saveState();
  // Time-staggered reveal on expand: 30~80ms apart
  if (!wasOpen) {
    const root = state.trees[state.active];
    const order = [];
    (function w(node, depth) {
      (node.children || []).forEach((c, i) => {
        order.push({
          id: c.id,
          depth
        });
        w(c, depth + 1);
      });
    })(n, 0);
    order.forEach((o, i) => {
      const dom = $(`.node[data-id="${o.id}"]`);
      if (!dom) return;
      dom.style.opacity = "0";
      dom.style.transform = (dom.style.transform || "") + " translateY(-4px)";
      // base transform from inline style is "translate(-50%, -50%)"
      const base = `translate(-50%, -50%)`;
      dom.style.transform = base + " translateY(-4px)";
      setTimeout(() => {
        dom.style.transition = "opacity 220ms var(--ez), transform 260ms var(--ez)";
        dom.style.opacity = "1";
        dom.style.transform = base;
      }, 30 + i * 24);
    });
  }
  toast(wasOpen ? "COLLAPSED" : "EXPANDED");
}

/* =========================================================
   TRANSFORM
   ========================================================= */
function applyTransform(smooth) {
  const v = getView();
  const vp = $(".stg__viewport");
  if (vp) {
    if (smooth) {
      vp.classList.add("is-smooth");
      clearTimeout(applyTransform._t);
      applyTransform._t = setTimeout(() => vp.classList.remove("is-smooth"), 400);
    } else {
      vp.classList.remove("is-smooth");
    }
    vp.style.transform = `translate(${v.x}px, ${v.y}px) scale(${v.k})`;
  }
  const lvl = $(".zoom .lvl");
  if (lvl) lvl.textContent = Math.round(v.k * 100) + "%";
}
function attachStagePanZoom() {
  const stg = $(".stg");
  let dragging = false,
    sx = 0,
    sy = 0,
    ox = 0,
    oy = 0;
  function startPan(e) {
    // allow pan from anywhere on the stage that's NOT a node, button, panel
    if (e.target.closest(".node")) return;
    if (e.target.closest(".tw")) return;
    if (e.target.closest(".zoom")) return;
    if (e.target.closest(".hint")) return;
    if (e.target.closest(".stg__axis")) return;
    if (e.button !== 0) return;
    dragging = true;
    sx = e.clientX;
    sy = e.clientY;
    const v = getView();
    ox = v.x;
    oy = v.y;
    stg.classList.add("is-panning");
    state.selected = null;
    $$(".node.is-selected").forEach(el => el.classList.remove("is-selected"));
  }
  stg.addEventListener("mousedown", startPan);
  window.addEventListener("mousemove", e => {
    if (!dragging) return;
    const v = getView();
    v.x = ox + (e.clientX - sx);
    v.y = oy + (e.clientY - sy);
    applyTransform();
  });
  window.addEventListener("mouseup", () => {
    if (dragging) {
      dragging = false;
      stg.classList.remove("is-panning");
      saveState();
    }
  });
  stg.addEventListener("wheel", e => {
    e.preventDefault();
    const v = getView();
    const delta = -e.deltaY * 0.0015;
    const newK = Math.min(2.5, Math.max(0.25, v.k * (1 + delta)));
    const rect = stg.getBoundingClientRect();
    const cx = e.clientX - rect.left,
      cy = e.clientY - rect.top;
    const dx = (cx - v.x) / v.k;
    const dy = (cy - v.y) / v.k;
    v.k = newK;
    v.x = cx - dx * newK;
    v.y = cy - dy * newK;
    applyTransform();
    saveState();
  }, {
    passive: false
  });
}

/* =========================================================
   NODE DRAG
   ========================================================= */
function attachNodeDrag(elNode, n) {
  let dragging = false,
    started = false,
    sx = 0,
    sy = 0,
    ox = 0,
    oy = 0;
  elNode.addEventListener("mousedown", e => {
    if (e.target.closest(".node__title")) return;
    if (e.target.closest(".node__notes")) return;
    if (e.target.closest(".node__url a")) return;
    if (e.target.closest(".node__actions")) return;
    if (e.target.closest(".node__tog")) return;
    if (e.button !== 0) return;
    dragging = true;
    started = false;
    sx = e.clientX;
    sy = e.clientY;
    ox = n.x;
    oy = n.y;
    e.stopPropagation();
  });
  window.addEventListener("mousemove", e => {
    if (!dragging) return;
    const k = getView().k;
    const dx = (e.clientX - sx) / k;
    const dy = (e.clientY - sy) / k;
    if (!started && Math.hypot(dx, dy) < 3) return;
    if (!started) {
      started = true;
      pushHistory();
      elNode.classList.add("dragging");
    }
    n.x = Math.round((ox + dx) / 10) * 10;
    n.y = Math.round((oy + dy) / 10) * 10;
    elNode.style.left = n.x + "px";
    elNode.style.top = n.y + "px";
    const cd = elNode.querySelector(".node__coord");
    if (cd) cd.textContent = fmtCoord(n.x, n.y);
    updateEdgesForNode(n);
    if (e.shiftKey) {
      const target = pickNodeAt(e.clientX, e.clientY, n);
      $$(".node.drop-target").forEach(x => x.classList.remove("drop-target"));
      if (target) target.dom.classList.add("drop-target");
    }
  });
  window.addEventListener("mouseup", e => {
    if (!dragging) return;
    if (started && e.shiftKey) {
      const target = pickNodeAt(e.clientX, e.clientY, n);
      if (target && target.node !== n) reparent(n, target.node);
    }
    dragging = false;
    if (started) {
      elNode.classList.remove("dragging");
      $$(".node.drop-target").forEach(x => x.classList.remove("drop-target"));
      saveState();
    }
  });
}
function pickNodeAt(cx, cy, exclude) {
  const els = document.elementsFromPoint(cx, cy);
  for (const e of els) {
    if (!e.classList || !e.classList.contains("node")) continue;
    const id = e.getAttribute("data-id");
    if (!id) continue;
    const node = findNodeById(state.trees[state.active], id);
    if (node && node !== exclude) return {
      dom: e,
      node
    };
  }
  return null;
}
function findNodeById(root, id) {
  if (!root) return null;
  if (root.id === id) return root;
  for (const c of root.children || []) {
    const f = findNodeById(c, id);
    if (f) return f;
  }
  return null;
}

/* collect ancestors + descendants + self for hover fade */
function collectRelatedIds(root, target) {
  const set = new Set();
  // descendants
  (function w(n) {
    set.add(n.id);
    (n.children || []).forEach(w);
  })(target);
  // ancestors
  (function w(n, path) {
    if (n === target) {
      path.forEach(p => set.add(p.id));
      return true;
    }
    for (const c of n.children || []) {
      if (w(c, [...path, n])) return true;
    }
    return false;
  })(root, []);
  return set;
}

/* highlight edges from root → selected node path */
function markSelectedEdges(target) {
  const root = state.trees[state.active];
  $$(".edges path").forEach(p => p.classList.remove("edge-selected"));
  // find ancestor chain
  const chain = [];
  (function w(n, path) {
    if (n === target) {
      chain.push(...path, n);
      return true;
    }
    for (const c of n.children || []) {
      if (w(c, [...path, n])) return true;
    }
    return false;
  })(root, []);
  for (let i = 0; i < chain.length - 1; i++) {
    const a = chain[i],
      b = chain[i + 1];
    $$(`.edges path[data-edge-from="${a.id}"][data-edge-to="${b.id}"]`).forEach(p => p.classList.add("edge-selected"));
  }
}
function findParent(root, id) {
  for (const c of root.children || []) {
    if (c.id === id) return root;
    const f = findParent(c, id);
    if (f) return f;
  }
  return null;
}
function isDescendant(a, b) {
  for (const c of a.children || []) {
    if (c === b) return true;
    if (isDescendant(c, b)) return true;
  }
  return false;
}
function reparent(node, newParent) {
  const root = state.trees[state.active];
  if (node === root || newParent === node) return;
  if (isDescendant(node, newParent)) {
    toast("CIRCULAR · BLOCKED");
    return;
  }
  const oldParent = findParent(root, node.id);
  if (!oldParent) return;
  oldParent.children = oldParent.children.filter(c => c !== node);
  newParent.children.push(node);
  toast("RE · PARENTED");
  renderStage();
  saveState();
}
function updateEdgesForNode(n) {
  const root = state.trees[state.active];
  const svg = $(".stg__viewport .edges");
  if (!svg) return;
  $$(`path[data-edge-to="${n.id}"], path[data-edge-from="${n.id}"]`, svg).forEach(p => {
    const fromId = p.getAttribute("data-edge-from");
    const toId = p.getAttribute("data-edge-to");
    const a = findNodeById(root, fromId);
    const b = findNodeById(root, toId);
    if (!a || !b) return;
    const midX = (a.x + b.x) / 2;
    p.setAttribute("d", `M ${a.x} ${a.y} L ${midX} ${a.y} L ${midX} ${b.y} L ${b.x} ${b.y}`);
  });
}

/* =========================================================
   NODE OPS
   ========================================================= */
function addChild(parent) {
  pushHistory();
  const id = "n_" + Math.random().toString(36).slice(2, 8);
  const newNode = {
    id,
    title: "NEW NODE",
    url: null,
    notes: [],
    children: [],
    _open: true,
    x: (parent.x || 0) + 240,
    y: (parent.y || 0) + 60
  };
  parent.children.push(newNode);
  parent._open = true;
  state.selected = id;
  state.meta[state.active].count = countNodes(state.trees[state.active]);
  state.meta[state.active].depth = maxDepth(state.trees[state.active]);
  renderStage();
  renderSidebar();
  saveState();
  toast("NODE ADDED");
  // auto-focus + select the new title so the user can immediately rename
  setTimeout(() => {
    const titleEl = document.querySelector(`.node[data-id="${id}"] .node__title`);
    if (titleEl) {
      titleEl.focus();
      const range = document.createRange();
      range.selectNodeContents(titleEl);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }, 30);
}
function delNode(n) {
  const root = state.trees[state.active];
  if (n === root) {
    toast("CANNOT DELETE ROOT");
    return;
  }
  const proceed = () => {
    pushHistory();
    const p = findParent(root, n.id);
    if (!p) return;
    p.children = p.children.filter(c => c !== n);
    state.selected = null;
    state.meta[state.active].count = countNodes(root);
    state.meta[state.active].depth = maxDepth(root);
    renderStage();
    renderSidebar();
    saveState();
    toast("DELETED");
  };
  if (window.exModal && window.exModal.confirm) {
    window.exModal.confirm({
      title: "DELETE NODE",
      message: `“${(n.title || "Untitled").slice(0, 40)}” and all children will be removed.`,
      okLabel: "DELETE",
      danger: true
    }).then(ok => {
      if (ok) proceed();
    });
    return;
  }
  if (!confirm("Delete this node and all children?")) return;
  proceed();
}
function editURL(n) {
  if (window.exModal && window.exModal.prompt) {
    window.exModal.prompt({
      title: "URL",
      label: "URL",
      value: n.url || "https://"
    }).then(u => {
      if (u === null) return;
      pushHistory();
      n.url = u.trim() || null;
      renderStage();
      saveState();
    });
    return;
  }
  const u = prompt("URL:", n.url || "https://");
  if (u === null) return;
  pushHistory();
  n.url = u.trim() || null;
  renderStage();
  saveState();
}
function pickThumb(n) {
  const inp = document.createElement("input");
  inp.type = "file";
  inp.accept = "image/*";
  inp.onchange = async () => {
    const f = inp.files[0];
    if (!f) return;
    pushHistory();
    n.thumb = await fileToDataURL(f);
    renderStage();
    saveState();
    toast("IMAGE ATTACHED");
  };
  inp.click();
}
function fileToDataURL(f) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(f);
  });
}

/* =========================================================
   CRUMBS
   ========================================================= */
function updateCrumbs() {
  const cat = CATEGORIES.find(c => c.id === state.active);
  const root = state.trees[state.active];
  const meta = state.meta[state.active];
  const sel = state.selected ? findNodeById(root, state.selected) : null;
  const c = $(".hd__crumbs");
  c.innerHTML = "";
  c.appendChild(el("span", {
    class: "coord"
  }, "M/" + String(CATEGORIES.indexOf(cat)).padStart(2, "0")));
  c.appendChild(el("span", {
    class: "sep"
  }, "/"));
  c.appendChild(el("span", {}, cat.label));
  c.appendChild(el("span", {
    class: "sep"
  }, "—"));
  c.appendChild(el("span", {
    class: "coord"
  }, "N=" + meta.count + " · D=" + meta.depth));
  c.appendChild(el("span", {
    class: "sep"
  }, "—"));
  c.appendChild(el("span", {
    class: "pin"
  }, sel ? "SEL: " + (sel.title || "").slice(0, 30) : "—"));
  $$(".foot .v").forEach((e, i) => {
    if (i === 0) e.textContent = cat.label;
    if (i === 1) e.textContent = "N=" + meta.count;
    if (i === 2) e.textContent = "Z=" + Math.round(getView().k * 100) + "%";
  });
}

/* =========================================================
   TWEAKS  (draggable panel)
   ========================================================= */
function applyTheme() {
  document.documentElement.setAttribute("data-theme", state.theme);
  document.documentElement.style.setProperty("--acc", ACCENTS[state.accent] || ACCENTS.lime);
  document.documentElement.style.setProperty("--acc-ink", state.accent === "ink" ? "#ffffff" : "#0a0a0a");
  // accent color for use ON the dark root slab — falls back to light when accent itself is ink
  document.documentElement.style.setProperty("--acc-link", state.accent === "ink" ? "#f2f2ef" : ACCENTS[state.accent] || ACCENTS.lime);
}
function renderTweaks() {
  const tw = $(".tw");
  tw.innerHTML = "";
  // position from state
  if (state.twPos.left != null) {
    tw.style.left = state.twPos.left + "px";
    tw.style.right = "auto";
  } else {
    tw.style.right = (state.twPos.right ?? 16) + "px";
    tw.style.left = "auto";
  }
  if (state.twPos.top != null) {
    tw.style.top = state.twPos.top + "px";
    tw.style.bottom = "auto";
  } else {
    tw.style.bottom = (state.twPos.bottom ?? 48) + "px";
    tw.style.top = "auto";
  }
  const hd = el("div", {
    class: "tw__hd"
  }, el("span", {
    class: "tw__grip"
  }, "··· TWEAKS"), el("button", {
    class: "x",
    onclick: () => closeTweaks()
  }, "×"));
  tw.appendChild(hd);
  attachTwDrag(hd);
  const body = el("div", {
    class: "tw__body"
  });
  body.appendChild(makeSeg("THEME", ["light", "white"], state.theme, v => {
    state.theme = v;
    applyTheme();
    saveState();
    renderTweaks();
  }));
  body.appendChild(makeSwatch("ACCENT", state.accent, v => {
    state.accent = v;
    applyTheme();
    saveState();
    renderTweaks();
  }));
  body.appendChild(makeSeg("COORDS", ["off", "on"], state.showCoords ? "on" : "off", v => {
    state.showCoords = v === "on";
    saveState();
    $(".stg")?.classList.toggle("show-coords", state.showCoords);
    renderTweaks();
  }));
  body.appendChild(makeSeg("NODE", ["block", "minimal"], state.nodeStyle, v => {
    state.nodeStyle = v;
    saveState();
    renderStage();
    renderTweaks();
  }));

  // full reset (with confirm)
  const resetAllBtn = el("button", {
    style: "appearance:none;background:transparent;border:1px dashed var(--mute);padding:8px;font-family:inherit;font-size:9px;letter-spacing:0.08em;text-transform:uppercase;color:var(--mute);cursor:pointer;",
    onclick: () => {
      const proceed = () => {
        localStorage.removeItem(STORE_KEY);
        localStorage.removeItem(CUSTOM_CATS_KEY);
        localStorage.removeItem(CAT_ORDER_KEY);
        localStorage.removeItem(DEFAULT_LAYOUTS_KEY);
        location.reload();
      };
      if (window.exModal && window.exModal.confirm) {
        window.exModal.confirm({
          title: "RESET ALL DATA",
          message: "All maps, custom categories and saved defaults will be erased. This cannot be undone.",
          okLabel: "RESET",
          danger: true
        }).then(ok => {
          if (ok) proceed();
        });
      } else {
        if (confirm("Reset all maps and lose all edits?")) proceed();
      }
    }
  }, "RESET ALL DATA");
  body.appendChild(resetAllBtn);
  tw.appendChild(body);
}
function attachTwDrag(handle) {
  let dragging = false,
    sx = 0,
    sy = 0,
    ol = 0,
    ot = 0;
  handle.style.cursor = "move";
  handle.addEventListener("mousedown", e => {
    if (e.target.closest(".x")) return;
    const tw = $(".tw");
    const r = tw.getBoundingClientRect();
    dragging = true;
    sx = e.clientX;
    sy = e.clientY;
    ol = r.left;
    ot = r.top;
    e.preventDefault();
  });
  window.addEventListener("mousemove", e => {
    if (!dragging) return;
    const tw = $(".tw");
    const nx = ol + (e.clientX - sx);
    const ny = ot + (e.clientY - sy);
    tw.style.left = Math.max(8, Math.min(window.innerWidth - 100, nx)) + "px";
    tw.style.right = "auto";
    tw.style.top = Math.max(8, Math.min(window.innerHeight - 60, ny)) + "px";
    tw.style.bottom = "auto";
  });
  window.addEventListener("mouseup", () => {
    if (!dragging) return;
    dragging = false;
    const tw = $(".tw");
    const r = tw.getBoundingClientRect();
    state.twPos = {
      left: r.left,
      top: r.top
    };
    saveState();
  });
}
function makeSeg(label, opts, current, onPick) {
  const row = el("div", {
    class: "tw__row"
  });
  row.appendChild(el("div", {
    class: "lbl"
  }, el("span", {}, label), el("span", {
    style: "color:var(--ink);"
  }, current.toUpperCase())));
  const seg = el("div", {
    class: "tw__seg"
  });
  opts.forEach(o => {
    const b = el("button", {
      class: o === current ? "on" : "",
      onclick: () => onPick(o)
    }, o.toUpperCase());
    seg.appendChild(b);
  });
  row.appendChild(seg);
  return row;
}
function makeSwatch(label, current, onPick) {
  const row = el("div", {
    class: "tw__row"
  });
  row.appendChild(el("div", {
    class: "lbl"
  }, el("span", {}, label), el("span", {
    style: "color:var(--ink);"
  }, current.toUpperCase())));
  const sw = el("div", {
    class: "tw__sw"
  });
  Object.keys(ACCENTS).forEach(k => {
    const b = el("button", {
      class: k === current ? "on" : "",
      style: `--c:${ACCENTS[k]}`,
      onclick: () => onPick(k),
      title: k
    });
    sw.appendChild(b);
  });
  row.appendChild(sw);
  return row;
}
function openTweaks() {
  $(".tw").classList.add("is-open");
  renderTweaks();
}
function closeTweaks() {
  $(".tw").classList.remove("is-open");
  window.parent.postMessage({
    type: "__edit_mode_dismissed"
  }, "*");
}

/* =========================================================
   IMPORT / EXPORT
   ========================================================= */
function exportJSON() {
  const out = JSON.stringify({
    version: 1,
    trees: state.trees
  }, null, 2);
  download(out, "mindmap-" + Date.now() + ".json", "application/json");
  toast("EXPORTED · JSON");
}
function exportMD() {
  const root = state.trees[state.active];
  let out = "";
  function walk(n, lvl) {
    if (lvl > 0) {
      const hashes = "#".repeat(Math.min(6, lvl));
      const ttl = n.url ? `[${n.title}](${n.url})` : n.title;
      out += `${hashes} ${ttl}\n`;
      (n.notes || []).forEach(t => out += `- ${t}\n`);
    } else {
      const ttl = n.url ? `[${n.title}](${n.url})` : n.title;
      out += `# ${ttl}\n\n`;
    }
    (n.children || []).forEach(c => walk(c, lvl + 1));
  }
  walk(root, 0);
  download(out, state.active + "-" + Date.now() + ".md", "text/markdown");
  toast("EXPORTED · MARKDOWN");
}
function download(content, name, type) {
  const blob = new Blob([content], {
    type
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

/* =========================================================
   IMPORT
   ========================================================= */
function importJSON() {
  const inp = document.createElement("input");
  inp.type = "file";
  inp.accept = ".json,application/json";
  inp.onchange = async () => {
    const f = inp.files[0];
    if (!f) return;
    try {
      const txt = await f.text();
      const data = JSON.parse(txt);
      if (!data.trees) {
        toast("INVALID JSON FORMAT");
        return;
      }
      pushHistory();
      // merge imported trees into state, keeping existing cats intact
      Object.assign(state.trees, data.trees);
      // recalc meta for all cats
      CATEGORIES.forEach(cat => {
        if (state.trees[cat.id]) {
          state.meta[cat.id] = {
            count: countNodes(state.trees[cat.id]),
            depth: maxDepth(state.trees[cat.id])
          };
        }
      });
      renderAll();
      saveState();
      toast("IMPORTED · JSON");
    } catch (e) {
      toast("ERROR · INVALID FILE");
    }
  };
  inp.click();
}
function importMD() {
  const inp = document.createElement("input");
  inp.type = "file";
  inp.accept = ".md,.markdown,text/markdown,text/plain";
  inp.onchange = async () => {
    const f = inp.files[0];
    if (!f) return;
    try {
      const txt = await f.text();
      pushHistory();
      const root = parseMarkdown(txt);
      layoutTree(root);
      state.trees[state.active] = root;
      state.meta[state.active] = {
        count: countNodes(root),
        depth: maxDepth(root)
      };
      // reset view for fresh import
      state.views[state.active] = {
        x: 600,
        y: 400,
        k: 0.85
      };
      renderAll();
      saveState();
      toast("IMPORTED · MARKDOWN");
    } catch (e) {
      toast("ERROR · INVALID FILE");
    }
  };
  inp.click();
}

/* =========================================================
   TOAST
   ========================================================= */
let toastT;
function toast(msg) {
  const t = $(".toast");
  t.innerHTML = `<span class="acc">●</span>${msg}`;
  t.classList.add("show");
  clearTimeout(toastT);
  toastT = setTimeout(() => t.classList.remove("show"), 1600);
}

/* =========================================================
   INIT
   ========================================================= */
function renderAll() {
  applyTheme();
  renderSidebar();
  renderStage();
  updateCrumbs();
  saveState();
}
async function init() {
  await loadAllMaps();
  renderAll();
  attachStagePanZoom();
  $("#btn-add").addEventListener("click", () => {
    const root = state.trees[state.active];
    const parent = state.selected ? findNodeById(root, state.selected) : root;
    addChild(parent || root);
  });
  $("#btn-fit").addEventListener("click", () => {
    const v = getView();
    v.x = window.innerWidth / 2 - 140;
    v.y = window.innerHeight / 2 - 80;
    v.k = 0.7;
    applyTransform(true);
    saveState();
  });
  $("#btn-export").addEventListener("click", exportJSON);
  $("#btn-export-md").addEventListener("click", exportMD);
  $("#btn-import").addEventListener("click", importJSON);
  $("#btn-import-md").addEventListener("click", importMD);
  $("#btn-tweaks").addEventListener("click", () => openTweaks());
  $(".zoom .zin").addEventListener("click", () => {
    const v = getView();
    v.k = Math.min(2.5, v.k * 1.15);
    applyTransform(true);
    saveState();
    updateCrumbs();
  });
  $(".zoom .zout").addEventListener("click", () => {
    const v = getView();
    v.k = Math.max(0.25, v.k / 1.15);
    applyTransform(true);
    saveState();
    updateCrumbs();
  });
  $(".zoom .zfit").addEventListener("click", () => $("#btn-fit").click());

  // initial center
  const stg = $(".stg");
  const v0 = getView();
  if (v0.x === 600 && v0.y === 400) {
    v0.x = stg.clientWidth / 2 - 140;
    v0.y = stg.clientHeight / 2 - 60;
  }
  applyTransform();

  // keyboard shortcuts
  window.addEventListener("keydown", e => {
    if (e.target && (e.target.isContentEditable || /input|textarea/i.test(e.target.tagName))) return;
    const meta = e.ctrlKey || e.metaKey;
    if (meta && !e.shiftKey && e.key.toLowerCase() === "z") {
      e.preventDefault();
      undo();
    } else if (meta && (e.shiftKey && e.key.toLowerCase() === "z" || e.key.toLowerCase() === "y")) {
      e.preventDefault();
      redo();
    }
  });

  // edit mode protocol
  window.addEventListener("message", ev => {
    if (!ev.data) return;
    if (ev.data.type === "__activate_edit_mode") openTweaks();
    if (ev.data.type === "__deactivate_edit_mode") $(".tw").classList.remove("is-open");
  });
  window.parent.postMessage({
    type: "__edit_mode_available"
  }, "*");
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);else init();

/* expose for extras.js */
window.renderAll = renderAll;
window.renderStage = renderStage;
window.renderSidebar = renderSidebar;
window.updateCrumbs = updateCrumbs;
window.applyTransform = applyTransform;
window.pushHistory = pushHistory;
window.saveState = saveState;
window.toast = toast;
window.findNodeById = findNodeById;
window.getView = getView;
})(); } catch (e) { __ds_ns.__errors.push({ path: "skills/genex-mindmap/app/app.js", error: String((e && e.message) || e) }); }

// skills/genex-mindmap/app/extras.js
try { (() => {
/* =========================================================
   EXTRAS — addons applied alongside app.js
   - Unified MODAL (prompt / confirm / form) — exposed as window.exModal
   - Sidebar: + NEW CATEGORY + reorder up/down + delete custom cat
   - Notes: Enter -> newline, resizable column
   - IMG: 90x90 thumb, hover popup with original-resolution image, DEL-IMG button
   - Header: SAVE / LOAD DEFAULT (per-category layout)
   ========================================================= */

(function () {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const escHtml = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[c]);

  /* =====================================================
     UNIFIED MODAL
     window.exModal.prompt({title,label,value,placeholder})  -> Promise<string|null>
     window.exModal.confirm({title,message,okLabel,cancelLabel,danger}) -> Promise<bool>
     window.exModal.form({title,fields:[{name,label,value}]}) -> Promise<{...}|null>
     ===================================================== */
  const modal = document.createElement("div");
  modal.className = "ex-modal";
  modal.innerHTML = `
    <div class="ex-modal__bg"></div>
    <div class="ex-modal__panel" role="dialog" aria-modal="true">
      <div class="ex-modal__hd">
        <span class="ex-modal__title">DIALOG</span>
        <button class="ex-modal__x" aria-label="Close" type="button">×</button>
      </div>
      <form class="ex-modal__body"></form>
      <div class="ex-modal__ft">
        <button class="ex-modal__cancel" type="button">CANCEL</button>
        <button class="ex-modal__ok" type="button">OK</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  let resolver = null;
  function close(result) {
    modal.classList.remove("is-open");
    if (resolver) {
      const r = resolver;
      resolver = null;
      r(result);
    }
  }
  $(".ex-modal__bg", modal).addEventListener("click", () => close(null));
  $(".ex-modal__x", modal).addEventListener("click", () => close(null));
  $(".ex-modal__cancel", modal).addEventListener("click", () => close(null));
  $(".ex-modal__ok", modal).addEventListener("click", () => submitOk());
  $(".ex-modal__body", modal).addEventListener("submit", e => {
    e.preventDefault();
    submitOk();
  });
  document.addEventListener("keydown", e => {
    if (!modal.classList.contains("is-open")) return;
    if (e.key === "Escape") close(null);
  });
  let _submit = () => true; // returns the result value
  function submitOk() {
    const v = _submit();
    close(v);
  }
  function openConfirm({
    title = "CONFIRM",
    message = "",
    okLabel = "OK",
    cancelLabel = "CANCEL",
    danger = false
  } = {}) {
    return new Promise(resolve => {
      resolver = resolve;
      $(".ex-modal__title", modal).textContent = title;
      $(".ex-modal__body", modal).innerHTML = `<div class="ex-modal__msg">${escHtml(message)}</div>`;
      $(".ex-modal__ok", modal).textContent = okLabel;
      $(".ex-modal__cancel", modal).textContent = cancelLabel;
      $(".ex-modal__ok", modal).classList.toggle("is-danger", !!danger);
      _submit = () => true;
      modal.classList.add("is-open");
      setTimeout(() => $(".ex-modal__ok", modal).focus(), 30);
    });
  }
  function openPrompt({
    title = "INPUT",
    label = "VALUE",
    value = "",
    placeholder = ""
  } = {}) {
    return new Promise(resolve => {
      resolver = resolve;
      $(".ex-modal__title", modal).textContent = title;
      $(".ex-modal__body", modal).innerHTML = `
        <label class="ex-label">${escHtml(label)}</label>
        <input type="text" class="ex-input" value="${escHtml(value)}" placeholder="${escHtml(placeholder)}" />`;
      $(".ex-modal__ok", modal).textContent = "SAVE";
      $(".ex-modal__cancel", modal).textContent = "CANCEL";
      $(".ex-modal__ok", modal).classList.remove("is-danger");
      _submit = () => $(".ex-input", modal).value;
      modal.classList.add("is-open");
      setTimeout(() => {
        const i = $(".ex-input", modal);
        i.focus();
        i.select();
      }, 30);
    });
  }
  function openForm({
    title = "FORM",
    okLabel = "OK",
    fields = []
  } = {}) {
    return new Promise(resolve => {
      resolver = resolve;
      $(".ex-modal__title", modal).textContent = title;
      $(".ex-modal__body", modal).innerHTML = fields.map(f => `
        <label class="ex-label">${escHtml(f.label || f.name)}</label>
        <input type="text" class="ex-input" data-name="${escHtml(f.name)}" value="${escHtml(f.value || "")}" placeholder="${escHtml(f.placeholder || "")}" />`).join("");
      $(".ex-modal__ok", modal).textContent = okLabel;
      $(".ex-modal__cancel", modal).textContent = "CANCEL";
      $(".ex-modal__ok", modal).classList.remove("is-danger");
      _submit = () => {
        const out = {};
        $$(".ex-input", modal).forEach(i => {
          out[i.getAttribute("data-name")] = i.value;
        });
        return out;
      };
      modal.classList.add("is-open");
      setTimeout(() => {
        const i = $(".ex-input", modal);
        if (i) {
          i.focus();
          i.select();
        }
      }, 30);
    });
  }
  window.exModal = {
    prompt: openPrompt,
    confirm: openConfirm,
    form: openForm
  };

  /* =====================================================
     CATEGORY: + NEW + reorder + delete custom
     Relies on window.CATEGORIES (exposed by app.js) and window.state
     ===================================================== */
  const CUSTOM_CATS_KEY = "tdr-mindmap-custom-cats-v1";
  const CAT_ORDER_KEY = "tdr-mindmap-cat-order-v1";
  function persistCustoms() {
    const customs = window.CATEGORIES.filter(c => c.custom);
    try {
      localStorage.setItem(CUSTOM_CATS_KEY, JSON.stringify(customs));
    } catch {}
  }
  function persistOrder() {
    try {
      localStorage.setItem(CAT_ORDER_KEY, JSON.stringify(window.CATEGORIES.map(c => c.id)));
    } catch {}
  }
  async function addCategoryFlow() {
    const r = await openForm({
      title: "NEW CATEGORY",
      okLabel: "CREATE",
      fields: [{
        name: "label",
        label: "LABEL",
        placeholder: "MY · CATEGORY"
      }, {
        name: "sub",
        label: "SUB",
        placeholder: "TAGS / DESCRIPTION"
      }]
    });
    if (!r || !r.label || !r.label.trim()) return;
    const id = "cat_" + Math.random().toString(36).slice(2, 8);
    const cat = {
      id,
      label: r.label.trim().toUpperCase(),
      sub: (r.sub || "").trim().toUpperCase(),
      jp: "",
      custom: true
    };
    window.CATEGORIES.push(cat);
    const root = {
      id: "n_root",
      title: cat.label,
      url: null,
      notes: [],
      children: [],
      level: 0,
      _open: true,
      x: 0,
      y: 0
    };
    window.state.trees[id] = root;
    window.state.meta[id] = {
      count: 1,
      depth: 0
    };
    window.state.active = id;
    window.state.selected = null;
    persistCustoms();
    persistOrder();
    window.saveState && window.saveState();
    window.renderAll && window.renderAll();
    setTimeout(decorateSidebar, 30);
    window.toast && window.toast("CATEGORY ADDED");
  }
  function moveCat(idx, dir) {
    const j = idx + dir;
    const C = window.CATEGORIES;
    if (j < 0 || j >= C.length) return;
    [C[idx], C[j]] = [C[j], C[idx]];
    persistOrder();
    window.renderSidebar && window.renderSidebar();
    setTimeout(decorateSidebar, 10);
  }
  async function delCustomCat(idx) {
    const C = window.CATEGORIES;
    const cat = C[idx];
    if (!cat || !cat.custom) return;
    const ok = await openConfirm({
      title: "DELETE CATEGORY",
      message: `Category “${cat.label}” and its mind map will be removed.`,
      okLabel: "DELETE",
      danger: true
    });
    if (!ok) return;
    C.splice(idx, 1);
    delete window.state.trees[cat.id];
    delete window.state.meta[cat.id];
    if (window.state.active === cat.id) window.state.active = C[0]?.id || "ZBRUSH";
    persistCustoms();
    persistOrder();
    window.saveState && window.saveState();
    window.renderAll && window.renderAll();
    setTimeout(decorateSidebar, 30);
  }
  function decorateSidebar() {
    const list = $(".sb__list");
    if (!list) return;

    // Add "+ NEW CATEGORY" once at top of list
    if (!$(".sb__add")) {
      const add = document.createElement("button");
      add.className = "sb__add";
      add.type = "button";
      add.innerHTML = `<span class="dot"></span>+ NEW CATEGORY`;
      add.addEventListener("click", addCategoryFlow);
      list.parentNode.insertBefore(add, list);
    }

    // Inject reorder/delete controls into each .cat
    $$(".cat", list).forEach((row, i) => {
      if (row.querySelector(".cat__ord")) return;
      const cat = window.CATEGORIES[i];
      const ord = document.createElement("div");
      ord.className = "cat__ord";
      ord.innerHTML = `
        <button class="ord-up" type="button" title="Move up">▲</button>
        <button class="ord-dn" type="button" title="Move down">▼</button>
        ${cat && cat.custom ? `<button class="ord-del" type="button" title="Delete category">×</button>` : ""}`;
      ord.addEventListener("click", e => e.stopPropagation());
      ord.addEventListener("mousedown", e => e.stopPropagation());
      $(".ord-up", ord).addEventListener("click", () => moveCat(i, -1));
      $(".ord-dn", ord).addEventListener("click", () => moveCat(i, +1));
      const delBtn = $(".ord-del", ord);
      if (delBtn) delBtn.addEventListener("click", () => delCustomCat(i));
      row.appendChild(ord);
    });
  }
  function syncNoteBlocks(noteEl) {
    // Determine whether this note has any block-level children.
    let hasBlock = false;
    for (const k of noteEl.children) {
      const t = k.tagName;
      if (t === "DIV" || t === "P") {
        hasBlock = true;
        break;
      }
    }
    if (!hasBlock) {
      noteEl.removeAttribute("data-has-blocks");
      return;
    }
    // Wrap any leading bare text nodes / <br>s into a <div> so the FIRST
    // line also gets the leading "—" dash.
    const firstBlockIdx = [...noteEl.childNodes].findIndex(n => n.nodeType === 1 && (n.tagName === "DIV" || n.tagName === "P"));
    if (firstBlockIdx > 0) {
      const wrap = document.createElement("div");
      const before = [...noteEl.childNodes].slice(0, firstBlockIdx);
      // Drop trailing <br> immediately before the first block (it's the
      // separator the browser inserted)
      while (before.length && before[before.length - 1].nodeName === "BR") {
        before.pop().remove();
      }
      before.forEach(n => wrap.appendChild(n));
      if (wrap.childNodes.length) {
        noteEl.insertBefore(wrap, noteEl.firstChild);
      }
    }
    noteEl.setAttribute("data-has-blocks", "1");
  }
  function enhanceNotes() {
    $$(".node__notes .n").forEach(n => {
      // re-sync block flag on every render pass
      syncNoteBlocks(n);
      if (n.__exEnh) return;
      n.__exEnh = true;
      n.addEventListener("keydown", function (ev) {
        if (ev.key !== "Enter") return;
        if (ev.shiftKey) return; // existing app.js: Shift+Enter -> next slot
        ev.stopImmediatePropagation();
        ev.preventDefault();
        // If the note has no block children yet, wrap current content first
        // so that the first line also gets a dash.
        if (!n.getAttribute("data-has-blocks")) {
          const txt = n.textContent;
          // wipe and rebuild as: <div>{existing}</div><div><br></div>
          n.innerHTML = "";
          const a = document.createElement("div");
          a.textContent = txt;
          const b = document.createElement("div");
          b.appendChild(document.createElement("br"));
          n.appendChild(a);
          n.appendChild(b);
          n.setAttribute("data-has-blocks", "1");
          // place caret at start of new empty block
          const range = document.createRange();
          range.setStart(b, 0);
          range.collapse(true);
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
          // dispatch input so app.js persists
          n.dispatchEvent(new Event("input", {
            bubbles: true
          }));
          return;
        }
        document.execCommand("insertParagraph");
        // re-sync after the browser mutates the DOM
        setTimeout(() => syncNoteBlocks(n), 0);
      }, true);
      n.addEventListener("input", () => {
        // if user deletes back to flat text, drop the flag
        let hasBlock = false;
        for (const k of n.children) {
          const t = k.tagName;
          if (t === "DIV" || t === "P") {
            hasBlock = true;
            break;
          }
        }
        if (!hasBlock) n.removeAttribute("data-has-blocks");else n.setAttribute("data-has-blocks", "1");
      });
    });
  }

  /* =====================================================
     IMG: 90x90 thumb, hover popup, DEL-IMG button
     ===================================================== */
  let popupEl;
  function ensurePopup() {
    if (popupEl) return popupEl;
    popupEl = document.createElement("div");
    popupEl.className = "ex-imgpop";
    popupEl.innerHTML = `<img alt="" />`;
    document.body.appendChild(popupEl);
    return popupEl;
  }
  function attachThumbHover(t) {
    if (t.__exImgHover) return;
    t.__exImgHover = true;
    t.addEventListener("mouseenter", () => {
      const m = (t.style.backgroundImage || "").match(/url\(["']?(.+?)["']?\)/);
      const src = m && m[1];
      if (!src) return;
      const p = ensurePopup();
      const img = p.querySelector("img");
      img.onload = () => {
        const r = t.getBoundingClientRect();
        const pr = p.getBoundingClientRect();
        let x = r.right + 16;
        let y = r.top - 12;
        if (x + pr.width > window.innerWidth - 16) x = r.left - pr.width - 16;
        if (y + pr.height > window.innerHeight - 16) y = window.innerHeight - pr.height - 16;
        if (y < 16) y = 16;
        if (x < 16) x = 16;
        p.style.left = x + "px";
        p.style.top = y + "px";
      };
      img.src = src;
      p.classList.add("show");
    });
    t.addEventListener("mouseleave", () => {
      if (popupEl) popupEl.classList.remove("show");
    });
  }
  function injectImgDelete() {
    $$(".node__actions").forEach(act => {
      if (act.__exImgDel) return;
      act.__exImgDel = true;
      const node = act.closest(".node");
      const id = node && node.getAttribute("data-id");
      if (!id) return;
      const hasThumb = !!node.querySelector(".node__thumb");
      if (!hasThumb) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "del-img";
      btn.textContent = "DEL · IMG";
      btn.addEventListener("click", e => {
        e.stopPropagation();
        const root = window.state && window.state.trees[window.state.active];
        if (!root) return;
        const n = window.findNodeById(root, id);
        if (!n) return;
        window.pushHistory && window.pushHistory();
        delete n.thumb;
        window.renderStage && window.renderStage();
        window.saveState && window.saveState();
        window.toast && window.toast("IMAGE REMOVED");
      });
      // place after IMG button if found
      const imgBtn = [...act.children].find(b => b.textContent && b.textContent.trim() === "IMG");
      if (imgBtn) act.insertBefore(btn, imgBtn.nextSibling);else act.appendChild(btn);
    });
  }
  function enhanceThumbs() {
    $$(".node__thumb").forEach(attachThumbHover);
    injectImgDelete();
  }

  /* =====================================================
     SAVE / LOAD DEFAULT layout per category
     ===================================================== */
  const DEFAULT_LAYOUTS_KEY = "tdr-mindmap-default-layouts-v1";
  function loadLayouts() {
    try {
      return JSON.parse(localStorage.getItem(DEFAULT_LAYOUTS_KEY) || "{}");
    } catch {
      return {};
    }
  }
  function saveLayouts(l) {
    try {
      localStorage.setItem(DEFAULT_LAYOUTS_KEY, JSON.stringify(l));
    } catch {}
  }
  function snapshotLayout(tree) {
    const m = {};
    (function w(n) {
      if (!n) return;
      m[n.id] = {
        x: n.x,
        y: n.y,
        _open: n._open !== false
      };
      (n.children || []).forEach(w);
    })(tree);
    return m;
  }
  function applyLayout(tree, m) {
    if (!m) return;
    (function w(n) {
      if (m[n.id]) {
        n.x = m[n.id].x;
        n.y = m[n.id].y;
        n._open = m[n.id]._open;
      }
      (n.children || []).forEach(w);
    })(tree);
  }
  function saveCurrentDefault() {
    if (!window.state) return;
    const cat = window.state.active;
    const tree = window.state.trees[cat];
    if (!tree) return;
    const view = window.state.views && window.state.views[cat];
    const layouts = loadLayouts();
    layouts[cat] = {
      layout: snapshotLayout(tree),
      view: view ? {
        ...view
      } : null,
      ts: Date.now()
    };
    saveLayouts(layouts);
    window.toast && window.toast("LAYOUT · SAVED · DEFAULT");
  }
  async function restoreDefault() {
    if (!window.state) return;
    const cat = window.state.active;
    const tree = window.state.trees[cat];
    if (!tree) return;
    const layouts = loadLayouts();
    const saved = layouts[cat];
    if (!saved) {
      window.toast && window.toast("NO DEFAULT SAVED");
      return;
    }
    const ok = await openConfirm({
      title: "LOAD DEFAULT LAYOUT",
      message: "Apply the saved default layout for this category? Current node positions will be replaced.",
      okLabel: "LOAD"
    });
    if (!ok) return;
    window.pushHistory && window.pushHistory();
    applyLayout(tree, saved.layout);
    if (saved.view && window.state.views) window.state.views[cat] = {
      ...saved.view
    };
    window.renderStage && window.renderStage();
    window.applyTransform && window.applyTransform(true);
    window.saveState && window.saveState();
    window.toast && window.toast("LAYOUT · RESTORED");
  }
  function injectHeaderButtons() {
    const tools = $(".hd__tools");
    if (!tools || $("#btn-save-default", tools)) return;
    const tweaks = $("#btn-tweaks", tools);
    const mk = (id, label, dotColor, onclick, title) => {
      const b = document.createElement("button");
      b.id = id;
      b.type = "button";
      b.title = title;
      b.innerHTML = `<span class="dot" style="background:${dotColor}"></span>${label}`;
      b.addEventListener("click", onclick);
      return b;
    };
    tools.insertBefore(mk("btn-save-default", "SAVE · DEFAULT", "var(--acc)", saveCurrentDefault, "Save current layout as default for this category"), tweaks);
    tools.insertBefore(mk("btn-load-default", "LOAD · DEFAULT", "var(--ink)", restoreDefault, "Restore saved default layout"), tweaks);
  }

  /* =====================================================
     WHITE-PLATE HUD (per "白地問題" spec)
     - Scattered low-opacity noise glyphs (~50, deterministic per session)
     - Live readout: hovered ID, active ID, cursor coords
     - Ticking timecode + REC dot
     ===================================================== */
  const HUD_NOISE_TOKENS = ["X", "Y", "Z", "ID", "REV", "SET", "TC", "FR", "PT", "L1", "L2", "L3", "L4", "L5", "AR", "ISO", "BTM", "TOP", "MM", "PX", "01", "02", "03", "04", "05", "06", "07", "08", "09", "0A", "1B", "2C", "3D", "4E", "5F", "OK", "NUL", "SET-A", "SET-B", "REF", "//", "—", "·", "▣", "▢"];
  function rand(seed) {
    // mulberry32
    let s = seed >>> 0;
    return function () {
      s = s + 0x6D2B79F5 >>> 0;
      let t = s;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function buildHud() {
    const stg = $(".stg");
    if (!stg) return null;
    let hud = $(".stg__hud", stg);
    if (hud) return hud;
    hud = document.createElement("div");
    hud.className = "stg__hud";
    hud.setAttribute("aria-hidden", "true");

    // corner crosses
    ["tl", "tr", "bl", "br"].forEach(c => {
      const x = document.createElement("div");
      x.className = "hud-crx " + c;
      hud.appendChild(x);
    });

    // timecode + REC
    const tc = document.createElement("div");
    tc.className = "hud-tc";
    tc.textContent = "00:00:00:00";
    hud.appendChild(tc);
    const rec = document.createElement("div");
    rec.className = "hud-rec";
    rec.textContent = "REC · ACTIVE";
    hud.appendChild(rec);

    // sector + scale
    const sec = document.createElement("div");
    sec.className = "hud-sector";
    sec.textContent = "SECTOR · 04 · DAILY";
    hud.appendChild(sec);
    const scale = document.createElement("div");
    scale.className = "hud-scale";
    hud.appendChild(scale);

    // live readout
    const rd = document.createElement("div");
    rd.className = "hud-readout";
    rd.innerHTML = `
      <span class="k">HOV</span><span class="v hud-hov">—</span>
      <span class="k">SEL</span><span class="v hud-sel">—</span>
      <span class="k">CUR</span><span class="v hud-cur">+0000 +0000</span>
      <span class="k">N·D</span><span class="v hud-nd">— · —</span>`;
    hud.appendChild(rd);

    // scatter noise
    const r = rand(0xC8FF1A);
    const N = 56;
    for (let i = 0; i < N; i++) {
      const s = document.createElement("div");
      const cls = i % 11 === 0 ? "hud-noise acc" : i % 3 === 0 ? "hud-noise" : "hud-noise dim";
      s.className = cls;
      const tok = HUD_NOISE_TOKENS[Math.floor(r() * HUD_NOISE_TOKENS.length)];
      const num = String(Math.floor(r() * 9999)).padStart(4, "0");
      s.textContent = i % 5 === 0 ? `${tok}·${num}` : i % 4 === 0 ? num : `${tok}.${String(Math.floor(r() * 99)).padStart(2, "0")}`;
      // keep a ~12% margin from each edge so noise sits "around" content
      s.style.left = (4 + r() * 92).toFixed(2) + "%";
      s.style.top = (8 + r() * 84).toFixed(2) + "%";
      // small rotation on a few for texture
      if (i % 9 === 0) s.style.transform = "rotate(-90deg)";
      hud.appendChild(s);
    }

    // insert AFTER plate, BEFORE viewport (so nodes draw over noise)
    const plate = $(".stg__plate", stg);
    const vp = $(".stg__viewport", stg);
    if (vp) stg.insertBefore(hud, vp);else if (plate && plate.nextSibling) stg.insertBefore(hud, plate.nextSibling);else stg.appendChild(hud);
    return hud;
  }
  function startHudClock() {
    const start = Date.now();
    function pad(n, w = 2) {
      return String(n).padStart(w, "0");
    }
    setInterval(() => {
      const tcEl = document.querySelector(".stg__hud .hud-tc");
      if (!tcEl) return;
      const t = Math.floor((Date.now() - start) / 1000);
      const h = Math.floor(t / 3600);
      const m = Math.floor(t % 3600 / 60);
      const s = t % 60;
      const f = Math.floor((Date.now() - start) % 1000 / 1000 * 24);
      tcEl.textContent = `${pad(h)}:${pad(m)}:${pad(s)}:${pad(f)}`;
    }, 1000 / 12);
  }
  function wireHudReadout() {
    const stg = $(".stg");
    if (!stg || stg.__exHudWired) return;
    stg.__exHudWired = true;
    function setText(sel, txt) {
      const el = document.querySelector(".stg__hud " + sel);
      if (el) el.textContent = txt;
    }
    function fmtCoord(n) {
      const sign = n < 0 ? "-" : "+";
      return sign + String(Math.abs(Math.round(n))).padStart(4, "0");
    }
    stg.addEventListener("mousemove", e => {
      const rect = stg.getBoundingClientRect();
      setText(".hud-cur", `${fmtCoord(e.clientX - rect.left - rect.width / 2)} ${fmtCoord(e.clientY - rect.top - rect.height / 2)}`);
      const overNode = e.target.closest && e.target.closest(".node");
      if (overNode) {
        const id = overNode.getAttribute("data-id") || "—";
        const ttl = (overNode.querySelector(".node__title")?.textContent || "").trim().slice(0, 18) || id;
        setText(".hud-hov", ttl.toUpperCase());
      } else {
        setText(".hud-hov", "—");
      }
    });

    // update SEL + N·D periodically (simpler than hooking app.js events)
    setInterval(() => {
      const sel = document.querySelector(".node.is-selected");
      const selTxt = sel ? (sel.querySelector(".node__title")?.textContent || sel.getAttribute("data-id") || "—").trim().slice(0, 18) : "—";
      setText(".hud-sel", selTxt.toUpperCase());
      const nodes = document.querySelectorAll(".stg__viewport .node").length;
      const depth = (window.state && window.state.meta && window.state.active && window.state.meta[window.state.active]?.depth) ?? "—";
      setText(".hud-nd", `${nodes} · ${depth}`);
    }, 600);
  }

  /* =====================================================
     BOOT
     ===================================================== */
  function tick() {
    decorateSidebar();
    enhanceNotes();
    enhanceThumbs();
    injectHeaderButtons();
    wireRelax();
    if (!document.querySelector(".stg__hud")) {
      const h = buildHud();
      if (h) {
        startHudClock();
        wireHudReadout();
      }
    }
  }

  /* =====================================================
     AUTO COLLISION AVOIDANCE
     After expand/collapse, push overlapping nodes
     vertically so expanded blocks don't sit on top of others.
     ===================================================== */
  const RELAX_GAP = 24; // px vertical gap between nodes (data coords)
  const RELAX_MAX_PASS = 8;
  const RELAX_COL_BIN = 160; // group nodes into column buckets of this width

  function relaxOverlaps() {
    if (!window.state) return false;
    const root = window.state.trees[window.state.active];
    if (!root) return false;
    const view = window.state.views && window.state.views[window.state.active] || {};
    const k = view.k || 1;

    // Collect rendered nodes (skip root)
    const items = [];
    document.querySelectorAll(".stg__viewport .node").forEach(elN => {
      const id = elN.getAttribute("data-id");
      if (!id) return;
      const node = window.findNodeById(root, id);
      if (!node) return;
      if (!node.level && node.id === root.id) return; // skip root
      const r = elN.getBoundingClientRect();
      if (r.height < 2) return; // not visible yet
      const hData = r.height / k;
      items.push({
        node,
        el: elN,
        hData
      });
    });
    if (items.length < 2) return false;

    // Group by approximate x-column
    const cols = new Map();
    items.forEach(it => {
      const key = Math.round(it.node.x / RELAX_COL_BIN);
      const arr = cols.get(key) || [];
      arr.push(it);
      cols.set(key, arr);
    });
    let moved = false;
    cols.forEach(col => {
      if (col.length < 2) return;
      col.sort((a, b) => a.node.y - b.node.y);
      for (let i = 1; i < col.length; i++) {
        const prev = col[i - 1];
        const cur = col[i];
        // node center is at node.y; top/bottom = center ± h/2
        const prevBottom = prev.node.y + prev.hData / 2;
        const curTop = cur.node.y - cur.hData / 2;
        if (curTop < prevBottom + RELAX_GAP) {
          const newY = Math.round((prevBottom + RELAX_GAP + cur.hData / 2) / 8) * 8;
          if (Math.abs(newY - cur.node.y) > 1) {
            cur.node.y = newY;
            cur.el.style.top = newY + "px";
            moved = true;
          }
        }
      }
    });
    return moved;
  }
  function relaxLoop() {
    let pass = 0;
    let anyMoved = false;
    while (pass++ < RELAX_MAX_PASS) {
      if (!relaxOverlaps()) break;
      anyMoved = true;
    }
    if (anyMoved) {
      // Redraw edges + persist; don't re-render entire stage (avoids flicker)
      window.renderStage && window.renderStage();
      window.saveState && window.saveState();
    }
  }

  // Hook into toggleCollapse: after animation completes, relax
  function wireRelax() {
    const stg = $(".stg");
    if (!stg || stg.__exRelaxWired) return;
    stg.__exRelaxWired = true;
    stg.addEventListener("click", e => {
      if (!e.target.closest(".node__tog")) return;
      // Wait for animation to finish: stagger is 30 + i*24ms + 260ms transition
      // Be safe: fire at 500ms and again at 900ms for cascading pushes
      setTimeout(relaxLoop, 500);
      setTimeout(relaxLoop, 900);
    }, true);
    window.relaxOverlaps = relaxLoop;
  }

  /* =====================================================
     READONLY MODE — URL ?readonly or ?readonly=1
     Disables all editing; shows VIEW ONLY badge
     ===================================================== */
  function applyReadonly() {
    const params = new URLSearchParams(window.location.search);
    const isRO = params.has("readonly") || params.get("mode") === "view";
    if (!isRO) return;
    document.body.classList.add("is-readonly");

    // badge
    const badge = document.createElement("div");
    badge.className = "ro-badge";
    badge.textContent = "VIEW ONLY — EDITING DISABLED";
    document.body.appendChild(badge);

    // kill contenteditable on existing + future nodes
    function disableEdits() {
      document.querySelectorAll("[contenteditable='true']").forEach(el => {
        el.setAttribute("contenteditable", "false");
        el.style.cursor = "default";
      });
    }
    disableEdits();
    const roObs = new MutationObserver(disableEdits);
    roObs.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
  function boot() {
    applyReadonly();
    const obs = new MutationObserver(() => {
      clearTimeout(boot._t);
      boot._t = setTimeout(tick, 30);
    });
    obs.observe(document.body, {
      childList: true,
      subtree: true
    });
    setTimeout(tick, 60);
    setTimeout(tick, 400);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);else boot();
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "skills/genex-mindmap/app/extras.js", error: String((e && e.message) || e) }); }

// skills/genex-mindmap/app/wipeout.js
try { (() => {
/* =========================================================
   WIPEOUT / tDR UI integration
   - bg canvas: drifting measurement grid (always-on subtle motion)
   - fx canvas: state-driven edge lines (glow + persistence/trails)
   - state: { t, hoverId, activeId, nodes, edges, settings }
   - syncs node positions from DOM (existing layout intact)
   - hides existing SVG edges (renders them via canvas instead)
   ========================================================= */

(function () {
  "use strict";

  const wState = {
    t: 0,
    hoverId: null,
    activeId: null,
    selectedChain: new Set(),
    nodes: {},
    // id -> {id, el, x, y, lvl, isRoot}
    edges: [],
    // {from, to, lvl}
    settings: {
      enabled: true,
      grid: true,
      scan: true,
      trail: true,
      glow: true,
      gridDensity: 40,
      accent: "#c8ff1a",
      ink: "#0a0a0a",
      bgFade: "rgba(242,242,239,0.18)"
    }
  };
  window.__wState = wState;
  let bgCanvas,
    fxCanvas,
    bgCtx,
    fxCtx,
    dpr = 1;
  let rafId = null;
  function ensureCanvases() {
    bgCanvas = document.getElementById("w-bg");
    fxCanvas = document.getElementById("w-fx");
    if (!bgCanvas) {
      bgCanvas = document.createElement("canvas");
      bgCanvas.id = "w-bg";
      bgCanvas.className = "w-canvas w-canvas--bg";
      document.body.insertBefore(bgCanvas, document.body.firstChild);
    }
    if (!fxCanvas) {
      fxCanvas = document.createElement("canvas");
      fxCanvas.id = "w-fx";
      fxCanvas.className = "w-canvas w-canvas--fx";
      // append fx into the stage so it sits over the plate but under nodes
      const stg = document.querySelector(".stg");
      if (stg) stg.appendChild(fxCanvas);else document.body.appendChild(fxCanvas);
    }
    bgCtx = bgCanvas.getContext("2d");
    fxCtx = fxCanvas.getContext("2d");
    resize();
  }
  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    [bgCanvas, fxCanvas].forEach(c => {
      if (!c) return;
      const r = c === fxCanvas ? (document.querySelector(".stg") || document.body).getBoundingClientRect() : {
        width: window.innerWidth,
        height: window.innerHeight
      };
      c.width = Math.floor(r.width * dpr);
      c.height = Math.floor(r.height * dpr);
      c.style.width = r.width + "px";
      c.style.height = r.height + "px";
      const ctx = c.getContext("2d");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    });
  }

  /* ---------------- background: drifting grid + crosses --------------- */
  function drawBG() {
    if (!wState.settings.enabled || !wState.settings.grid) {
      bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
      return;
    }
    const W = bgCanvas.width / dpr;
    const H = bgCanvas.height / dpr;
    const ctx = bgCtx;

    // gentle wash so previous frame is felt but doesn't blur into mush
    ctx.clearRect(0, 0, W, H);
    const s = wState.settings.gridDensity;
    const tt = wState.t;

    // minor grid (subtle drift)
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(10,10,10,0.045)";
    ctx.beginPath();
    for (let x = -s; x < W + s; x += s) {
      const ox = Math.sin(x * 0.01 + tt * 0.6) * 1.2;
      ctx.moveTo(x + ox, 0);
      ctx.lineTo(x, H);
    }
    for (let y = -s; y < H + s; y += s) {
      const oy = Math.cos(y * 0.01 + tt * 0.5) * 1.2;
      ctx.moveTo(0, y);
      ctx.lineTo(W, y + oy);
    }
    ctx.stroke();

    // major grid (every 5 units)
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(10,10,10,0.085)";
    ctx.beginPath();
    const M = s * 5;
    for (let x = 0; x < W; x += M) {
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, H);
    }
    for (let y = 0; y < H; y += M) {
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(W, y + 0.5);
    }
    ctx.stroke();

    // sweep band — slow horizontal scan
    const sweepY = tt * 38 % (H + 200) - 100;
    const grad = ctx.createLinearGradient(0, sweepY - 80, 0, sweepY + 80);
    grad.addColorStop(0, "rgba(200,255,26,0)");
    grad.addColorStop(0.5, "rgba(200,255,26,0.07)");
    grad.addColorStop(1, "rgba(200,255,26,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, sweepY - 80, W, 160);

    // vignette / noise edges — light corner darkening
    const v = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.45, W / 2, H / 2, Math.max(W, H) * 0.75);
    v.addColorStop(0, "rgba(0,0,0,0)");
    v.addColorStop(1, "rgba(0,0,0,0.06)");
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, W, H);
  }

  /* ---------------- fx: connection lines with glow + trails ----------- */
  function drawFX() {
    if (!fxCtx || !fxCanvas) return;
    const ctx = fxCtx;
    const W = fxCanvas.width / dpr;
    const H = fxCanvas.height / dpr;
    if (!wState.settings.enabled) {
      ctx.clearRect(0, 0, W, H);
      return;
    }

    // trail / persistence
    if (wState.settings.trail) {
      ctx.fillStyle = "rgba(242,242,239,0.22)";
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.clearRect(0, 0, W, H);
    }
    const hover = wState.hoverId;
    const sel = wState.selectedChain;
    const acc = wState.settings.accent;
    const ink = wState.settings.ink;

    // draw edges
    for (const e of wState.edges) {
      const a = wState.nodes[e.from];
      const b = wState.nodes[e.to];
      if (!a || !b) continue;
      const isHoverRel = hover && (e.from === hover || e.to === hover);
      const isSel = sel.has(e.from) && sel.has(e.to);
      const isRoot = e.lvl === 1;

      // alpha
      let alpha;
      if (hover) alpha = isHoverRel ? 1 : 0.16;else if (sel.size) alpha = isSel ? 1 : 0.32;else alpha = 0.55;

      // stroke style
      let stroke = ink;
      let width = 1;
      if (isSel || isHoverRel) {
        stroke = acc;
        width = 2;
      } else if (isRoot) {
        width = 1.25;
      }

      // glow (only when active/hovered)
      if (wState.settings.glow && (isSel || isHoverRel)) {
        ctx.shadowColor = acc;
        ctx.shadowBlur = 10;
      } else {
        ctx.shadowBlur = 0;
      }
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = stroke;
      ctx.lineWidth = width;

      // orthogonal routing through midX (matches existing svg path)
      const midX = (a.x + b.x) / 2;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(midX, a.y);
      ctx.lineTo(midX, b.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();

      // node-end pip on the active edge
      if (isSel || isHoverRel) {
        ctx.shadowBlur = 0;
        ctx.fillStyle = acc;
        ctx.globalAlpha = 1;
        ctx.fillRect(b.x - 3, b.y - 3, 6, 6);
      }
    }

    // pulse on activeId
    if (wState.activeId && wState.nodes[wState.activeId]) {
      const n = wState.nodes[wState.activeId];
      const phase = (Math.sin(wState.t * 4) + 1) * 0.5;
      ctx.globalAlpha = 0.4 + phase * 0.5;
      ctx.strokeStyle = acc;
      ctx.lineWidth = 1;
      ctx.shadowColor = acc;
      ctx.shadowBlur = 14;
      const r = 14 + phase * 8;
      ctx.beginPath();
      ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    ctx.globalAlpha = 1;
  }

  /* ---------------- sync nodes from DOM ------------------------------ */
  function syncNodesFromDOM() {
    const stg = document.querySelector(".stg");
    if (!stg) return;
    const stgRect = stg.getBoundingClientRect();
    const nodeEls = stg.querySelectorAll(".node");
    const seen = new Set();
    nodeEls.forEach(el => {
      const id = el.getAttribute("data-id");
      if (!id) return;
      seen.add(id);
      const r = el.getBoundingClientRect();
      const x = r.left - stgRect.left + r.width / 2;
      const y = r.top - stgRect.top + r.height / 2;
      const lvlMatch = el.className.match(/lvl-(\d)/);
      wState.nodes[id] = {
        id,
        el,
        x,
        y,
        lvl: lvlMatch ? +lvlMatch[1] : 0,
        isRoot: el.classList.contains("is-root")
      };
    });
    // prune missing
    Object.keys(wState.nodes).forEach(id => {
      if (!seen.has(id)) delete wState.nodes[id];
    });
  }

  /* ---------------- rebuild edge list from existing SVG paths --------- */
  function rebuildEdgesFromSVG() {
    const paths = document.querySelectorAll(".edges path");
    wState.edges = [];
    paths.forEach(p => {
      const f = p.getAttribute("data-edge-from");
      const t = p.getAttribute("data-edge-to");
      if (!f || !t) return;
      // root-level child edges have class edge-acc
      const lvl = p.classList.contains("edge-acc") ? 1 : 2;
      wState.edges.push({
        from: f,
        to: t,
        lvl
      });
    });
  }

  /* ---------------- attach hover/click hooks to nodes ---------------- */
  function attachNodeHooks() {
    const stg = document.querySelector(".stg");
    if (!stg) return;
    if (stg.__wHooked) return;
    stg.__wHooked = true;
    stg.addEventListener("mouseover", e => {
      const node = e.target.closest(".node");
      if (!node) return;
      const id = node.getAttribute("data-id");
      if (id) wState.hoverId = id;
    });
    stg.addEventListener("mouseout", e => {
      const node = e.target.closest(".node");
      if (!node) return;
      // only clear if leaving stage entirely (related target outside)
      if (!stg.contains(e.relatedTarget)) wState.hoverId = null;
    });
    stg.addEventListener("mouseleave", () => {
      wState.hoverId = null;
    });
    stg.addEventListener("click", e => {
      const node = e.target.closest(".node");
      if (!node) {
        wState.activeId = null;
        wState.selectedChain.clear();
        return;
      }
      const id = node.getAttribute("data-id");
      if (!id) return;
      activate(id);
    });
  }
  function activate(id) {
    wState.activeId = id;
    // build selected chain (ancestors + self) from edge list
    const chain = new Set([id]);
    let cur = id;
    let safety = 64;
    while (safety-- > 0) {
      const parentEdge = wState.edges.find(e => e.to === cur);
      if (!parentEdge) break;
      chain.add(parentEdge.from);
      cur = parentEdge.from;
    }
    wState.selectedChain = chain;
    // pulse pulse pulse — cleared after a moment if it's not 'still selected'
    clearTimeout(activate._t);
    activate._t = setTimeout(() => {
      wState.activeId = null;
    }, 1400);
  }

  /* ---------------- main loop ---------------------------------------- */
  let lastSync = 0;
  function loop(ts) {
    wState.t += 0.016;

    // throttle DOM sync (60fps is overkill; 20fps for positions is fine)
    if (!lastSync || ts - lastSync > 50) {
      syncNodesFromDOM();
      lastSync = ts;
    }
    drawBG();
    drawFX();
    rafId = requestAnimationFrame(loop);
  }

  /* ---------------- public API: rebuild after renderStage ------------ */
  function rebuild() {
    rebuildEdgesFromSVG();
    syncNodesFromDOM();
    attachNodeHooks();
    // hide native SVG edges (we draw via canvas now)
    document.querySelectorAll(".edges").forEach(svg => {
      svg.style.opacity = wState.settings.enabled ? "0" : "";
    });
  }
  window.__wRebuild = rebuild;
  function setEnabled(v) {
    wState.settings.enabled = !!v;
    document.body.classList.toggle("w-on", wState.settings.enabled);
    document.querySelectorAll(".edges").forEach(svg => {
      svg.style.opacity = wState.settings.enabled ? "0" : "";
    });
  }
  window.__wSetEnabled = setEnabled;

  /* ---------------- boot ---------------------------------------------- */
  function boot() {
    ensureCanvases();
    document.body.classList.add("w-on");

    // hook into existing app: when renderStage runs, the SVG is rebuilt.
    // Patch a MutationObserver to detect new .edges nodes and rebuild.
    const stg = document.querySelector(".stg");
    if (stg) {
      const mo = new MutationObserver(() => {
        rebuild();
      });
      mo.observe(stg, {
        childList: true,
        subtree: true
      });
    }
    window.addEventListener("resize", resize);
    rebuild();
    if (rafId == null) rafId = requestAnimationFrame(loop);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    setTimeout(boot, 0);
  }
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "skills/genex-mindmap/app/wipeout.js", error: String((e && e.message) || e) }); }

// wipeout.js
try { (() => {
/* =========================================================
   WIPEOUT / tDR UI integration
   - bg canvas: drifting measurement grid (always-on subtle motion)
   - fx canvas: state-driven edge lines (glow + persistence/trails)
   - state: { t, hoverId, activeId, nodes, edges, settings }
   - syncs node positions from DOM (existing layout intact)
   - hides existing SVG edges (renders them via canvas instead)
   ========================================================= */

(function () {
  "use strict";

  const wState = {
    t: 0,
    hoverId: null,
    activeId: null,
    selectedChain: new Set(),
    nodes: {},
    // id -> {id, el, x, y, lvl, isRoot}
    edges: [],
    // {from, to, lvl}
    settings: {
      enabled: true,
      grid: true,
      scan: true,
      trail: true,
      glow: true,
      gridDensity: 40,
      accent: "#c8ff1a",
      ink: "#0a0a0a",
      bgFade: "rgba(242,242,239,0.18)"
    }
  };
  window.__wState = wState;
  let bgCanvas,
    fxCanvas,
    bgCtx,
    fxCtx,
    dpr = 1;
  let rafId = null;
  function ensureCanvases() {
    bgCanvas = document.getElementById("w-bg");
    fxCanvas = document.getElementById("w-fx");
    if (!bgCanvas) {
      bgCanvas = document.createElement("canvas");
      bgCanvas.id = "w-bg";
      bgCanvas.className = "w-canvas w-canvas--bg";
      document.body.insertBefore(bgCanvas, document.body.firstChild);
    }
    if (!fxCanvas) {
      fxCanvas = document.createElement("canvas");
      fxCanvas.id = "w-fx";
      fxCanvas.className = "w-canvas w-canvas--fx";
      // append fx into the stage so it sits over the plate but under nodes
      const stg = document.querySelector(".stg");
      if (stg) stg.appendChild(fxCanvas);else document.body.appendChild(fxCanvas);
    }
    bgCtx = bgCanvas.getContext("2d");
    fxCtx = fxCanvas.getContext("2d");
    resize();
  }
  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    [bgCanvas, fxCanvas].forEach(c => {
      if (!c) return;
      const r = c === fxCanvas ? (document.querySelector(".stg") || document.body).getBoundingClientRect() : {
        width: window.innerWidth,
        height: window.innerHeight
      };
      c.width = Math.floor(r.width * dpr);
      c.height = Math.floor(r.height * dpr);
      c.style.width = r.width + "px";
      c.style.height = r.height + "px";
      const ctx = c.getContext("2d");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    });
  }

  /* ---------------- background: drifting grid + crosses --------------- */
  function drawBG() {
    if (!wState.settings.enabled || !wState.settings.grid) {
      bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
      return;
    }
    const W = bgCanvas.width / dpr;
    const H = bgCanvas.height / dpr;
    const ctx = bgCtx;

    // gentle wash so previous frame is felt but doesn't blur into mush
    ctx.clearRect(0, 0, W, H);
    const s = wState.settings.gridDensity;
    const tt = wState.t;

    // minor grid (subtle drift)
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(10,10,10,0.045)";
    ctx.beginPath();
    for (let x = -s; x < W + s; x += s) {
      const ox = Math.sin(x * 0.01 + tt * 0.6) * 1.2;
      ctx.moveTo(x + ox, 0);
      ctx.lineTo(x, H);
    }
    for (let y = -s; y < H + s; y += s) {
      const oy = Math.cos(y * 0.01 + tt * 0.5) * 1.2;
      ctx.moveTo(0, y);
      ctx.lineTo(W, y + oy);
    }
    ctx.stroke();

    // major grid (every 5 units)
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(10,10,10,0.085)";
    ctx.beginPath();
    const M = s * 5;
    for (let x = 0; x < W; x += M) {
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, H);
    }
    for (let y = 0; y < H; y += M) {
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(W, y + 0.5);
    }
    ctx.stroke();

    // sweep band — slow horizontal scan
    const sweepY = tt * 38 % (H + 200) - 100;
    const grad = ctx.createLinearGradient(0, sweepY - 80, 0, sweepY + 80);
    grad.addColorStop(0, "rgba(200,255,26,0)");
    grad.addColorStop(0.5, "rgba(200,255,26,0.07)");
    grad.addColorStop(1, "rgba(200,255,26,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, sweepY - 80, W, 160);

    // vignette / noise edges — light corner darkening
    const v = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.45, W / 2, H / 2, Math.max(W, H) * 0.75);
    v.addColorStop(0, "rgba(0,0,0,0)");
    v.addColorStop(1, "rgba(0,0,0,0.06)");
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, W, H);
  }

  /* ---------------- fx: connection lines with glow + trails ----------- */
  function drawFX() {
    if (!fxCtx || !fxCanvas) return;
    const ctx = fxCtx;
    const W = fxCanvas.width / dpr;
    const H = fxCanvas.height / dpr;
    if (!wState.settings.enabled) {
      ctx.clearRect(0, 0, W, H);
      return;
    }

    // trail / persistence
    if (wState.settings.trail) {
      ctx.fillStyle = "rgba(242,242,239,0.22)";
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.clearRect(0, 0, W, H);
    }
    const hover = wState.hoverId;
    const sel = wState.selectedChain;
    const acc = wState.settings.accent;
    const ink = wState.settings.ink;

    // draw edges
    for (const e of wState.edges) {
      const a = wState.nodes[e.from];
      const b = wState.nodes[e.to];
      if (!a || !b) continue;
      const isHoverRel = hover && (e.from === hover || e.to === hover);
      const isSel = sel.has(e.from) && sel.has(e.to);
      const isRoot = e.lvl === 1;

      // alpha
      let alpha;
      if (hover) alpha = isHoverRel ? 1 : 0.16;else if (sel.size) alpha = isSel ? 1 : 0.32;else alpha = 0.55;

      // stroke style
      let stroke = ink;
      let width = 1;
      if (isSel || isHoverRel) {
        stroke = acc;
        width = 2;
      } else if (isRoot) {
        width = 1.25;
      }

      // glow (only when active/hovered)
      if (wState.settings.glow && (isSel || isHoverRel)) {
        ctx.shadowColor = acc;
        ctx.shadowBlur = 10;
      } else {
        ctx.shadowBlur = 0;
      }
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = stroke;
      ctx.lineWidth = width;

      // orthogonal routing through midX (matches existing svg path)
      const midX = (a.x + b.x) / 2;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(midX, a.y);
      ctx.lineTo(midX, b.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();

      // node-end pip on the active edge
      if (isSel || isHoverRel) {
        ctx.shadowBlur = 0;
        ctx.fillStyle = acc;
        ctx.globalAlpha = 1;
        ctx.fillRect(b.x - 3, b.y - 3, 6, 6);
      }
    }

    // pulse on activeId
    if (wState.activeId && wState.nodes[wState.activeId]) {
      const n = wState.nodes[wState.activeId];
      const phase = (Math.sin(wState.t * 4) + 1) * 0.5;
      ctx.globalAlpha = 0.4 + phase * 0.5;
      ctx.strokeStyle = acc;
      ctx.lineWidth = 1;
      ctx.shadowColor = acc;
      ctx.shadowBlur = 14;
      const r = 14 + phase * 8;
      ctx.beginPath();
      ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    ctx.globalAlpha = 1;
  }

  /* ---------------- sync nodes from DOM ------------------------------ */
  function syncNodesFromDOM() {
    const stg = document.querySelector(".stg");
    if (!stg) return;
    const stgRect = stg.getBoundingClientRect();
    const nodeEls = stg.querySelectorAll(".node");
    const seen = new Set();
    nodeEls.forEach(el => {
      const id = el.getAttribute("data-id");
      if (!id) return;
      seen.add(id);
      const r = el.getBoundingClientRect();
      const x = r.left - stgRect.left + r.width / 2;
      const y = r.top - stgRect.top + r.height / 2;
      const lvlMatch = el.className.match(/lvl-(\d)/);
      wState.nodes[id] = {
        id,
        el,
        x,
        y,
        lvl: lvlMatch ? +lvlMatch[1] : 0,
        isRoot: el.classList.contains("is-root")
      };
    });
    // prune missing
    Object.keys(wState.nodes).forEach(id => {
      if (!seen.has(id)) delete wState.nodes[id];
    });
  }

  /* ---------------- rebuild edge list from existing SVG paths --------- */
  function rebuildEdgesFromSVG() {
    const paths = document.querySelectorAll(".edges path");
    wState.edges = [];
    paths.forEach(p => {
      const f = p.getAttribute("data-edge-from");
      const t = p.getAttribute("data-edge-to");
      if (!f || !t) return;
      // root-level child edges have class edge-acc
      const lvl = p.classList.contains("edge-acc") ? 1 : 2;
      wState.edges.push({
        from: f,
        to: t,
        lvl
      });
    });
  }

  /* ---------------- attach hover/click hooks to nodes ---------------- */
  function attachNodeHooks() {
    const stg = document.querySelector(".stg");
    if (!stg) return;
    if (stg.__wHooked) return;
    stg.__wHooked = true;
    stg.addEventListener("mouseover", e => {
      const node = e.target.closest(".node");
      if (!node) return;
      const id = node.getAttribute("data-id");
      if (id) wState.hoverId = id;
    });
    stg.addEventListener("mouseout", e => {
      const node = e.target.closest(".node");
      if (!node) return;
      // only clear if leaving stage entirely (related target outside)
      if (!stg.contains(e.relatedTarget)) wState.hoverId = null;
    });
    stg.addEventListener("mouseleave", () => {
      wState.hoverId = null;
    });
    stg.addEventListener("click", e => {
      const node = e.target.closest(".node");
      if (!node) {
        wState.activeId = null;
        wState.selectedChain.clear();
        return;
      }
      const id = node.getAttribute("data-id");
      if (!id) return;
      activate(id);
    });
  }
  function activate(id) {
    wState.activeId = id;
    // build selected chain (ancestors + self) from edge list
    const chain = new Set([id]);
    let cur = id;
    let safety = 64;
    while (safety-- > 0) {
      const parentEdge = wState.edges.find(e => e.to === cur);
      if (!parentEdge) break;
      chain.add(parentEdge.from);
      cur = parentEdge.from;
    }
    wState.selectedChain = chain;
    // pulse pulse pulse — cleared after a moment if it's not 'still selected'
    clearTimeout(activate._t);
    activate._t = setTimeout(() => {
      wState.activeId = null;
    }, 1400);
  }

  /* ---------------- main loop ---------------------------------------- */
  let lastSync = 0;
  function loop(ts) {
    wState.t += 0.016;

    // throttle DOM sync (60fps is overkill; 20fps for positions is fine)
    if (!lastSync || ts - lastSync > 50) {
      syncNodesFromDOM();
      lastSync = ts;
    }
    drawBG();
    drawFX();
    rafId = requestAnimationFrame(loop);
  }

  /* ---------------- public API: rebuild after renderStage ------------ */
  function rebuild() {
    rebuildEdgesFromSVG();
    syncNodesFromDOM();
    attachNodeHooks();
    // hide native SVG edges (we draw via canvas now)
    document.querySelectorAll(".edges").forEach(svg => {
      svg.style.opacity = wState.settings.enabled ? "0" : "";
    });
  }
  window.__wRebuild = rebuild;
  function setEnabled(v) {
    wState.settings.enabled = !!v;
    document.body.classList.toggle("w-on", wState.settings.enabled);
    document.querySelectorAll(".edges").forEach(svg => {
      svg.style.opacity = wState.settings.enabled ? "0" : "";
    });
  }
  window.__wSetEnabled = setEnabled;

  /* ---------------- boot ---------------------------------------------- */
  function boot() {
    ensureCanvases();
    document.body.classList.add("w-on");

    // hook into existing app: when renderStage runs, the SVG is rebuilt.
    // Patch a MutationObserver to detect new .edges nodes and rebuild.
    const stg = document.querySelector(".stg");
    if (stg) {
      const mo = new MutationObserver(() => {
        rebuild();
      });
      mo.observe(stg, {
        childList: true,
        subtree: true
      });
    }
    window.addEventListener("resize", resize);
    rebuild();
    if (rafId == null) rafId = requestAnimationFrame(loop);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    setTimeout(boot, 0);
  }
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "wipeout.js", error: String((e && e.message) || e) }); }

})();
