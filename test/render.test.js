/* Node smoke test: run app.js init against a minimal DOM shim and verify rendering */
'use strict';
const fs = require('fs');
const path = require('path');

function makeEl(id) {
  return {
    id, textContent: '', innerHTML: '', hidden: true, value: '',
    attrs: {}, listeners: {},
    addEventListener(ev, fn) { (this.listeners[ev] = this.listeners[ev] || []).push(fn); },
    setAttribute(k, v) { this.attrs[k] = v; },
    getAttribute(k) { return this.attrs[k]; },
    classList: {
      _s: new Set(),
      add(c) { this._s.add(c); }, remove(c) { this._s.delete(c); },
      toggle(c, f) { if (f === undefined) { this._s.has(c) ? this._s.delete(c) : this._s.add(c); } else if (f) this._s.add(c); else this._s.delete(c); },
      contains(c) { return this._s.has(c); }
    },
    focus() {}, scrollIntoView() {},
    querySelectorAll() { return []; },
    getContext() { return { fillStyle:'', font:'', fillRect(){}, fillText(){} }; },
    width: 800, height: 600, addEventListener() {}
  };
}

const els = {};
const getEl = (id) => els[id] || null;
['bg-grid','noise-toggle','stat-repos','stat-stars','stat-langs','stat-followers','lang-strip',
 'proj-count','search','filters','grid','empty','sync-note','modal','modal-body','modal-close','year']
  .forEach(id => els[id] = makeEl(id));

global.window = global;
window.innerWidth = 1280; window.innerHeight = 800;
global.document = {
  readyState: 'complete',
  addEventListener() {},
  getElementById: getEl
};
window.matchMedia = () => ({ matches: false }); // allow canvas branch, stubbed ctx
window.addEventListener = () => {};
window.fetch = () => Promise.reject(new Error('offline test')); // force fallback path
window.requestAnimationFrame = () => {};

// load baked data first (as index.html does)
require(path.join(__dirname, '..', 'assets', 'js', 'data.js'));
// then the app
require(path.join(__dirname, '..', 'assets', 'js', 'app.js'));

// let the async fallback note settle
setTimeout(() => {
  const grid = els['grid'].innerHTML;
  const cardCount = (grid.match(/<article class="card"/g) || []).length;
  const stats = {
    repos: els['stat-repos'].textContent,
    stars: els['stat-stars'].textContent,
    langs: els['stat-langs'].textContent
  };
  const filters = els['filters'].innerHTML;
  const filterBtnCount = (filters.match(/class="filter-btn/g) || []).length;
  const langChips = els['lang-strip'].innerHTML.match(/lang-chip/g) || [];
  const hasXSSPayload = /<script|onerror=|javascript:/i.test(grid);

  console.log('cards rendered:', cardCount);
  console.log('stats:', JSON.stringify(stats));
  console.log('filter buttons:', filterBtnCount);
  console.log('lang chips:', langChips.length);
  console.log('sync note:', els['sync-note'].textContent);
  console.log('empty hidden (has results):', els['empty'].hidden);
  console.log('year:', els['year'].textContent);

  let fail = 0;
  function check(name, cond) { console.log((cond ? 'PASS' : 'FAIL') + ' - ' + name); if (!cond) fail++; }
  check('renders 32 project cards', cardCount === 32);
  check('stats numbers populated', String(stats.repos) === '32' && String(stats.stars) === '1' && String(stats.langs) === '3');
  check('filter buttons rendered (all + Python + HTML + Other)', filterBtnCount === 4);
  check('language chips rendered', langChips.length >= 2);
  check('live-sync fallback note shown', /snapshot|unavailable|timeout/.test(els['sync-note'].textContent));
  check('desc content is HTML-escaped (no raw tags)', !hasXSSPayload);
  check('card titles include Web-Terminal', grid.includes('Web-Terminal'));
  check('card titles include Cyber-Tools-System', grid.includes('Cyber-Tools-System'));

  console.log(fail === 0 ? '\nALL SMOKE TESTS PASSED' : `\n${fail} TEST(S) FAILED`);
  process.exit(fail === 0 ? 0 : 1);
}, 50);
