// ---------- Morning shop + Rearrange ----------
function label(scene, x, y, s, size, color, o = {}) {
  const st = { fontFamily: o.font || FB, fontSize: size + 'px', fontStyle: o.weight || '800', color, lineSpacing: o.ls ?? 3, align: o.align || 'left' };
  if (o.wrap) st.wordWrap = { width: o.wrap };
  return scene.add.text(x, y, s, st);
}
const owns = k => !!SAVE.owned[k];
const decorDef = id => DECOR.find(q => q.id === id);
const decorOwned = id => decorDef(id).starter || owns('d:' + id);
const styleOwned = (kind, id) => styleOf(kind, id).price === 0 || owns(`s:${kind}:${id}`);
const wardOwned = (key, opt) => !opt.price || owns(`w:${key}:${opt.v}`);
const buzzNow = () => SAVE.buzz.reduce((a, b) => a + b.delta, 0);

// The piazza market: three stalls, picked once each real day from what you do not own yet.
function saleCandidates(day) {
  const deco = [], ups = [];
  DECOR.forEach(d => { if (d.price && !d.market && !decorOwned(d.id) && souvenirOpen(d, day)) deco.push({ type: 'decor', id: d.id }); });
  for (const k of ['wall', 'floor', 'cloth']) ROOM_STYLES[k].forEach(s => { if (s.price && !styleOwned(k, s.id) && souvenirOpen(s, day)) deco.push({ type: k, id: s.id }); });
  UPGRADES.forEach(u => { if (!u.repeat && !SAVE.upgrades[u.id] && !(u.req && !SAVE.upgrades[u.req])) ups.push({ type: 'upgrade', id: u.id }); });
  return [deco, ups];
}
function marketToday(day) {
  const t = todayKey();
  if (SAVE.market && SAVE.market.date === t) return SAVE.market;
  const R = rng(hashStr('market:' + t)), pick = a => a[Math.floor(R() * a.length)];
  const [deco, ups] = saleCandidates(day);
  const pool = ups.length && (R() < 0.5 || !deco.length) ? ups : deco;
  const rares = DECOR.filter(d => d.market && !decorOwned(d.id));
  const rare = rares.length && day >= 3 && R() < 0.45 ? pick(rares).id : null;
  SAVE.market = { date: t, day, boost: pick(BOOSTS).id, sale: pool.length ? pick(pool) : null, rare, bought: {} };
  writeSave();
  return SAVE.market;
}

// Nonna's guess at today's crowd: a range that always contains the real number, but not always centered on it.
function hunch(day) {
  const n = expectedCount(day), off = Math.floor(rng(day * 7919 + 3)() * 3) - 1;
  const lo = Math.max(1, n - 1 + off);
  return [lo, lo + 2];
}

// Find an open spot for a newly bought or un-stored decoration: the candidate that covers the least of
// the painted wall (door, window, menu, shelves), the tables and the other decorations.
const WALL_BUSY = [[22, 154, 62, 330], [160, 360, 56, 250], [366, 544, 48, 220], [636, 894, 14, 68], [592, 936, 90, 210]].map(([a, b, c, d]) => [a, b, c + TOP, d + TOP]);
function decorRect(id, x, y) {
  const [w, h] = DECOR_SIZE[id];
  return decorDef(id).kind === 'wall' ? [x - w / 2, x + w / 2, y - h / 2, y + h / 2] : [x - w / 2, x + w / 2, y - h, y];
}
const overlap = (r, q) => Math.max(0, Math.min(r[1], q[1]) - Math.max(r[0], q[0])) * Math.max(0, Math.min(r[3], q[3]) - Math.max(r[2], q[2]));
function freeSpot(id, skipUid) {
  const kind = decorDef(id).kind, [w, h] = DECOR_SIZE[id];
  const others = SAVE.decor.filter(r => r.placed !== false && r.uid !== skipUid && decorDef(r.id).kind === kind).map(r => decorRect(r.id, r.x, r.y));
  const busy = kind === 'wall' ? WALL_BUSY : [[22, 154, TOP + 62, FLOOR + 4], [540, 940, TOP + 180, FLOOR + 10], [420, 540, FLOOR - 120, FLOOR + 10],
    ...SAVE.tables.map(t => { const R = TABLE_ROWS[t.row]; return [t.x - 92, t.x + 92, R.seat - 132, R.top + 92]; })];
  let best = null, bestS = Infinity;
  const ys = kind === 'wall' ? [TOP + 70, TOP + 100, TOP + 130, TOP + 160] : [FLOOR + 8, FLOOR + 50, TOP + 420, TOP + 452];
  for (let x = Math.ceil(w / 2) + 6; x <= 1274 - w / 2; x += 12) for (const y of ys) {
    const r = decorRect(id, x, y);
    if (kind === 'wall' && (r[2] < TOP + 12 || r[3] > TOP + 236)) continue;
    let sc = 0;
    for (const q of busy) sc += overlap(r, q);
    for (const q of others) sc += overlap(r, q) * 3;
    sc += Math.abs(x - 900) * 0.4 + (kind === 'floor' && y > FLOOR + 20 ? 40 : 0);
    if (sc < bestS) { bestS = sc; best = { x, y }; }
  }
  return best;
}

function drawFlourBag(g, x, y, s = 1) {
  g.fillStyle(0x000000, 0.15).fillEllipse(x, y + 30 * s, 60 * s, 12 * s);
  g.fillStyle(0xf4ecd8, 1).fillRoundedRect(x - 26 * s, y - 26 * s, 52 * s, 58 * s, 12 * s);
  g.lineStyle(3, COL.ink, 1).strokeRoundedRect(x - 26 * s, y - 26 * s, 52 * s, 58 * s, 12 * s);
  g.fillStyle(0xf4ecd8, 1).fillTriangle(x - 18 * s, y - 24 * s, x + 18 * s, y - 24 * s, x, y - 36 * s);
  g.lineStyle(3, COL.ink, 1).strokeTriangle(x - 18 * s, y - 24 * s, x + 18 * s, y - 24 * s, x, y - 36 * s);
  g.fillStyle(COL.tomato, 1).fillRect(x - 26 * s, y - 2 * s, 52 * s, 12 * s);
}
function drawDoughBall(g, x, y, r) {
  g.fillStyle(0x000000, 0.14).fillEllipse(x + 2, y + r * 0.7, r * 2.1, r * 0.6);
  g.fillStyle(0xf2d38c, 1).fillEllipse(x, y, r * 2, r * 1.6);
  g.lineStyle(2.5, COL.ink, 1).strokeEllipse(x, y, r * 2, r * 1.6);
  g.fillStyle(0xffffff, 0.35).fillEllipse(x - r * 0.35, y - r * 0.3, r * 0.7, r * 0.35);
}
function drawPriceTag(scene, parent, x, y, price, ok) {
  const t = label(scene, x, y, coinsOf(price).toLocaleString('en-US'), 15, '#2b1a10', { font: FD }).setOrigin(1, 0);
  t.setBackgroundColor(ok ? '#f6c453' : '#e2d6bc').setPadding(24, 0, 6, 0);
  parent.add(t);
  parent.add(coinIcon(scene, x - t.width + 13, y + t.height / 2, 7));
  return t;
}

// ================= Morning =================
const PNL = { x: 424, y: 96, w: 832, h: 604 };
class MorningScene extends Phaser.Scene {
  constructor() { super('morning'); }

  create() {
    if (!SAVE.chef) { this.scene.start('chef'); return; }
    this.chef = CHEFS.find(c => c.id === SAVE.chef) || CHEFS[0];
    this.day = SAVE.day || 1; this.rch = null;
    noteVisit(); ensureMail();
    this.cameras.main.setBackgroundColor(COL.basil);
    const bg = this.add.graphics();
    bg.fillStyle(0xffffff, 0.035);
    for (let i = 0; i < 46; i++) bg.fillCircle((i * 197) % W, (i * 131) % H, 3 + (i % 5));
    label(this, 32, 18, `Buongiorno, ${this.chef.first}!`, 40, '#f6c453', { font: FD });
    this.hdr = label(this, 34, 66, '', 17, '#cfe3c9');
    if (needDotd(this.day)) { SAVE.dotd = pickDotd(this.day); writeSave(); }
    this.mkt = marketToday(this.day);
    this.moneyG = this.add.graphics();
    this.moneyT = label(this, 1236, 50, '', 24, '#2b1a10', { font: FD }).setOrigin(1, 0.5);
    this.refreshMoney();
    this.buildTopBar();

    this.buildNotes();
    this.tabG = this.add.graphics();
    this.tabs = ['Pantry', 'Market', 'Wardrobe', 'Decor', 'Upgrades', 'Recipes'].map((n, i) =>
      makeButton(this, PNL.x + 69 + i * 138.8, PNL.y + 24, 130, 48, n, () => this.showTab(n.toLowerCase()), { fill: COL.basilMid, size: 20 }));
    this.mktDot = this.add.graphics();
    this.panel = null;
    this.toast = label(this, W / 2, 690, '', 19, '#2b1a10').setOrigin(0.5).setPadding(14, 6, 14, 6).setAlpha(0).setDepth(300);
    this.showTab(this.registry.get('morningTab') || 'pantry');
    // morning pop-ups, one at a time: newspaper, new recipe, feedback ask
    this.popups = [];
    if (SAVE.mail && !SAVE.mail.claimed) this.popups.push(() => this.showLetter());
    if (SAVE.paper && !SAVE.paper.read) this.popups.push(() => this.showPaper());
    const fresh = UNLOCKS.filter(u => u.day > (SAVE.unlockSeen || 1) && u.day <= this.day);
    fresh.forEach(u => this.popups.push(() => this.showRecipeCard(u, true)));
    if (fresh.length) { SAVE.unlockSeen = this.day; writeSave(); }
    if (this.day >= 4 && !SAVE.feedbackAsked) this.popups.push(() => this.askFeedback());
    else if (SAVE.feedbackAsked && !SAVE.feedbackAskedReal && SAVE.stats.realDays.length >= 3) this.popups.push(() => this.askFeedback(true));
    this.nextPopup();
  }

  nextPopup() { const f = this.popups && this.popups.shift(); if (f) f(); }

  // ----- header: Nonna's mailbox and the Daily Dish -----
  buildTopBar() {
    if (this.topC) this.topC.destroy(true);
    const c = this.topC = this.add.container(0, 0), m = SAVE.mail, unread = !!(m && !m.claimed);
    const box = this.add.container(706, 44), g = this.add.graphics(); box.add(g); c.add(box);
    g.fillStyle(0x7d4a26, 1).fillRect(-5, 8, 10, 40).lineStyle(2.5, COL.ink, 1).strokeRect(-5, 8, 10, 40);
    g.fillStyle(0x2f5ea8, 1).fillRoundedRect(-30, -24, 60, 36, { tl: 18, tr: 18, bl: 4, br: 4 }).lineStyle(3, COL.ink, 1).strokeRoundedRect(-30, -24, 60, 36, { tl: 18, tr: 18, bl: 4, br: 4 });
    g.fillStyle(0x24497f, 1).fillRoundedRect(-22, -8, 30, 14, 3).lineStyle(2, COL.ink, 1).strokeRoundedRect(-22, -8, 30, 14, 3);
    g.fillStyle(0xfbf3e0, 1).fillRect(-16, -2, 18, 2);
    if (unread) {   // flag up and a letter peeking out
      g.fillStyle(0xfbf3e0, 1).fillRect(-18, -16, 22, 10).lineStyle(2, COL.ink, 1).strokeRect(-18, -16, 22, 10);
      g.fillStyle(0x5b351b, 1).fillRect(24, -44, 4, 38);
      g.fillStyle(COL.tomato, 1).fillRect(28, -44, 18, 12).lineStyle(2, COL.ink, 1).strokeRect(28, -44, 18, 12);
      this.tweens.add({ targets: box, angle: { from: -4, to: 4 }, duration: 260, yoyo: true, repeat: -1, repeatDelay: 1400 });
    } else { g.fillStyle(0x5b351b, 1).fillRect(24, -10, 4, 18); g.fillStyle(0x8a8a8a, 1).fillRect(28, -10, 16, 8); }
    const z = this.add.zone(706, 46, 80, 92).setInteractive({ useHandCursor: true });
    z.on('pointerdown', () => { sfx('pop'); this.showLetter(); });
    c.add(z);
    const t = todayKey(), done = SAVE.daily && SAVE.daily.date === t;
    const lbl = done ? `Daily Dish ✓ ${SAVE.daily.total}%` : `Daily Dish #${dailyNumber(t)}`;
    c.add(makeButton(this, 896, 48, 220, 54, lbl, () => {
      if (done) { dailyCard(this, SAVE.daily, { done: () => {}, doneLabel: 'Close' }); return; }
      this.registry.set('morningTab', this.tab); this.registry.set('daily', true); writeSave(); this.scene.start('game');
    }, { fill: done ? COL.basilMid : 0x2f5ea8, size: 20 }));
  }

  showLetter() {
    const m = SAVE.mail;
    if (!m) { this.nextPopup(); return; }
    const L = letterDef(m.id), who = senderOf(L.from);
    const c = this.add.container(0, 0).setDepth(200), g = this.add.graphics(); c.add(g);
    g.fillStyle(0x000000, 0.6).fillRect(0, 0, W, H);
    c.add(this.add.zone(W / 2, H / 2, W, H).setInteractive());
    const x0 = W / 2 - 370, y0 = 54, w = 740, h = 612;
    g.fillStyle(0x000000, 0.3).fillRoundedRect(x0 + 8, y0 + 10, w, h, 10);
    g.fillStyle(0xfdf6e3, 1).fillRoundedRect(x0, y0, w, h, 10);
    // airmail stripes around the edge
    for (let i = 0; i < 46; i++) {
      g.fillStyle(i % 2 ? 0x2f5ea8 : COL.tomato, 1);
      const sx = x0 + 6 + i * 16;
      if (sx < x0 + w - 12) { g.fillTriangle(sx, y0 + 6, sx + 10, y0 + 6, sx + 4, y0 + 16).fillTriangle(sx, y0 + h - 6, sx + 10, y0 + h - 6, sx + 6, y0 + h - 16); }
    }
    g.lineStyle(3, COL.ink, 1).strokeRoundedRect(x0, y0, w, h, 10);
    g.lineStyle(2, 0xd8c8a4, 1).lineBetween(x0 + 40, y0 + 134, x0 + w - 40, y0 + 134);
    c.add(this.add.image(x0 + 92, y0 + 92, tex(this, 'portrait_mail_' + L.from, () => portraitCanvas(who.look, 120, '#f3e2bf'))).setScale(116 / (120 * ART_SCALE)));
    c.add(label(this, x0 + 168, y0 + 46, `A letter from ${who.name}`, 32, '#b8322a', { font: FD }));
    const when = new Date(nowMs()).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
    c.add(label(this, x0 + 170, y0 + 92, when, 19, '#7d4a26', { font: FH, weight: '400' }));
    const body = label(this, x0 + 48, y0 + 146, `Dear ${this.chef.first},\n${L.text}\n${L.sign}`, 22, '#24345a', { font: FH, weight: '400', wrap: w - 96, ls: 6 });
    c.add(body);
    const ps = [];
    if (m.gift) ps.push(`I tucked ${money(m.gift)} in the envelope`);
    if (m.streak >= 2) ps.push(m.gift === 10 ? `for a whole week of visits in a row. Bravissimo!` : `because you have stopped by ${m.streak} days in a row!`);
    let pst = ps.length ? 'P.S. ' + ps.join(' ') + (m.streak >= 2 ? '' : '.') : '';
    if (m.covered) pst += L.from === 'nonna' ? ' You missed a day, so I kept your streak warm.' : ' You missed a day, so Nonna kept your streak warm.';
    if (pst) c.add(label(this, x0 + 48, Math.max(body.y + body.height + 14, y0 + 420), pst, 20, '#1f6b3b', { font: FH, weight: '400', wrap: w - 96, ls: 4 }));
    const claim = !m.claimed;
    c.add(makeButton(this, W / 2, y0 + h - 50, 260, 54, claim && m.gift ? `Grazie! +${money(m.gift)}` : 'Close', () => {
      if (claim) {
        m.claimed = true;
        if (m.gift) { SAVE.bank = Math.round((money2() + m.gift) * 100) / 100; sfx('coin'); }
        writeSave(); this.refresh(); this.buildTopBar();
      }
      c.destroy(true); if (claim) this.nextPopup();
    }, { size: 22 }));
    c.setAlpha(0); this.tweens.add({ targets: c, alpha: 1, duration: 250 });
    sfx('ding');
  }

