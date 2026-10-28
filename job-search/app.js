(function () {
  "use strict";
  var G = GQ, OPEN = {};
  var STAGES = [["saved", "Saved"], ["applied", "Applied"], ["screen", "Screen"], ["interview", "Interview"], ["offer", "Offer"], ["rejected", "Rejected"]];
  var COLS = [["saved", "Saved"], ["applied", "Applied"], ["screen", "Screen"], ["interview", "Interview"], ["closed", "Offer / Reject"]];
  var TAILOR = [["title", "My headline or summary uses this job's title"], ["top3", "The ad's top 3 skills appear in my bullets"], ["results", "Each bullet shows a result (number, outcome or scale)"], ["trim", "Cut bullets that don't fit this role"], ["why", "My note says why this company, in one or two lines"], ["file", "File named Firstname-Lastname-Company.pdf"]];
  var CHECKS = [["official", "Found this job on the employer's own website"], ["domain", "Recruiter's email matches the company (not a personal account)"], ["search", "Searched the company name + \"scam\", \"review\", \"complaint\""], ["trusted", "Asked someone I trust to look at it"]];
  var FLAGS = [["pay", "Asked me to pay for training, equipment or a background check"], ["check", "Sent a check to deposit and send part back, or asked for gift cards"], ["mule", "Asked me to receive or move money through my bank account"], ["id", "Wants ID, Social Security or bank details before a real interview"], ["text", "Contacted me out of the blue by text, WhatsApp or Telegram"], ["vague", "High pay with little detail about the actual work"]];
  var VERBS = ["Led", "Built", "Organized", "Created", "Improved", "Managed", "Taught", "Analyzed", "Designed", "Supported", "Coordinated", "Wrote"];
  var STOP = ("a about above across after again against all also am an and any are as at be because been before being below between both but by can could did do does doing down during each etc few for from further had has have having he her here hers him his how i if in into is it its itself just me more most my no nor not of off on once only or other our ours out over own per same she should so some such than that the their theirs them then there these they this those through to too under until up very via was we were what when where which while who whom why will with within without would you your yours able across ability abilities apply applicant applicants candidate candidates company including include includes job jobs looking must new opportunity position preferred required requirements responsibilities role team teams work working year years strong excellent plus well using use help skills skill experience experienced knowledge understanding environment based level ensure equal employer status related required qualifications qualified benefits salary day days time full part like make one two three us our world join").split(" ");
  var STOPSET = {}; STOP.forEach(function (w) { STOPSET[w] = 1; });

  function monday(d) { var x = G.parseISO(d || G.today()); var k = (x.getDay() + 6) % 7; x.setDate(x.getDate() - k); return G.iso(x); }
  function job(company, role, stage) { return { id: G.uid(), company: company || "", role: role || "", url: "", stage: stage || "saved", applied: "", lastContact: G.today(), next: "", notes: "", ad: "", kws: [], tailor: {}, scam: {} }; }
  function defaults() {
    return { followDays: "", jobs: [], targets: { apps: "", net: "", skill: "" }, weeks: {},
      stories: [{ id: G.uid(), title: "", s: "", t: "", a: "", r: "", skills: "" }],
      questions: ["What would success look like in the first 90 days?", "What is the team working on right now that's hardest?", "How do people on this team get feedback?", "What are the next steps, and when should I expect to hear back?"].map(function (q) { return { id: G.uid(), q: q }; }),
      log: [], exps: [{ id: G.uid(), type: "Campus job", verb: "Led", what: "", skill: "", result: "" }] };
  }
  function demo() {
    var d = defaults(), t = G.today();
    d.followDays = 7;
    var a = job("SAMPLE Northwind Labs", "Research Assistant", "applied"); a.applied = G.addDays(t, -12); a.lastContact = G.addDays(t, -12);
    a.ad = "SAMPLE AD: Research Assistant. We are looking for a detail-oriented research assistant to support data analysis in Python and R. You will clean survey data, run statistical analysis, write clear reports and present findings to the team. Experience with Python, R, survey data and data visualization preferred. Strong written communication. Data analysis projects from coursework count.";
    a.kws = extract(a.ad).map(function (k, i) { return { k: k, done: i < 4 }; }); a.tailor = { title: true, top3: true }; a.scam = { official: true, domain: true };
    var b = job("SAMPLE Bluebird Health", "Data Analyst I", "screen"); b.applied = G.addDays(t, -20); b.lastContact = G.addDays(t, -3); b.next = "SAMPLE: phone screen Thu 2pm";
    var c = job("SAMPLE Civic Transit", "Program Coordinator", "interview"); c.applied = G.addDays(t, -30); c.lastContact = G.addDays(t, -9); c.next = "SAMPLE: send thank-you + follow up";
    var e = job("SAMPLE Easy Money Remote", "Online Assessor ($60/hr!)", "saved"); e.scam = { text: true, vague: true, pay: true }; e.notes = "SAMPLE: texted me out of nowhere.";
    var f = job("SAMPLE Maple Library", "Library Assistant", "rejected"); f.applied = G.addDays(t, -40); f.lastContact = G.addDays(t, -15);
    var g = job("SAMPLE Oak Street Co-op", "Operations Associate", "saved");
    d.jobs = [a, b, c, e, f, g];
    d.targets = { apps: 5, net: 3, skill: 4 };
    var m = monday(); d.weeks[m] = { apps: 3, net: 2, skill: 1.5 };
    for (var i = 1; i <= 3; i++) d.weeks[G.addDays(m, -7 * i)] = { apps: 5 + i % 2, net: 3, skill: 4 };
    d.stories = [{ id: G.uid(), title: "SAMPLE: Fixed a messy dataset under deadline", s: "Lab survey data had 3 different date formats two days before a grant report.", t: "Get clean numbers to my PI by Friday.", a: "Wrote a Python script to standardize dates and flag duplicates; documented it for the lab.", r: "Report went out on time; the script is now used for every new survey.", skills: "Python, problem-solving, ownership" }];
    d.log = [{ id: G.uid(), date: G.addDays(t, -2), company: "SAMPLE Civic Transit", who: "Hiring manager + 2 team members", round: "Round 1", well: "SAMPLE: STAR story about the dataset landed well.", improve: "SAMPLE: shorter answer on 'tell me about yourself'.", thanks: true, follow: G.addDays(t, 5) }];
    d.exps = [{ id: G.uid(), type: "Campus job", verb: "Taught", what: "weekly peer tutoring sessions for intro statistics students", skill: "communication, statistics", result: "most regulars passed the final (SAMPLE)" }, { id: G.uid(), type: "Class project", verb: "Built", what: "a dashboard of campus bike-share use for a data class", skill: "data visualization", result: "presented to the transportation office (SAMPLE)" }];
    return d;
  }

  function extract(text) {
    var words = String(text || "").toLowerCase().replace(/[^a-z0-9+#./\- ]+/g, " ").split(/\s+/).map(function (w) { return w.replace(/^[.\-/]+|[.\-/]+$/g, ""); });
    var uni = {}, bi = {}, first = {};
    words.forEach(function (w, i) {
      if (!w || STOPSET[w] || /^\d+$/.test(w) || (w.length < 3 && !/[+#]/.test(w) && w !== "r" && w !== "ai")) return;
      uni[w] = (uni[w] || 0) + 1; if (first[w] == null) first[w] = i;
      var n = words[i + 1];
      if (n && !STOPSET[n] && n.length > 2 && !/^\d+$/.test(n)) { var p = w + " " + n; bi[p] = (bi[p] || 0) + 1; if (first[p] == null) first[p] = i; }
    });
    var out = Object.keys(bi).filter(function (p) { return bi[p] >= 2; }).sort(function (a, b) { return bi[b] - bi[a] || first[a] - first[b]; }).slice(0, 6);
    var used = {}; out.forEach(function (p) { p.split(" ").forEach(function (w) { used[w] = 1; }); });
    Object.keys(uni).filter(function (w) { return !used[w]; }).sort(function (a, b) { return uni[b] - uni[a] || first[a] - first[b]; }).some(function (w) { out.push(w); return out.length >= 16; });
    return out;
  }
  function daysSince(j) { var d = G.diffDays(j.lastContact, G.today()); return d == null ? null : d; }
  function isDue(s, j) { var f = G.num(s.followDays), d = daysSince(j); return f > 0 && d != null && d >= f && /^(applied|screen|interview)$/.test(j.stage); }
  function flagCount(j) { return FLAGS.filter(function (f) { return j.scam && j.scam[f[0]]; }).length; }
  function colOf(stage) { return stage === "offer" || stage === "rejected" ? "closed" : stage; }

  function card(s, j, i) {
    var d = daysSince(j), due = isDue(s, j), fc = flagCount(j), b = "jobs." + i + ".";
    return '<article class="job-card' + (due ? " due" : "") + '" data-job="' + j.id + '">' +
      '<input type="text" aria-label="Company" placeholder="Company" data-bind="' + b + 'company"><input type="text" aria-label="Role" placeholder="Role" data-bind="' + b + 'role">' +
      '<select aria-label="Stage" data-bind="' + b + 'stage" data-rerender>' + STAGES.map(function (o) { return '<option value="' + o[0] + '">' + o[1] + "</option>"; }).join("") + "</select>" +
      '<div style="display:flex;flex-wrap:wrap;gap:.3rem;align-items:center"><span class="pill ' + (due ? "warn" : "") + '" data-days="' + i + '">' + (j.stage === "saved" ? "Not applied yet" : j.stage === "offer" || j.stage === "rejected" ? "Closed" : d == null ? "No contact date" : d + " day" + (d === 1 ? "" : "s") + " since contact") + "</span>" + (due ? '<span class="pill warn">Follow up</span>' : "") + (fc ? '<span class="pill bad">' + fc + " red flag" + (fc > 1 ? "s" : "") + "</span>" : "") + (j.stage === "offer" ? '<span class="pill ok">Offer 🎉</span>' : "") + "</div>" +
      '<button type="button" class="btn sm secondary no-print" data-action="contact" data-i="' + i + '">Contacted today</button>' +
      '<details data-open="' + j.id + '"' + (OPEN[j.id] ? " open" : "") + '><summary>Tailor &amp; check</summary><div style="display:grid;gap:.45rem;margin-top:.3rem">' +
      '<label class="field" style="margin:0">Last contact<input type="date" data-bind="' + b + 'lastContact" data-rerender></label>' +
      '<label class="field" style="margin:0">Applied on<input type="date" data-bind="' + b + 'applied"></label>' +
      '<label class="field" style="margin:0">Posting link<input type="url" placeholder="https://…" data-bind="' + b + 'url"></label>' +
      '<label class="field" style="margin:0">Next step<input type="text" data-bind="' + b + 'next" placeholder="e.g. follow up Tue"></label>' +
      '<label class="field" style="margin:0">Paste the job ad<textarea rows="3" data-bind="' + b + 'ad" placeholder="Paste the full posting text here"></textarea></label>' +
      '<button type="button" class="btn sm no-print" data-action="kw" data-i="' + i + '">Pull keywords from the ad</button>' +
      (j.kws.length ? '<div><strong class="small">Keywords: tick each one your resume now covers</strong> <span class="pill lav">' + j.kws.filter(function (k) { return k.done; }).length + "/" + j.kws.length + '</span><div class="kw-list" style="margin-top:.3rem">' + j.kws.map(function (k, ki) { return '<label><input type="checkbox" data-bind="' + b + "kws." + ki + '.done" data-rerender>' + G.esc(k.k) + "</label>"; }).join("") + "</div></div>" : "") +
      '<div><strong class="small">Tailoring checklist</strong>' + TAILOR.map(function (t) { return '<label class="check small" style="margin-top:.25rem"><input type="checkbox" data-bind="' + b + "tailor." + t[0] + '">' + t[1] + "</label>"; }).join("") + "</div>" +
      '<div><strong class="small">Scam check: did you…</strong>' + CHECKS.map(function (t) { return '<label class="check small" style="margin-top:.25rem"><input type="checkbox" data-bind="' + b + "scam." + t[0] + '">' + t[1] + "</label>"; }).join("") +
      '<strong class="small" style="display:block;margin-top:.4rem;color:var(--danger)">Red flags: tick any that happened</strong>' + FLAGS.map(function (t) { return '<label class="check small" style="margin-top:.25rem"><input type="checkbox" data-bind="' + b + "scam." + t[0] + '" data-rerender>' + t[1] + "</label>"; }).join("") +
      (fc ? '<p class="notice warn small" style="margin:.4rem 0 0">Stop and verify before you share anything else. See the FTC\'s advice below.</p>' : "") + "</div>" +
      '<label class="field" style="margin:0">Notes<textarea rows="2" style="min-height:56px" data-bind="' + b + 'notes"></textarea></label>' +
      '<button type="button" class="btn sm danger no-print" data-action="delJob" data-i="' + i + '">Delete card</button></div></details></article>';
  }
  function wk(s) { var m = monday(); if (!s.weeks[m]) s.weeks[m] = { apps: "", net: "", skill: "" }; return m; }
  function met(s, w) { var t = s.targets, any = false, ok = true; ["apps", "net", "skill"].forEach(function (k) { if (G.num(t[k]) > 0) { any = true; if (!w || G.num(w[k]) < G.num(t[k])) ok = false; } }); return any && ok; }
  function streak(s) { var m = monday(), n = 0, cur = m; if (!met(s, s.weeks[cur])) cur = G.addDays(cur, -7); while (met(s, s.weeks[cur])) { n++; cur = G.addDays(cur, -7); } return n; }

  function render(s) {
    var idx = s.jobs.map(function (j, i) { return { j: j, i: i }; });
    G.$("#board").innerHTML = COLS.map(function (c) {
      var inn = idx.filter(function (x) { return colOf(x.j.stage) === c[0]; });
      return '<div class="board-col"><h3><span>' + c[1] + '</span><span class="pill">' + inn.length + "</span></h3>" + (inn.length ? inn.map(function (x) { return card(s, x.j, x.i); }).join("") : '<p class="empty small">Nothing here yet.</p>') + "</div>";
    }).join("");
    G.$$("#board details").forEach(function (d) { d.addEventListener("toggle", function () { OPEN[d.getAttribute("data-open")] = d.open; }); });
    var m = wk(s);
    G.$("#wk-label").textContent = "This week (from " + G.fmtDate(m, { month: "short", day: "numeric" }) + ")";
    G.$("#wk-fields").innerHTML = [["apps", "Applications sent"], ["net", "Networking messages"], ["skill", "Skill hours"]].map(function (k) { return '<label class="field">' + k[1] + '<input type="number" min="0" step="' + (k[0] === "skill" ? "0.5" : "1") + '" inputmode="decimal" data-bind="weeks.' + m + "." + k[0] + '" placeholder="0"></label>'; }).join("");
    G.$("#stories").innerHTML = s.stories.map(function (st, i) { var b = "stories." + i + "."; return '<article class="row-card"><label class="field" style="margin:0">Story title<input type="text" data-bind="' + b + 'title" placeholder="e.g. The time I fixed…"></label><div class="mini-grid">' + [["s", "Situation"], ["t", "Task"], ["a", "Action (what you did)"], ["r", "Result"]].map(function (k) { return '<label class="field" style="margin:0">' + k[1] + '<textarea rows="2" style="min-height:60px" data-bind="' + b + k[0] + '"></textarea></label>'; }).join("") + '</div><label class="field" style="margin:0">Skills it shows<input type="text" data-bind="' + b + 'skills" placeholder="teamwork, Python, leadership…"></label><button type="button" class="btn sm danger no-print" data-action="del" data-list="stories" data-i="' + i + '">Delete story</button></article>'; }).join("") || '<p class="empty">No stories yet.</p>';
    G.$("#questions").innerHTML = s.questions.map(function (q, i) { return '<div class="ck-row" style="grid-template-columns:minmax(0,1fr) 44px"><input type="text" aria-label="Question to ask" data-bind="questions.' + i + '.q"><button type="button" class="btn icon ghost no-print" data-action="del" data-list="questions" data-i="' + i + '" aria-label="Delete question">✕</button></div>'; }).join("");
    G.$("#ilog").innerHTML = s.log.map(function (l, i) { var b = "log." + i + "."; return '<article class="row-card"><div class="field-row"><label class="field" style="margin:0">Date<input type="date" data-bind="' + b + 'date"></label><label class="field" style="margin:0">Company<input type="text" data-bind="' + b + 'company"></label><label class="field" style="margin:0">Round<input type="text" data-bind="' + b + 'round" placeholder="Phone screen, Round 2…"></label><label class="field" style="margin:0">Who I met<input type="text" data-bind="' + b + 'who"></label></div><div class="mini-grid"><label class="field" style="margin:0">What went well<textarea rows="2" style="min-height:56px" data-bind="' + b + 'well"></textarea></label><label class="field" style="margin:0">What I\'d do differently<textarea rows="2" style="min-height:56px" data-bind="' + b + 'improve"></textarea></label></div><div class="field-row"><label class="check" style="align-self:center"><input type="checkbox" data-bind="' + b + 'thanks">Thank-you note sent</label><label class="field" style="margin:0">Follow up on<input type="date" data-bind="' + b + 'follow"></label></div><button type="button" class="btn sm danger no-print" data-action="del" data-list="log" data-i="' + i + '">Delete entry</button></article>'; }).join("") || '<p class="empty">Log each interview right after: what went well, what to change, and when to follow up.</p>';
    G.$("#exps").innerHTML = s.exps.map(function (x, i) { var b = "exps." + i + "."; return '<article class="row-card"><div class="field-row"><label class="field" style="margin:0">Type<select data-bind="' + b + 'type">' + ["Campus job", "Part-time job", "Class project", "Research", "Volunteering", "Club or society", "Personal project", "Caregiving or family work"].map(function (o) { return "<option>" + o + "</option>"; }).join("") + '</select></label><label class="field" style="margin:0">Action verb<select data-bind="' + b + 'verb">' + VERBS.map(function (o) { return "<option>" + o + "</option>"; }).join("") + '</select></label></div><label class="field" style="margin:0">What you did<input type="text" data-bind="' + b + 'what" placeholder="e.g. weekly tutoring sessions for 10 first-years"></label><div class="field-row"><label class="field" style="margin:0">Skill it shows<input type="text" data-bind="' + b + 'skill"></label><label class="field" style="margin:0">Result (if any)<input type="text" data-bind="' + b + 'result" placeholder="numbers, outcomes, who used it"></label></div><p class="small" style="margin:0"><strong>Bullet:</strong> <span data-bullet="' + i + '"></span></p><div class="btn-row no-print"><button type="button" class="btn sm secondary" data-action="copyBullet" data-i="' + i + '">Copy bullet</button><button type="button" class="btn sm danger" data-action="del" data-list="exps" data-i="' + i + '">Delete</button></div></article>'; }).join("") || '<p class="empty">Add something you\'ve done.</p>';
  }
  function bullet(x) { if (!x.what) return "Fill in what you did to see your bullet."; return (x.verb || "Led") + " " + x.what.replace(/\.$/, "") + (x.result ? ", " + x.result.replace(/\.$/, "") : "") + (x.skill ? " (" + x.skill + ")" : "") + "."; }
  function update(s) {
    var due = s.jobs.filter(function (j) { return isDue(s, j); }).length, active = s.jobs.filter(function (j) { return /^(applied|screen|interview)$/.test(j.stage); }).length;
    G.$("#due-pill").textContent = s.jobs.length + " jobs · " + active + " active · " + due + " to follow up";
    G.$("#due-pill").className = "pill " + (due ? "warn" : "lav");
    var n = streak(s), m = monday(), w = s.weeks[m] || {};
    G.$("#streak").textContent = "🔥 " + n + "-week streak";
    G.$("#wk-stats").innerHTML = [["apps", "Applications"], ["net", "Networking"], ["skill", "Skill hours"]].map(function (k) { var t = G.num(s.targets[k[0]]), v = G.num(w[k[0]]); return '<div class="stat ' + (t > 0 && v >= t ? "mint" : "") + '"><div class="label">' + k[1] + '</div><div class="value">' + v + (t > 0 ? " / " + t : "") + "</div></div>"; }).join("") + '<div class="stat lav"><div class="label">This week</div><div class="value">' + (met(s, w) ? "Target hit ✓" : "In progress") + "</div></div>";
    G.$$("[data-bullet]").forEach(function (el) { var x = s.exps[+el.getAttribute("data-bullet")]; if (x) el.textContent = bullet(x); });
  }
  G.tool({
    key: "gradiq-job-search-v1", name: "Launch Pad job search planner", section: "Life & launch",
    defaults: defaults, demo: demo, render: render, update: update,
    actions: {
      addJob: function (el, s, api) { var co = G.$("#new-co").value.trim(), ro = G.$("#new-role").value.trim(); if (!co && !ro) { G.toast("Type a company or role first"); G.$("#new-co").focus(); return; } s.jobs.push(job(co, ro, "saved")); G.$("#new-co").value = ""; G.$("#new-role").value = ""; api.commit(true); G.toast("Added to Saved"); },
      contact: function (el, s, api) { var j = s.jobs[+el.getAttribute("data-i")]; j.lastContact = G.today(); if (j.stage === "saved") { j.stage = "applied"; if (!j.applied) j.applied = G.today(); } api.commit(true); G.toast("Contact logged for today"); },
      kw: function (el, s, api) { var j = s.jobs[+el.getAttribute("data-i")]; if (!String(j.ad || "").trim()) { G.toast("Paste the job ad first"); return; } var keep = {}; j.kws.forEach(function (k) { keep[k.k] = k.done; }); j.kws = extract(j.ad).map(function (k) { return { k: k, done: !!keep[k] }; }); OPEN[j.id] = true; api.commit(true); G.toast(j.kws.length + " keywords found"); },
      delJob: function (el, s, api) { var i = +el.getAttribute("data-i"); if (!confirm("Delete " + (s.jobs[i].company || "this card") + "?")) return; s.jobs.splice(i, 1); api.commit(true); },
      addStory: function (el, s, api) { s.stories.push({ id: G.uid(), title: "", s: "", t: "", a: "", r: "", skills: "" }); api.commit(true); },
      addQ: function (el, s, api) { s.questions.push({ id: G.uid(), q: "" }); api.commit(true); },
      addLog: function (el, s, api) { s.log.unshift({ id: G.uid(), date: G.today(), company: "", who: "", round: "", well: "", improve: "", thanks: false, follow: G.addDays(G.today(), 7) }); api.commit(true); },
      addExp: function (el, s, api) { s.exps.push({ id: G.uid(), type: "Campus job", verb: "Led", what: "", skill: "", result: "" }); api.commit(true); },
      copyBullet: function (el, s) { G.copyText(bullet(s.exps[+el.getAttribute("data-i")])).then(function (ok) { G.toast(ok ? "Bullet copied" : "Couldn't copy. Select the text instead."); }); },
      del: function (el, s, api) { if (!confirm("Delete this entry?")) return; s[el.getAttribute("data-list")].splice(+el.getAttribute("data-i"), 1); api.commit(true); }
    },
    csv: function (s) {
      return [{ title: "Applications", rows: [["Company", "Role", "Stage", "Applied", "Last contact", "Days since contact", "Follow up due", "Next step", "Keywords covered", "Red flags", "Link", "Notes"]].concat(s.jobs.map(function (j) { return [j.company, j.role, j.stage, j.applied, j.lastContact, daysSince(j), isDue(s, j) ? "yes" : "no", j.next, j.kws.filter(function (k) { return k.done; }).length + "/" + j.kws.length, flagCount(j), j.url, j.notes]; })) },
        { title: "Weekly targets", rows: [["Week of", "Applications", "Networking", "Skill hours", "Hit targets"]].concat(Object.keys(s.weeks).sort().map(function (k) { var w = s.weeks[k]; return [k, w.apps, w.net, w.skill, met(s, w) ? "yes" : "no"]; })) },
        { title: "Interview log", rows: [["Date", "Company", "Round", "Who", "Went well", "Do differently", "Thank-you sent", "Follow up"]].concat(s.log.map(function (l) { return [l.date, l.company, l.round, l.who, l.well, l.improve, l.thanks ? "yes" : "no", l.follow]; })) },
        { title: "STAR stories", rows: [["Title", "Situation", "Task", "Action", "Result", "Skills"]].concat(s.stories.map(function (x) { return [x.title, x.s, x.t, x.a, x.r, x.skills]; })) }];
    }
  });
  window.GQ_extractKeywords = extract;
})();
