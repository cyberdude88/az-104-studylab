/**
 * AZ-104 StudyLab ⇄ Google Sheets progress sync.
 *
 * Paste into the readiness Sheet: Extensions → Apps Script → Code.gs.
 * Then run setup() once, and deploy as a Web app (Execute as: Me · Who has access: Anyone).
 * The StudyLab page sends progress here and reads it back. Every request must carry the
 * sync token, which is kept in Script Properties and never written to the Sheet.
 *
 * Tabs created: Lab_Runs (append-only log), Lab_Status (one row per mission/script),
 * Lab_Concepts (concept heat; edit "Your priority" to steer the game), Lab_Dashboard (formulas).
 * Existing tabs are never modified.
 *
 * @OnlyCurrentDoc
 */

const TABS = {
  runs: { name: 'Lab_Runs', head: ['Timestamp', 'Date', 'Game', 'Item ID', 'Title', 'Mode', 'Language', 'Primary domain', 'Domains', 'Concepts', 'Blanks', 'Misses', 'Clean', 'XP', 'Level after', 'Next due', 'Missed picks', 'Score %', 'Run ID', 'Game ID'] },
  status: { name: 'Lab_Status', head: ['Game', 'Item ID', 'Title', 'Primary domain', 'Mode', 'Language', 'Level', 'Status', 'Runs', 'Clean runs', 'Total misses', 'Last played', 'Next due', 'Updated', 'Game ID'] },
  concepts: { name: 'Lab_Concepts', head: ['Concept ID', 'Concept', 'Source', 'Base weight', 'Misses', 'Hits', 'Heat', 'Your priority', 'Updated'] },
  dash: { name: 'Lab_Dashboard' }
};
const PRIORITIES = ['High', 'Medium', 'Normal', 'Low', 'Ignore'];
const GAMES = { cts: 'Complete the Script', nov25: 'NOV25 Benchmark' };
const MAX_ITEMS = 300;
const ID_RE = /^[a-z0-9][a-z0-9-]{0,47}$/;

/* ───────── menu + setup ───────── */
function onOpen() {
  SpreadsheetApp.getUi().createMenu('StudyLab sync')
    .addItem('Set up / repair tabs', 'setup')
    .addItem('Show sync token', 'showToken')
    .addItem('Rotate sync token', 'rotateToken')
    .addToUi();
}

function setup() {
  const ss = SpreadsheetApp.getActive();
  ensureTabs_(ss);
  buildDashboard_(ss);
  const t = token_();
  Logger.log('StudyLab sync token: ' + t);
  return 'Tabs ready. Token is in the execution log, or use StudyLab sync → Show sync token.';
}

function showToken() {
  const ui = SpreadsheetApp.getUi();
  ui.alert('StudyLab sync token', token_() + '\n\nPaste this into the Google Sheet sync panel on the StudyLab page. Keep it private: with the token and the web app URL, someone could write to the Lab_ tabs.', ui.ButtonSet.OK);
}

function rotateToken() {
  PropertiesService.getScriptProperties().deleteProperty('SYNC_TOKEN');
  showToken();
}

function token_() {
  const p = PropertiesService.getScriptProperties();
  let t = p.getProperty('SYNC_TOKEN');
  if (!t) { t = (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, ''); p.setProperty('SYNC_TOKEN', t); }
  return t;
}

function ensureTabs_(ss) {
  ['runs', 'status', 'concepts'].forEach(k => {
    const def = TABS[k];
    let sh = ss.getSheetByName(def.name);
    if (!sh) sh = ss.insertSheet(def.name);
    const first = sh.getRange(1, 1, 1, def.head.length).getValues()[0];
    if (first.join('') === '') {
      sh.getRange(1, 1, 1, def.head.length).setValues([def.head]).setFontWeight('bold').setBackground('#e8f1fb').setFontColor('#0b3d6e');
      sh.setFrozenRows(1);
      sh.autoResizeColumns(1, def.head.length);
    }
  });
  const runs = ss.getSheetByName(TABS.runs.name);
  runs.getRange('A2:A').setNumberFormat('yyyy-mm-dd hh:mm');
  runs.getRange('B2:B').setNumberFormat('yyyy-mm-dd');
  runs.getRange('P2:P').setNumberFormat('yyyy-mm-dd');
  const st = ss.getSheetByName(TABS.status.name);
  st.getRange('L2:M').setNumberFormat('yyyy-mm-dd');
  st.getRange('N2:N').setNumberFormat('yyyy-mm-dd hh:mm');
  const c = ss.getSheetByName(TABS.concepts.name);
  c.getRange('I2:I').setNumberFormat('yyyy-mm-dd hh:mm');
  const rule = SpreadsheetApp.newDataValidation().requireValueInList(PRIORITIES, true).setAllowInvalid(false)
    .setHelpText('High / Medium raise this concept in the game queue; Low lowers it; Ignore hides it from the hot list.').build();
  c.getRange(2, 8, Math.max(c.getMaxRows() - 1, 1), 1).setDataValidation(rule);
}

