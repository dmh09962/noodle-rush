// ---------- Noodle Rush: the opening story ----------
// Plays once, after a new player picks their chef: about 30 seconds in six shots.
// Tapping moves to the next shot; Skip goes straight to the kitchen.
const STORY_BAR = 56, STORY_CAP = 96;   // letterbox bars: top, and the bottom one that holds the caption
const STORY_SHOTS = [
  { ms: 6000, text: 'Every Sunday, I helped Nonna make pasta in her little kitchen.' },
  { ms: 5500, text: 'She taught me to roll the dough thin, and to never, ever rush the sauce.' },
  { ms: 6000, text: 'Her table was always full, and everyone went home happy.' },
  { ms: 5500, text: 'The years went by. I grew up, and Nonna\'s hair turned silver.' },
  { ms: 8000, text: 'Then one day she handed me the keys to a little shop of my own.\n"Now it is your turn, tesoro."' },
  { ms: 0, text: '' },
];
const storySeen = () => !!(SAVE.seen && SAVE.seen.story);
const wantsStory = () => !storySeen() && (SAVE.day || 1) <= 1;

function keyCanvas() {
  const [c, ctx] = mkCanvas(64, 28);
  circ(ctx, 14, 14, 10); fs(ctx, '#f2c23a', 3);
  circ(ctx, 14, 14, 4); fs(ctx, '#7d4a26', 2);
  rrPath(ctx, 22, 11, 36, 7, 3); fs(ctx, '#f2c23a', 3);
  rrPath(ctx, 46, 16, 6, 9, 2); fs(ctx, '#f2c23a', 2.5); rrPath(ctx, 54, 16, 5, 7, 2); fs(ctx, '#f2c23a', 2.5);
  return c;
}

// A gentle waltz that plays under the story. Returns a stop function.
function storyMusic() {
  if (SAVE.muted) return () => {};
  try {
    if (!audio) audio = new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === 'suspended') audio.resume();
    const out = audio.createGain(); out.gain.value = 0.9; out.connect(audio.destination);
    const hz = m => 440 * Math.pow(2, (m - 69) / 12), beat = 0.6;
    const tune = [[76, 2], [74, 1], [72, 2], [67, 1], [69, 1], [72, 1], [77, 1], [76, 3],
      [74, 2], [72, 1], [71, 2], [67, 1], [69, 1], [71, 1], [74, 1], [72, 3],
      [76, 2], [77, 1], [79, 2], [76, 1], [77, 1], [76, 1], [74, 1], [72, 2], [69, 1],
      [67, 1], [72, 1], [76, 1], [74, 2], [71, 1], [72, 3], [0, 3]];
    const chords = [48, 48, 53, 48, 43, 43, 43, 48, 48, 48, 53, 45, 48, 43, 48, 48];
    const note = (m, t, d, vol, type) => {
      const o = audio.createOscillator(), g = audio.createGain();
      o.type = type; o.frequency.value = hz(m);
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g).connect(out); o.start(t); o.stop(t + d + 0.05);
    };
    const t0 = audio.currentTime + 0.15, loopLen = 16 * 3 * beat;
    for (let loop = 0; loop < 2; loop++) {
      let t = t0 + loop * loopLen;
      for (const [m, b] of tune) { if (m) note(m, t, b * beat * 0.95, 0.05, 'triangle'); t += b * beat; }
      chords.forEach((r, i) => {
        const bt = t0 + loop * loopLen + i * 3 * beat, third = [48, 53].includes(r) ? 4 : r === 45 ? 3 : 4;
        note(r, bt, beat * 0.9, 0.05, 'sine');
        for (const k of [1, 2]) { note(r + 12 + third, bt + k * beat, beat * 0.5, 0.018, 'triangle'); note(r + 19, bt + k * beat, beat * 0.5, 0.018, 'triangle'); }
      });
    }
    return () => { try { out.gain.setTargetAtTime(0.0001, audio.currentTime, 0.25); setTimeout(() => out.disconnect(), 1500); } catch (e) {} };
  } catch (e) { return () => {}; }
}

