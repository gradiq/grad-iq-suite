/* Grad-IQ demo hub: fill product prices and checkout buttons from config.js. */
(function () {
  "use strict";
  var C = window.GRADIQ_CONFIG || {}, P = C.PRICES || {}, B = C.BUY_URLS || {};
  var saleOn = window.GQ_launchOn ? window.GQ_launchOn(C) : false;
  var cOn = window.GQ_completeOn ? window.GQ_completeOn(C) : false;
  function fp(n) { n = +n; return "$" + (Math.round(n) === n ? String(n) : n.toFixed(2)); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function url(u) { u = String(u || "").trim(); if (!u) return ""; if (/^mailto:/i.test(u)) return u; try { var x = new URL(/^https?:\/\//i.test(u) ? u : "https://" + u); return /^https?:$/.test(x.protocol) ? x.href : ""; } catch (e) { return ""; } }
  function endLabel(iso) { var p = String(iso || "").split("-"); if (p.length !== 3) return ""; return new Date(+p[0], +p[1] - 1, +p[2]).toLocaleDateString("en-US", { month: "short", day: "numeric" }); }
  Array.prototype.forEach.call(document.querySelectorAll("[data-product]"), function (card) {
    var k = card.getAttribute("data-product"), tools = (card.getAttribute("data-tools") || "").split(",").filter(Boolean);
    var price = P[k], row = card.querySelector(".price-row"), act = card.querySelector(".actions");
    if (price == null || price === "") { row.innerHTML = '<span class="muted small">Price coming soon</span>'; }
    else {
      var csale = k === "grad-iq-complete-bundle" && cOn, sale = k === "full-suite" && saleOn, now = sale ? +C.LAUNCH_PRICE : csale ? +C.COMPLETE_SALE_PRICE : +price, h = "";
      h += '<span class="price" data-now>' + fp(now) + "</span>";
      if (sale) h += ' <s><span class="sr-only">Regular price </span>' + fp(price) + '</s> <span class="launch-pill">Launch sale: ' + fp(now) + (C.LAUNCH_PRICE_ENDS ? " through " + esc(endLabel(C.LAUNCH_PRICE_ENDS)) : "") + "</span>";
      if (csale) h += ' <s data-was><span class="sr-only">Regular price </span>' + fp(price) + '</s> <span class="launch-pill" data-sale>Sale ends ' + esc(endLabel(C.COMPLETE_SALE_ENDS)) + "</span>";
      if (tools.length > 1) {
        var sep = tools.reduce(function (a, t) { return a + (+P[t] || 0); }, 0);
        if (sep > now) h += '<span class="small" style="flex-basis:100%"><s><span class="sr-only">Bought separately </span>' + fp(sep) + '</s> separately · <span class="save-pill">' + Math.round((1 - now / sep) * 100) + "% off</span></span>";
      }
      row.innerHTML = h;
    }
    var u = url(B[k]);
    act.insertAdjacentHTML("afterbegin", u ? '<a class="btn sm buy-btn" href="' + esc(u) + '" target="_blank" rel="noopener">Get it</a>' : '<span class="pill soon" title="Checkout isn\'t open yet">Coming soon</span>');
  });
})();