function buildDashboard_(ss) {
  let sh = ss.getSheetByName(TABS.dash.name);
  if (!sh) sh = ss.insertSheet(TABS.dash.name);
  sh.clear();
  const R = 'Lab_Runs!', notMeta = R + 'F2:F,"<>baseline",' + R + 'F2:F,"<>retake"';
  const rows = [
    ['AZ-104 StudyLab · progress sync', ''],
    ['Written by the StudyLab pages. Edit "Your priority" in Lab_Concepts to steer the game.', ''],
    ['', ''],
    ['Runs logged', '=COUNTIFS(' + R + 'A2:A,"<>",' + notMeta + ')'],
    ['Clean runs', '=COUNTIFS(' + R + 'M2:M,TRUE,' + notMeta + ')'],
    ['Clean rate', '=IFERROR(B5/B4,0)'],
    ['Total XP', '=SUM(' + R + 'N2:N)'],
    ['Days practised', '=IFERROR(COUNTUNIQUE(FILTER(' + R + 'B2:B,' + R + 'F2:F<>"baseline",' + R + 'B2:B<>"")),0)'],
    ['Complete the Script mastered', '=COUNTIFS(Lab_Status!O2:O,"cts",Lab_Status!H2:H,"Mastered")&" / 54"'],
    ['NOV25 missions mastered', '=COUNTIFS(Lab_Status!O2:O,"nov25",Lab_Status!H2:H,"Mastered")&" / 28"'],
    ['Last run', '=IFERROR(MAX(' + R + 'A2:A),"")']
  ];
  sh.getRange(1, 1, rows.length, 2).setValues(rows);
  sh.getRange('A1').setFontSize(14).setFontWeight('bold');
  sh.getRange('A2').setFontColor('#5b6672');
  sh.getRange('B6').setNumberFormat('0%');
  sh.getRange('B11').setNumberFormat('yyyy-mm-dd hh:mm');

  const domains = ['Identity & governance', 'Storage', 'Compute', 'Networking', 'Monitor & maintain'];
  sh.getRange('A13:F13').setValues([['Domain', 'Script runs', 'Script clean %', 'NOV25 runs', 'NOV25 clean %', 'Misses (all)']]).setFontWeight('bold').setBackground('#e8f1fb');
  domains.forEach((d, i) => {
    const r = 14 + i, a = 'A' + r;
    sh.getRange(r, 1, 1, 6).setFormulas([[
      '="' + d + '"',
      '=COUNTIFS(' + R + 'T2:T,"cts",' + R + 'H2:H,' + a + ',' + notMeta + ')',
      '=IFERROR(COUNTIFS(' + R + 'T2:T,"cts",' + R + 'H2:H,' + a + ',' + R + 'M2:M,TRUE)/B' + r + ',"")',
      '=COUNTIFS(' + R + 'T2:T,"nov25",' + R + 'H2:H,' + a + ',' + notMeta + ')',
      '=IFERROR(COUNTIFS(' + R + 'T2:T,"nov25",' + R + 'H2:H,' + a + ',' + R + 'M2:M,TRUE)/D' + r + ',"")',
      '=SUMIFS(' + R + 'L2:L,' + R + 'H2:H,' + a + ')'
    ]]);
  });
  sh.getRange('C14:C18').setNumberFormat('0%');
  sh.getRange('E14:E18').setNumberFormat('0%');

  sh.getRange('A20:D20').setValues([['Hottest concepts', 'Heat', 'Misses', 'Your priority']]).setFontWeight('bold').setBackground('#fff0e6');
  sh.getRange('A21').setFormula('=IFERROR(ARRAY_CONSTRAIN(SORT(FILTER({Lab_Concepts!B2:B,Lab_Concepts!G2:G,Lab_Concepts!E2:E,Lab_Concepts!H2:H},Lab_Concepts!A2:A<>"",Lab_Concepts!H2:H<>"Ignore"),2,FALSE),10,4),"No concepts yet")');

  sh.getRange('A33:E33').setValues([['Recent runs', 'Game', 'Title', 'Misses', 'XP']]).setFontWeight('bold').setBackground('#e8f1fb');
  sh.getRange('A34').setFormula('=IFERROR(ARRAY_CONSTRAIN(SORT(FILTER({' + R + 'A2:A,' + R + 'C2:C,' + R + 'E2:E,' + R + 'L2:L,' + R + 'N2:N},' + R + 'A2:A<>"",' + R + 'F2:F<>"baseline"),1,FALSE),15,5),"No runs yet")');
  sh.getRange('A34:A48').setNumberFormat('yyyy-mm-dd hh:mm');
  sh.setColumnWidth(1, 260); sh.setColumnWidths(2, 5, 130); sh.setColumnWidth(3, 320);
}