class StoryScene extends Phaser.Scene {
  constructor() { super('story'); }
  create() {
    this.cameras.main.setBackgroundColor('#1a120c');
    this.leaving = false; this.busy = false; this.timer = null;   // the scene object is reused on replay
    this.replay = !!this.registry.get('storyReplay');
    this.registry.set('storyReplay', false);
    const chef = CHEFS.find(c => c.id === SAVE.chef) || CHEFS[0];
    this.chef = chef;
    this.adultLook = chefLook(chef.id);
    const kid = Object.assign({}, this.adultLook);
    for (const k of ['hat', 'hatColor', 'apron', 'sunglasses', 'chefCoat', 'mustache', 'beard', 'build', 'necklace', 'scarf']) delete kid[k];
    if (!kid.shirt) kid.shirt = '#f2c23a';
    this.kidLook = kid;
    this.youngNonna = Object.assign({}, NONNA_LOOK, { hair: '#4a2a14' });
    delete this.youngNonna.old; delete this.youngNonna.glasses;
    tex(this, 'story_kitchen', storyKitchenCanvas);
    tex(this, 'story_table', storyTableCanvas);
    tex(this, 'story_shop', shopFrontCanvas);
    tex(this, 'story_key', keyCanvas);

    this.stage = this.add.container(0, 0);
    this.curtain = this.add.rectangle(0, 0, W, H, 0x1a120c).setOrigin(0).setDepth(50).setAlpha(1);
    this.barTop = this.add.rectangle(0, 0, W, STORY_BAR, 0x000000).setOrigin(0).setDepth(100);
    this.barBot = this.add.rectangle(0, H - STORY_CAP, W, STORY_CAP, 0x000000).setOrigin(0).setDepth(100);
    this.caption = this.add.text(W / 2, H - STORY_CAP / 2, '', { fontFamily: FH, fontSize: '30px', color: '#fbf3e0', align: 'center', lineSpacing: 2 }).setOrigin(0.5).setDepth(101);
    this.dots = STORY_SHOTS.slice(0, 5).map((s, i) => this.add.circle(36 + i * 22, STORY_BAR / 2, 5, 0xfbf3e0, 0.3).setDepth(101));
    const skip = this.add.text(W - 24, STORY_BAR / 2, 'Skip  ›', { fontFamily: FD, fontSize: '22px', fontStyle: '800', color: '#fbf3e0' }).setOrigin(1, 0.5).setDepth(102).setAlpha(0.8)
      .setPadding(14, 6, 14, 6).setInteractive({ useHandCursor: true });
    skip.on('pointerdown', (p, x, y, e) => { e.stopPropagation(); sfx('click'); this.finish(); });
    this.skipBtn = skip;
    this.input.on('pointerdown', () => { if (this.shot < 5 && this.time.now - this.shotAt > 600) this.next(); });
    this.stopMusic = storyMusic();
    this.events.once('shutdown', () => this.stopMusic());
    this.shot = -1;
    this.next();
  }

  next() {
    if (this.shot >= 5 || this.busy) return;
    this.shot++;
    const i = this.shot, cut = i !== 1;   // shot 2 is a push-in on shot 1, so no cut
    if (this.timer) this.timer.remove();
    this.dots.forEach((d, k) => d.setFillStyle(0xfbf3e0, k <= i ? 0.95 : 0.3));
    const build = () => {
      if (cut) { this.tweens.killAll(); this.time.removeAllEvents(); this.stage.removeAll(true); this.stage.setScale(1).setPosition(0, 0); }
      this['shot' + i]();
      this.setCaption(STORY_SHOTS[i].text);
      this.shotAt = this.time.now;
      if (STORY_SHOTS[i].ms) this.timer = this.time.delayedCall(STORY_SHOTS[i].ms, () => this.next());
    };
    if (cut) {
      this.busy = true;
      this.tweens.add({ targets: this.curtain, alpha: 1, duration: i ? 220 : 0, onComplete: () => { this.busy = false; build(); this.tweens.add({ targets: this.curtain, alpha: 0, duration: 420 }); } });
    } else build();
  }

  setCaption(s) {
    this.tweens.killTweensOf(this.caption);
    this.caption.setText(s).setAlpha(0);
    this.tweens.add({ targets: this.caption, alpha: 1, duration: 500 });
  }

