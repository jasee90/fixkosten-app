(function () {
  'use strict';
  var IC = {
    house: '<path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
    drop: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>',
    wifi: '<path d="M2 9a15 15 0 0 1 20 0M5.5 12.5a10 10 0 0 1 13 0M9 16a5 5 0 0 1 6 0"/><circle cx="12" cy="19.5" r="1"/>',
    phone: '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>',
    shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',
    car: '<path d="M5 16v-5l2-5h10l2 5v5M3 16h18v3H3zM7 13h.01M17 13h.01"/>',
    play: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M10 9l5 3-5 3z"/>',
    dots: '<circle cx="6" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="18" cy="12" r="1.4"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>',
    chev: '<path d="M9 6l6 6-6 6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    up: '<path d="M12 19V5M6 11l6-6 6 6"/>',
    down: '<path d="M12 5v14M6 13l6 6 6-6"/>',
    bars: '<path d="M5 20V10M12 20V4M19 20v-7"/>',
    list: '<path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/>',
    back: '<path d="M15 6l-6 6 6 6"/>',
    alert: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18h.01"/>'
  };
  function ic(n, extra) { return '<svg class="i ' + (extra || '') + '" viewBox="0 0 24 24" aria-hidden="true">' + IC[n] + '</svg>'; }
  var CATS = {
    wohnen: {l: 'Wohnen', i: 'house', c: '#8B8FD9'}, internet: {l: 'Internet', i: 'wifi', c: '#4C8DF6'},
    handy: {l: 'Handy', i: 'phone', c: '#A78BFA'}, versicherung: {l: 'Versicherung', i: 'shield', c: '#34D399'},
    auto: {l: 'Auto', i: 'car', c: '#FB923C'}, abo: {l: 'Abo', i: 'play', c: '#F472B6'}, other: {l: 'Sonstiges', i: 'dots', c: '#9296B0'}
  };
  var RHYTHM = {monat: {l: 'Monatlich', d: 1}, quartal: {l: 'Vierteljährlich', d: 3}, halbjahr: {l: 'Halbjährlich', d: 6}, jahr: {l: 'Jährlich', d: 12}};
  var eur = new Intl.NumberFormat('de-DE', {style: 'currency', currency: 'EUR'});
  var eur0 = new Intl.NumberFormat('de-DE', {style: 'currency', currency: 'EUR', maximumFractionDigits: 0});
  var n0 = new Intl.NumberFormat('de-DE', {maximumFractionDigits: 0});
  var n1 = new Intl.NumberFormat('de-DE', {maximumFractionDigits: 1});
  var n2 = new Intl.NumberFormat('de-DE', {minimumFractionDigits: 2, maximumFractionDigits: 2});
  var n3 = new Intl.NumberFormat('de-DE', {minimumFractionDigits: 3, maximumFractionDigits: 3});
  var MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
  var MSHORT = ['Jan.', 'Feb.', 'März', 'Apr.', 'Mai', 'Juni', 'Juli', 'Aug.', 'Sep.', 'Okt.', 'Nov.', 'Dez.'];
  var NAMES = {gas: 'Gas', strom: 'Strom'};
  var COLS = {gas: 'var(--gas)', strom: 'var(--strom)'};

  function blank() {
    return {v: 1,
      gas: {unit: 'm³', kwh: 10.6, preisCt: 0, grundJahr: 0, abschlag: 0, readings: []},
      strom: {unit: 'kWh', kwh: 1, preisCt: 0, grundJahr: 0, abschlag: 0, readings: []},
      fix: []};
  }
  var state = blank();
  var ui = {tab: 'home', prev: 'home', en: 'gas', pending: null, open: null, sel: {gas: null, strom: null}, imp: null};
  var KEY = 'fixkosten.v1', KEY_EXP = 'fixkosten.lastExport', syncMsg = 'Auf diesem Gerät gespeichert', sid = 0;

  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]; }); }
  function num(s) { var x = parseFloat(String(s).trim().replace(/\s/g, '').replace(',', '.')); return isFinite(x) ? x : null; }
  function uid() { return Math.random().toString(36).slice(2, 10); }
  function dayNo(d) { return Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10)) / 86400000; }
  function fmtD(d) { return d.slice(8, 10) + '.' + d.slice(5, 7) + '.' + d.slice(0, 4); }
  function fmtS(d) { return d.slice(8, 10) + '.' + d.slice(5, 7) + '.'; }
  function monLabel(k) { return MONTHS[+k.slice(5, 7) - 1] + ' ' + k.slice(0, 4); }
  function today() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function fmtU(k, v) { return state[k].unit === 'kWh' ? n1.format(v) : n2.format(v); }

  function normalize(raw) {
    var s = blank();
    if (!raw || typeof raw !== 'object') return s;
    ['gas', 'strom'].forEach(function (k) {
      var r = raw[k] || {};
      Object.keys(s[k]).forEach(function (f) { if (f !== 'readings' && r[f] !== undefined && r[f] !== null) s[k][f] = r[f]; });
      s[k].readings = Array.isArray(r.readings) ? r.readings.filter(function (x) { return x && /^\d{4}-\d{2}-\d{2}$/.test(x.d) && isFinite(x.v); }) : [];
    });
    s.fix = Array.isArray(raw.fix) ? raw.fix.filter(function (x) { return x && x.name && isFinite(x.betrag) && RHYTHM[x.rhythmus]; }).map(function (x) { x.icon = CATS[x.icon] ? x.icon : 'other'; x.aenderungen = Array.isArray(x.aenderungen) ? x.aenderungen.filter(function (c) { return c && /^\d{4}-\d{2}-\d{2}$/.test(c.ab) && isFinite(c.betrag); }).sort(function (a, b) { return a.ab < b.ab ? -1 : 1; }) : []; return x; }) : [];
    return s;
  }

  /* ---------- Berechnung ---------- */
  function periods(k) {
    var t = state[k];
    var r = t.readings.slice().sort(function (a, b) { return a.d < b.d ? -1 : 1; });
    var out = [];
    for (var i = 1; i < r.length; i++) {
      var a = r[i - 1], b = r[i], tage = dayNo(b.d) - dayNo(a.d);
      if (tage <= 0) continue;
      var m = b.v - a.v, kwh = m * t.kwh;
      out.push({von: a.d, bis: b.d, tage: tage, m: m, kwh: kwh, cost: kwh * t.preisCt / 100 + t.grundJahr / 365 * tage});
    }
    return out;
  }
  function summary(k) {
    var p = periods(k);
    if (!p.length) return null;
    var s = {tage: 0, m: 0, kwh: 0, cost: 0};
    p.forEach(function (x) { s.tage += x.tage; s.m += x.m; s.kwh += x.kwh; s.cost += x.cost; });
    s.perDay = s.cost / s.tage; s.month = s.perDay * 30.4375;
    return s;
  }
  function daily(k, field) {
    var out = {};
    periods(k).forEach(function (p) {
      var s = dayNo(p.von);
      for (var i = 0; i < p.tage; i++) out[s + i] = (out[s + i] || 0) + p[field] / p.tage;
    });
    return out;
  }
  function seriesOf(maps) {
    var all = {};
    maps.forEach(function (m) { Object.keys(m).forEach(function (d) { all[d] = (all[d] || 0) + m[d]; }); });
    return Object.keys(all).map(Number).sort(function (a, b) { return a - b; }).map(function (d) { return all[d]; });
  }
  function months(k) {
    var acc = {};
    periods(k).forEach(function (p) {
      var start = dayNo(p.von);
      for (var i = 0; i < p.tage; i++) {
        var key = new Date((start + i) * 86400000).toISOString().slice(0, 7);
        var a = acc[key] || (acc[key] = {tage: 0, cost: 0, m: 0});
        a.tage += 1; a.cost += p.cost / p.tage; a.m += p.m / p.tage;
      }
    });
    return Object.keys(acc).sort().reverse().map(function (key) {
      var dim = new Date(Date.UTC(+key.slice(0, 4), +key.slice(5, 7), 0)).getUTCDate();
      return {key: key, tage: acc[key].tage, dim: dim, cost: acc[key].cost, m: acc[key].m, hoch: acc[key].cost / acc[key].tage * dim};
    });
  }
  function trend(k) {
    var p = periods(k);
    if (p.length < 2) return null;
    var a = p[p.length - 2].m / p[p.length - 2].tage, b = p[p.length - 1].m / p[p.length - 1].tage;
    return a > 0 ? (b - a) / a * 100 : null;
  }
  function betragAt(x, d) {
    var b = x.betrag;
    (x.aenderungen || []).forEach(function (c) { if (c.ab <= d) b = c.betrag; });
    return b;
  }
  function curBetrag(x) { return betragAt(x, today()); }
  function monthlyOf(x) { return curBetrag(x) / RHYTHM[x.rhythmus].d; }
  function fixMonthly() { return state.fix.reduce(function (s, f) { return s + monthlyOf(f); }, 0); }
  function futureChanges(x) { return (x.aenderungen || []).filter(function (c) { return c.ab > today(); }); }
  function notices() {
    var lim = new Date(); lim.setDate(lim.getDate() + 60);
    var limS = lim.getFullYear() + '-' + String(lim.getMonth() + 1).padStart(2, '0') + '-' + String(lim.getDate()).padStart(2, '0'), out = [];
    state.fix.forEach(function (x) {
      futureChanges(x).forEach(function (c) {
        if (c.ab > limS) return;
        var prev = betragAt(x, new Date((dayNo(c.ab) - 1) * 86400000).toISOString().slice(0, 10)), diff = c.betrag - prev;
        if (Math.abs(diff) < 0.005) return;
        var per = x.rhythmus === 'monat' ? 'pro Monat' : RHYTHM[x.rhythmus].l.toLowerCase();
        out.push('<div class="notice ' + (diff < 0 ? 'good' : '') + '">' + ic('alert') + '<div><b>' + esc(x.name) + ' ' + (diff > 0 ? 'wird teurer' : 'wird günstiger') + '</b><span>Ab ' + fmtD(c.ab) + ': ' + eur.format(c.betrag) + ' statt ' + eur.format(prev) + ' (' + (diff > 0 ? '+' : '−') + eur.format(Math.abs(diff)) + ' ' + per + ')</span></div></div>');
      });
    });
    return out.join('');
  }

  /* ---------- Sparklines ---------- */
  function spark(vals, color, fill) {
    if (vals.length < 2) return {svg: '', end: null};
    var min = Math.min.apply(null, vals), max = Math.max.apply(null, vals), rng = max - min || 1, W = 100, H = 40, pad = 5;
    var pts = vals.map(function (v, i) { return [i / (vals.length - 1) * W, H - pad - (v - min) / rng * (H - 2 * pad)]; });
    var d = 'M' + pts[0][0].toFixed(2) + ',' + pts[0][1].toFixed(2);
    for (var i = 1; i < pts.length; i++) {
      var mx = (pts[i - 1][0] + pts[i][0]) / 2;
      d += ' C' + mx.toFixed(2) + ',' + pts[i - 1][1].toFixed(2) + ' ' + mx.toFixed(2) + ',' + pts[i][1].toFixed(2) + ' ' + pts[i][0].toFixed(2) + ',' + pts[i][1].toFixed(2);
    }
    var id = 'g' + (++sid), svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" aria-hidden="true">';
    if (fill) svg += '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:' + color + ';stop-opacity:.35"/><stop offset="1" style="stop-color:' + color + ';stop-opacity:0"/></linearGradient></defs><path d="' + d + ' L' + W + ',' + H + ' L0,' + H + ' Z" fill="url(#' + id + ')"/>';
    svg += '<path d="' + d + '" fill="none" style="stroke:' + color + '" stroke-width="2.2" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>';
    return {svg: svg, end: pts[pts.length - 1][1] / H * 100};
  }

  /* ---------- Teile ---------- */
  function energyItem(k) {
    var t = state[k], amt = t.abschlag;
    return '<button class="item" data-act="goen" data-k="' + k + '"><span class="ic" style="color:' + COLS[k] + '">' + ic(k === 'gas' ? 'drop' : 'bolt') + '</span>'
      + '<span class="t"><b>' + NAMES[k] + '</b><span>' + (amt ? 'Monatlich (Abschlag)' : 'Abschlag unter Tarif eintragen') + '</span></span>'
      + '<span class="a">' + (amt ? eur.format(amt) : '–') + '</span>' + ic('chev', 'ch') + '</button>';
  }
  function fixItem(x, withActs) {
    var c = CATS[x.icon] || CATS.other, open = ui.open === x.id, pend = ui.pending === 'f:' + x.id;
    var m = monthlyOf(x), cur = curBetrag(x);
    var h = '<div class="grp"><button class="item" data-act="openf" data-id="' + esc(x.id) + '"><span class="ic" style="color:' + c.c + '">' + ic(c.i) + '</span>'
      + '<span class="t"><b>' + esc(x.name) + '</b><span>' + (x.rhythmus === 'monat' ? 'Monatlich' : eur.format(cur) + ' ' + RHYTHM[x.rhythmus].l.toLowerCase())
      + futureChanges(x).map(function (c) { return '<br><span style="color:' + (c.betrag > cur ? 'var(--bad)' : 'var(--good)') + '">ab ' + fmtD(c.ab) + ': ' + eur.format(c.betrag) + '</span>'; }).join('') + (x.note ? '<br>' + esc(x.note) : '') + '</span></span><span class="a">' + eur.format(m) + '</span>' + ic('chev', 'ch') + '</button>';
    if (open && withActs) {
      h += '<div class="acts"><h3>Preisänderung planen</h3><div class="fr"><div><label for="ca">Gilt ab</label><input type="date" id="ca"></div><div><label for="cb">Neuer Betrag in €</label><input id="cb" inputmode="decimal" placeholder="0,00"></div></div>'
        + '<button class="btn soft" data-act="addc" data-id="' + esc(x.id) + '">Änderung speichern</button><p class="err" id="errc" role="alert"></p>';
      (x.aenderungen || []).forEach(function (c) {
        h += '<div class="chg"><span>ab ' + fmtD(c.ab) + ': ' + eur.format(c.betrag) + '</span><button class="btn plain" data-act="delc" data-id="' + esc(x.id) + '" data-ab="' + c.ab + '">Entfernen</button></div>';
      });
      h += '<div style="margin-top:10px"><button class="btn warn" data-act="delf" data-id="' + esc(x.id) + '">' + (pend ? 'Wirklich entfernen?' : 'Posten entfernen') + '</button></div></div>';
    }
    return h + '</div>';
  }
  function chip(hoch, abschlag) {
    if (!abschlag) return '';
    var d = hoch - abschlag;
    if (Math.abs(d) < 0.5) return '<span class="chip">im Plan</span>';
    return '<span class="chip ' + (d > 0 ? 'bad' : 'good') + '">' + (d > 0 ? '+' : '−') + eur0.format(Math.abs(d)) + ' zum Abschlag</span>';
  }

  /* ---------- Ansichten ---------- */
  function tile(k) {
    var t = state[k], ms = months(k), h = '<button class="tile" data-act="goen" data-k="' + k + '"><div class="h"><span style="color:' + COLS[k] + '">' + ic(k === 'gas' ? 'drop' : 'bolt') + '</span>' + (k === 'gas' ? 'Gasverbrauch' : 'Stromverbrauch') + '</div>';
    if (!ms.length) return h + '<div class="v">–</div><div class="m"><span>Noch kein Stand</span></div></button>';
    var cur = ms[0], tr = trend(k), sp = spark(seriesOf([daily(k, 'm')]), COLS[k], true);
    h += '<div class="v">' + (t.unit === 'kWh' ? n0.format(cur.m) : n1.format(cur.m)) + ' <small>' + t.unit + '</small></div>';
    h += '<div class="m"><span>≈ ' + eur.format(cur.cost) + '</span>';
    if (tr !== null && isFinite(tr)) h += '<span class="tr ' + (tr > 0.5 ? 'up' : tr < -0.5 ? 'down' : '') + '">' + (Math.abs(tr) < 0.5 ? '' : ic(tr > 0 ? 'up' : 'down')) + n0.format(Math.abs(tr)) + ' %</span>';
    h += '</div><div class="m"><span>' + MSHORT[+cur.key.slice(5, 7) - 1] + ' bisher</span></div><div class="spark">' + sp.svg + '</div></button>';
    return h;
  }

  function home() {
    var g = state.gas.abschlag || 0, s = state.strom.abschlag || 0, total = g + s + fixMonthly();
    var now = new Date(), extra = 0, have = false;
    ['gas', 'strom'].forEach(function (k) { var sm = summary(k); if (sm && state[k].abschlag) { extra += sm.month - state[k].abschlag; have = true; } });
    var sp = spark(seriesOf([daily('gas', 'cost'), daily('strom', 'cost')]), '#C9B8FF', true);
    var h = '<section class="hero"><div class="month">' + MSHORT[now.getMonth()] + ' ' + now.getFullYear() + '</div><div class="lbl">Monatliche Fixkosten</div><div class="big">' + eur.format(total) + '</div>';
    if (have) h += '<div class="delta ' + (extra > 0.5 ? 'up' : extra < -0.5 ? 'down' : '') + '">' + (Math.abs(extra) < 0.5 ? '' : ic(extra > 0 ? 'up' : 'down')) + '<span>' + (extra > 0 ? '+' : '−') + eur.format(Math.abs(extra)) + ' Energie zum Abschlag (Hochrechnung)</span></div>';
    else h += '<div class="delta"><span>Trage Zählerstände ein, um die Hochrechnung zu sehen.</span></div>';
    if (sp.svg) h += '<div class="spark">' + sp.svg + '</div><span class="endpoint" style="right:0;bottom:calc(' + (100 - sp.end).toFixed(1) + '% * 0.96)"></span>';
    h += '</section>' + notices() + '<div class="tiles">' + tile('strom') + tile('gas') + '</div>';
    var rows = [], energyN = 0;
    h += '<div class="sec"><h2>Deine Fixkosten</h2><button class="link" data-act="tab" data-t="fix">Alle anzeigen' + ic('chev') + '</button></div><div class="list">' + energyItem('strom') + energyItem('gas');
    state.fix.slice().sort(function (a, b) { return monthlyOf(b) - monthlyOf(a); }).slice(0, 3).forEach(function (x) { h += fixItem(x, false); });
    h += '</div><div style="margin-top:12px"><button class="btn soft" data-act="goadd">' + ic('plus') + 'Neue Fixkosten hinzufügen</button></div>';
    return h;
  }

  function usage() {
    var k = ui.en, t = state[k], sm = summary(k), h = '<div class="seg" role="group" aria-label="Energieart"><button data-act="seg" data-k="gas" aria-pressed="' + (k === 'gas') + '">Gas</button><button data-act="seg" data-k="strom" aria-pressed="' + (k === 'strom') + '">Strom</button></div>';
    if (sm) {
      h += '<div class="kpis"><div class="kpi"><div class="v">' + fmtU(k, sm.m) + ' <small>' + t.unit + '</small></div><div class="l">Verbrauch gesamt</div></div>'
        + '<div class="kpi"><div class="v">' + fmtU(k, sm.m / sm.tage) + ' <small>' + t.unit + '</small></div><div class="l">Pro Tag im Schnitt</div></div>'
        + '<div class="kpi"><div class="v">' + eur.format(sm.cost) + '</div><div class="l">Kosten gesamt, ' + sm.tage + ' Tage</div></div>'
        + '<div class="kpi"><div class="v">' + eur0.format(sm.month) + '</div><div class="l">Hochrechnung pro Monat</div></div></div>';
      if (t.abschlag) h += '<p class="cap">Dein Abschlag: ' + eur0.format(t.abschlag) + ' pro Monat ' + chip(sm.month, t.abschlag) + '</p>';
    } else h += '<p class="empty">Für ' + NAMES[k] + ' gibt es noch keinen Verbrauch. Trage mindestens zwei Zählerstände mit Datum ein.</p>';
    if (periods(k).length) h += '<div class="sec"><h2>Verbrauch pro Tag</h2></div><div class="panel"><div class="chart" id="chart-' + k + '"></div><p class="cap" id="cap-' + k + '">Tippe auf einen Balken für Details.</p></div>';
    var ms = months(k);
    if (ms.length) {
      h += '<div class="sec"><h2>Kosten pro Monat</h2></div><div class="list">';
      ms.forEach(function (m) {
        h += '<div class="mrow"><div><b>' + monLabel(m.key) + '</b><span>' + m.tage + ' von ' + m.dim + ' Tagen erfasst</span></div><div class="r">' + eur.format(m.cost) + '<span>ganzer Monat ≈ ' + eur0.format(m.hoch) + '</span></div></div>';
      });
      h += '</div>';
    }
    h += '<div class="sec"><h2>Neuer Zählerstand</h2></div><div class="panel"><div class="fr"><div><label for="d-' + k + '">Datum</label><input type="date" id="d-' + k + '" value="' + today() + '"></div>'
      + '<div><label for="v-' + k + '">Stand in ' + t.unit + '</label><input id="v-' + k + '" inputmode="decimal" placeholder="' + (k === 'gas' ? '434,219' : '12345') + '" autocomplete="off"></div></div>'
      + '<button class="btn" data-act="addr" data-k="' + k + '">Stand speichern</button><p class="err" id="err-' + k + '" role="alert"></p></div>';
    var rs = t.readings.slice().sort(function (a, b) { return a.d < b.d ? 1 : -1; });
    if (rs.length) {
      h += '<div class="sec"><h2>Alle Zählerstände</h2></div><div class="list">';
      rs.forEach(function (r) {
        var pend = ui.pending === 'r:' + k + ':' + r.d;
        h += '<div class="mrow"><div><b>' + fmtD(r.d) + '</b></div><div style="display:flex;align-items:center;gap:10px"><span class="r" style="color:var(--ink)">' + (t.unit === 'kWh' ? n1.format(r.v) : n3.format(r.v)) + ' ' + t.unit + '</span>'
          + '<button class="btn ' + (pend ? 'warn' : 'plain') + '" data-act="delr" data-k="' + k + '" data-d="' + r.d + '">' + (pend ? 'Wirklich entfernen?' : 'Entfernen') + '</button></div></div>';
      });
      h += '</div>';
    }
    return h;
  }

  function fixView() {
    var h = '<div class="list">' + energyItem('strom') + energyItem('gas');
    state.fix.slice().sort(function (a, b) { return monthlyOf(b) - monthlyOf(a); }).forEach(function (x) { h += fixItem(x, true); });
    h += '</div>';
    if (!state.fix.length) h += '<p class="empty">Noch keine weiteren Fixkosten. Trage zum Beispiel Miete, Internet, Handy oder Versicherungen ein, auch wenn sie nur jährlich oder vierteljährlich fällig sind.</p>';
    h += '<div class="sec" id="addsec"><h2>Neue Fixkosten</h2></div><div class="panel"><div class="fr one"><div><label for="fn">Bezeichnung</label><input id="fn" placeholder="z. B. Internet" autocomplete="off"></div></div>'
      + '<div class="fr"><div><label for="fb">Betrag in €</label><input id="fb" inputmode="decimal" placeholder="0,00"></div><div><label for="fr">Rhythmus</label><select id="fr">'
      + Object.keys(RHYTHM).map(function (k) { return '<option value="' + k + '">' + RHYTHM[k].l + '</option>'; }).join('') + '</select></div></div>'
      + '<div class="fr one"><div><label for="fc">Kategorie</label><select id="fc">' + Object.keys(CATS).map(function (k) { return '<option value="' + k + '">' + CATS[k].l + '</option>'; }).join('') + '</select></div></div>'
      + '<button class="btn" data-act="addf">Fixkosten speichern</button><p class="err" id="errf" role="alert"></p></div>';
    return h;
  }

  function settings() {
    var h = '<button class="link" data-act="back" style="padding-left:0">' + ic('back') + 'Zurück</button>';
    ['gas', 'strom'].forEach(function (k) {
      var t = state[k];
      h += '<div class="sec"><h2>Tarif ' + NAMES[k] + '</h2></div><div class="panel"><div class="fr"><div><label for="p-' + k + '">Arbeitspreis in ct/kWh (brutto)</label><input id="p-' + k + '" inputmode="decimal" value="' + (t.preisCt ? String(t.preisCt).replace('.', ',') : '') + '"></div>'
        + '<div><label for="g-' + k + '">Grundpreis in €/Jahr (brutto)</label><input id="g-' + k + '" inputmode="decimal" value="' + (t.grundJahr ? String(t.grundJahr).replace('.', ',') : '') + '"></div></div>'
        + '<div class="fr"><div><label for="a-' + k + '">Abschlag in € pro Monat</label><input id="a-' + k + '" inputmode="decimal" value="' + (t.abschlag ? String(t.abschlag).replace('.', ',') : '') + '"></div>'
        + (k === 'gas' ? '<div><label for="f-' + k + '">kWh pro m³ (Brennwert × Zustandszahl)</label><input id="f-' + k + '" inputmode="decimal" value="' + String(t.kwh).replace('.', ',') + '"></div>' : '<div></div>') + '</div>'
        + '<button class="btn" data-act="tarif" data-k="' + k + '">Tarif speichern</button><p class="err" id="errt-' + k + '" role="alert"></p></div>';
    });
    h += '<div class="sec"><h2>Datensicherung</h2></div><div class="panel"><p class="hint" style="margin-top:0">Deine Daten liegen nur auf diesem iPhone. Exportiere sie regelmäßig als Datei, zum Beispiel nach iCloud Drive.</p><div class="stack" style="margin-top:14px">'
      + '<button class="btn" data-act="export">Daten exportieren</button><button class="btn soft" data-act="import">Daten importieren</button></div>'
      + '<input type="file" id="imp" accept=".json,application/json" hidden><p class="hint">' + lastExportText() + '</p><p class="err" id="errd" role="alert"></p>';
    if (ui.imp) {
      var s = ui.imp;
      h += '<div class="notice"><div><b>Sicherung gefunden</b><span>' + s.gas.readings.length + ' Gas-Stände, ' + s.strom.readings.length + ' Strom-Stände, ' + s.fix.length + ' Fixkosten. Die aktuellen Daten auf diesem Gerät werden ersetzt.</span></div></div>'
        + '<div class="stack" style="margin-top:12px"><button class="btn" data-act="impok">Jetzt ersetzen</button><button class="btn soft" data-act="impno">Abbrechen</button></div>';
    }
    h += '<p class="hint">Version ' + (self.APP_VERSION || '?') + '</p></div><div class="sec"><h2>Zurücksetzen</h2></div><div class="panel"><button class="btn warn" data-act="wipe" style="width:100%">' + (ui.pending === 'wipe' ? 'Wirklich alles löschen?' : 'Alle Daten löschen') + '</button></div>';
    return h;
  }

  function bars(k) {
    var el = document.getElementById('chart-' + k);
    if (!el) return;
    var t = state[k], p = periods(k), col = COLS[k];
    var w = Math.max(240, el.clientWidth), h = 200, m = {l: 40, r: 4, t: 10, b: 28}, iw = w - m.l - m.r, ih = h - m.t - m.b;
    var vals = p.map(function (x) { return x.m / x.tage; }), max = Math.max.apply(null, vals) * 1.15 || 1;
    var step = Math.pow(10, Math.floor(Math.log10(max))), nice = Math.ceil(max / step) * step;
    var band = iw / p.length, bw = Math.min(band * 0.6, 64), svg = '<svg viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="Verbrauch pro Tag je Zeitraum in ' + t.unit + '">';
    for (var i = 0; i <= 4; i++) {
      var yv = nice / 4 * i, y = m.t + ih - yv / nice * ih;
      svg += '<line class="gl" x1="' + m.l + '" x2="' + (w - m.r) + '" y1="' + y + '" y2="' + y + '"/><text class="ax" x="' + (m.l - 6) + '" y="' + (y + 4) + '" text-anchor="end">' + n1.format(yv) + '</text>';
    }
    p.forEach(function (x, j) {
      var bh = vals[j] / nice * ih, bx = m.l + band * j + (band - bw) / 2, sel = ui.sel[k] === j;
      svg += '<rect data-act="bar" data-k="' + k + '" data-i="' + j + '" x="' + bx + '" y="' + (m.t + ih - bh) + '" width="' + bw + '" height="' + bh + '" rx="6" style="fill:' + col + ';opacity:' + (ui.sel[k] === null || sel ? 1 : 0.4) + ';cursor:pointer"/>';
      if (p.length <= 8) svg += '<text class="ax" x="' + (bx + bw / 2) + '" y="' + (h - 8) + '" text-anchor="middle">' + fmtS(x.von) + '–' + fmtS(x.bis) + '</text>';
    });
    el.innerHTML = svg + '</svg>';
    var cap = document.getElementById('cap-' + k);
    if (cap && ui.sel[k] !== null && p[ui.sel[k]]) {
      var x = p[ui.sel[k]];
      cap.textContent = fmtD(x.von) + ' bis ' + fmtD(x.bis) + ': ' + fmtU(k, x.m) + ' ' + t.unit + ' in ' + x.tage + ' Tagen, Kosten ' + eur.format(x.cost) + '.';
    }
  }

  var TABS = [{id: 'home', l: 'Übersicht', i: 'house'}, {id: 'use', l: 'Verbrauch', i: 'bars'}, {id: 'fix', l: 'Fixkosten', i: 'list'}];
  function render() {
    var v = document.getElementById('view'), titles = {home: ['Fixkosten', 'Deine laufenden Kosten im Blick'], use: ['Verbrauch', 'Gas und Strom nach Zählerstand'], fix: ['Fixkosten', 'Alles, was regelmäßig abgebucht wird'], settings: ['Tarife', 'Preise und Abschläge']};
    v.innerHTML = ui.tab === 'home' ? home() : ui.tab === 'use' ? usage() : ui.tab === 'fix' ? fixView() : settings();
    document.getElementById('title').textContent = titles[ui.tab][0];
    document.getElementById('subtitle').textContent = titles[ui.tab][1];
    document.getElementById('gear').innerHTML = ic('gear');
    document.getElementById('tabs').innerHTML = TABS.map(function (t) {
      return '<button data-act="tab" data-t="' + t.id + '"' + (ui.tab === t.id ? ' aria-current="page"' : '') + '>' + ic(t.i) + t.l + '</button>';
    }).join('');
    document.getElementById('sync').textContent = syncMsg;
    if (ui.tab === 'use') bars(ui.en);
  }

  /* ---------- Speichern ---------- */
  function setSync(m) { syncMsg = m; document.getElementById('sync').textContent = m; }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); setSync('Auf diesem Gerät gespeichert'); }
    catch (e) { setSync('Speichern nicht möglich'); }
  }
  function loadState() {
    try { var raw = localStorage.getItem(KEY); return raw ? normalize(JSON.parse(raw)) : blank(); } catch (e) { return blank(); }
  }
  function buildExport() { return {app: 'fixkosten', version: 1, exportedAt: new Date().toISOString(), data: state}; }
  function parseImport(text) {
    var o;
    try { o = JSON.parse(text); } catch (e) { return {ok: false, err: 'Die Datei ist kein gültiges JSON.'}; }
    var d = o && o.app === 'fixkosten' && o.data ? o.data : (o && o.gas && o.strom ? o : null);
    if (!d || typeof d !== 'object' || !d.gas || !d.strom) return {ok: false, err: 'Das ist keine Fixkosten-Sicherung.'};
    return {ok: true, state: normalize(d)};
  }
  function lastExportText() {
    try { var v = localStorage.getItem(KEY_EXP); return v ? 'Letzter Export: ' + fmtD(v.slice(0, 10)) : 'Noch nie exportiert'; } catch (e) { return ''; }
  }
  function doExport() {
    var json = JSON.stringify(buildExport(), null, 2), name = 'fixkosten-' + today() + '.json';
    var file = new File([json], name, {type: 'application/json'});
    function mark() { try { localStorage.setItem(KEY_EXP, new Date().toISOString()); } catch (e) {} if (ui.tab === 'settings') render(); }
    if (navigator.canShare && navigator.canShare({files: [file]})) {
      navigator.share({files: [file], title: 'Fixkosten-Sicherung'}).then(mark).catch(function () {});
      return;
    }
    var url = URL.createObjectURL(file), a = document.createElement('a');
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000); mark();
  }
  function setErr(id, msg) { var e = document.getElementById(id); if (e) e.textContent = msg; }
  function go(tab) { ui.prev = ui.tab === 'settings' ? ui.prev : ui.tab; ui.tab = tab; ui.pending = null; ui.open = null; render(); window.scrollTo(0, 0); }

  /* ---------- Aktionen ---------- */
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-act]');
    if (!t) return;
    var a = t.getAttribute('data-act'), k = t.getAttribute('data-k');
    if (a === 'tab') return go(t.getAttribute('data-t'));
    if (a === 'gear') return go('settings');
    if (a === 'back') { ui.tab = ui.prev || 'home'; render(); return; }
    if (a === 'goen') { ui.en = k; return go('use'); }
    if (a === 'seg') { ui.en = k; ui.pending = null; render(); return; }
    if (a === 'goadd') { go('fix'); var n = document.getElementById('fn'); if (n) { n.scrollIntoView({block: 'center'}); n.focus(); } return; }
    if (a === 'bar') { var i = +t.getAttribute('data-i'); ui.sel[k] = ui.sel[k] === i ? null : i; bars(k); return; }
    if (a === 'openf') { var id = t.getAttribute('data-id'); if (ui.tab === 'home') { ui.open = id; go('fix'); ui.open = id; render(); } else { ui.open = ui.open === id ? null : id; ui.pending = null; render(); } return; }
    if (a === 'addr') {
      var d = document.getElementById('d-' + k).value, v = num(document.getElementById('v-' + k).value), rs = state[k].readings;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return setErr('err-' + k, 'Bitte ein Datum wählen.');
      if (v === null || v < 0) return setErr('err-' + k, 'Bitte den Zählerstand als Zahl eingeben.');
      if (rs.some(function (r) { return r.d === d; })) return setErr('err-' + k, 'Für den ' + fmtD(d) + ' gibt es schon einen Stand. Entferne ihn zuerst.');
      var before = rs.filter(function (r) { return r.d < d; }).sort(function (x, y) { return x.d < y.d ? 1 : -1; })[0];
      var after = rs.filter(function (r) { return r.d > d; }).sort(function (x, y) { return x.d < y.d ? -1 : 1; })[0];
      if ((before && v < before.v) || (after && v > after.v)) return setErr('err-' + k, 'Der Stand passt nicht zu den Nachbarwerten. Ein Zähler läuft nur aufwärts.');
      rs.push({d: d, v: v}); ui.sel[k] = null; save(); render(); return;
    }
    if (a === 'delr') {
      var key = 'r:' + k + ':' + t.getAttribute('data-d');
      if (ui.pending === key) { state[k].readings = state[k].readings.filter(function (r) { return r.d !== t.getAttribute('data-d'); }); ui.pending = null; ui.sel[k] = null; save(); } else ui.pending = key;
      render(); return;
    }
    if (a === 'tarif') {
      var p = num(document.getElementById('p-' + k).value), g = num(document.getElementById('g-' + k).value), ab = num(document.getElementById('a-' + k).value);
      var fe = k === 'gas' ? num(document.getElementById('f-' + k).value) : 1;
      if (p === null || g === null || ab === null || fe === null || p < 0 || g < 0 || ab < 0 || fe <= 0) return setErr('errt-' + k, 'Bitte alle Felder mit Zahlen füllen.');
      state[k].preisCt = p; state[k].grundJahr = g; state[k].abschlag = ab; state[k].kwh = fe; save(); setErr('errt-' + k, ''); setSync('Speichert …'); return;
    }
    if (a === 'addf') {
      var nm = document.getElementById('fn').value.trim(), b = num(document.getElementById('fb').value), r = document.getElementById('fr').value, c = document.getElementById('fc').value;
      if (!nm) return setErr('errf', 'Bitte eine Bezeichnung eingeben.');
      if (b === null || b <= 0) return setErr('errf', 'Bitte einen Betrag über 0 eingeben.');
      state.fix.push({id: uid(), name: nm.slice(0, 60), betrag: b, rhythmus: r, icon: c}); save(); render(); return;
    }
    if (a === 'export') return doExport();
    if (a === 'import') { var inp = document.getElementById('imp'); if (inp) inp.click(); return; }
    if (a === 'impno') { ui.imp = null; render(); return; }
    if (a === 'impok') { if (ui.imp) { state = ui.imp; ui.imp = null; save(); render(); setErr('errd', ''); } return; }
    if (a === 'wipe') { if (ui.pending === 'wipe') { state = blank(); ui.pending = null; save(); } else ui.pending = 'wipe'; render(); return; }
    if (a === 'addc') {
      var cd = document.getElementById('ca').value, cbv = num(document.getElementById('cb').value), it = state.fix.filter(function (z) { return z.id === t.getAttribute('data-id'); })[0];
      if (!it) return;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(cd)) return setErr('errc', 'Bitte ein Datum wählen.');
      if (cbv === null || cbv <= 0) return setErr('errc', 'Bitte einen Betrag über 0 eingeben.');
      it.aenderungen = (it.aenderungen || []).filter(function (c) { return c.ab !== cd; }).concat([{ab: cd, betrag: cbv}]).sort(function (p, q) { return p.ab < q.ab ? -1 : 1; });
      save(); render(); return;
    }
    if (a === 'delc') {
      var it2 = state.fix.filter(function (z) { return z.id === t.getAttribute('data-id'); })[0];
      if (it2) { it2.aenderungen = (it2.aenderungen || []).filter(function (c) { return c.ab !== t.getAttribute('data-ab'); }); save(); render(); }
      return;
    }
    if (a === 'delf') {
      var fk = 'f:' + t.getAttribute('data-id');
      if (ui.pending === fk) { state.fix = state.fix.filter(function (x) { return x.id !== t.getAttribute('data-id'); }); ui.pending = null; ui.open = null; save(); } else ui.pending = fk;
      render(); return;
    }
  });
  window.addEventListener('resize', function () { if (ui.tab === 'use') bars(ui.en); });

  document.addEventListener('change', function (e) {
    if (!e.target || e.target.id !== 'imp' || !e.target.files || !e.target.files[0]) return;
    var f = e.target.files[0], rd = new FileReader();
    rd.onload = function () {
      var r = parseImport(String(rd.result));
      if (!r.ok) { ui.imp = null; render(); setErr('errd', r.err); return; }
      ui.imp = r.state; render();
    };
    rd.onerror = function () { setErr('errd', 'Die Datei konnte nicht gelesen werden.'); };
    rd.readAsText(f);
  });
  window.FK = {parseImport: parseImport, buildExport: buildExport};

  /* ---------- Start ---------- */
  state = loadState();
  render();
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) {}
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    var reloading = false;
    function showUpdate(worker) {
      var box = document.getElementById('upd'), btn = document.getElementById('updBtn');
      if (!box || !btn) return;
      box.hidden = false;
      btn.onclick = function () { btn.disabled = true; worker.postMessage('SKIP_WAITING'); };
    }
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (reloading) return; reloading = true; window.location.reload();
    });
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('./sw.js').then(function (reg) {
        if (reg.waiting && navigator.serviceWorker.controller) showUpdate(reg.waiting);
        reg.addEventListener('updatefound', function () {
          var nw = reg.installing;
          if (!nw) return;
          nw.addEventListener('statechange', function () {
            if (nw.state === 'installed' && navigator.serviceWorker.controller) showUpdate(nw);
          });
        });
        document.addEventListener('visibilitychange', function () { if (!document.hidden) reg.update().catch(function () {}); });
        reg.update().catch(function () {});
      }).catch(function () {});
    });
  }
})();
