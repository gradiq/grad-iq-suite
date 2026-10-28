(function () {
  "use strict";
  var G = GQ, FREQ = { weekly: 7, biweekly: 14, semimonthly: 15, monthly: 30 };
  var HST = ["To check", "Looking into it", "Applied", "Getting help", "Not for me"];
  var HELP = [
    ["snap", "SNAP (food benefits)", "College students enrolled at least half-time face extra SNAP rules, with several exemptions (for example, working 20 hours a week or having a work-study job). Check the USDA pages and apply through your state agency.", [["USDA: SNAP and college students", "https://www.fns.usda.gov/snap/students"], ["USDA: SNAP eligibility", "https://www.fns.usda.gov/snap/recipient/eligibility"]]],
    ["pantry", "Campus or local food pantry", "Many campuses run a pantry or basic-needs center. Add your campus link. For help off campus, USA.gov lists food assistance programs.", [["USA.gov: Food assistance", "https://www.usa.gov/food-help"]]],
    ["utility", "Utility bill help", "LIHEAP is the federal program that helps with heating and cooling bills, run by each state. Utilities often have payment plans too, so call before a bill is late.", [["HHS: LIHEAP energy bill help", "https://www.acf.hhs.gov/ocs/programs/liheap"], ["USA.gov: Help with bills", "https://www.usa.gov/help-with-bills"]]]
  ];
  function pay(date, amount) { return { id: G.uid(), date: date || G.today(), amount: amount === undefined ? "" : amount }; }
  function bill(name, amount, due, pc) { return { id: G.uid(), name: name || "", amount: amount === undefined ? "" : amount, due: due || "", pc: pc || "" }; }
  function defaults() {
    return { freq: "", cushion: "", pays: [pay(G.today())], bills: [bill("Rent"), bill("Phone"), bill("Utilities"), bill("Internet")],
      subs: [], funds: [], spend: [], help: HELP.map(function (h) { return { key: h[0], status: "To check", link: "", notes: "" }; }) };
  }
  function demo() {
    var t = G.today(), p1 = pay(G.addDays(t, -5), 1150), p2 = pay(G.addDays(t, 9), 1150), p3 = pay(G.addDays(t, 23), 1150);
    var d = { freq: "biweekly", cushion: 50, pays: [p1, p2, p3], bills: [
      bill("SAMPLE Rent (my share)", 725, G.addDays(t, 3)), bill("Phone", 45, G.addDays(t, 1)), bill("Electric", 60, G.addDays(t, 12)), bill("Internet (split)", 30, G.addDays(t, 15)),
      bill("Car insurance", 110, G.addDays(t, 20)), bill("Card minimum", 40, G.addDays(t, 25)), bill("Bus pass", 50, G.addDays(t, 24))],
      subs: [{ id: G.uid(), name: "SAMPLE Streaming A", cost: 15.49, decision: "keep" }, { id: G.uid(), name: "SAMPLE Streaming B", cost: 11.99, decision: "cancel" }, { id: G.uid(), name: "SAMPLE Gym app", cost: 19.99, decision: "pause" }, { id: G.uid(), name: "SAMPLE Cloud storage", cost: 2.99, decision: "keep" }],
      funds: [{ id: G.uid(), name: "SAMPLE Textbooks", target: 180, saved: 40, by: G.addDays(t, 60) }, { id: G.uid(), name: "SAMPLE Holiday travel", target: 250, saved: 60, by: G.addDays(t, 50) }],
      spend: [{ id: G.uid(), date: G.addDays(t, -4), amount: 42.18, note: "SAMPLE groceries" }, { id: G.uid(), date: G.addDays(t, -2), amount: 30, note: "SAMPLE gas" }, { id: G.uid(), date: t, amount: 6.5, note: "SAMPLE coffee" }],
      help: HELP.map(function (h) { return { key: h[0], status: "To check", link: "", notes: "" }; }) };
    d.help[1].status = "Looking into it"; d.help[1].notes = "SAMPLE: campus pantry open Tue/Thu (fictional).";
    autoAssign(d); return d;
  }
  function sortedPays(s) { return s.pays.slice().sort(function (a, b) { return (a.date || "").localeCompare(b.date || ""); }); }
  function autoAssign(s) {
    var ps = sortedPays(s);
    s.bills.forEach(function (b) { if (!b.due || !ps.length) return; var pick = null; ps.forEach(function (p) { if (p.date && p.date <= b.due) pick = p; }); b.pc = (pick || ps[0]).id; });
  }
  function current(s) {
    var ps = sortedPays(s).filter(function (p) { return p.date; }), t = G.today(), cur = null, next = null;
    ps.forEach(function (p) { if (p.date <= t) cur = p; else if (!next) next = p; });
    return { cur: cur, next: next };
  }
  function fundShares(s) {
    // per paycheck id: amount to set aside for sinking funds
    var ps = sortedPays(s).filter(function (p) { return p.date; }), c = current(s), start = c.cur ? c.cur.date : G.today(), out = {};
    ps.forEach(function (p) { out[p.id] = 0; });
    s.funds.forEach(function (f) {
      var left = Math.max(0, G.num(f.target) - G.num(f.saved)); if (!left) return;
      var inn = ps.filter(function (p) { return p.date >= start && (!f.by || p.date <= f.by); });
      if (!inn.length) return; inn.forEach(function (p) { out[p.id] += left / inn.length; });
    });
    return out;
  }
  function payMath(s) {
    var fs = fundShares(s), m = {};
    s.pays.forEach(function (p) { var bills = s.bills.filter(function (b) { return b.pc === p.id; }), bt = bills.reduce(function (a, b) { return a + G.num(b.amount); }, 0); m[p.id] = { bills: bills, billTotal: bt, funds: fs[p.id] || 0, left: G.num(p.amount) - bt - (fs[p.id] || 0) }; });
    return m;
  }
  function safe(s) {
    var c = current(s), m = payMath(s), t = G.today();
    if (!c.cur) return { none: true };
    var period = c.next ? G.diffDays(c.cur.date, c.next.date) : FREQ[s.freq] || null;
    var end = c.next ? c.next.date : period ? G.addDays(c.cur.date, period) : null;
    var daysLeft = end ? Math.max(1, G.diffDays(t, end)) : null;
    var spendable = m[c.cur.id].left - G.num(s.cushion);
    var spent = s.spend.filter(function (x) { return x.date >= c.cur.date && x.date <= t && (!end || x.date < end); }).reduce(function (a, x) { return a + G.num(x.amount); }, 0);
    var remaining = spendable - spent;
    var week = daysLeft ? remaining / daysLeft * Math.min(7, daysLeft) : remaining;
    return { cur: c.cur, next: c.next, end: end, daysLeft: daysLeft, spendable: spendable, spent: spent, remaining: remaining, week: week };
  }
  function opts(s, sel) { return '<option value="">Not assigned</option>' + sortedPays(s).map(function (p) { return '<option value="' + p.id + '">' + G.esc(p.date ? G.fmtDate(p.date, { month: "short", day: "numeric" }) : "No date") + (p.amount !== "" ? " · " + G.money(p.amount) : "") + "</option>"; }).join(""); }
  function render(s) {
    var idx = {}; s.pays.forEach(function (p, i) { idx[p.id] = i; });
    G.$("#pays").innerHTML = sortedPays(s).map(function (p) { var i = idx[p.id]; return '<article class="row-card" data-pay="' + p.id + '"><div class="field-row two-sm"><label class="field" style="margin:0">Payday<input type="date" data-bind="pays.' + i + '.date" data-rerender></label><label class="field" style="margin:0">Take-home amount<span class="money"><input type="number" inputmode="decimal" min="0" step="0.01" placeholder="0" data-bind="pays.' + i + '.amount"></span></label></div><div data-paybody="' + p.id + '"></div><button type="button" class="btn sm danger no-print" data-action="delPay" data-i="' + i + '" style="justify-self:start">Remove paycheck</button></article>'; }).join("") || '<p class="empty">Add your next paycheck to start.</p>';
    G.$("#bills").innerHTML = s.bills.map(function (b, i) { return '<div class="row-card"><div class="field-row two-sm"><label class="field span2" style="margin:0">Bill<input type="text" data-bind="bills.' + i + '.name" placeholder="Bill name"></label><label class="field" style="margin:0">Amount<span class="money"><input type="number" inputmode="decimal" min="0" step="0.01" placeholder="0" data-bind="bills.' + i + '.amount"></span></label><label class="field" style="margin:0">Due date<input type="date" data-bind="bills.' + i + '.due" data-rerender></label><label class="field" style="margin:0">Paid from<select data-bind="bills.' + i + '.pc" data-rerender>' + opts(s) + '</select></label></div><button type="button" class="btn sm ghost no-print" data-action="del" data-list="bills" data-i="' + i + '" style="justify-self:start">✕ Remove bill</button></div>'; }).join("") || '<p class="empty">No bills yet.</p>';
    G.$("#subs").innerHTML = s.subs.map(function (x, i) { return '<div class="cat-row"><input type="text" aria-label="Subscription" placeholder="Subscription" data-bind="subs.' + i + '.name"><span class="money"><input type="number" inputmode="decimal" min="0" step="0.01" placeholder="0" aria-label="Monthly cost" data-bind="subs.' + i + '.cost"></span><select aria-label="Decision" data-bind="subs.' + i + '.decision"><option value="keep">Keep</option><option value="pause">Pause</option><option value="cancel">Cancel</option></select><button type="button" class="btn icon ghost no-print" data-action="del" data-list="subs" data-i="' + i + '" aria-label="Delete subscription">✕</button></div>'; }).join("") || '<p class="empty">No subscriptions listed yet.</p>';
    G.$("#funds").innerHTML = s.funds.map(function (f, i) { return '<div class="row-card"><div class="field-row two-sm"><label class="field span2" style="margin:0">Fund<input type="text" data-bind="funds.' + i + '.name" placeholder="e.g. Car repairs"></label><label class="field" style="margin:0">Target<span class="money"><input type="number" inputmode="decimal" min="0" step="1" placeholder="0" data-bind="funds.' + i + '.target"></span></label><label class="field" style="margin:0">Saved so far<span class="money"><input type="number" inputmode="decimal" min="0" step="1" placeholder="0" data-bind="funds.' + i + '.saved"></span></label><label class="field" style="margin:0">Needed by<input type="date" data-bind="funds.' + i + '.by"></label></div><div data-fund="' + i + '"></div><button type="button" class="btn sm ghost no-print" data-action="del" data-list="funds" data-i="' + i + '" style="justify-self:start">✕ Remove fund</button></div>'; }).join("") || '<p class="empty">No sinking funds yet.</p>';
    G.$("#help").innerHTML = s.help.map(function (h, i) { var def = HELP.filter(function (x) { return x[0] === h.key; })[0]; if (!def) return ""; var my = G.safeUrl(h.link); return '<article class="row-card"><div style="display:flex;justify-content:space-between;gap:.5rem;align-items:flex-start"><h3 style="margin:0;font-family:var(--font);font-weight:700">' + def[1] + '</h3><span class="pill" data-hpill="' + i + '"></span></div><p class="small" style="margin:0">' + def[2] + '</p><ul class="small" style="margin:0;padding-left:1.1rem">' + def[3].map(function (l) { return '<li><a href="' + l[1] + '" target="_blank" rel="noopener">' + l[0] + "</a></li>"; }).join("") + (my ? '<li><a href="' + G.esc(my) + '" target="_blank" rel="noopener">My campus / local link</a></li>' : "") + '</ul><div class="field-row"><label class="field" style="margin:0">Status<select data-bind="help.' + i + '.status" data-rerender>' + HST.map(function (o) { return "<option>" + o + "</option>"; }).join("") + '</select></label><label class="field" style="margin:0">My campus / local link<input type="url" placeholder="https://…" data-bind="help.' + i + '.link" data-rerender></label></div><label class="field" style="margin:0">Notes<textarea rows="2" style="min-height:56px" data-bind="help.' + i + '.notes" placeholder="Who I talked to, documents needed, next step…"></textarea></label></article>'; }).join("");
    var cs = current(s), from = cs.cur ? cs.cur.date : "";
    var rows = s.spend.map(function (x, i) { return { x: x, i: i }; }).sort(function (a, b) { return (b.x.date || "").localeCompare(a.x.date || ""); }).slice(0, 12);
    G.$("#spend").innerHTML = "<thead><tr><th scope='col'>Date</th><th scope='col'>Amount</th><th scope='col'>What</th><th scope='col'><span class='sr-only'>Delete</span></th></tr></thead><tbody>" + (rows.length ? rows.map(function (r) { return "<tr" + (from && r.x.date < from ? " class='muted'" : "") + "><td>" + G.fmtDate(r.x.date, { month: "short", day: "numeric" }) + "</td><td>" + G.money(r.x.amount, true) + "</td><td>" + G.esc(r.x.note) + '</td><td><button type="button" class="btn sm ghost no-print" data-action="del" data-list="spend" data-i="' + r.i + '" aria-label="Delete entry">✕</button></td></tr>'; }).join("") : '<tr><td colspan="4" class="empty">Nothing logged this pay period yet.</td></tr>') + "</tbody>";
    if (!G.$("#sp-date").value) G.$("#sp-date").value = G.today();
  }
  function update(s) {
    var m = payMath(s), c = current(s);
    sortedPays(s).forEach(function (p) {
      var el = G.$('[data-paybody="' + p.id + '"]'); if (!el) return; var x = m[p.id];
      el.innerHTML = (x.bills.length ? '<ul class="small" style="margin:0 0 .3rem;padding-left:1.1rem">' + x.bills.map(function (b) { return "<li>" + G.esc(b.name || "Bill") + " · " + G.money(b.amount, true) + (b.due ? ' <span class="muted">due ' + G.fmtDate(b.due, { month: "short", day: "numeric" }) + "</span>" : "") + "</li>"; }).join("") + "</ul>" : '<p class="small muted" style="margin:0 0 .3rem">No bills assigned.</p>') +
        (x.funds ? '<p class="small" style="margin:0 0 .3rem">Sinking funds set-aside: ' + G.money(x.funds, true) + "</p>" : "") +
        '<div style="display:flex;flex-wrap:wrap;gap:.4rem;align-items:center"><span class="pill">Bills ' + G.money(x.billTotal, true) + '</span><span class="pill ' + (x.left < 0 ? "bad" : "ok") + '" data-left="' + p.id + '">' + (x.left < 0 ? "Short by " + G.money(-x.left, true) : "Left " + G.money(x.left, true)) + "</span>" + (c.cur && c.cur.id === p.id ? '<span class="pill lav">Current paycheck</span>' : "") + "</div>" +
        (x.left < 0 ? '<p class="notice warn small" style="margin:.4rem 0 0" role="alert">⚠️ This paycheck goes negative. Move a bill to another paycheck, ask about a due-date change, or trim a sinking fund.</p>' : "");
    });
    var sf = safe(s);
    if (sf.none) { G.$("#sts").innerHTML = '<div class="stat big"><div class="label">Safe to spend</div><div class="value">—</div></div>'; G.$("#sts-note").innerHTML = '<p class="small muted">Add a paycheck dated today or earlier to see your number.</p>'; }
    else {
      G.$("#sts").innerHTML = '<div class="stat big ' + (sf.week < 0 ? "neg" : "pos") + '"><div class="label">Safe to spend' + (sf.daysLeft && sf.daysLeft < 7 ? " until payday" : " next 7 days") + '</div><div class="value" id="safe-week">' + (sf.week < 0 ? "−" : "") + G.money(Math.abs(sf.week), true) + '</div></div><div class="stat"><div class="label">Left this pay period</div><div class="value" id="left-period">' + G.money(sf.remaining, true) + '</div></div><div class="stat"><div class="label">Spent since payday</div><div class="value">' + G.money(sf.spent, true) + '</div></div><div class="stat sky"><div class="label">Next payday</div><div class="value">' + (sf.end ? G.fmtDate(sf.end, { month: "short", day: "numeric" }) : "—") + "</div></div>";
      G.$("#sts-note").innerHTML = '<p class="small" style="margin:0">From your ' + G.fmtDate(sf.cur.date, { month: "short", day: "numeric" }) + " paycheck, after its bills, sinking funds and your cushion" + (sf.daysLeft ? ", spread evenly over the " + sf.daysLeft + " day" + (sf.daysLeft > 1 ? "s" : "") + " until payday." : ".") + "</p>" + (!sf.end ? '<p class="small muted" style="margin:.3rem 0 0">Add your next paycheck (or choose how often you\'re paid) to spread this over the period.</p>' : "") + (sf.week < 0 ? '<p class="notice warn small" style="margin:.5rem 0 0">You\'re over for this pay period. Check the help finder below, and see if a bill can move to your next paycheck.</p>' : "");
    }
    var keep = 0, saved = 0; s.subs.forEach(function (x) { if (x.decision === "keep") keep += G.num(x.cost); else saved += G.num(x.cost); });
    G.$("#sub-stats").innerHTML = '<div class="stat"><div class="label">Keeping / month</div><div class="value">' + G.money(keep, true) + '</div></div><div class="stat mint"><div class="label">Saved / month</div><div class="value" id="sub-saved">' + G.money(saved, true) + '</div></div><div class="stat mint"><div class="label">Saved / year</div><div class="value">' + G.money(saved * 12, true) + "</div></div>";
    var fs = fundShares(s), ps = sortedPays(s);
    s.funds.forEach(function (f, i) { var el = G.$('[data-fund="' + i + '"]'); if (!el) return; var t = G.num(f.target), have = G.num(f.saved), pct = t > 0 ? Math.min(100, Math.round(have / t * 100)) : 0, inn = ps.filter(function (p) { return p.date && fs[p.id] > 0 && (!f.by || p.date <= f.by) && p.date >= (c.cur ? c.cur.date : G.today()); }).length, left = Math.max(0, t - have);
      el.innerHTML = '<div class="bar save" role="img" aria-label="' + pct + '% saved"><span style="width:' + pct + '%"></span></div><p class="small" style="margin:.3rem 0 0">' + (left === 0 ? "Fully funded ✓" : inn ? G.money(left / inn, true) + " from each of " + inn + " paycheck" + (inn > 1 ? "s" : "") + " before " + (f.by ? G.fmtDate(f.by, { month: "short", day: "numeric" }) : "the date") : "Add a paycheck before this date to plan set-asides.") + "</p>"; });
    var done = s.help.filter(function (h) { return h.status !== "To check"; }).length;
    G.$("#help-prog").textContent = done + " of " + s.help.length + " looked into";
    G.$$("[data-hpill]").forEach(function (el) { var h = s.help[+el.getAttribute("data-hpill")]; el.textContent = h.status; el.className = "pill " + ({ "Getting help": "ok", "Applied": "ok", "Looking into it": "warn", "To check": "lav" }[h.status] || ""); });
  }
  function nextDate(s, d) { var f = s.freq; if (f === "monthly") { var x = G.parseISO(d); x.setMonth(x.getMonth() + 1); return G.iso(x); } if (f === "semimonthly") { var y = G.parseISO(d); if (y.getDate() < 15) { y.setDate(y.getDate() + 15); } else { y.setMonth(y.getMonth() + 1); y.setDate(y.getDate() - 15); } return G.iso(y); } return G.addDays(d, FREQ[f] || 14); }
  G.tool({
    key: "gradiq-paycheck-v1", name: "Paycheck-to-paycheck planner", section: "Budget & money",
    defaults: defaults, demo: demo, render: render, update: update,
    actions: {
      addPay: function (el, s, api) { var ps = sortedPays(s).filter(function (p) { return p.date; }), last = ps[ps.length - 1]; if (last && !s.freq) G.toast("Tip: choose how often you're paid to auto-date paychecks"); s.pays.push(pay(last ? (s.freq && s.freq !== "irregular" ? nextDate(s, last.date) : G.addDays(last.date, 14)) : G.today(), last ? last.amount : "")); api.commit(true); },
      delPay: function (el, s, api) { var p = s.pays[+el.getAttribute("data-i")]; if (!confirm("Remove this paycheck? Its bills become unassigned.")) return; s.bills.forEach(function (b) { if (b.pc === p.id) b.pc = ""; }); s.pays.splice(+el.getAttribute("data-i"), 1); api.commit(true); },
      autoAssign: function (el, s, api) { if (!s.pays.length) { G.toast("Add a paycheck first"); return; } var missing = s.bills.filter(function (b) { return !b.due; }).length; autoAssign(s); api.commit(true); G.toast(missing ? missing + " bill(s) need a due date first" : "Bills assigned"); },
      addBill: function (el, s, api) { s.bills.push(bill()); api.commit(true); },
      rollBills: function (el, s, api) { if (!confirm("Move every bill's due date forward one month and clear assignments?")) return; s.bills.forEach(function (b) { if (b.due) { var d = G.parseISO(b.due); d.setMonth(d.getMonth() + 1); b.due = G.iso(d); } b.pc = ""; }); api.commit(true); G.toast("Bills moved to next month. Add paychecks, then auto-assign."); },
      addSub: function (el, s, api) { s.subs.push({ id: G.uid(), name: "", cost: "", decision: "keep" }); api.commit(true); },
      addFund: function (el, s, api) { s.funds.push({ id: G.uid(), name: "", target: "", saved: "", by: "" }); api.commit(true); },
      addSpend: function (el, s, api) { var a = G.$("#sp-amt").value; if (a === "" || !(+a > 0)) { G.toast("Enter an amount"); G.$("#sp-amt").focus(); return; } s.spend.push({ id: G.uid(), date: G.$("#sp-date").value || G.today(), amount: +a, note: G.$("#sp-note").value.trim() }); G.$("#sp-amt").value = ""; G.$("#sp-note").value = ""; api.commit(true); G.toast("Logged"); },
      del: function (el, s, api) { if (!confirm("Delete this entry?")) return; s[el.getAttribute("data-list")].splice(+el.getAttribute("data-i"), 1); api.commit(true); }
    },
    csv: function (s) {
      var m = payMath(s), pid = {}; s.pays.forEach(function (p) { pid[p.id] = p.date; });
      return [{ title: "Paychecks", rows: [["Payday", "Amount", "Bills", "Sinking funds", "Left"]].concat(sortedPays(s).map(function (p) { var x = m[p.id]; return [p.date, G.num(p.amount).toFixed(2), x.billTotal.toFixed(2), x.funds.toFixed(2), x.left.toFixed(2)]; })) },
        { title: "Bills", rows: [["Bill", "Amount", "Due", "Paid from paycheck"]].concat(s.bills.map(function (b) { return [b.name, G.num(b.amount).toFixed(2), b.due, pid[b.pc] || ""]; })) },
        { title: "Spending", rows: [["Date", "Amount", "What"]].concat(s.spend.map(function (x) { return [x.date, G.num(x.amount).toFixed(2), x.note]; })) },
        { title: "Subscriptions", rows: [["Subscription", "Monthly cost", "Decision"]].concat(s.subs.map(function (x) { return [x.name, G.num(x.cost).toFixed(2), x.decision]; })) },
        { title: "Sinking funds", rows: [["Fund", "Target", "Saved", "Needed by"]].concat(s.funds.map(function (f) { return [f.name, f.target, f.saved, f.by]; })) }];
    }
  });
})();
