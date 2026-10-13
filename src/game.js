// ---------- Noodle Rush: game logic ----------
const W = 1280, H = 720, TOP = 182, FLOOR = TOP + FLOOR_LOCAL;
const DOOR_X = 88, QUEUE_X = [488, 400, 315, 230], OVERFLOW_X = [880, 830];
const FD = '"Baloo 2", "Trebuchet MS", sans-serif';
const FB = 'Nunito, "Segoe UI", sans-serif';
const FH = '"Patrick Hand", "Comic Sans MS", cursive';
const COL = {
  basil: 0x07411e, basilMid: 0x0f5a2c, cream: 0xfbf3e0, pasta: 0xf6c453, pastaDark: 0xd9a22e, tomato: 0xd9432f,
  wood: 0xa8683a, woodDark: 0x7d4a26, ink: 0x2b1a10, steel: 0xb9bec4, steelDark: 0x7d848c, good: 0x4caf50, warn: 0xf2b134, bad: 0xd9432f, gold: 0xf2b630,
};
const PATIENCE = 260;
const BOIL = { ready: 18, done: 23, max: 32 };
const DOUGH_BAND = [70, 85];
const SAUCE_BAND = [60, 80];
const SPOT_TOL = 0.14;
const TP = { x: 620, y: 384, r: 150 };   // toppings plate
const STATIONS = [
  { id: 'order', name: 'Order', stages: [] },
  { id: 'dough', name: 'Dough', stages: ['dough'] },
  { id: 'boil', name: 'Boil', stages: ['boil', 'boiling'] },
  { id: 'sauce', name: 'Sauce', stages: ['sauce'] },
  { id: 'toppings', name: 'Toppings', stages: ['toppings'] },
  { id: 'serve', name: 'Serve', stages: ['ready'] },
];
const RAV = { x: 540, y: 340, s: 100 };   // ravioli board: first square center and square size
// Nonna's gift for keeping the dish of the day streak alive
const STREAK_GIFT = n => ({ 3: 5, 5: 10, 7: 10, 10: 15, 14: 15 })[n] || (n > 14 && n % 7 === 0 ? 15 : 0);
const OVEN_STATION = { id: 'oven', name: 'Oven', stages: [], match: d => d.order.bread && !d.bread && d.stage !== 'served' };
const BREAD = { ready: 7, done: 11, max: 16 };
const PEEL_T = 1.0;   // seconds for the peel to go into the oven and back
const STAGE_LABEL = { served: 'Serving now', dough: 'Needs dough', boil: 'Ready to boil', boiling: 'Boiling', sauce: 'Needs sauce', toppings: 'Needs toppings', ready: 'Ready to serve' };
const NONNA_TIPS = {
  order: 'When a customer reaches the counter, click them to take their order. Your chef writes it down and the ticket goes up on the rail.',
  dough: 'Every plate starts with fresh dough. Grab the crank and turn it round and round until the meter is green, then cut the shape on the ticket.',
  boil: 'Drop the pasta in a pot. It keeps cooking while you work elsewhere, so come back and drain it when the ring is green. Al dente, not mushy!',
  sauce: 'Click the pot with the right sauce to pick up the spatula. Then hold the mouse on the pasta to pour. Keep it on the noodles, not the plate!',
  toppings: 'Look at the ticket: each topping has its own spot on the plate. Grab a topping from its bin and drag it onto the faded spots. Pretty plates earn bigger tips.',
  oven: 'Garlic bread! Drag a slice onto the wooden pizza peel, then push the peel to slide it into the brick oven. Bake it while the pasta boils, and take it out when it is golden, not burnt. It goes with the plate automatically.',
  serve: 'Pick up the finished plate from the pass and carry it to your customer\'s table. They will taste it and tell you what they think. Happy customers come back and tip more!',
};

// ---------- save ----------
const SAVE_KEY = 'noodleRush.save.v1';
function loadSave() { try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); if (s && typeof s === 'object') return s; } catch (e) {} return null; }
function freshSave() {
  return { chef: null, day: 1, bank: 0, friends: {}, seen: {}, looks: {}, owned: {}, nextUid: 10,
    decor: DEFAULT_DECOR.map((d, i) => ({ uid: i + 1, ...d, placed: true })), room: { wall: 'cream', floor: 'terracotta', cloth: 'red' },
    tables: DEFAULT_TABLES.map(t => ({ ...t })), pantry: START_PANTRY, upgrades: {}, buzz: [], paper: null, criticDay: 3, lastDay: null,
    streak: 0, dotd: null, unlockSeen: 1, renov: 0, boost: null, market: null, marketSeen: 0, muted: false, feedbackAsked: false, feedbackAskedReal: false, feedback: {},
    garden: { beds: Array.from({ length: GARDEN_START }, () => ({ crop: null })) }, fresh: { basil: 0, parsley: 0, tomato: 0, garlic: 0 },
    visit: { last: null, streak: 0, best: 0, cover: null }, mail: null, lettersRead: [], daily: null,
    stats: { firstPlay: Date.now(), sessions: 0, playSec: 0, daysStarted: 0, daysFinished: 0, history: [], realDays: [], planted: 0, harvested: 0, watered: 0, dailies: 0, letters: 0, freshUsed: 0 } };
}
function migrate(s) {
  const f = freshSave();
  for (const k of Object.keys(f)) if (s[k] === undefined) s[k] = f[k];
  for (const k of ['stats', 'fresh', 'visit']) for (const j of Object.keys(f[k])) if (s[k][j] === undefined) s[k][j] = f[k][j];
  return s;
}
let SAVE = migrate(loadSave() || freshSave());
const money2 = () => SAVE.bank || 0;
function spend(price) { if (money2() < price - 1e-9) return false; SAVE.bank = Math.round((SAVE.bank - price) * 100) / 100; writeSave(); return true; }
function chefLook(id) { const c = CHEFS.find(q => q.id === id) || CHEFS[0]; return Object.assign({}, c.look, (SAVE.looks || {})[c.id] || {}); }
function lookId(base, look) { const str = JSON.stringify(look); let h = 7; for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0; return base + '_' + (h >>> 0).toString(36); }
function expectedCount(day) {
  const base = dayConfig(day).roster.length, delta = SAVE.buzz.reduce((a, b) => a + b.delta, 0);
  return Math.max(2, base + delta) + (SAVE.criticDay === day ? 1 : 0);
}
function writeSave() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(SAVE)); } catch (e) {} }
function friendOf(key) { if (!SAVE.friends[key]) SAVE.friends[key] = { pts: 0, visits: 0 }; return SAVE.friends[key]; }
const friendLevel = key => Math.min(5, Math.floor(friendOf(key).pts / 2));
// tips are rounded to a whole coin; renovations and a market boost raise them
const tipQ = v => Math.round(v * 10) / 10;
const boostToday = id => !!(SAVE.boost && SAVE.boost.day === (SAVE.day || 1) && SAVE.boost.id === id);
function tipBoost() { const r = RENOVATIONS[(SAVE.renov || 0) - 1]; return (1 + (r ? r.tip : 0)) * (boostToday('oil') ? 1.1 : 1); }