/* ───────── web app ───────── */
function doGet() {
  return json_({ ok: true, service: 'az104-studylab-sync', note: 'POST only' });
}

function doPost(e) {
  const lock = LockService.getDocumentLock();
  let locked = false;
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (!safeEq_(String(body.token || ''), token_())) return json_({ ok: false, error: 'unauthorized' });
    if (body.action === 'ping') return json_({ ok: true, service: 'az104-studylab-sync', version: 1 });
    if (body.action !== 'sync') return json_({ ok: false, error: 'unknown action' });
    locked = lock.tryLock(20000);
    if (!locked) return json_({ ok: false, error: 'busy, try again' });
    const ss = SpreadsheetApp.getActive();
    if (!ss.getSheetByName(TABS.runs.name) || !ss.getSheetByName(TABS.dash.name)) { ensureTabs_(ss); buildDashboard_(ss); }
    const added = appendRuns_(ss, list_(body.runs));
    upsertStatus_(ss, list_(body.status));
    upsertConcepts_(ss, list_(body.concepts));
    const out = pull_(ss);
    out.ok = true; out.added = added;
    return json_(out);
  } catch (err) {
    return json_({ ok: false, error: String((err && err.message) || err).slice(0, 200) });
  } finally {
    if (locked) lock.releaseLock();
  }
}

/* ───────── writers ───────── */
function appendRuns_(ss, runs) {
  if (!runs.length) return 0;
  const sh = ss.getSheetByName(TABS.runs.name), W = TABS.runs.head.length, last = sh.getLastRow();
  const seen = new Set(last > 1 ? sh.getRange(2, 19, last - 1, 1).getValues().map(r => String(r[0])) : []);
  const rows = [];
  runs.forEach(r => {
    const gid = game_(r.gameId), id = String(r.id || ''), rid = str_(r.runId, 64);
    if (!gid || !ID_RE.test(id) || !rid || seen.has(rid)) return;
    seen.add(rid);
    const ts = new Date(r.ts);
    rows.push([
      isNaN(ts) ? new Date() : ts, day_(r.date), GAMES[gid], id, str_(r.title, 160), str_(r.mode, 24), str_(r.lang, 24),
      str_(r.domain, 40), str_(r.domains, 160), str_(r.concepts, 240), num_(r.blanks, 0, 99), num_(r.misses, 0, 999),
      r.clean === true, num_(r.xp, 0, 1000000), num_(r.level, 0, 9), day_(r.due), str_(r.missed, 600),
      (r.score === null || r.score === undefined || r.score === '') ? '' : num_(r.score, 0, 100), rid, gid
    ]);
  });
  if (rows.length) sh.getRange(last + 1, 1, rows.length, W).setValues(rows);
  return rows.length;
}

function upsertStatus_(ss, items) {
  if (!items.length) return;
  const sh = ss.getSheetByName(TABS.status.name), W = TABS.status.head.length, last = sh.getLastRow();
  const data = last > 1 ? sh.getRange(2, 1, last - 1, W).getValues() : [];
  const idx = {};
  data.forEach((r, i) => { idx[r[14] + '|' + r[1]] = i; });
  const now = new Date();
  items.forEach(s => {
    const gid = game_(s.gameId), id = String(s.id || '');
    if (!gid || !ID_RE.test(id)) return;
    const inc = {
      title: str_(s.title, 160), domain: str_(s.domain, 40), mode: str_(s.mode, 24), lang: str_(s.lang, 24),
      level: num_(s.level, 0, 9), status: str_(s.status, 16), runs: num_(s.runs, 0, 100000), clean: num_(s.clean, 0, 100000),
      misses: num_(s.misses, 0, 1000000), last: day_(s.last), due: day_(s.due)
    };
    const k = gid + '|' + id;
    if (k in idx) {
      const r = data[idx[k]], exLast = dayOut_(ss, r[11]);
      r[2] = inc.title; r[3] = inc.domain; r[4] = inc.mode; r[5] = inc.lang;
      r[8] = Math.max(+r[8] || 0, inc.runs); r[9] = Math.max(+r[9] || 0, inc.clean); r[10] = Math.max(+r[10] || 0, inc.misses);
      if (inc.last && (!exLast || inc.last >= exLast)) { r[6] = inc.level; r[7] = inc.status; r[11] = inc.last; r[12] = inc.due; }
      r[13] = now;
    } else {
      idx[k] = data.length;
      data.push([GAMES[gid], id, inc.title, inc.domain, inc.mode, inc.lang, inc.level, inc.status, inc.runs, inc.clean, inc.misses, inc.last, inc.due, now, gid]);
    }
  });
  if (data.length) sh.getRange(2, 1, data.length, W).setValues(data);
}

