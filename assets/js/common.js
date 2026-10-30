/* Grad-IQ shared runtime: PUBLIC DEMO BUILD (sample data only, nothing saved, print-only toolbar),
   data binding, header/footer, crisis panel. Vanilla JS, no network calls, no tracking. */
(function () {
  "use strict";
  var params = new URLSearchParams(location.search);
  var DEMO = true; // public demo build: always sample data, never saved
  var PACK = { hub: true };
  var BUY = (window.GRADIQ_CONFIG && window.GRADIQ_CONFIG.BUY_URLS) || {};
  var ROOT = document.body.getAttribute("data-root") || "..";
  var COUNSEL_KEY = "gradiq-campus-counseling-v1";

  /* ---------- utilities ---------- */
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function num(v) { var n = parseFloat(String(v == null ? "" : v).replace(/[$,\s]/g, "")); return isFinite(n) ? n : 0; }
  function blank(v) { return v === "" || v == null || (typeof v === "number" && !isFinite(v)); }
  var usd0 = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  var usd2 = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
  function money(n, cents) { n = num(n); return (cents || Math.round(n) !== n ? usd2 : usd0).format(n); }
  function uid() { return Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4); }
  function pad(n) { return String(n).padStart(2, "0"); }
  function iso(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function parseISO(s) { if (!s || !/^\d{4}-\d{2}-\d{2}/.test(s)) return null; var p = s.split("-"); return new Date(+p[0], +p[1] - 1, +p[2].slice(0, 2)); }
  function today() { return iso(new Date()); }
  function addDays(s, n) { var d = parseISO(s) || new Date(); d.setDate(d.getDate() + n); return iso(d); }
  function diffDays(a, b) { var da = parseISO(a), db = parseISO(b); if (!da || !db) return null; return Math.round((db - da) / 86400000); }
  function fmtDate(s, opts) { var d = parseISO(s); if (!d) return "—"; return d.toLocaleDateString("en-US", opts || { month: "short", day: "numeric", year: "numeric" }); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function merge(base, over) {
    if (Array.isArray(base) || Array.isArray(over)) return over !== undefined ? over : base;
    if (base && typeof base === "object" && over && typeof over === "object") {
      var out = {}; Object.keys(base).forEach(function (k) { out[k] = base[k]; });
      Object.keys(over).forEach(function (k) { out[k] = (k in base) ? merge(base[k], over[k]) : over[k]; });
      return out;
    }
    return over !== undefined ? over : base;
  }
  function getPath(o, p) { return p.split(".").reduce(function (a, k) { return a == null ? undefined : a[k]; }, o); }
  function setPath(o, p, v) { var ks = p.split("."), last = ks.pop(); var t = ks.reduce(function (a, k) { if (a[k] == null) a[k] = {}; return a[k]; }, o); t[last] = v; }
  function csvCell(v) { v = v == null ? "" : String(v); return /[",\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
  function toCSV(rows) { return rows.map(function (r) { return r.map(csvCell).join(","); }).join("\r\n"); }
  var toastTimer;
  function toast(msg) {
    var t = $("#gq-toast"); if (!t) { t = document.createElement("div"); t.id = "gq-toast"; t.className = "toast"; t.setAttribute("role", "status"); t.setAttribute("aria-live", "polite"); document.body.appendChild(t); }
    t.textContent = msg; t.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.hidden = true; }, 2600);
  }
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text).then(function () { return true; }, fallback);
    return Promise.resolve(fallback());
    function fallback() { var ta = document.createElement("textarea"); ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0"; document.body.appendChild(ta); ta.select(); var ok = false; try { ok = document.execCommand("copy"); } catch (e) { ok = false; } ta.remove(); return ok; }
  }
  function safeUrl(u) { u = String(u || "").trim(); if (!u) return ""; if (/^(tel:|mailto:)/i.test(u)) return u; if (!/^https?:\/\//i.test(u)) u = "https://" + u; try { var x = new URL(u); return /^https?:$/.test(x.protocol) ? x.href : ""; } catch (e) { return ""; } }

  /* ---------- chrome: header, demo banner, footer ---------- */
  function launchOn(C) { return !!(C.LAUNCH_PRICE_ACTIVE && C.LAUNCH_PRICE != null && (!C.LAUNCH_PRICE_ENDS || today() <= C.LAUNCH_PRICE_ENDS)); }
  window.GQ_launchOn = launchOn;
  function completeOn(C) { return !!(C.COMPLETE_SALE_ACTIVE && C.COMPLETE_SALE_PRICE != null && (!C.COMPLETE_SALE_ENDS || today() <= C.COMPLETE_SALE_ENDS)); }
  window.GQ_completeOn = completeOn;
  function buyButton(key, label) {
    var C = window.GRADIQ_CONFIG || {}, pr = C.PRICES && C.PRICES[key], lp = key === "full-suite" && launchOn(C) ? C.LAUNCH_PRICE : key === "grad-iq-complete-bundle" && completeOn(C) ? C.COMPLETE_SALE_PRICE : null;
    var u = safeUrl(BUY[key] || ""), fp = function (n) { return "$" + (Math.round(n) === +n ? String(+n) : (+n).toFixed(2)); }, tag = pr != null ? '<span class="price-tag"><strong>' + fp(lp != null ? lp : pr) + "</strong>" + (lp != null ? " <s>" + fp(pr) + "</s>" : "") + "</span> " : "";
    return tag + (u ? '<a class="btn sm buy-btn" href="' + esc(u) + '" target="_blank" rel="noopener">' + esc(label || "Get the full version") + "</a>" : '<span class="pill soon" title="Checkout isn\'t open yet">Coming soon</span>');
  }
  window.GQ_buyButton = buyButton;

  function buildChrome(opts) {
    opts = opts || {};
    var hub = PACK.hub !== false;
    var top = document.createElement("header"); top.className = "topbar";
    top.innerHTML = '<a class="brand" href="' + (hub ? ROOT + "/index.html" : "index.html") + '"><span class="logo-mark" aria-hidden="true"></span><span><strong>Grad-IQ</strong><span class="brand-sub">' + esc(opts.sub || "Planners for grad students") + "</span></span></a>" +
      (opts.isHub || !hub ? "" : '<a class="back" href="' + ROOT + '/index.html">← All tools</a>');
    document.body.insertBefore(top, document.body.firstChild);
    var skip = document.createElement("a"); skip.className = "skip-link"; skip.href = "#main"; skip.textContent = "Skip to content";
    document.body.insertBefore(skip, top);
    document.body.classList.add("gq-demo-build");
    var b = document.createElement("div"); b.className = "demo-banner sales"; b.setAttribute("role", "region"); b.setAttribute("aria-label", "Demo notice");
    b.innerHTML = "<span><strong>This is a demo with sample data.</strong> Get the full version to save your own plan.</span>" +
      '<span class="banner-actions">' + (opts.product ? "" : "<span class='small'>Full suite</span> ") + buyButton(opts.product || "full-suite", opts.product ? "Get it" : "Get the full suite") + '<a href="' + ROOT + '/index.html#products">' + (opts.isHub ? "See products" : "Singles, bundles &amp; full suite") + "</a></span>";
    top.insertAdjacentElement("afterend", b);
    var main = $("#main");
    if (main && opts.title) {
      var ph = document.createElement("div"); ph.className = "print-only";
      ph.innerHTML = "<p class='small'>Grad-IQ by IQ Learning · " + esc(opts.title) + " · printed " + esc(fmtDate(today())) + (DEMO ? " · SAMPLE DATA" : "") + "</p>";
      main.insertBefore(ph, main.firstChild);
    }
    var f = document.createElement("footer"); f.className = "site-footer";
    f.innerHTML = "<p><strong>Grad-IQ by IQ Learning</strong></p>" +
      "<p class='small'>Planning tools only — not financial, tax, legal or medical advice. This demo runs on sample data and stores nothing; there are no accounts and no tracking.</p>" +
      '<nav aria-label="Footer"><a href="' + ROOT + '/index.html">All tools</a> · <a href="' + ROOT + '/index.html#products">Get the full version</a> · <a href="' + ROOT + '/index.html#sources">Sources</a></nav>';
    document.body.appendChild(f);
  }

  /* ---------- crisis / support panel (Stress & support section) ---------- */
  function crisisPanel(mount) {
    var c = {};
    var el = document.createElement("section"); el.className = "crisis"; el.setAttribute("aria-labelledby", "crisis-h");
    function draw() {
      var url = safeUrl(c.url), phone = String(c.phone || "").trim();
      var mine = [];
      if (url) mine.push('<a href="' + esc(url) + '" target="_blank" rel="noopener">' + esc(c.name || "My campus counseling") + "</a>");
      else if (c.name) mine.push(esc(c.name));
      if (phone) mine.push('<a href="tel:' + esc(phone.replace(/[^\d+]/g, "")) + '">' + esc(phone) + "</a>");
      el.innerHTML = '<h2 id="crisis-h">You don\'t have to handle this alone</h2>' +
        '<p class="big988">In crisis or thinking about suicide? <strong>Call or text <a href="tel:988">988</a></strong> (Suicide &amp; Crisis Lifeline, US) or chat at <a href="https://988lifeline.org" target="_blank" rel="noopener">988lifeline.org</a>. If you are in immediate danger, call 911.</p>' +
        "<p><strong>My campus counseling:</strong> " + (mine.length ? mine.join(" · ") : '<span class="muted">not added yet — add your counseling center below so it\'s one tap away.</span>') + "</p>" +
        '<details class="no-print"><summary>Edit my campus counseling contact</summary><div class="field-row" style="margin-top:.6rem">' +
        '<label class="field">Name<input id="cc-name" type="text" autocomplete="off" placeholder="e.g. University Counseling Center"></label>' +
        '<label class="field">Phone<input id="cc-phone" type="tel" autocomplete="off" placeholder="Campus counseling phone"></label>' +
        '<label class="field">Website<input id="cc-url" type="url" autocomplete="off" placeholder="https://…"></label></div>' +
        '<button type="button" class="btn sm primary" id="cc-save">Save contact</button> <span class="small muted">' + (DEMO && document.body.classList.contains("gq-demo-build") ? "Demo: shown for this visit only, not saved." : "Saved on this device only; shared by all Stress &amp; support pages.") + '</span></details>' +
        '<p class="small muted" style="margin:.5rem 0 0">This planner is a self-reflection tool, not therapy or treatment.</p>';
      $("#cc-name", el).value = c.name || ""; $("#cc-phone", el).value = c.phone || ""; $("#cc-url", el).value = c.url || "";
      $("#cc-save", el).addEventListener("click", function () {
        c = { name: $("#cc-name", el).value.trim(), phone: $("#cc-phone", el).value.trim(), url: $("#cc-url", el).value.trim() };
        draw(); toast("Shown for this visit only (demo: not saved)");
        var d = $("details", el); if (d) d.open = false;
      });
    }
    draw();
    if (mount) mount.appendChild(el); return el;
  }

  /* ---------- tool framework ---------- */
  function tool(cfg) {
    var api = {};
    function fresh() { return clone(cfg.defaults()); }
    function load() {
      if (DEMO) return merge(fresh(), clone(cfg.demo()));
    }
    api.state = load();
    var statusEl;
    api.save = function () {
      if (DEMO) { if (statusEl) statusEl.textContent = "Demo · not saved"; return; }
    };
    api.fill = function (root) {
      $$("[data-bind]", root).forEach(function (el) {
        var v = getPath(api.state, el.getAttribute("data-bind"));
        if (el.type === "checkbox") el.checked = !!v;
        else if (el.type === "radio") el.checked = String(v) === el.value;
        else if (document.activeElement !== el) el.value = v == null ? "" : v;
      });
    };
    api.update = function () { if (cfg.update) cfg.update(api.state, api); };
    api.render = function () {
      var ae = document.activeElement, key = ae && ae.getAttribute ? (ae.getAttribute("data-bind") ? '[data-bind="' + ae.getAttribute("data-bind") + '"]' : ae.id ? "#" + ae.id : null) : null;
      if (cfg.render) cfg.render(api.state, api); api.fill(document); api.update();
      if (key && document.activeElement !== ae) { var n = document.querySelector(key); if (n && n !== document.activeElement) try { n.focus({ preventScroll: true }); } catch (e) { /* ignore */ } }
    };
    api.commit = function (rerender) { api.save(); if (rerender) api.render(); else api.update(); };

    function onBind(e) {
      var el = e.target.closest ? e.target.closest("[data-bind]") : null; if (!el) return;
      var v;
      if (el.type === "checkbox") v = el.checked;
      else if (el.type === "radio") { if (!el.checked) return; v = el.value; }
      else if (el.type === "number" || el.getAttribute("data-type") === "number") v = el.value === "" ? "" : num(el.value);
      else v = el.value;
      setPath(api.state, el.getAttribute("data-bind"), v);
      var rr = el.hasAttribute("data-rerender") && (e.type === "change" || el.type === "checkbox" || el.tagName === "SELECT");
      api.save(); if (rr) setTimeout(api.render, 0); else api.update();
    }
    document.addEventListener("input", onBind);
    document.addEventListener("change", function (e) { var el = e.target; if (el.matches && el.matches("[data-bind][data-rerender]")) onBind(e); });
    document.addEventListener("click", function (e) {
      var el = e.target.closest ? e.target.closest("[data-action]") : null; if (!el) return;
      var fn = cfg.actions && cfg.actions[el.getAttribute("data-action")];
      if (fn) { e.preventDefault(); fn(el, api.state, api); }
    });

    buildChrome({ title: cfg.name, sub: cfg.section, product: cfg.key.replace(/^gradiq-/, "").replace(/-v\d+$/, "") });
    if (cfg.stress) { var m = $("#gq-crisis") || $("#main"); var p = crisisPanel(null); if ($("#gq-crisis")) m.appendChild(p); else { var ph = $(".page-head", m); (ph || m.firstChild).insertAdjacentElement("afterend", p); } }

    var tb = $("#gq-toolbar");
    if (tb) {
      tb.className = "toolbar no-print"; tb.setAttribute("role", "toolbar"); tb.setAttribute("aria-label", "Print");
      tb.innerHTML = '<button type="button" class="btn sm secondary" data-gq="print">🖨️ Print sample</button>' +
        '<span class="small muted demo-note">Saving, export, import and clear are in the full version. This demo keeps nothing after you leave.</span>' +
        '<span class="status" aria-live="polite">Demo · not saved</span>';
      statusEl = $(".status", tb);
      tb.addEventListener("click", function (e) { var b = e.target.closest("[data-gq=print]"); if (!b) return; if (cfg.beforePrint) cfg.beforePrint(api.state, api); window.print(); });
    }
    if (cfg.init) cfg.init(api.state, api);
    api.render();
    window.addEventListener("beforeprint", function () { $$("textarea").forEach(function (t) { t.style.height = "auto"; t.style.height = t.scrollHeight + "px"; }); });
    return api;
  }

  window.GQ = { DEMO: DEMO, ROOT: ROOT, $: $, $$: $$, esc: esc, num: num, blank: blank, money: money, uid: uid, iso: iso, parseISO: parseISO, today: today, addDays: addDays, diffDays: diffDays, fmtDate: fmtDate, clone: clone, toCSV: toCSV, toast: toast, copyText: copyText, safeUrl: safeUrl, tool: tool, buildChrome: buildChrome, crisisPanel: crisisPanel };
})();