  refreshMoney() {
    this.hdr.setText(`Morning of Day ${this.day} · Rank: ${rankFor(this.day)}${SAVE.renov ? ' · ' + restaurantName(SAVE.renov) : ''}`);
    const g = this.moneyG; g.clear();
    this.moneyT.setText(`Savings ${money(money2())}`);
    const w = this.moneyT.width + 36;
    g.fillStyle(0x000000, 0.25).fillRoundedRect(1252 - w, 28, w, 48, 24);
    g.fillStyle(COL.pasta, 1).fillRoundedRect(1250 - w, 24, w, 48, 24);
    g.lineStyle(3, COL.ink, 1).strokeRoundedRect(1250 - w, 24, w, 48, 24);
  }

  say(msg, color) {
    this.toast.setText(msg).setBackgroundColor(color || '#f6c453');
    this.tweens.killTweensOf(this.toast);
    this.toast.setAlpha(1);
    this.tweens.add({ targets: this.toast, alpha: 0, delay: 1800, duration: 500 });
  }

  // ----- Nonna's notes (left card) -----
  buildNotes() {
    if (this.notes) this.notes.destroy(true);
    const c = this.notes = this.add.container(0, 0);
    const g = this.add.graphics(); c.add(g);
    g.fillStyle(0x000000, 0.25).fillRoundedRect(28, 102, 380, 598, 20);
    g.fillStyle(0xfffaee, 1).fillRoundedRect(24, 96, 380, 598, 20);
    g.lineStyle(4, COL.ink, 1).strokeRoundedRect(24, 96, 380, 598, 20);
    c.add(this.add.image(90, 154, tex(this, 'portrait_nonna', () => portraitCanvas(NONNA_LOOK, 96, '#f3e2bf'))).setScale(84 / (96 * ART_SCALE)));
    c.add(label(this, 144, 120, "Nonna's notes", 26, '#b8322a', { font: FD }));
    c.add(label(this, 145, 158, 'Read before we open!', 16, '#7d4a26', { font: FH, weight: '400' }));
    const [lo, hi] = hunch(this.day), lines = [];
    if (!SAVE.seen.morning) lines.push('Every morning we get ready here. Buy flour for dough, and spend our tips on clothes, decorations and new things for the kitchen.');
    lines.push(`My hunch: about ${lo} to ${hi} hungry people today. But who knows? Customers never call ahead.`);
    const gs = gardenSummary();
    const drop = [];   // lines that can go on a busy morning, first to last
    if (gs.ready) lines.push(`Something is ready to pick in the garden! Fresh food from our garden earns bonus tips.`);
    else if (!SAVE.stats.planted) lines.push('I dug us a garden out back! Plant some seeds, and they will grow while we cook.');
    else if (gs.empty) { lines.push(`${gs.empty === 1 ? 'One garden bed is' : gs.empty + ' garden beds are'} empty. Seeds are free, so plant something!`); drop.push(lines[lines.length - 1]); }
    const b = buzzNow();
    if (SAVE.buzz.some(x => x.why === 'review') && b > 0) lines.push('Everybody read the newspaper! The whole town wants to try our pasta.');
    else if (b < 0) lines.push('That bad review is keeping people away for now. Good plates will win them back.');
    else if (SAVE.buzz.some(x => x.why === 'flyers')) lines.push('Our flyers are all over the piazza. Expect some new faces.');
    if (SAVE.criticDay === this.day) lines.push('I hear the food critic from La Gazzetta is in town today. Make every plate perfect!');
    const mk = this.mkt;
    if (SAVE.boost && SAVE.boost.day === this.day) lines.push({ flowers: 'Fresh flowers are on every table today. Customers will be patient.', musician: 'The musician is warming up in the piazza. Expect a bigger crowd!', oil: "Gianni's olive oil is on every table, so tips will be good today." }[SAVE.boost.id]);
    else if (mk && mk.rare && !decorOwned(mk.rare)) lines.push(`Rare find at the market today: the ${decorDef(mk.rare).name.toLowerCase()}! It may be gone tomorrow.`);
    const today = UNLOCKS.find(u => u.day === this.day && u.day > 1);
    const chNow = chapterAt(this.day);
    if (today && isChapterStart(today)) lines.push(`Andiamo! Today we arrive in ${placeName(chNow).replace(', ', ', in ')}. New city, new dishes, and new souvenirs in the shop!`);
    else if (this.day > LAST_DAY && (this.day - LAST_DAY - 1) % 8 === 0) lines.push(`This week our menu visits ${chNow.name} again. Remember those dishes?`);
    if (today && today.adds.length) lines.push(`New on the menu today: ${today.what.toLowerCase()}! The recipe is in my book.`);
    if (SAVE.dotd && SAVE.dotd.day === this.day) {
      const st = SAVE.streak || 0;
      lines.push(`★ Dish of the day: ${dotdName(SAVE.dotd)}. Serve ${DOTD_GOAL(this.day)} for bonus tips${st ? ` and keep our ${st}-day streak alive` : ' and start a streak'}.`);
    }
    const want = crowdDemand(this.day), cap = kitchenCap(SAVE.upgrades);
    if (this.day > 4 && want > cap) { lines.push(`About ${want} people want to eat here, but our kitchen only has room for ${cap}. More pots, tables or helpers in Upgrades would let them in!`); drop.push(lines[lines.length - 1]); }
    if (lines.length <= 3) {
      const goals = UPGRADES.filter(u => !u.repeat && !SAVE.upgrades[u.id] && !(u.req && !SAVE.upgrades[u.req])).map(u => ({ name: u.name, price: u.price }));
      const nr = RENOVATIONS[SAVE.renov || 0];
      if (nr) goals.push({ name: `the ${nr.name} renovation`, price: nr.price });
      const gl = goals.sort((a, b) => a.price - b.price).find(q => q.price > money2());
      if (gl) lines.push(`Next savings goal: ${gl.name}. Only ${money(gl.price - money2())} to go!`);
    }
    const pantry = SAVE.pantry;
    if (pantry <= 0) lines.push('The pantry is empty! We need flour before we can make a single noodle.');
    else if (pantry < hi) lines.push(`We only have dough for ${pantry} plate${pantry === 1 ? '' : 's'}. Buy a bag of flour or two before we open.`);
    else { lines.push(`Dough for ${pantry} plates is waiting in the pantry. Bene!`); drop.unshift(lines[lines.length - 1]); }
    let size = 18, nt;
    const fit = () => { size = 18; do { if (nt) nt.destroy(); nt = label(this, 44, 210, lines.join('\n\n'), size, '#2b1a10', { wrap: 340, ls: size > 16 ? 4 : 2 }); size--; } while (nt.height > 324 && size > 13); };
    fit();
    // on a busy morning, the 'plenty of dough' line is the one to drop
    while (nt.height > 324 && drop.length) { const s = drop.shift(); lines.splice(lines.indexOf(s), 1); fit(); }
    c.add(nt);
    c.add(makeButton(this, 128, 572, 168, 52, 'Rearrange', () => { this.registry.set('morningTab', this.tab); this.scene.start('decorate'); }, { fill: COL.basilMid, size: 21 }));
    c.add(makeButton(this, 300, 572, 168, 52, 'Garden', () => { this.registry.set('morningTab', this.tab); this.scene.start('garden'); }, { fill: COL.basilMid, size: 21 }));
    if (gs.ready || gs.empty) {
      const dot = this.add.graphics().setPosition(378, 550); c.add(dot);
      dot.fillStyle(COL.tomato, 1).fillCircle(0, 0, 10).lineStyle(3, COL.ink, 1).strokeCircle(0, 0, 10).fillStyle(0xfff8e8, 1).fillCircle(0, 0, 3.5);
      this.tweens.add({ targets: dot, scale: 1.25, duration: 500, yoyo: true, repeat: -1 });
    }
    c.add(makeButton(this, 214, 646, 340, 64, `Open for Day ${this.day}`, () => this.openShop(), { size: 28 }));
  }

  openShop() {
    if (SAVE.pantry <= 0 && money2() < FLOUR_BAG.price) { SAVE.pantry += FLOUR_BAG.plates; this.say('Nonna slips you a bag of flour from her own kitchen.'); }
    SAVE.seen.morning = true;
    this.registry.set('morningTab', null);
    writeSave();
    this.scene.start('game');
  }

  showTab(id) {
    if (this.tab === 'wardrobe' && id !== 'wardrobe') this.trial = null;
    this.tab = id;
    if (id === 'market' && SAVE.marketSeen !== todayKey()) { SAVE.marketSeen = todayKey(); writeSave(); }
    // a red dot on Market until you have looked at today's stalls
    this.mktDot.clear();
    if (SAVE.marketSeen !== todayKey()) { const mx = PNL.x + 69 + 138.8 + 58, my = PNL.y + 4; this.mktDot.fillStyle(COL.tomato, 1).fillCircle(mx, my, 10).lineStyle(3, COL.ink, 1).strokeCircle(mx, my, 10).fillStyle(0xfff8e8, 1).fillCircle(mx, my, 3.5); }
    this.tabs.forEach(b => b.setSelected(b.label.text.toLowerCase() === id).setFill(b.label.text.toLowerCase() === id ? COL.tomato : COL.basilMid));
    if (this.panel) this.panel.destroy(true);
    const c = this.panel = this.add.container(0, 0);
    const g = this.add.graphics(); c.add(g);
    g.fillStyle(0x000000, 0.25).fillRoundedRect(PNL.x + 4, PNL.y + 62, PNL.w, PNL.h - 56, 20);
    g.fillStyle(0xfffaee, 1).fillRoundedRect(PNL.x, PNL.y + 56, PNL.w, PNL.h - 56, 20);
    g.lineStyle(4, COL.ink, 1).strokeRoundedRect(PNL.x, PNL.y + 56, PNL.w, PNL.h - 56, 20);
    this.panelG = g;
    this['tab_' + id](c);
  }
  refresh() { this.refreshMoney(); this.showTab(this.tab); this.buildNotes(); }

  // ----- Pantry -----
  tab_pantry(c) {
    const x0 = PNL.x + 30, g = this.add.graphics(); c.add(g);
    c.add(label(this, x0, 170, 'Pantry', 30, '#2b1a10', { font: FD }));
    const p = SAVE.pantry, enough = p >= hunch(this.day)[1];
    c.add(label(this, x0 + 130, 178, p > 0 ? `Dough for ${p} plate${p === 1 ? '' : 's'}` : 'Out of dough!', 22, !p ? '#b8322a' : enough ? '#2e7d32' : '#a8681a', { font: FD }));
    const shown = Math.min(p, 24);
    for (let i = 0; i < shown; i++) drawDoughBall(g, x0 + 26 + (i % 12) * 52, 248 + Math.floor(i / 12) * 44, 19);
    if (p > 24) c.add(label(this, x0 + 640, 280, `+${p - 24}`, 20, '#7d4a26', { font: FD }));
    if (!p) c.add(label(this, x0, 236, 'The shelf is bare. Every plate of pasta needs one ball of fresh dough.', 18, '#7d4a26', { wrap: 600 }));
    const by = 342;
    drawFlourBag(g, x0 + 34, by + 40, 1.1);
    c.add(label(this, x0 + 84, by, 'Flour and eggs', 22, '#2b1a10', { font: FD }));
    c.add(label(this, x0 + 84, by + 32, `One bag makes ${FLOUR_BAG.plates} plates of dough for ${money(FLOUR_BAG.price)}. If you run out during the day, a rush delivery costs ${money(RUSH_DELIVERY.price)} for ${RUSH_DELIVERY.plates} plates, so buying ahead saves money.`, 16, '#5b351b', { wrap: 420 }));
    const buy1 = makeButton(this, x0 + 664, by + 22, 220, 50, `Buy a bag · ${money(FLOUR_BAG.price)}`, () => this.buyFlour(1), { fill: COL.basilMid, size: 20 });
    buy1.setEnabled(money2() >= FLOUR_BAG.price);
    const [, hi] = hunch(this.day), need = Math.max(0, Math.ceil((hi - p) / FLOUR_BAG.plates));
    const stock = makeButton(this, x0 + 664, by + 84, 220, 50, need ? `Stock up · ${money(need * FLOUR_BAG.price)}` : 'Fully stocked', () => this.buyFlour(need), { size: 20 });
    stock.setEnabled(need > 0 && money2() >= need * FLOUR_BAG.price);
    c.add([buy1, stock]);
    if (need) c.add(label(this, x0 + 664, by + 116, `${need} bag${need > 1 ? 's' : ''}, enough for Nonna's hunch`, 13, '#7d4a26').setOrigin(0.5, 0));

    // yesterday's books
    const L = SAVE.lastDay, yy = 520;
    g.lineStyle(2, 0xd8c8a4, 1).lineBetween(x0, yy - 14, PNL.x + PNL.w - 30, yy - 14);
    c.add(label(this, x0, yy, L ? `Yesterday (Day ${L.day})` : 'Yesterday', 22, '#2b1a10', { font: FD }));
    if (!L) { c.add(label(this, x0, yy + 40, 'No numbers yet. Tonight we count the tips together.', 17, '#7d4a26')); return; }
    const rows = [['Customers served', String(L.served)], ['Walked out', String(L.left)], ['Tips', money(L.tips)]];
    if (L.sales) rows.push(['Garlic bread sales', money(L.sales)]);
    if (L.spent) rows.push([L.spent > 0 ? 'Costs' : 'Gifts', (L.spent > 0 ? '-' : '+') + money(Math.abs(L.spent))]);
    rows.push(['Earned', money(L.tips + L.sales - L.spent)]);
    rows.forEach(([k, v], i) => {
      const col = i < 3 ? 0 : 1, row = i % 3, x = x0 + col * 390, y = yy + 38 + row * 30;
      c.add(label(this, x, y, k, 17, '#7d4a26', { weight: '700' }));
      c.add(label(this, x + 330, y, v, 18, k === 'Earned' ? '#2e7d32' : '#2b1a10', { font: FD }).setOrigin(1, 0));
    });
  }
  buyFlour(n) {
    let got = 0;
    for (let i = 0; i < n; i++) { if (!spend(FLOUR_BAG.price)) break; SAVE.pantry += FLOUR_BAG.plates; got++; }
    if (got) { sfx('pop'); writeSave(); this.say(`Bought ${got} bag${got > 1 ? 's' : ''} of flour. Dough for ${SAVE.pantry} plates.`); }
    this.refresh();
  }