  person(look, base, x, y, s, mood = 'happy') { const img = addPerson(this, lookId(base, look), look, x, y, s, 'stand', mood); this.stage.add(img); return img; }
  bob(img, d = 4, ms = 900) { this.tweens.add({ targets: img, y: img.y - d, duration: ms, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }); }
  heart(x, y, big = 1) {
    const g = this.add.graphics(); drawHeart(g, 0, 0, 13 * big, true); g.setPosition(x, y); this.stage.add(g);
    this.tweens.add({ targets: g, y: y - 70 - Math.random() * 30, x: x + (Math.random() - 0.5) * 40, alpha: 0, scale: 1.4, duration: 1500, ease: 'Sine.easeOut', onComplete: () => g.destroy() });
  }
  sparkle(x, y, r = 12) {
    const g = this.add.graphics(); drawStar(g, 0, 0, r, true); g.setPosition(x, y).setScale(0.2); this.stage.add(g);
    this.tweens.add({ targets: g, scale: 1.3, alpha: 0, angle: 90, duration: 700, ease: 'Quad.easeOut', onComplete: () => g.destroy() });
  }
  steam(x, y) {
    this.time.addEvent({ delay: 420, loop: true, callback: () => {
      const c = this.add.circle(x + (Math.random() - 0.5) * 60, y, 10 + Math.random() * 8, 0xffffff, 0.55); this.stage.addAt(c, 1);
      this.tweens.add({ targets: c, y: y - 120, scale: 2.2, alpha: 0, duration: 1800, onComplete: () => c.destroy() });
    } });
  }
  kitchen() {
    this.stage.add(this.add.image(0, 0, 'story_kitchen').setOrigin(0).setScale(1 / 1.5));
    this.steam(1085, 262);
  }

