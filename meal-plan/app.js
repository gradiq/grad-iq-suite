(function () {
  "use strict";
  var G = GQ, DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], SLOTS = [["l", "Lunch"], ["d", "Dinner"]];
  var KINDS = [["protein", "Protein"], ["base", "Base (rice, pasta…)"], ["veg", "Veg & fruit"], ["other", "Sauce & other"]];
  var GOALS = {
    budget: ["Budget", "Lowest cost per meal: beans, eggs, rice, oats and frozen veg stretch furthest.", ["Rice & bean burrito bowls", "Egg fried rice", "Lentil soup", "Pasta with chickpeas & tomatoes", "Sheet-pan potatoes & sausage", "Oatmeal with banana"]],
    protein: ["High-protein", "Ideas built around a protein at every meal.", ["Chicken thigh & rice bowls", "Greek yogurt & oats", "Tuna pasta salad", "Egg & black bean tacos", "Tofu stir-fry", "Turkey chili"]],
    lighter: ["Weight loss", "Lighter, veggie-heavy versions of everyday meals. Ideas only, not a diet plan.", ["Big chickpea salad", "Veggie stir-fry with eggs", "Bean & vegetable soup", "Chicken & roasted vegetables", "Half-pasta, half-veg bowl", "Lettuce-wrap tacos"]]
  };
  function ing(name, kind, price, covers, have) { return { id: G.uid(), name: name || "", kind: kind || "other", price: price === undefined ? "" : price, covers: covers === undefined ? "" : covers, have: !!have }; }
  function rec(name, ings) { return { id: G.uid(), name: name || "", ings: ings || [] }; }
  function defaults() { return { goal: "budget", budget: 50, takeout: "", spent: "", ings: [], recipes: [], grid: {}, bought: {}, prep: { p: ["", "", ""], b: ["", "", ""] }, pantry: [], lefts: [] }; }
  function demo() {
    var d = defaults(); d.takeout = 16; d.spent = "";
    var I = [ing("SAMPLE Chicken thighs (3 lb)", "protein", 8.97, 6), ing("Eggs (dozen)", "protein", 3.49, 6), ing("Black beans (2 cans)", "protein", 2.18, 4), ing("Rice (2 lb)", "base", 2.49, 10, true), ing("Pasta (1 lb)", "base", 1.29, 4), ing("Tortillas (10)", "base", 2.99, 5), ing("Frozen mixed veg (2 bags)", "veg", 3.98, 8), ing("Onions (3 lb)", "veg", 2.99, 8), ing("Salsa", "other", 2.79, 6), ing("Shredded cheese", "other", 3.49, 6), ing("Bananas", "veg", 1.6, 6)];
    d.ings = I; var id = function (i) { return I[i].id; };
    d.prep = { p: [id(0), id(1), id(2)], b: [id(3), id(4), id(5)] };
    d.recipes = [rec("Chicken burrito bowl", [id(0), id(3), id(2), id(8), id(9)]), rec("Egg fried rice", [id(1), id(3), id(6), id(7)]), rec("Bean & cheese tacos", [id(2), id(5), id(8), id(9)]), rec("Chicken veg pasta", [id(0), id(4), id(6), id(7)])];
    var R = d.recipes.map(function (r) { return r.id; });
    d.grid = { "0l": R[0], "0d": R[1], "1l": R[0], "1d": R[2], "2l": R[1], "2d": R[3], "3l": R[3], "3d": R[0], "4l": R[2], "4d": R[1] };
    d.pantry = [{ id: G.uid(), name: "SAMPLE Rice", useBy: "" }, { id: G.uid(), name: "SAMPLE Spinach", useBy: G.addDays(G.today(), 2) }];
    d.lefts = [{ id: G.uid(), what: "SAMPLE Turkey chili", made: G.addDays(G.today(), -1), eatBy: G.addDays(G.today(), 2) }];
    return d;
  }
  function byId(s) { var m = {}; s.ings.forEach(function (i) { m[i.id] = i; }); return m; }
  function recById(s) { var m = {}; s.recipes.forEach(function (r) { m[r.id] = r; }); return m; }
  function list(s) {
    var R = recById(s), I = byId(s), uses = {}, meals = 0;
    Object.keys(s.grid).forEach(function (k) { var r = R[s.grid[k]]; if (!r) return; meals++; r.ings.forEach(function (iid) { if (I[iid]) uses[iid] = (uses[iid] || 0) + 1; }); });
    var items = Object.keys(uses).map(function (iid) { var it = I[iid], cov = Math.max(1, G.num(it.covers) || 1), pk = Math.ceil(uses[iid] / cov); return { it: it, uses: uses[iid], packs: pk, cost: it.have ? 0 : pk * G.num(it.price), missingPrice: !it.have && (it.price === "" || it.price == null) }; });
    items.sort(function (a, b) { return a.it.kind.localeCompare(b.it.kind) || a.it.name.localeCompare(b.it.name); });
    var total = items.reduce(function (a, x) { return a + x.cost; }, 0);
    return { items: items, total: total, meals: meals };
  }
  function ingOpts(s, kind) { return '<option value="">Choose…</option>' + s.ings.filter(function (i) { return !kind || i.kind === kind; }).map(function (i) { return '<option value="' + i.id + '">' + G.esc(i.name || "(unnamed)") + "</option>"; }).join(""); }
  function render(s) {
    G.$("#goals").innerHTML = Object.keys(GOALS).map(function (k) { return '<button type="button" class="btn sm ' + (s.goal === k ? "primary" : "secondary") + '" role="radio" aria-checked="' + (s.goal === k) + '" data-action="goal" data-g="' + k + '">' + GOALS[k][0] + "</button>"; }).join("");
    G.$("#goal-note").textContent = GOALS[s.goal][1];
    G.$("#ideas").innerHTML = GOALS[s.goal][2].map(function (x) { return '<button type="button" class="btn sm" data-action="idea" data-n="' + G.esc(x) + '">+ ' + G.esc(x) + "</button>"; }).join("");
    var ro = '<option value="">— leftovers / out —</option>' + s.recipes.map(function (r) { return '<option value="' + r.id + '">' + G.esc(r.name || "(unnamed recipe)") + "</option>"; }).join("");
    G.$("#grid").innerHTML = DAYS.map(function (d, di) { return '<div class="day-col"><h3>' + d + "</h3>" + SLOTS.map(function (sl) { return '<label class="field" style="margin:0 0 .3rem">' + sl[1] + '<select data-bind="grid.' + di + sl[0] + '" data-rerender>' + ro + "</select></label>"; }).join("") + "</div>"; }).join("");
    G.$("#ings").innerHTML = s.ings.map(function (it, i) { var b = "ings." + i + "."; return '<div class="row-card"><div class="field-row two-sm"><label class="field span2" style="margin:0">Ingredient<input type="text" data-bind="' + b + 'name" placeholder="e.g. Eggs (dozen)" data-rerender></label><label class="field" style="margin:0">Type<select data-bind="' + b + 'kind" data-rerender>' + KINDS.map(function (k) { return '<option value="' + k[0] + '">' + k[1] + "</option>"; }).join("") + '</select></label><label class="field" style="margin:0">Package price<span class="money"><input type="number" inputmode="decimal" min="0" step="0.01" placeholder="0" data-bind="' + b + 'price" data-rerender></span></label><label class="field" style="margin:0">Meals it covers<input type="number" inputmode="numeric" min="1" step="1" placeholder="1" data-bind="' + b + 'covers" data-rerender></label></div><div style="display:flex;flex-wrap:wrap;gap:.6rem;align-items:center;justify-content:space-between"><label class="check"><input type="checkbox" data-bind="' + b + 'have" data-rerender>I have it (leave off the list)</label><button type="button" class="btn sm ghost no-print" data-action="delIng" data-i="' + i + '">✕ Remove</button></div></div>'; }).join("") || '<p class="empty">Add the ingredients you usually buy, with your prices.</p>';
    G.$("#recipes").innerHTML = s.recipes.map(function (r, i) { return '<div class="row-card"><div class="ck-row" style="grid-template-columns:minmax(0,1fr) 44px;padding:0;background:none"><input type="text" aria-label="Recipe name" placeholder="Recipe name" data-bind="recipes.' + i + '.name" data-rerender><button type="button" class="btn icon ghost no-print" data-action="delRecipe" data-i="' + i + '" aria-label="Delete recipe">✕</button></div><div class="kw-list">' + (s.ings.length ? s.ings.map(function (it) { return '<label><input type="checkbox" data-action="recIng" data-r="' + i + '" data-id="' + it.id + '"' + (r.ings.indexOf(it.id) >= 0 ? " checked" : "") + ">" + G.esc(it.name || "(unnamed)") + "</label>"; }).join("") : '<span class="small muted">Add ingredients above, then tick what this recipe uses.</span>') + '</div><span class="small muted" data-rcost="' + i + '"></span></div>'; }).join("") || '<p class="empty">No recipes yet. Use an idea above, prep mode, or + Recipe.</p>';
    G.$("#prep-pick").innerHTML = [0, 1, 2].map(function (k) { return '<label class="field">Protein ' + (k + 1) + '<select data-bind="prep.p.' + k + '">' + ingOpts(s, "protein") + "</select></label>"; }).join("") + [0, 1, 2].map(function (k) { return '<label class="field">Base ' + (k + 1) + '<select data-bind="prep.b.' + k + '">' + ingOpts(s, "base") + "</select></label>"; }).join("");
    var L = list(s);
    G.$("#list").innerHTML = "<thead><tr><th scope='col'>Got it</th><th scope='col'>Item</th><th scope='col'>Meals</th><th scope='col'>Buy</th><th scope='col'>Cost</th></tr></thead><tbody>" + (L.items.length ? L.items.map(function (x) { return "<tr" + (x.it.have ? " class='muted'" : "") + "><td>" + (x.it.have ? "—" : '<input type="checkbox" aria-label="Got ' + G.esc(x.it.name) + '" data-bind="bought.' + x.it.id + '">') + "</td><td>" + G.esc(x.it.name) + (x.it.have ? " <span class='small'>(have it)</span>" : "") + "</td><td>" + x.uses + "</td><td>" + (x.it.have ? "0" : x.packs + " pkg") + "</td><td>" + (x.missingPrice ? '<span class="pill warn">add price</span>' : G.money(x.cost, true)) + "</td></tr>"; }).join("") + '<tr><td></td><td colspan="3"><strong>Estimated total</strong></td><td><strong id="list-total">' + G.money(L.total, true) + "</strong></td></tr>" : '<tr><td colspan="5" class="empty">Fill the meal grid to build your list.</td></tr>') + "</tbody>";
    G.$("#pantry").innerHTML = s.pantry.map(function (p, i) { return '<div class="row-card"><div class="field-row"><label class="field" style="margin:0">Item<input type="text" data-bind="pantry.' + i + '.name"></label><label class="field" style="margin:0">Use by (optional)<input type="date" data-bind="pantry.' + i + '.useBy" data-rerender></label></div><div style="display:flex;justify-content:space-between;align-items:center;gap:.5rem"><span data-cd="pantry.' + i + '"></span><button type="button" class="btn sm ghost no-print" data-action="del" data-list="pantry" data-i="' + i + '">✕ Used up</button></div></div>'; }).join("") || '<p class="empty small">Nothing listed.</p>';
    G.$("#lefts").innerHTML = s.lefts.map(function (p, i) { return '<div class="row-card"><div class="field-row"><label class="field" style="margin:0">Leftovers<input type="text" data-bind="lefts.' + i + '.what"></label><label class="field" style="margin:0">Made on<input type="date" data-bind="lefts.' + i + '.made"></label><label class="field" style="margin:0">Eat by<input type="date" data-bind="lefts.' + i + '.eatBy" data-rerender></label></div><div style="display:flex;justify-content:space-between;align-items:center;gap:.5rem"><span data-cd="lefts.' + i + '"></span><button type="button" class="btn sm ghost no-print" data-action="del" data-list="lefts" data-i="' + i + '">✕ Eaten</button></div></div>'; }).join("") || '<p class="empty small">No leftovers logged.</p>';
  }
  function cd(date) { if (!date) return ""; var n = G.diffDays(G.today(), date); return '<span class="pill ' + (n < 0 ? "bad" : n <= 1 ? "warn" : "ok") + '">' + (n < 0 ? "Past date" : n === 0 ? "Today" : n === 1 ? "Tomorrow" : n + " days") + "</span>"; }
  function update(s) {
    var L = list(s), budget = G.num(s.budget), per = L.meals ? L.total / L.meals : 0, tk = G.num(s.takeout), spent = G.num(s.spent), cmp = spent > 0 ? spent : L.total;
    G.$("#cost-stats").innerHTML = '<div class="stat ' + (cmp > budget && budget > 0 ? "neg" : "pos") + ' big"><div class="label">' + (spent > 0 ? "Spent" : "Grocery estimate") + '</div><div class="value" id="est">' + G.money(cmp, true) + '</div></div><div class="stat"><div class="label">Meals planned</div><div class="value">' + L.meals + '</div></div><div class="stat mint"><div class="label">Cost per meal</div><div class="value" id="per-meal">' + (L.meals ? G.money((spent > 0 ? spent : L.total) / L.meals, true) : "—") + '</div></div><div class="stat sky"><div class="label">Same meals as takeout</div><div class="value">' + (tk > 0 && L.meals ? G.money(tk * L.meals, true) : "—") + "</div></div>";
    var note = "";
    if (budget > 0) note += cmp > budget ? '<p class="notice warn small" style="margin:0 0 .5rem">That\'s ' + G.money(cmp - budget, true) + " over your " + G.money(budget) + " budget. Try a cheaper protein, or mark pantry items you already have.</p>" : '<p class="small" style="margin:0 0 .3rem">' + G.money(budget - cmp, true) + " under your " + G.money(budget) + " budget.</p>";
    if (tk > 0 && L.meals) note += '<p class="small" style="margin:0"><strong>Cooking these ' + L.meals + " meals saves about " + G.money(tk * L.meals - cmp, true) + "</strong> compared with your takeout price (" + G.money(tk, true) + " a meal).</p>";
    else if (L.meals) note += '<p class="small muted" style="margin:0">Add what a takeout meal costs you to see the comparison.</p>';
    G.$("#cost-note").innerHTML = note;
    var got = L.items.filter(function (x) { return !x.it.have && s.bought[x.it.id]; }).length, need = L.items.filter(function (x) { return !x.it.have; }).length;
    G.$("#list-pill").textContent = got + " of " + need + " in the cart";
    var I = byId(s);
    G.$$("[data-rcost]").forEach(function (el) { var r = s.recipes[+el.getAttribute("data-rcost")]; if (!r) return; var c = r.ings.reduce(function (a, id) { var it = I[id]; return a + (it ? G.num(it.price) / Math.max(1, G.num(it.covers) || 1) : 0); }, 0); el.textContent = r.ings.length ? "About " + G.money(c, true) + " a serving at your prices" : ""; });
    G.$$("[data-cd]").forEach(function (el) { var p = el.getAttribute("data-cd").split("."), x = s[p[0]][+p[1]]; if (x) el.innerHTML = cd(p[0] === "pantry" ? x.useBy : x.eatBy); });
    var soon = s.lefts.concat(s.pantry).filter(function (x) { var d = x.eatBy || x.useBy; return d && G.diffDays(G.today(), d) <= 1; });
    G.$("#eat-first").innerHTML = soon.length ? '<p class="notice warn small">Use first: ' + soon.map(function (x) { return G.esc(x.what || x.name); }).join(", ") + "</p>" : "";
  }
  G.tool({
    key: "gradiq-meal-plan-v1", name: "$50-a-week meal planner", section: "Life & launch",
    defaults: defaults, demo: demo, render: render, update: update,
    actions: {
      goal: function (el, s, api) { s.goal = el.getAttribute("data-g"); api.commit(true); },
      idea: function (el, s, api) { s.recipes.push(rec(el.getAttribute("data-n"), [])); api.commit(true); G.toast("Recipe added. Tick its ingredients below."); },
      addIng: function (el, s, api) { s.ings.push(ing()); api.commit(true); },
      delIng: function (el, s, api) { var it = s.ings[+el.getAttribute("data-i")]; if (!confirm("Remove " + (it.name || "this ingredient") + "?")) return; s.recipes.forEach(function (r) { r.ings = r.ings.filter(function (x) { return x !== it.id; }); }); s.ings.splice(+el.getAttribute("data-i"), 1); api.commit(true); },
      addRecipe: function (el, s, api) { s.recipes.push(rec()); api.commit(true); },
      delRecipe: function (el, s, api) { var r = s.recipes[+el.getAttribute("data-i")]; if (!confirm("Delete " + (r.name || "this recipe") + "?")) return; Object.keys(s.grid).forEach(function (k) { if (s.grid[k] === r.id) delete s.grid[k]; }); s.recipes.splice(+el.getAttribute("data-i"), 1); api.commit(true); },
      recIng: function (el, s, api) { var r = s.recipes[+el.getAttribute("data-r")], id = el.getAttribute("data-id"), k = r.ings.indexOf(id); setTimeout(function () { if (k >= 0) r.ings.splice(k, 1); else r.ings.push(id); api.commit(true); }, 0); },
      clearGrid: function (el, s, api) { if (!confirm("Clear every meal in the grid?")) return; s.grid = {}; api.commit(true); },
      prep: function (el, s, api) {
        var I = byId(s), P = s.prep.p.filter(function (x) { return I[x]; }), B = s.prep.b.filter(function (x) { return I[x]; });
        if (P.length < 3 || B.length < 3) { G.toast("Pick 3 proteins and 3 bases (add them in Ingredients first)"); return; }
        var made = [];
        P.forEach(function (p) { B.forEach(function (b) { made.push(rec(I[p].name.replace(/^SAMPLE /, "") + " + " + I[b].name.replace(/^SAMPLE /, ""), [p, b])); }); });
        made.push(rec("Everything bowl (leftover mix)", P.concat(B)));
        s.recipes = s.recipes.concat(made);
        var k = 0; for (var d = 0; d < 5; d++) ["l", "d"].forEach(function (sl) { s.grid[d + sl] = made[k++].id; });
        api.commit(true); G.toast("10 meals added to Mon–Fri");
      },
      addPantry: function (el, s, api) { s.pantry.push({ id: G.uid(), name: "", useBy: "" }); api.commit(true); },
      addLeft: function (el, s, api) { s.lefts.push({ id: G.uid(), what: "", made: G.today(), eatBy: "" }); api.commit(true); },
      del: function (el, s, api) { s[el.getAttribute("data-list")].splice(+el.getAttribute("data-i"), 1); api.commit(true); }
    },
    csv: function (s) {
      var L = list(s), R = recById(s);
      return [{ title: "Grocery list", rows: [["Item", "Meals", "Packages", "Cost", "Have it"]].concat(L.items.map(function (x) { return [x.it.name, x.uses, x.it.have ? 0 : x.packs, x.cost.toFixed(2), x.it.have ? "yes" : "no"]; })).concat([["Total", "", "", L.total.toFixed(2), ""]]) },
        { title: "Meal grid", rows: [["Day", "Lunch", "Dinner"]].concat(DAYS.map(function (d, i) { return [d, (R[s.grid[i + "l"]] || {}).name || "", (R[s.grid[i + "d"]] || {}).name || ""]; })) },
        { title: "Ingredients", rows: [["Ingredient", "Type", "Package price", "Meals it covers", "Have it"]].concat(s.ings.map(function (i) { return [i.name, i.kind, i.price, i.covers, i.have ? "yes" : "no"]; })) }];
    }
  });
})();