  // ----- Piazza market -----
  tab_market(c) {
    const m = this.mkt = marketToday(this.day), g = this.add.graphics(); c.add(g);
    c.add(label(this, PNL.x + 30, 166, 'Piazza market', 30, '#2b1a10', { font: FD }));
    c.add(label(this, PNL.x + PNL.w - 26, 178, `New stalls in ${durText(msToMidnight())}`, 17, '#7d4a26').setOrigin(1, 0));
    [this.boostStall(m), this.saleStall(m), this.rareStall(m)].forEach((s, i) => {
      const x = PNL.x + 26 + i * 264, y = 226, w = 250, h = 458, cx = x + w / 2;
      g.fillStyle(0x000000, 0.15).fillRoundedRect(x + 4, y + 6, w, h, 14);
      g.fillStyle(0xf8f0dc, 1).fillRoundedRect(x, y, w, h, 14);
      g.lineStyle(3, COL.ink, 1).strokeRoundedRect(x, y, w, h, 14);
      // striped stall roof
      const n = 9, sw = (w + 16) / n, rx = x - 8, ry = y - 10;
      for (let k = 0; k < n; k++) {
        g.fillStyle(k % 2 ? 0xfbf3e0 : s.color, 1).fillRect(rx + k * sw, ry, sw, 30).fillCircle(rx + (k + 0.5) * sw, ry + 30, sw / 2);
        g.lineStyle(2.5, COL.ink, 1).beginPath().arc(rx + (k + 0.5) * sw, ry + 30, sw / 2, 0, Math.PI, false).strokePath();
      }
      g.lineStyle(3, COL.ink, 1).strokeRect(rx, ry, w + 16, 30);
      const tag = label(this, cx, y + 50, s.tag, 15, '#fff8e8', { font: FD }).setOrigin(0.5, 0).setPadding(10, 2, 10, 2);
      tag.setBackgroundColor('#' + s.color.toString(16).padStart(6, '0')); c.add(tag);
      const art = this.add.container(0, 0); c.add(art);
      s.art(art, cx, y + 150);
      const nm = label(this, cx, y + 226, s.name, 21, '#2b1a10', { font: FD, align: 'center', wrap: w - 24, ls: 0 }).setOrigin(0.5, 0); c.add(nm);
      c.add(label(this, cx, nm.y + nm.height + 8, s.desc, 15, '#5b351b', { align: 'center', wrap: w - 30, ls: 1 }).setOrigin(0.5, 0));
      if (s.price != null && !s.done) {
        if (s.was) {
          const wt = label(this, cx - 8, y + 376, money(s.was), 17, '#7d848c', { font: FD }).setOrigin(1, 0.5); c.add(wt);
          g.lineStyle(2.5, COL.tomato, 1).lineBetween(wt.x - wt.width - 2, y + 377, wt.x + 2, y + 375);
          c.add(label(this, cx + 8, y + 376, money(s.price), 22, '#b8322a', { font: FD }).setOrigin(0, 0.5));
        }
        const ok = money2() >= s.price;
        c.add(makeButton(this, cx, y + 420, 210, 48, ok ? `Buy · ${money(s.price)}` : `Need ${money(s.price)}`, s.buy, { size: 19 }).setEnabled(ok));
      } else if (s.done) c.add(makeButton(this, cx, y + 420, 210, 48, s.done, () => {}, { fill: COL.good, size: 19 }).setEnabled(false));
      if (s.foot) c.add(label(this, cx, y + 360, s.foot, 13, '#7d848c', { align: 'center', wrap: w - 30 }).setOrigin(0.5, 0));
    });
  }
  marketImg(cc, key, make, x, y, maxW, maxH, k0) {
    const im = this.add.image(x, y, tex(this, key, make)); cc.add(im);
    const k = Math.min(maxW / im.width, maxH / im.height, k0 || 1); im.setScale(k);
    return im;
  }
  boostStall(m) {
    const b = BOOSTS.find(q => q.id === m.boost), had = SAVE.boost && SAVE.boost.day === this.day, used = !had && SAVE.boost && SAVE.boost.date === todayKey();
    return { color: 0xd9432f, tag: 'Today only', name: b.name, desc: b.desc, price: b.price, done: had ? 'Active today ✓' : used ? 'Used today ✓' : null,
      foot: used ? 'One treat a day. A new one arrives tomorrow.' : null,
      art: (cc, x, y) => b.id === 'musician' ? this.marketImg(cc, 'portrait_musician', () => portraitCanvas(MUSICIAN_LOOK, 96, '#bfe3f2'), x, y, 124, 124)
        : this.marketImg(cc, 'mkt_' + b.id, () => marketArtCanvas(b.id), x, y, 130, 130),
      buy: () => {
        if (!spend(b.price)) return;
        SAVE.boost = { day: this.day, date: todayKey(), id: b.id };
        if (b.id === 'musician') SAVE.buzz.push({ delta: 2, days: 1, why: 'musician' });
        sfx('ding'); this.say({ flowers: 'Fresh flowers on every table today!', musician: 'The musician will play in the piazza all day!', oil: "Cousin Gianni's olive oil is on every table today!" }[b.id]);
        writeSave(); this.refresh();
      } };
  }
  saleInfo(sl) {
    if (sl.type === 'upgrade') { const u = UPGRADES.find(q => q.id === sl.id); return { name: u.name, price: u.price, desc: u.desc.split('. ')[0].replace(/\.$/, '') + '.', owned: () => !!SAVE.upgrades[u.id], u }; }
    if (sl.type === 'decor') { const d = decorDef(sl.id); return { name: d.name, price: d.price, desc: d.ch ? `A souvenir from ${CHAPTERS.find(q => q.id === d.ch).name} for the ${d.kind}.` : `A decoration for the ${d.kind}.`, owned: () => decorOwned(d.id), it: { type: 'decor', id: d.id, name: d.name, price: d.price, def: d } }; }
    const st = styleOf(sl.type, sl.id);
    return { name: st.name, price: st.price, desc: { wall: 'New wallpaper for the dining room.', floor: 'A new floor for the dining room.', cloth: 'New tablecloths for every table.' }[sl.type], owned: () => styleOwned(sl.type, st.id), it: { type: sl.type, id: st.id, name: st.name, price: st.price, def: st } };
  }
  saleStall(m) {
    if (!m.sale) return { color: 0x2f5ea8, tag: '25% off', name: 'All sold out', desc: 'You already own everything the shops sell right now. New souvenirs arrive in the next city!', art: () => {} };
    const s = this.saleInfo(m.sale), price = Math.ceil(s.price * (1 - SALE_OFF));
    return { color: 0x2f5ea8, tag: '25% off today', name: s.name, desc: s.desc, price, was: s.price,
      done: s.owned() ? (m.bought.sale ? 'Bought ✓' : 'You own this') : null,
      art: (cc, x, y) => {
        if (s.u) { const ic = this.add.container(x, y).setScale(1.6), ig = this.add.graphics(); ic.add(ig); this.upgradeIcon(ic, ig, s.u.id, 0, 0); cc.add(ic); }
        else if (s.it.type === 'decor') this.marketImg(cc, 'decor_' + s.it.id, () => decorCanvas(s.it.id), x, y, 150, 130, 1);
        else { const sg = this.add.graphics(); cc.add(sg); this.swatch(sg, s.it, x - 64, y - 40, 128, 80); }
      },
      buy: () => {
        if (money2() < price) return;
        m.bought.sale = 1;
        if (s.u) this.buyUpgrade(s.u, price); else this.buyDecor(s.it, price);
      } };
  }
  rareStall(m) {
    if (m.rare) {
      const d = decorDef(m.rare);
      return { color: 0x7a4fb0, tag: 'Rare find', name: d.name, desc: 'The antique dealer only visits some mornings. You will not find this anywhere else!', price: d.price,
        done: decorOwned(d.id) ? 'Yours ✓' : null,
        art: (cc, x, y) => this.marketImg(cc, 'decor_' + d.id, () => decorCanvas(d.id), x, y, 150, 140, 1),
        buy: () => this.buyDecor({ type: 'decor', id: d.id, name: d.name, price: d.price, def: d }) };
    }
    const n = FLOUR_DEAL.bags, plates = n * FLOUR_BAG.plates;
    return { color: 0x1f6b3b, tag: 'Flour deal', name: `${n} bags of flour`, desc: `The miller has extra today: dough for ${plates} plates.`, price: FLOUR_DEAL.price, was: n * FLOUR_BAG.price,
      foot: 'No antique dealer today. Rare finds turn up on some mornings.',
      done: m.bought.flour ? 'Bought ✓' : null,
      art: (cc, x, y) => { const fg = this.add.graphics(); cc.add(fg); drawFlourBag(fg, x - 44, y + 14, 1.1); drawFlourBag(fg, x + 44, y + 14, 1.1); drawFlourBag(fg, x, y - 4, 1.3); },
      buy: () => {
        if (!spend(FLOUR_DEAL.price)) return;
        SAVE.pantry += plates; m.bought.flour = 1; sfx('pop');
        this.say(`Dough for ${SAVE.pantry} plates in the pantry now!`); writeSave(); this.refresh();
      } };
  }

  // ----- Wardrobe -----
  baseLook() { return chefLook(this.chef.id); }
  previewLook() {
    const l = this.baseLook();
    if (this.trial) this.applyTo(l, this.trial);
    return l;
  }
  applyTo(l, t) {
    if (t.toggle) { const def = t.def; l[t.toggle] = t.on ? (def.hairColored ? l.hair : def.value ?? true) : false; return l; }
    l[t.key] = t.v;
    if (t.key === 'hair') for (const k of ['mustache', 'beard']) if (l[k]) l[k] = t.v;
    return l;
  }
  commit(t) {
    const l = this.applyTo(this.baseLook(), t);
    SAVE.looks[this.chef.id] = l; writeSave();
    this.trial = null;
  }
  tab_wardrobe(c) {
    const cat = this.wcat = this.wcat || 'hairStyle';
    const g = this.add.graphics(); c.add(g);
    // stage with the chef preview
    g.fillStyle(0xf3e2bf, 1).fillRoundedRect(PNL.x + 16, 168, 230, 516, 16);
    g.lineStyle(3, COL.ink, 0.6).strokeRoundedRect(PNL.x + 16, 168, 230, 516, 16);
    g.fillStyle(0x000000, 0.12).fillEllipse(PNL.x + 131, 612, 150, 26);
    const look = this.previewLook();
    c.add(label(this, PNL.x + 131, 184, this.chef.first, 26, '#2b1a10', { font: FD }).setOrigin(0.5, 0));
    c.add(addPerson(this, lookId(this.chef.id, look), look, PNL.x + 131, 612, 1.32, 'stand', this.trial ? 'delight' : 'happy'));
    if (this.trial) {
      const price = this.trial.price, ok = money2() >= price;
      const btn = makeButton(this, PNL.x + 131, 648, 200, 46, ok ? `Buy · ${money(price)}` : `Need ${money(price)}`, () => {
        if (!spend(price)) return;
        SAVE.owned[this.trial.ownKey] = 1; sfx('ding'); this.say(`Bought ${this.trial.name}!`);
        this.commit(this.trial); this.refresh();
      }, { size: 20 });
      btn.setEnabled(ok); c.add(btn);
    } else c.add(label(this, PNL.x + 131, 638, 'Click anything to try it on', 15, '#7d4a26', { wrap: 200, align: 'center' }).setOrigin(0.5, 0));

    // category chips
    WARDROBE.forEach((w, i) => {
      const x = PNL.x + 318 + (i % 5) * 110, y = 192 + Math.floor(i / 5) * 46;
      const b = makeButton(this, x, y, 102, 38, w.label, () => { this.wcat = w.key; this.trial = null; this.refresh(); }, { fill: w.key === cat ? COL.tomato : COL.basilMid, size: 16 });
      b.setSelected(w.key === cat); c.add(b);
    });
    const W0 = WARDROBE.find(w => w.key === cat), cur = this.previewLook(), saved = this.baseLook();
    const items = W0.toggles ? W0.toggles.map(t => ({ toggle: t.k, def: t, name: t.name, price: t.price, ownKey: `w:x:${t.k}`, on: !!cur[t.k] }))
      : W0.options.map(o => ({ key: cat, v: o.v, opt: o, name: o.name || W0.label.toLowerCase(), price: o.price, ch: o.ch, ownKey: `w:${cat}:${o.v}` }));
    items.forEach((it, i) => {
      const x = PNL.x + 268 + (i % 6) * 92, y = 268 + Math.floor(i / 6) * 104;
      const tile = this.add.container(x, y); c.add(tile);
      const tg = this.add.graphics(); tile.add(tg);
      const sel = it.toggle ? it.on : cur[cat] === it.v || (cur[cat] == null && it.v == null);
      tg.fillStyle(sel ? 0xfff6dc : 0xf1e6cc, 1).fillRoundedRect(0, 0, 84, 96, 12);
      tg.lineStyle(sel ? 5 : 2.5, sel ? COL.gold : COL.ink, 1).strokeRoundedRect(0, 0, 84, 96, 12);
      if (W0.color && it.v) {
        tg.fillStyle(Phaser.Display.Color.HexStringToColor(it.v).color, 1).fillCircle(42, 40, 26);
        tg.lineStyle(3, COL.ink, 1).strokeCircle(42, 40, 26);
      } else if (W0.color) {
        tg.lineStyle(3, COL.ink, 0.6).strokeCircle(42, 40, 26).lineBetween(24, 58, 60, 22);
      } else {
        const l = this.applyTo(Object.assign({}, saved), it.toggle ? { toggle: it.toggle, def: it.def, on: true } : it);
        if (!it.toggle && cat === 'hat') l.hatColor = cur.hatColor;
        const z = cat === 'hat' ? [0.78, 66, 0.56] : cat === 'extras' && ['necklace', 'scarf', 'chefCoat', 'build'].includes(it.toggle) ? [0.52, 132, 0.5] : [1, 84, 0.6];
        const k = 'pt_' + z[0] + lookId(this.chef.id, l);
        tile.add(this.add.image(42, 40, tex(this, k, () => portraitCanvas(l, 66, '#f3e2bf', ...z))).setScale(1 / ART_SCALE));
      }
      const nm = it.toggle ? it.name : W0.color ? (it.opt.name || '') : it.name;
      if (nm) tile.add(label(this, 42, 72, nm, 13, '#2b1a10', { align: 'center', wrap: 80 }).setOrigin(0.5, 0));
      if (this.wearLocked(it)) {
        const og = this.add.graphics(); og.fillStyle(0xf1e6cc, 0.62).fillRoundedRect(2, 2, 80, 70, 10); tile.add(og);
        tile.add(label(this, 42, 14, `Day ${chapterStart(it.ch)}`, 14, '#fff8e8', { font: FD }).setOrigin(0.5).setBackgroundColor('#7d848c').setPadding(5, 0, 5, 0));
      } else if (!this.ownsWear(it)) drawPriceTag(this, tile, 88, -6, it.price, money2() >= it.price);
      const z = this.add.zone(42, 48, 84, 96).setInteractive({ useHandCursor: true });
      z.on('pointerdown', () => this.pickWear(it));
      tile.add(z);
    });
    const reset = label(this, PNL.x + PNL.w - 24, 664, 'Back to original outfit', 15, '#1f6b3b').setOrigin(1, 0).setInteractive({ useHandCursor: true });
    reset.on('pointerdown', () => { delete SAVE.looks[this.chef.id]; this.trial = null; writeSave(); sfx('pop'); this.refresh(); });
    c.add(reset);
  }
  ownsWear(it) {
    if (!it.price || owns(it.ownKey)) return true;
    const base = this.chef.look;
    return it.toggle ? !!base[it.toggle] : base[it.key] === it.v;
  }
  wearLocked(it) { return !!it.ch && !souvenirOpen(it, this.day) && !owns(it.ownKey); }
  pickWear(it) {
    sfx('pop');
    if (this.wearLocked(it)) { this.say(`They sell this one in ${CHAPTERS.find(q => q.id === it.ch).name}. Nonna takes you there on Day ${chapterStart(it.ch)}.`); return; }
    const t = it.toggle ? { toggle: it.toggle, def: it.def, on: !it.on, name: it.name, price: it.price, ownKey: it.ownKey }
      : { key: it.key, v: it.v, name: it.name, price: it.price, ownKey: it.ownKey };
    if (it.toggle && !t.on) { this.trial = null; this.commit(t); }
    else if (this.ownsWear(it)) this.commit(t);
    else this.trial = t;
    this.showTab('wardrobe');
  }

