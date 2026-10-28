(function () {
  "use strict";
  var G = GQ, MAXM = 600;
  function debt(name, bal, apr, min) { return { id: G.uid(), name: name || "", balance: bal === undefined ? "" : bal, apr: apr === undefined ? "" : apr, min: min === undefined ? "" : min, orig: bal === undefined ? "" : bal }; }
  function defaults() { return { debts: [debt()], budget: "", extra: "", strategy: "avalanche", sc: { name: "", card: "", years: "", ontime: "always", offer: "" }, calls: [], ms: [] }; }
  function demo() {
    var d = defaults();
    d.debts = [debt("SAMPLE Store card", 640, 29.99, 30), debt("SAMPLE Visa", 3200, 24.49, 95), debt("SAMPLE Mastercard", 1850, 19.99, 55), debt("SAMPLE Personal loan", 2400, 11.5, 110)];
    d.debts[0].orig = 900; d.debts[1].orig = 3600; d.debts[2].orig = 1850; d.debts[3].orig = 3000;
    d.budget = 400; d.extra = 50; d.sc = { name: "Sam", card: d.debts[1].id, years: "3 years", ontime: "always", offer: "" };
    d.calls = [{ id: G.uid(), date: G.addDays(G.today(), -10), card: "SAMPLE Store card", who: "Agent (first name only)", result: "Said no; asked again in 6 months", newApr: "" }];
    d.ms = [{ id: G.uid(), date: G.addDays(G.today(), -40), text: "SAMPLE: Made a plan and listed every debt" }, { id: G.uid(), date: G.addDays(G.today(), -12), text: "SAMPLE: First $1,000 paid down" }];
    return d;
  }
  function valid(s) { return s.debts.filter(function (x) { return G.num(x.balance) > 0; }); }
  function sortOrder(ds, strat) { return ds.slice().sort(function (a, b) { return strat === "snowball" ? (G.num(a.balance) - G.num(b.balance)) || (G.num(b.apr) - G.num(a.apr)) : (G.num(b.apr) - G.num(a.apr)) || (G.num(a.balance) - G.num(b.balance)); }); }
  // Monthly estimate: each month add interest (balance x APR/12), pay every minimum, then send the rest of the budget to the target debt(s) in order.
  function simulate(ds, budget, strat) {
    var order = sortOrder(ds, strat), bal = {}, paidOff = {}, interest = 0, month = 0, short = false, sumMin = 0;
    order.forEach(function (x) { bal[x.id] = G.num(x.balance); sumMin += G.num(x.min); });
    if (!order.length) return { empty: true };
    if (budget < sumMin - 0.005) short = true;
    var left = function () { return order.some(function (x) { return bal[x.id] > 0.005; }); };
    while (left() && month < MAXM) {
      month++;
      order.forEach(function (x) { if (bal[x.id] > 0.005) { var i = bal[x.id] * G.num(x.apr) / 100 / 12; bal[x.id] += i; interest += i; } });
      var avail = budget;
      order.forEach(function (x) { if (bal[x.id] > 0.005) { var p = Math.min(G.num(x.min), bal[x.id], Math.max(0, avail)); bal[x.id] -= p; avail -= p; } });
      order.forEach(function (x) { if (avail > 0 && bal[x.id] > 0.005) { var p = Math.min(avail, bal[x.id]); bal[x.id] -= p; avail -= p; } });
      order.forEach(function (x) { if (bal[x.id] <= 0.005 && !paidOff[x.id]) { bal[x.id] = 0; paidOff[x.id] = month; } });
    }
    return { months: left() ? null : month, interest: interest, paidOff: paidOff, order: order, short: short, sumMin: sumMin };
  }
  function monthLabel(n) { if (n == null) return "Not at this payment"; var d = new Date(); d.setDate(1); d.setMonth(d.getMonth() + n); return d.toLocaleDateString("en-US", { month: "short", year: "numeric" }); }
  function dur(n) { if (n == null) return "50+ years"; var y = Math.floor(n / 12), m = n % 12; return (y ? y + " yr " : "") + m + " mo"; }
  function budgetOf(s) { var b = G.num(s.budget); if (!(b > 0)) b = valid(s).reduce(function (a, x) { return a + G.num(x.min); }, 0); return b; }
  function render(s) {
    G.$("#debts").innerHTML = s.debts.map(function (x, i) { var b = "debts." + i + "."; return '<div class="row-card"><div class="field-row two-sm"><label class="field span2" style="margin:0">Name<input type="text" data-bind="' + b + 'name" placeholder="e.g. Visa" data-rerender></label><label class="field" style="margin:0">Balance now<span class="money"><input type="number" inputmode="decimal" min="0" step="0.01" placeholder="0" data-bind="' + b + 'balance" data-rerender></span></label><label class="field" style="margin:0">APR %<input type="number" inputmode="decimal" min="0" max="100" step="0.01" placeholder="e.g. from statement" data-bind="' + b + 'apr" data-rerender></label><label class="field" style="margin:0">Minimum / month<span class="money"><input type="number" inputmode="decimal" min="0" step="0.01" placeholder="0" data-bind="' + b + 'min" data-rerender></span></label><label class="field" style="margin:0">Starting balance<span class="money"><input type="number" inputmode="decimal" min="0" step="0.01" placeholder="0" data-bind="' + b + 'orig" data-rerender></span></label></div><button type="button" class="btn sm ghost no-print" data-action="delDebt" data-i="' + i + '" style="justify-self:start">✕ Remove</button></div>'; }).join("");
    G.$("#sc-card").innerHTML = '<option value="">Choose…</option>' + s.debts.map(function (x) { return '<option value="' + x.id + '">' + G.esc(x.name || "(unnamed)") + "</option>"; }).join("");
    G.$("#ms-quick").innerHTML = ["Paid off a debt 🎉", "First $500 paid down", "First $1,000 paid down", "Got a lower APR", "Halfway there", "Went a month with no new charges"].map(function (t) { return '<button type="button" class="btn sm" data-action="quickMs" data-t="' + G.esc(t) + '">+ ' + G.esc(t) + "</button>"; }).join("");
    G.$("#ms").innerHTML = s.ms.slice().sort(function (a, b) { return (b.date || "").localeCompare(a.date || ""); }).map(function (m) { var i = s.ms.indexOf(m); return '<div class="log-row"><input type="date" aria-label="Date" data-bind="ms.' + i + '.date"><input type="text" class="log-text" aria-label="Milestone" data-bind="ms.' + i + '.text"><button type="button" class="btn icon ghost no-print" data-action="del" data-list="ms" data-i="' + i + '" aria-label="Delete milestone">✕</button></div>'; }).join("") || '<p class="empty small">Every win counts. Log the first one.</p>';
    G.$("#calls").innerHTML = s.calls.map(function (c, i) { var b = "calls." + i + "."; return '<div class="row-card"><div class="field-row two-sm"><label class="field" style="margin:0">Date<input type="date" data-bind="' + b + 'date"></label><label class="field" style="margin:0">Card<input type="text" data-bind="' + b + 'card"></label><label class="field" style="margin:0">Who I spoke with<input type="text" data-bind="' + b + 'who"></label><label class="field" style="margin:0">New APR (if lowered)<input type="number" inputmode="decimal" step="0.01" data-bind="' + b + 'newApr"></label></div><label class="field" style="margin:0">What they said<input type="text" data-bind="' + b + 'result"></label><button type="button" class="btn sm ghost no-print" data-action="del" data-list="calls" data-i="' + i + '" style="justify-self:start">✕ Remove</button></div>'; }).join("") || '<p class="empty small">No calls logged yet.</p>';
    var r = G.$("#extra-range"); r.value = G.num(s.extra);
    if (!r.dataset.wired) { r.dataset.wired = "1"; r.addEventListener("input", function () { API.state.extra = +r.value; G.$("#extra-num").value = r.value; API.save(); update(API.state); }); }
  }
  var API;
  function update(s) {
    var ds = valid(s), budget = budgetOf(s);
    var sn = simulate(ds, budget, "snowball"), av = simulate(ds, budget, "avalanche");
    var bn = G.$("#budget-note");
    if (!ds.length) { bn.innerHTML = ""; G.$("#cmp").innerHTML = '<p class="empty">Add at least one debt with a balance to compare.</p>'; G.$("#order").innerHTML = ""; G.$("#sim").innerHTML = ""; }
    else {
      bn.innerHTML = (sn.short ? '<p class="notice warn small">Your monthly amount is less than your minimums (' + G.money(sn.sumMin, true) + "). Missing minimums can bring late fees and penalty rates, so call your lenders or a nonprofit credit counselor.</p>" : "") + (!(G.num(s.budget) > 0) ? '<p class="small muted">No monthly amount entered, so this shows minimum payments only (' + G.money(budget, true) + "/mo).</p>" : "");
      var best = (av.months != null && sn.months != null) ? (av.interest <= sn.interest ? "avalanche" : "snowball") : null;
      function box(k, r, label, sub) { return '<div class="stat ' + (best === k ? "win mint" : "") + '"><div class="label">' + label + '</div><div class="value" id="pay-' + k + '">' + monthLabel(r.months) + '</div><div class="small">' + (r.months != null ? dur(r.months) + " · about " + G.money(r.interest) + " interest" : "Interest outpaces payments. Raise the monthly amount.") + '</div><div class="small muted">' + sub + "</div></div>"; }
      G.$("#cmp").innerHTML = box("snowball", sn, "Snowball: debt-free by", "Smallest balance first: quick wins.") + box("avalanche", av, "Avalanche: debt-free by", "Highest APR first: least interest.");
      if (best && sn.months != null) { var diff = Math.abs(sn.interest - av.interest); G.$("#cmp").insertAdjacentHTML("beforeend", '<p class="small" style="grid-column:1/-1;margin:0">' + (diff < 1 ? "Both cost about the same here, so pick the one you'll stick with." : "Avalanche saves about " + G.money(diff) + " in interest; snowball pays off its first debt " + (sn.paidOff[sn.order[0].id] <= av.paidOff[av.order[0].id] ? "sooner" : "at a similar time") + ". The best plan is the one you'll stick with.") + "</p>"); }
      G.$("#order").innerHTML = "<thead><tr><th scope='col'>Debt</th><th scope='col'>Balance</th><th scope='col'>APR</th><th scope='col'>Snowball: paid off</th><th scope='col'>Avalanche: paid off</th></tr></thead><tbody>" + ds.map(function (x) { return "<tr><td>" + G.esc(x.name || "Debt") + "</td><td>" + G.money(x.balance) + "</td><td>" + (x.apr === "" ? "—" : G.num(x.apr) + "%") + "</td><td>#" + (sn.order.indexOf(x) + 1) + " · " + (sn.paidOff[x.id] ? monthLabel(sn.paidOff[x.id]) : "—") + "</td><td>#" + (av.order.indexOf(x) + 1) + " · " + (av.paidOff[x.id] ? monthLabel(av.paidOff[x.id]) : "—") + "</td></tr>"; }).join("") + "</tbody>";
      var ex = G.num(s.extra), base = simulate(ds, budget, s.strategy), plus = simulate(ds, budget + ex, s.strategy);
      G.$("#sim").innerHTML = '<div class="stat"><div class="label">Without extra</div><div class="value">' + monthLabel(base.months) + '</div></div><div class="stat mint"><div class="label">With +' + G.money(ex) + '/mo</div><div class="value" id="sim-date">' + monthLabel(plus.months) + '</div></div><div class="stat lav"><div class="label">Time saved</div><div class="value" id="sim-saved">' + (base.months != null && plus.months != null ? dur(base.months - plus.months) : "—") + '</div></div><div class="stat lav"><div class="label">Interest saved</div><div class="value">' + (base.months != null && plus.months != null ? G.money(base.interest - plus.interest) : "—") + "</div></div>";
    }
    G.$("#thermos").innerHTML = s.debts.filter(function (x) { return G.num(x.orig) > 0 || G.num(x.balance) > 0; }).map(function (x) { var o = Math.max(G.num(x.orig), G.num(x.balance)), b = G.num(x.balance), pct = o > 0 ? Math.round((o - b) / o * 100) : 0; return '<div class="thermo-row"><div style="display:flex;justify-content:space-between;gap:.5rem;font-size:.88rem;font-weight:600"><span>' + G.esc(x.name || "Debt") + (b <= 0 ? " 🎉" : "") + "</span><span>" + G.money(b) + " left · " + pct + '% paid</span></div><div class="thermo" role="img" aria-label="' + G.esc(x.name || "Debt") + " " + pct + '% paid off"><span style="width:' + pct + '%"></span></div></div>'; }).join("") || '<p class="empty small">Add a debt to see its thermometer.</p>';
    var card = s.debts.filter(function (x) { return x.id === s.sc.card; })[0], sc = s.sc;
    var hist = sc.ontime === "always" ? " and I've always paid on time" : sc.ontime === "mostly" ? " and I've been paying on time" : "";
    G.$("#script").textContent = "Hi, my name is " + (sc.name || "[name]") + ". I've been a customer " + (card ? "with my " + (card.name || "card") + " card " : "") + (sc.years ? "for " + sc.years : "for a while") + hist + ".\n\n" +
      "My current APR is " + (card && card.apr !== "" ? G.num(card.apr) + "%" : "[APR]%") + ". I'm working on paying my balance down" + (card && G.num(card.balance) > 0 ? " (" + G.money(card.balance) + " right now)" : "") + ", and a lower rate would help me pay it off faster.\n\n" +
      (G.num(sc.offer) > 0 ? "I've been offered a rate of " + G.num(sc.offer) + "% elsewhere, but I'd rather stay with you.\n\n" : "") +
      "Could you review my account for a lower interest rate? What can you do for me today?\n\n" +
      "[If yes] Thank you. Is that rate permanent or promotional, and when does it start?\n[If no] I understand. Is there someone else who could review it, or a hardship or payment program I could ask about?";
  }
  API = G.tool({
    key: "gradiq-debt-countdown-v1", name: "Debt-free countdown", section: "Budget & money",
    defaults: defaults, demo: demo, render: render, update: update,
    actions: {
      addDebt: function (el, s, api) { s.debts.push(debt()); api.commit(true); },
      delDebt: function (el, s, api) { var x = s.debts[+el.getAttribute("data-i")]; if (!confirm("Remove " + (x.name || "this debt") + "?")) return; s.debts.splice(+el.getAttribute("data-i"), 1); api.commit(true); },
      copyScript: function () { G.copyText(G.$("#script").textContent).then(function (ok) { G.toast(ok ? "Script copied" : "Couldn't copy. Select the text instead."); }); },
      addCall: function (el, s, api) { s.calls.unshift({ id: G.uid(), date: G.today(), card: "", who: "", result: "", newApr: "" }); api.commit(true); },
      addMs: function (el, s, api) { s.ms.push({ id: G.uid(), date: G.today(), text: "" }); api.commit(true); },
      quickMs: function (el, s, api) { s.ms.push({ id: G.uid(), date: G.today(), text: el.getAttribute("data-t") }); api.commit(true); G.toast("Milestone logged 🎉"); },
      del: function (el, s, api) { s[el.getAttribute("data-list")].splice(+el.getAttribute("data-i"), 1); api.commit(true); }
    },
    csv: function (s) {
      var ds = valid(s), b = budgetOf(s), sn = simulate(ds, b, "snowball"), av = simulate(ds, b, "avalanche");
      return [{ title: "Debts (payoff months are estimates)", rows: [["Debt", "Balance", "APR %", "Minimum", "Starting balance", "Snowball paid off", "Avalanche paid off"]].concat(s.debts.map(function (x) { return [x.name, x.balance, x.apr, x.min, x.orig, sn.paidOff && sn.paidOff[x.id] ? monthLabel(sn.paidOff[x.id]) : "", av.paidOff && av.paidOff[x.id] ? monthLabel(av.paidOff[x.id]) : ""]; })) },
        { title: "Summary (estimate)", rows: [["Strategy", "Monthly amount", "Debt-free by", "Months", "Estimated interest"], ["Snowball", b.toFixed(2), sn.empty ? "" : monthLabel(sn.months), sn.months == null ? "" : sn.months, sn.empty ? "" : sn.interest.toFixed(2)], ["Avalanche", b.toFixed(2), av.empty ? "" : monthLabel(av.months), av.months == null ? "" : av.months, av.empty ? "" : av.interest.toFixed(2)]] },
        { title: "Milestones", rows: [["Date", "Milestone"]].concat(s.ms.map(function (m) { return [m.date, m.text]; })) },
        { title: "APR calls", rows: [["Date", "Card", "Who", "Result", "New APR"]].concat(s.calls.map(function (c) { return [c.date, c.card, c.who, c.result, c.newApr]; })) }];
    }
  });
  window.GQ_debtSim = simulate;
})();
