/* Portfolio app — live GitHub sync with baked fallback snapshot */
(function () {
  'use strict';

  var USER = 'Khedr0x00';
  var LANG_COLORS = {
    Python: '#3776ab', HTML: '#e34c26', CSS: '#563d7c', JavaScript: '#f1e05a',
    TypeScript: '#3178c6', Shell: '#89e051', C: '#555555', 'C++': '#f34b7d',
    Go: '#00add8', Rust: '#dea584', Java: '#b07219', PHP: '#4f5d95',
    Ruby: '#701516', Other: '#5b6d87'
  };
  var E = function (id) { return document.getElementById(id); };
  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };

  var state = { repos: [], filter: 'all', query: '' };

  /* ---------------- live fetch (falls back to baked data.js) ---------------- */
  function fetchLive(cb) {
    var done = false;
    var finish = function (ok, note) {
      if (done) return; done = true; cb(ok, note);
    };
    var timer = setTimeout(function () { finish(false, 'live sync timeout — showing snapshot'); }, 6000);
    fetch('https://api.github.com/users/' + USER + '/repos?per_page=100&sort=updated')
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (list) {
        clearTimeout(timer);
        var clean = (list || []).filter(function (r) { return !r.fork && r.name !== USER + '.github.io' && r.name !== USER; })
          .map(function (r) {
            return {
              name: r.name, desc: r.description || '', lang: r.language || 'Other',
              topics: r.topics || [], stars: r.stargazers_count || 0, forks: r.forks_count || 0,
              updated: (r.pushed_at || r.updated_at || '').slice(0, 10), url: r.html_url, homepage: r.homepage || ''
            };
          });
        if (!clean.length) return finish(false, 'live sync empty — showing snapshot');
        finish(true, clean);
      })
      .catch(function () { clearTimeout(timer); finish(false, 'live sync unavailable — showing snapshot'); });
  }

  /* ---------------- rendering ---------------- */
  function langColor(l) { return LANG_COLORS[l] || LANG_COLORS.Other; }

  function renderStats() {
    var totalStars = 0; var langs = {}; var topics = 0;
    state.repos.forEach(function (r) { totalStars += r.stars; langs[r.lang] = 1; topics += (r.topics || []).length; });
    E('stat-repos').textContent = state.repos.length;
    E('stat-stars').textContent = totalStars;
    E('stat-langs').textContent = Object.keys(langs).length;
    E('stat-followers').textContent = (window.PORTFOLIO_PROFILE && window.PORTFOLIO_PROFILE.followers) || 0;
    E('year').textContent = new Date().getFullYear();

    var counts = {};
    state.repos.forEach(function (r) { counts[r.lang] = (counts[r.lang] || 0) + 1; });
    var strip = E('lang-strip');
    strip.innerHTML = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; })
      .map(function (l) {
        return '<span class="lang-chip"><span class="lang-dot" style="background:' + langColor(l) + '"></span><b>' + esc(l) + '</b> ×' + counts[l] + '</span>';
      }).join('');
  }

  function renderFilters() {
    var langs = ['all'].concat(Object.keys(state.repos.reduce(function (m, r) { m[r.lang] = 1; return m; }, {}))
      .sort(function (a, b) {
        var ca = state.repos.filter(function (r) { return r.lang === a; }).length;
        var cb = state.repos.filter(function (r) { return r.lang === b; }).length;
        return cb - ca;
      }));
    E('filters').innerHTML = langs.map(function (l) {
      var active = state.filter === l ? ' active' : '';
      var label = l === 'all' ? 'all' : l;
      var count = l === 'all' ? state.repos.length : state.repos.filter(function (r) { return r.lang === l; }).length;
      return '<button class="filter-btn' + active + '" data-lang="' + esc(l) + '">' + esc(label) + ' <span style="opacity:.55">' + count + '</span></button>';
    }).join('');
    Array.prototype.forEach.call(E('filters').querySelectorAll('.filter-btn'), function (b) {
      b.addEventListener('click', function () {
        state.filter = b.getAttribute('data-lang');
        renderFilters(); renderGrid();
      });
    });
  }

  function matchQuery(r) {
    var q = state.query.trim().toLowerCase();
    if (!q) return true;
    var hay = (r.name + ' ' + r.desc + ' ' + r.lang + ' ' + (r.topics || []).join(' ')).toLowerCase();
    return q.split(/\s+/).every(function (term) { return hay.indexOf(term) !== -1; });
  }

  function renderGrid() {
    var shown = state.repos.filter(function (r) {
      return (state.filter === 'all' || r.lang === state.filter) && matchQuery(r);
    });
    E('proj-count').textContent = '— ' + shown.length + ' of ' + state.repos.length + ' shown';
    E('grid').innerHTML = shown.map(function (r, i) {
      var descHtml = r.desc
        ? '<p class="card-desc">' + esc(r.desc) + '</p>'
        : '<p class="card-desc none">No description — open the repo for details.</p>';
      var topics = (r.topics || []).slice(0, 5).map(function (t) {
        return '<span class="topic">' + esc(t) + '</span>';
      }).join('');
      var starHtml = r.stars > 0 ? '★ <span class="val">' + r.stars + '</span>' : '★ 0';
      return '<article class="card" data-idx="' + i + '" tabindex="0" role="button" aria-label="View ' + esc(r.name) + ' details">' +
        '<div class="card-head"><span class="card-title">' + esc(r.name) + '</span><span class="card-star">' + starHtml + '</span></div>' +
        descHtml +
        (topics ? '<div class="topics">' + topics + '</div>' : '') +
        '<div class="card-foot"><span class="lang-name"><span class="lang-dot" style="background:' + langColor(r.lang) + '"></span>' + esc(r.lang) + '</span>' +
        '<span class="card-meta">upd ' + esc(r.updated || '—') + '</span></div>' +
        '</article>';
    }).join('');
    E('empty').hidden = shown.length !== 0;
    if (!shown.length) E('empty').textContent = 'no results for "' + state.query + '" — try another query';
    Array.prototype.forEach.call(E('grid').querySelectorAll('.card'), function (c) {
      var idx = parseInt(c.getAttribute('data-idx'), 10);
      c.addEventListener('click', function () { openModal(shown[idx]); });
      c.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); openModal(shown[idx]); }
      });
    });
  }

  function openModal(r) {
    var topics = (r.topics || []).map(function (t) {
      return '<span class="topic">' + esc(t) + '</span>';
    }).join('');
    var html =
      '<h3>' + esc(r.name) + '</h3>' +
      '<p class="modal-sub">' + esc(r.lang) + ' · updated ' + esc(r.updated || '—') + ' · ★ ' + r.stars + ' · ⑂ ' + r.forks + '</p>' +
      '<p class="modal-desc">' + esc(r.desc || 'No description provided. Open the repository to learn more.') + '</p>' +
      (topics ? '<div class="modal-sec-title">topics</div><div class="topics">' + topics + '</div>' : '') +
      '<div class="modal-sec-title">links</div>' +
      '<div class="modal-links">' +
      '<a class="code" href="' + esc(r.url) + '" target="_blank" rel="noopener">⌥ view code</a>' +
      (r.homepage ? '<a href="' + esc(r.homepage) + '" target="_blank" rel="noopener">▶ live demo</a>' : '') +
      '</div>';
    E('modal-body').innerHTML = html;
    E('modal').classList.add('open');
    E('modal').setAttribute('aria-hidden', 'false');
    E('modal-close').focus();
  }

  function closeModal() {
    E('modal').classList.remove('open');
    E('modal').setAttribute('aria-hidden', 'true');
  }

  /* ---------------- background canvas ---------------- */
  function startBackground() {
    var c = E('bg-grid'); if (!c) return;
    var ctx = c.getContext('2d');
    var W, H, cols, rows, drops;
    var glyphs = '01アイウエオカキクケコサシスセソ<>{}[]$#%&*+-/\\=~^!?ABCDEF';
    var fontSize = 16;
    var running = true;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function resize() {
      W = c.width = window.innerWidth;
      H = c.height = window.innerHeight;
      cols = Math.floor(W / fontSize);
      rows = Math.floor(H / fontSize);
      drops = new Array(cols);
      for (var i = 0; i < cols; i++) drops[i] = Math.random() * rows;
    }
    window.addEventListener('resize', resize);
    resize();

    var frame = 0;
    function draw() {
      if (!running) return;
      frame++;
      ctx.fillStyle = 'rgba(7, 9, 13, 0.14)';
      ctx.fillRect(0, 0, W, H);
      if (frame % 2 === 0) {
        for (var i = 0; i < cols; i++) {
          var ch = glyphs.charAt(Math.floor(Math.random() * glyphs.length));
          var x = i * fontSize, y = drops[i] * fontSize;
          ctx.font = fontSize + 'px "JetBrains Mono", monospace';
          ctx.fillStyle = Math.random() < 0.03 ? 'rgba(55,213,242,.9)' : 'rgba(45,226,138,.32)';
          ctx.fillText(ch, x, y);
          if (y > H && Math.random() > 0.975) drops[i] = 0;
          drops[i] += 0.55;
        }
      }
      requestAnimationFrame(draw);
    }
    if (!reduce) draw(); else {
      ctx.fillStyle = 'rgba(7,9,13,1)'; ctx.fillRect(0, 0, W, H);
      ctx.font = fontSize + 'px "JetBrains Mono", monospace';
      ctx.fillStyle = 'rgba(45,226,138,.05)';
      for (var i = 0; i < cols; i++) for (var j = 0; j < rows; j += 3) {
        ctx.fillText(glyphs.charAt(Math.floor(Math.random() * glyphs.length)), i * fontSize, j * fontSize);
      }
    }

    var btn = E('noise-toggle');
    if (btn) btn.addEventListener('click', function () {
      running = !running;
      btn.classList.toggle('off', !running);
      if (running) { requestAnimationFrame(draw); }
      else { ctx.fillStyle = '#07090d'; ctx.fillRect(0, 0, W, H); }
    });
  }

  /* ---------------- init ---------------- */
  function init() {
    state.repos = window.PORTFOLIO_REPOS || [];
    renderStats(); renderFilters(); renderGrid();
    E('search').addEventListener('input', function (e) {
      state.query = e.target.value; renderGrid();
    });
    E('modal-close').addEventListener('click', closeModal);
    E('modal').addEventListener('click', function (e) { if (e.target === E('modal')) closeModal(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(); });
    startBackground();

    fetchLive(function (ok, payload) {
      if (ok && Array.isArray(payload) && payload.length) {
        state.repos = payload;
        renderStats(); renderFilters(); renderGrid();
        E('sync-note').textContent = '// live data from api.github.com — ' + payload.length + ' projects synced ' + new Date().toLocaleTimeString();
      } else if (typeof payload === 'string') {
        E('sync-note').textContent = '// ' + payload;
      }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