  // ----- Decor -----
  tab_decor(c) {
    const sub = this.dsub = this.dsub || 'decor';
    ['decor', 'souv', 'wall', 'floor', 'cloth'].forEach((k, i) => {
      const b = makeButton(this, PNL.x + 92 + i * 158, 190, 148, 38, { decor: 'Decorations', souv: 'Souvenirs', wall: 'Walls', floor: 'Floors', cloth: 'Tablecloths' }[k],
        () => { this.dsub = k; this.dsel = null; this.showTab('decor'); }, { fill: k === sub ? COL.tomato : COL.basilMid, size: 17 });
      b.setSelected(k === sub); c.add(b);
    });
    // live preview of the dining room
    const px = PNL.x + 16, py = 222, ps = 0.5;
    const pv = this.add.container(px, py - TOP * ps).setScale(ps);
    const R = buildRoom(this, pv);
    R.mid.add(this.add.image(545, 430 - 68, tex(this, 'counter', counterCanvas)).setOrigin(0, 0).setScale(1 / 1.5));
    const mg = this.make.graphics({ add: false }); mg.fillStyle(0xffffff).fillRoundedRect(px, py, 640, 229, 10);
    pv.setMask(mg.createGeometryMask());
    c.add(pv);
    const fg = this.add.graphics(); fg.lineStyle(3, COL.ink, 1).strokeRoundedRect(px, py, 640, 229, 10); c.add(fg);

    // item list
    const deco = sub === 'decor' || sub === 'souv';
    const list = deco ? DECOR.filter(d => !!(d.ch || d.market) === (sub === 'souv')).map(d => ({ type: 'decor', id: d.id, name: d.name, price: d.price, def: d }))
      : ROOM_STYLES[sub].map(s => ({ type: sub, id: s.id, name: s.name, price: s.price, def: s }));
    const sel = this.dsel && list.find(q => q.id === this.dsel) || null;
    list.forEach((it, i) => {
      const x = PNL.x + 16 + (i % 7) * 114, y = 462 + Math.floor(i / 7) * 112;
      const tile = this.add.container(x, y); c.add(tile);
      const tg = this.add.graphics(); tile.add(tg);
      const on = sel === it, st = this.itemState(it);
      tg.fillStyle(on ? 0xfff6dc : 0xf1e6cc, 1).fillRoundedRect(0, 0, 108, 104, 12);
      tg.lineStyle(on ? 5 : 2.5, on ? COL.gold : COL.ink, 1).strokeRoundedRect(0, 0, 108, 104, 12);
      if (it.type === 'decor') {
        const [w, h] = DECOR_SIZE[it.id], k = Math.min(56 / w, 52 / h);
        tile.add(this.add.image(54, 32, tex(this, 'decor_' + it.id, () => decorCanvas(it.id))).setDisplaySize(w * k, h * k).setAlpha(st.k === 'locked' ? 0.35 : 1));
      } else { this.swatch(tg, it, 14, 8, 80, 48); if (st.k === 'locked') tg.fillStyle(0xf1e6cc, 0.62).fillRect(14, 8, 80, 48); }
      tile.add(label(this, 54, 60, it.name, 12, st.k === 'locked' ? '#7d848c' : '#2b1a10', { align: 'center', wrap: 100, ls: 0 }).setOrigin(0.5, 0));
      const sc = { buy: '#b8322a', shown: '#2e7d32', stored: '#7d848c', use: '#2e7d32', owned: '#5b351b', locked: '#7d848c', market: '#7a4fb0' }[st.k];
      tile.add(label(this, 54, 86, st.t, 12, sc, { align: 'center' }).setOrigin(0.5, 0));
      if (st.k === 'buy') drawPriceTag(this, tile, 112, -6, it.price, money2() >= it.price);
      const z = this.add.zone(54, 52, 108, 104).setInteractive({ useHandCursor: true });
      z.on('pointerdown', () => this.pickDecor(it));
      tile.add(z);
    });

    // detail column
    const dx = PNL.x + 668, dw = 148;
    if (!sel) {
      c.add(label(this, dx, 230, deco ? 'Pick a decoration to buy it, or to put it out or away.' : 'Pick a style to see it in the room.', 16, '#5b351b', { wrap: dw }));
      return;
    }
    const st = this.itemState(sel);
    c.add(label(this, dx, 228, sel.name, 20, '#2b1a10', { font: FD, wrap: dw, ls: 0 }));
    const city = sel.def.ch && CHAPTERS.find(q => q.id === sel.def.ch).name;
    let info = sel.type === 'decor' ? (sel.def.kind === 'wall' ? 'Hangs on the wall.' : 'Stands on the floor.') : { wall: 'Wallpaper', floor: 'Floor', cloth: 'Tablecloths' }[sel.type];
    if (st.k === 'locked') info = `A souvenir from ${city}. Nonna takes you there on Day ${chapterStart(sel.def.ch)}.`;
    else if (st.k === 'market') info = 'A rare find. Only the antique dealer at the piazza market sells this, on some mornings.';
    else if (city) info = `A souvenir from ${city}. ${info}`;
    c.add(label(this, dx, 290, info, 15, '#7d4a26', { wrap: dw }));
    let act = null;
    if (st.k === 'buy') act = makeButton(this, dx + dw / 2, 400, dw, 46, money2() >= sel.price ? `Buy · ${money(sel.price)}` : `Need ${money(sel.price)}`, () => this.buyDecor(sel), { size: 18 }).setEnabled(money2() >= sel.price);
    else if (sel.type === 'decor' && (st.k === 'shown' || st.k === 'stored')) act = makeButton(this, dx + dw / 2, 400, dw, 46, st.k === 'shown' ? 'Put away' : 'Put out', () => this.toggleDecor(sel), { fill: COL.basilMid, size: 18 });
    if (act) c.add(act);
  }
  swatch(g, it, x, y, w, h) {
    const s = it.def, hx = v => Phaser.Display.Color.HexStringToColor(v).color;
    if (it.type === 'wall') { for (let i = 0; i < 8; i++) g.fillStyle(hx(i % 2 ? s.b : s.a), 1).fillRect(x + i * w / 8, y, w / 8, h); }
    else if (it.type === 'floor') {
      if (s.majolica) {
        g.fillStyle(hx(s.a), 1).fillRect(x, y, w, h);
        for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) {
          const qx = x + (i + 0.5) * w / 4, qy = y + (j + 0.5) * h / 2;
          g.fillStyle((i + j) % 2 ? hx(s.b) : 0x2f8a6a, 1).fillTriangle(qx, qy - 10, qx + 9, qy, qx - 9, qy).fillTriangle(qx, qy + 10, qx + 9, qy, qx - 9, qy);
          g.fillStyle(0xf2c23a, 1).fillCircle(qx, qy, 3);
        }
      } else if (s.wood) for (let i = 0; i < 4; i++) g.fillStyle(hx(i % 2 ? s.b : s.a), 1).fillRect(x, y + i * h / 4, w, h / 4);
      else for (let i = 0; i < 5; i++) for (let j = 0; j < 3; j++) g.fillStyle(hx((i + j) % 2 ? s.b : s.a), 1).fillRect(x + i * w / 5, y + j * h / 3, w / 5, h / 3);
    } else {
      const [r, gg, b] = s.c.split(',').map(Number), col = (r << 16) | (gg << 8) | b;
      g.fillStyle(0xfbfbf7, 1).fillRect(x, y, w, h);
      for (let i = 0; i < 5; i++) for (let j = 0; j < 3; j++) if ((i + j) % 2 === 0) g.fillStyle(col, 1).fillRect(x + i * w / 5, y + j * h / 3, w / 5, h / 3);
    }
    g.lineStyle(2.5, COL.ink, 1).strokeRect(x, y, w, h);
  }
  itemState(it) {
    const d = it.def, mine = it.type === 'decor' ? decorOwned(it.id) : styleOwned(it.type, it.id);
    if (d.ch && !mine && !souvenirOpen(d, this.day)) return { k: 'locked', t: `Day ${chapterStart(d.ch)}` };
    if (it.type === 'decor') {
      if (!decorOwned(it.id)) return d.market ? { k: 'market', t: 'Market only' } : { k: 'buy', t: 'For sale' };
      const rec = SAVE.decor.find(r => r.id === it.id);
      return rec && rec.placed !== false ? { k: 'shown', t: 'In the room' } : { k: 'stored', t: 'In storage' };
    }
    if (!styleOwned(it.type, it.id)) return { k: 'buy', t: 'For sale' };
    return SAVE.room[it.type] === it.id ? { k: 'use', t: 'In use' } : { k: 'owned', t: 'Owned' };
  }
  pickDecor(it) {
    sfx('pop');
    this.dsel = it.id;
    if (it.type !== 'decor' && styleOwned(it.type, it.id)) { SAVE.room[it.type] = it.id; writeSave(); }
    this.showTab('decor');
  }
  buyDecor(it, price = it.price) {
    if (!spend(price)) return;
    sfx('ding');
    if (it.type === 'decor') {
      SAVE.owned['d:' + it.id] = 1;
      if (!SAVE.decor.some(r => r.id === it.id)) SAVE.decor.push({ uid: SAVE.nextUid++, id: it.id, ...freeSpot(it.id), placed: true });
      this.say(`${it.name} is up in the restaurant! Drag it around in Rearrange.`);
    } else { SAVE.owned[`s:${it.type}:${it.id}`] = 1; SAVE.room[it.type] = it.id; this.say(`New ${it.name.toLowerCase()}!`); }
    writeSave(); this.refresh();
  }
  toggleDecor(it) {
    const rec = SAVE.decor.find(r => r.id === it.id);
    if (!rec) SAVE.decor.push({ uid: SAVE.nextUid++, id: it.id, ...freeSpot(it.id), placed: true });
    else if (rec.placed === false) Object.assign(rec, freeSpot(it.id), { placed: true });
    else rec.placed = false;
    sfx('pop'); writeSave(); this.showTab('decor');
  }

  // ----- Upgrades -----
  tab_upgrades(c) {
    const sub = this.usub = this.usub || 'kitchen';
    [['kitchen', 'Kitchen'], ['room', 'Dining room'], ['staff', 'Staff'], ['renov', 'Renovate']].forEach(([k, n], i) => {
      const b = makeButton(this, PNL.x + 84 + i * 136, 186, 128, 38, n, () => { this.usub = k; this.showTab('upgrades'); }, { fill: k === sub ? COL.tomato : COL.basilMid, size: 17 });
      b.setSelected(k === sub); c.add(b);
    });
    if (sub === 'renov') { this.renovRows(c); return; }
    c.add(label(this, PNL.x + PNL.w - 22, 172, `Room for ${kitchenCap(SAVE.upgrades)} customers a day`, 17, '#2b1a10', { font: FD }).setOrigin(1, 0));
    c.add(label(this, PNL.x + PNL.w - 22, 196, `${crowdDemand(this.day)} people want to eat here today`, 13, crowdDemand(this.day) > kitchenCap(SAVE.upgrades) ? '#b8322a' : '#7d4a26').setOrigin(1, 0));
    UPGRADES.filter(u => u.group === sub).forEach((u, i) => {
      const y = 218 + i * 79, x0 = PNL.x + 16, rh = 74;
      const g = this.add.graphics(); c.add(g);
      const own = !u.repeat && SAVE.upgrades[u.id], flyer = u.repeat && SAVE.buzz.find(b => b.why === 'flyers');
      const locked = u.req && !SAVE.upgrades[u.req];
      g.fillStyle(own ? 0xe6f0d8 : locked ? 0xe6dcc6 : 0xf1e6cc, 1).fillRoundedRect(x0, y, PNL.w - 32, rh, 14);
      g.lineStyle(2.5, COL.ink, 0.8).strokeRoundedRect(x0, y, PNL.w - 32, rh, 14);
      g.fillStyle(0xfffaee, 1).fillRoundedRect(x0 + 8, y + 6, 62, 62, 10);
      const ic = this.add.container(x0 + 39, y + 37).setScale(0.78); c.add(ic);
      const ig = this.add.graphics(); ic.add(ig);
      this.upgradeIcon(ic, ig, u.id, 0, 0);
      const nm = label(this, x0 + 84, y + 6, u.name, 20, locked ? '#7d848c' : '#2b1a10', { font: FD }); c.add(nm);
      if (u.cap) c.add(label(this, x0 + 94 + nm.width, y + 12, `+${u.cap} customer${u.cap > 1 ? 's' : ''} a day`, 13, '#fbf3e0', { weight: '800' }).setBackgroundColor('#1f6b3b').setPadding(6, 1, 6, 1));
      const desc = locked ? `${u.desc} Buy the ${UPGRADES.find(q => q.id === u.req).name.toLowerCase()} first.` : u.desc;
      c.add(label(this, x0 + 84, y + 34, desc, 14, '#5b351b', { wrap: 500, ls: 1 }));
      let btn;
      if (own) btn = makeButton(this, x0 + 712, y + rh / 2, 150, 44, 'Owned', () => {}, { fill: COL.good, size: 19 }).setEnabled(false);
      else if (flyer) btn = makeButton(this, x0 + 712, y + rh / 2, 150, 44, `Out ${flyer.days} day${flyer.days > 1 ? 's' : ''}`, () => {}, { size: 18 }).setEnabled(false);
      else if (locked) btn = makeButton(this, x0 + 712, y + rh / 2, 150, 44, `Locked · ${money(u.price)}`, () => {}, { size: 16 }).setEnabled(false);
      else {
        const ok = money2() >= u.price;
        btn = makeButton(this, x0 + 712, y + rh / 2, 150, 44, ok ? `Buy · ${money(u.price)}` : `Need ${money(u.price)}`, () => this.buyUpgrade(u), { size: 18 }).setEnabled(ok);
      }
      c.add(btn);
    });
  }
  renovRows(c) {
    const cur = SAVE.renov || 0, g = this.add.graphics(); c.add(g);
    c.add(label(this, PNL.x + PNL.w - 22, 172, `Now: ${['Noodle Rush', 'Trattoria', 'Ristorante', 'Osteria Famosa'][cur]}`, 17, '#2b1a10', { font: FD }).setOrigin(1, 0));
    c.add(label(this, PNL.x + PNL.w - 22, 196, 'Every renovation raises every tip', 13, '#7d4a26').setOrigin(1, 0));
    RENOVATIONS.forEach((r, i) => {
      const y = 222 + i * 154, x0 = PNL.x + 16, rh = 146, own = cur >= r.tier, locked = cur < r.tier - 1, tx = x0 + 176;
      g.fillStyle(own ? 0xe6f0d8 : locked ? 0xe6dcc6 : 0xf1e6cc, 1).fillRoundedRect(x0, y, PNL.w - 32, rh, 14);
      g.lineStyle(2.5, COL.ink, 0.8).strokeRoundedRect(x0, y, PNL.w - 32, rh, 14);
      c.add(this.add.image(x0 + 86, y + rh / 2, tex(this, 'renov_' + r.tier, () => renovIconCanvas(r.tier))).setScale(1 / 1.5).setAlpha(locked ? 0.55 : 1));
      const nm = label(this, tx, y + 10, r.name, 24, locked ? '#7d848c' : '#2b1a10', { font: FD }); c.add(nm);
      c.add(label(this, tx + nm.width + 12, y + 18, `All tips +${Math.round(r.tip * 100)}%`, 14, '#fbf3e0', { weight: '800' }).setBackgroundColor('#1f6b3b').setPadding(6, 1, 6, 1));
      c.add(label(this, tx, y + 48, locked ? `${r.desc} Finish the ${RENOVATIONS[i - 1].name} first.` : r.desc, 15, '#5b351b', { wrap: 380, ls: 1 }));
      if (!own && !locked) {
        const bw = 380, f = Math.min(1, money2() / r.price);
        g.fillStyle(0xe2d6bc, 1).fillRoundedRect(tx, y + 110, bw, 20, 10);
        if (f > 0) g.fillStyle(f >= 1 ? 0x2e7d32 : COL.pasta, 1).fillRoundedRect(tx, y + 110, Math.max(20, bw * f), 20, 10);
        g.lineStyle(2, COL.ink, 0.8).strokeRoundedRect(tx, y + 110, bw, 20, 10);
        c.add(label(this, tx + bw / 2, y + 120, `${money(Math.min(money2(), r.price))} of ${money(r.price)} saved`, 13, '#2b1a10').setOrigin(0.5));
      }
      let btn;
      if (own) btn = makeButton(this, x0 + 712, y + rh / 2, 150, 46, cur === r.tier ? 'Open ✓' : 'Done ✓', () => {}, { fill: COL.good, size: 19 }).setEnabled(false);
      else if (locked) btn = makeButton(this, x0 + 712, y + rh / 2, 150, 46, `Locked · ${money(r.price)}`, () => {}, { size: 15 }).setEnabled(false);
      else { const ok = money2() >= r.price; btn = makeButton(this, x0 + 712, y + rh / 2, 150, 46, ok ? `Buy · ${money(r.price)}` : `Need ${money(r.price)}`, () => this.buyRenov(r), { size: 17 }).setEnabled(ok); }
      c.add(btn);
    });
  }
  buyRenov(r) {
    if (!spend(r.price)) return;
    SAVE.renov = r.tier; sfx('ding');
    this.say({ 1: 'Welcome to Trattoria Noodle Rush! Peek at the new look in Decor.', 2: 'Ristorante Noodle Rush is open for business!', 3: 'Noodle Rush is famous across Italy!' }[r.tier]);
    writeSave(); this.refresh();
  }
  upgradeIcon(c, g, id, x, y) {
    if (id === 'garlic') drawBread(g, x, y + 2, 0.85, 0.75);
    else if (id === 'pot3') {
      for (let i = -1; i <= 1; i++) {
        g.fillStyle(COL.steel, 1).fillRoundedRect(x + i * 22 - 10, y - 4, 20, 24, 5);
        g.lineStyle(2.5, COL.ink, 1).strokeRoundedRect(x + i * 22 - 10, y - 4, 20, 24, 5);
        g.fillStyle(0x9fd3e8, 1).fillEllipse(x + i * 22, y - 4, 20, 6);
      }
      g.fillStyle(0xffffff, 0.6).fillCircle(x - 18, y - 16, 4).fillCircle(x + 4, y - 20, 5).fillCircle(x + 24, y - 14, 3);
    } else if (id === 'pot4') {
      g.fillStyle(0x3d4247, 1).fillRoundedRect(x - 32, y - 2, 64, 26, 6).lineStyle(2.5, COL.ink, 1).strokeRoundedRect(x - 32, y - 2, 64, 26, 6);
      for (const dx of [-15, 15]) { g.fillStyle(COL.steel, 1).fillRoundedRect(x + dx - 12, y - 24, 24, 22, 5); g.lineStyle(2.5, COL.ink, 1).strokeRoundedRect(x + dx - 12, y - 24, 24, 22, 5); g.fillStyle(0x9fd3e8, 1).fillEllipse(x + dx, y - 24, 22, 6); }
      g.fillStyle(0xff8a2a, 1).fillCircle(x - 15, y + 12, 4).fillCircle(x + 15, y + 12, 4);
    } else if (id === 'fastpot') {
      g.fillStyle(0xff7a1a, 1).fillTriangle(x - 22, y + 24, x + 22, y + 24, x, y - 30);
      g.fillStyle(0xffc14a, 1).fillTriangle(x - 12, y + 24, x + 12, y + 24, x, y - 8);
      g.lineStyle(2.5, COL.ink, 1).strokeTriangle(x - 22, y + 24, x + 22, y + 24, x, y - 30);
    } else if (id === 'machine') {
      g.fillStyle(COL.steel, 1).fillRoundedRect(x - 26, y - 20, 52, 36, 8).lineStyle(2.5, COL.ink, 1).strokeRoundedRect(x - 26, y - 20, 52, 36, 8);
      g.fillStyle(0x9aa1a8, 1).fillRect(x - 20, y - 8, 40, 6).fillRect(x - 20, y + 2, 40, 6);
      g.fillStyle(COL.pasta, 1).fillRect(x - 16, y + 16, 32, 14).lineStyle(2, COL.ink, 1).strokeRect(x - 16, y + 16, 32, 14);
      g.fillStyle(0xf2b630, 1).fillCircle(x + 22, y - 22, 6);
    } else if (id === 'register2') {
      c.add(this.add.image(x, y, tex(this, 'portrait_matteo', () => portraitCanvas(MATTEO_LOOK, 96, '#f3e2bf'))).setScale(64 / (96 * ART_SCALE)));
    } else if (id === 'baker') {
      c.add(this.add.image(x, y, tex(this, 'portrait_pina', () => portraitCanvas(BAKER_LOOK, 96, '#f3e2bf'))).setScale(64 / (96 * ART_SCALE)));
    } else if (id === 'cook') {
      c.add(this.add.image(x, y, tex(this, 'portrait_rocco', () => portraitCanvas(ROCCO_LOOK, 96, '#f3e2bf', 0.8, 84, 0.58))).setScale(64 / (96 * ART_SCALE)));
    } else if (id === 'table3' || id === 'table4') c.add(this.add.image(x, y - 10, tex(this, 'table_' + SAVE.room.cloth, () => tableCanvas(172, styleOf('cloth', SAVE.room.cloth).c))).setOrigin(0.5, 0.3).setScale(0.38));
    else if (id === 'cushions') c.add(this.add.image(x, y, tex(this, 'chair_c', () => chairCanvas(true))).setScale(0.48));
    else {
      g.fillStyle(0xfbfbf7, 1).fillRect(x - 22, y - 28, 40, 54).lineStyle(2.5, COL.ink, 1).strokeRect(x - 22, y - 28, 40, 54);
      g.fillStyle(0xf4f1e8, 1).fillRect(x - 14, y - 22, 40, 54).lineStyle(2.5, COL.ink, 1).strokeRect(x - 14, y - 22, 40, 54);
      g.fillStyle(COL.tomato, 1).fillRect(x - 9, y - 16, 30, 10);
      g.fillStyle(COL.pasta, 1).fillCircle(x + 6, y + 8, 9);
      g.fillStyle(0x7d4a26, 1).fillRect(x - 9, y + 22, 30, 3);
    }
  }
  buyUpgrade(u, price = u.price) {
    if (!spend(price)) return;
    sfx('ding');
    if (u.id === 'flyers') { SAVE.buzz.push({ delta: 2, days: 2, why: 'flyers' }); this.say('Flyers are up all over the piazza!'); }
    else {
      SAVE.upgrades[u.id] = true;
      if ((u.id === 'table3' && SAVE.tables.length < 3) || (u.id === 'table4' && SAVE.tables.length < 4)) {
        const x = EXTRA_TABLE_XS.find(x => !SAVE.tables.some(t => t.row === 1 && Math.abs(t.x - x) < 180)) ?? 420;
        SAVE.tables.push({ x, row: 1 });
      }
      this.say({ garlic: 'The oven is in! Look for the new Oven station.', pot3: 'A third pot is on the stove.', pot4: 'Four pots boiling at once. Now we are cooking!',
        fastpot: 'Hotter burners! The water boils faster now.', machine: 'The electric roller is in. Fewer turns of the crank!',
        table3: 'New table! Move it around in Rearrange.', table4: 'Another table! Move it around in Rearrange.', cushions: 'So comfy. Customers will wait longer now.',
        register2: 'Cousin Matteo is at the second register!', cook: 'Rocco is hired! He will watch the pots for you.', baker: 'Zia Pina is hired! She will mind the oven for you.' }[u.id]);
    }
    writeSave(); this.refresh();
  }

  // ----- Nonna's recipe book -----
  tab_recipes(c) {
    const g = this.add.graphics(); c.add(g);
    const mx = PNL.x + 18, my = 166, mw = 300, mh = 520;
    g.fillStyle(0xbfe0ec, 1).fillRoundedRect(mx, my, mw, mh, 14);
    g.lineStyle(3, COL.ink, 0.7).strokeRoundedRect(mx, my, mw, mh, 14);
    c.add(label(this, mx + mw / 2, my + 10, "Nonna's journey across Italy", 17, '#2b1a10', { font: FD }).setOrigin(0.5, 0));
    // longitude and latitude to the map (degrees of longitude shrink to about 0.74 this far north)
    const k = 30, P = ([lon, lat]) => ({ x: mx + 16 + (lon - 6.6) * 0.74 * k, y: my + 40 + (47.2 - lat) * k });
    const land = pts => { const q = pts.map(P); g.fillStyle(0xe9d9a6, 1).fillPoints(q, true); g.lineStyle(2.5, COL.ink, 0.8).strokePoints(q, true); };
    land([[7.0, 45.9], [8.4, 46.4], [9.3, 46.5], [10.5, 46.9], [12.2, 47.1], [13.7, 46.5], [13.6, 45.8], [12.4, 45.4], [12.3, 44.8], [12.6, 44.0], [13.6, 43.5], [14.3, 42.5], [15.1, 41.9], [16.2, 41.9], [15.9, 41.5], [17.2, 40.9], [18.5, 40.1], [18.3, 39.8], [17.2, 40.4], [16.6, 40.1], [16.6, 39.6], [17.1, 39.0], [16.5, 38.7], [16.1, 38.0], [15.6, 38.0], [15.8, 38.6], [15.7, 39.4], [15.6, 40.0], [15.0, 40.2], [14.3, 40.8], [13.7, 41.2], [12.4, 41.7], [11.1, 42.4], [10.5, 42.9], [10.3, 43.6], [10.0, 44.0], [9.2, 44.3], [8.9, 44.4], [8.2, 43.9], [7.5, 43.8], [7.0, 44.2], [6.6, 45.1]]);
    land([[12.4, 38.1], [13.4, 38.2], [15.6, 38.3], [15.1, 37.3], [15.1, 36.7], [14.4, 36.8], [12.6, 37.6]]);
    land([[8.2, 41.0], [9.2, 41.2], [9.8, 40.5], [9.6, 39.2], [9.0, 39.0], [8.4, 38.9], [8.4, 39.9], [8.1, 40.6]]);
    const cur = chapterAt(this.day).id;
    if (this.rch == null) this.rch = CHAPTERS.findIndex(q => q.id === cur);
    const pickCh = i => { if (i === this.rch) return; sfx('pop'); this.rch = i; this.showTab('recipes'); };
    // the route Nonna travels, drawn under the pins
    const route = CHAPTERS.map(ch => P([ch.lon, ch.lat]));
    for (let i = 1; i < route.length; i++) {
      const done = this.day >= CHAPTERS[i].start, a = route[i - 1], b = route[i], n = Math.ceil(Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y) / 9);
      for (let q = 1; q < n; q++) g.fillStyle(done ? COL.tomato : 0x7d848c, done ? 0.9 : 0.6).fillCircle(a.x + (b.x - a.x) * q / n, a.y + (b.y - a.y) * q / n, 2);
    }
    CHAPTERS.forEach((ch, i) => {
      const q = P([ch.lon, ch.lat]), open = this.day >= ch.start, now = ch.id === cur, sel = i === this.rch, r = now ? 13 : 11;
      if (sel) g.lineStyle(4, 0xf6c453, 1).strokeCircle(q.x, q.y, r + 5);
      g.fillStyle(now ? COL.tomato : open ? COL.basilMid : 0x9a978a, 1).fillCircle(q.x, q.y, r);
      g.lineStyle(2.5, COL.ink, 1).strokeCircle(q.x, q.y, r);
      c.add(label(this, q.x, q.y, String(i + 1), now ? 15 : 13, '#fff8e8', { font: FD }).setOrigin(0.5));
      const pz = this.add.zone(q.x, q.y, 36, 36).setInteractive({ useHandCursor: true }); pz.on('pointerdown', () => pickCh(i)); c.add(pz);
      const ly = my + 380 + i * 22;
      if (sel) g.fillStyle(0xfff3c4, 1).fillRoundedRect(mx + 8, ly - 2, mw - 16, 21, 6);
      c.add(label(this, mx + 18, ly, `${i + 1}. ${ch.name}`, 15, now ? '#b8322a' : '#2b1a10', { font: FD }));
      c.add(label(this, mx + mw - 16, ly + 2, now ? 'Now cooking' : open ? 'Done ✓' : ch.note, 13, now ? '#b8322a' : open ? '#1f6b3b' : '#5b6168').setOrigin(1, 0));
      const lz = this.add.zone(mx + mw / 2, ly + 9, mw - 16, 22).setInteractive({ useHandCursor: true }); lz.on('pointerdown', () => pickCh(i)); c.add(lz);
    });

    // the chosen chapter: what you learn on which day
    const ch = CHAPTERS[this.rch], lx = PNL.x + 340, lw = PNL.w - 360;
    c.add(label(this, lx, 166, `Chapter ${this.rch + 1} · ${placeName(ch)}`, 24, '#2b1a10', { font: FD }));
    c.add(label(this, lx, 200, this.day >= ch.start ? 'Tap a recipe to cook it at home with a grown-up, or tap the map.' : `Nonna brings you here on Day ${ch.start}. Tap the map for other cities.`, 14, '#7d4a26', { wrap: lw }));
    UNLOCKS.filter(u => u.ch === ch.id).forEach((u, i) => {
      const y = 232 + i * 64, open = u.day <= this.day, rg = this.add.graphics(); c.add(rg);
      rg.fillStyle(open ? 0xf1e6cc : 0xe6dcc6, 1).fillRoundedRect(lx, y, lw, 58, 12);
      rg.lineStyle(2, COL.ink, open ? 0.8 : 0.35).strokeRoundedRect(lx, y, lw, 58, 12);
      rg.fillStyle(open ? COL.basilMid : 0x9a978a, 1).fillRoundedRect(lx + 8, y + 8, 64, 42, 10);
      c.add(label(this, lx + 40, y + 12, 'Day', 11, '#cfe3c9').setOrigin(0.5, 0));
      c.add(label(this, lx + 40, y + 22, String(u.day), 20, '#fbf3e0', { font: FD }).setOrigin(0.5, 0));
      const tl = label(this, lx + 84, y + 6, RECIPES[u.recipe].title, 17, open ? '#2b1a10' : '#7d848c', { font: FD });
      for (let fsz = 16; tl.width > lw - 220 && fsz >= 13; fsz--) tl.setFontSize(fsz);
      c.add(tl);
      c.add(label(this, lx + 84, y + 32, `${u.rank} · ${u.what}`, 13, open ? '#5b351b' : '#7d848c', { wrap: lw - 160 }));
      c.add(label(this, lx + lw - 14, y + 20, open ? 'Read recipe ›' : `Day ${u.day}`, 15, open ? '#1f6b3b' : '#7d848c', { font: FD }).setOrigin(1, 0));
      if (open) { const z = this.add.zone(lx + lw / 2, y + 29, lw, 58).setInteractive({ useHandCursor: true }); z.on('pointerdown', () => { sfx('pop'); this.showRecipeCard(u, false); }); c.add(z); }
    });
  }

  showRecipeCard(u, isNew) {
    const R = RECIPES[u.recipe], c = this.add.container(0, 0).setDepth(220);
    const g = this.add.graphics(); c.add(g);
    g.fillStyle(0x000000, 0.6).fillRect(0, 0, W, H);
    c.add(this.add.zone(W / 2, H / 2, W, H).setInteractive());
    const x0 = 90, y0 = 34, w = W - 180, h = H - 68;
    g.fillStyle(0x000000, 0.25).fillRoundedRect(x0 + 6, y0 + 8, w, h, 22);
    g.fillStyle(0xfffaee, 1).fillRoundedRect(x0, y0, w, h, 22);
    g.lineStyle(4, COL.ink, 1).strokeRoundedRect(x0, y0, w, h, 22);
    for (let i = 0; i < w; i += 28) g.fillStyle(i / 28 % 2 ? 0xfbf3e0 : COL.tomato, 1).fillRect(x0 + i, y0 + 14, Math.min(28, w - i), 10);
    if (isNew) {
      const ci = CHAPTERS.findIndex(q => q.start === u.day);
      c.add(label(this, x0 + 30, y0 + 34, isChapterStart(u) ? `Chapter ${ci + 1}: Welcome to ${CHAPTERS[ci].name}! You are now: ${u.rank}` : `New in Nonna's recipe book! You are now: ${u.rank}`, 18, '#b8322a', { font: FD }));
      c.add(label(this, x0 + w - 30, y0 + 38, u.what, 15, '#1f6b3b').setOrigin(1, 0));
    }
    c.add(this.add.image(x0 + 72, y0 + 104, tex(this, 'portrait_nonna', () => portraitCanvas(NONNA_LOOK, 96, '#f3e2bf'))).setScale(80 / (96 * ART_SCALE)));
    c.add(label(this, x0 + 128, y0 + 66, R.title, 32, '#2b1a10', { font: FD }));
    c.add(label(this, x0 + 130, y0 + 112, `${R.serves} · ${R.time}`, 16, '#7d4a26'));
    let isz = 20, ing;
    do { if (ing) ing.destroy(); ing = label(this, x0 + 30, y0 + 160, 'You need\n' + R.ingredients.map(t => '• ' + t).join('\n'), isz, '#2b1a10', { wrap: 330, ls: 5 }); isz--; } while (ing.height > 320 && isz > 13);
    c.add(ing);
    let size = 21, st;
    do { if (st) st.destroy(); st = label(this, x0 + 400, y0 + 160, R.steps.map((t, i) => `${i + 1}. ${t}`).join('\n'), size, '#2b1a10', { wrap: w - 430, ls: size > 15 ? 7 : 3 }); size--; } while (st.height > 320 && size > 12);
    c.add(st);
    g.lineStyle(2, 0xd8c8a4, 1).lineBetween(x0 + 380, y0 + 160, x0 + 380, y0 + 480);
    c.add(label(this, x0 + 30, y0 + 498, `Nonna's tip: ${R.tip}`, 20, '#24345a', { font: FH, weight: '400', wrap: w - 60 }));
    c.add(label(this, x0 + 30, y0 + h - 44, SAFETY, 14, '#b8322a'));
    c.add(makeButton(this, x0 + w - 110, y0 + h - 42, 180, 50, isNew ? 'Bellissimo!' : 'Close', () => { c.destroy(true); if (isNew) this.nextPopup(); }, { fill: COL.basilMid, size: 21 }));
    c.setAlpha(0); this.tweens.add({ targets: c, alpha: 1, duration: 250 });
    if (isNew) sfx('ding');
  }

  askFeedback(again) {
    if (again) SAVE.feedbackAskedReal = true; else SAVE.feedbackAsked = true;
    writeSave();
    const c = this.add.container(0, 0).setDepth(210), g = this.add.graphics(); c.add(g);
    g.fillStyle(0x000000, 0.55).fillRect(0, 0, W, H);
    c.add(this.add.zone(W / 2, H / 2, W, H).setInteractive());
    g.fillStyle(0xfffaee, 1).fillRoundedRect(W / 2 - 360, H / 2 - 150, 720, 300, 22);
    g.lineStyle(4, COL.ink, 1).strokeRoundedRect(W / 2 - 360, H / 2 - 150, 720, 300, 22);
    c.add(addPerson(this, 'nonna', NONNA_LOOK, W / 2 - 250, H / 2 + 140, 0.9));
    c.add(label(this, W / 2 - 150, H / 2 - 124, 'A favor, tesoro?', 28, '#b8322a', { font: FD }));
    c.add(label(this, W / 2 - 150, H / 2 - 80, again ? "You keep coming back to the shop, and that makes Nonna very happy! What brings you back each day? Tell us in one minute, and it helps make Noodle Rush better." : "You have run the shop for a few days now. Tell us what you think! It takes one minute, and it helps make Noodle Rush better.", 18, '#2b1a10', { wrap: 470, ls: 4 }));
    c.add(makeButton(this, W / 2 + 160, H / 2 + 100, 200, 52, 'Give feedback', () => { c.destroy(true); if (window.openFeedback) window.openFeedback(); this.nextPopup(); }, { size: 21 }));
    c.add(makeButton(this, W / 2 - 40, H / 2 + 100, 150, 48, 'Later', () => { c.destroy(true); this.nextPopup(); }, { fill: COL.basilMid, size: 20 }));
  }

  // ----- Newspaper -----
  showPaper() {
    const P = SAVE.paper, c = this.add.container(0, 0).setDepth(200);
    const g = this.add.graphics(); c.add(g);
    g.fillStyle(0x000000, 0.6).fillRect(0, 0, W, H);
    c.add(this.add.zone(W / 2, H / 2, W, H).setInteractive());
    const x0 = W / 2 - 380, y0 = 60, w = 760, h = 600;
    g.fillStyle(0x000000, 0.3).fillRect(x0 + 8, y0 + 10, w, h);
    g.fillStyle(0xf4efe2, 1).fillRect(x0, y0, w, h);
    g.lineStyle(3, COL.ink, 1).strokeRect(x0, y0, w, h);
    const serif = 'Georgia, "Times New Roman", serif';
    c.add(label(this, W / 2, y0 + 22, 'La Gazzetta di Borgo Fiore', 40, '#1d1d1d', { font: serif, weight: '700' }).setOrigin(0.5, 0));
    g.lineStyle(2, 0x1d1d1d, 1).lineBetween(x0 + 30, y0 + 80, x0 + w - 30, y0 + 80).lineBetween(x0 + 30, y0 + 112, x0 + w - 30, y0 + 112);
    c.add(label(this, x0 + 34, y0 + 86, `Morning of Day ${this.day}`, 16, '#444', { font: serif, weight: '400' }));
    c.add(label(this, x0 + w - 34, y0 + 86, 'FOOD & DINING', 16, '#444', { font: serif, weight: '700' }).setOrigin(1, 0));
    c.add(label(this, W / 2, y0 + 130, P.head, 38, '#1d1d1d', { font: FD, align: 'center', wrap: w - 60, ls: 0 }).setOrigin(0.5, 0));
    for (let s = 0; s < 5; s++) drawStar(g, W / 2 - 96 + s * 48, y0 + 236, 19, s < P.stars);
    c.add(label(this, W / 2, y0 + 266, `Review by ${CRITIC.name}, food critic`, 17, '#555', { font: serif, weight: '400' }).setOrigin(0.5, 0));
    const crit = { ...CRITIC.look };
    c.add(this.add.image(x0 + 110, y0 + 390, tex(this, 'portrait_critic', () => portraitCanvas(crit, 120, '#e6dcc6'))).setScale(150 / (120 * ART_SCALE)));
    c.add(label(this, x0 + 210, y0 + 314, `"${P.body}"`, 21, '#1d1d1d', { font: serif, weight: '400', wrap: w - 250, ls: 6 }));
    const eff = P.buzz > 0 ? `Good news: more customers will come in for the next ${P.days} days!` : P.buzz < 0 ? `Uh oh: fewer customers will come for the next ${P.days} days. Win them back with great plates.` : 'Not bad, not great. Business as usual.';
    const ec = P.buzz > 0 ? '#2e7d32' : P.buzz < 0 ? '#b8322a' : '#5b351b';
    g.lineStyle(2, 0x1d1d1d, 1).lineBetween(x0 + 30, y0 + 488, x0 + w - 30, y0 + 488);
    c.add(label(this, W / 2, y0 + 502, eff, 19, ec, { align: 'center', wrap: w - 80 }).setOrigin(0.5, 0));
    c.add(makeButton(this, W / 2, y0 + h - 34, 220, 48, 'Back to work', () => { P.read = true; writeSave(); c.destroy(true); this.nextPopup(); }, { fill: COL.basilMid, size: 21 }));
    c.setAlpha(0); this.tweens.add({ targets: c, alpha: 1, duration: 300 });
    sfx(P.buzz > 0 ? 'ding' : 'pop');
  }
}