// ---------- the real-world clock ----------
const nowMs = () => Date.now() + (window.NR_SKEW || 0);   // NR_SKEW lets a tester jump ahead in time
const dateKey = ms => { const d = new Date(ms); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const todayKey = () => dateKey(nowMs());
const keyUTC = k => { const [y, m, d] = k.split('-').map(Number); return Date.UTC(y, m - 1, d); };
const dayDiff = (a, b) => Math.round((keyUTC(b) - keyUTC(a)) / 864e5);
const msToMidnight = () => { const d = new Date(nowMs()); return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1) - d; };
function durText(ms) { const m = Math.max(1, Math.ceil(ms / 60000)); return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m`; }
function hashStr(s) { let h = 7; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h >>> 0; }
// Runs at start-up and every morning: counts the real days someone plays and keeps their visit streak.
// Missing a single day is forgiven once a week ("Nonna kept your streak warm").
function noteVisit() {
  const t = todayKey(), v = SAVE.visit, st = SAVE.stats;
  if (v.last === t) return false;
  const gap = v.last ? dayDiff(v.last, t) : 99;
  if (gap < 0) { v.last = t; writeSave(); return false; }
  v.covered = false;
  if (gap === 1) v.streak++;
  else if (gap === 2 && v.streak > 0 && (!v.cover || dayDiff(v.cover, t) >= 7)) { v.streak++; v.cover = t; v.covered = true; }
  else v.streak = 1;
  v.best = Math.max(v.best || 0, v.streak); v.last = t;
  if (!st.realDays.includes(t)) st.realDays.push(t);
  if (st.realDays.length > 60) st.realDays.shift();
  writeSave();
  return true;
}
const letterDef = id => LETTERS.find(l => l.id === id) || LETTERS[0];
const senderOf = from => from === 'nonna' ? { name: 'Nonna', look: NONNA_LOOK } : from === 'lella' ? { name: 'Zia Lella', look: ZIA_LELLA.look } : { name: TOWNSFOLK[from].short, look: TOWNSFOLK[from].look };
// One letter per real day. The first two introduce the garden and the Daily Dish; after that, Nonna or a regular you have met writes.
function ensureMail() {
  const t = todayKey(), read = SAVE.lettersRead;
  if (SAVE.mail && SAVE.mail.date === t) return SAVE.mail;
  const met = k => k === 'nonna' || k === 'lella' || !!(TOWNSFOLK[k] && SAVE.friends[k] && SAVE.friends[k].visits > 0);
  let pool = LETTERS.slice(0, 2).filter(l => !read.includes(l.id));
  if (!pool.length) pool = LETTERS.slice(2).filter(l => !read.includes(l.id) && met(l.from));
  if (!pool.length) { const last = read[read.length - 1]; read.length = 2; pool = LETTERS.slice(2).filter(l => met(l.from) && l.id !== last); }
  const L = pool.length > 2 ? pool[Math.floor(rng(hashStr(t))() * pool.length)] : pool[0];
  read.push(L.id);
  const v = SAVE.visit;
  SAVE.mail = { date: t, id: L.id, gift: MAIL_GIFT(v.streak), streak: v.streak, covered: !!v.covered, claimed: false };
  SAVE.stats.letters++;
  writeSave();
  return SAVE.mail;
}
// The Daily Dish: every player gets the same order on the same date. Only starter items, so anyone can cook it.
const dailyNumber = (t = todayKey()) => dayDiff(DAILY_EPOCH, t) + 1;
function dailyOrder(t) {
  const R = rng(hashStr('daily:' + t)), pick = a => a[Math.floor(R() * a.length)];
  const shape = pick(['spaghetti', 'penne', 'farfalle']), sauce = pick(['marinara', 'alfredo', 'pesto']);
  const ids = ['parm', 'basil', 'meatball', 'mushroom', 'chili'];
  for (let i = ids.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [ids[i], ids[j]] = [ids[j], ids[i]]; }   // same shuffle on every browser
  const pats = [['center', 1], ['ring', 3 + Math.floor(R() * 3)], ['inner', 2 + Math.floor(R() * 2)]];
  const n = R() < 0.5 ? 2 : 3;
  return { shape, sauce, toppings: ids.slice(0, n).map((id, i) => ({ id, n: pats[i][1], pattern: pats[i][0] })) };
}
function dishName(o) {
  const tops = o.toppings.map(t => t.n > 1 && PLURAL[t.id] ? PLURAL[t.id] : TOPPINGS.find(q => q.id === t.id).name.toLowerCase());
  return `${shapeName(o.shape)} with ${SAUCES.find(q => q.id === o.sauce).name.toLowerCase()}${tops.length ? ', ' + tops.slice(0, -1).join(', ') + (tops.length > 1 ? ' and ' : '') + tops[tops.length - 1] : ''}`;
}
// which garden crops a plate uses
function freshWants(id, order, d) {
  if (id === 'parsley') return true;
  if (id === 'basil') return order.sauce === 'pesto' || order.toppings.some(t => t.id === 'basil');
  if (id === 'tomato') return TOMATO_SAUCES.includes(order.sauce);
  if (id === 'garlic') return order.sauce === 'aglione' || !!(order.bread && d.bread);
  return false;
}

// ---------- helpers ----------
function rng(seed) {
  let a = seed >>> 0;
  return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
// Money is kept in the save as before, and shown as Nonna's gold coins: 10 coins to each old dollar.
const coinsOf = v => Math.round((v || 0) * 10);
const money = v => { const n = coinsOf(v); return `${n.toLocaleString('en-US')} coin${n === 1 ? '' : 's'}`; };
function bandScore(v, band, max, slope) {
  if (v >= band[0] && v <= band[1]) return max;
  const d = v < band[0] ? band[0] - v : v - band[1];
  return clamp(Math.round(max - d * slope), 0, max);
}
function clockText(t) {
  const mins = 11 * 60 + Math.floor(t);
  let h = Math.floor(mins / 60) % 24; const m = mins % 60, pm = h >= 12;
  h = h % 12 || 12;
  return `${h}:${String(m).padStart(2, '0')} ${pm ? 'PM' : 'AM'}`;
}

let audio = null;
function sfx(type) {
  if (typeof SAVE !== 'undefined' && SAVE.muted) return;
  try {
    if (!audio) audio = new (window.AudioContext || window.webkitAudioContext)();
    const now = audio.currentTime;
    const notes = {
      click: [[520, 0.05]], ding: [[880, 0.12], [1320, 0.2]], serve: [[660, 0.1], [880, 0.1], [1100, 0.22]], bad: [[220, 0.25]],
      pop: [[740, 0.05]], bell: [[1568, 0.08], [2093, 0.3]], scribble: [[300, 0.03], [340, 0.03], [280, 0.03]], coin: [[988, 0.08], [1319, 0.25]], star: [[1046, 0.09]],
    }[type] || [[440, 0.1]];
    let t = now;
    for (const [f, d] of notes) {
      const o = audio.createOscillator(), g = audio.createGain();
      o.type = type === 'bad' ? 'sawtooth' : type === 'scribble' ? 'square' : 'triangle';
      o.frequency.value = f;
      g.gain.setValueAtTime(type === 'scribble' ? 0.03 : 0.11, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + d);
      o.connect(g).connect(audio.destination);
      o.start(t); o.stop(t + d + 0.02);
      t += d * 0.8;
    }
  } catch (e) { /* sound is optional */ }
}

function makeButton(scene, x, y, w, h, label, cb, opts = {}) {
  const c = scene.add.container(x, y);
  const g = scene.add.graphics();
  const t = scene.add.text(0, 1, label, { fontFamily: FD, fontSize: (opts.size || 22) + 'px', fontStyle: '800', color: opts.textColor || '#fff8e8', align: 'center' }).setOrigin(0.5);
  const z = scene.add.zone(0, 0, w, h).setInteractive({ useHandCursor: true });
  c.add([g, t, z]);
  c.enabled = true; c.fill = opts.fill ?? COL.tomato; c.selected = false;
  const draw = hover => {
    g.clear();
    const f = c.enabled ? c.fill : 0x9a978a;
    g.fillStyle(0x000000, 0.22).fillRoundedRect(-w / 2, -h / 2 + 4, w, h, 14);
    g.fillStyle(f, 1).fillRoundedRect(-w / 2, -h / 2, w, h, 14);
    g.lineStyle(3, COL.ink, 0.9).strokeRoundedRect(-w / 2, -h / 2, w, h, 14);
    if (hover && c.enabled) g.fillStyle(0xffffff, 0.14).fillRoundedRect(-w / 2, -h / 2, w, h, 14);
    if (c.selected) g.lineStyle(5, COL.pasta, 1).strokeRoundedRect(-w / 2 - 3, -h / 2 - 3, w + 6, h + 6, 16);
  };
  draw(false);
  z.on('pointerover', () => draw(true));
  z.on('pointerout', () => draw(false));
  z.on('pointerdown', () => { if (c.enabled) { sfx('click'); cb(); } });
  c.zone = z; c.label = t;
  c.setEnabled = v => { if (c.enabled !== v) { c.enabled = v; draw(false); t.setAlpha(v ? 1 : 0.75); } return c; };
  c.setSelected = v => { if (c.selected !== v) { c.selected = v; draw(false); } return c; };
  c.setLabel = s => { t.setText(s); return c; };
  c.setFill = f => { if (c.fill !== f) { c.fill = f; draw(false); } return c; };
  return c;
}

// ---------- textures ----------
function tex(scene, key, make) { if (!scene.textures.exists(key)) scene.textures.addCanvas(key, make()); return key; }
function personKey(scene, id, look, pose, mood) { return tex(scene, `p_${id}_${pose}_${mood}`, () => personCanvas(look, pose, mood)); }
function addPerson(scene, id, look, x, y, s, pose = 'stand', mood = 'happy') {
  const img = scene.add.image(x, y, personKey(scene, id, look, pose, mood)).setOrigin(0.5, PERSON_FEET / PERSON_H).setScale(s / ART_SCALE);
  img.pid = id; img.look = look;
  img.setLook = (pose2, mood2) => { const k = personKey(scene, id, look, pose2, mood2); if (img.texture.key !== k) img.setTexture(k); return img; };
  return img;
}
function roomImage(scene, key, make, x, y) { return scene.add.image(x, y, tex(scene, key, make)).setOrigin(0, 0).setScale(1 / 1.5); }

// The dining room is shared by the game and the Rearrange screen. Layers, back to front:
// room, wall decor, back floor decor, back-row chairs/customers/tables, [chef + counter], standing customers,
// front floor decor, front-row chairs/customers/tables.
function seatsOf(tables) { const out = []; tables.forEach((t, ti) => { out.push({ x: t.x - 37, row: t.row, table: ti }, { x: t.x + 38, row: t.row, table: ti }); }); return out; }
function decorImage(scene, rec) {
  const def = DECOR.find(q => q.id === rec.id), [w, h] = DECOR_SIZE[rec.id];
  const img = scene.add.image(rec.x, rec.y, tex(scene, 'decor_' + rec.id, () => decorCanvas(rec.id))).setScale(1 / 1.5);
  img.setOrigin(0.5, def.kind === 'wall' ? 0.5 : (h - 4) / h);
  img.rec = rec; img.def = def;
  return img;
}
function buildRoom(scene, c) {
  const R = { decor: [], tables: [] };
  const r = SAVE.room;
  const menuKey = unlockedAt(SHAPES, SAVE.day || 1).map(q => q.id).concat(unlockedAt(SAUCES, SAVE.day || 1).map(q => q.id)).join('-');
  const rv = SAVE.renov || 0;
  c.add(roomImage(scene, `room_${r.wall}_${r.floor}_${menuKey}_r${rv}`, () => restaurantCanvas(r, rv), 0, TOP));
  for (const k of ['wall', 'backFloor', 'chairs0', 'seat0', 'tables0']) { R[k] = scene.add.container(0, 0); c.add(R[k]); }
  R.plates0 = scene.add.graphics(); c.add(R.plates0);
  R.mid = scene.add.container(0, 0); c.add(R.mid);
  for (const k of ['stand', 'frontFloor', 'chairs1', 'seat1', 'tables1']) { R[k] = scene.add.container(0, 0); c.add(R[k]); }
  R.plates1 = scene.add.graphics(); c.add(R.plates1);
  for (const rec of SAVE.decor) if (rec.placed !== false) { const img = decorImage(scene, rec); R.decor.push(img); layerDecor(R, img); }
  SAVE.tables.forEach((t, i) => R.tables.push(tableImages(scene, R, t, i)));
  return R;
}
function layerDecor(R, img) {
  if (img.parentContainer) img.parentContainer.remove(img);
  (img.def.kind === 'wall' ? R.wall : img.y > FLOOR + 6 ? R.frontFloor : R.backFloor).add(img);
}
function tableImages(scene, R, t, i) {
  const cl = ROOM_STYLES.cloth.find(q => q.id === SAVE.room.cloth) || ROOM_STYLES.cloth[0];
  const cush = !!SAVE.upgrades.cushions;
  const T = { rec: t, i };
  T.chairs = [-37, 38].map(dx => scene.add.image(0, 0, tex(scene, cush ? 'chair_c' : 'chair', () => chairCanvas(cush))).setOrigin(0.5, 0).setScale(1 / 1.5));
  T.table = scene.add.image(0, 0, tex(scene, 'table_' + cl.id, () => tableCanvas(172, cl.c))).setOrigin(0.5, 0).setScale(1 / 1.5);
  T.place = () => {
    const row = TABLE_ROWS[t.row];
    T.chairs.forEach((ch, k) => { ch.setPosition(t.x + (k ? 38 : -37), row.seat - 132); if (ch.parentContainer) ch.parentContainer.remove(ch); R['chairs' + t.row].add(ch); });
    T.table.setPosition(t.x, row.top); if (T.table.parentContainer) T.table.parentContainer.remove(T.table); R['tables' + t.row].add(T.table);
  };
  T.place();
  return T;
}

// ---------- food drawing (Phaser graphics) ----------
function drawPasta(g, x, y, r, shape, seed) {
  const R = rng(seed * 7919 + 13);
  const c1 = COL.pasta, c2 = COL.pastaDark;
  if (shape === 'spaghetti') {
    for (let i = 0; i < 28; i++) {
      const cx = x + (R() - 0.5) * r * 0.9, cy = y + (R() - 0.5) * r * 0.8, rr = r * (0.18 + R() * 0.3), a0 = R() * Math.PI * 2;
      g.lineStyle(Math.max(2, r * 0.045), i % 3 ? c1 : c2, 1);
      g.beginPath(); g.arc(cx, cy, rr, a0, a0 + 2 + R() * 2.5, false); g.strokePath();
    }
  } else if (shape === 'penne') {
    for (let i = 0; i < 24; i++) {
      const cx = x + (R() - 0.5) * r * 1.0, cy = y + (R() - 0.5) * r * 0.9, a = R() * Math.PI;
      const L = r * 0.2, T = r * 0.065, ca = Math.cos(a), sa = Math.sin(a);
      const pts = [[-L, -T], [L + T, -T], [L - T, T], [-L - 2 * T, T]].map(([px, py]) => ({ x: cx + px * ca - py * sa, y: cy + px * sa + py * ca }));
      g.fillStyle(i % 3 ? c1 : c2, 1).fillPoints(pts, true);
      g.lineStyle(1.5, 0xb8862a, 0.8).strokePoints(pts, true);
    }
  } else if (shape === 'pappardelle') {
    for (let i = 0; i < 10; i++) {
      const cx = x + (R() - 0.5) * r * 0.8, cy = y + (R() - 0.5) * r * 0.7, rr = r * (0.22 + R() * 0.26), a0 = R() * Math.PI * 2, a1 = a0 + 1.6 + R() * 2;
      g.lineStyle(Math.max(8, r * 0.19), c2, 1); g.beginPath(); g.arc(cx, cy, rr, a0, a1, false); g.strokePath();
      g.lineStyle(Math.max(6, r * 0.15), i % 3 ? c1 : 0xf8d77a, 1); g.beginPath(); g.arc(cx, cy, rr, a0, a1, false); g.strokePath();
    }
  } else if (shape === 'pici' || shape === 'bucatini') {
    for (let i = 0; i < 18; i++) {
      const cx = x + (R() - 0.5) * r * 0.85, cy = y + (R() - 0.5) * r * 0.75, rr = r * (0.2 + R() * 0.3), a0 = R() * Math.PI * 2, a1 = a0 + 2 + R() * 2.4;
      g.lineStyle(Math.max(3.5, r * 0.085), c2, 1); g.beginPath(); g.arc(cx, cy, rr, a0, a1, false); g.strokePath();
      g.lineStyle(Math.max(2.5, r * 0.06), i % 3 ? c1 : 0xf8d77a, 1); g.beginPath(); g.arc(cx, cy, rr, a0, a1, false); g.strokePath();
      if (shape === 'bucatini') { g.lineStyle(Math.max(1, r * 0.016), 0xb8862a, 1); g.beginPath(); g.arc(cx, cy, rr, a0, a1, false); g.strokePath(); }
    }
  } else if (shape === 'tortellini') {
    for (let i = 0; i < 11; i++) {
      const cx = x + (R() - 0.5) * r * 1.0, cy = y + (R() - 0.5) * r * 0.9, rr = r * 0.11, a0 = R() * Math.PI * 2;
      g.lineStyle(Math.max(4, r * 0.1), c2, 1); g.beginPath(); g.arc(cx, cy, rr, a0, a0 + 5.2, false); g.strokePath();
      g.lineStyle(Math.max(3, r * 0.075), c1, 1); g.beginPath(); g.arc(cx, cy, rr, a0, a0 + 5.2, false); g.strokePath();
      g.fillStyle(c1, 1).fillCircle(cx + Math.cos(a0) * rr * 1.25, cy + Math.sin(a0) * rr * 1.25, r * 0.055);
      g.lineStyle(1, c2, 1).strokeCircle(cx + Math.cos(a0) * rr * 1.25, cy + Math.sin(a0) * rr * 1.25, r * 0.055);
    }
  } else if (shape === 'busiate') {
    // little corkscrews, twisted around a knitting needle
    for (let i = 0; i < 11; i++) {
      const cx = x + (R() - 0.5) * r * 0.95, cy = y + (R() - 0.5) * r * 0.85, a = R() * Math.PI, ca = Math.cos(a), sa = Math.sin(a), cr = r * 0.055;
      for (const [w, col] of [[Math.max(4, r * 0.06), c2], [Math.max(2.5, r * 0.04), i % 3 ? c1 : 0xf8d77a]]) {
        g.lineStyle(w, col, 1);
        for (let q = 0; q < 5; q++) { const t = (q - 2) * cr * 1.3; g.strokeCircle(cx + t * ca, cy + t * sa, cr); }
      }
    }
  } else if (shape === 'trofie') {
    const n = 20;
    for (let i = 0; i < n; i++) {
      const cx = x + (R() - 0.5) * r * 1.0, cy = y + (R() - 0.5) * r * 0.9, a = R() * Math.PI, ca = Math.cos(a), sa = Math.sin(a);
      const L = r * 0.13, T = Math.max(3, r * 0.06);
      g.lineStyle(T + 2, c2, 1).lineBetween(cx - L * ca, cy - L * sa, cx + L * ca, cy + L * sa);
      g.lineStyle(T, i % 3 ? c1 : 0xf8d77a, 1).lineBetween(cx - L * ca, cy - L * sa, cx + L * ca, cy + L * sa);
      const k = 3;
      g.lineStyle(Math.max(1, r * 0.014), c2, 1);
      for (let q = 0; q < k; q++) { const t = -1 + (q + 0.5) * 2 / k, px = cx + t * L * ca, py = cy + t * L * sa; g.lineBetween(px - T * 0.5 * sa - T * 0.4 * ca, py + T * 0.5 * ca - T * 0.4 * sa, px + T * 0.5 * sa + T * 0.4 * ca, py - T * 0.5 * ca + T * 0.4 * sa); }
    }
  } else if (shape === 'paccheri') {
    for (let i = 0; i < 12; i++) {
      const cx = x + (R() - 0.5) * r * 0.95, cy = y + (R() - 0.5) * r * 0.85, rr = r * 0.15;
      g.fillStyle(i % 3 ? c1 : 0xf8d77a, 1).fillEllipse(cx, cy, rr * 2, rr * 1.7);
      g.lineStyle(Math.max(1.5, r * 0.022), c2, 1).strokeEllipse(cx, cy, rr * 2, rr * 1.7);
      g.fillStyle(c2, 0.9).fillEllipse(cx, cy, rr * 1.2, rr * 0.95);
    }
  } else if (shape === 'gnocchi') {
    for (let i = 0; i < 16; i++) {
      const cx = x + (R() - 0.5) * r * 1.0, cy = y + (R() - 0.5) * r * 0.9, rw = r * 0.13, rh = r * 0.095;
      g.fillStyle(i % 3 ? 0xf6deb0 : 0xeccb8c, 1).fillEllipse(cx, cy, rw * 2, rh * 2);
      g.lineStyle(Math.max(1.2, r * 0.018), 0xb8862a, 1).strokeEllipse(cx, cy, rw * 2, rh * 2);
      for (let q = -1; q <= 1; q++) g.lineBetween(cx + q * rw * 0.45, cy - rh * 0.6, cx + q * rw * 0.45, cy + rh * 0.6);
    }
  } else if (shape === 'fettuccine' || shape === 'tagliatelle') {
    for (let i = 0; i < 15; i++) {
      const cx = x + (R() - 0.5) * r * 0.85, cy = y + (R() - 0.5) * r * 0.75, rr = r * (0.2 + R() * 0.28), a0 = R() * Math.PI * 2, a1 = a0 + 1.8 + R() * 2.2;
      g.lineStyle(Math.max(5, r * 0.12), c2, 1); g.beginPath(); g.arc(cx, cy, rr, a0, a1, false); g.strokePath();
      g.lineStyle(Math.max(3.5, r * 0.085), i % 3 ? c1 : 0xf8d77a, 1); g.beginPath(); g.arc(cx, cy, rr, a0, a1, false); g.strokePath();
    }
  } else if (shape === 'ravioli') {
    const pos = [[-0.34, -0.3], [0.08, -0.38], [0.4, -0.08], [-0.42, 0.1], [-0.02, 0.04], [0.32, 0.34], [-0.16, 0.42]];
    for (const [px, py] of pos) {
      const cx = x + px * r + (R() - 0.5) * r * 0.06, cy = y + py * r + (R() - 0.5) * r * 0.06, sz = r * 0.2;
      g.fillStyle(c1, 1).fillRoundedRect(cx - sz, cy - sz, sz * 2, sz * 2, sz * 0.3);
      g.lineStyle(Math.max(1.5, r * 0.025), c2, 1).strokeRoundedRect(cx - sz, cy - sz, sz * 2, sz * 2, sz * 0.3);
      g.fillStyle(0xfbe3a0, 1).fillCircle(cx, cy, sz * 0.58);
      g.fillStyle(c2, 1);
      for (let k = 0; k < 4; k++) { g.fillCircle(cx - sz * 0.75 + k * sz * 0.5, cy - sz * 0.86, Math.max(1, r * 0.014)); g.fillCircle(cx - sz * 0.75 + k * sz * 0.5, cy + sz * 0.86, Math.max(1, r * 0.014)); }
    }
  } else {
    for (let i = 0; i < 17; i++) {
      const cx = x + (R() - 0.5) * r * 1.0, cy = y + (R() - 0.5) * r * 0.9, sz = r * 0.12;
      g.fillStyle(i % 3 ? c1 : c2, 1);
      g.fillTriangle(cx, cy, cx - sz * 1.4, cy - sz, cx - sz * 1.4, cy + sz);
      g.fillTriangle(cx, cy, cx + sz * 1.4, cy - sz, cx + sz * 1.4, cy + sz);
      g.fillStyle(c2, 1).fillCircle(cx, cy, sz * 0.35);
    }
  }
}
function drawTopping(g, x, y, id, s, a = 1) {
  const t = TOPPINGS.find(q => q.id === id);
  if (id === 'parm') {
    // a little mound of shaved cheese
    g.fillStyle(t.color, a).fillEllipse(x, y + 2 * s, 30 * s, 16 * s);
    g.lineStyle(1.6 * s, t.edge, a).strokeEllipse(x, y + 2 * s, 30 * s, 16 * s);
    const sh = [[-9, -2, 0.4], [2, -5, -0.3], [9, 1, 0.5], [-3, 4, -0.6], [-11, 5, 0.1], [7, 6, -0.2]];
    for (const [dx, dy, rot] of sh) {
      const cx = x + dx * s, cy = y + dy * s, L = 6 * s, ca = Math.cos(rot), sa = Math.sin(rot);
      g.lineStyle(3.2 * s, t.edge, a).lineBetween(cx - L * ca, cy - L * sa, cx + L * ca, cy + L * sa);
      g.lineStyle(1.8 * s, 0xfffbe0, a).lineBetween(cx - L * ca, cy - L * sa, cx + L * ca, cy + L * sa);
    }
  }
  else if (id === 'basil') { g.fillStyle(t.color, a).fillEllipse(x, y, 28 * s, 15 * s); g.lineStyle(2 * s, t.edge, a).strokeEllipse(x, y, 28 * s, 15 * s); g.lineBetween(x - 12 * s, y, x + 12 * s, y); }
  else if (id === 'meatball') { g.fillStyle(t.color, a).fillCircle(x, y, 15 * s); g.lineStyle(2 * s, t.edge, a).strokeCircle(x, y, 15 * s); g.fillStyle(0xffffff, 0.22 * a).fillCircle(x - 5 * s, y - 5 * s, 5 * s); }
  else if (id === 'mushroom') { g.fillStyle(0xeedfc4, a).fillRect(x - 4 * s, y, 8 * s, 10 * s); g.fillStyle(t.color, a).fillEllipse(x, y - 2 * s, 28 * s, 17 * s); g.lineStyle(2 * s, t.edge, a).strokeEllipse(x, y - 2 * s, 28 * s, 17 * s); }
  else if (id === 'pancetta' || id === 'guanciale') {
    for (const [dx, dy] of [[-7, -4], [6, -6], [0, 6]]) {
      const cx = x + dx * s, cy = y + dy * s, z = 6.5 * s;
      g.fillStyle(t.color, a).fillRect(cx - z, cy - z, z * 2, z * 2);
      if (id === 'guanciale') g.fillStyle(0xfff3ea, a).fillRect(cx - z, cy - z * 0.55, z * 2, z * 1.1);
      else g.fillStyle(0xfff3ea, a).fillRect(cx - z, cy - z * 0.25, z * 2, z * 0.55);
      g.lineStyle(1.6 * s, t.edge, a).strokeRect(cx - z, cy - z, z * 2, z * 2);
    }
  }
  else if (id === 'prosciutto') {
    for (const [dx, dy] of [[-4, -5], [4, 5]]) {
      const pts = []; for (let q = 0; q <= 8; q++) pts.push({ x: x + dx * s + (q - 4) * 3.4 * s, y: y + dy * s + Math.sin(q * 1.3) * 3 * s });
      g.lineStyle(8 * s, t.edge, a).strokePoints(pts); g.lineStyle(6 * s, t.color, a).strokePoints(pts);
      g.lineStyle(1.6 * s, 0xfff3ea, a).strokePoints(pts.map(p => ({ x: p.x, y: p.y - 2 * s })));
    }
  }
  else if (id === 'greenbeans') {
    for (const [dx, dy, ang] of [[-3, -5, 0.3], [4, 1, -0.4], [-2, 7, 0.1]]) {
      const cx = x + dx * s, cy = y + dy * s, L = 12 * s, ca = Math.cos(ang), sa = Math.sin(ang);
      g.lineStyle(7 * s, t.edge, a).lineBetween(cx - L * ca, cy - L * sa, cx + L * ca, cy + L * sa);
      g.lineStyle(5 * s, t.color, a).lineBetween(cx - L * ca, cy - L * sa, cx + L * ca, cy + L * sa);
      g.fillStyle(t.edge, a).fillCircle(cx - L * ca, cy - L * sa, 2.6 * s).fillCircle(cx + L * ca, cy + L * sa, 2.6 * s);
    }
  }
  else if (id === 'mozzarella') {
    for (const [dx, dy] of [[-5, -2], [6, 3]]) {
      g.fillStyle(t.color, a).fillCircle(x + dx * s, y + dy * s, 10 * s);
      g.lineStyle(1.8 * s, t.edge, a).strokeCircle(x + dx * s, y + dy * s, 10 * s);
      g.fillStyle(0xffffff, 0.8 * a).fillCircle(x + dx * s - 3 * s, y + dy * s - 3 * s, 3 * s);
    }
  }
  else if (id === 'ricotta') {
    for (const [dx, dy, rr] of [[-7, -3, 5], [2, -6, 4], [7, 2, 5], [-2, 5, 4.5], [-9, 6, 3], [9, -6, 3]]) {
      g.fillStyle(t.color, a).fillCircle(x + dx * s, y + dy * s, rr * s);
      g.lineStyle(1.2 * s, t.edge, a).strokeCircle(x + dx * s, y + dy * s, rr * s);
    }
  }
  else { g.fillStyle(t.color, a); for (let i = 0; i < 7; i++) g.fillCircle(x + Math.cos(i * 2.4) * 10 * s, y + Math.sin(i * 2.4) * 8 * s, 2.8 * s); }
}
function drawBin(g, x, y, id) {
  g.fillStyle(0x000000, 0.2).fillRoundedRect(x - 50, y - 26, 104, 66, 10);
  g.fillStyle(COL.steelDark, 1).fillRoundedRect(x - 54, y - 32, 108, 66, 10);
  g.lineStyle(3, COL.ink, 1).strokeRoundedRect(x - 54, y - 32, 108, 66, 10);
  g.fillStyle(0x4a5056, 1).fillRoundedRect(x - 46, y - 26, 92, 34, 6);
  const R = rng(id.length * 31 + 7);
  for (let i = 0; i < 9; i++) drawTopping(g, x - 34 + R() * 68, y - 18 + R() * 20, id, 0.62);
  g.fillStyle(COL.steel, 1).fillRoundedRect(x - 54, y + 6, 108, 28, { tl: 0, tr: 0, bl: 10, br: 10 });
  g.lineStyle(3, COL.ink, 1).strokeRoundedRect(x - 54, y + 6, 108, 28, { tl: 0, tr: 0, bl: 10, br: 10 });
}
function drawPlate(g, x, y, r, dish, opts = {}) {
  g.fillStyle(0x000000, 0.16).fillEllipse(x + r * 0.04, y + r * 0.08, r * 2.1, r * 2.04);
  g.fillStyle(0xffffff, 1).fillCircle(x, y, r);
  g.lineStyle(Math.max(1.5, r * 0.02), COL.ink, 0.8).strokeCircle(x, y, r);
  g.lineStyle(Math.max(1, r * 0.018), 0xd8d2c4, 1).strokeCircle(x, y, r * 0.8);
  g.lineStyle(Math.max(1, r * 0.012), 0x2f6d8f, 0.5).strokeCircle(x, y, r * 0.93);
  if (!dish) return;
  if (dish.cutShape && (opts.force || ['sauce', 'toppings', 'ready', 'served'].includes(dish.stage))) drawPasta(g, x, y, r * 0.72, dish.cutShape, dish.id);
  if (dish.sauceId && dish.sauceBlobs.length) {
    const s = SAUCES.find(q => q.id === dish.sauceId);
    g.fillStyle(s.color, 0.9);
    for (const b of dish.sauceBlobs) g.fillCircle(x + b.dx * r, y + b.dy * r, b.r * r);
    g.fillStyle(0xffffff, 0.16);
    for (const b of dish.sauceBlobs.slice(0, 30)) g.fillCircle(x + b.dx * r - b.r * r * 0.3, y + b.dy * r - b.r * r * 0.3, b.r * r * 0.25);
    if (s.speck) { g.fillStyle(s.speck, 0.85); for (const b of dish.sauceBlobs.slice(0, 70)) g.fillCircle(x + (b.dx + b.r * 0.35) * r, y + (b.dy - b.r * 0.25) * r, Math.max(1.2, r * 0.014)); }
  }
  for (const p of dish.placed || []) drawTopping(g, x + p.dx * r, y + p.dy * r, p.id, r / 165);
  if (dish.bread && (opts.force || ['ready', 'served'].includes(dish.stage))) drawBread(g, x + r * 0.92, y + r * 0.5, r / 150, dish.bread.tone);
}
function spotsFor(t) {
  const n = t.n, out = [];
  if (t.pattern === 'center') { if (n === 1) out.push([0, 0]); else for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + 0.5; out.push([Math.cos(a) * 0.15, Math.sin(a) * 0.15]); } }
  else if (t.pattern === 'ring') for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + i / n * Math.PI * 2 + 0.3; out.push([Math.cos(a) * 0.6, Math.sin(a) * 0.6]); }
  else if (t.pattern === 'inner') for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + i / n * Math.PI * 2 + 1.0; out.push([Math.cos(a) * 0.36, Math.sin(a) * 0.36]); }
  else { const S = [[-0.42, -0.18], [0.34, -0.36], [0.44, 0.2], [-0.2, 0.44], [0.06, -0.5], [-0.5, 0.22], [0.2, 0.08]]; for (let i = 0; i < n; i++) out.push(S[i % S.length]); }
  return out;
}
function drawMiniPlate(g, x, y, R, order) {
  g.fillStyle(0xffffff, 1).fillCircle(x, y, R);
  g.lineStyle(2, COL.ink, 0.8).strokeCircle(x, y, R);
  const sc = SAUCES.find(s => s.id === order.sauce);
  g.fillStyle(COL.pasta, 1).fillCircle(x, y, R * 0.72);
  g.fillStyle(sc.color, 0.85).fillCircle(x, y, R * 0.5);
  for (const t of order.toppings) for (const [dx, dy] of spotsFor(t)) {
    if (R < 40) { const tp = TOPPINGS.find(q => q.id === t.id); g.fillStyle(tp.color, 1).fillCircle(x + dx * R, y + dy * R, Math.max(2.6, R * 0.13)); g.lineStyle(1.2, tp.edge, 1).strokeCircle(x + dx * R, y + dy * R, Math.max(2.6, R * 0.13)); }
    else drawTopping(g, x + dx * R, y + dy * R, t.id, R / 105);
  }
}
function drawStar(g, x, y, r, on) {
  const pts = [];
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; pts.push({ x: x + Math.cos(a) * rr, y: y + Math.sin(a) * rr }); }
  g.fillStyle(on ? COL.gold : 0xd9cfb3, 1).fillPoints(pts, true);
  g.lineStyle(2.5, COL.ink, on ? 1 : 0.35).strokePoints(pts, true);
}
// a little gold coin with Nonna's star stamped on it
function coinIcon(scene, x, y, r) {
  const g = scene.add.graphics();
  g.fillStyle(0xb8862a, 1).fillCircle(0, 1.5, r);
  g.fillStyle(COL.gold, 1).fillCircle(0, 0, r);
  g.lineStyle(Math.max(1.5, r * 0.22), COL.ink, 1).strokeCircle(0, 0, r);
  const pts = [];
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = (i % 2 ? 0.22 : 0.52) * r; pts.push({ x: Math.cos(a) * rr, y: Math.sin(a) * rr }); }
  g.fillStyle(0xfff1b8, 1).fillPoints(pts, true);
  return g.setPosition(x, y);
}
function drawHeart(g, x, y, r, on) {
  g.fillStyle(on ? 0xe8434f : 0xd9cfb3, 1);
  g.fillCircle(x - r * 0.5, y - r * 0.2, r * 0.55).fillCircle(x + r * 0.5, y - r * 0.2, r * 0.55);
  g.fillTriangle(x - r * 1.03, y - r * 0.05, x + r * 1.03, y - r * 0.05, x, y + r * 0.95);
}
function orderLines(order) {
  const sh = SHAPES.find(s => s.id === order.shape).name, sa = SAUCES.find(s => s.id === order.sauce).name;
  return [sh, sa, ...order.toppings.map(t => `${TOPPINGS.find(q => q.id === t.id).name} x${t.n}, ${PATTERN_LABEL[t.pattern]}`), ...(order.bread ? ['+ Garlic bread'] : [])];
}
const PLURAL = { meatball: 'meatballs', mushroom: 'mushrooms', basil: 'basil leaves', greenbeans: 'green beans', mozzarella: 'mozzarella slices' };
function orderSentence(order, def) {
  const same = def.order && order.shape === def.order.shape && order.sauce === def.order.sauce && JSON.stringify(order.toppings) === JSON.stringify(def.order.toppings);
  if (same && def.lines.order && !order.dotd) return def.lines.order;
  const sh = SHAPES.find(q => q.id === order.shape).name.toLowerCase(), sa = SAUCES.find(q => q.id === order.sauce).name;
  const tops = order.toppings.map(t => `${t.n > 1 && PLURAL[t.id] ? t.n + ' ' + PLURAL[t.id] : TOPPINGS.find(q => q.id === t.id).name.toLowerCase()} ${PATTERN_LABEL[t.pattern]}`);
  const open = order.dotd ? "I'll have Nonna's dish of the day,"
    : ['Could I get', 'I would love', 'I want to try the', 'One plate of'][(order.shape.length + order.sauce.length + order.toppings.length) % 4];
  return `${open} ${sh} with ${sa}${tops.length ? ', ' + tops.join(' and ') : ''}, please.`;
}
// Nonna's dish of the day: picked each morning, favoring whatever was just added to the menu.
const DOTD_GOAL = day => day < 3 ? 1 : day < 8 ? 2 : 3;
// Classic regional pairings, so new dishes usually arrive the way Italians eat them.
const CLASSIC = { pici: 'aglione', tagliatelle: 'ragu', tortellini: 'alfredo', trofie: 'pesto', bucatini: 'amatriciana', fettuccine: 'alfredo', paccheri: 'marinara', gnocchi: 'marinara', busiate: 'trapanese',
  aglione: 'pici', ragu: 'tagliatelle', noci: 'trofie', amatriciana: 'bucatini', carbonara: 'spaghetti', puttanesca: 'spaghetti', norma: 'spaghetti', trapanese: 'busiate' };
const classicFor = (id, list) => { const c = CLASSIC[id]; return c && list.some(q => q.id === c) ? c : null; };
// A saved dish of the day can go stale when the menu moves on to a new chapter.
const needDotd = day => day >= 2 && (!SAVE.dotd || SAVE.dotd.day !== day || !unlockedAt(SHAPES, day).some(q => q.id === SAVE.dotd.shape) || !unlockedAt(SAUCES, day).some(q => q.id === SAVE.dotd.sauce));
function pickDotd(day) {
  const R = rng(day * 4721 + 9), pick = a => a[Math.floor(R() * a.length)];
  const sh = unlockedAt(SHAPES, day), sa = unlockedAt(SAUCES, day);
  const fresh = list => list.filter(x => (x.unlock || 1) > 1 && day - x.unlock <= 2);
  const fs = fresh(sh), fsa = fresh(sa);
  const shape = (fs.length && R() < 0.75 ? pick(fs) : pick(sh)).id;
  let sauce = (fsa.length && R() < 0.75 ? pick(fsa) : pick(sa)).id;
  let sh2 = shape;
  const cl = classicFor(shape, sa), cs = classicFor(sauce, sh);
  if (cl && R() < 0.7) sauce = cl;
  else if (cs && fsa.some(q => q.id === sauce) && !fs.some(q => q.id === shape) && R() < 0.7) sh2 = cs;
  return { day, shape: sh2, sauce };
}
const isVisitorKey = k => /^v\d+$/.test(k);
// piping bag: how fast filling flows (spoonfuls a second) and the 'just right' band
const FILL = { rate: 1.1, lo: 0.7, hi: 1.3, max: 1.8 };
const shapeName = id => (SHAPES.find(q => q.id === id) || { name: 'Ravioli' }).name;
const FILL_TIP = {
  ravioli: 'Ravioli! Hold the piping bag over each square to squeeze in the filling. Let go when the dot turns green. Too little and they taste empty, too much and they burst in the pot. Then seal them up.',
  tortellini: 'Tortellini! In Bologna they say these little rings are shaped like a belly button. Squeeze a little filling into each circle and let go when the dot turns green, then we fold and seal them. Not too much, or they pop open!',
};
// ticket rail: tickets slide closer together once more than eight are up
const railStep = n => n <= 8 ? 156 : (W - 32 - 146) / (n - 1);
const railX = (i, n) => 16 + i * railStep(n);
const isDotd = (order, day) => { const d = SAVE.dotd; return !!d && d.day === day && order.shape === d.shape && order.sauce === d.sauce; };
const dotdName = d => `${SHAPES.find(q => q.id === d.shape).name} with ${SAUCES.find(q => q.id === d.sauce).name}`;
// What a customer orders today: their favorite, sometimes swapped for something new on the menu.
function orderFor(def, R, day) {
  const pick = a => a[Math.floor(R() * a.length)];
  const sh = unlockedAt(SHAPES, day), sa = unlockedAt(SAUCES, day), tp = unlockedAt(TOPPINGS, day);
  const o = { shape: def.order.shape, sauce: def.order.sauce, toppings: def.order.toppings.map(t => ({ ...t })) };
  if (def.visitor) {
    o.shape = pick(sh).id; o.sauce = pick(sa).id;
    const cl = classicFor(o.shape, sa); if (cl && R() < 0.5) o.sauce = cl;
    const ids = tp.map(t => t.id).sort(() => R() - 0.5).slice(0, 1 + Math.floor(R() * 2));
    const pats = [['center', 1], ['ring', 3 + Math.floor(R() * 3)], ['inner', 2 + Math.floor(R() * 2)]];
    o.toppings = ids.map((id, i) => ({ id, n: pats[i][1], pattern: pats[i][0] }));
  } else {
    // regulars try the chapter's new dishes, usually in their classic pairing
    const newSh = sh.filter(x => x.ch !== 'base'), newSa = sa.filter(x => x.ch !== 'base'), newTp = tp.filter(x => x.ch !== 'base');
    if (newSh.length && R() < 0.3) { o.shape = pick(newSh).id; const cl = classicFor(o.shape, sa); if (cl && R() < 0.6) o.sauce = cl; }
    if (newSa.length && R() < 0.3) { o.sauce = pick(newSa).id; const cl = classicFor(o.sauce, sh); if (cl && R() < 0.6) o.shape = cl; }
    const ct = newTp.length ? pick(newTp).id : null;
    if (ct && R() < 0.25 && !o.toppings.some(t => t.id === ct)) {
      const swap = o.toppings.find(t => t.pattern !== 'center');
      if (swap) swap.id = ct; else o.toppings.push({ id: ct, n: 3, pattern: 'inner' });
    }
  }
  const d = SAVE.dotd;
  if (d && d.day === day && R() < 0.3) { o.shape = d.shape; o.sauce = d.sauce; }
  if (isDotd(o, day)) o.dotd = true;
  const seen = new Set(); o.toppings = o.toppings.filter(t => !seen.has(t.id) && seen.add(t.id));
  return o;
}
const stMatch = (st, d) => st.match ? st.match(d) : st.stages.includes(d.stage);
const breadColor = tone => {
  const stops = [[0, [243, 223, 174]], [0.5, [233, 178, 88]], [0.75, [214, 140, 52]], [1.1, [140, 80, 32]], [1.5, [52, 34, 22]]];
  let i = 0; while (i < stops.length - 2 && tone > stops[i + 1][0]) i++;
  const [t0, c0] = stops[i], [t1, c1] = stops[i + 1], k = clamp((tone - t0) / (t1 - t0), 0, 1);
  return Phaser.Display.Color.GetColor(...c0.map((v, j) => Math.round(v + (c1[j] - v) * k)));
};
// oven seconds to a toast tone: pale until ready, golden through the window, then burning
const breadTone = t => t < BREAD.ready ? t / BREAD.ready * 0.6 : t <= BREAD.done ? 0.6 + (t - BREAD.ready) / (BREAD.done - BREAD.ready) * 0.3 : Math.min(1.5, 0.9 + (t - BREAD.done) / (BREAD.max - BREAD.done) * 0.6);
function drawBread(g, x, y, s, tone) {
  // a toasted slice of garlic bread; tone 0 = raw, 0.75 = golden, 1.5 = burnt
  g.fillStyle(0x000000, 0.15).fillEllipse(x + 3 * s, y + 18 * s, 70 * s, 16 * s);
  g.fillStyle(0xa8683a, 1).fillRoundedRect(x - 36 * s, y - 22 * s, 72 * s, 42 * s, 18 * s);
  g.lineStyle(Math.max(1.5, 3 * s), COL.ink, 1).strokeRoundedRect(x - 36 * s, y - 22 * s, 72 * s, 42 * s, 18 * s);
  g.fillStyle(breadColor(tone), 1).fillRoundedRect(x - 30 * s, y - 17 * s, 60 * s, 32 * s, 14 * s);
  if (tone < 1.3) { g.fillStyle(0x3f8f3a, 1); for (let i = 0; i < 7; i++) g.fillCircle(x - 20 * s + (i * 37 % 40) * s, y - 8 * s + (i * 23 % 18) * s, 2 * s); }
  g.fillStyle(0xffffff, 0.22).fillRoundedRect(x - 24 * s, y - 13 * s, 30 * s, 6 * s, 3 * s);
}

function makeBubble(scene, parent) {
  const c = scene.add.container(0, 0).setVisible(false);
  const g = scene.add.graphics();
  const t = scene.add.text(0, 0, '', { fontFamily: FB, fontSize: '17px', fontStyle: '800', color: '#2b1a10', wordWrap: { width: 270 }, lineSpacing: 3 });
  c.add([g, t]);
  if (parent) parent.add(c);
  c.say = (text, x, bottomY, tailX) => {
    t.setText(text);
    const w = t.width + 28, h = t.height + 20;
    const left = clamp(x - w / 2, 330, W - w - 8);
    g.clear();
    g.fillStyle(0x000000, 0.18).fillRoundedRect(left + 3, bottomY - h + 4, w, h, 14);
    g.fillStyle(0xffffff, 1).fillRoundedRect(left, bottomY - h, w, h, 14);
    g.lineStyle(3, COL.ink, 1).strokeRoundedRect(left, bottomY - h, w, h, 14);
    const tx = clamp(tailX ?? x, left + 20, left + w - 20);
    g.fillStyle(0xffffff, 1).fillTriangle(tx - 10, bottomY - 2, tx + 10, bottomY - 2, tx, bottomY + 14);
    g.lineStyle(3, COL.ink, 1).lineBetween(tx - 10, bottomY, tx, bottomY + 14).lineBetween(tx + 10, bottomY, tx, bottomY + 14);
    t.setPosition(left + 14, bottomY - h + 10);
    c.setVisible(true).setAlpha(1);
    return c;
  };
  return c;
}

function preloadFonts() {
  return Promise.race([
    Promise.all(['800 24px "Baloo 2"', '600 24px "Baloo 2"', '700 18px Nunito', '800 18px Nunito', '20px "Patrick Hand"'].map(f => document.fonts.load(f))),
    new Promise(r => setTimeout(r, 3000)),
  ]).catch(() => {});
}

// ================= Title =================
class TitleScene extends Phaser.Scene {
  constructor() { super('title'); }
  preload() { if (!this.textures.exists('logo')) this.load.image('logo', window.NOODLE_LOGO); }
  create() {
    if (window.NR_READY) window.NR_READY();
    this.menu = null;
    this.cameras.main.setBackgroundColor(COL.basil);
    const g = this.add.graphics();
    g.fillStyle(0xffffff, 0.035);
    for (let i = 0; i < 46; i++) g.fillCircle((i * 197) % W, (i * 131) % H, 3 + (i % 5));
    const logo = this.add.image(W / 2, 200, 'logo');
    logo.setScale(Math.min(640 / logo.width, 350 / logo.height));
    const chef = CHEFS.find(c => c.id === SAVE.chef);
    addPerson(this, 'nonna', NONNA_LOOK, 210, 690, 1.15);
    if (chef) {
      const look = chefLook(chef.id);
      addPerson(this, lookId(chef.id, look), look, 1070, 690, 1.15);
      this.add.text(1070, 420, `${chef.first} ${chef.last}`, { fontFamily: FD, fontSize: '24px', fontStyle: '800', color: '#f6c453' }).setOrigin(0.5);
    }
    const day = SAVE.day || 1;
    makeButton(this, W / 2, 452, 340, 64, chef ? `Continue · Day ${day}` : 'Start playing', () => this.scene.start(!chef ? 'chef' : wantsStory() ? 'story' : day <= 1 ? 'game' : 'morning'), { size: 28 });
    if (chef) {
      makeButton(this, W / 2, 532, 240, 50, 'Change chef', () => this.scene.start('chef'), { fill: COL.basilMid, size: 22 });
      const sv = this.add.text(W / 2 + 12, 592, `Savings ${money(SAVE.bank || 0)}`, { fontFamily: FB, fontSize: '19px', fontStyle: '800', color: '#cfe3c9' }).setOrigin(0.5);
      coinIcon(this, sv.x - sv.width / 2 - 14, 592, 9);
    }
    else this.add.text(W / 2, 372, 'Cook pasta with Nonna and grow her little shop', { fontFamily: FH, fontSize: '30px', color: '#fbf3e0' }).setOrigin(0.5);
    this.add.text(W / 2, H - 22, 'Free to play  ·  No sign-up  ·  Your progress saves on this device', { fontFamily: FB, fontSize: '18px', fontStyle: '700', color: '#8fb894' }).setOrigin(0.5);
    // the small menu, top right: story, sound, feedback, start over
    const mb = this.add.container(W - 44, 40);
    const mg = this.add.graphics();
    mg.fillStyle(0x000000, 0.22).fillRoundedRect(-26, -22, 52, 48, 12).fillStyle(COL.basilMid, 1).fillRoundedRect(-26, -24, 52, 48, 12);
    mg.lineStyle(3, COL.ink, 0.9).strokeRoundedRect(-26, -24, 52, 48, 12).fillStyle(0xfbf3e0, 1);
    for (const y of [-11, 0, 11]) mg.fillRoundedRect(-13, y - 2.5, 26, 5, 2.5);
    mb.add([mg, this.add.zone(0, 0, 60, 56).setInteractive({ useHandCursor: true }).on('pointerdown', () => { sfx('click'); this.openMenu(); })]);
  }
  openMenu() {
    if (this.menu) return;
    const c = this.add.container(0, 0).setDepth(50); this.menu = c;
    const close = () => { c.destroy(); this.menu = null; };
    c.add(this.add.rectangle(0, 0, W, H, 0x000000, 0.55).setOrigin(0).setInteractive().on('pointerdown', close));
    const rows = [];
    if (SAVE.chef) rows.push(['Watch the story', () => { this.registry.set('storyReplay', true); this.scene.start('story'); }]);
    rows.push([SAVE.muted ? 'Sound: off' : 'Sound: on', b => { SAVE.muted = !SAVE.muted; writeSave(); b.setLabel(SAVE.muted ? 'Sound: off' : 'Sound: on'); }]);
    rows.push(['Send feedback', () => { close(); if (window.openFeedback) window.openFeedback(); }]);
    let armed = false;
    if (SAVE.chef) rows.push(['Start over', b => {
      if (!armed) { armed = true; b.setLabel('Tap again to erase it all').setFill(COL.tomato); return; }
      SAVE = freshSave(); writeSave(); this.scene.restart();
    }, 0x8a6a4a]);
    const pw = 400, ph = 150 + rows.length * 66, x0 = (W - pw) / 2, y0 = (H - ph) / 2;
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.3).fillRoundedRect(x0 + 5, y0 + 7, pw, ph, 22).fillStyle(0xfff6dc, 1).fillRoundedRect(x0, y0, pw, ph, 22).lineStyle(4, COL.ink, 1).strokeRoundedRect(x0, y0, pw, ph, 22);
    c.add([g, this.add.zone(x0, y0, pw, ph).setOrigin(0).setInteractive()]);
    c.add(this.add.text(W / 2, y0 + 40, 'Menu', { fontFamily: FD, fontSize: '32px', fontStyle: '800', color: '#b8322a' }).setOrigin(0.5));
    rows.forEach(([label, cb, fill], i) => { const b = makeButton(this, W / 2, y0 + 102 + i * 66, 300, 52, label, () => cb(b), { fill: fill ?? COL.basilMid, size: 21 }); c.add(b); });
    c.add(this.add.text(W / 2, y0 + ph - 26, 'Noodle Rush · version 11 · Esc pauses the game', { fontFamily: FB, fontSize: '14px', fontStyle: '700', color: '#8a7a5a' }).setOrigin(0.5));
    c.add(makeButton(this, x0 + pw - 30, y0 + 30, 40, 40, '✕', close, { fill: COL.tomato, size: 20 }));
  }
}

// ================= Choose your chef =================
class ChefScene extends Phaser.Scene {
  constructor() { super('chef'); }
  create() {
    this.cameras.main.setBackgroundColor(COL.basil);
    this.add.text(W / 2, 46, 'Choose your chef', { fontFamily: FD, fontSize: '44px', fontStyle: '800', color: '#f6c453' }).setOrigin(0.5);
    this.add.text(W / 2, 88, 'Pick who runs the shop. You can change hair, hats and outfits in the morning shop.', { fontFamily: FB, fontSize: '18px', fontStyle: '700', color: '#cfe3c9' }).setOrigin(0.5);
    this.sel = SAVE.chef || CHEFS[0].id;
    const cw = 292, ch = 250, gap = 16, x0 = (W - (4 * cw + 3 * gap)) / 2;
    this.cards = CHEFS.map((c, i) => {
      const x = x0 + (i % 4) * (cw + gap), y = 114 + Math.floor(i / 4) * (ch + 12);
      const card = this.add.container(x, y);
      const g = this.add.graphics();
      card.add(g);
      const look = chefLook(c.id);
      const img = addPerson(this, lookId(c.id, look), look, 78, ch - 10, 0.92);
      card.add(img);
      card.add(this.add.text(150, 22, c.first, { fontFamily: FD, fontSize: '28px', fontStyle: '800', color: '#2b1a10' }));
      card.add(this.add.text(150, 56, c.last, { fontFamily: FD, fontSize: '22px', fontStyle: '800', color: '#b8322a' }));
      const vibe = this.add.text(150, 100, c.vibe, { fontFamily: FB, fontSize: '14px', fontStyle: '800', color: '#fbf3e0', backgroundColor: '#1f6b3b', padding: { x: 8, y: 3 } });
      card.add(vibe);
      card.add(this.add.text(150, 136, `"${c.quote}"`, { fontFamily: FH, fontSize: '19px', color: '#5b351b', wordWrap: { width: 130 }, lineSpacing: 0 }));
      const z = this.add.zone(cw / 2, ch / 2, cw, ch).setInteractive({ useHandCursor: true });
      z.on('pointerdown', () => { sfx('pop'); this.pick(c.id); });
      card.add(z);
      card.g = g; card.img = img; card.chef = c; card.w = cw; card.h = ch;
      return card;
    });
    this.go = makeButton(this, W / 2, 682, 320, 54, '', () => {
      SAVE.chef = this.sel; if (!SAVE.day) SAVE.day = 1; writeSave(); this.scene.start(wantsStory() ? 'story' : SAVE.day <= 1 ? 'game' : 'morning');
    }, { size: 24 });
    this.pick(this.sel);
  }
  pick(id) {
    this.sel = id;
    for (const card of this.cards) {
      const on = card.chef.id === id;
      card.g.clear();
      card.g.fillStyle(0x000000, 0.25).fillRoundedRect(4, 6, card.w, card.h, 18);
      card.g.fillStyle(on ? 0xfff6dc : 0xefe2c2, 1).fillRoundedRect(0, 0, card.w, card.h, 18);
      card.g.lineStyle(on ? 6 : 3, on ? COL.gold : COL.ink, 1).strokeRoundedRect(0, 0, card.w, card.h, 18);
      card.img.setLook('stand', on ? 'delight' : 'happy');
      if (on) { this.tweens.killTweensOf(card.img); card.img.y = card.h - 10; this.tweens.add({ targets: card.img, y: card.h - 26, duration: 160, yoyo: true, ease: 'Quad.easeOut' }); }
    }
    const c = CHEFS.find(q => q.id === id);
    this.go.setLabel(`Cook as ${c.first}`);
  }
}

// ================= Main game =================
class GameScene extends Phaser.Scene {
  constructor() { super('game'); }

  create() {
    this.overlays = 0;
    this.daily = !!this.registry.get('daily'); this.registry.set('daily', false);
    this.dailyDate = todayKey();
    this.chef = CHEFS.find(c => c.id === SAVE.chef) || CHEFS[0];
    this.look = chefLook(this.chef.id); this.lookKey = lookId(this.chef.id, this.look);
    this.dayN = SAVE.day || 1;
    this.cfg = this.daily ? { title: `Daily Dish #${dailyNumber(this.dailyDate)}`, roster: [['daily', 4]], nonna: '' } : dayConfig(this.dayN);
    this.seats = seatsOf(SAVE.tables);
    this.stations = STATIONS.flatMap(st => st.id === 'boil' && SAVE.upgrades.garlic ? [st, OVEN_STATION] : [st]);
    const up = SAVE.upgrades, nPots = 2 + (up.pot3 ? 1 : 0) + (up.pot3 && up.pot4 ? 1 : 0);
    this.potX = { 2: [600, 1000], 3: [470, 790, 1110], 4: [445, 675, 905, 1135] }[nPots];
    this.potK = { 2: 1, 3: 0.8, 4: 0.66 }[nPots];
    this.shapes = unlockedAt(SHAPES, this.dayN); this.sauces = unlockedAt(SAUCES, this.dayN); this.toppings = unlockedAt(TOPPINGS, this.dayN);
    if (!this.daily && needDotd(this.dayN)) SAVE.dotd = pickDotd(this.dayN);
    const dotdToday = !this.daily && SAVE.dotd && SAVE.dotd.day === this.dayN ? SAVE.dotd : null;
    if (!this.daily) SAVE.stats.daysStarted++;
    writeSave();
    const dayR = rng(this.dayN * 977 + 31), usedNames = new Set();
    const G = this.G = {
      time: 0, paused: false, tips: 0, sales: 0, spent: 0, nextDish: 1, lastNow: 0, nonnaFlour: false,
      customers: this.buildRoster().map(([key, t], i) => {
        const vis = isVisitorKey(key), ckey = vis ? `vis${this.dayN}_${i}` : key;
        let def = key === 'daily' ? { ...ZIA_LELLA, order: dailyOrder(this.dailyDate) } : key === 'critic' ? this.criticDef(dayR) : vis ? visitorDef(ckey, this.dayN * 131 + i * 17) : TOWNSFOLK[key];
        if (vis) {
          let k = VISITOR_NAMES.indexOf(def.name);
          while (usedNames.has(VISITOR_NAMES[k % VISITOR_NAMES.length]) && k < VISITOR_NAMES.length * 2) k++;
          def.name = def.short = VISITOR_NAMES[k % VISITOR_NAMES.length]; usedNames.add(def.name);
        }
        const bread = !this.daily && !!SAVE.upgrades.garlic && (def.critic || dayR() < (def.breadLike ?? 0.5));
        const order = def.critic || def.daily ? { ...def.order, bread } : { ...orderFor(def, dayR, this.dayN), bread };
        const allow = PATIENCE * def.patience * (SAVE.upgrades.cushions ? 1.15 : 1) * (boostToday('flowers') && !this.daily ? 1.15 : 1);
        return { key: ckey, def, order, orderLine: orderSentence(order, def), allow, id: i + 1, arrive: t, state: 'coming', x: DOOR_X, y: FLOOR, path: [], ft: 0, moving: false, patience: 1, waitStart: t, seat: null, dishId: null, alpha: 0, s: def.scale || 1, done: false, served: null };
      }),
      queue: [], dishes: [], selected: null, station: 'order', results: [],
      pots: this.potX.map(() => ({ dish: null, t: 0, dinged: false })), oven: { dish: null, t: 0, dinged: false }, heldBread: false, peelBread: null, peelAnim: null, peelDrag: null,
      pouring: false, cranking: false, lastAngle: 0, topping: 'parm', held: null, plateDrag: false, ended: false, endTimer: null, railTimer: 0,
      dialog: null, serving: null, pointer: { x: 0, y: 0 },
      dotdSold: 0, dotdGoal: dotdToday ? DOTD_GOAL(this.dayN) : 0, fresh: 0, wage: this.daily ? 0 : (up.cook ? COOK_WAGE : 0) + (up.baker && up.garlic ? BAKER_WAGE : 0),
    };
    // make sure enough people order the dish of the day to reach Nonna's goal
    if (dotdToday) {
      const pool = G.customers.filter(c => !c.def.critic && !c.order.dotd);
      while (G.customers.filter(c => c.order.dotd).length < G.dotdGoal + 1 && pool.length) {
        const c = pool.splice(Math.floor(dayR() * pool.length), 1)[0];
        c.order.shape = dotdToday.shape; c.order.sauce = dotdToday.sauce; c.order.dotd = true; c.orderLine = orderSentence(c.order, c.def);
      }
    }
    window.NR = { G, scene: this };
    this.cameras.main.setBackgroundColor(COL.basil);

    this.buildHud();
    this.buildRail();
    this.stationC = {}; this.dyn = {};
    this.buildOrder(); this.buildDough(); this.buildBoil(); this.buildSauce(); this.buildToppings(); this.buildServe();
    if (SAVE.upgrades.garlic) this.buildOven();
    this.buildInfoPanel();
    this.buildTabs();
    this.toast = this.add.text(800, 192, '', { fontFamily: FD, fontSize: '22px', fontStyle: '800', color: '#2b1a10', backgroundColor: '#f6c453', padding: { x: 14, y: 4 } }).setOrigin(0.5, 0).setDepth(60).setAlpha(0);

    this.input.on('pointerup', p => { G.pouring = false; G.cranking = false; if (G.held) this.dropTopping(p.worldX, p.worldY); if (G.plateDrag) this.dropPlate(p.worldX, p.worldY); if (G.heldBread) this.dropBread(p.worldX, p.worldY); if (G.peelDrag) { G.peelDrag = null; this.slideIn(); } });
    this.input.on('pointermove', p => { G.pointer.x = p.worldX; G.pointer.y = p.worldY; this.onCrankMove(p); });
    this.input.on('pointerdown', p => { G.pointer.x = p.worldX; G.pointer.y = p.worldY; });
    this.input.keyboard.on('keydown', e => {
      if (window.FEEDBACK_OPEN) return;
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') { if (this.pauseC) this.closePause(); else this.openPause(); return; }
      const n = Number(e.key); if (n >= 1 && n <= this.stations.length && !G.paused) this.goStation(this.stations[n - 1].id);
    });

    SAVE.seen.order = true;
    this.goStation('order');
    let intro = this.dayN === 1
      ? `Benvenuto, ${this.chef.first}! ${this.cfg.nonna} ${NONNA_TIPS.order}`
      : this.cfg.nonna;
    if (SAVE.criticDay === this.dayN) intro += ' And keep your eyes open: the food critic from La Gazzetta might stop by today!';
    if (boostToday('musician')) intro += ' Listen to that accordion in the piazza! It will bring in extra customers today.';
    else if (boostToday('flowers')) intro += ' Fresh flowers on every table will keep our customers patient today.';
    else if (boostToday('oil')) intro += " Cousin Gianni's olive oil is on every table, so tips will be good today.";
    const newToday = UNLOCKS.find(u => u.day === this.dayN && this.dayN > 1), chNow = chapterAt(this.dayN);
    if (newToday && isChapterStart(newToday)) intro += ` Today we cook like they do in ${chNow.name}!`;
    else if (this.dayN > LAST_DAY && (this.dayN - LAST_DAY - 1) % 8 === 0) intro += ` This week our menu visits ${chNow.name} again!`;
    if (dotdToday) intro += ` My dish of the day is ${dotdName(dotdToday)}. Serve ${G.dotdGoal} ${SAVE.streak ? `to keep our ${SAVE.streak}-day streak going` : 'to start a streak'}!`;
    if (newToday && newToday.adds.length) intro += ` New on the menu today: ${newToday.what.toLowerCase()}!`;
    if (this.daily) this.nonna(`My sister Lella is here for the Daily Dish! She orders one plate, and every cook who plays Noodle Rush today gets the very same order. Make it as perfect as you can. You get ${money(DAILY_STAR)} for every star, and then you can share your score with friends.`, this.cfg.title);
    else this.nonna(intro, `Day ${this.dayN} · ${this.cfg.title}`);
  }

  buildRoster() {
    if (this.daily) return [['daily', 4]];
    const cfg = this.cfg, n = this.dayN;
    let keys = cfg.roster.map(r => r[0]);
    const times = cfg.roster.map(r => r[1]);
    const gap = keys.length > 1 ? (times[times.length - 1] - times[0]) / (keys.length - 1) : 60;
    const delta = SAVE.buzz.reduce((a, b) => a + b.delta, 0);
    if (delta > 0) {
      const extra = Phaser.Utils.Array.Shuffle(Object.keys(TOWNSFOLK).filter(k => !keys.includes(k)));
      let vi = keys.filter(isVisitorKey).length;
      for (let i = 0; i < delta; i++) keys.push(extra[i] || 'v' + vi++);
    }
    if (delta < 0) keys = keys.slice(0, Math.max(2, keys.length + delta));
    if (SAVE.criticDay === n) keys.splice(Math.ceil(keys.length / 2), 0, 'critic');
    const g = keys.length > cfg.roster.length ? Math.max(22, gap * cfg.roster.length / keys.length * 1.15) : gap;
    return keys.map((k, i) => [k, 4 + i * g]);
  }

  criticDef(R) {
    const pick = a => a[Math.floor(R() * a.length)];
    const shape = pick(unlockedAt(SHAPES, this.dayN)).id, sauce = pick(unlockedAt(SAUCES, this.dayN)).id;
    const ids = Phaser.Utils.Array.Shuffle(unlockedAt(TOPPINGS, this.dayN).map(t => t.id)).slice(0, 2 + (R() < 0.5 ? 1 : 0));
    const pats = [['center', 1 + Math.floor(R() * 2)], ['ring', 3 + Math.floor(R() * 3)], ['inner', 2 + Math.floor(R() * 2)]];
    const toppings = ids.map((id, i) => ({ id, n: pats[i][1], pattern: pats[i][0] }));
    const order = { shape, sauce, toppings };
    const names = toppings.map(t => TOPPINGS.find(q => q.id === t.id).name.toLowerCase());
    const line = `${SHAPES.find(q => q.id === shape).name} with ${SAUCES.find(q => q.id === sauce).name.toLowerCase()}, ${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}. Plated with care, please.`;
    return { ...CRITIC, order, lines: { ...CRITIC.lines, order: line } };
  }

  // ----- HUD, rail, tabs -----
  buildHud() {
    const g = this.add.graphics();
    g.fillStyle(0x052f15, 1).fillRect(0, 0, W, 50);
    this.add.image(30, 25, tex(this, 'portrait_' + this.lookKey, () => portraitCanvas(this.look, 96))).setScale(42 / (96 * ART_SCALE));
    const t1 = this.add.text(60, 25, 'NOODLE RUSH', { fontFamily: FD, fontSize: '26px', fontStyle: '800', color: '#f6c453' }).setOrigin(0, 0.5);
    this.add.text(t1.x + t1.width + 14, 26, this.daily ? this.cfg.title : `Day ${this.dayN} · ${this.cfg.title}`, { fontFamily: FB, fontSize: '17px', fontStyle: '800', color: '#cfe3c9' }).setOrigin(0, 0.5);
    this.hudClock = this.add.text(590, 25, '', { fontFamily: FD, fontSize: '22px', fontStyle: '800', color: '#fbf3e0' }).setOrigin(0.5);
    this.hudServed = this.add.text(648, 25, '', { fontFamily: FB, fontSize: '17px', fontStyle: '800', color: '#cfe3c9' }).setOrigin(0, 0.5);
    this.hudDotd = this.add.text(818, 25, '', { fontFamily: FB, fontSize: '14px', fontStyle: '800', color: '#2b1a10', backgroundColor: '#f6c453', padding: { x: 8, y: 3 } }).setOrigin(0, 0.5).setVisible(false).setInteractive({ useHandCursor: true });
    this.hudDotd.on('pointerdown', () => { if (!this.G.paused) this.nonna(`Today's dish of the day is ${dotdName(SAVE.dotd)}. Each one you serve earns a bonus tip. Serve ${this.G.dotdGoal} today to keep the streak going. Our streak: ${SAVE.streak} day${SAVE.streak === 1 ? '' : 's'}.`, "Nonna's dish of the day"); });
    this.hudBtns = this.add.graphics();
    const icon = (x, cb) => { const z = this.add.zone(x, 25, 36, 36).setInteractive({ useHandCursor: true }); z.on('pointerdown', cb); return z; };
    icon(1012, () => { if (this.pauseC) this.closePause(); else this.openPause(); });
    icon(1054, () => { SAVE.muted = !SAVE.muted; writeSave(); this.drawHudBtns(); if (this.pauseC) this.pauseC.refreshSound(); });
    this.drawHudBtns();
    this.hudTips = this.add.text(W - 18, 25, '', { fontFamily: FD, fontSize: '24px', fontStyle: '800', color: '#f6c453' }).setOrigin(1, 0.5);
  }

  drawHudBtns() {
    const g = this.hudBtns; g.clear();
    for (const x of [1012, 1054]) { g.fillStyle(COL.basilMid, 1).fillCircle(x, 25, 17); g.lineStyle(2, 0x8fb894, 1).strokeCircle(x, 25, 17); }
    g.fillStyle(0xfbf3e0, 1).fillRect(1005, 17, 5, 16).fillRect(1014, 17, 5, 16);
    g.fillRect(1044, 21, 6, 8).fillTriangle(1047, 25, 1056, 16, 1056, 34);
    if (SAVE.muted) g.lineStyle(3, 0xf08a7a, 1).lineBetween(1043, 15, 1065, 35);
    else { g.lineStyle(2, 0xfbf3e0, 1); g.beginPath(); g.arc(1057, 25, 6, -0.9, 0.9, false); g.strokePath(); }
  }

  buildRail() {
    const g = this.add.graphics();
    g.fillStyle(0x0a3a1b, 1).fillRect(0, 50, W, 132);
    g.fillStyle(COL.steelDark, 1).fillRect(0, 58, W, 6);
    this.railEmpty = this.add.text(W / 2, 118, 'Order tickets will hang here', { fontFamily: FB, fontSize: '18px', fontStyle: '700', color: '#8fb894' }).setOrigin(0.5);
    this.rail = this.add.container(0, 0);
    this.patienceG = this.add.graphics();
  }

  railSig() {
    const G = this.G;
    return G.selected + '|' + G.dishes.map(d => d.id + d.stage + (d.bread ? 'b' : '') + (d.stage === 'boiling' ? Math.floor(G.pots[d.pot].t) : '')).join(',');
  }

  renderRail() {
    const G = this.G;
    this.rail.removeAll(true);
    this.lastSig = this.railSig();
    this.railEmpty.setVisible(G.dishes.length === 0);
    G.dishes.forEach((d, i) => {
      const x = railX(i, G.dishes.length), y = 68, w = 146, h = 108;
      const cust = G.customers.find(c => c.id === d.customerId);
      const g = this.add.graphics();
      g.fillStyle(0x000000, 0.25).fillRoundedRect(x + 2, y + 4, w, h, 6);
      g.fillStyle(0xfffaee, 1).fillRoundedRect(x, y, w, h, 6);
      g.lineStyle(2, COL.ink, 0.7).strokeRoundedRect(x, y, w, h, 6);
      g.fillStyle(Phaser.Display.Color.HexStringToColor(cust.def.look.shirt).color, 1).fillRoundedRect(x, y, w, 24, { tl: 6, tr: 6, bl: 0, br: 0 });
      g.fillStyle(COL.steel, 1).fillRect(x + w / 2 - 6, y - 8, 12, 12);
      if (G.selected === d.id) g.lineStyle(4, COL.pasta, 1).strokeRoundedRect(x - 3, y - 3, w + 6, h + 6, 8);
      if (d.order.dotd) drawStar(g, x + w - 14, y + 12, 9, true);
      drawMiniPlate(g, x + w - 30, y + 58, 22, d.order);
      if (d.order.bread) { drawBread(g, x + w - 22, y + 90, 0.42, d.bread ? d.bread.tone : 0.15); if (d.bread) g.fillStyle(COL.good, 1).fillCircle(x + w - 10, y + 82, 5); }
      this.rail.add(g);
      this.rail.add(this.add.text(x + 8, y + 12, cust.def.short, { fontFamily: FD, fontSize: '17px', fontStyle: '800', color: '#ffffff', stroke: '#2b1a10', strokeThickness: 3 }).setOrigin(0, 0.5));
      const sh = SHAPES.find(s => s.id === d.order.shape).name, sa = SAUCES.find(s => s.id === d.order.sauce).name;
      this.rail.add(this.add.text(x + 8, y + 28, `${sh}\n${sa}`, { fontFamily: FH, fontSize: '18px', color: '#2b1a10', lineSpacing: -4 }));
      let label = d.rav ? `Filling ${shapeName(d.rav.shape).toLowerCase()}` : STAGE_LABEL[d.stage], color = '#7d4a26';
      if (d.stage === 'boiling') {
        const pot = G.pots[d.pot];
        label = `Boiling ${Math.floor(pot.t)}s`;
        color = pot.t >= BOIL.done ? '#d9432f' : pot.t >= BOIL.ready ? '#2e7d32' : '#7d4a26';
      }
      if (d.stage === 'ready') color = '#2e7d32';
      this.rail.add(this.add.text(x + 8, y + 88, label, { fontFamily: FB, fontSize: '13px', fontStyle: '800', color }).setOrigin(0, 0.5));
      const z = this.add.zone(x + w / 2, y + h / 2, w, h).setInteractive({ useHandCursor: true });
      z.on('pointerdown', () => { if (!G.paused) { sfx('click'); G.selected = d.id; this.refreshStation(); } });
      this.rail.add(z);
    });
  }

  drawPatience() {
    const G = this.G, g = this.patienceG;
    g.clear();
    G.dishes.forEach((d, i) => {
      const cust = G.customers.find(c => c.id === d.customerId);
      const x = railX(i, G.dishes.length), y = 68, w = 146, h = 108, bw = i === G.dishes.length - 1 ? w - 16 : Math.min(w - 16, railStep(G.dishes.length) - 16);
      const pc = cust.patience > 0.5 ? COL.good : cust.patience > 0.25 ? COL.warn : COL.bad;
      g.fillStyle(0xd9cfb3, 1).fillRect(x + 8, y + h - 10, bw, 5);
      g.fillStyle(pc, 1).fillRect(x + 8, y + h - 10, bw * cust.patience, 5);
    });
  }

  buildTabs() {
    const g = this.add.graphics();
    g.fillStyle(0x052f15, 1).fillRect(0, 640, W, 80);
    this.tabs = {};
    const n = this.stations.length, tw = (W - 32 - (n - 1) * 10) / n;
    this.stations.forEach((s, i) => {
      const b = makeButton(this, 16 + tw / 2 + i * (tw + 10), 680, tw, 56, `${i + 1}  ${s.name}`, () => { if (!this.G.paused) this.goStation(s.id); }, { fill: COL.basilMid, size: 22 });
      b.badge = this.add.text(16 + tw + i * (tw + 10) - 8, 656, '', { fontFamily: FB, fontSize: '15px', fontStyle: '800', color: '#2b1a10', backgroundColor: '#f6c453', padding: { x: 7, y: 1 } }).setOrigin(1, 0.5).setDepth(5);
      this.tabs[s.id] = b;
    });
  }

  // ----- info panel (left side of cooking stations) -----
  buildInfoPanel() {
    const c = this.infoC = this.add.container(0, 0);
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.2).fillRoundedRect(24, 202, 280, 428, 10);
    g.fillStyle(0xfffaee, 1).fillRoundedRect(20, 196, 280, 428, 10);
    g.lineStyle(3, COL.ink, 0.8).strokeRoundedRect(20, 196, 280, 428, 10);
    g.fillStyle(COL.steelDark, 1).fillRect(148, 188, 24, 14);
    c.add(g);
    this.infoG = this.add.graphics(); c.add(this.infoG);
    this.infoTitle = this.add.text(36, 208, '', { fontFamily: FD, fontSize: '24px', fontStyle: '800', color: '#2b1a10' });
    this.infoBody = this.add.text(36, 248, '', { fontFamily: FH, fontSize: '21px', color: '#2b1a10', wordWrap: { width: 250 }, lineSpacing: 0 });
    this.infoHint = this.add.text(36, 548, '', { fontFamily: FB, fontSize: '14px', fontStyle: '700', color: '#7d4a26', wordWrap: { width: 252 }, lineSpacing: 1 });
    c.add([this.infoTitle, this.infoBody, this.infoHint]);
  }

  refreshInfo() {
    const G = this.G, st = this.stations.find(s => s.id === G.station);
    this.infoC.setVisible(G.station !== 'order' && G.station !== 'serve');
    this.infoG.clear();
    const d = this.current();
    if (!d) {
      this.infoTitle.setText(st.name + ' station');
      this.infoBody.setText(G.dishes.length ? 'No ticket is ready for this station yet. Pick a ticket on the rail, or check the other stations.' : 'No orders yet. Take an order at the Order station (key 1).');
      this.infoHint.setText('');
      return;
    }
    const cust = G.customers.find(c => c.id === d.customerId);
    this.infoTitle.setText(`${cust.def.short}'s order`);
    this.infoBody.setText(orderLines(d.order).join('\n') + (d.order.dotd ? '\n★ Dish of the day' : ''));
    drawMiniPlate(this.infoG, 160, 480, 56, d.order);
    const ok = stMatch(st, d) || (G.station === 'oven' && G.oven.dish === d.id);
    const HINT = {
      oven: this.baker ? 'Zia Pina is minding the oven. She takes every slice out golden.' : 'Drag bread onto the peel, then push the peel into the oven. Take it out when the meter is green.',
      dough: d.rav ? `Press and hold to squeeze the piping bag over each piece. Let go when its dot turns green, then seal them.` : 'Turn the crank until the meter is green, then cut the shape.',
      boil: 'Green ring means al dente, red means overcooked. Pasta keeps cooking while you work elsewhere.',
      sauce: 'Click the right sauce pot, then hold the mouse on the pasta to pour.',
      toppings: 'Drag toppings from the bins onto the faded spots. Drag one off the plate to remove it.',
    };
    this.infoHint.setText(ok ? HINT[G.station] || '' : G.station === 'oven' ? (d.order.bread ? 'This plate already has its garlic bread.' : 'This order has no garlic bread.') : `This plate is at: ${STAGE_LABEL[d.stage]}.`);
  }

  // ----- stations -----
  stationBase(id, bgKey, bgMake) {
    const c = this.add.container(0, 0);
    c.add(roomImage(this, bgKey, bgMake, 0, TOP));
    this.stationC[id] = c;
    this.dyn[id] = this.add.graphics();
    return c;
  }

  buildOrder() {
    const c = this.add.container(0, 0);
    this.stationC.order = c; this.dyn.order = this.add.graphics();
    const R = this.room = buildRoom(this, c);
    this.standLayer = R.stand;
    this.chefImg = addPerson(this, this.lookKey, this.look, 737, FLOOR, 0.95);
    R.mid.add(this.chefImg);
    this.tweens.add({ targets: this.chefImg, scaleY: this.chefImg.scaleY * 1.012, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    if (SAVE.upgrades.register2) {
      this.matteo = addPerson(this, 'matteo', MATTEO_LOOK, 630, FLOOR, 0.9);
      R.mid.addAt(this.matteo, 0);
    }
    R.mid.add(this.add.image(545, 430 - 68, tex(this, 'counter', counterCanvas)).setOrigin(0, 0).setScale(1 / 1.5));
    c.add(this.dyn.order);
    this.custImgs = {};
    for (const cu of this.G.customers) {
      const img = addPerson(this, cu.key, cu.def.look, DOOR_X, FLOOR, 0.92 * cu.s).setAlpha(0).setVisible(false);
      img.setInteractive({ useHandCursor: true, pixelPerfect: false });
      img.on('pointerdown', () => this.clickCustomer(cu));
      this.standLayer.add(img);
      this.custImgs[cu.id] = img; cu.img = img; cu.layer = 'stand';
    }
    this.counterHint = this.add.text(520, 236, '', { fontFamily: FB, fontSize: '15px', fontStyle: '800', color: '#fbf3e0', backgroundColor: '#1f6b3b', padding: { x: 8, y: 3 } }).setOrigin(0.5);
    c.add(this.counterHint);
    this.custBubble = makeBubble(this, c);
    this.chefBubble = makeBubble(this, c);
    this.notepad = this.add.container(1080, 318).setVisible(false);
    c.add(this.notepad);
    // clicking the room during a conversation skips ahead
    const skip = this.add.zone(W / 2, TOP + 229, W, 458).setInteractive();
    skip.on('pointerdown', () => { if (this.G.dialog) this.advanceDialog(true); });
    c.addAt(skip, 1);
    this.G.customers.forEach(cu => { cu.img.input.enabled = false; });
  }

  buildDough() {
    const c = this.stationBase('dough', 'room_kitchen', kitchenCanvas);
    c.add(this.dyn.dough);
    this.doughLbls = [this.add.text(900, 222, 'Thinness', { fontFamily: FD, fontSize: '20px', fontStyle: '800', color: '#7d4a26' }).setOrigin(0.5),
      this.add.text(740, 528, 'Drag the crank in circles', { fontFamily: FB, fontSize: '16px', fontStyle: '800', color: '#7d4a26' }).setOrigin(0.5)];
    c.add(this.doughLbls);
    const z = this.add.zone(740, 400, 240, 240).setInteractive({ useHandCursor: true });
    z.on('pointerdown', p => { const d = this.current(); if (d && d.stage === 'dough' && !d.rav && !this.G.paused && this.G.station === 'dough') { if (SAVE.pantry <= 0 && !d.thin && !this.daily) { this.showToast('Out of dough! Order a rush delivery', '#f08a7a'); return; } this.G.cranking = true; this.G.lastAngle = Phaser.Math.Angle.Between(740, 400, p.worldX, p.worldY); } });
    c.add(z);
    c.add(this.add.text(1121, 230, 'Cut it into', { fontFamily: FD, fontSize: '20px', fontStyle: '800', color: '#7d4a26' }).setOrigin(0.5));
    // picture tiles, two to a row, so you can see each shape before you cut it
    this.cutBtns = this.shapes.map((s, i) => {
      const b = makeButton(this, 1066 + (i % 2) * 110, 302 + Math.floor(i / 2) * 108, 104, 102, s.name, () => this.cut(s.id), { fill: COL.pasta, textColor: '#2b1a10', size: s.name.length > 9 ? 14 : 16 });
      const ic = this.add.graphics(), R = 55;
      ic.fillStyle(0xfffaee, 1).fillCircle(0, 0, R); ic.lineStyle(4, COL.ink, 0.7).strokeCircle(0, 0, R);
      drawPasta(ic, 0, 0, R * 0.95, s.id, 3);
      ic.setScale(33 / R).setPosition(0, -13);
      b.add(ic); b.label.y = 36;
      c.add(b); return b;
    });
    // ravioli board: six squares, one spoonful of filling each
    this.ravC = this.add.container(0, 0).setVisible(false); c.add(this.ravC);
    this.ravTitle = this.add.text(640, 236, '', { fontFamily: FD, fontSize: '21px', fontStyle: '800', color: '#2b1a10', backgroundColor: '#fffaee', padding: { x: 12, y: 4 } }).setOrigin(0.5);
    this.ravC.add(this.ravTitle);
    const bz = this.add.zone(RAV.x + RAV.s, RAV.y + RAV.s / 2, RAV.s * 3, RAV.s * 2).setInteractive();
    bz.on('pointerdown', () => { const d = this.current(); if (d && d.rav && !this.G.paused && this.G.station === 'dough') this.G.piping = true; });
    this.ravC.add(bz); this.ravZones = [bz];
    this.input.on('pointerup', () => { this.G.piping = false; });
    this.ravSeal = makeButton(this, 640, 566, 220, 54, 'Seal them up', () => this.sealRavioli(), { size: 22 });
    this.ravC.add(this.ravSeal);
    this.pantryText = this.add.text(560, 226, '', { fontFamily: FB, fontSize: '16px', fontStyle: '800', color: '#2b1a10', backgroundColor: '#fffaee', padding: { x: 10, y: 4 } }).setOrigin(0.5);
    c.add(this.pantryText);
    this.rushBtn = makeButton(this, 560, 596, 280, 46, '', () => this.rushDelivery(), { fill: COL.basilMid, size: 17 });
    c.add(this.rushBtn);
  }

  keyOf(id) { return this.stations.findIndex(st => st.id === id) + 1; }

  rushDelivery() {
    const G = this.G, R = RUSH_DELIVERY;
    if (SAVE.bank + G.tips + G.sales - G.spent >= R.price) {
      G.spent += R.price; SAVE.pantry += R.plates; sfx('coin');
      this.showToast(`Rush delivery! ${R.plates} more plates of dough (${money(R.price)})`);
    } else if (!G.nonnaFlour) {
      G.nonnaFlour = true; SAVE.pantry += R.plates; sfx('ding');
      this.showToast('Nonna brought flour from home. Just this once!', '#cfe3c9');
    } else { this.showToast('Not enough money for a delivery', '#f08a7a'); sfx('bad'); }
    this.refreshStation();
  }

  buildBoil() {
    const c = this.stationBase('boil', 'room_kitchen', kitchenCanvas);
    const g = this.add.graphics();
    const k = this.potK;
    g.fillStyle(0x3d4247, 1).fillRoundedRect(330, 520, 930, 110, 12);
    g.lineStyle(3, COL.ink, 1).strokeRoundedRect(330, 520, 930, 110, 12);
    for (const x of this.potX) { g.fillStyle(0x23272b, 1).fillEllipse(x, 528, 220 * k, 30); }
    // Rocco stands behind the stove, between the pots, and stirs whichever one is closest to done
    if (SAVE.upgrades.cook) {
      // sized to the pots, with his hat just above the rims and his feet hidden behind the stove
      const rs = this.roccoS = k >= 1 ? 1.3 : k >= 0.8 ? 1.1 : 0.95;
      this.rocco = addPerson(this, 'rocco', ROCCO_LOOK, this.roccoSpot(0), Math.max(542, 284 + PERSON_FEET * rs), rs); c.add(this.rocco);
    }
    c.add(g); c.add(this.dyn.boil);
    this.potBtns = this.potX.map((x, i) => { const b = makeButton(this, x, 590, 220 * k, 56, 'Drop pasta', () => this.potAction(i)); c.add(b); return b; });
    this.roccoPill = this.add.text(334, 206, 'Rocco is watching the pots', { fontFamily: FB, fontSize: '14px', fontStyle: '800', color: '#fbf3e0', backgroundColor: '#1f6b3b', padding: { x: 10, y: 3 } }).setOrigin(0, 0.5).setVisible(!!SAVE.upgrades.cook);
    c.add(this.roccoPill);
    this.potText = this.potX.map(x => { const t = this.add.text(x, 240, '', { fontFamily: FD, fontSize: (k < 0.7 ? 16 : 19) + 'px', fontStyle: '800', color: '#2b1a10', backgroundColor: '#fffaee', padding: { x: 10, y: 2 } }).setOrigin(0.5); c.add(t); return t; });
  }

  roccoSpot(i) {
    const X = this.potX;
    if (X.length < 2) return X[0] + 150;
    return i < X.length - 1 ? (X[i] + X[i + 1]) / 2 : (X[i - 1] + X[i]) / 2;
  }

  buildSauce() {
    const c = this.stationBase('sauce', 'room_kitchen', kitchenCanvas);
    const g = this.add.graphics();
    const sx = this.sauces.length > 3 ? 868 : 900;
    g.fillStyle(0x3d4247, 1).fillRoundedRect(sx, 520, 1260 - sx, 70, 10);
    g.lineStyle(3, COL.ink, 1).strokeRoundedRect(sx, 520, 1260 - sx, 70, 10);
    c.add(g);
    c.add(this.add.text(820, 222, 'Amount', { fontFamily: FD, fontSize: '20px', fontStyle: '800', color: '#7d4a26' }).setOrigin(0.5));
    c.add(this.add.text(1080, 330, 'Pick a sauce pot', { fontFamily: FD, fontSize: '20px', fontStyle: '800', color: '#7d4a26' }).setOrigin(0.5));
    this.sauceTip = this.add.text(600, 598, '', { fontFamily: FB, fontSize: '16px', fontStyle: '800', color: '#2b1a10', backgroundColor: '#fffaee', padding: { x: 10, y: 4 } }).setOrigin(0.5);
    c.add(this.sauceTip);
    const n = this.sauces.length;
    this.saucePos = this.sauces.map((s, i) => n <= 3 ? { x: 960 + i * 120, k: 1 } : { x: 1062 + (i - (n - 1) / 2) * 76, k: 0.7 });
    this.potZones = this.sauces.map((s, i) => {
      const { x, k } = this.saucePos[i];
      c.add(this.add.text(x, 548, s.name, { fontFamily: FD, fontSize: (k < 1 ? 15 : 19) + 'px', fontStyle: '800', color: '#fbf3e0' }).setOrigin(0.5));
      const z = this.add.zone(x, 450, k < 1 ? 72 : 110, 140).setInteractive({ useHandCursor: true });
      z.on('pointerdown', () => this.chooseSauce(s.id));
      c.add(z); return z;
    });
    const pz = this.add.zone(600, 410, 300, 300).setInteractive({ useHandCursor: true });
    pz.on('pointerdown', p => {
      const d = this.current();
      if (!d || d.stage !== 'sauce' || this.G.paused) return;
      if (!d.sauceId) { this.showToast('Pick a sauce pot first'); return; }
      this.G.pouring = true; this.G.pointer.x = p.worldX; this.G.pointer.y = p.worldY;
    });
    c.add(pz);
    c.add(this.dyn.sauce);
    this.sauceDone = makeButton(this, 1080, 610, 230, 50, 'Done saucing', () => this.finishSauce());
    c.add(this.sauceDone);
  }

  buildToppings() {
    const c = this.stationBase('toppings', 'room_kitchen', kitchenCanvas);
    // topping bins along the front of the counter
    const bg = this.add.graphics(); c.add(bg);
    this.bins = this.toppings.map((t, i) => ({ id: t.id, x: 382 + i * 120, y: 590 }));
    for (const b of this.bins) {
      drawBin(bg, b.x, b.y, b.id);
      c.add(this.add.text(b.x, b.y + 20, TOPPINGS.find(q => q.id === b.id).name, { fontFamily: FB, fontSize: '14px', fontStyle: '800', color: '#2b1a10' }).setOrigin(0.5));
      const z = this.add.zone(b.x, b.y, 108, 66).setInteractive({ useHandCursor: true });
      z.on('pointerdown', p => this.grabTopping(b.id, p));
      c.add(z);
    }
    // pick a placed topping back up
    const pz = this.add.zone(TP.x, TP.y, TP.r * 2, TP.r * 2).setInteractive({ useHandCursor: true });
    pz.on('pointerdown', p => this.grabPlaced(p));
    c.add(pz);
    c.add(this.dyn.toppings);
    this.clearBtn = makeButton(this, 1160, 486, 180, 52, 'Clear plate', () => { const d = this.current(); if (d && d.stage === 'toppings') { d.placed = []; this.refreshStation(); } }, { fill: COL.steelDark, size: 20 });
    this.finishBtn = makeButton(this, 1160, 566, 180, 60, 'Finish plate', () => this.finishToppings(), { size: 22 });
    c.add([this.clearBtn, this.finishBtn]);
    this.topCount = this.add.text(1160, 226, '', { fontFamily: FB, fontSize: '15px', fontStyle: '800', color: '#2b1a10', align: 'center', lineSpacing: 4, backgroundColor: '#fffaee', padding: { x: 8, y: 6 } }).setOrigin(0.5, 0);
    c.add(this.topCount);
  }

  buildServe() {
    const c = this.stationBase('serve', 'room_booth', boothCanvas);
    this.serveCust = addPerson(this, 'nonna', NONNA_LOOK, 560, 620, 1.35).setVisible(false);
    c.add(this.serveCust);
    c.add(this.add.image(560, 548, tex(this, 'bigtable', bigTableCanvas)).setOrigin(0.5, 0).setScale(1 / 1.5));
    this.servePlate = this.add.graphics(); c.add(this.servePlate);
    c.add(this.dyn.serve);
    const pz = this.add.zone(1090, 490, 220, 110).setInteractive({ useHandCursor: true });
    pz.on('pointerdown', p => { const d = this.current(); if (d && d.stage === 'ready' && !this.G.serving && !this.G.paused) { this.G.plateDrag = true; this.G.pointer.x = p.worldX; this.G.pointer.y = p.worldY; sfx('pop'); } });
    c.add(pz);
    this.serveHint = this.add.text(1090, 600, '', { fontFamily: FD, fontSize: '22px', fontStyle: '800', color: '#2b1a10', backgroundColor: '#fffaee', padding: { x: 14, y: 6 }, align: 'center' }).setOrigin(0.5);
    c.add(this.serveHint);
    this.serveEmpty = this.add.text(560, 330, 'Finished plates show up here.\nPick a ticket marked "Ready to serve".', { fontFamily: FD, fontSize: '24px', fontStyle: '800', color: '#7d4a26', align: 'center', backgroundColor: '#fffaee', padding: { x: 16, y: 10 } }).setOrigin(0.5);
    c.add(this.serveEmpty);
    this.serveBubble = makeBubble(this, c);
  }

  buildOven() {
    const c = this.stationBase('oven', 'room_kitchen', kitchenCanvas);
    c.add(this.add.image(450, 246, tex(this, 'oven', ovenCanvas)).setOrigin(0, 0).setScale(1 / 1.5));
    this.baker = !!SAVE.upgrades.baker;
    if (this.baker) { this.pina = addPerson(this, 'pina', BAKER_LOOK, 392, 640, 1.05); c.add(this.pina); }
    const bg = this.add.graphics(); c.add(bg);
    // bread basket
    bg.fillStyle(0xc8a46a, 1).fillRoundedRect(330, 560, 140, 62, 14); bg.lineStyle(3, COL.ink, 1).strokeRoundedRect(330, 560, 140, 62, 14);
    for (let i = 0; i < 4; i++) drawBread(bg, 362 + i * 26, 566 - (i % 2) * 6, 0.42, 0.05);
    bg.fillStyle(0xb38d55, 1).fillRoundedRect(330, 582, 140, 40, { tl: 0, tr: 0, bl: 14, br: 14 }); bg.lineStyle(3, COL.ink, 1).strokeRoundedRect(330, 582, 140, 40, { tl: 0, tr: 0, bl: 14, br: 14 });
    c.add(this.add.text(400, 604, 'Bread', { fontFamily: FB, fontSize: '15px', fontStyle: '800', color: '#2b1a10' }).setOrigin(0.5));
    const z = this.add.zone(400, 585, 150, 80).setInteractive({ useHandCursor: true });
    z.on('pointerdown', p => this.grabBread(p));
    c.add(z);
    c.add(this.add.text(940, 222, 'Toast', { fontFamily: FD, fontSize: '20px', fontStyle: '800', color: '#7d4a26' }).setOrigin(0.5));
    c.add(this.dyn.oven);
    this.ovenText = this.add.text(1120, 310, '', { fontFamily: FD, fontSize: '20px', fontStyle: '800', color: '#2b1a10', align: 'center', wordWrap: { width: 250 } }).setOrigin(0.5);
    c.add(this.ovenText);
    this.takeOutBtn = makeButton(this, 1120, 400, 230, 64, 'Take it out', () => this.takeOutBread(), { size: 24 });
    c.add(this.takeOutBtn);
    if (this.baker) this.takeOutBtn.setVisible(false);
    // the wooden peel rests on the counter in front of the oven
    const pz = this.add.zone(700, 596, 300, 96).setInteractive({ useHandCursor: true });
    pz.on('pointerdown', p => { const G = this.G; if (G.paused || this.baker || G.peelAnim) return; if (G.peelBread) G.peelDrag = { y0: p.worldY }; });
    c.add(pz);
  }

  // u: 0 = peel resting on the counter, 1 = deep in the oven
  peelU() {
    const G = this.G, a = G.peelAnim;
    if (a) { const h = PEEL_T / 2; return a.t < h ? a.t / h : Math.max(0, 1 - (a.t - h) / h); }
    if (G.peelDrag) return clamp((G.peelDrag.y0 - this.input.activePointer.worldY) / 150, 0, 0.9);
    return 0;
  }

  slideIn(auto) {
    const G = this.G;
    if (!G.peelBread || G.oven.dish || G.peelAnim) return;
    if (!G.dishes.some(x => x.id === G.peelBread)) { G.peelBread = null; return; }
    const u0 = this.peelU();
    G.peelAnim = { kind: 'in', t: u0 * PEEL_T / 2, dish: G.peelBread, tone: 0.05 };
    G.peelBread = null; sfx('click');
    this.refreshStation();
  }

  tickPeel(dt) {
    const G = this.G, a = G.peelAnim;
    if (a) {
      a.t += dt;
      if (!a.swapped && a.t >= PEEL_T / 2) {
        a.swapped = true;
        if (a.kind === 'in') { if (G.dishes.some(x => x.id === a.dish)) { G.oven = { dish: a.dish, t: 0, dinged: false }; sfx('pop'); } }
        else G.oven = { dish: null, t: 0, dinged: false };
      }
      if (a.t >= PEEL_T) { G.peelAnim = null; if (a.kind === 'out') this.finishBread(a); this.refreshStation(); }
    }
    // Zia Pina loads a slice whenever one is needed and pulls it out right in the middle of golden
    if (this.baker && !G.peelAnim && !G.paused) {
      if (G.oven.dish) { if (G.oven.t >= (BREAD.ready + BREAD.done) / 2) this.takeOutBread(true); }
      else if (!G.peelBread) { const d = G.dishes.find(x => OVEN_STATION.match(x)); if (d) { G.peelBread = d.id; G.bakerWait = 0.6; } }
      else if ((G.bakerWait -= dt) <= 0) this.slideIn(true);
    }
  }

  drawPeel(g, u, bread) {
    const e = u * u * (3 - 2 * u), sc = 1 - 0.32 * e;
    const bx = 660, by = 590 - 122 * e;
    const h0 = this.baker ? [440, 520] : [810, 636];
    const hx = h0[0] + (bx - h0[0]) * 0.3 * e, hy = h0[1] - 92 * e;
    g.lineStyle(14, COL.ink, 1).lineBetween(bx, by + 10 * sc, hx, hy);
    g.lineStyle(9, 0xb07a45, 1).lineBetween(bx, by + 10 * sc, hx, hy);
    g.fillStyle(0x000000, 0.15).fillEllipse(bx + 4, by + 8, 168 * sc, 58 * sc);
    g.fillStyle(0xd9a066, 1).fillEllipse(bx, by, 168 * sc, 58 * sc);
    g.lineStyle(3, COL.ink, 1).strokeEllipse(bx, by, 168 * sc, 58 * sc);
    g.lineStyle(1.5, 0xb07a45, 0.8);
    for (const q of [-0.5, 0, 0.5]) g.lineBetween(bx - 60 * sc, by + q * 30 * sc, bx + 60 * sc, by + q * 30 * sc);
    if (bread) drawBread(g, bx, by - 6 * sc, 0.78 * sc, bread.tone);
    if (this.baker && this.pina) { g.fillStyle(Phaser.Display.Color.HexStringToColor(BAKER_LOOK.skin).color, 1).fillCircle(hx, hy, 9); g.lineStyle(2.5, COL.ink, 1).strokeCircle(hx, hy, 9); }
  }

  grabBread(p) {
    const G = this.G, d = this.current();
    if (G.paused) return;
    if (this.baker) { this.showToast('Zia Pina is minding the oven for you'); return; }
    if (G.peelBread || G.peelAnim) { this.showToast('Push the peel into the oven first'); return; }
    if (G.oven.dish) { this.showToast('The oven is busy. Take the bread out first'); return; }
    if (!d || !OVEN_STATION.match(d)) { this.showToast('No order needs garlic bread right now'); return; }
    G.heldBread = true; G.pointer.x = p.worldX; G.pointer.y = p.worldY; sfx('pop');
  }

  dropBread(x, y) {
    const G = this.G, d = this.current();
    G.heldBread = false;
    if (!d || !OVEN_STATION.match(d) || G.oven.dish) return;
    if (x > 540 && x < 820 && y > 360 && y < 640) { G.peelBread = d.id; sfx('pop'); this.showToast('Now push the peel into the oven!'); this.refreshStation(); }
    else this.showToast('Drop the bread on the wooden peel');
  }

  takeOutBread(auto) {
    const G = this.G, o = G.oven;
    if (!o.dish || G.peelAnim) return;
    // the bread is judged the moment you reach for it; the peel then fetches it
    const t = o.t;
    const score = t < BREAD.ready ? clamp(Math.round(10 - (BREAD.ready - t) * 2), 0, 10) : t > BREAD.done ? clamp(Math.round(10 - (t - BREAD.done) * 2.5), 0, 10) : 10;
    G.peelAnim = { kind: 'out', t: 0, dish: o.dish, score, tone: breadTone(t), auto };
    o.frozen = true; sfx('click');
    this.refreshStation();
  }

  finishBread(a) {
    const d = this.G.dishes.find(x => x.id === a.dish);
    if (!d) return;
    const t = a.tone, score = a.score;
    if (score < 10 && t < 0.6) d.notes.push('Garlic bread a little pale'); else if (t > 1.05) d.notes.push('Garlic bread burnt');
    d.bread = { score, tone: t };
    sfx(score >= 8 ? 'ding' : 'pop');
    if (!a.auto || this.G.station === 'oven') this.showToast(a.auto ? 'Zia Pina: golden garlic bread!' : score === 10 ? 'Golden garlic bread!' : score >= 5 ? 'Garlic bread is done' : 'Oops, that bread is not great');
  }

  drawOven(g, d) {
    const G = this.G, o = G.oven;
    // fire glow inside the mouth
    const fl = Math.sin(G.time * 9) * 0.5 + 0.5;
    g.fillStyle(0xff8a2a, 0.35 + fl * 0.15).fillEllipse(660, 470, 190, 70);
    g.fillStyle(0xffc14a, 0.35 + fl * 0.2).fillEllipse(660 + Math.sin(G.time * 5) * 8, 480, 120, 40);
    for (let i = 0; i < 5; i++) { const fx = 590 + i * 34, fh = 22 + ((i * 7 + Math.floor(G.time * 10)) % 5) * 5; g.fillStyle(i % 2 ? 0xff7a1a : 0xffb02a, 0.9).fillTriangle(fx - 10, 494, fx + 10, 494, fx, 494 - fh); }
    const bd = o.dish && G.dishes.find(x => x.id === o.dish);
    if (o.dish) drawBread(g, 660, 470, 0.68, breadTone(o.t));
    const a = G.peelAnim, carry = a ? (a.kind === 'in' ? !a.swapped : a.swapped) : !!G.peelBread;
    this.drawPeel(g, this.peelU(), carry ? { tone: a && a.kind === 'out' ? a.tone : 0.05 } : null);
    // toast meter
    const mx = 920, my0 = 250, mh = 290, v = o.dish ? Math.min(o.t, BREAD.max) / BREAD.max : 0;
    g.fillStyle(0xe8dec4, 1).fillRoundedRect(mx, my0, 40, mh, 10);
    g.fillStyle(COL.good, 0.45).fillRect(mx, my0 + mh * (1 - BREAD.done / BREAD.max), 40, mh * (BREAD.done - BREAD.ready) / BREAD.max);
    g.fillStyle(COL.bad, 0.25).fillRect(mx, my0 + 6, 40, mh * (1 - BREAD.done / BREAD.max) - 6);
    g.lineStyle(3, COL.ink, 1).strokeRoundedRect(mx, my0, 40, mh, 10);
    const fy = my0 + mh * (1 - v);
    if (v > 0) g.fillStyle(breadColor(breadTone(o.t)), 1).fillRoundedRect(mx + 5, fy, 30, my0 + mh - fy - 4, 8);
    g.lineStyle(3, COL.ink, 1).lineBetween(mx - 8, fy, mx + 48, fy);
    const cust = bd && G.customers.find(c => c.id === bd.customerId);
    const msg = this.baker ? (o.dish ? `Zia Pina is baking\n${cust ? cust.def.short + "'s" : 'the'} bread` : G.peelAnim ? 'Zia Pina is at\nthe oven' : 'Zia Pina is ready\nfor the next slice')
      : G.peelAnim ? (G.peelAnim.kind === 'in' ? 'In it goes!' : 'Out it comes!')
      : o.dish ? `${cust ? cust.def.short + "'s" : 'The'} bread\n${o.t < BREAD.ready ? 'Toasting...' : o.t <= BREAD.done ? 'Golden! Take it out' : 'Burning!'}`
      : G.peelBread ? 'Push the peel\ninto the oven!' : d && OVEN_STATION.match(d) ? 'Drag a slice of bread\nonto the wooden peel' : 'Nothing to bake';
    this.ovenText.setText(msg).setColor(o.dish && o.t > BREAD.done ? '#b8322a' : '#2b1a10');
    this.takeOutBtn.setEnabled(!!o.dish && !G.peelAnim).setFill(o.dish && o.t >= BREAD.ready && o.t <= BREAD.done ? COL.good : o.dish && o.t > BREAD.done ? COL.bad : COL.tomato);
    if (G.heldBread) drawBread(g, G.pointer.x, G.pointer.y, 0.8, 0.05);
  }

  // ----- station switching -----
  goStation(id) {
    const G = this.G;
    if (G.peelDrag) { G.peelDrag = null; this.slideIn(); }
    G.station = id; G.pouring = false; G.cranking = false; G.held = null; G.plateDrag = false; G.heldBread = false;
    for (const s of this.stations) { this.stationC[s.id].setVisible(s.id === id); this.tabs[s.id].setSelected(s.id === id); }
    const st = this.stations.find(s => s.id === id);
    const cur = G.dishes.find(d => d.id === G.selected);
    if ((st.stages.length || st.match) && !G.serving && (!cur || !stMatch(st, cur))) {
      const first = G.dishes.find(d => stMatch(st, d) && d.stage !== 'boiling') || G.dishes.find(d => stMatch(st, d));
      if (first) G.selected = first.id;
    }
    this.refreshStation();
    if (!SAVE.seen[id] && NONNA_TIPS[id]) { SAVE.seen[id] = true; writeSave(); this.nonna(NONNA_TIPS[id]); }
  }

  current() { return this.G.dishes.find(d => d.id === this.G.selected) || null; }

  refreshStation() {
    const G = this.G, d = this.current();
    this.refreshInfo();
    this.renderRail();
    if (G.station === 'dough') {
      this.cutBtns.forEach(b => b.setEnabled(!!(d && d.stage === 'dough' && d.thin > 5 && !d.rav)));
      const rav = !!(d && d.rav);
      this.ravC.setVisible(rav);
      this.doughLbls.forEach(t => t.setVisible(!rav)); this.pantryText.setVisible(!rav);
      this.ravZones.forEach(z => { z.input.enabled = rav; });
      if (rav) { this.ravSeal.setEnabled(d.rav.fills.some(v => v > 0.1)); this.ravTitle.setText(`${shapeName(d.rav.shape)}! Squeeze filling into each ${d.rav.shape === 'tortellini' ? 'circle' : 'square'}`); }
      const out = SAVE.pantry <= 0 && !this.daily;
      this.pantryText.setText(this.daily ? "Zia Lella brought her own flour" : out ? 'Out of dough!' : `Dough in the pantry: ${SAVE.pantry} plate${SAVE.pantry === 1 ? '' : 's'}`).setColor(out ? '#b8322a' : SAVE.pantry <= 2 && !this.daily ? '#a8681a' : '#2b1a10');
      this.rushBtn.setVisible(SAVE.pantry <= 2 && !rav && !this.daily).setLabel(`Rush delivery: ${RUSH_DELIVERY.plates} plates ${money(RUSH_DELIVERY.price)}`);
    }
    if (G.station === 'sauce') {
      const ok = d && d.stage === 'sauce';
      this.sauceDone.setEnabled(!!ok && d.sauceAmt > 0);
      this.sauceTip.setVisible(!!ok).setText(!ok ? '' : d.sauceId ? 'Hold the mouse on the pasta to pour' : 'Click the right sauce pot to pick up the spatula');
    }
    if (G.station === 'toppings') {
      const ok = d && d.stage === 'toppings';
      this.clearBtn.setEnabled(!!ok && d.placed.length > 0);
      this.finishBtn.setEnabled(!!ok && d.placed.length > 0);
      if (ok) {
        const lines = d.order.toppings.map(t => `${TOPPINGS.find(q => q.id === t.id).name}: ${d.placed.filter(p => p.id === t.id).length} of ${t.n}`);
        const extra = d.placed.filter(p => !d.order.toppings.some(t => t.id === p.id)).length;
        if (extra) lines.push(`Extras: ${extra}`);
        this.topCount.setText('On the plate\n' + lines.join('\n')).setVisible(true);
      } else this.topCount.setVisible(false);
    }
    if (G.station === 'serve') {
      const ok = d && d.stage === 'ready' && !G.serving;
      const cust = d && G.customers.find(c => c.id === d.customerId);
      this.serveHint.setText(ok ? `Drag the plate to ${cust.def.short}` : G.serving ? `${G.serving.cust.def.short} is tasting...` : 'No plate ready').setVisible(true);
    }
    this.updateHud();
  }

  updateHud() {
    const G = this.G;
    const served = G.customers.filter(c => c.served).length, left = G.customers.filter(c => c.walkedOut).length;
    this.hudServed.setText(`Served ${served}` + (left ? ` · ${left} left` : ''));
    if (G.dotdGoal) {
      const met = G.dotdSold >= G.dotdGoal;
      this.hudDotd.setVisible(true).setText(`${met ? '✓' : '★'} Dish of the day ${G.dotdSold}/${G.dotdGoal}`).setBackgroundColor(met ? '#9fd38c' : '#f6c453');
    }
    this.hudTips.setText('Tips ' + money(G.tips));
    this.hudClock.setText(clockText(G.time));
    const atCounter = G.queue.length && G.queue[0].atCounter ? G.queue.length : 0;
    const counts = {
      order: atCounter, dough: G.dishes.filter(d => d.stage === 'dough').length,
      boil: G.dishes.filter(d => d.stage === 'boil').length + G.pots.filter(p => p.dish && p.t >= BOIL.ready).length,
      sauce: G.dishes.filter(d => d.stage === 'sauce').length, toppings: G.dishes.filter(d => d.stage === 'toppings').length,
      serve: G.dishes.filter(d => d.stage === 'ready').length,
      oven: this.baker ? 0 : G.dishes.filter(d => OVEN_STATION.match(d)).length + (G.oven.dish && G.oven.t >= BREAD.ready ? 1 : 0),
    };
    for (const s of this.stations) this.tabs[s.id].badge.setText(counts[s.id] ? String(counts[s.id]) : '').setVisible(!!counts[s.id]);
  }

  showToast(msg, color) {
    this.toast.setText(msg).setBackgroundColor(color || '#f6c453');
    this.tweens.killTweensOf(this.toast);
    this.toast.setAlpha(1);
    this.tweens.add({ targets: this.toast, alpha: 0, delay: 2000, duration: 500 });
  }

  // ----- customers -----
  walkTo(c, x, y, then) { c.path = [{ x, y }]; c.onArrive = then || null; }

  // layer: 'stand' or 'seat0' / 'seat1' (back or front table row)
  setLayer(c, layer) {
    if (c.layer === layer) return;
    this.room[c.layer === 'stand' ? 'stand' : c.layer].remove(c.img);
    this.room[layer === 'stand' ? 'stand' : layer].add(c.img);
    c.layer = layer;
  }

  layoutQueue() {
    this.G.queue.forEach((c, i) => {
      const x = QUEUE_X[Math.min(i, QUEUE_X.length - 1)] - (i >= QUEUE_X.length ? (i - QUEUE_X.length + 1) * 40 : 0);
      c.atCounter = false;
      this.walkTo(c, x, FLOOR, () => {
        if (this.G.queue[0] === c) {
          c.atCounter = true; c.counterAt = this.G.time;
          if (this.G.station !== 'order') this.showToast(`${c.def.short} is waiting at the counter`);
          this.updateHud();
        }
      });
    });
  }

  clickCustomer(c) {
    const G = this.G;
    if (G.paused || G.dialog) return;
    if (G.queue[0] === c && c.atCounter && !c.path.length) this.startOrder(c);
  }

  startOrder(c) {
    const G = this.G;
    c.state = 'ordering'; c.orderStart = G.time;
    sfx('pop');
    G.dialog = { c, i: -1, t: 0, steps: [
      { who: 'chef', text: this.chef.greet, dur: 2.0 },
      { who: 'cust', text: c.def.lines.hello, dur: 2.8 },
      { who: 'cust', text: c.orderLine + (c.order.bread ? ' Oh, and a slice of garlic bread!' : ''), dur: 3.4, write: true },
      { who: 'chef', text: 'Got it! Coming right up!', dur: 1.5, write: true },
    ] };
    this.advanceDialog(false);
  }

  advanceDialog(skip) {
    const D = this.G.dialog;
    if (!D) return;
    if (skip && this.notepadOpen && this.notepadShown < this.notepadLines.length) { this.revealNotepad(true); return; }
    D.i++; D.t = 0;
    if (D.i >= D.steps.length) return this.finishOrder();
    const s = D.steps[D.i];
    this.custBubble.setVisible(false); this.chefBubble.setVisible(false);
    if (s.who === 'chef') this.chefBubble.say(s.text, 755, 300, 737);
    else this.custBubble.say(s.text, D.c.x + 40, 292, D.c.x);
    if (s.write && !this.notepadOpen) this.openNotepad(D.c);
  }

  openNotepad(c) {
    const n = this.notepad;
    n.removeAll(true);
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.25).fillRoundedRect(-112, -112, 230, 244, 6);
    g.fillStyle(0xfffdf4, 1).fillRoundedRect(-116, -118, 230, 244, 6);
    g.lineStyle(3, COL.ink, 1).strokeRoundedRect(-116, -118, 230, 244, 6);
    g.fillStyle(0xd9432f, 1).fillRect(-116, -118, 230, 16);
    g.lineStyle(1.5, 0x8fb3d9, 1);
    for (let y = -70; y < 120; y += 26) g.lineBetween(-106, y, 104, y);
    n.add(g);
    n.add(this.add.text(-104, -96, `Order #${this.G.nextDish} · ${c.def.short}${c.order.dotd ? ' ★' : ''}`, { fontFamily: FD, fontSize: '18px', fontStyle: '800', color: '#b8322a' }));
    this.notepadLines = orderLines(c.order).map((line, i) => {
      const t = this.add.text(-104, -68 + i * 26, line, { fontFamily: FH, fontSize: '19px', color: '#24345a', wordWrap: { width: 205 } }).setVisible(false);
      n.add(t); return t;
    });
    this.notepadMini = this.add.graphics(); n.add(this.notepadMini);
    this.notepadShown = 0; this.notepadOpen = true; this.notepadT = 0;
    n.setVisible(true).setScale(0.6).setAlpha(0).setPosition(1080, 318);
    this.tweens.add({ targets: n, scale: 1, alpha: 1, duration: 220, ease: 'Back.easeOut' });
    this.chefImg.setLook('write', 'happy');
  }

  revealNotepad(all) {
    while (this.notepadShown < this.notepadLines.length) {
      this.notepadLines[this.notepadShown++].setVisible(true);
      sfx('scribble');
      if (!all) break;
    }
    if (this.notepadShown >= this.notepadLines.length) { this.notepadMini.clear(); drawMiniPlate(this.notepadMini, 70, 86, 32, this.G.dialog ? this.G.dialog.c.order : { sauce: 'marinara', toppings: [] }); }
  }

  finishOrder() {
    const G = this.G, c = G.dialog.c;
    G.dialog = null;
    this.custBubble.setVisible(false); this.chefBubble.setVisible(false);
    this.chefImg.setLook('stand', 'happy');
    const idx = this.makeTicket(c), n = this.notepad;
    // ticket flies to the rail
    this.notepadOpen = false;
    this.tweens.add({ targets: n, x: railX(idx, G.dishes.length) + 73, y: 122, scale: 0.35, alpha: 0, duration: 450, ease: 'Quad.easeIn', onComplete: () => { n.setVisible(false); this.renderRail(); } });
    this.refreshStation();
  }

  // a new ticket on the rail; the customer heads for a seat
  makeTicket(c) {
    const G = this.G, order = c.order;
    const dish = { id: G.nextDish++, customerId: c.id, order, bread: null, stage: 'dough', thin: 0, crankAngle: 0, cutShape: null, pot: null, sauceId: null, sauceAmt: 0, sauceBlobs: [], placed: [], scores: {}, notes: [] };
    G.dishes.push(dish);
    c.dishId = dish.id; c.state = 'toSeat'; c.atCounter = false;
    if (!this.current()) G.selected = dish.id;
    const qi = G.queue.indexOf(c);
    if (qi >= 0) G.queue.splice(qi, 1);
    this.layoutQueue();
    if (!this.trySeat(c)) {
      const k = G.customers.filter(o => o.state === 'standing' || (o.state === 'toSeat' && o.seat == null)).length - 1;
      this.walkTo(c, OVERFLOW_X[Math.max(0, k) % OVERFLOW_X.length], FLOOR, () => { c.state = 'standing'; });
    }
    return G.dishes.length - 1;
  }

  // Matteo at the second register takes the order when someone has waited a few seconds
  quickOrder(c) {
    this.makeTicket(c);
    sfx('scribble');
    this.showToast(`Matteo took ${c.def.short}'s order`, '#cfe3c9');
    this.refreshStation();
  }

  trySeat(c) {
    const G = this.G;
    const seatIdx = this.seats.findIndex((s, i) => !G.customers.some(o => o.seat === i));
    if (seatIdx < 0) return false;
    const st = this.seats[seatIdx];
    c.seat = seatIdx; c.state = 'toSeat';
    const sit = () => { c.state = 'seated'; this.setLayer(c, 'seat' + st.row); c.y = TABLE_ROWS[st.row].seat; c.img.setScale(0.8 * c.s / ART_SCALE); };
    if (st.row === 0) this.walkTo(c, st.x, FLOOR, sit);
    else { c.path = [{ x: st.x, y: FLOOR }, { x: st.x, y: TABLE_ROWS[1].seat - 4 }]; c.onArrive = sit; }
    return true;
  }

  standUpAndLeave(c, angry) {
    const G = this.G;
    const front = c.layer === 'seat1';
    if (c.layer !== 'stand') { this.setLayer(c, 'stand'); c.y = front ? c.y : FLOOR; c.img.setScale(0.92 * c.s / ART_SCALE); }
    c.seat = null;
    c.state = angry ? 'leavingAngry' : 'leaving';
    const qi = G.queue.indexOf(c);
    if (qi >= 0) { G.queue.splice(qi, 1); this.layoutQueue(); }
    this.walkTo(c, DOOR_X, FLOOR, () => { c.state = 'gone'; sfx('bell'); });
    if (front || Math.abs(c.y - FLOOR) > 4) c.path.unshift({ x: c.x, y: FLOOR });
  }

  // ----- order dialog timing -----
  tickDialog(dt) {
    const D = this.G.dialog;
    if (!D) return;
    D.t += dt;
    const s = D.steps[D.i];
    if (this.notepadOpen && s.write) {
      this.notepadT += dt;
      if (this.notepadT > 0.5 && this.notepadShown < this.notepadLines.length) { this.notepadT = 0; this.revealNotepad(false); }
    }
    if (D.t >= s.dur && (!s.write || this.notepadShown >= this.notepadLines.length || D.i === D.steps.length - 1)) {
      if (D.i === D.steps.length - 1) this.revealNotepad(true);
      this.advanceDialog(false);
    }
  }

  // ----- cooking actions -----
  onCrankMove(p) {
    const G = this.G;
    if (!G.cranking || G.station !== 'dough' || G.paused) return;
    const d = this.current();
    if (!d || d.stage !== 'dough' || d.rav) return;
    const a = Phaser.Math.Angle.Between(740, 400, p.worldX, p.worldY);
    const delta = Phaser.Math.Angle.Wrap(a - G.lastAngle);
    G.lastAngle = a;
    d.thin = clamp(d.thin + Math.abs(delta) / (Math.PI * 2) * 15 * (SAVE.upgrades.machine ? 1.7 : 1), 0, 100);
    d.crankAngle += Math.abs(delta);
    if (d.thin > 5 && !this.cutBtns[0].enabled) this.refreshStation();
  }

  cut(shape) {
    const d = this.current();
    if (!d || d.stage !== 'dough' || d.rav) return;
    d.cutShape = shape;
    let s = bandScore(d.thin, DOUGH_BAND, 15, 0.6);
    if (shape !== d.order.shape) { s = 0; d.notes.push('Wrong pasta shape'); sfx('bad'); }
    else if (d.thin < DOUGH_BAND[0]) d.notes.push('Dough a little thick');
    else if (d.thin > DOUGH_BAND[1]) d.notes.push('Dough rolled too thin');
    d.scores.dough = s;
    if (!this.daily) SAVE.pantry = Math.max(0, SAVE.pantry - 1);
    if (shape === d.order.shape && (SHAPES.find(q => q.id === shape) || {}).filled) {
      d.rav = { fills: [0, 0, 0, 0, 0, 0], shape }; sfx('pop');
      this.showToast(`Now fill the ${shapeName(shape).toLowerCase()} with the piping bag`);
      if (!SAVE.seen[shape]) { SAVE.seen[shape] = true; writeSave(); this.nonna(FILL_TIP[shape] || FILL_TIP.ravioli, `Nonna shows you ${shapeName(shape).toLowerCase()}`); }
      this.refreshStation(); return;
    }
    d.stage = 'boil';
    this.cutPop(shape);
    this.showToast(`${SHAPES.find(q => q.id === shape).name} cut! Next: Boil (key ${this.keyOf('boil')})`);
    this.refreshStation();
  }

  // the freshly cut pasta pops up so you can see the shape you made
  cutPop(shape) {
    const pg = this.add.graphics();
    pg.fillStyle(0x000000, 0.18).fillCircle(4, 6, 66);
    pg.fillStyle(0xffffff, 1).fillCircle(0, 0, 66); pg.lineStyle(3, COL.ink, 0.8).strokeCircle(0, 0, 66);
    drawPasta(pg, 0, 0, 58, shape, 7);
    pg.setPosition(560, 400).setScale(0.3);
    this.stationC.dough.add(pg);
    this.tweens.add({ targets: pg, scale: 1, duration: 260, ease: 'Back.Out' });
    this.tweens.add({ targets: pg, alpha: 0, y: 330, delay: 1000, duration: 350, onComplete: () => pg.destroy() });
  }

  // piping bag: hold over a piece to squeeze filling in, let go when its dot turns green
  pieceAt(px, py) {
    const ix = Math.round((px - RAV.x) / RAV.s), iy = Math.round((py - RAV.y) / RAV.s);
    if (ix < 0 || ix > 2 || iy < 0 || iy > 1) return -1;
    const hs = RAV.s / 2 - 4;
    return Math.abs(px - (RAV.x + ix * RAV.s)) <= hs && Math.abs(py - (RAV.y + iy * RAV.s)) <= hs ? iy * 3 + ix : -1;
  }
  pipeTick(dt) {
    const G = this.G;
    if (!G.piping) return;
    const d = this.current();
    if (!d || !d.rav || G.station !== 'dough') { G.piping = false; return; }
    const p = this.input.activePointer;
    if (!p.isDown) { G.piping = false; return; }
    const i = this.pieceAt(p.worldX, p.worldY);
    if (i < 0) return;
    const f = d.rav.fills, before = f[i];
    f[i] = Math.min(FILL.max, f[i] + dt * FILL.rate);
    if (before === 0) this.refreshStation();
    if (before < FILL.lo && f[i] >= FILL.lo) sfx('pop');
    if (before <= FILL.hi && f[i] > FILL.hi) sfx('bad');
  }

  sealRavioli() {
    const d = this.current();
    if (!d || !d.rav) return;
    const f = d.rav.fills, good = f.filter(v => v >= FILL.lo && v <= FILL.hi).length;
    d.scores.dough = Math.round((d.scores.dough || 0) * (0.4 + 0.6 * good / 6));
    const nm = shapeName(d.rav.shape);
    if (f.some(v => v < 0.2)) d.notes.push(`Some ${nm.toLowerCase()} were empty`);
    else if (f.some(v => v < FILL.lo)) d.notes.push(`Some ${nm.toLowerCase()} needed more filling`);
    if (f.some(v => v > FILL.hi)) d.notes.push(`${nm} overstuffed`);
    const fs = d.rav.shape; d.rav = null; d.stage = 'boil';
    this.cutPop(fs);
    sfx(good === 6 ? 'ding' : 'pop');
    this.showToast(good === 6 ? `Perfect ${nm.toLowerCase()}! Next: Boil (key ${this.keyOf('boil')})` : `${nm} sealed. Next: Boil (key ${this.keyOf('boil')})`);
    this.refreshStation();
  }

  drainPot(i, auto) {
    const G = this.G, pot = G.pots[i], d = G.dishes.find(x => x.id === pot.dish);
    const t = pot.t;
    pot.dish = null; pot.t = 0; pot.dinged = false;
    if (!d) return;
    let s = 15;
    if (t < BOIL.ready) { s = clamp(Math.round(15 - (BOIL.ready - t) * 1.5), 0, 15); d.notes.push('Pasta undercooked'); }
    else if (t > BOIL.done) { s = clamp(Math.round(15 - (t - BOIL.done) * 1.5), 0, 15); d.notes.push(t >= BOIL.max ? 'Pasta boiled to mush' : 'Pasta overcooked'); }
    d.scores.boil = s; d.stage = 'sauce'; d.pot = null;
    if (auto) {
      const cust = G.customers.find(c => c.id === d.customerId);
      if (!this.current() || this.current().stage === 'boiling') G.selected = d.id;
      this.showToast(`Rocco drained ${cust ? cust.def.short + "'s" : 'the'} pasta. Ready for sauce!`, '#cfe3c9');
      sfx('pop');
    } else {
      G.selected = d.id;
      this.showToast(`${s === 15 ? 'Perfectly al dente!' : 'Drained.'} Next: Sauce (key ${this.keyOf('sauce')})`);
    }
  }

  potAction(i) {
    const G = this.G, pot = G.pots[i];
    if (pot.dish) this.drainPot(i, false);
    else {
      const d = this.current();
      if (!d || d.stage !== 'boil') return;
      d.stage = 'boiling'; d.pot = i;
      pot.dish = d.id; pot.t = 0; pot.dinged = false;
      const next = G.dishes.find(x => x.stage === 'boil');
      if (next) G.selected = next.id;
    }
    this.refreshStation();
  }

  chooseSauce(id) {
    const d = this.current();
    if (!d || d.stage !== 'sauce' || this.G.paused) return;
    if (d.sauceId && d.sauceId !== id && d.sauceAmt > 0) { d.sauceAmt = 0; d.sauceBlobs = []; }
    d.sauceId = id; sfx('pop');
    this.refreshStation();
  }

  finishSauce() {
    const d = this.current();
    if (!d || d.stage !== 'sauce') return;
    const inside = d.sauceBlobs.filter(b => Math.hypot(b.dx, b.dy) <= 0.62).length / Math.max(1, d.sauceBlobs.length);
    let s = bandScore(d.sauceAmt, SAUCE_BAND, 12, 0.5) + Math.round(8 * inside);
    if (d.sauceId !== d.order.sauce) { s = 0; d.notes.push('Wrong sauce'); sfx('bad'); }
    else {
      if (d.sauceAmt < SAUCE_BAND[0]) d.notes.push('Not enough sauce');
      else if (d.sauceAmt > SAUCE_BAND[1]) d.notes.push('Too much sauce');
      if (inside < 0.75) d.notes.push('Sauce spilled on the plate');
    }
    d.scores.sauce = s; d.stage = 'toppings';
    this.G.pouring = false;
    this.showToast(`Sauced! Next: Toppings (key ${this.keyOf('toppings')})`);
    this.refreshStation();
  }

  grabTopping(id, p) {
    const G = this.G, d = this.current();
    if (!d || d.stage !== 'toppings' || G.paused) { if (!G.paused) this.showToast('No plate is waiting for toppings'); return; }
    G.held = { id }; G.topping = id; G.pointer.x = p.worldX; G.pointer.y = p.worldY;
    sfx('pop');
  }

  grabPlaced(p) {
    const G = this.G, d = this.current();
    if (!d || d.stage !== 'toppings' || G.paused || G.held) return;
    const dx = (p.worldX - TP.x) / TP.r, dy = (p.worldY - TP.y) / TP.r;
    let best = -1, bd = 0.12;
    d.placed.forEach((q, i) => { const dd = Math.hypot(q.dx - dx, q.dy - dy); if (dd < bd) { bd = dd; best = i; } });
    if (best < 0) return;
    const [q] = d.placed.splice(best, 1);
    G.held = { id: q.id }; G.pointer.x = p.worldX; G.pointer.y = p.worldY;
    this.refreshStation();
  }

  dropTopping(x, y) {
    const G = this.G, d = this.current(), held = G.held;
    G.held = null;
    if (!held || !d || d.stage !== 'toppings') return;
    const dx = (x - TP.x) / TP.r, dy = (y - TP.y) / TP.r;
    if (dx * dx + dy * dy > 0.88 * 0.88) {
      // dropped off the plate: it falls away
      const g = this.add.graphics().setDepth(40); drawTopping(g, 0, 0, held.id, 1); g.setPosition(x, y);
      this.tweens.add({ targets: g, y: y + 60, alpha: 0, duration: 350, onComplete: () => g.destroy() });
      this.refreshStation();
      return;
    }
    d.placed.push({ id: held.id, dx, dy });
    const entry = d.order.toppings.find(t => t.id === held.id);
    const hit = entry && spotsFor(entry).some(([sx, sy]) => Math.hypot(sx - dx, sy - dy) < SPOT_TOL);
    sfx(hit ? 'star' : 'pop');
    if (hit) this.sparkle(x, y);
    this.refreshStation();
  }

  sparkle(x, y) {
    const g = this.add.graphics().setDepth(40);
    drawStar(g, 0, 0, 10, true);
    g.setPosition(x, y);
    this.tweens.add({ targets: g, y: y - 40, alpha: 0, scale: 1.6, duration: 500, onComplete: () => g.destroy() });
  }

  scoreToppings(d) {
    let countErr = 0, hits = 0, total = 0;
    for (const t of d.order.toppings) {
      const mine = d.placed.filter(p => p.id === t.id);
      countErr += Math.abs(t.n - mine.length);
      const used = new Set();
      for (const [sx, sy] of spotsFor(t)) {
        total++;
        let best = -1, bd = SPOT_TOL;
        mine.forEach((p, i) => { const dd = Math.hypot(p.dx - sx, p.dy - sy); if (!used.has(i) && dd < bd) { bd = dd; best = i; } });
        if (best >= 0) { used.add(best); hits++; }
      }
    }
    countErr += d.placed.filter(p => !d.order.toppings.some(t => t.id === p.id)).length;
    return { score: clamp(10 - countErr * 3, 0, 10) + Math.round(10 * hits / Math.max(1, total)), countErr, hits, total };
  }

  finishToppings() {
    const d = this.current();
    if (!d || d.stage !== 'toppings') return;
    const r = this.scoreToppings(d);
    d.scores.toppings = r.score;
    if (r.countErr) d.notes.push(r.countErr === 1 ? 'One topping off' : `${r.countErr} toppings off`);
    if (r.hits < r.total) d.notes.push('Toppings not where the ticket asked');
    d.stage = 'ready';
    this.showToast(`Plate ready! Serve it (key ${this.keyOf('serve')})`);
    this.refreshStation();
  }

  // ----- serving + review -----
  dropPlate(x, y) {
    const G = this.G;
    G.plateDrag = false;
    if (x > 280 && x < 840 && y > 300 && y < 660) this.serve(x, y);
    else { this.showToast('Carry the plate over to the table'); sfx('click'); }
  }

  serve(fx = 1090, fy = 494) {
    const G = this.G, d = this.current();
    if (!d || d.stage !== 'ready' || G.serving) return;
    const cust = G.customers.find(c => c.id === d.customerId);
    cust.beingServed = true;
    G.serving = { d, cust, phase: 'place', t: 0, fx, fy };
    d.stage = 'served';
    this.servePlateT = 0;
    sfx('serve');
    this.refreshStation();
  }

  tickServe(dt) {
    const S = this.G.serving;
    if (!S) return;
    S.t += dt;
    if (S.phase === 'place' && S.t > 0.5) { S.phase = 'taste'; S.t = 0; }
    else if (S.phase === 'taste' && S.t > 2.0) {
      S.phase = 'react'; S.t = 0;
      this.scoreDish(S);
      const L = S.cust.def.lines;
      const line = S.total >= 85 ? L.great : S.total >= 60 ? L.good : L.bad;
      this.serveBubble.say(line, 760, 330, 640);
      sfx(S.total >= 60 ? 'ding' : 'bad');
    } else if (S.phase === 'react' && S.t > 2.6) {
      this.serveBubble.setVisible(false);
      this.G.serving = null;
      this.showResults(S);
    }
  }

  scoreDish(S) {
    const G = this.G, { d, cust } = S;
    const waited = G.time - cust.arrive - (cust.orderTime || 0);
    const allow = cust.allow;
    const wait = waited <= 120 ? 30 : clamp(Math.round(30 - (waited - 120) / (allow - 120) * 30), 0, 30);
    if (wait < 20) d.notes.push(`Waited ${Math.round(waited)} seconds`);
    const sc = d.scores;
    S.parts = { pasta: (sc.dough || 0) + (sc.boil || 0), sauce: sc.sauce || 0, toppings: sc.toppings || 0, wait };
    let raw = S.parts.pasta + S.parts.sauce + S.parts.toppings + wait, max = 100;
    if (d.order.bread) {
      S.parts.bread = d.bread ? d.bread.score : 0;
      if (!d.bread) d.notes.push('Forgot the garlic bread');
      raw += S.parts.bread; max = 110;
    }
    S.total = Math.round(raw * 100 / max);
    S.stars = S.total >= 90 ? 5 : S.total >= 75 ? 4 : S.total >= 55 ? 3 : S.total >= 35 ? 2 : 1;
    const vis = !!cust.def.visitor, levelBefore = vis ? 0 : friendLevel(cust.key);
    S.tip = this.daily ? S.stars * DAILY_STAR : tipQ((0.5 + 3.5 * S.total / 100) * (1 + 0.04 * levelBefore) * tipBoost());
    S.gain = S.stars >= 5 ? 3 : S.stars === 4 ? 2 : S.stars === 3 ? 1 : 0;
    if (!vis) { const f = friendOf(cust.key); f.pts += S.gain; f.visits += 1; }
    S.levelBefore = levelBefore; S.levelAfter = vis ? 0 : friendLevel(cust.key);
    if (d.order.dotd && S.total >= 50) {
      S.dotdBonus = tipQ(0.5 + 0.25 * Math.min(SAVE.streak || 0, 4));
      S.tip = tipQ(S.tip + S.dotdBonus);
      G.dotdSold++;
      if (G.dotdSold === G.dotdGoal) this.time.delayedCall(400, () => this.showToast(`Nonna's goal reached! ${G.dotdGoal} dishes of the day served`, '#f6c453'));
    }
    // fresh food from Nonna's garden: one of each crop the plate calls for, if the basket has it
    if (!this.daily) {
      const fr = SAVE.fresh, used = CROPS.filter(c => fr[c.id] > 0 && freshWants(c.id, d.order, d));
      used.forEach(c => { fr[c.id]--; });
      if (used.length) {
        S.fresh = used; S.freshBonus = used.reduce((a, c) => a + c.bonus, 0);
        S.tip = tipQ(S.tip + S.freshBonus); G.fresh += S.freshBonus;
        SAVE.stats.freshUsed += used.length;
      }
    }
    S.sale = d.order.bread && d.bread && d.bread.score >= 3 ? BREAD_PRICE : 0;
    G.tips += S.tip; G.sales += S.sale;
    cust.served = S; cust.done = true; cust.hadBread = !!d.bread;
    G.results.push({ name: cust.def.short, key: cust.key, total: S.total, stars: S.stars, tip: S.tip });
    if (cust.def.critic) {
      S.criticStars = S.total >= 92 ? 5 : S.total >= 80 ? 4 : S.total >= 62 ? 3 : S.total >= 45 ? 2 : 1;
      this.writeReview(S.criticStars, false);
    }
  }

  writeReview(stars, walked) {
    const P = PAPER[stars];
    SAVE.paper = { day: this.dayN, stars, head: P.head, buzz: P.buzz, days: P.days, read: false,
      body: walked ? 'Our critic waited and waited, then left without a single bite. Noodle Rush has a long way to go.' : P.body };
  }

  // ----- overlays -----
  overlay(w, h) {
    this.overlays = (this.overlays || 0) + 1;
    this.G.paused = true; this.G.pouring = false; this.G.cranking = false;
    const c = this.add.container(0, 0).setDepth(100 + this.overlays);
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.55).fillRect(0, 0, W, H);
    g.fillStyle(0x000000, 0.25).fillRoundedRect(W / 2 - w / 2 + 5, H / 2 - h / 2 + 8, w, h, 22);
    g.fillStyle(0xfffaee, 1).fillRoundedRect(W / 2 - w / 2, H / 2 - h / 2, w, h, 22);
    g.lineStyle(4, COL.ink, 1).strokeRoundedRect(W / 2 - w / 2, H / 2 - h / 2, w, h, 22);
    c.add(g);
    c.add(this.add.zone(W / 2, H / 2, W, H).setInteractive());
    c.g = g;
    return c;
  }

  openPause() {
    const G = this.G;
    if (this.pauseC || G.ended) return;
    const c = this.pauseC = this.overlay(460, 420);
    c.add(this.add.text(W / 2, H / 2 - 168, 'Paused', { fontFamily: FD, fontSize: '40px', fontStyle: '800', color: '#2b1a10' }).setOrigin(0.5));
    c.add(makeButton(this, W / 2, H / 2 - 92, 300, 56, 'Resume', () => this.closePause(), { size: 24 }));
    const snd = makeButton(this, W / 2, H / 2 - 22, 300, 50, '', () => { SAVE.muted = !SAVE.muted; writeSave(); this.drawHudBtns(); c.refreshSound(); }, { fill: COL.basilMid, size: 20 });
    c.refreshSound = () => snd.setLabel(SAVE.muted ? 'Sound: off' : 'Sound: on');
    c.refreshSound(); c.add(snd);
    c.add(makeButton(this, W / 2, H / 2 + 42, 300, 50, 'Send feedback', () => { if (window.openFeedback) window.openFeedback(); }, { fill: COL.basilMid, size: 20 }));
    const quit = makeButton(this, W / 2, H / 2 + 106, 300, 50, 'Quit to title', () => {
      if (!quit.armed) { quit.armed = true; quit.setLabel('Quit? Today restarts'); return; }
      this.scene.start('title');
    }, { fill: COL.steelDark, size: 20 });
    c.add(quit);
    c.add(this.add.text(W / 2, H / 2 + 160, 'Esc or P to pause and resume', { fontFamily: FB, fontSize: '14px', fontStyle: '700', color: '#7d4a26' }).setOrigin(0.5));
  }

  closePause() { if (!this.pauseC) return; const c = this.pauseC; this.pauseC = null; this.closeOverlay(c); }

  closeOverlay(c) { this.tweens.killTweensOf(c.list); c.destroy(); this.overlays = Math.max(0, this.overlays - 1); this.G.paused = this.overlays > 0; this.G.lastNow = performance.now(); this.refreshStation(); }

  nonna(text, title) {
    const c = this.overlay(780, 290);
    c.add(addPerson(this, 'nonna', NONNA_LOOK, 360, H / 2 + 150, 1.0));
    c.add(this.add.text(460, H / 2 - 120, title || 'Nonna', { fontFamily: FD, fontSize: '28px', fontStyle: '800', color: '#b8322a' }));
    c.add(this.add.text(460, H / 2 - 80, text, { fontFamily: FB, fontSize: '19px', fontStyle: '700', color: '#2b1a10', wordWrap: { width: 440 }, lineSpacing: 5 }));
    c.add(makeButton(this, 880, H / 2 + 104, 160, 50, 'Got it', () => this.closeOverlay(c), { fill: COL.basilMid }));
  }

  showResults(S) {
    const { cust, d } = S;
    const c = this.overlay(700, 500), g = this.add.graphics();
    c.add(g);
    const x0 = W / 2 - 350, y0 = H / 2 - 250;
    const critic = !!cust.def.critic;
    c.add(addPerson(this, cust.key, cust.def.look, x0 + 120, y0 + 300, 1.0, 'stand', critic ? 'neutral' : S.total >= 85 ? 'love' : S.total >= 60 ? 'happy' : S.total >= 40 ? 'neutral' : 'sad'));
    drawPlate(g, x0 + 120, y0 + 390, 62, d, { force: true });
    c.add(this.add.text(x0 + 240, y0 + 26, critic ? `${cust.def.name}, food critic` : `${cust.def.name}'s review`, { fontFamily: FD, fontSize: '28px', fontStyle: '800', color: '#2b1a10' }));
    if (critic) c.add(this.add.text(x0 + 240, y0 + 76, 'She scribbles in her notebook and gives nothing away.\nHer review comes out in tomorrow\'s paper!', { fontFamily: FB, fontSize: '17px', fontStyle: '800', color: '#b8322a', lineSpacing: 4 }));
    for (let i = 0; i < 5 && !critic; i++) {
      const sx = x0 + 262 + i * 46;
      const star = this.add.graphics(); drawStar(star, 0, 0, 19, i < S.stars); star.setPosition(sx, y0 + 90).setScale(0);
      c.add(star);
      this.tweens.add({ targets: star, scale: 1, delay: 150 + i * 120, duration: 260, ease: 'Back.easeOut', onStart: () => { if (i < S.stars) sfx('star'); } });
    }
    if (!critic) c.add(this.add.text(x0 + 500, y0 + 90, `${S.total}%`, { fontFamily: FD, fontSize: '26px', fontStyle: '800', color: '#7d4a26' }).setOrigin(0, 0.5));
    const L = cust.def.lines;
    c.add(this.add.text(x0 + 240, y0 + 136, `"${S.total >= 85 ? L.great : S.total >= 60 ? L.good : L.bad}"`, { fontFamily: FH, fontSize: '21px', color: '#24345a', wordWrap: { width: 430 } }));
    const rows = [['Pasta', S.parts.pasta, 30], ['Sauce', S.parts.sauce, 20], ['Toppings', S.parts.toppings, 20], ['Wait', S.parts.wait, 30]];
    if (S.parts.bread != null) rows.push(['Garlic bread', S.parts.bread, 10]);
    const gap = rows.length > 4 ? 29 : 34;
    rows.forEach(([label, v, max], i) => {
      const y = y0 + 200 + i * gap;
      c.add(this.add.text(x0 + 240, y, label, { fontFamily: FB, fontSize: '18px', fontStyle: '800', color: '#2b1a10' }).setOrigin(0, 0.5));
      const st = Math.round(v / max * 5);
      for (let k = 0; k < 5; k++) drawStar(g, x0 + 350 + k * 26, y, 10, k < st);
      c.add(this.add.text(x0 + 492, y, `${v}/${max}`, { fontFamily: FB, fontSize: '16px', fontStyle: '800', color: '#7d4a26' }).setOrigin(0, 0.5));
    });
    if (d.notes.length) c.add(this.add.text(x0 + 240, y0 + 200 + rows.length * gap - 6, d.notes.slice(0, 3).join(' · '), { fontFamily: FB, fontSize: '14px', fontStyle: '700', color: '#b8322a', wordWrap: { width: 430 } }));
    // tip and friendship
    const tipWord = this.daily ? 'Reward ' : 'Tip ';
    const tipT = this.add.text(x0 + 240, y0 + 400, tipWord + money(0), { fontFamily: FD, fontSize: '30px', fontStyle: '800', color: '#2e7d32' }).setOrigin(0, 0.5);
    c.add(tipT);
    const counter = { v: 0 };
    this.tweens.add({ targets: counter, v: S.tip, duration: 900, delay: 800, onUpdate: () => { if (tipT.active) tipT.setText(tipWord + money(counter.v)); }, onComplete: () => { if (tipT.active) sfx('coin'); } });
    const extras = [];
    if (S.dotdBonus) extras.push(`★ includes ${money(S.dotdBonus)} dish of the day bonus`);
    if (S.sale) extras.push(`+ ${money(S.sale)} garlic bread`);
    if (S.freshBonus) extras.push(`Fresh ${S.fresh.map(q => q.one).join(', ')}: +${money(S.freshBonus)}`);
    if (this.daily) extras.push(`${S.stars} star${S.stars === 1 ? '' : 's'} × ${money(DAILY_STAR)} from Zia Lella`);
    if (extras.length) c.add(this.add.text(x0 + 242, y0 + 426, extras.join('\n'), { fontFamily: FB, fontSize: '14px', fontStyle: '800', color: '#7d4a26', lineSpacing: 1 }));
    const vis = !!cust.def.visitor;
    if (vis) c.add(this.add.text(x0 + 450, y0 + 384, cust.def.bio, { fontFamily: FB, fontSize: '14px', fontStyle: '800', color: '#7d4a26', wordWrap: { width: 220 } }));
    if (!critic && !vis) c.add(this.add.text(x0 + 450, y0 + 384, 'Friendship', { fontFamily: FB, fontSize: '14px', fontStyle: '800', color: '#7d4a26' }));
    for (let k = 0; k < 5 && !critic && !vis; k++) drawHeart(g, x0 + 462 + k * 26, y0 + 418, 10, k < S.levelAfter);
    if (critic || vis) {}
    else if (S.levelAfter > S.levelBefore) c.add(this.add.text(x0 + 600, y0 + 418, 'Level up!', { fontFamily: FD, fontSize: '16px', fontStyle: '800', color: '#e8434f' }).setOrigin(0, 0.5));
    else if (S.gain) c.add(this.add.text(x0 + 600, y0 + 418, `+${S.gain}`, { fontFamily: FD, fontSize: '16px', fontStyle: '800', color: '#e8434f' }).setOrigin(0, 0.5));
    c.add(makeButton(this, x0 + 560, y0 + 460, 200, 48, 'Back to work', () => {
      this.closeOverlay(c);
      cust.beingServed = false;
      cust.state = cust.seat != null ? 'eating' : 'leaving';
      cust.eatT = 14; cust.rating = S.total; cust.sauceColor = (SAUCES.find(q => q.id === d.sauceId) || {}).color;
      if (cust.seat == null) this.standUpAndLeave(cust, false);
      this.G.dishes = this.G.dishes.filter(x => x !== d);
      this.G.selected = (this.G.dishes.find(x => x.stage === 'ready') || this.G.dishes[0] || {}).id || null;
      this.servePlate.clear();
      this.refreshStation();
    }, { fill: COL.basilMid, size: 20 }));
  }

  // The Daily Dish ends after one plate: save the score, pay the reward and show the share card.
  endDaily() {
    const G = this.G;
    G.ended = true;
    const r = G.results[0], cust = G.customers[0];
    SAVE.daily = { date: this.dailyDate, n: dailyNumber(this.dailyDate), total: r ? r.total : 0, stars: r ? r.stars : 0, dish: dishName(cust.order), walked: !r, reward: G.tips };
    SAVE.bank = Math.round(((SAVE.bank || 0) + G.tips) * 100) / 100;
    SAVE.stats.dailies++;
    writeSave();
    this.overlays++;
    dailyCard(this, SAVE.daily, { done: () => this.scene.start('morning'), doneLabel: 'Back to the morning', fresh: true });
  }

  endDay() {
    const G = this.G;
    if (this.daily) return this.endDaily();
    G.ended = true;
    const served = G.results.length, left = G.customers.filter(x => x.walkedOut).length;
    const avg = served ? G.results.reduce((a, b) => a + b.stars, 0) / served : 0;
    // word of mouth: old buzz fades a day, a review written today starts new buzz
    SAVE.buzz.forEach(b => b.days--); SAVE.buzz = SAVE.buzz.filter(b => b.days > 0);
    const reviewed = SAVE.paper && SAVE.paper.day === this.dayN;
    if (reviewed) { if (SAVE.paper.buzz) SAVE.buzz.push({ delta: SAVE.paper.buzz, days: SAVE.paper.days, why: 'review' }); SAVE.criticDay = this.dayN + 3 + Math.floor(Math.random() * 3); }
    else if (SAVE.criticDay <= this.dayN) SAVE.criticDay = this.dayN + 2;
    // Nonna's dish of the day streak
    let gift = 0, streakMsg = '';
    if (G.dotdGoal) {
      if (G.dotdSold >= G.dotdGoal) {
        SAVE.streak = (SAVE.streak || 0) + 1;
        gift = STREAK_GIFT(SAVE.streak);
        streakMsg = gift ? `A ${SAVE.streak}-day streak! I slipped ${money(gift)} into the register.` : '';
      } else { if (SAVE.streak >= 2) streakMsg = `We missed the dish of the day goal, so our ${SAVE.streak}-day streak starts over.`; SAVE.streak = 0; }
    }
    SAVE.bank = Math.round(((SAVE.bank || 0) + G.tips + G.sales - G.spent - G.wage + gift) * 100) / 100;
    SAVE.lastDay = { day: this.dayN, tips: G.tips, sales: G.sales, spent: G.spent + G.wage - gift, served, left };
    SAVE.day = this.dayN + 1;
    const st = SAVE.stats;
    st.daysFinished++;
    st.history.push({ day: this.dayN, served, left, avg: Math.round(avg * 10) / 10, tips: Math.round(G.tips * 100) / 100, dotd: G.dotdGoal ? `${G.dotdSold}/${G.dotdGoal}` : '-', crowd: G.customers.length, at: Date.now() });
    if (st.history.length > 60) st.history.shift();
    writeSave();
    const c = this.overlay(800, 580), g = this.add.graphics();
    c.add(g);
    const x0 = W / 2 - 400, y0 = H / 2 - 290;
    c.add(this.add.text(W / 2, y0 + 44, `Day ${this.dayN} complete`, { fontFamily: FD, fontSize: '40px', fontStyle: '800', color: '#2b1a10' }).setOrigin(0.5));
    c.add(this.add.text(W / 2, y0 + 82, this.cfg.title, { fontFamily: FH, fontSize: '22px', color: '#7d4a26' }).setOrigin(0.5));
    const rows = [['Customers served', String(served)], ['Walked out', String(left)], ['Average rating', ''], ['Tips', money(G.tips)]];
    if (SAVE.upgrades.garlic) rows.push(['Garlic bread sales', money(G.sales)]);
    if (G.dotdGoal) rows.push([`★ Dish of the day ${Math.min(G.dotdSold, 99)}/${G.dotdGoal}`, G.dotdSold >= G.dotdGoal ? `Streak ${SAVE.streak}` : 'Streak 0']);
    if (G.spent) rows.push(['Rush deliveries', '-' + money(G.spent)]);
    if (G.wage) rows.push([SAVE.upgrades.cook && SAVE.upgrades.baker ? 'Staff wages' : SAVE.upgrades.cook ? "Rocco's wage" : "Zia Pina's wage", '-' + money(G.wage)]);
    if (gift) rows.push(["Nonna's streak gift", '+' + money(gift)]);
    rows.push(['Restaurant savings', money(SAVE.bank)]);
    const rg = rows.length > 7 ? 27 : 33;
    rows.forEach(([k, v], i) => {
      const y = y0 + 120 + i * rg;
      c.add(this.add.text(x0 + 60, y, k, { fontFamily: FB, fontSize: '19px', fontStyle: '700', color: '#7d4a26' }));
      if (v) c.add(this.add.text(x0 + 400, y, v, { fontFamily: FD, fontSize: '21px', fontStyle: '800', color: i === rows.length - 1 ? '#2e7d32' : '#2b1a10' }).setOrigin(1, 0));
      else for (let s = 0; s < 5; s++) drawStar(g, x0 + 272 + s * 28, y + 13, 11, s < Math.round(avg));
    });
    c.add(this.add.text(x0 + 460, y0 + 116, 'Friendships', { fontFamily: FD, fontSize: '22px', fontStyle: '800', color: '#2b1a10' }));
    const met = [...new Set(G.customers.filter(x => !x.def.critic && !x.def.visitor && (x.served || x.walkedOut)).map(x => x.key))];
    const nVis = G.customers.filter(x => x.def.visitor && (x.served || x.walkedOut)).length;
    if (nVis) c.add(this.add.text(x0 + 460, y0 + 158 + Math.min(met.length, 7) * 32 - 12, `+ ${nVis} visitor${nVis > 1 ? 's' : ''} from out of town`, { fontFamily: FB, fontSize: '15px', fontStyle: '800', color: '#7d4a26' }));
    met.slice(0, 7).forEach((key, i) => {
      const def = TOWNSFOLK[key], y = y0 + 158 + i * 32;
      c.add(this.add.image(x0 + 480, y, tex(this, 'portrait_' + key, () => portraitCanvas(def.look, 96, '#f3e2bf'))).setScale(32 / (96 * ART_SCALE)));
      c.add(this.add.text(x0 + 504, y, def.short, { fontFamily: FB, fontSize: '17px', fontStyle: '800', color: '#2b1a10' }).setOrigin(0, 0.5));
      const lv = friendLevel(key);
      for (let k = 0; k < 5; k++) drawHeart(g, x0 + 600 + k * 22, y, 8, k < lv);
    });
    let say = left > served ? 'Too many hungry people walked out today. Tomorrow we move faster, sì?' : avg >= 4.5 ? 'Brava! The whole town will be talking about us.' : avg >= 3.5 ? 'Good work, tesoro. Tomorrow, even better.' : served ? 'Every great cook burns a few noodles. We practice tomorrow.' : 'Nobody ate today. We try again, sì?';
    if (reviewed) say += ' And the critic came! We will read her review in the morning paper.';
    if (streakMsg) say += ' ' + streakMsg;
    if (G.fresh) say += ` Our garden added ${money(G.fresh)} to the tips!`;
    const nextU = UNLOCKS.find(u => u.day === this.dayN + 1);
    const nextCh = nextU && isChapterStart(nextU) ? CHAPTERS.find(q => q.start === nextU.day) : null;
    if (nextCh) say += ` Tomorrow we travel to ${nextCh.name}! Pack your apron.`;
    else if (nextU && nextU.day > 1) say += ` Tomorrow I teach you something new for the recipe book!`;
    c.add(addPerson(this, 'nonna', NONNA_LOOK, x0 + 110, y0 + 540, 0.78));
    c.add(this.add.text(x0 + 180, y0 + 400, `Nonna: "${say}"`, { fontFamily: FB, fontSize: '19px', fontStyle: '800', color: '#b8322a', wordWrap: { width: 580 } }));
    c.add(makeButton(this, x0 + 640, y0 + 522, 250, 56, 'Next morning', () => this.scene.start('morning'), { size: 24 }));
    c.add(makeButton(this, x0 + 400, y0 + 522, 190, 50, 'Title screen', () => this.scene.start('title'), { fill: COL.basilMid, size: 20 }));
  }

  // ----- per-frame -----
  update() {
    const G = this.G;
    const now = performance.now();
    const dt = G.lastNow ? Math.min(now - G.lastNow, 250) / 1000 : 0;
    G.lastNow = now;
    if (!G.paused && !G.ended) this.tick(dt);
    this.drawStation();
    this.drawPatience();
    G.railTimer += dt;
    if (G.railTimer > 0.25) { G.railTimer = 0; if (this.railSig() !== this.lastSig) this.renderRail(); this.updateHud(); }
  }

  tick(dt) {
    const G = this.G;
    G.time += dt;
    this.pipeTick(dt);
    this.tickDialog(dt);
    this.tickServe(dt);
    for (const c of G.customers) {
      if (c.state === 'coming' && G.time >= c.arrive) {
        c.state = 'queue'; c.x = DOOR_X; c.y = FLOOR; c.alpha = 0;
        c.img.setVisible(true);
        G.queue.push(c); this.layoutQueue();
        sfx('bell'); this.showToast(`${c.def.short} walked in!`);
      }
      if (c.state === 'ordering') c.orderTime = (c.orderTime || 0) + dt;
      if (c.alpha < 1 && c.state !== 'gone') c.alpha = Math.min(1, c.alpha + dt * 2.5);
      if (c.state === 'gone') c.alpha = Math.max(0, c.alpha - dt * 3);
      // movement
      if (c.path.length) {
        const p = c.path[0], dx = p.x - c.x, dy = p.y - c.y, dd = Math.hypot(dx, dy), step = 165 * dt;
        c.moving = true; c.ft += dt;
        if (dd <= step) { c.x = p.x; c.y = p.y; c.path.shift(); if (!c.path.length && c.onArrive) { const f = c.onArrive; c.onArrive = null; f(); } }
        else { c.x += dx / dd * step; c.y += dy / dd * step; }
      } else c.moving = false;
      // patience
      const waiting = ['queue', 'toSeat', 'seated', 'standing'].includes(c.state) && !c.beingServed && !c.done;
      if (waiting) {
        c.patience = clamp(1 - (G.time - c.arrive - (c.orderTime || 0)) / c.allow, 0, 1);
        if (c.patience <= 0) {
          c.walkedOut = true; c.done = true;
          const d = G.dishes.find(x => x.customerId === c.id);
          if (d) { if (d.pot != null) { const p = G.pots[d.pot]; p.dish = null; p.t = 0; } if (G.oven.dish === d.id) G.oven = { dish: null, t: 0, dinged: false }; if (G.peelBread === d.id) G.peelBread = null; G.dishes = G.dishes.filter(x => x !== d); if (G.selected === d.id) G.selected = null; }
          if (!c.def.visitor) { const f = friendOf(c.key); f.pts = Math.max(0, f.pts - 1); }
          if (c.def.critic) this.writeReview(1, true);
          this.showToast(`${c.def.short}: "${c.def.lines.angry}"`, '#f08a7a'); sfx('bad');
          this.standUpAndLeave(c, true);
          this.refreshStation();
        }
      }
      if (c.state === 'eating') { c.eatT -= dt; if (c.eatT <= 0) this.standUpAndLeave(c, false); }
      if (c.state === 'standing' && !c.done && !c.beingServed) this.trySeat(c);
    }
    const boilRate = SAVE.upgrades.fastpot ? 1.3 : 1;
    G.pots.forEach((p, i) => {
      if (!p.dish) return;
      p.t += dt * boilRate;
      if (p.t >= BOIL.ready && !p.dinged) { p.dinged = true; if (!SAVE.upgrades.cook) sfx('ding'); }
      if (SAVE.upgrades.cook && p.t >= BOIL.ready + 1.5) { this.drainPot(i, true); this.refreshStation(); }
    });
    // Matteo takes the order once someone has waited at the counter for a few seconds
    const head = G.queue[0];
    if (SAVE.upgrades.register2 && head && head.atCounter && !head.path.length && !G.dialog && G.time - (head.counterAt || G.time) > 4) this.quickOrder(head);
    if (G.oven.dish && !G.oven.frozen) { G.oven.t += dt; if (G.oven.t >= BREAD.ready && !G.oven.dinged) { G.oven.dinged = true; if (!this.baker) { sfx('ding'); if (G.station !== 'oven') this.showToast('The garlic bread is golden! (Oven)'); } } }
    this.tickPeel(dt);
    if (G.pouring && G.station === 'sauce') {
      const d = this.current();
      if (d && d.stage === 'sauce' && d.sauceId) {
        d.sauceAmt = clamp(d.sauceAmt + 34 * dt, 0, 120);
        d.pourT = (d.pourT || 0) + dt;
        while (d.pourT > 0.045 && d.sauceBlobs.length < 220) {
          d.pourT -= 0.045;
          const R = Math.random;
          d.sauceBlobs.push({ dx: (G.pointer.x - 600) / 140 + (R() - 0.5) * 0.12, dy: (G.pointer.y - 410) / 140 + (R() - 0.5) * 0.12, r: 0.07 + R() * 0.06 });
        }
        if (!this.sauceDone.enabled) this.refreshStation();
      }
    }
    if (!G.ended && G.endTimer == null && G.customers.every(c => c.done)) G.endTimer = 3.5;
    if (G.endTimer != null && !G.ended) { G.endTimer -= dt; if (G.endTimer <= 0) this.endDay(); }
  }

  custMood(c) {
    if (c.state === 'leavingAngry') return 'angry';
    if (c.state === 'eating') return Math.floor(c.eatT * 2.5) % 2 ? 'eat' : 'delight';
    if (c.state === 'leaving') return c.rating >= 60 || c.rating == null ? 'happy' : 'neutral';
    if (c.state === 'ordering') return 'happy';
    return c.patience > 0.55 ? 'happy' : c.patience > 0.28 ? 'neutral' : 'sad';
  }

  drawStation() {
    const G = this.G, g = this.dyn[G.station], d = this.current();
    g.clear();
    if (G.station === 'order') this.drawOrderRoom(g);
    if (G.station === 'dough') this.drawDough(g, d);
    if (G.station === 'boil') this.drawBoil(g, d);
    if (G.station === 'sauce') this.drawSauce(g, d);
    if (G.station === 'toppings') this.drawToppings(g, d);
    if (G.station === 'serve') this.drawServe(g, d);
    if (G.station === 'oven') this.drawOven(g, d);
  }

  drawOrderRoom(g) {
    const G = this.G;
    this.room.plates0.clear(); this.room.plates1.clear();
    for (const c of G.customers) {
      const img = c.img;
      img.input.enabled = G.queue[0] === c;
      if (c.state === 'coming' || (c.state === 'gone' && c.alpha <= 0)) { img.setVisible(false); continue; }
      img.setVisible(true).setAlpha(c.alpha).setPosition(c.x, c.y);
      const pose = c.moving ? (Math.floor(c.ft / 0.18) % 2 ? 'walk1' : 'walk2') : 'stand';
      img.setLook(pose, this.custMood(c));
      img.setFlipX(false);
      if (c.state === 'eating' && c.seat != null) {
        const st = this.seats[c.seat], pg = this.room['plates' + st.row], py = TABLE_ROWS[st.row].top + 10;
        const left = Math.max(0.25, c.eatT / 14);
        pg.fillStyle(0xffffff, 1).fillEllipse(st.x, py, 68, 20);
        pg.lineStyle(2, COL.ink, 0.8).strokeEllipse(st.x, py, 68, 20);
        pg.fillStyle(COL.pasta, 1).fillEllipse(st.x, py - 2, 44 * left, 12 * left);
        if (c.sauceColor != null) pg.fillStyle(c.sauceColor, 1).fillEllipse(st.x, py - 3, 24 * left, 7 * left);
        if (c.hadBread) drawBread(pg, st.x + (st.x > this.seats[c.seat ^ 1].x ? 30 : -30), py + 4, 0.3, 0.75);
      }
      // patience bubble over waiting customers
      if (['queue', 'toSeat', 'seated', 'standing'].includes(c.state) && !c.done && !c.beingServed) {
        const hy = c.y - (c.layer !== 'stand' ? 0.8 : 0.92) * c.s * 236;
        const col = c.patience > 0.55 ? COL.good : c.patience > 0.28 ? COL.warn : COL.bad;
        const bx = Math.min(c.x + 44, W - 18);
        g.fillStyle(0xffffff, 1).fillCircle(bx, hy, 13);
        g.lineStyle(2.5, COL.ink, 1).strokeCircle(bx, hy, 13);
        g.fillStyle(col, 1).slice(bx, hy, 10, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * c.patience, false).fillPath();
      }
    }
    // order prompt on the customer at the counter
    const first = G.queue[0];
    const prompt = first && first.atCounter && !first.path.length && !G.dialog;
    if (prompt) {
      const bob = Math.sin(G.time * 6) * 5, hx = first.x, hy = first.y - 0.92 * first.s * 236 - 30 + bob;
      g.fillStyle(0xffffff, 1).fillRoundedRect(hx - 18, hy - 22, 36, 38, 10);
      g.lineStyle(3, COL.ink, 1).strokeRoundedRect(hx - 18, hy - 22, 36, 38, 10);
      g.fillStyle(COL.tomato, 1).fillRect(hx - 3.5, hy - 14, 7, 16).fillCircle(hx, hy + 8, 4);
    }
    if (prompt) this.counterHint.setText(`Click ${first.def.short} to take the order`).setVisible(true).setPosition(first.x, first.y - 0.92 * first.s * 236 - 74);
    else if (G.dialog) this.counterHint.setText('Click anywhere to skip ahead').setVisible(true).setPosition(640, 600);
    else this.counterHint.setVisible(false);
    if (G.dialog) this.chefImg.setLook(G.dialog.steps[G.dialog.i] && G.dialog.steps[G.dialog.i].write ? 'write' : 'stand', 'happy');
  }

  drawDough(g, d) {
    const thin = d && d.stage === 'dough' ? d.thin : 0;
    const ang = d ? d.crankAngle : 0;
    g.lineStyle(3, COL.ink, 1);
    g.fillStyle(COL.steelDark, 1).fillRoundedRect(440, 330, 240, 150, 14).strokeRoundedRect(440, 330, 240, 150, 14);
    g.fillStyle(COL.steel, 1).fillRoundedRect(450, 340, 220, 130, 10);
    g.fillStyle(0x9aa1a8, 1).fillRect(460, 384, 200, 20).fillRect(460, 410, 200, 20);
    g.fillStyle(COL.steelDark, 1).fillRect(470, 480, 30, 74).fillRect(620, 480, 30, 74);
    if (d && d.stage === 'dough') {
      g.fillStyle(COL.pasta, 1).fillRoundedRect(480, 250 + thin * 0.4, 160, 100 - thin * 0.4, 10);
      g.lineStyle(2.5, COL.ink, 0.8).strokeRoundedRect(480, 250 + thin * 0.4, 160, 100 - thin * 0.4, 10);
      g.fillStyle(0xffffff, 0.25).fillRect(490, 260 + thin * 0.4, 140, 6);
      const outH = 10 + thin * 1.1;
      g.fillStyle(COL.pasta, 1).fillRect(480, 440, 160, Math.min(outH, 110));
      g.lineStyle(2.5, COL.ink, 0.8).strokeRect(480, 440, 160, Math.min(outH, 110));
    }
    if (d && d.rav) { this.drawRavioli(g, d); return; }
    const cx = 740, cy = 400, hx = cx + Math.cos(ang) * 80, hy = cy + Math.sin(ang) * 80;
    g.lineStyle(3, 0x7d4a26, 0.35).strokeCircle(cx, cy, 80);
    g.lineStyle(16, COL.ink, 1).lineBetween(680, 400, cx, cy).lineBetween(cx, cy, hx, hy);
    g.lineStyle(11, COL.steel, 1).lineBetween(680, 400, cx, cy).lineBetween(cx, cy, hx, hy);
    g.fillStyle(COL.steelDark, 1).fillCircle(cx, cy, 20); g.lineStyle(3, COL.ink, 1).strokeCircle(cx, cy, 20);
    g.fillStyle(COL.wood, 1).fillCircle(hx, hy, 24); g.strokeCircle(hx, hy, 24);
    g.fillStyle(0xffffff, 0.25).fillCircle(hx - 6, hy - 6, 8);
    const mx = 880, my0 = 250, mh = 290;
    g.fillStyle(0xe8dec4, 1).fillRoundedRect(mx, my0, 40, mh, 10);
    g.fillStyle(COL.good, 0.4).fillRect(mx, my0 + mh * (1 - DOUGH_BAND[1] / 100), 40, mh * (DOUGH_BAND[1] - DOUGH_BAND[0]) / 100);
    g.lineStyle(3, COL.ink, 1).strokeRoundedRect(mx, my0, 40, mh, 10);
    const fy = my0 + mh * (1 - thin / 100);
    g.fillStyle(thin >= DOUGH_BAND[0] && thin <= DOUGH_BAND[1] ? COL.good : thin > DOUGH_BAND[1] ? COL.bad : COL.pastaDark, 1).fillRoundedRect(mx + 5, fy, 30, my0 + mh - fy - 4, 8);
    g.lineStyle(3, COL.ink, 1).lineBetween(mx - 8, fy, mx + 48, fy);
  }

  drawRoccoStir(g) {
    const R = this.rocco, G = this.G;
    if (!R) return;
    // the pot closest to done gets his attention
    let best = -1, bt = -1;
    G.pots.forEach((p, i) => { if (p.dish && p.t > bt) { bt = p.t; best = i; } });
    const tx = best < 0 ? this.roccoSpot(0) : this.roccoSpot(best);
    R.x += (tx - R.x) * 0.12;
    if (best < 0 || Math.abs(R.x - tx) > 12) return;
    const k = this.potK, px = this.potX[best], t = G.time * 4;
    const rs = this.roccoS, side = px > R.x ? 1 : -1, hx = R.x + side * 34 * rs, hy = R.y - PERSON_FEET * rs * 0.42;
    const sx = px + Math.cos(t) * 26 * k, sy = 400 - 56 * k + Math.sin(t) * 6 * k;
    // the spoon goes behind his hand and into the water
    g.lineStyle(9, COL.ink, 1).lineBetween(hx, hy, sx, sy);
    g.lineStyle(5.5, 0xb07a45, 1).lineBetween(hx, hy, sx, sy);
    g.fillStyle(0xb07a45, 1).fillEllipse(sx, sy, 22 * k + 6, 12 * k + 4); g.lineStyle(2, COL.ink, 1).strokeEllipse(sx, sy, 22 * k + 6, 12 * k + 4);
    g.fillStyle(0xfbfbf7, 1).fillCircle(hx, hy, 11); g.lineStyle(2.5, COL.ink, 1).strokeCircle(hx, hy, 11);
    g.fillStyle(Phaser.Display.Color.HexStringToColor(ROCCO_LOOK.skin).color, 1).fillCircle(hx + side * 5, hy - 2, 7);
    g.lineStyle(2, COL.ink, 1).strokeCircle(hx + side * 5, hy - 2, 7);
  }

  drawRavioli(g, d) {
    const x0 = RAV.x - RAV.s / 2 - 20, y0 = RAV.y - RAV.s / 2 - 20, w = RAV.s * 3 + 40, h = RAV.s * 2 + 40;
    g.fillStyle(0x000000, 0.2).fillRoundedRect(x0 + 4, y0 + 6, w, h, 16);
    g.fillStyle(0xc89a62, 1).fillRoundedRect(x0, y0, w, h, 16);
    g.lineStyle(3, COL.ink, 1).strokeRoundedRect(x0, y0, w, h, 16);
    g.fillStyle(0xf2d38c, 1).fillRoundedRect(x0 + 12, y0 + 12, w - 24, h - 24, 8);
    d.rav.fills.forEach((n, i) => {
      const cx = RAV.x + (i % 3) * RAV.s, cy = RAV.y + Math.floor(i / 3) * RAV.s, hs = RAV.s / 2 - 8;
      if (d.rav.shape === 'tortellini') { g.fillStyle(0xf8dc98, 1).fillCircle(cx, cy, hs); g.lineStyle(2, 0xc9a25a, 1).strokeCircle(cx, cy, hs); }
      else {
        g.lineStyle(2, 0xc9a25a, 1).strokeRect(cx - hs, cy - hs, hs * 2, hs * 2);
        for (let k = -hs; k <= hs; k += 9) g.fillStyle(0xd9b56e, 1).fillCircle(cx + k, cy - hs, 2).fillCircle(cx + k, cy + hs, 2).fillCircle(cx - hs, cy + k, 2).fillCircle(cx + hs, cy + k, 2);
      }
      if (n > 0.02) {
        const r = 6 + n * 18;
        g.fillStyle(0xf7f3e6, 1).fillEllipse(cx, cy, r * 2, r * 1.6);
        g.fillStyle(0x3f8f3a, 1); for (let q = 0; q < Math.round(1 + n * 4); q++) g.fillCircle(cx - r * 0.6 + ((q * 37) % 10) / 10 * r * 1.2, cy - r * 0.4 + ((q * 53) % 10) / 10 * r * 0.8, 2.4);
        g.lineStyle(2, COL.ink, 0.5).strokeEllipse(cx, cy, r * 2, r * 1.6);
      }
      // status dot with a fill ring: yellow means keep going, green means stop, red means too much
      const dx = cx + hs - 11, dy = cy - hs + 11, col = n > FILL.hi ? COL.bad : n >= FILL.lo ? COL.good : 0xe8b640;
      g.fillStyle(0xfffaee, 1).fillCircle(dx, dy, 9); g.lineStyle(1.5, COL.ink, 0.5).strokeCircle(dx, dy, 9);
      if (n > 0.02) {
        g.lineStyle(4, col, 1); g.beginPath(); g.arc(dx, dy, 9, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, n / FILL.hi), false); g.strokePath();
        if (n >= FILL.lo) g.fillStyle(col, 1).fillCircle(dx, dy, 5);
      }
    });
    this.drawPipingBag(g, x0, y0, w, h);
  }

  drawPipingBag(g, x0, y0, w, h) {
    const G = this.G, p = this.input.activePointer;
    let px = p.worldX, py = p.worldY;
    if (!(px > x0 && px < x0 + w && py > y0 && py < y0 + h) && !G.piping) { px = x0 + w + 40; py = y0 + h - 30; }
    const sq = G.piping ? 0.8 : 1, t = G.time;
    // a stream of filling while squeezing
    if (G.piping) { g.fillStyle(0xf7f3e6, 1).fillCircle(px, py + 2, 5 + Math.sin(t * 30) * 1.2); g.lineStyle(1.5, COL.ink, 0.4).strokeCircle(px, py + 2, 5); }
    const tipY = py - 4, topY = tipY - 78, half = 26 * sq;
    g.fillStyle(0x000000, 0.15).fillTriangle(px + 6, tipY + 6, px + 6 - half - 4, topY + 10, px + 6 + half + 4, topY + 10);
    g.fillStyle(0xdfe7ea, 1).fillTriangle(px, tipY, px - half, topY, px + half, topY);
    g.lineStyle(3, COL.ink, 0.9).strokeTriangle(px, tipY, px - half, topY, px + half, topY);
    g.fillStyle(0xf7f3e6, 0.9).fillTriangle(px, tipY - 14, px - half * 0.6, topY + 22, px + half * 0.6, topY + 22);
    g.fillStyle(0x9aa1a8, 1).fillTriangle(px, tipY + 6, px - 6, tipY - 8, px + 6, tipY - 8);
    g.lineStyle(2, COL.ink, 0.9).strokeTriangle(px, tipY + 6, px - 6, tipY - 8, px + 6, tipY - 8);
    g.fillStyle(0xdfe7ea, 1).fillEllipse(px, topY - 6, 20 * sq, 14);
    g.lineStyle(2.5, COL.ink, 0.9).strokeEllipse(px, topY - 6, 20 * sq, 14);
  }

  drawBoil(g, d) {
    const G = this.G;
    const k = this.potK;
    this.drawRoccoStir(g);
    this.potX.forEach((x, i) => {
      const pot = G.pots[i], y = 400, total = BOIL.max, a0 = -Math.PI / 2, A = v => a0 + (v / total) * Math.PI * 2, RR = 130 * k;
      g.lineStyle(16 * k, COL.pasta, 0.6); g.beginPath(); g.arc(x, y, RR, A(0), A(BOIL.ready), false); g.strokePath();
      g.lineStyle(16 * k, COL.good, 0.9); g.beginPath(); g.arc(x, y, RR, A(BOIL.ready), A(BOIL.done), false); g.strokePath();
      g.lineStyle(16 * k, COL.bad, 0.7); g.beginPath(); g.arc(x, y, RR, A(BOIL.done), A(total), false); g.strokePath();
      g.fillStyle(0x5b6168, 1).fillRoundedRect(x - 100 * k, y - 60 * k, 200 * k, 150 * k, { tl: 10, tr: 10, bl: 30, br: 30 });
      g.lineStyle(3, COL.ink, 1).strokeRoundedRect(x - 100 * k, y - 60 * k, 200 * k, 150 * k, { tl: 10, tr: 10, bl: 30, br: 30 });
      g.fillStyle(0x6f767e, 1).fillRect(x - 124 * k, y - 50 * k, 24 * k, 14 * k).fillRect(x + 100 * k, y - 50 * k, 24 * k, 14 * k);
      g.fillStyle(0x9fd3e6, 1).fillEllipse(x, y - 60 * k, 200 * k, 40 * k); g.strokeEllipse(x, y - 60 * k, 200 * k, 40 * k);
      if (pot.dish) {
        const pd = G.dishes.find(q => q.id === pot.dish);
        const t = Math.min(pot.t, total);
        g.lineStyle(7, COL.ink, 1).lineBetween(x, y, x + Math.cos(A(t)) * 145 * k, y + Math.sin(A(t)) * 145 * k);
        g.fillStyle(COL.ink, 1).fillCircle(x, y, 8);
        const R = rng(pot.dish * 3 + Math.floor(G.time * 4));
        g.fillStyle(0xffffff, 0.85);
        for (let b = 0; b < 6; b++) g.fillCircle(x - 80 * k + R() * 160 * k, y - 64 * k + R() * 10, 4 + R() * 5);
        g.fillStyle(COL.pasta, 1).fillEllipse(x, y - 58 * k, 110 * k, 16 * k);
        const cust = pd && G.customers.find(c => c.id === pd.customerId);
        this.potText[i].setText(cust ? `${cust.def.short} · ${Math.floor(pot.t)}s` : '');
        this.potBtns[i].setLabel('Drain').setEnabled(true);
        this.potBtns[i].setFill(pot.t >= BOIL.ready && pot.t <= BOIL.done ? COL.good : pot.t > BOIL.done ? COL.bad : COL.steelDark);
      } else {
        this.potText[i].setText('Empty pot');
        this.potBtns[i].setFill(COL.tomato);
        this.potBtns[i].setLabel('Drop pasta').setEnabled(!!(d && d.stage === 'boil'));
      }
    });
  }

  drawSauce(g, d) {
    const G = this.G, ok = d && d.stage === 'sauce';
    drawPlate(g, 600, 410, 140, ok ? d : null);
    if (ok) { g.lineStyle(2, COL.pastaDark, 0.5); g.strokeCircle(600, 410, 140 * 0.62); }
    // amount meter
    const amt = ok ? d.sauceAmt : 0, mx = 800, my0 = 250, mh = 290;
    g.fillStyle(0xe8dec4, 1).fillRoundedRect(mx, my0, 40, mh, 10);
    g.fillStyle(COL.good, 0.4).fillRect(mx, my0 + mh * (1 - SAUCE_BAND[1] / 120), 40, mh * (SAUCE_BAND[1] - SAUCE_BAND[0]) / 120);
    g.lineStyle(3, COL.ink, 1).strokeRoundedRect(mx, my0, 40, mh, 10);
    const sc = ok && d.sauceId ? SAUCES.find(s => s.id === d.sauceId) : null;
    const fy = my0 + mh * (1 - amt / 120);
    if (amt > 0) g.fillStyle(sc ? sc.color : COL.tomato, 1).fillRoundedRect(mx + 5, fy, 30, my0 + mh - fy - 4, 8);
    g.lineStyle(3, COL.ink, 1).lineBetween(mx - 8, fy, mx + 48, fy);
    // sauce pots on the stove
    this.sauces.forEach((s, i) => {
      const { x, k } = this.saucePos[i], y = 470, picked = ok && d.sauceId === s.id;
      if (picked) { g.fillStyle(COL.gold, 0.35).fillRoundedRect(x - 58 * k, y - 92, 116 * k, 150, 16); g.lineStyle(4, COL.gold, 1).strokeRoundedRect(x - 58 * k, y - 92, 116 * k, 150, 16); }
      g.fillStyle(0x5b6168, 1).fillRoundedRect(x - 48 * k, y - 30, 96 * k, 70, { tl: 6, tr: 6, bl: 20, br: 20 });
      g.lineStyle(3, COL.ink, 1).strokeRoundedRect(x - 48 * k, y - 30, 96 * k, 70, { tl: 6, tr: 6, bl: 20, br: 20 });
      g.fillStyle(s.color, 1).fillEllipse(x, y - 30, 96 * k, 22); g.strokeEllipse(x, y - 30, 96 * k, 22);
      if (s.speck) { g.fillStyle(s.speck, 1); for (let q = 0; q < 5; q++) g.fillCircle(x - 30 * k + q * 15 * k, y - 30 + (q % 2 ? 3 : -3), 2.2); }
      const R = rng(i * 17 + Math.floor(G.time * 3));
      g.fillStyle(0xffffff, 0.3); for (let q = 0; q < 3; q++) g.fillCircle(x - 30 * k + R() * 60 * k, y - 32 + R() * 6, 3 + R() * 3);
      if (!picked) { // spatula resting in the pot
        g.lineStyle(9, COL.ink, 1).lineBetween(x + 10 * k, y - 30, x + 40 * k, y - 92);
        g.lineStyle(6, COL.wood, 1).lineBetween(x + 10 * k, y - 30, x + 40 * k, y - 92);
      }
    });
    // spatula follows the mouse once a sauce is picked
    if (ok && sc) {
      const px = clamp(G.pointer.x, 340, 1260), py = clamp(G.pointer.y, 200, 620);
      const tilt = G.pouring ? 0.9 : 0.25;
      const bx = px - 6, by = py - 46;
      if (G.pouring) {
        g.fillStyle(sc.color, 1).fillRoundedRect(px - 5, by + 8, 10, py - by - 8, 5);
        g.fillCircle(px, py, 9);
      }
      const hx = bx + Math.cos(-Math.PI / 2 + tilt) * 0 + 70 * Math.cos(-1.1 + tilt * 0.3), hy = by + 70 * Math.sin(-1.1 + tilt * 0.3);
      g.lineStyle(11, COL.ink, 1).lineBetween(bx, by, hx, hy);
      g.lineStyle(7, COL.wood, 1).lineBetween(bx, by, hx, hy);
      g.fillStyle(COL.wood, 1).fillEllipse(bx, by, 40, 26); g.lineStyle(3, COL.ink, 1).strokeEllipse(bx, by, 40, 26);
      g.fillStyle(sc.color, 1).fillEllipse(bx, by - 2, 30, 16);
    }
  }

  drawToppings(g, d) {
    const G = this.G, ok = d && d.stage === 'toppings';
    drawPlate(g, TP.x, TP.y, TP.r, ok ? d : null);
    if (!ok) { G.held = null; return; }
    // faded "ghost" toppings show where each one goes
    for (const entry of d.order.toppings) {
      const mine = d.placed.filter(p => p.id === entry.id);
      const focus = !G.held || G.held.id === entry.id;
      for (const [sx, sy] of spotsFor(entry)) {
        const x = TP.x + sx * TP.r, y = TP.y + sy * TP.r, r = SPOT_TOL * TP.r * 0.85;
        if (mine.some(p => Math.hypot(p.dx - sx, p.dy - sy) < SPOT_TOL)) continue;
        drawTopping(g, x, y, entry.id, TP.r / 165, focus ? 0.38 : 0.14);
        g.lineStyle(focus && G.held ? 3.5 : 2.5, COL.gold, focus ? 1 : 0.35);
        const spin = G.held && focus ? G.time * 2 : 0;
        for (let k = 0; k < 12; k += 2) { g.beginPath(); g.arc(x, y, r, k / 12 * Math.PI * 2 + spin, (k + 1) / 12 * Math.PI * 2 + spin, false); g.strokePath(); }
      }
    }
    if (G.held) {
      const px = G.pointer.x, py = G.pointer.y;
      g.fillStyle(0x000000, 0.18).fillEllipse(px + 6, py + 12, 34, 14);
      drawTopping(g, px, py - 4, G.held.id, TP.r / 165 * 1.15);
    }
  }

  drawServe(g, d) {
    const G = this.G, S = G.serving;
    const showD = S ? S.d : d && d.stage === 'ready' ? d : null;
    this.serveEmpty.setVisible(!showD);
    if (!showD) { this.serveCust.setVisible(false); this.servePlate.clear(); return; }
    const cust = G.customers.find(c => c.id === showD.customerId);
    if (this.serveCust.pid !== cust.key) { this.serveCust.destroy(); this.serveCust = addPerson(this, cust.key, cust.def.look, 560, 620, 1.35 * cust.s); this.stationC.serve.addAt(this.serveCust, 1); }
    let mood = this.custMood(cust);
    if (S && S.phase === 'taste') mood = Math.floor(S.t * 3) % 2 ? 'eat' : 'delight';
    if (S && S.phase === 'react') mood = S.total >= 85 ? 'love' : S.total >= 60 ? 'happy' : S.total >= 40 ? 'neutral' : 'sad';
    this.serveCust.setVisible(true).setLook('stand', mood);
    // plate: on the pass, then slides onto the table
    const p = this.servePlate;
    p.clear();
    let px = 1090, py = 494, k = 0.62;
    let squash = 0.42;
    if (S) { const t = S.phase === 'place' ? (1 - (1 - clamp(S.t / 0.4, 0, 1)) ** 2) : 1; px = S.fx + (560 - S.fx) * t; py = S.fy + (572 - S.fy) * t; k = 0.8; squash = 0.55 - 0.13 * t; }
    else if (G.plateDrag) { px = G.pointer.x; py = G.pointer.y; k = 0.78; squash = 0.55; }
    p.setPosition(px, py).setScale(1, squash);
    drawPlate(p, 0, 0, 100 * k, showD, { force: true });
    if (S && S.phase === 'taste') {
      g.fillStyle(0xffffff, 1).fillRoundedRect(640, 330, 90, 40, 12); g.lineStyle(3, COL.ink, 1).strokeRoundedRect(640, 330, 90, 40, 12);
      if (!this.mmm) { this.mmm = this.add.text(685, 350, 'Mmm...', { fontFamily: FH, fontSize: '22px', color: '#2b1a10' }).setOrigin(0.5); this.stationC.serve.add(this.mmm); }
      this.mmm.setVisible(true);
    } else if (this.mmm) this.mmm.setVisible(false);
    if (S && S.phase === 'react' && S.total >= 85) {
      for (let i = 0; i < 4; i++) { const t = (S.t * 0.8 + i * 0.25) % 1; drawHeart(g, 480 + i * 55, 400 - t * 120, 12, true); }
    }
  }
}