function upsertConcepts_(ss, items) {
  if (!items.length) return;
  const sh = ss.getSheetByName(TABS.concepts.name), W = TABS.concepts.head.length, last = sh.getLastRow();
  const data = last > 1 ? sh.getRange(2, 1, last - 1, W).getValues() : [];
  const idx = {};
  data.forEach((r, i) => { idx[r[0]] = i; });
  const now = new Date();
  items.forEach(c => {
    const id = String(c.id || '');
    if (!ID_RE.test(id)) return;
    const heat = Math.round(Number(c.heat) * 10) / 10;
    const vals = { label: str_(c.label, 120), src: str_(c.src, 40), w: num_(c.w, 0, 9), misses: num_(c.misses, 0, 100000), hits: num_(c.hits, 0, 100000), heat: isFinite(heat) ? heat : 0 };
    if (id in idx) {
      const r = data[idx[id]];
      r[1] = vals.label; r[2] = vals.src; r[3] = vals.w;
      r[4] = Math.max(+r[4] || 0, vals.misses); r[5] = Math.max(+r[5] || 0, vals.hits); r[6] = vals.heat;
      if (PRIORITIES.indexOf(r[7]) < 0) r[7] = 'Normal';
      r[8] = now;
    } else {
      idx[id] = data.length;
      data.push([id, vals.label, vals.src, vals.w, vals.misses, vals.hits, vals.heat, 'Normal', now]);
    }
  });
  if (data.length) sh.getRange(2, 1, data.length, W).setValues(data);
}

/* ───────── reader ───────── */
function pull_(ss) {
  const out = { status: [], concepts: [], totals: {}, retakes: [] };
  const st = ss.getSheetByName(TABS.status.name);
  if (st.getLastRow() > 1) st.getRange(2, 1, st.getLastRow() - 1, TABS.status.head.length).getValues().forEach(r => {
    if (!game_(r[14])) return;
    out.status.push({ game: r[14], id: String(r[1]), level: +r[6] || 0, runs: +r[8] || 0, clean: +r[9] || 0, misses: +r[10] || 0, last: dayOut_(ss, r[11]), due: dayOut_(ss, r[12]) });
  });
  const c = ss.getSheetByName(TABS.concepts.name);
  if (c.getLastRow() > 1) c.getRange(2, 1, c.getLastRow() - 1, TABS.concepts.head.length).getValues().forEach(r => {
    out.concepts.push({ id: String(r[0]), misses: +r[4] || 0, hits: +r[5] || 0, priority: PRIORITIES.indexOf(r[7]) >= 0 ? r[7] : 'Normal' });
  });
  const ru = ss.getSheetByName(TABS.runs.name);
  if (ru.getLastRow() > 1) {
    const days = {};
    ru.getRange(2, 1, ru.getLastRow() - 1, TABS.runs.head.length).getValues().forEach(r => {
      const gid = game_(r[19]);
      if (!gid) return;
      const t = out.totals[gid] || (out.totals[gid] = { xp: 0, runs: 0, days: [] });
      t.xp += +r[13] || 0;
      const d = dayOut_(ss, r[1]);
      if (r[5] === 'retake') { if (d && r[17] !== '') out.retakes.push({ game: gid, d: d, score: +r[17] }); return; }
      if (r[5] === 'baseline') return;
      t.runs++;
      if (d) { days[gid] = days[gid] || {}; days[gid][d] = 1; }
    });
    Object.keys(days).forEach(g => { out.totals[g].days = Object.keys(days[g]).sort().slice(-400); });
  }
  return out;
}

/* ───────── helpers ───────── */
function list_(a) { return Array.isArray(a) ? a.slice(0, MAX_ITEMS) : []; }
function game_(g) { return Object.prototype.hasOwnProperty.call(GAMES, g) ? g : ''; }
function str_(v, max) {
  let s = v === null || v === undefined ? '' : String(v).replace(/[\u0000-\u001f\u007f]/g, ' ').slice(0, max || 200);
  if (/^[=+\-@]/.test(s)) s = "'" + s; // never let synced text become a formula
  return s;
}
function num_(v, min, max) { const n = Number(v); return isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : 0; }
function day_(v) { const s = String(v || ''); return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : ''; }
function dayOut_(ss, v) {
  if (v instanceof Date) return Utilities.formatDate(v, ss.getSpreadsheetTimeZone(), 'yyyy-MM-dd');
  return day_(v);
}
function safeEq_(a, b) {
  if (a.length !== b.length || !a.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