// ================= Rearrange the restaurant =================
class DecorateScene extends Phaser.Scene {
  constructor() { super('decorate'); }
  create() {
    this.cameras.main.setBackgroundColor(COL.basil);
    const c = this.add.container(0, 0);
    const R = this.R = buildRoom(this, c);
    const look = chefLook(SAVE.chef);
    R.mid.add(addPerson(this, lookId(SAVE.chef, look), look, 737, FLOOR, 0.95));
    R.mid.add(this.add.image(545, 430 - 68, tex(this, 'counter', counterCanvas)).setOrigin(0, 0).setScale(1 / 1.5));
    R.decor.forEach(img => this.makeDraggable(img));
    R.tables.forEach(T => [T.table, ...T.chairs].forEach(o => { o.T = T; o.setInteractive({ useHandCursor: true, draggable: true }); }));

    const hg = this.add.graphics();
    hg.fillStyle(COL.basil, 1).fillRect(0, 0, W, TOP);
    hg.fillStyle(0x000000, 0.25).fillRect(0, TOP - 4, W, 4);
    hg.fillStyle(COL.basil, 1).fillRect(0, TOP + 458, W, H - TOP - 458);
    label(this, 28, 14, 'Rearrange the restaurant', 34, '#f6c453', { font: FD });
    label(this, 30, 60, 'Drag decorations and tables to move them. Drop a decoration up here to put it in storage.', 16, '#cfe3c9', { wrap: 420 });
    label(this, 28, TOP + 468, 'The back row has room for two tables. The front row is wide open.', 16, '#cfe3c9');
    this.trayG = this.add.graphics();
    this.tray = this.add.container(0, 0);
    this.trayHot = false;
    makeButton(this, 1170, 66, 170, 56, 'Done', () => { writeSave(); this.scene.start('morning'); }, { size: 26 });
    this.dragLayer = this.add.container(0, 0);
    this.toast = label(this, W / 2, 690, '', 18, '#2b1a10').setOrigin(0.5).setPadding(14, 6, 14, 6).setAlpha(0).setDepth(300);
    this.refreshTray();

    this.input.on('dragstart', (p, o) => {
      o.sx = o.x; o.sy = o.y;
      if (o.T) { const t = o.T.rec; o.srow = t.row; o.sxr = t.x; o.offX = p.x - t.x; o.offY = p.y - TABLE_ROWS[t.row].top; }
      else { o.parentContainer.remove(o); this.dragLayer.add(o); }
      sfx('pop');
    });
    this.input.on('drag', (p, o, dx, dy) => {
      if (o.T) {
        const t = o.T.rec, vx = p.x - o.offX, vy = p.y - o.offY, row = vy > (TABLE_ROWS[0].top + TABLE_ROWS[1].top) / 2 ? 1 : 0;
        t.row = row; t.x = Math.round(row ? clamp(vx, 110, 1190) : clamp(vx, 1000, 1200));
        o.T.place();
        return;
      }
      const store = p.y < TOP - 6;
      o.setScale((store ? 0.55 : 1) / 1.5);
      if (store) o.setPosition(p.x, p.y).setAlpha(0.85);
      else if (o.def.kind === 'wall') o.setPosition(clamp(dx, 30, 1250), clamp(dy, TOP + 30, TOP + 225)).setAlpha(1);
      else o.setPosition(clamp(dx, 30, 1250), clamp(dy, FLOOR - 2, TOP + 456)).setAlpha(1);
      if (store !== this.trayHot) { this.trayHot = store; this.refreshTray(); }
    });
    this.input.on('dragend', (p, o) => {
      if (o.T) {
        const t = o.T.rec, clash = SAVE.tables.some(q => q !== t && q.row === t.row && Math.abs(q.x - t.x) < 180);
        if (clash) { t.row = o.srow; t.x = o.sxr; o.T.place(); this.say('Too close to another table!', '#f08a7a'); }
        writeSave(); return;
      }
      if (p.y < TOP - 6) {
        o.rec.placed = false; this.R.decor = this.R.decor.filter(q => q !== o); o.destroy(); sfx('pop');
      } else {
        o.setAlpha(1); o.rec.x = Math.round(o.x); o.rec.y = Math.round(o.y); layerDecor(this.R, o);
        this.R.backFloor.sort('y'); this.R.frontFloor.sort('y');
      }
      this.trayHot = false; writeSave(); this.refreshTray();
    });
  }
  makeDraggable(img) { img.setInteractive({ useHandCursor: true, draggable: true }); }
  say(msg, color) {
    this.toast.setText(msg).setBackgroundColor(color || '#f6c453');
    this.tweens.killTweensOf(this.toast); this.toast.setAlpha(1);
    this.tweens.add({ targets: this.toast, alpha: 0, delay: 1600, duration: 500 });
  }
  refreshTray() {
    const g = this.trayG, x0 = 470, y0 = 18, w = 560, h = 146;
    g.clear();
    g.fillStyle(this.trayHot ? 0x2f8a4c : COL.basilMid, 1).fillRoundedRect(x0, y0, w, h, 16);
    g.lineStyle(this.trayHot ? 5 : 3, this.trayHot ? COL.pasta : 0x0a3016, 1).strokeRoundedRect(x0, y0, w, h, 16);
    this.tray.removeAll(true);
    const stored = SAVE.decor.filter(r => r.placed === false);
    this.tray.add(label(this, x0 + 16, y0 + 8, this.trayHot ? 'Let go to put it in storage' : 'Storage', 18, '#f6c453', { font: FD }));
    if (!stored.length) this.tray.add(label(this, x0 + 16, y0 + 50, this.trayHot ? '' : 'Nothing in storage. Buy more decorations in the morning shop.', 15, '#cfe3c9', { wrap: w - 32 }));
    stored.slice(0, 7).forEach((rec, i) => {
      const x = x0 + 54 + i * 76, y = y0 + 84, [dw, dh] = DECOR_SIZE[rec.id], k = Math.min(60 / dw, 70 / dh);
      const img = this.add.image(x, y, tex(this, 'decor_' + rec.id, () => decorCanvas(rec.id))).setDisplaySize(dw * k, dh * k).setInteractive({ useHandCursor: true });
      img.on('pointerdown', () => {
        Object.assign(rec, freeSpot(rec.id, rec.uid), { placed: true });
        const im = decorImage(this, rec); this.R.decor.push(im); layerDecor(this.R, im); this.makeDraggable(im);
        sfx('pop'); writeSave(); this.refreshTray();
      });
      this.tray.add(img);
    });
    if (stored.length) this.tray.add(label(this, x0 + w - 14, y0 + 10, 'Click to put out', 14, '#cfe3c9').setOrigin(1, 0));
  }
}

