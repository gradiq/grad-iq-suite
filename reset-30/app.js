(function () {
  "use strict";
  var G = GQ, AREAS = ["Sleep", "Phone", "Body", "Money", "Learning"], MOODS = ["😣 Dreading it", "😕 Meh", "😐 Neutral", "🙂 OK", "😀 Ready"];
  var TIMER_MIN = 10, T = { end: 0, iv: null, before: "", task: "" };
  function defaults() {
    return { start: G.today(), weeks: [0, 1, 2, 3].map(function (i) { return { area: AREAS[i], action: "" }; }), wrap: "",
      habits: [{ id: G.uid(), name: "", days: {} }], screen: {}, swaps: "Go for a 10-minute walk\nRead 5 pages\nStretch\nText a friend\nTidy one surface", sessions: [],
      proof: [0, 1, 2, 3, 4].map(function () { return { wins: "", evidence: "", next: "" }; }) };
  }
  function demo() {
    var d = defaults(), st = G.addDays(G.today(), -9); d.start = st;
    d.weeks[0].action = "SAMPLE: lights out by 11:30, phone charging in the kitchen"; d.weeks[1].action = "SAMPLE: social apps in a folder on page 3; 30-min daily limit";
    d.habits = [{ id: G.uid(), name: "Phone out of bedroom", days: {} }, { id: G.uid(), name: "10 min of reading", days: {} }, { id: G.uid(), name: "Walk outside", days: {} }];
    var pat = ["1111011101", "1101101111", "1011001110"];
    d.habits.forEach(function (h, k) { for (var i = 0; i < 10; i++) if (pat[k][i] === "1") h.days[G.addDays(st, i)] = true; });
    for (var i = 0; i < 7; i++) { var day = G.addDays(G.today(), -i); d.screen[day] = { minutes: [312, 260, 241, 290, 205, 188, 176][6 - i], swap: ["Read 5 pages", "Go for a 10-minute walk", "Stretch"][i % 3], bed: i < 4 }; }
    d.sessions = [{ date: G.addDays(G.today(), -3), task: "SAMPLE: outline lab report", before: 1, after: 4, kept: true }, { date: G.addDays(G.today(), -1), task: "SAMPLE: email advisor", before: 2, after: 4, kept: false }];
    d.proof[0] = { wins: "SAMPLE: asleep before midnight 5 of 7 nights.", evidence: "SAMPLE: screen time down from 5h12m to 4h05m.", next: "SAMPLE: phone week — move apps off the home screen." };
    return d;
  }
  function dayNum(s) { var n = G.diffDays(s.start, G.today()); return n == null ? null : n + 1; }
  function missed(h, iso) { return iso < G.today() && !h.days[iso]; }
  function bedStreak(s) { var n = 0, d = G.today(); if (!(s.screen[d] && s.screen[d].bed)) d = G.addDays(d, -1); while (s.screen[d] && s.screen[d].bed) { n++; d = G.addDays(d, -1); } return n; }
  function swapList(s) { return String(s.swaps || "").split(/\n/).map(function (x) { return x.trim(); }).filter(Boolean); }
  function moodRow(name, val) { return MOODS.map(function (m, i) { return '<label><input type="radio" name="' + name + '" value="' + (i + 1) + '"' + (String(val) === String(i + 1) ? " checked" : "") + ">" + m + "</label>"; }).join(""); }
  function render(s) {
    var dn = dayNum(s);
    G.$("#weeks").innerHTML = s.weeks.map(function (w, i) { var a = G.addDays(s.start, i * 7), b = G.addDays(s.start, i * 7 + 6), cur = dn && dn > i * 7 && dn <= i * 7 + 7; return '<article class="row-card"' + (cur ? ' style="outline:2px solid var(--plum-2)"' : "") + '><div style="display:flex;justify-content:space-between;gap:.5rem;flex-wrap:wrap"><strong>Week ' + (i + 1) + ' <span class="small muted">' + G.fmtDate(a, { month: "short", day: "numeric" }) + "–" + G.fmtDate(b, { month: "short", day: "numeric" }) + "</span></strong>" + (cur ? '<span class="pill lav">This week</span>' : "") + '</div><div class="field-row"><label class="field" style="margin:0">Focus area<select data-bind="weeks.' + i + '.area">' + AREAS.map(function (x) { return "<option>" + x + "</option>"; }).join("") + '</select></label><label class="field" style="margin:0">My one small change<input type="text" data-bind="weeks.' + i + '.action" placeholder="Small enough to do on a bad day"></label></div></article>'; }).join("") +
      '<article class="row-card"><strong>Days 29–30: wrap-up <span class="small muted">' + G.fmtDate(G.addDays(s.start, 28), { month: "short", day: "numeric" }) + "–" + G.fmtDate(G.addDays(s.start, 29), { month: "short", day: "numeric" }) + '</span></strong><label class="field" style="margin:0">What I keep, and my focus for the next reset<input type="text" data-bind="wrap"></label></article>';
    if (!G.$("#mood-before").innerHTML) G.$("#mood-before").innerHTML = moodRow("mb", "");
    var days = []; for (var i = 0; i < 30; i++) days.push(G.addDays(s.start, i));
    var t = G.today();
    G.$("#grid").innerHTML = "<thead><tr><th class='hname' scope='col'>Habit</th>" + days.map(function (d, i) { return "<th scope='col'>" + (i + 1) + "</th>"; }).join("") + "</tr></thead><tbody>" + s.habits.map(function (h, hi) {
      return "<tr><th class='hname' scope='row'>" + G.esc(h.name || "Habit " + (hi + 1)) + "</th>" + days.map(function (d, i) { var done = !!h.days[d], m = missed(h, d), m2 = m && i > 0 && missed(h, days[i - 1]); var cls = "hcell" + (done ? " done" : m2 ? " miss2" : m ? " miss" : "") + (d === t ? " today" : ""); return '<td><button type="button" class="' + cls + '" data-action="cell" data-h="' + hi + '" data-d="' + d + '"' + (d > t ? " disabled" : "") + ' aria-label="' + G.esc(h.name || "Habit") + " day " + (i + 1) + (done ? " done" : m ? " missed" : "") + '">' + (done ? "✓" : m ? "✕" : "") + "</button></td>"; }).join("") + "</tr>"; }).join("") + "</tbody>";
    var tc = G.$("#grid .hcell.today"), sc = G.$(".habit-scroll"); if (tc && sc) { var x = tc.getBoundingClientRect().left - sc.getBoundingClientRect().left + sc.scrollLeft; sc.scrollLeft = Math.max(0, x - sc.clientWidth + 80); }
    G.$("#habit-names").innerHTML = s.habits.map(function (h, i) { return '<div class="ck-row" style="grid-template-columns:minmax(0,1fr) 44px"><input type="text" aria-label="Habit name" placeholder="Habit name (tiny is fine)" data-bind="habits.' + i + '.name" data-rerender><button type="button" class="btn icon ghost no-print" data-action="delHabit" data-i="' + i + '" aria-label="Delete habit">✕</button></div>'; }).join("");
    var sw = swapList(s), rows = [];
    for (var k = 0; k < 7; k++) { var day = G.addDays(t, -k); if (!s.screen[day]) s.screen[day] = { minutes: "", swap: "", bed: false }; rows.push(day); }
    G.$("#screen").innerHTML = rows.map(function (day) { var b = 'screen.' + day + '.'; return '<div class="row-card"><strong class="small">' + (day === t ? "Today" : G.fmtDate(day, { weekday: "short", month: "short", day: "numeric" })) + '</strong><div class="field-row two-sm"><label class="field" style="margin:0">Screen time (min)<input type="number" inputmode="numeric" min="0" step="1" placeholder="0" data-bind="' + b + 'minutes"></label><label class="field" style="margin:0">Instead I did<select data-bind="' + b + 'swap"><option value="">—</option>' + sw.map(function (x) { return '<option value="' + G.esc(x) + '">' + G.esc(x) + "</option>"; }).join("") + '</select></label><label class="check span2" style="align-self:center"><input type="checkbox" data-bind="' + b + 'bed" data-rerender>Phone stayed out of bed</label></div></div>'; }).join("");
    G.$("#proof").innerHTML = s.proof.map(function (p, i) { return '<article class="row-card"><strong>' + (i < 4 ? "Week " + (i + 1) + (s.weeks[i] ? " · " + G.esc(s.weeks[i].area) : "") : "Wrap-up") + '</strong><div class="mini-grid"><label class="field" style="margin:0">Wins<textarea rows="2" style="min-height:56px" data-bind="proof.' + i + '.wins"></textarea></label><label class="field" style="margin:0">Evidence (numbers, photos, streaks)<textarea rows="2" style="min-height:56px" data-bind="proof.' + i + '.evidence"></textarea></label><label class="field" style="margin:0">Next week I\'ll…<textarea rows="2" style="min-height:56px" data-bind="proof.' + i + '.next"></textarea></label></div></article>'; }).join("");
    G.$("#sessions").innerHTML = "<thead><tr><th scope='col'>Date</th><th scope='col'>Started on</th><th scope='col'>Mood before → after</th><th scope='col'>Kept going?</th></tr></thead><tbody>" + (s.sessions.length ? s.sessions.slice().reverse().map(function (x) { return "<tr><td>" + G.fmtDate(x.date, { month: "short", day: "numeric" }) + "</td><td>" + G.esc(x.task) + "</td><td>" + (x.before || "—") + " → " + (x.after || "—") + "</td><td>" + (x.kept ? "Yes" : "Stopped (still counts)") + "</td></tr>"; }).join("") : '<tr><td colspan="4" class="empty">No starts logged yet.</td></tr>') + "</tbody>";
  }
  function update(s) {
    var dn = dayNum(s);
    G.$("#daynum").textContent = dn == null ? "" : dn < 1 ? "Starts in " + (1 - dn) + " day" + (dn === 0 ? "" : "s") : dn > 30 ? "Reset complete 🎉" : "Day " + dn + " of 30";
    var t = G.today(), y = G.addDays(t, -1), warn = s.habits.filter(function (h) { return y >= s.start && missed(h, y) && !h.days[t]; });
    G.$("#twice").innerHTML = warn.length ? '<p class="notice warn small" role="status">Don\'t miss twice: ' + warn.map(function (h) { return "<strong>" + G.esc(h.name || "a habit") + "</strong>"; }).join(", ") + " missed yesterday. Do the smallest possible version today.</p>" : "";
    G.$("#bedstreak").textContent = "🛏️ " + bedStreak(s) + "-night no-phone-in-bed streak";
    var mins = [], t0 = []; for (var k = 0; k < 7; k++) { var e = s.screen[G.addDays(t, -k)]; if (e && e.minutes !== "" && e.minutes != null) mins.push(G.num(e.minutes)); }
    var avg = mins.length ? mins.reduce(function (a, b) { return a + b; }, 0) / mins.length : null, swaps = 0;
    for (k = 0; k < 7; k++) { var e2 = s.screen[G.addDays(t, -k)]; if (e2 && e2.swap) swaps++; }
    function hm(m) { m = Math.round(m); return Math.floor(m / 60) + "h " + (m % 60) + "m"; }
    G.$("#screen-stats").innerHTML = '<div class="stat lav"><div class="label">7-day average</div><div class="value">' + (avg == null ? "—" : hm(avg)) + '</div></div><div class="stat mint"><div class="label">Swaps this week</div><div class="value">' + swaps + "</div></div>";
  }
  function fmt(ms) { var sec = Math.max(0, Math.ceil(ms / 1000)); return Math.floor(sec / 60) + ":" + String(sec % 60).padStart(2, "0"); }
  function beep() { try { var C = window.AudioContext || window.webkitAudioContext; if (!C) return; var c = new C(), o = c.createOscillator(), g = c.createGain(); o.frequency.value = 660; g.gain.value = 0.15; o.connect(g); g.connect(c.destination); o.start(); setTimeout(function () { o.frequency.value = 880; }, 250); setTimeout(function () { o.stop(); c.close(); }, 600); } catch (e) { /* no audio */ } }
  function popup(msg) { try { if (window.Notification && Notification.permission === "granted") new Notification("Grad-IQ", { body: msg }); } catch (e) { /* ignore */ } }
  var API;
  function tick() {
    var left = T.end - Date.now(); G.$("#t-face").textContent = fmt(left);
    if (left <= 0) { clearInterval(T.iv); T.iv = null; T.end = 0; document.title = "⏰ Done · 30-Day Reset Planner · Grad-IQ"; beep(); popup("10 minutes done. Keep going or stop, both count."); G.toast("10 minutes done!");
      var box = G.$("#t-done"); box.hidden = false; box.className = "alert-box"; box.setAttribute("role", "alert");
      box.innerHTML = "<p style='margin:0 0 .4rem'>⏰ 10 minutes done. Keep going or stop: both count.</p><fieldset style='border:0;padding:0;margin:0'><legend class='small'>How do you feel now?</legend><div class='mood-row' id='mood-after'>" + moodRow("ma", "") + "</div></fieldset><div class='btn-row'><button type='button' class='btn sm primary' data-action='tLog' data-kept='1'>Log it: I'm keeping going</button><button type='button' class='btn sm secondary' data-action='tLog' data-kept='0'>Log it: stopping here</button></div>";
      G.$("#t-start").disabled = false; }
  }
  API = G.tool({
    key: "gradiq-reset-30-v1", name: "30-day reset planner", section: "Life & launch",
    defaults: defaults, demo: demo, render: render, update: update,
    actions: {
      tStart: function () { var mb = G.$('input[name="mb"]:checked'); T.before = mb ? +mb.value : ""; T.task = G.$("#t-task").value.trim(); T.end = Date.now() + TIMER_MIN * 60000; G.$("#t-done").hidden = true; G.$("#t-start").disabled = true; document.title = "30-Day Reset Planner · Grad-IQ"; clearInterval(T.iv); T.iv = setInterval(tick, 250); tick(); G.toast("Timer started: just 10 minutes"); },
      tStop: function () { clearInterval(T.iv); T.iv = null; T.end = 0; G.$("#t-face").textContent = "10:00"; G.$("#t-start").disabled = false; },
      tLog: function (el, s, api) { var ma = G.$('input[name="ma"]:checked'); s.sessions.push({ date: G.today(), task: T.task || "(no task named)", before: T.before, after: ma ? +ma.value : "", kept: el.getAttribute("data-kept") === "1" }); G.$("#t-done").hidden = true; G.$("#t-face").textContent = "10:00"; document.title = "30-Day Reset Planner · Grad-IQ"; api.commit(true); G.toast("Start logged"); },
      notify: function () { if (!window.Notification) { G.toast("This browser doesn't support pop-up alerts. In-page alerts still work."); return; } Notification.requestPermission().then(function (p) { G.toast(p === "granted" ? "Pop-up alerts on (keep this tab open)" : "Pop-ups not allowed. In-page alerts still work."); }); },
      cell: function (el, s, api) { var h = s.habits[+el.getAttribute("data-h")], d = el.getAttribute("data-d"); if (h.days[d]) delete h.days[d]; else h.days[d] = true; api.commit(true); },
      addHabit: function (el, s, api) { s.habits.push({ id: G.uid(), name: "", days: {} }); api.commit(true); },
      delHabit: function (el, s, api) { if (!confirm("Delete this habit and its days?")) return; s.habits.splice(+el.getAttribute("data-i"), 1); api.commit(true); }
    },
    csv: function (s) {
      var days = []; for (var i = 0; i < 30; i++) days.push(G.addDays(s.start, i));
      return [{ title: "Habit grid (1 = done)", rows: [["Habit"].concat(days)].concat(s.habits.map(function (h) { return [h.name].concat(days.map(function (d) { return h.days[d] ? 1 : (d < G.today() ? 0 : ""); })); })) },
        { title: "Screen time", rows: [["Date", "Minutes", "Replacement", "Phone out of bed"]].concat(Object.keys(s.screen).sort().map(function (d) { var e = s.screen[d]; return [d, e.minutes, e.swap, e.bed ? "yes" : "no"]; })) },
        { title: "10-minute starts", rows: [["Date", "Task", "Mood before (1-5)", "Mood after (1-5)", "Kept going"]].concat(s.sessions.map(function (x) { return [x.date, x.task, x.before, x.after, x.kept ? "yes" : "no"]; })) },
        { title: "Focus weeks and proof", rows: [["Week", "Focus", "Small change", "Wins", "Evidence", "Next"]].concat(s.proof.map(function (p, i) { var w = s.weeks[i] || { area: "Wrap-up", action: s.wrap }; return [i < 4 ? i + 1 : "29-30", w.area, w.action, p.wins, p.evidence, p.next]; })) }];
    }
  });
})();