  // 1. Nonna's kitchen on a Sunday
  shot0() {
    this.kitchen();
    this.nonna = this.person(this.youngNonna, 'nonna_young', 720, 630, 1.22);
    this.kid = this.person(this.kidLook, this.chef.id + '_kid', 540, 590, 0.72, 'delight');
    this.bob(this.nonna, 3, 1100); this.bob(this.kid, 5, 700);
    this.stage.add(this.add.image(640, 500, 'story_table').setOrigin(0.5, 0));
    // flour, dough and the rolling pin
    const flour = this.add.graphics(); flour.fillStyle(0xffffff, 0.75);
    for (let k = 0; k < 26; k++) flour.fillCircle(520 + Math.random() * 200, 524 + Math.random() * 24, 2 + Math.random() * 3);
    this.dough = this.add.ellipse(620, 532, 120, 30, 0xf6dc8e).setStrokeStyle(3, COL.ink);
    const pin = this.add.container(620, 518);
    pin.add([this.add.rectangle(0, 0, 130, 18, 0xc08a52).setStrokeStyle(3, COL.ink), this.add.rectangle(-80, 0, 34, 10, 0x7d4a26).setStrokeStyle(2.5, COL.ink), this.add.rectangle(80, 0, 34, 10, 0x7d4a26).setStrokeStyle(2.5, COL.ink)]);
    this.stage.add([flour, this.dough, pin]);
    this.tweens.add({ targets: pin, x: 660, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: this.stage, scale: 1.04, x: -26, y: -14, duration: 6000, ease: 'Sine.easeInOut' });
    this.time.delayedCall(2600, () => { this.nonna.setLook('stand', 'love'); this.heart(740, 330); sfx('pop'); });
    this.time.delayedCall(3600, () => { this.kid.setLook('stand', 'happy'); });
  }
  // 2. push in on the dough
  shot1() {
    const s = 1.75, fx = 640, fy = 455;
    this.tweens.killTweensOf(this.stage);
    this.tweens.add({ targets: this.stage, scale: s, x: W / 2 - fx * s, y: 330 - fy * s, duration: 1800, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: this.dough, scaleX: 1.7, scaleY: 1.15, duration: 4200, ease: 'Sine.easeOut' });
    this.nonna.setLook('stand', 'happy'); this.kid.setLook('stand', 'wow');
    this.time.delayedCall(1900, () => { this.kid.setLook('stand', 'delight'); this.sparkle(690, 518, 10); sfx('star'); });
    this.time.delayedCall(3300, () => { this.heart(560, 450, 0.8); this.nonna.setLook('stand', 'love'); });
  }
  // 3. the big Sunday table
  shot2() {
    this.kitchen();
    const folk = ['rosa', 'tony', 'lucia', 'paolo', 'giulia', 'bruno'], xs = [150, 280, 410, 870, 1000, 1130];
    const guests = folk.map((k, i) => { const p = this.person(TOWNSFOLK[k].look, k, xs[i], 610, 0.98, 'eat'); this.bob(p, 3, 600 + i * 90); return p; });
    this.nonna = this.person(this.youngNonna, 'nonna_young', 720, 610, 1.22, 'happy');
    this.kid = this.person(this.kidLook, this.chef.id + '_kid', 570, 568, 0.72, 'eat');
    this.bob(this.kid, 4, 650);
    const t = this.add.image(640, 470, 'story_table').setOrigin(0.5, 0).setScale(1.58, 1); this.stage.add(t);
    const g = this.add.graphics(); this.stage.add(g);
    for (const x of [...xs, 570, 720]) {
      g.fillStyle(0xffffff, 1).fillEllipse(x, 492, 74, 22); g.lineStyle(2, COL.ink, 0.8).strokeEllipse(x, 492, 74, 22);
      g.fillStyle(COL.pasta, 1).fillEllipse(x, 489, 48, 13); g.fillStyle(COL.tomato, 1).fillEllipse(x + 2, 487, 24, 7);
    }
    g.fillStyle(0xc08a52, 1).fillEllipse(640, 494, 70, 20); g.lineStyle(2.5, COL.ink, 1).strokeEllipse(640, 494, 70, 20);
    for (const x of [622, 640, 658]) { g.fillStyle(0xe6b84a, 1).fillEllipse(x, 484, 22, 12); g.lineStyle(2, COL.ink, 1).strokeEllipse(x, 484, 22, 12); }
    let k = 0;
    this.time.addEvent({ delay: 380, loop: true, callback: () => {
      const all = [...guests, this.kid], p = all[k % all.length]; k += 3;
      p.setLook('stand', ['delight', 'love', 'eat'][k % 3]);
      this.heart(p.x + 20, p.y - (p === this.kid ? 130 : 200), 0.8);
    } });
    this.time.delayedCall(1200, () => { this.nonna.setLook('stand', 'delight'); sfx('pop'); });
  }
  // 4. the years go by
  shot3() {
    this.kitchen();
    const tint = this.add.rectangle(0, 0, W, H, 0x2a3f8f, 0).setOrigin(0); this.stage.add(tint);
    const ny = this.person(this.youngNonna, 'nonna_young', 760, 616, 1.22);
    const no = this.person(NONNA_LOOK, 'nonna', 760, 616, 1.22).setAlpha(0);
    const kid = this.person(this.kidLook, this.chef.id + '_kid', 500, 616, 0.72, 'happy');
    const adult = this.person(this.adultLook, lookId(this.chef.id, this.adultLook), 500, 616, 0.72, 'delight').setAlpha(0);
    this.stage.bringToTop(tint);
    this.tweens.add({ targets: tint, alpha: 0.28, duration: 380, yoyo: true, repeat: 3, ease: 'Sine.easeInOut' });
    for (let i = 0; i < 14; i++) {
      const leaf = this.add.ellipse(Math.random() * W, STORY_BAR - 20, 14, 8, [0xe39a3a, 0xd9432f, 0xf2c23a][i % 3]).setStrokeStyle(2, COL.ink);
      this.stage.add(leaf);
      this.tweens.add({ targets: leaf, y: 640, x: leaf.x + (Math.random() - 0.5) * 200, angle: 360 * (Math.random() > 0.5 ? 1 : -1), duration: 2600 + Math.random() * 1800, delay: Math.random() * 2400 });
    }
    this.tweens.add({ targets: [kid, adult], scale: 1.18 / ART_SCALE, duration: 2400, delay: 700, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: kid, alpha: 0, duration: 1600, delay: 1300 });
    this.tweens.add({ targets: adult, alpha: 1, duration: 1600, delay: 1300 });
    this.tweens.add({ targets: ny, alpha: 0, duration: 1600, delay: 1500 });
    this.tweens.add({ targets: no, alpha: 1, duration: 1600, delay: 1500 });
    this.time.delayedCall(3300, () => { for (let i = 0; i < 5; i++) this.time.delayedCall(i * 90, () => this.sparkle(440 + Math.random() * 120, 360 + Math.random() * 200)); sfx('star'); no.setLook('stand', 'love'); this.heart(790, 330); });
  }
  // 5. Nonna hands over the keys
  shot4() {
    this.stage.add(this.add.image(0, 0, 'story_shop').setOrigin(0).setScale(1 / 1.5));
    const sign = this.add.text(640, 297, 'AFFITTASI', { fontFamily: FD, fontSize: '40px', fontStyle: '800', color: '#e8d9b8' }).setOrigin(0.5);
    const note = this.add.text(825, 510, 'For rent', { fontFamily: FH, fontSize: '26px', color: '#2b1a10', backgroundColor: '#fbf3e0', padding: { x: 10, y: 4 } }).setOrigin(0.5).setAngle(-6);
    const glow = [352, 722].map(x => this.add.rectangle(x, 442, 206, 136, 0xffd27a, 0).setOrigin(0));
    this.stage.add([sign, ...glow, note]);
    const nonna = this.person(NONNA_LOOK, 'nonna', -120, 622, 1.05);
    const me = this.person(this.adultLook, lookId(this.chef.id, this.adultLook), -260, 622, 1.05);
    let step = 0;
    const walk = this.time.addEvent({ delay: 180, loop: true, callback: () => { step++; for (const p of [nonna, me]) p.setLook(step % 2 ? 'walk1' : 'walk2', 'happy'); } });
    this.tweens.add({ targets: nonna, x: 520, duration: 2000, ease: 'Sine.easeOut' });
    this.tweens.add({ targets: me, x: 330, duration: 2000, ease: 'Sine.easeOut', onComplete: () => { walk.remove(); nonna.setLook('stand', 'love'); me.setLook('stand', 'wow'); } });
    this.time.delayedCall(2500, () => {
      const key = this.add.image(476, 530, 'story_key').setScale(0.7); this.stage.add(key); sfx('coin');
      this.tweens.add({ targets: key, x: 382, duration: 900, ease: 'Sine.easeInOut' });
      this.tweens.add({ targets: key, y: 492, duration: 450, yoyo: true, ease: 'Sine.easeOut', onComplete: () => { me.setLook('stand', 'delight'); this.sparkle(382, 520); } });
      this.tweens.add({ targets: key, angle: 30, duration: 900 });
    });
    this.time.delayedCall(4200, () => {
      this.tweens.add({ targets: [sign, note], scale: 0, alpha: 0, duration: 220, onComplete: () => {
        sign.setText('NOODLE RUSH').setColor('#f6c453').setFontSize(46);
        this.tweens.add({ targets: sign, scale: 1, alpha: 1, duration: 420, ease: 'Back.easeOut' });
        sfx('bell');
        for (let i = 0; i < 9; i++) this.time.delayedCall(i * 70, () => this.sparkle(420 + Math.random() * 440, 270 + Math.random() * 60, 10 + Math.random() * 8));
      } });
      this.tweens.add({ targets: glow, fillAlpha: 0.45, duration: 600, delay: 300 });
    });
    this.time.delayedCall(5000, () => this.heart(530, 400));
  }
  // 6. the title card
  shot5() {
    this.markSeen();
    this.skipBtn.setVisible(false); this.dots.forEach(d => d.setVisible(false));
    this.tweens.add({ targets: this.barTop, y: -STORY_BAR, duration: 600 });
    this.tweens.add({ targets: this.barBot, y: H, duration: 600 });
    const bg = this.add.rectangle(0, 0, W, H, COL.basil).setOrigin(0); this.stage.add(bg);
    const g = this.add.graphics(); g.fillStyle(0xffffff, 0.035);
    for (let i = 0; i < 46; i++) g.fillCircle((i * 197) % W, (i * 131) % H, 3 + (i % 5));
    this.stage.add(g);
    const logo = this.add.image(W / 2, 220, 'logo'); logo.setScale(Math.min(600 / logo.width, 330 / logo.height));
    this.stage.add(logo);
    this.stage.add(this.add.text(W / 2, 430, `Chef ${this.chef.first}, your story starts today.`, { fontFamily: FH, fontSize: '32px', color: '#fbf3e0' }).setOrigin(0.5));
    const nonna = this.person(NONNA_LOOK, 'nonna', 210, 690, 1.15, 'love');
    const me = this.person(this.adultLook, lookId(this.chef.id, this.adultLook), 1070, 690, 1.15, 'delight');
    this.bob(nonna, 3, 1000); this.bob(me, 3, 900);
    const go = makeButton(this, W / 2, 530, 320, 70, this.replay ? 'Back to the menu' : "Let's cook!", () => this.finish(), { size: 30 });
    this.stage.add(go);
    go.setScale(0.6).setAlpha(0);
    this.tweens.add({ targets: go, scale: 1, alpha: 1, duration: 420, delay: 500, ease: 'Back.easeOut' });
  }

  markSeen() { SAVE.seen = SAVE.seen || {}; if (!SAVE.seen.story) { SAVE.seen.story = true; writeSave(); } }
  finish() {
    if (this.leaving) return;
    this.leaving = true;
    this.markSeen();
    this.tweens.add({ targets: this.curtain, alpha: 1, duration: 300, onComplete: () => this.scene.start(this.replay ? 'title' : 'game') });
  }
}