// ---------- Nonna's garden: crops grow on the real clock ----------
const cropDef = id => CROPS.find(q => q.id === id);
const bedState = (b, now = nowMs()) => !b.crop ? 'empty' : now >= b.ready ? 'ready' : 'growing';
function bedStage(b, now = nowMs()) {
  if (bedState(b, now) === 'ready') return 4;
  const p = 1 - (b.ready - now) / b.total;
  return p < 0.2 ? 0 : p < 0.45 ? 1 : p < 0.7 ? 2 : 3;
}
function gardenSummary() {
  const now = nowMs(), beds = SAVE.garden.beds;
  const grow = beds.filter(b => bedState(b, now) === 'growing');
  return { ready: beds.filter(b => bedState(b, now) === 'ready').length, empty: beds.filter(b => !b.crop).length,
    next: grow.length ? Math.min(...grow.map(b => b.ready)) - now : 0 };
}
const growText = mins => mins < 60 ? `${mins} minutes` : `${mins / 60} hour${mins === 60 ? '' : 's'}`;

class GardenScene extends Phaser.Scene {
  constructor() { super('garden'); }
  create() {
    this.cameras.main.setBackgroundColor(COL.basil);
    this.add.image(0, 92, tex(this, 'garden_bg', gardenCanvas)).setOrigin(0, 0).setScale(1 / 1.5);
    const hg = this.add.graphics();
    hg.fillStyle(COL.basil, 1).fillRect(0, 0, W, 92);
    hg.fillStyle(0x000000, 0.25).fillRect(0, 88, W, 4);
    label(this, 30, 10, "Nonna's garden", 38, '#f6c453', { font: FD });
    this.sub = label(this, 32, 58, '', 17, '#cfe3c9');
    makeButton(this, 1136, 46, 228, 54, 'Back to the morning', () => { writeSave(); this.scene.start('morning'); }, { size: 21 });
    this.toast = label(this, 470, 118, '', 19, '#2b1a10').setOrigin(0.5, 0).setPadding(14, 6, 14, 6).setAlpha(0).setDepth(300);
    this.fx = this.add.container(0, 0).setDepth(250);
    this.beds = [];
    for (let i = 0; i < GARDEN_START + BED_PRICES.length; i++) this.beds.push(this.makeBed(i));
    this.buildBasket();
    this.refreshAll();
    this.time.addEvent({ delay: 1000, loop: true, callback: () => this.refreshAll() });
  }

  say(msg, color) {
    this.toast.setText(msg).setBackgroundColor(color || '#f6c453');
    this.tweens.killTweensOf(this.toast); this.toast.setAlpha(1);
    this.tweens.add({ targets: this.toast, alpha: 0, delay: 2000, duration: 500 });
  }

  makeBed(i) {
    const x = 150 + (i % 4) * 220, y = 350 + Math.floor(i / 4) * 230;
    const B = { i, x, y };
    B.img = this.add.image(x, y, tex(this, 'bed', () => bedCanvas(false))).setScale(1 / 1.5);
    B.crop = this.add.image(x, y - 3, '__DEFAULT').setOrigin(0.5, 150 / 160).setScale(0.72 / 1.5).setVisible(false);
    B.tag = label(this, x, y + 37, '', 15, '#fff8e8').setOrigin(0.5).setPadding(8, 2, 8, 2).setBackgroundColor('#3a2414');
    B.btn = makeButton(this, x, y + 92, 184, 42, '', () => this.tapBed(B), { fill: COL.basilMid, size: 18 });
    B.zone = this.add.zone(x, y - 30, 204, 190).setInteractive({ useHandCursor: true });
    B.zone.on('pointerdown', () => { if (!this.modal) this.tapBed(B, true); });
    return B;
  }

  refreshAll() {
    const now = nowMs(), beds = SAVE.garden.beds;
    this.beds.forEach(B => {
      const b = beds[B.i], owned = !!b, next = B.i === beds.length;
      B.img.setVisible(owned || next).setTexture(tex(this, owned ? 'bed' : 'bed_locked', () => bedCanvas(!owned)));
      B.zone.input.enabled = owned || next;
      B.btn.setVisible(owned || next);
      if (!owned) {
        B.crop.setVisible(false);
        const price = BED_PRICES[B.i - GARDEN_START];
        B.tag.setVisible(next).setText('New garden bed');
        if (next) B.btn.setLabel(money2() >= price ? `Buy · ${money(price)}` : `Need ${money(price)}`).setEnabled(money2() >= price).setFill(COL.tomato);
        return;
      }
      const st = bedState(b, now), cd = b.crop && cropDef(b.crop);
      if (b.crop) {
        const k = `crop_${b.crop}_${bedStage(b, now)}`;
        if (B.crop.texture.key !== k) { B.crop.setTexture(tex(this, k, () => cropCanvas(b.crop, bedStage(b, now)))); }
        B.crop.setVisible(true);
      } else B.crop.setVisible(false);
      if (st === 'empty') { B.tag.setVisible(true).setText('Empty bed'); B.btn.setLabel('Plant seeds').setEnabled(true).setFill(COL.basilMid); }
      else if (st === 'ready') { B.tag.setVisible(true).setText(`${cd.name} · ready!`); B.btn.setLabel(`Pick ${b.yieldN || cd.yield} ${b.yieldN === 1 ? cd.one : cd.many}`.slice(0, 22)).setEnabled(true).setFill(COL.tomato); }
      else { B.tag.setVisible(true).setText(`${cd.name} · ${durText(b.ready - now)}`); B.btn.setLabel(b.watered ? 'Watered ✓' : 'Water it').setEnabled(!b.watered).setFill(0x2f5ea8); }
    });
    const gs = gardenSummary();
    this.sub.setText(!SAVE.stats.planted ? 'Tap an empty bed to plant seeds. They grow on the real clock, even while the game is closed.'
      : gs.ready ? `${gs.ready} bed${gs.ready > 1 ? 's are' : ' is'} ready to pick!` : gs.next ? `Next harvest in ${durText(gs.next)}. Crops never wilt, so come back any time.` : 'Every bed is empty. Seeds are free!');
    this.refreshBasket();
  }

  tapBed(B, fromZone) {
    const beds = SAVE.garden.beds, b = beds[B.i];
    if (!b) { if (B.i === beds.length) this.buyBed(); return; }
    const st = bedState(b);
    if (st === 'empty') this.seedPicker(B);
    else if (st === 'ready') this.harvest(B);
    else if (!b.watered) this.water(B);
    else if (fromZone) this.say(`The ${cropDef(b.crop).name.toLowerCase()} will be ready in ${durText(b.ready - nowMs())}.`);
  }

  buyBed() {
    const price = BED_PRICES[SAVE.garden.beds.length - GARDEN_START];
    if (price == null || !spend(price)) { this.say(`You need ${money(price || 0)} for a new bed.`, '#f08a7a'); return; }
    SAVE.garden.beds.push({ crop: null }); writeSave(); sfx('coin');
    this.say('A new garden bed! Plant something in it.');
    this.refreshAll(); this.refreshBasket();
  }

  plant(B, id) {
    const cd = cropDef(id), now = nowMs();
    SAVE.garden.beds[B.i] = { crop: id, start: now, ready: now + cd.mins * 60000, total: cd.mins * 60000, watered: false };
    SAVE.stats.planted++; writeSave(); sfx('pop');
    this.refreshAll();
    B.crop.setScale(0.2 / 1.5); this.tweens.add({ targets: B.crop, scale: 0.72 / 1.5, duration: 320, ease: 'Back.easeOut' });
    this.say(`${cd.name} planted! Ready in ${growText(cd.mins)}.`);
  }

  water(B) {
    const b = SAVE.garden.beds[B.i], now = nowMs();
    b.ready = now + Math.round((b.ready - now) * (1 - WATER_CUT)); b.watered = true;
    SAVE.stats.watered++; writeSave(); sfx('ding');
    for (let k = 0; k < 14; k++) {
      const d = this.add.graphics().setPosition(B.x - 70 + Math.random() * 140, B.y - 150 - Math.random() * 40);
      d.fillStyle(0x6fc3ef, 1).fillCircle(0, 0, 5).fillTriangle(-5, -1, 5, -1, 0, -11); this.fx.add(d);
      this.tweens.add({ targets: d, y: B.y - 10 + Math.random() * 20, alpha: 0.2, duration: 500 + Math.random() * 300, delay: k * 30, onComplete: () => d.destroy() });
    }
    this.refreshAll();
    this.say(`Watered! Now ready in ${durText(b.ready - now)}.`);
  }

  harvest(B) {
    const b = SAVE.garden.beds[B.i], cd = cropDef(b.crop), fr = SAVE.fresh;
    const got = Math.min(cd.yield, BASKET_MAX - fr[cd.id]);
    if (got <= 0) { this.say(`The basket is full of ${cd.many}! Cook with them first.`, '#f08a7a'); return; }
    fr[cd.id] += got; SAVE.stats.harvested += got;
    SAVE.garden.beds[B.i] = { crop: null };
    writeSave(); sfx('coin');
    const icon = this.add.image(B.x, B.y - 40, tex(this, 'produce_' + cd.id, () => produceCanvas(cd.id))).setScale(0.8); this.fx.add(icon);
    const t = label(this, B.x, B.y - 90, `+${got} ${got === 1 ? cd.one : cd.many}`, 24, '#fff8e8', { font: FD }).setOrigin(0.5).setStroke('#2b1a10', 6); this.fx.add(t);
    this.tweens.add({ targets: icon, x: 1010, y: 180 + CROPS.indexOf(cd) * 84, scale: 0.4, duration: 650, ease: 'Quad.easeIn', onComplete: () => { icon.destroy(); this.refreshBasket(); } });
    this.tweens.add({ targets: t, y: t.y - 50, alpha: 0, duration: 1100, onComplete: () => t.destroy() });
    this.refreshAll();
    if (got < cd.yield) this.say(`The basket only had room for ${got} more.`);
  }

  buildBasket() {
    const x0 = 950, y0 = 108, w = 310, h = 596, g = this.add.graphics();
    g.fillStyle(0x000000, 0.25).fillRoundedRect(x0 + 4, y0 + 6, w, h, 20);
    g.fillStyle(0xfffaee, 1).fillRoundedRect(x0, y0, w, h, 20);
    g.lineStyle(4, COL.ink, 1).strokeRoundedRect(x0, y0, w, h, 20);
    label(this, x0 + 20, y0 + 12, 'Fresh basket', 28, '#2b1a10', { font: FD });
    this.basketT = CROPS.map((cd, i) => {
      const y = y0 + 72 + i * 84;
      this.add.image(x0 + 44, y + 24, tex(this, 'produce_' + cd.id, () => produceCanvas(cd.id))).setScale(0.36);
      label(this, x0 + 80, y, cd.name, 20, '#2b1a10', { font: FD });
      label(this, x0 + 80, y + 28, `+${money(cd.bonus)} tip: ${cd.use.toLowerCase()}`, 14, '#5b351b', { wrap: 210, ls: 1 });
      return label(this, x0 + w - 20, y + 2, '', 22, '#1f6b3b', { font: FD }).setOrigin(1, 0);
    });
    label(this, x0 + 20, y0 + 418, 'Each plate you cook uses one of every fresh crop it calls for, and the customer tips extra. Seeds are free. Water a bed once to make it grow faster.', 15, '#7d4a26', { wrap: w - 40, ls: 2 });
    this.basketMoney = label(this, x0 + w / 2, y0 + h - 30, '', 20, '#2b1a10', { font: FD }).setOrigin(0.5);
  }
  refreshBasket() {
    CROPS.forEach((cd, i) => { const n = SAVE.fresh[cd.id] || 0; this.basketT[i].setText(`× ${n}`).setColor(n ? '#1f6b3b' : '#a89a80'); });
    this.basketMoney.setText(`Savings ${money(money2())}`);
  }

  seedPicker(B) {
    const c = this.modal = this.add.container(0, 0).setDepth(200), g = this.add.graphics(); c.add(g);
    g.fillStyle(0x000000, 0.55).fillRect(0, 0, W, H);
    c.add(this.add.zone(W / 2, H / 2, W, H).setInteractive());
    const close = () => { c.destroy(true); this.modal = null; };
    c.add(label(this, W / 2, 96, 'Pick some seeds', 40, '#f6c453', { font: FD }).setOrigin(0.5, 0));
    const cw = 270, gap = 22, x0 = (W - (4 * cw + 3 * gap)) / 2, y0 = 160, ch = 420;
    CROPS.forEach((cd, i) => {
      const x = x0 + i * (cw + gap);
      const pk = { basil: 0x4fae45, parsley: 0x2f8a3a, tomato: 0xe0392a, garlic: 0xb48ab0 }[cd.id];
      g.fillStyle(0x000000, 0.25).fillRoundedRect(x + 5, y0 + 7, cw, ch, 16);
      g.fillStyle(pk, 1).fillRoundedRect(x, y0, cw, ch, 16);
      g.fillStyle(0xfffaee, 1).fillRoundedRect(x + 14, y0 + 14, cw - 28, 170, 12);
      g.lineStyle(3, COL.ink, 1).strokeRoundedRect(x, y0, cw, ch, 16).strokeRoundedRect(x + 14, y0 + 14, cw - 28, 170, 12);
      c.add(this.add.image(x + cw / 2, y0 + 100, tex(this, 'produce_' + cd.id, () => produceCanvas(cd.id))).setScale(0.9));
      c.add(label(this, x + cw / 2, y0 + 196, cd.name, 30, '#fff8e8', { font: FD }).setOrigin(0.5, 0).setStroke('#2b1a10', 5));
      c.add(label(this, x + cw / 2, y0 + 244, `Ready in ${growText(cd.mins)}\nPicks ${cd.yield} ${cd.many}`, 18, '#fff8e8', { align: 'center' }).setOrigin(0.5, 0).setStroke('#2b1a10', 4));
      c.add(label(this, x + cw / 2, y0 + 304, `+${money(cd.bonus)} tip: ${cd.use.toLowerCase()}`, 15, '#fff8e8', { align: 'center', wrap: cw - 30 }).setOrigin(0.5, 0).setStroke('#2b1a10', 4));
      const b = makeButton(this, x + cw / 2, y0 + ch - 36, cw - 50, 46, 'Plant', () => { close(); this.plant(B, cd.id); }, { size: 21 });
      c.add(b);
      const z = this.add.zone(x + cw / 2, y0 + ch / 2 - 30, cw, ch - 60).setInteractive({ useHandCursor: true });
      z.on('pointerdown', () => { sfx('click'); close(); this.plant(B, cd.id); });
      c.add(z);
    });
    c.add(makeButton(this, W / 2, 640, 200, 50, 'Not now', close, { fill: COL.basilMid, size: 21 }));
  }
}

// ---------- the Daily Dish score card, from the kitchen or the morning ----------
const dailyShareText = r => `Noodle Rush Daily #${r.n} 🍝\n${'★'.repeat(r.stars)}${'☆'.repeat(5 - r.stars)} ${r.total}%\n${r.dish}`;
function dailyCard(scene, r, opts) {
  const c = scene.add.container(0, 0).setDepth(260), g = scene.add.graphics(); c.add(g);
  g.fillStyle(0x000000, 0.6).fillRect(0, 0, W, H);
  c.add(scene.add.zone(W / 2, H / 2, W, H).setInteractive());
  const x0 = W / 2 - 340, y0 = 120, w = 680, h = 480;
  g.fillStyle(0x000000, 0.3).fillRoundedRect(x0 + 6, y0 + 8, w, h, 22);
  g.fillStyle(0xfffaee, 1).fillRoundedRect(x0, y0, w, h, 22);
  g.lineStyle(4, COL.ink, 1).strokeRoundedRect(x0, y0, w, h, 22);
  c.add(scene.add.image(x0 + 110, y0 + 120, tex(scene, 'portrait_lella', () => portraitCanvas(ZIA_LELLA.look, 120, '#bfe3f2'))).setScale(150 / (120 * ART_SCALE)));
  c.add(label(scene, x0 + 210, y0 + 34, `Daily Dish #${r.n}`, 36, '#2b1a10', { font: FD }));
  c.add(label(scene, x0 + 212, y0 + 84, r.dish, 19, '#7d4a26', { wrap: 440 }));
  const sg = scene.add.graphics(); c.add(sg);
  for (let i = 0; i < 5; i++) drawStar(sg, x0 + 236 + i * 50, y0 + 158, 20, i < r.stars);
  c.add(label(scene, x0 + 486, y0 + 158, `${r.total}%`, 34, '#b8322a', { font: FD }).setOrigin(0, 0.5));
  const say = r.walked ? 'Zia Lella got tired of waiting and left. Tomorrow she orders a brand new plate!'
    : r.stars >= 5 ? 'Zia Lella: "Perfetto! You cook like my sister. Maybe better. Do not tell her!"'
    : r.stars >= 4 ? 'Zia Lella: "Brava! Very close to perfect. Tomorrow you will get there."'
    : r.stars >= 3 ? 'Zia Lella: "Not bad, not bad. My sister will teach you the rest."' : 'Zia Lella: "Hmm. Every cook has a bad day. Tomorrow, a new plate!"';
  c.add(label(scene, x0 + 50, y0 + 228, say, 21, '#24345a', { font: FH, weight: '400', wrap: w - 100, ls: 4 }));
  const foot = (opts.fresh ? `${money(r.reward || 0)} added to your savings. ` : '') + `A new Daily Dish arrives in ${durText(msToMidnight())}. Everyone gets the same plate, so share your score and see who cooked it best!`;
  c.add(label(scene, x0 + 50, y0 + 300, foot, 17, '#5b351b', { wrap: w - 100, ls: 3 }));
  c.add(makeButton(scene, x0 + w / 2 - 130, y0 + h - 56, 230, 56, 'Share score', () => openShare(dailyShareText(r)), { fill: 0x2f5ea8, size: 22 }));
  c.add(makeButton(scene, x0 + w / 2 + 130, y0 + h - 56, 230, 56, opts.doneLabel, () => { c.destroy(true); opts.done(); }, { fill: COL.basilMid, size: 21 }));
  c.setAlpha(0); scene.tweens.add({ targets: c, alpha: 1, duration: 250 });
  if (opts.fresh) sfx(r.stars >= 4 ? 'serve' : 'ding');
  return c;
}
// A small HTML sheet, so Copy and Share run inside a real tap (phones refuse to copy otherwise).
function openShare(text) {
  if (document.getElementById('nr-feedback')) return;
  window.FEEDBACK_OPEN = true;
  const wrap = document.createElement('div');
  wrap.id = 'nr-feedback';
  const canShare = !!navigator.share;
  wrap.innerHTML = `<div class="fb-card">
    <h2>Share your Daily Dish</h2>
    <p class="fb-sub">Copy your score and paste it in a message to your friends. Everyone cooks the same plate today!</p>
    <textarea id="fb-out" rows="3" readonly></textarea>
    <div class="fb-actions"><button type="button" class="fb-close">Close</button>${canShare ? '<button type="button" class="fb-share">Share</button>' : ''}<button type="button" class="fb-copy">Copy</button></div>
    <p class="fb-done" aria-live="polite"></p></div>`;
  document.body.appendChild(wrap);
  const $ = q => wrap.querySelector(q), out = $('#fb-out'), done = $('.fb-done');
  out.value = text;
  const close = () => { wrap.remove(); window.FEEDBACK_OPEN = false; };
  $('.fb-close').addEventListener('click', close);
  wrap.addEventListener('pointerdown', e => { if (e.target === wrap) close(); });
  wrap.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Escape') close(); });
  wrap.addEventListener('keyup', e => e.stopPropagation());
  $('.fb-copy').addEventListener('click', async () => {
    let ok = false;
    try { await navigator.clipboard.writeText(text); ok = true; } catch (e) {
      try { out.focus(); out.select(); ok = document.execCommand('copy'); } catch (e2) { ok = false; }
    }
    out.focus(); out.select();
    done.textContent = ok ? 'Copied! Paste it in a text to your friends.' : 'Select the text above and copy it, then paste it in a message.';
  });
  if (canShare) $('.fb-share').addEventListener('click', () => { navigator.share({ text }).catch(() => { done.textContent = 'Sharing did not open here. Use Copy instead.'; }); });
}

// ---------- Tester feedback: a short form that copies a note, with play stats, to send to whoever shared the game ----------
function feedbackReport(f) {
  const st = SAVE.stats || {}, mins = Math.round((st.playSec || 0) / 60);
  const ups = Object.keys(SAVE.upgrades || {}).filter(k => SAVE.upgrades[k]);
  const recent = (st.history || []).slice(-5).map(h => `D${h.day}: ${h.served}/${h.crowd} served, ${h.left} left, ${h.avg}★, ${money(h.tips)} tips, special ${h.dotd}`);
  const dev = `${/iPhone|iPad|Android/i.test(navigator.userAgent) ? 'phone/tablet' : 'computer'}, ${window.innerWidth}x${window.innerHeight}`;
  const rd = st.realDays || [], v = SAVE.visit || {}, dl = SAVE.daily;
  return ['Noodle Rush feedback (v11)',
    `Fun: ${f.fun || '?'}/5 · Keep playing: ${f.again || '?'}`,
    `Liked: ${(f.liked || '').trim() || '-'}`,
    `Confusing or annoying: ${(f.confusing || '').trim() || '-'}`,
    `What brings you back: ${(f.back || '').trim() || '-'}`,
    '---',
    `Reached Day ${SAVE.day} · days finished ${st.daysFinished || 0}, started ${st.daysStarted || 0} · ${mins} min played · ${st.sessions || 0} sessions`,
    `Savings ${money(SAVE.bank || 0)} · streak ${SAVE.streak || 0} · rank ${rankFor(Math.max(1, (SAVE.day || 1) - 1))}`,
    `Upgrades: ${ups.join(', ') || 'none'}`,
    `Real days played ${rd.length}${rd.length ? ` (${rd[0]} to ${rd[rd.length - 1]})` : ''} · visit streak ${v.streak || 0}, best ${v.best || 0} · letters ${st.letters || 0}`,
    `Garden: planted ${st.planted || 0}, picked ${st.harvested || 0}, watered ${st.watered || 0}, fresh used ${st.freshUsed || 0}, beds ${SAVE.garden.beds.length} · Daily Dishes ${st.dailies || 0}${dl ? `, last #${dl.n} ${dl.total}%` : ''}`,
    ...recent, `Device: ${dev}`].join('\n');
}
function openFeedback() {
  if (document.getElementById('nr-feedback')) return;
  window.FEEDBACK_OPEN = true;
  const f = Object.assign({ fun: 0, again: '', liked: '', confusing: '', back: '' }, SAVE.feedback || {});
  const wrap = document.createElement('div');
  wrap.id = 'nr-feedback';
  wrap.innerHTML = `<form class="fb-card" onsubmit="return false">
    <h2>How is Noodle Rush?</h2>
    <p class="fb-sub">Answer a few questions, tap Copy, then paste it in a message to whoever sent you the game.</p>
    <label class="fb-q">How fun is it?</label>
    <div class="fb-row" data-k="fun">${[1, 2, 3, 4, 5].map(n => `<button type="button" data-v="${n}">${n}</button>`).join('')}<span class="fb-hint">1 = boring, 5 = love it</span></div>
    <label class="fb-q">Would you keep playing?</label>
    <div class="fb-row" data-k="again">${['Yes', 'Maybe', 'No'].map(n => `<button type="button" data-v="${n.toLowerCase()}">${n}</button>`).join('')}</div>
    <label class="fb-q" for="fb-liked">What did you like most?</label>
    <textarea id="fb-liked" rows="2"></textarea>
    <label class="fb-q" for="fb-conf">Was anything confusing or annoying?</label>
    <textarea id="fb-conf" rows="2"></textarea>
    <label class="fb-q" for="fb-back">What makes you want to come back, or what would?</label>
    <textarea id="fb-back" rows="2"></textarea>
    <textarea id="fb-out" rows="5" readonly hidden></textarea>
    <div class="fb-actions"><button type="button" class="fb-close">Close</button><button type="button" class="fb-copy">Copy feedback</button></div>
    <p class="fb-done" aria-live="polite"></p>
  </form>`;
  document.body.appendChild(wrap);
  const $ = q => wrap.querySelector(q);
  const liked = $('#fb-liked'), conf = $('#fb-conf'), back = $('#fb-back'), out = $('#fb-out'), done = $('.fb-done');
  liked.value = f.liked; conf.value = f.confusing; back.value = f.back;
  const paint = () => wrap.querySelectorAll('.fb-row').forEach(r => r.querySelectorAll('button').forEach(b => b.classList.toggle('on', String(f[r.dataset.k]) === b.dataset.v)));
  wrap.querySelectorAll('.fb-row button').forEach(b => b.addEventListener('click', () => { f[b.parentNode.dataset.k] = b.parentNode.dataset.k === 'fun' ? Number(b.dataset.v) : b.dataset.v; paint(); }));
  paint();
  const keep = () => { f.liked = liked.value; f.confusing = conf.value; f.back = back.value; SAVE.feedback = f; writeSave(); };
  const close = () => { keep(); wrap.remove(); window.FEEDBACK_OPEN = false; };
  $('.fb-close').addEventListener('click', close);
  wrap.addEventListener('pointerdown', e => { if (e.target === wrap) close(); });
  wrap.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Escape') close(); });
  wrap.addEventListener('keyup', e => e.stopPropagation());
  $('.fb-copy').addEventListener('click', async () => {
    keep();
    const text = feedbackReport(f);
    out.value = text; out.hidden = false;
    let ok = false;
    try { await navigator.clipboard.writeText(text); ok = true; } catch (e) {
      try { out.focus(); out.select(); ok = document.execCommand('copy'); } catch (e2) { ok = false; }
    }
    out.focus(); out.select();
    done.textContent = ok ? 'Copied! Paste it in a text or email to whoever sent you the game. Grazie!' : 'Select the text above and copy it, then paste it in a message. Grazie!';
  });
}
window.openFeedback = openFeedback;

function startGame() {
  SAVE.stats.sessions = (SAVE.stats.sessions || 0) + 1; noteVisit(); writeSave();
  setInterval(() => { if (!document.hidden) { SAVE.stats.playSec = (SAVE.stats.playSec || 0) + 5; writeSave(); } }, 5000);
  window.addEventListener('pagehide', writeSave);
  window.GAME = new Phaser.Game({
    type: Phaser.AUTO, parent: 'game', width: W, height: H, backgroundColor: '#07411e',
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    input: { activePointers: 2 },
    scene: [TitleScene, ChefScene, StoryScene, GameScene, MorningScene, DecorateScene, GardenScene],
  });
}
preloadFonts().then(startGame);
