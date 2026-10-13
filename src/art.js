// ---------- Canvas art: characters and rooms are drawn once into textures ----------
const OUT = '#2b1a10';
const ART_SCALE = 2;          // textures are drawn at 2x so close-ups stay crisp
const PERSON_W = 180, PERSON_H = 262, PERSON_FEET = 252;

function mkCanvas(w, h, scale = ART_SCALE) {
  const c = document.createElement('canvas');
  c.width = Math.ceil(w * scale); c.height = Math.ceil(h * scale);
  const ctx = c.getContext('2d');
  ctx.scale(scale, scale);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  return [c, ctx];
}
function rrPath(ctx, x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function circ(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); }
function ell(ctx, x, y, rx, ry, rot = 0) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); }
function fs(ctx, fill, lw = 4) { ctx.fillStyle = fill; ctx.fill(); if (lw) { ctx.lineWidth = lw; ctx.strokeStyle = OUT; ctx.stroke(); } }
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const f = v => Math.max(0, Math.min(255, Math.round(v + amt * (amt < 0 ? v : 255 - v))));
  return '#' + [f(n >> 16), f((n >> 8) & 255), f(n & 255)].map(v => v.toString(16).padStart(2, '0')).join('');
}

// ----- person -----
// P: { skin, hair, hairStyle, hat, hatColor, shirt, stripes, apron, pants, shoes, build, glasses, sunglasses,
//      mustache, beard, scarf, necklace, headphones, chefCoat, old }
function drawPerson(ctx, P, pose = 'stand', mood = 'happy') {
  const cx = 90, bw = P.build === 'big' ? 1.25 : 1;
  const hairC = P.hair || '#3b2314';
  // shadow
  ctx.fillStyle = 'rgba(0,0,0,0.18)'; ell(ctx, cx, 252, 46 * bw, 7); ctx.fill();
  hairBack(ctx, P, cx, hairC);

  // legs + shoes
  const walk = pose === 'walk1' ? 1 : pose === 'walk2' ? -1 : 0;
  const legW = 21 * bw, legTop = 194;
  const lx = cx - 3 - legW + walk * -5, rx = cx + 3 + walk * 5;
  const lLift = walk === -1 ? 4 : 0, rLift = walk === 1 ? 4 : 0;
  rrPath(ctx, lx, legTop, legW, 48 - lLift, 6); fs(ctx, P.pants || '#26262a');
  rrPath(ctx, rx, legTop, legW, 48 - rLift, 6); fs(ctx, P.pants || '#26262a');
  ell(ctx, lx + legW / 2 - 3, 244 - lLift, 16, 9); fs(ctx, P.shoes || '#fbfbf7');
  ell(ctx, rx + legW / 2 + 3, 244 - rLift, 16, 9); fs(ctx, P.shoes || '#fbfbf7');
  ctx.strokeStyle = shade(P.shoes || '#fbfbf7', -0.35); ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(lx + legW / 2 - 16, 247 - lLift); ctx.lineTo(lx + legW / 2 + 10, 247 - lLift); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(rx + legW / 2 - 10, 247 - rLift); ctx.lineTo(rx + legW / 2 + 16, 247 - rLift); ctx.stroke();

  // arms (behind torso)
  const shoulderL = cx - 30 * bw - 12, shoulderR = cx + 30 * bw - 4;
  const swing = walk * 4;
  arm(ctx, P, shoulderL, 132 + swing, false);
  if (pose === 'write') {
    // right forearm comes across the body holding a notepad
    rrPath(ctx, shoulderR, 132, 16, 26, 8); fs(ctx, P.chefCoat ? '#fbfbf7' : P.shirt);
  } else arm(ctx, P, shoulderR, 132 - swing, true);

  // neck
  rrPath(ctx, cx - 8, 110, 16, 22, 5); fs(ctx, P.skin);
  // torso
  const tw = 60 * bw;
  rrPath(ctx, cx - tw / 2, 126, tw, 76, 16); fs(ctx, P.chefCoat ? '#fbfbf7' : P.shirt);
  if (P.stripes) {
    ctx.save(); rrPath(ctx, cx - tw / 2, 126, tw, 76, 16); ctx.clip();
    ctx.fillStyle = P.stripes;
    for (let y = 134; y < 204; y += 14) ctx.fillRect(cx - tw / 2, y, tw, 6);
    ctx.restore();
    rrPath(ctx, cx - tw / 2, 126, tw, 76, 16); ctx.lineWidth = 4; ctx.strokeStyle = OUT; ctx.stroke();
  }
  if (P.chefCoat) {
    ctx.fillStyle = OUT;
    for (let i = 0; i < 3; i++) { circ(ctx, cx - 9, 150 + i * 16, 3.2); ctx.fill(); circ(ctx, cx + 9, 150 + i * 16, 3.2); ctx.fill(); }
  }
  // collar
  ctx.strokeStyle = OUT; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(cx - 12, 127); ctx.quadraticCurveTo(cx, 138, cx + 12, 127); ctx.stroke();

  if (P.apron) {
    ctx.strokeStyle = OUT; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(cx - 15, 140); ctx.lineTo(cx - 9, 126); ctx.moveTo(cx + 15, 140); ctx.lineTo(cx + 9, 126); ctx.stroke();
    rrPath(ctx, cx - 17, 138, 34, 34, 5); fs(ctx, P.apron, 3);
    rrPath(ctx, cx - 25 * bw, 166, 50 * bw, 52, 7); fs(ctx, P.apron, 3);
    rrPath(ctx, cx - 13, 182, 26, 18, 4); ctx.lineWidth = 2; ctx.strokeStyle = shade(P.apron, -0.35); ctx.stroke();
    // bowl logo
    ctx.fillStyle = '#e6b84a';
    ctx.beginPath(); ctx.arc(cx, 150, 8, 0, Math.PI); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#e6b84a'; ctx.lineWidth = 1.6;
    for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(cx + i * 4, 149); ctx.quadraticCurveTo(cx + i * 4 + 3, 144, cx + i * 4, 140); ctx.stroke(); }
  }
  if (P.scarf) {
    ctx.beginPath(); ctx.moveTo(cx - 16, 126); ctx.lineTo(cx + 16, 126); ctx.lineTo(cx + 2, 148); ctx.closePath(); fs(ctx, P.scarf, 3);
    ell(ctx, cx, 128, 8, 6); fs(ctx, P.scarf, 3);
  }
  if (P.necklace) {
    ctx.strokeStyle = '#e6b84a'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(cx - 11, 127); ctx.quadraticCurveTo(cx, 146, cx + 11, 127); ctx.stroke();
    circ(ctx, cx, 141, 4); fs(ctx, '#e6b84a', 2);
  }
  if (P.headphones) {
    ctx.strokeStyle = '#2a2a2e'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.arc(cx, 116, 22, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
    rrPath(ctx, cx - 30, 118, 13, 18, 5); fs(ctx, '#2a2a2e', 3);
    rrPath(ctx, cx + 17, 118, 13, 18, 5); fs(ctx, '#2a2a2e', 3);
  }
  if (pose === 'write') {
    // notepad + hand
    ctx.save(); ctx.translate(cx + 14, 162); ctx.rotate(-0.12);
    rrPath(ctx, -16, -20, 32, 38, 3); fs(ctx, '#fffdf4', 3);
    ctx.strokeStyle = '#8fb3d9'; ctx.lineWidth = 1.5;
    for (let y = -10; y < 16; y += 6) { ctx.beginPath(); ctx.moveTo(-11, y); ctx.lineTo(11, y); ctx.stroke(); }
    ctx.fillStyle = '#d9432f'; ctx.fillRect(-16, -20, 32, 5);
    ctx.restore();
    circ(ctx, cx + 30, 170, 8.5); fs(ctx, P.skin, 3);
  }

  // head
  circ(ctx, cx - 39, 92, 9); fs(ctx, P.skin);
  circ(ctx, cx + 39, 92, 9); fs(ctx, P.skin);
  circ(ctx, cx, 84, 41); fs(ctx, P.skin);
  if (P.beard) {
    ctx.beginPath();
    ctx.moveTo(cx - 38, 92); ctx.quadraticCurveTo(cx - 36, 128, cx, 130); ctx.quadraticCurveTo(cx + 36, 128, cx + 38, 92);
    ctx.quadraticCurveTo(cx + 26, 112, cx, 112); ctx.quadraticCurveTo(cx - 26, 112, cx - 38, 92); ctx.closePath();
    fs(ctx, P.beard, 3);
  }
  hairFront(ctx, P, cx, hairC);
  face(ctx, P, cx, mood);
  hat(ctx, P, cx);
}

function arm(ctx, P, x, y, right) {
  rrPath(ctx, x, y, 16, 52, 8); fs(ctx, P.skin);
  rrPath(ctx, x - 1, y - 2, 18, P.longSleeve || P.chefCoat ? 44 : 24, 8); fs(ctx, P.chefCoat ? '#fbfbf7' : P.shirt);
  circ(ctx, x + 8, y + 54, 9); fs(ctx, P.skin);
}

function hairBack(ctx, P, cx, c) {
  const s = P.hairStyle;
  if (s === 'long') { rrPath(ctx, cx - 47, 64, 94, 92, 30); fs(ctx, c); }
  if (s === 'ponytail') { ell(ctx, cx + 48, 104, 13, 30, -0.35); fs(ctx, c); }
  if (s === 'bun') { circ(ctx, cx, 40, 18); fs(ctx, c); }
  if (s === 'curly') {
    const pts = [[-46, 104], [-50, 84], [-46, 62], [-34, 46], [-16, 38], [4, 36], [24, 40], [40, 52], [49, 72], [50, 94], [45, 112], [-42, 120]];
    for (const [dx, dy] of pts) { circ(ctx, cx + dx, dy, 15); fs(ctx, c); }
  }
}

function hairFront(ctx, P, cx, c) {
  const s = P.hairStyle;
  if (!s || s === 'none') return;
  if (s === 'curly') {
    const pts = [[-34, 56], [-18, 48], [0, 46], [18, 48], [34, 56], [-42, 74], [42, 74]];
    for (const [dx, dy] of pts) { circ(ctx, cx + dx, dy, 13); fs(ctx, c, 3); }
    return;
  }
  if (s === 'braids') {
    for (const side of [-1, 1]) for (let i = 0; i < 4; i++) { ell(ctx, cx + side * 42, 104 + i * 13, 8, 8); fs(ctx, c, 3); }
  }
  ctx.beginPath();
  ctx.moveTo(cx - 43, 92);
  ctx.arc(cx, 84, 44, Math.PI * 1.03, Math.PI * 1.97);
  ctx.lineTo(cx + 43, 92);
  if (s === 'messy') {
    const e = [[36, 70], [28, 76], [18, 60], [6, 72], [-6, 58], [-18, 70], [-30, 62], [-38, 76]];
    for (const [dx, dy] of e) ctx.lineTo(cx + dx, dy);
  } else if (s === 'spiky') {
    const e = [[34, 64], [20, 70], [8, 62], [-6, 70], [-20, 62], [-34, 70]];
    for (const [dx, dy] of e) ctx.lineTo(cx + dx, dy);
  } else if (s === 'long') {
    ctx.quadraticCurveTo(cx + 30, 64, cx + 6, 58);
    ctx.quadraticCurveTo(cx - 24, 68, cx - 40, 104);
  } else if (s === 'braids') {
    ctx.quadraticCurveTo(cx + 22, 58, cx, 56); ctx.quadraticCurveTo(cx - 22, 58, cx - 40, 80);
  } else {
    ctx.quadraticCurveTo(cx + 28, 62, cx + 4, 60);
    ctx.quadraticCurveTo(cx - 24, 62, cx - 43, 86);
  }
  ctx.closePath();
  fs(ctx, c);
  if ((s === 'messy' || s === 'spiky') && !P.hat) {
    const tufts = s === 'messy' ? [[-30, 44, -42, 30], [-6, 40, -2, 22], [20, 42, 34, 28]] : [[-24, 46, -32, 22], [-4, 42, -2, 16], [18, 44, 26, 20], [34, 54, 48, 38]];
    for (const [x1, y1, x2, y2] of tufts) {
      ctx.beginPath(); ctx.moveTo(cx + x1 - 9, y1 + 6); ctx.lineTo(cx + x2, y2); ctx.lineTo(cx + x1 + 9, y1 + 4); ctx.closePath(); fs(ctx, c, 3);
    }
  }
  if (s === 'bun' && P.old) {
    circ(ctx, cx - 40, 76, 10); fs(ctx, c, 3); circ(ctx, cx + 40, 76, 10); fs(ctx, c, 3);
  }
}

function face(ctx, P, cx, mood) {
  const ey = 88, ex = 15;
  const browC = shade(P.hair || '#3b2314', -0.25);
  // cheeks
  ctx.fillStyle = 'rgba(255,110,110,0.32)';
  ell(ctx, cx - 27, 104, 7, 4.5); ctx.fill(); ell(ctx, cx + 27, 104, 7, 4.5); ctx.fill();
  // eyes
  if (mood === 'eat' || mood === 'delight') {
    ctx.strokeStyle = OUT; ctx.lineWidth = 3.5;
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(cx + s * ex, ey + 3, 6, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); }
  } else if (mood === 'love') {
    for (const s of [-1, 1]) heartPath(ctx, cx + s * ex, ey, 8), fs(ctx, '#e8434f', 2.5);
  } else {
    ctx.fillStyle = OUT;
    for (const s of [-1, 1]) { ell(ctx, cx + s * ex, ey, 5, 7); ctx.fill(); }
    ctx.fillStyle = '#fff';
    for (const s of [-1, 1]) { circ(ctx, cx + s * ex + 1.8, ey - 2.5, 1.8); ctx.fill(); }
  }
  // brows
  ctx.strokeStyle = browC; ctx.lineWidth = 3.5;
  for (const s of [-1, 1]) {
    ctx.beginPath();
    if (mood === 'angry') { ctx.moveTo(cx + s * 22, ey - 13); ctx.lineTo(cx + s * 7, ey - 9); }
    else if (mood === 'sad') { ctx.moveTo(cx + s * 22, ey - 10); ctx.lineTo(cx + s * 8, ey - 15); }
    else { ctx.moveTo(cx + s * 21, ey - 12); ctx.quadraticCurveTo(cx + s * 15, ey - 16, cx + s * 9, ey - 13); }
    ctx.stroke();
  }
  // nose
  ctx.strokeStyle = shade(P.skin, -0.3); ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.arc(cx, 98, 4, 0.1 * Math.PI, 0.9 * Math.PI); ctx.stroke();
  if (P.old) {
    ctx.strokeStyle = shade(P.skin, -0.2); ctx.lineWidth = 1.6;
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(cx + s * 25, ey - 2); ctx.lineTo(cx + s * 30, ey - 4); ctx.moveTo(cx + s * 25, ey + 3); ctx.lineTo(cx + s * 30, ey + 4); ctx.stroke(); }
  }
  // mouth
  const my = 108;
  ctx.strokeStyle = OUT; ctx.lineWidth = 3.5;
  if (mood === 'happy' || mood === 'love' || mood === 'delight') {
    const r = mood === 'happy' ? 10 : 13;
    ctx.beginPath(); ctx.moveTo(cx - r, my - 3); ctx.quadraticCurveTo(cx, my + r * 1.5, cx + r, my - 3); ctx.closePath();
    fs(ctx, '#7a2a22', 3);
    ctx.save(); ctx.clip(); ctx.fillStyle = '#ef8b8b'; ell(ctx, cx, my + r, r * 0.7, r * 0.55); ctx.fill(); ctx.restore();
  } else if (mood === 'neutral') {
    ctx.beginPath(); ctx.moveTo(cx - 8, my); ctx.quadraticCurveTo(cx, my + 4, cx + 8, my); ctx.stroke();
  } else if (mood === 'sad') {
    ctx.beginPath(); ctx.moveTo(cx - 9, my + 4); ctx.quadraticCurveTo(cx, my - 5, cx + 9, my + 4); ctx.stroke();
  } else if (mood === 'angry') {
    ctx.beginPath(); ctx.moveTo(cx - 11, my + 4); ctx.quadraticCurveTo(cx - 5, my - 3, cx, my + 1); ctx.quadraticCurveTo(cx + 5, my - 3, cx + 11, my + 4); ctx.stroke();
  } else if (mood === 'eat') {
    ell(ctx, cx, my + 1, 7, 5); fs(ctx, '#7a2a22', 3);
    ctx.strokeStyle = shade(P.skin, -0.25); ctx.lineWidth = 2;
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(cx + s * 22, my - 2, 7, s < 0 ? 0.6 * Math.PI : -0.4 * Math.PI, s < 0 ? 1.4 * Math.PI : 0.4 * Math.PI); ctx.stroke(); }
  } else if (mood === 'wow') {
    ell(ctx, cx, my + 2, 6, 8); fs(ctx, '#7a2a22', 3);
  }
  if (P.mustache) {
    ctx.beginPath();
    ctx.moveTo(cx, 101);
    ctx.bezierCurveTo(cx - 8, 96, cx - 22, 98, cx - 26, 106);
    ctx.bezierCurveTo(cx - 18, 104, cx - 10, 108, cx, 105);
    ctx.bezierCurveTo(cx + 10, 108, cx + 18, 104, cx + 26, 106);
    ctx.bezierCurveTo(cx + 22, 98, cx + 8, 96, cx, 101);
    ctx.closePath(); fs(ctx, P.mustache, 2.5);
  }
  if (P.glasses) {
    ctx.strokeStyle = OUT; ctx.lineWidth = 3;
    for (const s of [-1, 1]) { circ(ctx, cx + s * ex, ey, 11); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(cx - 4, ey - 1); ctx.lineTo(cx + 4, ey - 1); ctx.stroke();
  }
  if (P.sunglasses) {
    for (const s of [-1, 1]) { rrPath(ctx, cx + s * ex - 12, ey - 8, 24, 15, 6); fs(ctx, '#1d1d22', 3); }
    ctx.strokeStyle = OUT; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx - 3, ey - 3); ctx.lineTo(cx + 3, ey - 3); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; for (const s of [-1, 1]) { ctx.fillRect(cx + s * ex - 7, ey - 5, 5, 3); }
  }
}

function heartPath(ctx, x, y, r) {
  ctx.beginPath();
  ctx.moveTo(x, y + r * 0.9);
  ctx.bezierCurveTo(x - r * 1.4, y - r * 0.1, x - r * 0.7, y - r * 1.2, x, y - r * 0.35);
  ctx.bezierCurveTo(x + r * 0.7, y - r * 1.2, x + r * 1.4, y - r * 0.1, x, y + r * 0.9);
  ctx.closePath();
}

function hat(ctx, P, cx) {
  const h = P.hat, c = P.hatColor || '#222428';
  if (!h) return;
  const dome = () => { ctx.beginPath(); ctx.arc(cx, 78, 44, Math.PI * 1.02, Math.PI * 1.98); ctx.quadraticCurveTo(cx, 62, cx - 44, 74); ctx.closePath(); fs(ctx, c); };
  if (h === 'capBack') {
    ell(ctx, cx - 34, 50, 20, 7, -0.3); fs(ctx, shade(c, -0.1));
    dome();
    rrPath(ctx, cx - 9, 58, 18, 9, 4); fs(ctx, '#fbfbf7', 2.5);
  } else if (h === 'cap') {
    dome();
    ell(ctx, cx + 24, 68, 34, 8, 0.06); fs(ctx, shade(c, -0.15));
    if (P.hatLogo) { circ(ctx, cx - 2, 52, 7); fs(ctx, P.hatLogo, 2); }
  } else if (h === 'toque') {
    rrPath(ctx, cx - 36, 44, 72, 22, 6); fs(ctx, '#fbfbf7');
    circ(ctx, cx - 26, 30, 20); fs(ctx, '#fbfbf7');
    circ(ctx, cx + 26, 30, 20); fs(ctx, '#fbfbf7');
    circ(ctx, cx, 18, 25); fs(ctx, '#fbfbf7');
    ctx.fillStyle = '#fbfbf7'; ctx.fillRect(cx - 34, 32, 68, 16);
    ctx.strokeStyle = OUT; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(cx - 36, 46); ctx.lineTo(cx + 36, 46); ctx.stroke();
    ctx.strokeStyle = '#d8d2c4'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx - 10, 30); ctx.lineTo(cx - 10, 44); ctx.moveTo(cx + 12, 30); ctx.lineTo(cx + 12, 44); ctx.stroke();
  } else if (h === 'beanie') {
    ctx.beginPath(); ctx.arc(cx, 80, 46, Math.PI, Math.PI * 2); ctx.closePath(); fs(ctx, c);
    rrPath(ctx, cx - 47, 64, 94, 18, 8); fs(ctx, shade(c, 0.12));
    ctx.strokeStyle = shade(c, -0.3); ctx.lineWidth = 1.6;
    for (let x = -38; x <= 38; x += 9) { ctx.beginPath(); ctx.moveTo(cx + x, 67); ctx.lineTo(cx + x, 79); ctx.stroke(); }
  } else if (h === 'visor') {
    rrPath(ctx, cx - 42, 56, 84, 12, 6); fs(ctx, c);
    ell(ctx, cx, 66, 42, 9); fs(ctx, shade(c, -0.08));
  } else if (h === 'beret') {
    ell(ctx, cx - 8, 48, 46, 16, -0.15); fs(ctx, c);
    circ(ctx, cx - 6, 32, 4); fs(ctx, c, 2.5);
  } else if (h === 'hardhat') {
    ctx.beginPath(); ctx.arc(cx, 72, 42, Math.PI, Math.PI * 2); ctx.closePath(); fs(ctx, c);
    rrPath(ctx, cx - 52, 64, 104, 10, 5); fs(ctx, shade(c, -0.1));
    rrPath(ctx, cx - 6, 30, 12, 34, 5); fs(ctx, shade(c, 0.15), 3);
  } else if (h === 'headscarf') {
    // the knotted headscarf Bologna's sfogline wear while rolling pasta
    ctx.beginPath(); ctx.arc(cx, 80, 46, Math.PI * 1.03, Math.PI * 1.97); ctx.quadraticCurveTo(cx, 70, cx - 45, 73); ctx.closePath(); fs(ctx, c);
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    for (const [dx, dy] of [[-26, 56], [-6, 44], [16, 50], [32, 62], [-14, 64], [4, 60]]) { circ(ctx, cx + dx, dy, 2.6); ctx.fill(); }
    ctx.beginPath(); ctx.moveTo(cx - 44, 72); ctx.lineTo(cx - 62, 88); ctx.lineTo(cx - 50, 92); ctx.closePath(); fs(ctx, shade(c, -0.1), 3);
    ell(ctx, cx - 44, 72, 7, 6); fs(ctx, c, 3);
  } else if (h === 'sailor') {
    rrPath(ctx, cx - 40, 42, 80, 26, 12); fs(ctx, '#fbfbf7');
    rrPath(ctx, cx - 40, 57, 80, 10, 3); fs(ctx, c, 3);
    ell(ctx, cx + 22, 69, 30, 6, 0.05); fs(ctx, '#232428');
    circ(ctx, cx - 4, 50, 4.5); fs(ctx, '#e6b84a', 2);
  } else if (h === 'laurel') {
    for (let i = 0; i <= 12; i++) {
      const a = Math.PI * (0.92 + i * 0.097), x = cx + Math.cos(a) * 44, y = 66 + Math.sin(a) * 16;
      ell(ctx, x, y, 9, 4.5, a + Math.PI / 2 + (i % 2 ? 0.5 : -0.5)); fs(ctx, i % 2 ? '#5aa84a' : '#3f8f3a', 2);
    }
    circ(ctx, cx - 44, 68, 4); fs(ctx, '#e6b84a', 2);
  } else if (h === 'paglietta') {
    ell(ctx, cx, 64, 60, 10); fs(ctx, '#f2d38c');
    rrPath(ctx, cx - 32, 34, 64, 30, 5); fs(ctx, '#f2d38c');
    ctx.fillStyle = c; ctx.fillRect(cx - 30, 48, 60, 10);
    rrPath(ctx, cx - 32, 34, 64, 30, 5); ctx.lineWidth = 4; ctx.strokeStyle = OUT; ctx.stroke();
    ctx.strokeStyle = 'rgba(160,110,40,0.5)'; ctx.lineWidth = 1.5;
    for (let y = 39; y < 48; y += 4) { ctx.beginPath(); ctx.moveTo(cx - 28, y); ctx.lineTo(cx + 28, y); ctx.stroke(); }
  } else if (h === 'coppola') {
    // the Sicilian flat cap
    ctx.beginPath(); ctx.moveTo(cx - 45, 72); ctx.quadraticCurveTo(cx - 42, 40, cx + 2, 40); ctx.quadraticCurveTo(cx + 44, 42, cx + 48, 64); ctx.closePath(); fs(ctx, c);
    ell(ctx, cx + 30, 66, 26, 6, 0.08); fs(ctx, shade(c, -0.18));
    ctx.strokeStyle = shade(c, 0.25); ctx.lineWidth = 1.5;
    for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(cx - 34 + k * 6, 66 - k * 6); ctx.quadraticCurveTo(cx, 46 + k * 3, cx + 36 - k * 4, 58 - k * 3); ctx.stroke(); }
  } else if (h === 'tophat') {
    ell(ctx, cx, 50, 48, 9); fs(ctx, c);
    rrPath(ctx, cx - 28, 2, 56, 48, 4); fs(ctx, c);
    ctx.fillStyle = '#b8322a'; ctx.fillRect(cx - 26, 36, 52, 9);
    rrPath(ctx, cx - 28, 2, 56, 48, 4); ctx.lineWidth = 4; ctx.strokeStyle = OUT; ctx.stroke();
  }
}

function personCanvas(P, pose, mood) {
  const [c, ctx] = mkCanvas(PERSON_W, PERSON_H);
  drawPerson(ctx, P, pose, mood);
  return c;
}
// zoom < 1 pulls back to show more; fy is the body point (in person coords) placed at size * cy
function portraitCanvas(P, size = 96, bg = '#f6c453', zoom = 1, fy = 84, cy = 0.6) {
  const [c, ctx] = mkCanvas(size, size);
  ctx.save(); circ(ctx, size / 2, size / 2, size / 2 - 2); ctx.fillStyle = bg; ctx.fill(); ctx.clip();
  const k = size / 104 * zoom; ctx.translate(size / 2 - 90 * k, size * cy - fy * k); ctx.scale(k, k);
  drawPerson(ctx, P, 'stand', 'happy');
  ctx.restore();
  circ(ctx, size / 2, size / 2, size / 2 - 2); ctx.lineWidth = 3; ctx.strokeStyle = OUT; ctx.stroke();
  return c;
}

// ----- rooms -----
function wallStripes(ctx, x0, x1, y0, y1, st) {
  st = st || ROOM_STYLES.wall[0];
  ctx.fillStyle = st.a; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  ctx.fillStyle = st.b;
  for (let x = x0; x < x1; x += 36) ctx.fillRect(x, y0, 16, y1 - y0);
  ctx.fillStyle = st.dot;
  for (let x = x0 + 26; x < x1; x += 72) for (let y = y0 + 24; y < y1; y += 48) { circ(ctx, x, y, 2.4); ctx.fill(); }
}
function wainscot(ctx, x0, x1, y0, y1) {
  ctx.fillStyle = '#1f6b3b'; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  ctx.strokeStyle = '#2f8a50'; ctx.lineWidth = 3;
  for (let x = x0 + 14; x < x1 - 40; x += 92) { rrPath(ctx, x, y0 + 14, 78, y1 - y0 - 26, 4); ctx.stroke(); }
  ctx.fillStyle = '#7d4a26'; ctx.fillRect(x0, y0 - 8, x1 - x0, 10);
  ctx.fillStyle = '#5b351b'; ctx.fillRect(x0, y1 - 8, x1 - x0, 10);
}
function tileFloor(ctx, x0, x1, y0, y1, st) {
  st = st || ROOM_STYLES.floor[0];
  if (st.majolica) {
    const tw = 56, th = 40;
    for (let y = y0, r = 0; y < y1; y += th, r++) for (let x = x0, i = 0; x < x1; x += tw, i++) {
      ctx.fillStyle = st.a; ctx.fillRect(x, y, tw, th);
      ctx.beginPath(); ctx.moveTo(x + tw / 2, y + 4); ctx.lineTo(x + tw - 6, y + th / 2); ctx.lineTo(x + tw / 2, y + th - 4); ctx.lineTo(x + 6, y + th / 2); ctx.closePath();
      ctx.fillStyle = (i + r) % 2 ? st.b : '#2f8a6a'; ctx.fill();
      circ(ctx, x + tw / 2, y + th / 2, 6); ctx.fillStyle = '#f2c23a'; ctx.fill();
      ctx.strokeStyle = 'rgba(60,60,90,0.35)'; ctx.lineWidth = 1.5; ctx.strokeRect(x, y, tw, th);
    }
  } else if (st.wood) {
    for (let y = y0, r = 0; y < y1; y += 24, r++) for (let x = x0 - (r * 57) % 160, i = 0; x < x1; x += 160, i++) {
      ctx.fillStyle = (i + r) % 3 === 0 ? st.b : (i + r) % 3 === 1 ? st.a : shade(st.a, -0.06);
      ctx.fillRect(x, y, 160, 24);
      ctx.strokeStyle = 'rgba(70,35,15,0.45)'; ctx.lineWidth = 2; ctx.strokeRect(x, y, 160, 24);
    }
  } else {
    const tw = st.marble ? 80 : 64, th = 40;
    for (let y = y0, r = 0; y < y1; y += th, r++) for (let x = x0 - (r % 2) * tw / 2, i = 0; x < x1; x += tw, i++) {
      ctx.fillStyle = (i + r) % 2 ? st.a : st.b;
      ctx.fillRect(x, y, tw, th);
      if (st.marble) { ctx.strokeStyle = 'rgba(150,140,130,0.35)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x + 8, y + 6 + (i % 3) * 8); ctx.quadraticCurveTo(x + tw / 2, y + th / 2, x + tw - 6, y + th - 8); ctx.stroke(); }
    }
    ctx.strokeStyle = 'rgba(90,40,20,0.35)'; ctx.lineWidth = 2;
    for (let y = y0; y < y1; y += th) { ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke(); }
  }
  ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(x0, y0, x1 - x0, 10);
}
function stringLights(ctx, x0, x1, hooks, sag, yTop) {
  for (let i = 0; i < hooks.length - 1; i++) {
    const a = hooks[i], b = hooks[i + 1];
    ctx.strokeStyle = '#3a2418'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(a, yTop); ctx.quadraticCurveTo((a + b) / 2, yTop + sag * 2, b, yTop); ctx.stroke();
    for (let t = 0.08; t < 1; t += 0.12) {
      const x = (1 - t) * (1 - t) * a + 2 * (1 - t) * t * ((a + b) / 2) + t * t * b;
      const y = (1 - t) * (1 - t) * yTop + 2 * (1 - t) * t * (yTop + sag * 2) + t * t * yTop;
      const g = ctx.createRadialGradient(x, y + 7, 1, x, y + 7, 18);
      g.addColorStop(0, 'rgba(255,226,140,0.75)'); g.addColorStop(1, 'rgba(255,226,140,0)');
      ctx.fillStyle = g; circ(ctx, x, y + 7, 18); ctx.fill();
      ell(ctx, x, y + 7, 4.5, 6.5); fs(ctx, '#ffe48f', 1.5);
    }
  }
}
function bunting(ctx, hooks, sag, yTop) {
  const cols = ['#1f8a4c', '#fbf3e0', '#d9432f'];
  for (let i = 0; i < hooks.length - 1; i++) {
    const a = hooks[i], b = hooks[i + 1];
    ctx.strokeStyle = '#7d4a26'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(a, yTop); ctx.quadraticCurveTo((a + b) / 2, yTop + sag * 2, b, yTop); ctx.stroke();
    let k = 0;
    for (let t = 0.05; t < 0.97; t += 0.075, k++) {
      const x = (1 - t) * (1 - t) * a + 2 * (1 - t) * t * ((a + b) / 2) + t * t * b;
      const y = (1 - t) * (1 - t) * yTop + 2 * (1 - t) * t * (yTop + sag * 2) + t * t * yTop;
      ctx.beginPath(); ctx.moveTo(x - 9, y); ctx.lineTo(x + 9, y); ctx.lineTo(x, y + 20); ctx.closePath();
      fs(ctx, cols[k % 3], 1.5);
    }
  }
}
function plant(ctx, x, floorY, big) {
  const s = big ? 1.3 : 1;
  ctx.fillStyle = '#2f7d3f';
  const leaves = [[-26, -60], [-8, -84], [14, -70], [28, -50], [-30, -36], [6, -50], [-12, -40]];
  for (const [dx, dy] of leaves) { ell(ctx, x + dx * s, floorY - 40 * s + dy * s * 0.6, 16 * s, 10 * s, dx * 0.03); fs(ctx, dx % 2 ? '#3f9a4c' : '#2f7d3f', 2.5); }
  ctx.beginPath(); ctx.moveTo(x - 24 * s, floorY - 46 * s); ctx.lineTo(x + 24 * s, floorY - 46 * s); ctx.lineTo(x + 18 * s, floorY); ctx.lineTo(x - 18 * s, floorY); ctx.closePath(); fs(ctx, '#c8603a', 3);
  rrPath(ctx, x - 28 * s, floorY - 52 * s, 56 * s, 12 * s, 4); fs(ctx, '#d9744a', 3);
}
function bottle(ctx, x, y, h, color) {
  rrPath(ctx, x - 8, y - h, 16, h, 5); fs(ctx, color, 2.5);
  rrPath(ctx, x - 3, y - h - 12, 6, 14, 2); fs(ctx, color, 2.5);
  ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(x - 5, y - h + 6, 3, h - 12);
  rrPath(ctx, x - 7, y - h * 0.6, 14, h * 0.3, 2); fs(ctx, '#fbf3e0', 1.5);
}
function jar(ctx, x, y, w, h, fill) {
  rrPath(ctx, x - w / 2, y - h, w, h, 6); fs(ctx, 'rgba(220,240,240,0.6)', 2.5);
  ctx.save(); rrPath(ctx, x - w / 2 + 3, y - h * 0.75, w - 6, h * 0.75 - 3, 4); ctx.clip();
  ctx.fillStyle = fill; ctx.fillRect(x - w / 2, y - h, w, h);
  ctx.strokeStyle = shade(fill, -0.25); ctx.lineWidth = 1.5;
  for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(x - w / 2 + i * 6, y - 4); ctx.lineTo(x - w / 2 + i * 6 + 8, y - h * 0.7); ctx.stroke(); }
  ctx.restore();
  rrPath(ctx, x - w / 2 - 2, y - h - 8, w + 4, 10, 3); fs(ctx, '#c8603a', 2.5);
}

const FLOOR_LOCAL = 330;   // floor line inside the 458px-tall room canvases
function styleOf(kind, id) { return ROOM_STYLES[kind].find(s => s.id === id) || ROOM_STYLES[kind][0]; }
// ----- renovations -----
function awning(ctx, x0, x1, y0, y1) {
  const n = 8, sw = (x1 - x0) / n;
  const path = () => { ctx.beginPath(); ctx.moveTo(x0 + 10, y0); ctx.lineTo(x1 - 10, y0); ctx.lineTo(x1, y1); for (let i = n - 1; i >= 0; i--) ctx.arc(x0 + (i + 0.5) * sw, y1, sw / 2, 0, Math.PI); ctx.closePath(); };
  ctx.save(); path(); ctx.clip();
  for (let i = 0; i < n; i++) { ctx.fillStyle = i % 2 ? '#fbf3e0' : '#d9432f'; ctx.fillRect(x0 + i * sw, y0, sw, y1 - y0 + sw); }
  ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(x0, y1 - 4, x1 - x0, sw);
  ctx.restore();
  path(); ctx.lineWidth = 3; ctx.strokeStyle = OUT; ctx.stroke();
  rrPath(ctx, x0 + 4, y0 - 5, x1 - x0 - 8, 7, 3); fs(ctx, '#7d4a26', 2.5);
}
function beams(ctx, W, step = 150) {
  ctx.fillStyle = '#5b351b'; ctx.fillRect(0, 0, W, 16);
  for (let x = 40; x < W; x += step) {
    rrPath(ctx, x - 16, 0, 32, 26, 3); fs(ctx, '#6b3f22', 2.5);
    ctx.strokeStyle = 'rgba(40,20,8,0.5)'; ctx.lineWidth = 1.5; circ(ctx, x, 13, 6); ctx.stroke(); circ(ctx, x, 13, 2.5); ctx.stroke();
  }
}
function pendant(ctx, x, y0, len) {
  ctx.strokeStyle = '#3a2418'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y0 + len); ctx.stroke();
  const y = y0 + len, g = ctx.createRadialGradient(x, y + 16, 2, x, y + 16, 36);
  g.addColorStop(0, 'rgba(255,226,140,0.8)'); g.addColorStop(1, 'rgba(255,226,140,0)');
  ctx.fillStyle = g; circ(ctx, x, y + 16, 36); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x - 7, y); ctx.lineTo(x + 7, y); ctx.lineTo(x + 20, y + 18); ctx.lineTo(x - 20, y + 18); ctx.closePath(); fs(ctx, '#1f6b3b', 2.5);
  ctx.fillStyle = '#e6b84a'; ctx.fillRect(x - 20, y + 16, 40, 3);
  ell(ctx, x, y + 21, 7, 3.5); fs(ctx, '#ffe48f', 1.5);
}
function chandelier(ctx, x, y) {
  ctx.strokeStyle = '#8c6a2a'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, y - 4); ctx.stroke();
  const g = ctx.createRadialGradient(x, y, 4, x, y, 72); g.addColorStop(0, 'rgba(255,230,150,0.55)'); g.addColorStop(1, 'rgba(255,230,150,0)');
  ctx.fillStyle = g; circ(ctx, x, y, 72); ctx.fill();
  ctx.strokeStyle = '#c8962a'; ctx.lineWidth = 4;
  for (const dx of [-42, -21, 21, 42]) { ctx.beginPath(); ctx.moveTo(x, y + 10); ctx.quadraticCurveTo(x + dx * 0.6, y + 24, x + dx, y + 4); ctx.stroke(); }
  for (const dx of [-42, -21, 0, 21, 42]) {
    const cy = dx === 0 ? y - 6 : y + 4;
    if (dx) { ell(ctx, x + dx, cy + 9, 2.6, 4.5); ctx.fillStyle = 'rgba(225,242,255,0.95)'; ctx.fill(); ctx.lineWidth = 1; ctx.strokeStyle = '#7d8a96'; ctx.stroke(); }
    rrPath(ctx, x + dx - 3, cy - 12, 6, 12, 1); fs(ctx, '#fbf6e8', 1.5);
    ell(ctx, x + dx, cy - 16, 3, 5); ctx.fillStyle = '#ffb83a'; ctx.fill();
  }
  ell(ctx, x, y + 8, 12, 9); fs(ctx, '#e6b84a', 2.5);
}
function plaque(ctx, x, y) {
  rrPath(ctx, x - 74, y - 20, 148, 40, 8); fs(ctx, '#e6b84a', 3);
  rrPath(ctx, x - 68, y - 15, 136, 30, 5); ctx.lineWidth = 1.5; ctx.strokeStyle = '#a8781a'; ctx.stroke();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#5b351b'; ctx.font = '800 11px "Baloo 2", sans-serif'; ctx.fillText('LA GAZZETTA', x, y - 6);
  ctx.fillStyle = '#b8322a'; ctx.font = '800 12px "Baloo 2", sans-serif'; ctx.fillText('★★★★★ BEST IN ITALY', x, y + 8);
}
function shopSign(ctx, renov) {
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (!renov) {
    rrPath(ctx, 640, 18, 250, 46, 10); fs(ctx, '#7d4a26');
    rrPath(ctx, 648, 24, 234, 34, 7); fs(ctx, '#1f6b3b', 2.5);
    ctx.fillStyle = '#f6c453'; ctx.font = '800 26px "Baloo 2", sans-serif'; ctx.fillText('NOODLE RUSH', 765, 43);
    return;
  }
  const gold = renov >= 3;
  rrPath(ctx, 612, 8, 306, 64, 12); fs(ctx, gold ? '#e6b84a' : '#7d4a26');
  rrPath(ctx, 621, 15, 288, 50, 9); fs(ctx, renov === 2 ? '#8c1f1a' : '#1f6b3b', 2.5);
  ctx.fillStyle = gold ? '#f6d98a' : '#fbf3e0'; ctx.font = '800 13px "Baloo 2", sans-serif';
  ctx.fillText(['', 'TRATTORIA', 'RISTORANTE', '★ OSTERIA FAMOSA ★'][renov], 765, 26);
  ctx.fillStyle = '#f6c453'; ctx.font = '800 28px "Baloo 2", sans-serif'; ctx.fillText('NOODLE RUSH', 765, 49);
}
function renovIconCanvas(tier) {
  const [c, ctx] = mkCanvas(150, 112, 1.5);
  ctx.save(); rrPath(ctx, 2, 2, 146, 108, 12); ctx.clip();
  wallStripes(ctx, 0, 150, 0, 112, ROOM_STYLES.wall[0]);
  if (tier === 1) {
    rrPath(ctx, 36, 54, 78, 58, 4); fs(ctx, '#bfe3f2', 3);
    awning(ctx, 24, 126, 36, 54);
    rrPath(ctx, 22, 4, 106, 24, 6); fs(ctx, '#7d4a26', 2);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#f6c453'; ctx.font = '800 13px "Baloo 2", sans-serif'; ctx.fillText('TRATTORIA', 75, 16);
  } else if (tier === 2) {
    beams(ctx, 150, 66); pendant(ctx, 42, 16, 30); pendant(ctx, 108, 16, 46);
  } else {
    ctx.fillStyle = '#e6b84a'; ctx.fillRect(0, 0, 150, 6);
    chandelier(ctx, 75, 34);
    ctx.save(); ctx.translate(75, 92); ctx.scale(0.85, 0.85); plaque(ctx, 0, 0); ctx.restore();
  }
  ctx.restore();
  rrPath(ctx, 2, 2, 146, 108, 12); ctx.lineWidth = 3; ctx.strokeStyle = OUT; ctx.stroke();
  return c;
}
// art for the piazza market stalls
function marketArtCanvas(id) {
  const [c, ctx] = mkCanvas(120, 120, 1.5);
  if (id === 'flowers') {
    ctx.strokeStyle = '#3f8f3a'; ctx.lineWidth = 3;
    const heads = [[34, 34, '#e8434f'], [60, 22, '#f2c23a'], [86, 34, '#e3638f'], [46, 50, '#f28a3c'], [76, 52, '#a98bd0']];
    for (const [x, y] of heads) { ctx.beginPath(); ctx.moveTo(60, 80); ctx.quadraticCurveTo((x + 60) / 2, (y + 80) / 2 + 6, x, y); ctx.stroke(); }
    for (const [x, y, col] of heads) { for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; circ(ctx, x + Math.cos(a) * 7, y + Math.sin(a) * 7, 6); fs(ctx, col, 1.5); } circ(ctx, x, y, 4.5); fs(ctx, '#ffe48f', 1.5); }
    ctx.beginPath(); ctx.moveTo(40, 74); ctx.lineTo(80, 74); ctx.lineTo(72, 114); ctx.lineTo(48, 114); ctx.closePath(); fs(ctx, '#2f6fb0', 3);
    ctx.fillStyle = '#fbf3e0'; ctx.fillRect(46, 88, 28, 6);
  } else if (id === 'oil') {
    ctx.save(); ctx.translate(60, 114); ctx.scale(2, 2); bottle(ctx, 0, 0, 34, '#8a9a2a'); ctx.restore();
    ctx.fillStyle = '#5b351b'; ctx.font = '800 11px "Baloo 2", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('OLIO', 60, 76);
    ctx.strokeStyle = '#5b6b2a'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(84, 110); ctx.quadraticCurveTo(96, 80, 110, 66); ctx.stroke();
    for (const [x, y, a] of [[92, 92, -0.8], [100, 80, 0.6], [104, 72, -0.6], [96, 100, 0.7]]) { ell(ctx, x, y, 8, 3.5, a); fs(ctx, '#7a9a4a', 1.5); }
    for (const [x, y] of [[88, 84], [102, 90]]) { ell(ctx, x, y, 4, 5); fs(ctx, '#3a4a1a', 1.5); }
  }
  return c;
}
function restaurantCanvas(room = {}, renov = 0) {
  const W = 1280, H = 458, F = FLOOR_LOCAL;
  const [c, ctx] = mkCanvas(W, H, 1.5);
  wallStripes(ctx, 0, W, 0, 236, styleOf('wall', room.wall));
  wainscot(ctx, 0, W, 236, F);
  tileFloor(ctx, 0, W, F, H, styleOf('floor', room.floor));
  ctx.fillStyle = '#7d4a26'; ctx.fillRect(0, 0, W, 10);
  if (renov >= 2) beams(ctx, W);
  if (renov >= 3) { ctx.fillStyle = '#e6b84a'; ctx.fillRect(0, 16, W, 4); ctx.fillRect(0, 229, W, 6); }

  // door
  rrPath(ctx, 22, 62, 132, F - 58, 6); fs(ctx, '#5b351b');
  rrPath(ctx, 32, 72, 112, F - 72, 4); fs(ctx, '#8c4f2a', 3);
  rrPath(ctx, 46, 86, 84, 92, 6); fs(ctx, '#bfe3f2', 3);
  ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.moveTo(56, 168); ctx.lineTo(90, 96); ctx.lineTo(104, 96); ctx.lineTo(70, 168); ctx.fill();
  rrPath(ctx, 46, 196, 84, 100, 6); ctx.lineWidth = 3; ctx.strokeStyle = '#5b351b'; ctx.stroke();
  circ(ctx, 132, 220, 6); fs(ctx, '#e6b84a', 2.5);
  ctx.strokeStyle = OUT; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(70, 132); ctx.lineTo(88, 116); ctx.lineTo(106, 132); ctx.stroke();
  rrPath(ctx, 52, 132, 72, 30, 5); fs(ctx, '#1f6b3b', 2.5);
  ctx.fillStyle = '#fbf3e0'; ctx.font = '800 16px "Baloo 2", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('APERTO', 88, 148);
  ctx.fillStyle = '#7d3d1e'; rrPath(ctx, 30, F - 2, 116, 12, 4); ctx.fill();

  // window with town view
  const wx = 176, wy = 64, ww = 168, wh = 140;
  rrPath(ctx, wx - 8, wy - 8, ww + 16, wh + 16, 8); fs(ctx, '#7d4a26');
  ctx.save(); rrPath(ctx, wx, wy, ww, wh, 4); ctx.clip();
  const sky = ctx.createLinearGradient(0, wy, 0, wy + wh); sky.addColorStop(0, '#8ccbec'); sky.addColorStop(1, '#e3f3fa');
  ctx.fillStyle = sky; ctx.fillRect(wx, wy, ww, wh);
  circ(ctx, wx + 136, wy + 30, 14); ctx.fillStyle = '#ffe48f'; ctx.fill();
  ctx.fillStyle = '#8cc07a'; ell(ctx, wx + 60, wy + wh, 120, 50); ctx.fill();
  const houses = [[wx + 6, 64, 40, '#f2c879'], [wx + 44, 82, 34, '#e9a66b'], [wx + 76, 58, 44, '#f4e3c3'], [wx + 118, 76, 40, '#f0b98f']];
  for (const [hx, hh, hw, col] of houses) {
    ctx.fillStyle = col; ctx.fillRect(hx, wy + wh - hh, hw, hh);
    ctx.fillStyle = '#c8603a'; ctx.beginPath(); ctx.moveTo(hx - 4, wy + wh - hh); ctx.lineTo(hx + hw / 2, wy + wh - hh - 16); ctx.lineTo(hx + hw + 4, wy + wh - hh); ctx.fill();
    ctx.fillStyle = '#5b7fa3'; for (let k = 0; k < 2; k++) ctx.fillRect(hx + 7 + k * (hw / 2 - 2), wy + wh - hh + 12, 8, 10);
  }
  ctx.fillStyle = '#2d5e34'; ell(ctx, wx + 154, wy + wh - 40, 7, 30); ctx.fill();
  ctx.restore();
  ctx.strokeStyle = '#7d4a26'; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.moveTo(wx + ww / 2, wy); ctx.lineTo(wx + ww / 2, wy + wh); ctx.moveTo(wx, wy + wh / 2); ctx.lineTo(wx + ww, wy + wh / 2); ctx.stroke();
  rrPath(ctx, wx - 4, wy - 4, ww + 8, wh + 8, 6); ctx.lineWidth = 3; ctx.strokeStyle = OUT; ctx.stroke();
  // flower box
  for (let i = 0; i < 9; i++) { ell(ctx, wx + 8 + i * 19, wy + wh + 12, 9, 6); fs(ctx, '#3f9a4c', 2); }
  for (let i = 0; i < 8; i++) { circ(ctx, wx + 16 + i * 19, wy + wh + 6, 6); fs(ctx, i % 2 ? '#e8434f' : '#f28a3c', 2); }
  rrPath(ctx, wx - 6, wy + wh + 14, ww + 12, 22, 4); fs(ctx, '#c8603a');
  if (renov >= 1) awning(ctx, wx - 18, wx + ww + 18, 32, 54);

  // chalkboard menu
  rrPath(ctx, 370, 52, 170, 164, 8); fs(ctx, '#7d4a26');
  rrPath(ctx, 380, 62, 150, 144, 4); fs(ctx, '#2c3a2f', 3);
  ctx.fillStyle = '#f4f1e8'; ctx.textAlign = 'center';
  ctx.font = '800 24px "Baloo 2", sans-serif'; ctx.fillText('MENU', 455, 84);
  const mday = typeof SAVE !== 'undefined' ? SAVE.day || 1 : 1, msh = unlockedAt(SHAPES, mday), msa = unlockedAt(SAUCES, mday), big = msh.length <= 3;
  const lots = msh.length > 5;
  ctx.font = (big ? 19 : lots ? 14 : 16) + 'px "Patrick Hand", cursive';
  msh.forEach((t, i) => ctx.fillText(t.name, 455, (big ? 112 : lots ? 100 : 104) + i * (big ? 22 : lots ? 14 : 17)));
  ctx.font = (msa.length <= 3 ? 15 : 13) + 'px "Patrick Hand", cursive'; ctx.fillStyle = '#f6c453';
  if (msa.length <= 3) ctx.fillText(msa.map(q => q.name).join(' · '), 455, 184);
  else { ctx.fillText(msa.slice(0, 3).map(q => q.name).join(' · '), 455, 185); ctx.fillText(msa.slice(3).map(q => q.name).join(' · '), 455, 200); }

  // sign + shelves behind the counter
  shopSign(ctx, renov);
  for (const sy of [128, 196]) { rrPath(ctx, 596, sy, 336, 10, 3); fs(ctx, '#8c4f2a', 3); }
  jar(ctx, 620, 128, 30, 42, '#f6c453'); jar(ctx, 656, 128, 30, 34, '#e9b34a');
  bottle(ctx, 690, 128, 38, '#4f7d2a'); bottle(ctx, 712, 128, 44, '#3f6b25');
  for (let i = 0; i < 3; i++) { rrPath(ctx, 734 + i * 26, 128 - 30, 22, 30, 3); fs(ctx, '#d9432f', 2.5); ctx.fillStyle = '#fbf3e0'; ctx.fillRect(736 + i * 26, 128 - 20, 18, 8); }
  jar(ctx, 830, 128, 30, 40, '#f6c453'); bottle(ctx, 866, 128, 40, '#7d2a22'); bottle(ctx, 890, 128, 34, '#4f7d2a');
  // plates and a pot on the lower shelf
  for (let i = 0; i < 4; i++) { ell(ctx, 630, 192 - i * 6, 26, 5); fs(ctx, '#fbfbf7', 2); }
  rrPath(ctx, 676, 166, 56, 30, 8); fs(ctx, '#9aa1a8'); rrPath(ctx, 670, 160, 68, 8, 4); fs(ctx, '#7d848c', 2.5);
  // garlic braid
  ctx.strokeStyle = '#a07a4a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(914, 140); ctx.lineTo(914, 186); ctx.stroke();
  for (let i = 0; i < 4; i++) { circ(ctx, 908 + (i % 2) * 12, 152 + i * 11, 7); fs(ctx, '#f4ecd8', 2); }

  if (renov < 2) { stringLights(ctx, 0, W, [0, 320, 640, 960, 1280], 16, 6); bunting(ctx, [950, 1115, 1280], 10, 22); }
  else for (const x of [580, 945, 1110]) pendant(ctx, x, 16, 22);
  if (renov < 1) bunting(ctx, [0, 290, 580], 12, 22);
  if (renov >= 3) { chandelier(ctx, 455, 30); plaque(ctx, 455, 268); }

  return c;
}

function counterCanvas() {
  const [c, ctx] = mkCanvas(380, 150, 1.5);
  // register
  rrPath(ctx, 34, 20, 86, 50, 8); fs(ctx, '#2f7d6f');
  rrPath(ctx, 44, 4, 66, 22, 5); fs(ctx, '#21564d');
  rrPath(ctx, 50, 8, 54, 14, 3); fs(ctx, '#bfe8c9', 2);
  ctx.fillStyle = '#1d3d36'; ctx.font = '800 12px Nunito, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('$ 0.00', 77, 15);
  ctx.fillStyle = '#e8f1ec'; for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) { rrPath(ctx, 48 + i * 20, 34 + j * 15, 14, 10, 3); ctx.fill(); }
  // bell
  ell(ctx, 300, 66, 20, 5); fs(ctx, '#9aa1a8', 2.5);
  ctx.beginPath(); ctx.arc(300, 64, 15, Math.PI, 0); ctx.closePath(); fs(ctx, '#e6b84a', 3);
  circ(ctx, 300, 46, 4); fs(ctx, '#e6b84a', 2);
  // breadsticks
  rrPath(ctx, 226, 34, 30, 36, 6); fs(ctx, '#c8603a', 3);
  for (let i = 0; i < 4; i++) { ctx.save(); ctx.translate(232 + i * 6, 34); ctx.rotate(-0.2 + i * 0.12); rrPath(ctx, -2, -30, 5, 34, 2); fs(ctx, '#e9b979', 1.5); ctx.restore(); }
  // counter body
  rrPath(ctx, 4, 68, 372, 18, 5); fs(ctx, '#efe7d6');
  rrPath(ctx, 14, 84, 352, 64, 4); fs(ctx, '#8c4f2a');
  for (let i = 0; i < 11; i++) { rrPath(ctx, 22 + i * 31.5, 94, 26, 26, 3); fs(ctx, i % 2 ? '#fbf3e0' : '#1f8a4c', 2); }
  ctx.fillStyle = '#6b3a1d'; ctx.fillRect(16, 128, 348, 18);
  return c;
}

function chairCanvas(cushion) {
  const [c, ctx] = mkCanvas(72, 100, 1.5);
  rrPath(ctx, 2, 2, 68, 96, 10); fs(ctx, '#8c4f2a');
  rrPath(ctx, 12, 12, 48, 40, 6); fs(ctx, '#a8683a', 3);
  if (cushion) { rrPath(ctx, 8, 60, 56, 22, 9); fs(ctx, '#c9372c', 3); ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(16, 64, 30, 4); }
  return c;
}
function tableCanvas(w = 190, cloth = '217,67,47') {
  const [c, ctx] = mkCanvas(w, 92, 1.5);
  rrPath(ctx, 24, 40, 14, 50, 4); fs(ctx, '#5b351b', 3);
  rrPath(ctx, w - 38, 40, 14, 50, 4); fs(ctx, '#5b351b', 3);
  rrPath(ctx, 4, 4, w - 8, 52, 8); fs(ctx, '#fbf3e0');
  ctx.save(); rrPath(ctx, 4, 4, w - 8, 52, 8); ctx.clip();
  ctx.fillStyle = `rgba(${cloth},0.85)`;
  for (let x = 4; x < w; x += 20) for (let y = 4; y < 60; y += 20) if (((x - 4) / 20 + (y - 4) / 20) % 2 === 0) ctx.fillRect(x, y, 10, 10);
  ctx.fillStyle = `rgba(${cloth},0.45)`;
  for (let x = 4; x < w; x += 10) for (let y = 4; y < 60; y += 10) if (((x - 4) / 10 + (y - 4) / 10) % 2 === 0) ctx.fillRect(x, y, 10, 10);
  ctx.restore();
  rrPath(ctx, 4, 4, w - 8, 52, 8); ctx.lineWidth = 4; ctx.strokeStyle = OUT; ctx.stroke();
  // candle in a bottle
  return c;
}

function kitchenCanvas() {
  const W = 1280, H = 458;
  const [c, ctx] = mkCanvas(W, H, 1.5);
  ctx.fillStyle = '#f4f1ea'; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = '#dcd6c8'; ctx.lineWidth = 2;
  for (let y = 0, r = 0; y < H; y += 26, r++) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    for (let x = (r % 2) * 26; x < W; x += 52) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 26); ctx.stroke(); }
  }
  ctx.fillStyle = '#1f6b3b'; ctx.fillRect(0, 70, W, 14);
  ctx.fillStyle = '#d9432f'; ctx.fillRect(0, 84, W, 5);
  // utensil rail
  ctx.fillStyle = '#9aa1a8'; rrPath(ctx, 350, 18, 900, 8, 4); fs(ctx, '#9aa1a8', 2.5);
  const tools = [[400, 'ladle'], [470, 'whisk'], [540, 'spoon'], [1130, 'ladle'], [1200, 'spoon']];
  for (const [x, t] of tools) {
    ctx.strokeStyle = OUT; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, 26, 5, Math.PI, 0); ctx.stroke();
    rrPath(ctx, x - 3, 30, 6, 30, 3); fs(ctx, t === 'spoon' ? '#a8683a' : '#b9bec4', 2);
    if (t === 'ladle') { ell(ctx, x, 64, 12, 8); fs(ctx, '#b9bec4', 2); }
    else if (t === 'whisk') { ell(ctx, x, 66, 9, 14); ctx.lineWidth = 2; ctx.strokeStyle = '#7d848c'; ctx.stroke(); }
    else { ell(ctx, x, 64, 8, 11); fs(ctx, '#a8683a', 2); }
  }
  // hanging peppers and garlic
  ctx.strokeStyle = '#a07a4a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(620, 0); ctx.lineTo(620, 60); ctx.moveTo(1050, 0); ctx.lineTo(1050, 56); ctx.stroke();
  for (let i = 0; i < 4; i++) { ell(ctx, 614 + (i % 2) * 12, 18 + i * 12, 5, 9, 0.3); fs(ctx, '#d9432f', 2); }
  for (let i = 0; i < 4; i++) { circ(ctx, 1044 + (i % 2) * 12, 18 + i * 11, 7); fs(ctx, '#f4ecd8', 2); }
  // counter
  ctx.fillStyle = '#8c4f2a'; ctx.fillRect(0, 378, W, 80);
  ctx.fillStyle = '#a8683a'; ctx.fillRect(0, 372, W, 12);
  ctx.strokeStyle = '#6b3a1d'; ctx.lineWidth = 2;
  for (let x = 0; x < W; x += 140) { ctx.beginPath(); ctx.moveTo(x, 384); ctx.lineTo(x, H); ctx.stroke(); }
  return c;
}

function boothCanvas() {
  const W = 1280, H = 458;
  const [c, ctx] = mkCanvas(W, H, 1.5);
  wallStripes(ctx, 0, W, 0, 250);
  wainscot(ctx, 0, W, 250, H);
  // big window with the piazza
  const wx = 760, wy = 40, ww = 300, wh = 190;
  rrPath(ctx, wx - 10, wy - 10, ww + 20, wh + 20, 10); fs(ctx, '#7d4a26');
  ctx.save(); rrPath(ctx, wx, wy, ww, wh, 4); ctx.clip();
  const sky = ctx.createLinearGradient(0, wy, 0, wy + wh); sky.addColorStop(0, '#8ccbec'); sky.addColorStop(1, '#f3f0dc');
  ctx.fillStyle = sky; ctx.fillRect(wx, wy, ww, wh);
  ctx.fillStyle = '#e9d9b0'; ctx.fillRect(wx, wy + wh - 40, ww, 40);
  // fountain
  ell(ctx, wx + 150, wy + wh - 30, 70, 14); fs(ctx, '#d9d2c0', 3);
  rrPath(ctx, wx + 140, wy + wh - 80, 20, 50, 4); fs(ctx, '#d9d2c0', 3);
  ctx.fillStyle = 'rgba(140,203,236,0.9)'; ell(ctx, wx + 150, wy + wh - 84, 22, 8); ctx.fill();
  const houses = [[wx + 6, 110, 60, '#f2c879'], [wx + 230, 120, 64, '#e9a66b']];
  for (const [hx, hh, hw, col] of houses) {
    ctx.fillStyle = col; ctx.fillRect(hx, wy + wh - 40 - hh, hw, hh);
    ctx.fillStyle = '#c8603a'; ctx.fillRect(hx - 4, wy + wh - 40 - hh - 10, hw + 8, 12);
    ctx.fillStyle = '#5b7fa3'; for (let k = 0; k < 2; k++) for (let j = 0; j < 2; j++) ctx.fillRect(hx + 10 + k * (hw / 2), wy + wh - 40 - hh + 16 + j * 40, 12, 18);
  }
  ctx.restore();
  ctx.strokeStyle = '#7d4a26'; ctx.lineWidth = 8;
  ctx.beginPath(); ctx.moveTo(wx + ww / 2, wy); ctx.lineTo(wx + ww / 2, wy + wh); ctx.stroke();
  rrPath(ctx, wx - 4, wy - 4, ww + 8, wh + 8, 6); ctx.lineWidth = 3; ctx.strokeStyle = OUT; ctx.stroke();
  // picture frames
  rrPath(ctx, 360, 60, 120, 90, 6); fs(ctx, '#c8963a');
  rrPath(ctx, 370, 70, 100, 70, 3); fs(ctx, '#3f6b8f', 2.5);
  ctx.fillStyle = '#f2c879'; circ(ctx, 440, 90, 10); ctx.fill();
  ctx.fillStyle = '#2f5e7d'; ctx.beginPath(); ctx.moveTo(370, 140); ctx.lineTo(410, 104); ctx.lineTo(450, 140); ctx.fill();
  stringLights(ctx, 0, W, [0, 427, 853, 1280], 14, 6);
  // booth back behind the customer
  rrPath(ctx, 340, 230, 420, 240, 26); fs(ctx, '#b8322a');
  for (let i = 0; i < 5; i++) { rrPath(ctx, 362 + i * 78, 248, 64, 190, 20); fs(ctx, '#c9433a', 3); }
  // pass counter on the right
  rrPath(ctx, 900, 300, 380, 30, 6); fs(ctx, '#efe7d6');
  rrPath(ctx, 910, 326, 360, 140, 4); fs(ctx, '#8c4f2a');
  rrPath(ctx, 1010, 252, 160, 36, 8); fs(ctx, '#1f6b3b', 3);
  ctx.fillStyle = '#f6c453'; ctx.font = '800 20px "Baloo 2", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('ORDER UP', 1090, 271);
  return c;
}

function bigTableCanvas() {
  const w = 560;
  const [c, ctx] = mkCanvas(w, 110, 1.5);
  rrPath(ctx, 4, 4, w - 8, 100, 12); fs(ctx, '#fbf3e0');
  ctx.save(); rrPath(ctx, 4, 4, w - 8, 100, 12); ctx.clip();
  ctx.fillStyle = 'rgba(217,67,47,0.85)';
  for (let x = 4; x < w; x += 28) for (let y = 4; y < 110; y += 28) ctx.fillRect(x, y, 14, 14);
  ctx.fillStyle = 'rgba(217,67,47,0.4)';
  for (let x = 18; x < w; x += 28) for (let y = 4; y < 110; y += 28) ctx.fillRect(x, y, 14, 14);
  for (let x = 4; x < w; x += 28) for (let y = 18; y < 110; y += 28) ctx.fillRect(x, y, 14, 14);
  ctx.restore();
  rrPath(ctx, 4, 4, w - 8, 100, 12); ctx.lineWidth = 4; ctx.strokeStyle = OUT; ctx.stroke();
  return c;
}

// ----- decorations: each returns a canvas drawn at 1.5x; wall pieces anchor at their center, floor pieces at the bottom -----
const DECOR_SIZE = { pisa: [110, 126], nonna: [104, 140], plant: [80, 110], flag: [110, 80], clock: [76, 76], vespa: [96, 124], mandolin: [64, 134],
  colosseum: [140, 104], fern: [110, 140], barrel: [92, 118], lemon: [110, 176], bust: [80, 160], gelato: [160, 180],
  towers: [100, 140], parmigiano: [100, 96], lanterna: [100, 130], basilbox: [120, 90], trevi: [150, 104], column: [72, 170],
  vesuvio: [140, 104], tomatocrate: [104, 84], majolica: [92, 92], cart: [170, 130], accordion: [104, 96], trophy: [80, 160], fountain: [150, 150] };
function decorCanvas(id) {
  const [w, h] = DECOR_SIZE[id];
  const [c, ctx] = mkCanvas(w, h, 1.5);
  const cx = w / 2, B = h - 4;   // B: floor line inside the canvas
  if (id === 'pisa') {
    rrPath(ctx, 3, 3, 104, 120, 6); fs(ctx, '#c8963a');
    rrPath(ctx, 13, 13, 84, 100, 3); fs(ctx, '#bfe3f2', 2.5);
    ctx.fillStyle = '#8cc07a'; ctx.fillRect(14, 89, 82, 23);
    ctx.save(); ctx.translate(55, 89); ctx.rotate(0.12);
    rrPath(ctx, -10, -64, 20, 66, 3); fs(ctx, '#f4ecd8', 2);
    for (let k = 0; k < 5; k++) { ctx.strokeStyle = '#c8b48a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-10, -60 + k * 13); ctx.lineTo(10, -60 + k * 13); ctx.stroke(); }
    ctx.restore();
  } else if (id === 'nonna') {
    ell(ctx, cx, 64, 48, 60); fs(ctx, '#c8963a');
    ell(ctx, cx, 64, 38, 50); fs(ctx, '#f6e7c8', 2.5);
    ctx.save(); ctx.beginPath(); ctx.ellipse(cx, 64, 37, 49, 0, 0, Math.PI * 2); ctx.clip();
    ctx.translate(cx - 90 * 0.42, 74 - 84 * 0.42); ctx.scale(0.42, 0.42); drawPerson(ctx, NONNA_LOOK, 'stand', 'happy'); ctx.restore();
    rrPath(ctx, cx - 30, 118, 60, 18, 4); fs(ctx, '#c8963a', 2.5);
    ctx.fillStyle = '#5b351b'; ctx.font = '14px "Patrick Hand", cursive'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('Nonna', cx, 128);
  } else if (id === 'plant') {
    plant(ctx, cx, B, false);
  } else if (id === 'flag') {
    ctx.strokeStyle = '#7d4a26'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(6, 10); ctx.lineTo(104, 10); ctx.stroke();
    const cols = ['#1f8a4c', '#fbf3e0', '#d9432f'];
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(12 + i * 30, 12); ctx.lineTo(42 + i * 30, 12); ctx.lineTo(42 + i * 30, 66 + (i === 1 ? 4 : 0)); ctx.quadraticCurveTo(27 + i * 30, 74, 12 + i * 30, 66); ctx.closePath(); fs(ctx, cols[i], 3); }
    circ(ctx, 6, 10, 5); fs(ctx, '#e6b84a', 2); circ(ctx, 104, 10, 5); fs(ctx, '#e6b84a', 2);
  } else if (id === 'clock') {
    circ(ctx, cx, h / 2, 34); fs(ctx, '#7d4a26');
    circ(ctx, cx, h / 2, 27); fs(ctx, '#fbf3e0', 3);
    ctx.fillStyle = OUT; for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; circ(ctx, cx + Math.cos(a) * 21, h / 2 + Math.sin(a) * 21, i % 3 ? 1.4 : 2.6); ctx.fill(); }
    ctx.strokeStyle = OUT; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(cx, h / 2); ctx.lineTo(cx, h / 2 - 15); ctx.moveTo(cx, h / 2); ctx.lineTo(cx + 11, h / 2 + 4); ctx.stroke();
    circ(ctx, cx, h / 2, 3.5); fs(ctx, '#d9432f', 1.5);
  } else if (id === 'vespa') {
    rrPath(ctx, 3, 3, 90, 118, 4); fs(ctx, '#f6e2b0');
    rrPath(ctx, 9, 9, 78, 106, 3); ctx.lineWidth = 2; ctx.strokeStyle = '#d9432f'; ctx.stroke();
    ctx.fillStyle = '#d9432f'; ctx.font = '800 15px "Baloo 2", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('VESPA', cx, 24);
    // scooter
    circ(ctx, 28, 88, 10); fs(ctx, '#2b2b30', 3); circ(ctx, 70, 88, 10); fs(ctx, '#2b2b30', 3);
    ctx.beginPath(); ctx.moveTo(20, 84); ctx.quadraticCurveTo(22, 62, 44, 64); ctx.lineTo(60, 64); ctx.quadraticCurveTo(78, 66, 78, 84); ctx.closePath(); fs(ctx, '#3fa7a0', 3);
    ctx.strokeStyle = OUT; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(66, 64); ctx.lineTo(62, 44); ctx.lineTo(72, 42); ctx.stroke();
    rrPath(ctx, 34, 56, 22, 8, 4); fs(ctx, '#7d4a26', 2.5);
    ctx.fillStyle = '#7d4a26'; ctx.font = '12px "Patrick Hand", cursive'; ctx.fillText('Borgo Fiore', cx, 108);
  } else if (id === 'mandolin') {
    ctx.save(); ctx.translate(cx, 70); ctx.rotate(-0.25);
    rrPath(ctx, -6, -64, 12, 64, 3); fs(ctx, '#5b351b', 3);
    rrPath(ctx, -9, -72, 18, 14, 4); fs(ctx, '#7d4a26', 3);
    ell(ctx, 0, 26, 24, 34); fs(ctx, '#c8803a');
    circ(ctx, 0, 18, 7); fs(ctx, '#3a2418', 2);
    ctx.strokeStyle = '#efe7d6'; ctx.lineWidth = 1; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(k * 1.6, -60); ctx.lineTo(k * 1.6, 44); ctx.stroke(); }
    ctx.restore();
  } else if (id === 'colosseum') {
    rrPath(ctx, 3, 3, 134, 98, 6); fs(ctx, '#c8963a');
    rrPath(ctx, 12, 12, 116, 80, 3); fs(ctx, '#f6c98a', 2.5);
    ctx.fillStyle = '#fbe6b8'; ctx.fillRect(13, 13, 114, 40);
    ctx.beginPath(); ctx.moveTo(22, 88); ctx.lineTo(22, 46); ctx.quadraticCurveTo(70, 30, 118, 46); ctx.lineTo(118, 88); ctx.closePath(); fs(ctx, '#d9a066', 2.5);
    ctx.fillStyle = '#9a5a2e';
    for (let r = 0; r < 3; r++) for (let i = 0; i < 7; i++) { rrPath(ctx, 28 + i * 13, 50 + r * 13, 7, 9, 3); ctx.fill(); }
  } else if (id === 'fern') {
    ctx.fillStyle = '#2f7d3f';
    for (let i = 0; i < 9; i++) {
      const a = -Math.PI / 2 + (i - 4) * 0.32, L = 58 + (i % 2) * 10;
      ctx.save(); ctx.translate(cx, B - 44); ctx.rotate(a + Math.PI / 2);
      ell(ctx, 0, -L / 2, 9, L / 2); fs(ctx, i % 2 ? '#3f9a4c' : '#2f7d3f', 2.5);
      ctx.restore();
    }
    rrPath(ctx, cx - 30, B - 46, 60, 46, 8); fs(ctx, '#c8a46a');
    ctx.strokeStyle = '#8c6a3a'; ctx.lineWidth = 2; for (let y = B - 38; y < B; y += 9) { ctx.beginPath(); ctx.moveTo(cx - 28, y); ctx.lineTo(cx + 28, y); ctx.stroke(); }
  } else if (id === 'barrel') {
    rrPath(ctx, cx - 36, B - 74, 72, 74, 18); fs(ctx, '#9a5a2e');
    ctx.strokeStyle = '#5b6168'; ctx.lineWidth = 5; for (const y of [B - 62, B - 14]) { ctx.beginPath(); ctx.moveTo(cx - 34, y); ctx.lineTo(cx + 34, y); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(60,30,10,0.4)'; ctx.lineWidth = 2; for (const x of [-18, 0, 18]) { ctx.beginPath(); ctx.moveTo(cx + x, B - 72); ctx.lineTo(cx + x, B - 2); ctx.stroke(); }
    rrPath(ctx, cx - 36, B - 74, 72, 74, 18); ctx.lineWidth = 4; ctx.strokeStyle = OUT; ctx.stroke();
    bottle(ctx, cx - 12, B - 74, 26, '#7d2a22'); ell(ctx, cx + 14, B - 78, 12, 5); fs(ctx, '#fbfbf7', 2);
  } else if (id === 'lemon') {
    rrPath(ctx, cx - 4, B - 90, 8, 60, 3); fs(ctx, '#7d4a26', 3);
    const blobs = [[0, -130, 34], [-28, -112, 26], [28, -110, 26], [-14, -150, 22], [16, -148, 22]];
    for (const [dx, dy, r] of blobs) { circ(ctx, cx + dx, B + dy + 20, r); fs(ctx, '#3f8f3a', 3); }
    for (const [dx, dy] of [[-20, -104], [12, -118], [26, -96], [-6, -138], [-30, -124], [8, -94]]) { ell(ctx, cx + dx, B + dy + 20, 7, 6); fs(ctx, '#f6d43a', 2); }
    ctx.beginPath(); ctx.moveTo(cx - 30, B - 46); ctx.lineTo(cx + 30, B - 46); ctx.lineTo(cx + 22, B); ctx.lineTo(cx - 22, B); ctx.closePath(); fs(ctx, '#fbf3e0', 3);
    ctx.fillStyle = '#2f5ea8'; for (let i = 0; i < 4; i++) { circ(ctx, cx - 15 + i * 10, B - 26, 3); ctx.fill(); }
  } else if (id === 'bust') {
    rrPath(ctx, cx - 22, B - 74, 44, 74, 4); fs(ctx, '#ece6db');
    rrPath(ctx, cx - 28, B - 80, 56, 10, 3); fs(ctx, '#f7f3ec', 3); rrPath(ctx, cx - 28, B - 8, 56, 8, 3); fs(ctx, '#f7f3ec', 3);
    ctx.beginPath(); ctx.moveTo(cx - 30, B - 80); ctx.quadraticCurveTo(cx - 28, B - 108, cx, B - 108); ctx.quadraticCurveTo(cx + 28, B - 108, cx + 30, B - 80); ctx.closePath(); fs(ctx, '#f2ede4');
    rrPath(ctx, cx - 7, B - 118, 14, 14, 4); fs(ctx, '#f2ede4', 3);
    circ(ctx, cx, B - 132, 20); fs(ctx, '#f2ede4');
    for (let i = 0; i < 6; i++) { circ(ctx, cx - 16 + i * 6.5, B - 148 + Math.abs(i - 2.5) * 2, 6); fs(ctx, '#e6dfd2', 2); }
    ctx.strokeStyle = '#b8b0a2'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, B - 128, 6, 0.2 * Math.PI, 0.8 * Math.PI); ctx.stroke();
  } else if (id === 'gelato') {
    circ(ctx, cx - 44, B - 12, 12); fs(ctx, '#3a3a40', 3); circ(ctx, cx + 44, B - 12, 12); fs(ctx, '#3a3a40', 3);
    rrPath(ctx, cx - 64, B - 84, 128, 66, 8); fs(ctx, '#fbf3e0');
    for (let i = 0; i < 4; i++) { rrPath(ctx, cx - 56 + i * 30, B - 70, 24, 40, 4); fs(ctx, i % 2 ? '#d9432f' : '#1f8a4c', 2); }
    for (const [dx, col] of [[-40, '#f7c6d0'], [-14, '#f6e2a0'], [14, '#c9e7b8'], [40, '#8a5a3a']]) { circ(ctx, cx + dx, B - 90, 11); fs(ctx, col, 2.5); }
    rrPath(ctx, cx - 3, B - 166, 6, 80, 2); fs(ctx, '#9aa1a8', 2);
    ctx.beginPath(); ctx.moveTo(cx - 70, B - 140); ctx.quadraticCurveTo(cx, B - 190, cx + 70, B - 140); ctx.closePath(); fs(ctx, '#fbf3e0');
    ctx.save(); ctx.beginPath(); ctx.moveTo(cx - 70, B - 140); ctx.quadraticCurveTo(cx, B - 190, cx + 70, B - 140); ctx.closePath(); ctx.clip();
    ctx.fillStyle = '#d9432f'; for (let i = 0; i < 5; i += 2) ctx.fillRect(cx - 70 + i * 28, B - 190, 28, 60); ctx.restore();
    ctx.beginPath(); ctx.moveTo(cx - 70, B - 140); ctx.quadraticCurveTo(cx, B - 190, cx + 70, B - 140); ctx.closePath(); ctx.lineWidth = 3; ctx.strokeStyle = OUT; ctx.stroke();
    ctx.fillStyle = '#7d4a26'; ctx.font = '800 13px "Baloo 2", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('GELATO', cx, B - 24);
  } else souvenirArt(ctx, id, w, h, cx, B);
  return c;
}
const painting = (ctx, w, h, bg) => { rrPath(ctx, 3, 3, w - 6, h - 6, 6); fs(ctx, '#c8963a'); rrPath(ctx, 12, 12, w - 24, h - 24, 3); fs(ctx, bg, 2.5); ctx.save(); rrPath(ctx, 12, 12, w - 24, h - 24, 3); ctx.clip(); };
function souvenirArt(ctx, id, w, h, cx, B) {
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (id === 'towers') {
    // Bologna's Two Towers: tall Asinelli and short, leaning Garisenda over red rooftops
    painting(ctx, w, h, '#bfe3f2');
    ctx.fillStyle = '#d9744a'; ctx.fillRect(12, 104, 76, 24);
    ctx.fillStyle = '#c8603a'; for (let x = 12; x < 88; x += 16) { ctx.beginPath(); ctx.moveTo(x, 106); ctx.lineTo(x + 8, 96); ctx.lineTo(x + 16, 106); ctx.fill(); }
    rrPath(ctx, 32, 22, 15, 86, 2); fs(ctx, '#b8643a', 2);
    rrPath(ctx, 29, 18, 21, 7, 2); fs(ctx, '#9a4f2a', 2);
    ctx.fillStyle = '#7d3d1e'; for (let y = 34; y < 100; y += 14) ctx.fillRect(37, y, 5, 6);
    ctx.save(); ctx.translate(62, 106); ctx.rotate(0.08); rrPath(ctx, -8, -54, 17, 54, 2); fs(ctx, '#c97a4a', 2); ctx.restore();
    ctx.restore();
  } else if (id === 'parmigiano') {
    const wheel = (y, ww, hh) => {
      rrPath(ctx, cx - ww / 2, y - hh, ww, hh, 14); fs(ctx, '#e9b64a');
      rrPath(ctx, cx - ww / 2 + 6, y - hh + 5, ww - 12, hh - 10, 10); ctx.lineWidth = 2; ctx.strokeStyle = '#c8902a'; ctx.stroke();
      ctx.fillStyle = '#b07a22'; for (let i = 0; i < 6; i++) { circ(ctx, cx - ww / 2 + 14 + i * (ww - 28) / 5, y - hh / 2 - 4, 1.8); ctx.fill(); }
    };
    wheel(B, 92, 34); wheel(B - 34, 84, 32);
    ctx.fillStyle = '#8a5a1a'; ctx.font = '800 9px "Baloo 2", sans-serif'; ctx.fillText('PARMIGIANO', cx, B - 12);
    ctx.beginPath(); ctx.moveTo(cx - 24, B - 66); ctx.lineTo(cx + 22, B - 66); ctx.lineTo(cx + 12, B - 86); ctx.closePath(); fs(ctx, '#f6e2a0', 3);
    ctx.fillStyle = '#e9b64a'; ctx.fillRect(cx - 22, B - 70, 42, 4);
  } else if (id === 'lanterna') {
    // Genoa's lighthouse at sunset, two stacked towers on a rock
    painting(ctx, w, h, '#f6d8a0');
    const sk = ctx.createLinearGradient(0, 12, 0, 118); sk.addColorStop(0, '#f2a65a'); sk.addColorStop(1, '#f6d8a0'); ctx.fillStyle = sk; ctx.fillRect(12, 12, 76, 106);
    ctx.fillStyle = 'rgba(255,244,180,0.75)';
    ctx.beginPath(); ctx.moveTo(50, 33); ctx.lineTo(12, 20); ctx.lineTo(12, 40); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(50, 33); ctx.lineTo(88, 22); ctx.lineTo(88, 42); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#3f7fb0'; ctx.fillRect(12, 100, 76, 18);
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; for (const x of [18, 70]) ctx.fillRect(x, 108, 10, 2);
    ctx.fillStyle = '#8a7a6a'; ctx.beginPath(); ctx.moveTo(24, 118); ctx.lineTo(34, 94); ctx.lineTo(66, 92); ctx.lineTo(78, 118); ctx.fill();
    rrPath(ctx, 39, 62, 22, 32, 1); fs(ctx, '#f4ecd8', 2); rrPath(ctx, 42, 40, 16, 22, 1); fs(ctx, '#f4ecd8', 2);
    ctx.fillStyle = '#d9432f'; ctx.fillRect(39, 60, 22, 4); ctx.fillRect(42, 38, 16, 4);
    rrPath(ctx, 45, 28, 10, 10, 2); fs(ctx, '#ffe48f', 2);
    ctx.beginPath(); ctx.moveTo(43, 28); ctx.lineTo(50, 20); ctx.lineTo(57, 28); ctx.closePath(); fs(ctx, '#3a3a40', 2);
    ctx.restore();
  } else if (id === 'basilbox') {
    for (let i = 0; i < 3; i++) {
      const bx = cx - 36 + i * 36;
      for (const [dx, dy, r] of [[-12, -52, 11], [12, -54, 11], [0, -68, 12], [-15, -42, 9], [15, -43, 9]]) { ell(ctx, bx + dx, B + dy, r, r * 0.7, dx * 0.04); fs(ctx, (i + dx) % 2 ? '#4fa63e' : '#3f8f3a', 2); }
    }
    rrPath(ctx, cx - 56, B - 40, 112, 40, 4); fs(ctx, '#b8844a');
    ctx.strokeStyle = '#8c6a3a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx - 54, B - 8); ctx.lineTo(cx + 54, B - 8); ctx.stroke();
    rrPath(ctx, cx - 32, B - 34, 64, 18, 3); fs(ctx, '#fbf3e0', 2);
    ctx.fillStyle = '#2f7d3f'; ctx.font = '800 10px "Baloo 2", sans-serif'; ctx.fillText('BASILICO', cx, B - 25);
  } else if (id === 'trevi') {
    painting(ctx, w, h, '#bfe3f2');
    ctx.fillStyle = '#efe2c4'; ctx.fillRect(16, 22, 118, 52);
    ctx.fillStyle = '#e2d2ae'; ctx.fillRect(16, 18, 118, 6);
    ctx.fillStyle = '#cdb98e'; for (const x of [24, 42, 104, 122]) ctx.fillRect(x, 26, 5, 46);
    ctx.fillStyle = '#c9b48a'; ctx.beginPath(); ctx.moveTo(62, 72); ctx.lineTo(62, 44); ctx.arc(75, 44, 13, Math.PI, 0); ctx.lineTo(88, 72); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#f7f3ec'; circ(ctx, 75, 47, 4.5); ctx.fill(); ctx.fillRect(71, 51, 8, 15);
    ctx.fillStyle = '#ddd2bc'; ctx.fillRect(12, 70, 126, 8);
    ctx.fillStyle = '#4fb0c8'; ctx.fillRect(12, 77, 126, 16);
    ctx.fillStyle = 'rgba(255,255,255,0.75)'; for (const x of [24, 54, 88, 116]) ctx.fillRect(x, 83, 12, 2);
    ctx.restore();
  } else if (id === 'column') {
    rrPath(ctx, cx - 30, B - 14, 60, 14, 3); fs(ctx, '#e6dfd2'); rrPath(ctx, cx - 24, B - 25, 48, 12, 3); fs(ctx, '#efeae2');
    rrPath(ctx, cx - 18, B - 142, 36, 119, 2); fs(ctx, '#f2ede4');
    ctx.strokeStyle = '#cfc6b6'; ctx.lineWidth = 2; for (const dx of [-10, -3, 4, 11]) { ctx.beginPath(); ctx.moveTo(cx + dx, B - 138); ctx.lineTo(cx + dx, B - 27); ctx.stroke(); }
    rrPath(ctx, cx - 27, B - 154, 54, 13, 3); fs(ctx, '#efeae2');
    circ(ctx, cx - 26, B - 144, 7); fs(ctx, '#efeae2', 3); circ(ctx, cx + 26, B - 144, 7); fs(ctx, '#efeae2', 3);
    rrPath(ctx, cx - 32, B - 165, 64, 12, 2); fs(ctx, '#e6dfd2');
    for (let i = 0; i < 6; i++) { ell(ctx, cx - 12 + (i % 2) * 22, B - 120 + i * 16, 6, 4, i * 0.5); fs(ctx, '#3f8f3a', 1.5); }
  } else if (id === 'vesuvio') {
    // the Bay of Naples, Vesuvius and an umbrella pine
    painting(ctx, w, h, '#8ccbec');
    ctx.fillStyle = '#fbe6b8'; ctx.fillRect(12, 12, 116, 26);
    ctx.fillStyle = 'rgba(255,255,255,0.9)'; for (const [x, y, r] of [[80, 26, 7], [90, 21, 8], [100, 24, 6]]) { circ(ctx, x, y, r); ctx.fill(); }
    ctx.fillStyle = '#8a6a5a'; ctx.beginPath(); ctx.moveTo(30, 74); ctx.lineTo(60, 42); ctx.lineTo(70, 48); ctx.lineTo(80, 36); ctx.lineTo(120, 74); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#6f5446'; ctx.beginPath(); ctx.moveTo(80, 36); ctx.lineTo(120, 74); ctx.lineTo(98, 74); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#2f7fb8'; ctx.fillRect(12, 72, 116, 22);
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; for (const x of [22, 52, 84, 108]) ctx.fillRect(x, 80, 10, 2);
    ctx.strokeStyle = '#5b351b'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(28, 94); ctx.quadraticCurveTo(25, 72, 32, 56); ctx.stroke();
    ctx.fillStyle = '#2f6b33'; ell(ctx, 33, 52, 19, 7); ctx.fill();
    ctx.restore();
  } else if (id === 'tomatocrate') {
    for (let i = 0; i < 7; i++) { ell(ctx, cx - 36 + i * 12, B - 46 - (i % 2) * 5, 6, 11, (i % 3 - 1) * 0.4); fs(ctx, '#d9432f', 2); }
    for (let i = 0; i < 6; i++) { ell(ctx, cx - 30 + i * 12, B - 41, 6, 11, (i % 3 - 1) * 0.5); fs(ctx, '#e8543a', 2); ctx.fillStyle = '#3f8f3a'; ctx.fillRect(cx - 32 + i * 12, B - 53, 4, 3); }
    rrPath(ctx, cx - 48, B - 38, 96, 38, 3); fs(ctx, '#c8964a');
    ctx.strokeStyle = '#8c6a3a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx - 46, B - 9); ctx.lineTo(cx + 46, B - 9); ctx.stroke();
    rrPath(ctx, cx - 38, B - 33, 76, 18, 3); fs(ctx, '#fbf3e0', 2);
    ctx.fillStyle = '#b8322a'; ctx.font = '800 10px "Baloo 2", sans-serif'; ctx.fillText('SAN MARZANO', cx, B - 24);
  } else if (id === 'majolica') {
    // a hand-painted Caltagirone plate with a Sicilian lemon
    circ(ctx, cx, h / 2, 42); fs(ctx, '#fbf6e8');
    circ(ctx, cx, h / 2, 34); ctx.lineWidth = 6; ctx.strokeStyle = '#2f6fb0'; ctx.stroke();
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; circ(ctx, cx + Math.cos(a) * 34, h / 2 + Math.sin(a) * 34, 3.2); ctx.fillStyle = i % 2 ? '#f2c23a' : '#2f8a6a'; ctx.fill(); }
    for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2 + 0.4; ell(ctx, cx + Math.cos(a) * 17, h / 2 + Math.sin(a) * 17, 9, 4, a); fs(ctx, '#3f9a4c', 1.5); }
    ell(ctx, cx, h / 2, 11, 9); fs(ctx, '#f6d43a', 2);
    circ(ctx, cx, h / 2, 42); ctx.lineWidth = 3; ctx.strokeStyle = OUT; ctx.stroke();
  } else if (id === 'cart') {
    // a carretto siciliano, painted in bright panels
    ctx.strokeStyle = '#7d4a26'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(cx + 50, B - 54); ctx.lineTo(w - 4, B - 34); ctx.stroke();
    rrPath(ctx, cx - 74, B - 106, 132, 54, 4); fs(ctx, '#f2c23a');
    const cols = ['#d9432f', '#2f5ea8', '#3f9a4c'];
    for (let i = 0; i < 3; i++) { rrPath(ctx, cx - 68 + i * 42, B - 100, 36, 30, 3); fs(ctx, cols[i], 2); ctx.fillStyle = '#fbf3e0'; circ(ctx, cx - 50 + i * 42, B - 85, 7); ctx.fill(); }
    ctx.fillStyle = '#d9432f'; ctx.fillRect(cx - 74, B - 64, 132, 8); ctx.strokeStyle = OUT; ctx.lineWidth = 3; ctx.strokeRect(cx - 74, B - 64, 132, 8);
    for (const wx of [cx - 42, cx + 26]) {
      circ(ctx, wx, B - 28, 26); fs(ctx, '#f2c23a');
      for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI; ctx.strokeStyle = k % 2 ? '#d9432f' : '#2f5ea8'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(wx - Math.cos(a) * 22, B - 28 - Math.sin(a) * 22); ctx.lineTo(wx + Math.cos(a) * 22, B - 28 + Math.sin(a) * 22); ctx.stroke(); }
      circ(ctx, wx, B - 28, 6); fs(ctx, '#d9432f', 2);
      circ(ctx, wx, B - 28, 26); ctx.lineWidth = 4; ctx.strokeStyle = OUT; ctx.stroke();
    }
  } else if (id === 'accordion') {
    ctx.strokeStyle = '#5b351b'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(20, 32); ctx.lineTo(cx, 7); ctx.lineTo(w - 20, 32); ctx.stroke();
    circ(ctx, cx, 7, 4); fs(ctx, '#e6b84a', 2);
    rrPath(ctx, 32, 30, w - 64, 56, 3); fs(ctx, '#2a2a2e', 3);
    ctx.strokeStyle = '#fbf3e0'; ctx.lineWidth = 1.5; for (let x = 38; x < w - 34; x += 6) { ctx.beginPath(); ctx.moveTo(x, 32); ctx.lineTo(x, 84); ctx.stroke(); }
    rrPath(ctx, 6, 26, 28, 64, 4); fs(ctx, '#b8322a');
    ctx.fillStyle = '#fbf3e0'; for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) { circ(ctx, 15 + j * 10, 38 + i * 13, 3); ctx.fill(); }
    rrPath(ctx, w - 34, 26, 28, 64, 4); fs(ctx, '#b8322a');
    ctx.fillStyle = '#fbfbf7'; for (let i = 0; i < 6; i++) ctx.fillRect(w - 30, 30 + i * 9.5, 15, 7);
    ctx.fillStyle = '#2a2a2e'; for (let i = 0; i < 5; i++) ctx.fillRect(w - 30, 35 + i * 9.5, 8, 4);
    ctx.fillStyle = '#e6b84a'; circ(ctx, 20, 84, 3); ctx.fill(); circ(ctx, w - 20, 84, 3); ctx.fill();
  } else if (id === 'trophy') {
    rrPath(ctx, cx - 30, B - 70, 60, 70, 4); fs(ctx, '#7d4a26');
    rrPath(ctx, cx - 34, B - 78, 68, 10, 3); fs(ctx, '#8c4f2a');
    rrPath(ctx, cx - 22, B - 54, 44, 18, 3); fs(ctx, '#e6b84a', 2);
    ctx.fillStyle = '#5b351b'; ctx.font = '800 9px "Baloo 2", sans-serif'; ctx.fillText('1° PREMIO', cx, B - 45);
    rrPath(ctx, cx - 15, B - 92, 30, 14, 3); fs(ctx, '#e6b84a', 3);
    rrPath(ctx, cx - 4, B - 106, 8, 16, 2); fs(ctx, '#f2c23a', 3);
    ctx.lineWidth = 5; ctx.strokeStyle = '#e6b84a';
    ctx.beginPath(); ctx.arc(cx - 24, B - 124, 9, Math.PI * 0.5, Math.PI * 1.5); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx + 24, B - 124, 9, Math.PI * 1.5, Math.PI * 0.5); ctx.stroke();
    ctx.save(); ctx.translate(cx + 7, B - 138); ctx.rotate(0.3); rrPath(ctx, -3, -14, 6, 22, 2); fs(ctx, '#f6d43a', 2); ell(ctx, 0, -20, 8, 10); fs(ctx, '#f6d43a', 2.5); ctx.restore();
    ctx.beginPath(); ctx.moveTo(cx - 26, B - 138); ctx.lineTo(cx + 26, B - 138); ctx.quadraticCurveTo(cx + 24, B - 106, cx, B - 104); ctx.quadraticCurveTo(cx - 24, B - 106, cx - 26, B - 138); ctx.closePath(); fs(ctx, '#f2c23a');
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fillRect(cx - 16, B - 132, 5, 18);
    ctx.strokeStyle = '#fffbe6'; ctx.lineWidth = 2; for (const [x, y] of [[cx - 30, B - 148], [cx + 30, B - 112]]) { ctx.beginPath(); ctx.moveTo(x - 5, y); ctx.lineTo(x + 5, y); ctx.moveTo(x, y - 5); ctx.lineTo(x, y + 5); ctx.stroke(); }
  } else if (id === 'fountain') {
    ctx.strokeStyle = 'rgba(127,196,224,0.95)'; ctx.lineWidth = 4;
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(cx, B - 118); ctx.quadraticCurveTo(cx + s * 44, B - 138, cx + s * 50, B - 30); ctx.stroke(); }
    ell(ctx, cx, B - 20, 68, 16); fs(ctx, '#d9d2c0');
    rrPath(ctx, cx - 66, B - 22, 132, 22, 8); fs(ctx, '#cfc6b2');
    ell(ctx, cx, B - 22, 58, 10); ctx.fillStyle = '#7fc4e0'; ctx.fill();
    rrPath(ctx, cx - 8, B - 82, 16, 60, 3); fs(ctx, '#e6dfd2');
    ell(ctx, cx, B - 84, 30, 8); fs(ctx, '#d9d2c0');
    ell(ctx, cx, B - 86, 24, 5); ctx.fillStyle = '#7fc4e0'; ctx.fill();
    ctx.strokeStyle = 'rgba(127,196,224,0.95)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(cx, B - 88); ctx.lineTo(cx, B - 116); ctx.stroke();
    rrPath(ctx, cx - 5, B - 112, 10, 18, 3); fs(ctx, '#e6dfd2', 2.5);
    circ(ctx, cx, B - 122, 8); fs(ctx, '#f2ede4', 2.5);
  }
}

function ovenCanvas() {
  const [c, ctx] = mkCanvas(420, 300, 1.5);
  const cx = 210;
  rrPath(ctx, 150, 0, 60, 60, 4); fs(ctx, '#9a5a3a');
  ctx.beginPath(); ctx.moveTo(10, 296); ctx.lineTo(10, 170); ctx.quadraticCurveTo(10, 40, cx, 40); ctx.quadraticCurveTo(410, 40, 410, 170); ctx.lineTo(410, 296); ctx.closePath(); fs(ctx, '#c8603a');
  ctx.save(); ctx.clip();
  ctx.strokeStyle = 'rgba(90,30,10,0.35)'; ctx.lineWidth = 2;
  for (let y = 60, r = 0; y < 300; y += 22, r++) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(420, y); ctx.stroke(); for (let x = (r % 2) * 22; x < 420; x += 44) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 22); ctx.stroke(); } }
  ctx.restore();
  // mouth (dark opening, filled by the game with fire glow)
  ctx.beginPath(); ctx.moveTo(110, 250); ctx.lineTo(110, 190); ctx.quadraticCurveTo(110, 130, cx, 130); ctx.quadraticCurveTo(310, 130, 310, 190); ctx.lineTo(310, 250); ctx.closePath(); fs(ctx, '#2a1610');
  ctx.beginPath(); ctx.moveTo(98, 254); ctx.lineTo(98, 190); ctx.quadraticCurveTo(98, 118, cx, 118); ctx.quadraticCurveTo(322, 118, 322, 190); ctx.lineTo(322, 254); ctx.lineWidth = 12; ctx.strokeStyle = '#e6b48b'; ctx.stroke();
  rrPath(ctx, 80, 250, 260, 22, 5); fs(ctx, '#d9c3a0');
  ctx.fillStyle = '#7d4a26'; ctx.font = '800 22px "Baloo 2", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('FORNO', cx, 80);
  return c;
}

// ----- Nonna's garden -----
function gardenCanvas() {
  const W = 1280, H = 628;   // drawn below the 92px header
  const [c, ctx] = mkCanvas(W, H, 1.5);
  const sky = ctx.createLinearGradient(0, 0, 0, 200);
  sky.addColorStop(0, '#8fd0ee'); sky.addColorStop(1, '#d9f0f4');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, 220);
  circ(ctx, 1150, 54, 34); ctx.fillStyle = '#ffe48f'; ctx.fill();
  for (const [x, y, s] of [[180, 50, 1], [520, 34, 0.8], [860, 70, 1.1]]) { ctx.fillStyle = 'rgba(255,255,255,0.9)'; for (const [dx, dy, r] of [[0, 0, 22], [24, -8, 26], [50, 2, 20], [24, 8, 22]]) { circ(ctx, x + dx * s, y + dy * s, r * s); ctx.fill(); } }
  // Tuscan hills, back to front
  const hill = (pts, col) => { ctx.beginPath(); ctx.moveTo(0, 240); pts.forEach(([x, y]) => ctx.lineTo(x, y)); ctx.lineTo(W, 240); ctx.closePath(); ctx.fillStyle = col; ctx.fill(); };
  hill([[0, 150], [160, 112], [360, 140], [560, 104], [780, 136], [1000, 98], [1180, 126], [W, 112]], '#9cc47a');
  hill([[0, 190], [220, 150], [420, 176], [640, 146], [900, 180], [1100, 150], [W, 170]], '#7fb05c');
  // rows of vines on the far hill
  ctx.strokeStyle = 'rgba(60,110,40,0.35)'; ctx.lineWidth = 2;
  for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(600 + i * 6, 160 + i * 6); ctx.lineTo(860 + i * 6, 172 + i * 4); ctx.stroke(); }
  // farmhouse
  rrPath(ctx, 238, 118, 92, 58, 2); fs(ctx, '#e8c48a', 3);
  ctx.beginPath(); ctx.moveTo(230, 120); ctx.lineTo(284, 92); ctx.lineTo(338, 120); ctx.closePath(); fs(ctx, '#c8603a', 3);
  for (const x of [252, 300]) { rrPath(ctx, x, 132, 16, 18, 2); fs(ctx, '#5b7fa3', 2); }
  rrPath(ctx, 276, 150, 16, 26, 2); fs(ctx, '#7d4a26', 2);
  // cypress trees
  const cypress = (x, y, h) => { ell(ctx, x, y - h / 2, h * 0.13, h / 2); fs(ctx, '#2f6b3a', 2.5); ctx.fillStyle = '#5b351b'; ctx.fillRect(x - 2, y - 2, 4, 8); };
  [[120, 186, 70], [150, 190, 54], [420, 178, 64], [1010, 166, 76], [1046, 172, 58], [720, 160, 48]].forEach(([x, y, h]) => cypress(x, y, h));
  // grass
  const g = ctx.createLinearGradient(0, 200, 0, H);
  g.addColorStop(0, '#8cc35a'); g.addColorStop(1, '#6aa846');
  ctx.fillStyle = g; ctx.fillRect(0, 206, W, H - 206);
  ctx.strokeStyle = 'rgba(40,90,30,0.25)'; ctx.lineWidth = 2;
  for (let i = 0; i < 140; i++) { const x = (i * 97) % W, y = 240 + (i * 53) % (H - 250); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 3, y - 8); ctx.moveTo(x + 4, y); ctx.lineTo(x + 6, y - 7); ctx.stroke(); }
  // wooden fence
  ctx.fillStyle = '#c99a62'; ctx.strokeStyle = OUT; ctx.lineWidth = 2.5;
  rrPath(ctx, 0, 196, W, 8, 2); fs(ctx, '#c99a62', 2.5); rrPath(ctx, 0, 216, W, 8, 2); fs(ctx, '#c99a62', 2.5);
  for (let x = 14; x < W; x += 46) { ctx.beginPath(); ctx.moveTo(x, 236); ctx.lineTo(x, 190); ctx.lineTo(x + 7, 182); ctx.lineTo(x + 14, 190); ctx.lineTo(x + 14, 236); ctx.closePath(); fs(ctx, '#e0b77e', 2.5); }
  // stone path
  ctx.fillStyle = 'rgba(0,0,0,0)';
  for (let i = 0; i < 12; i++) { ell(ctx, 40 + i * 86 + (i % 2) * 20, 418 + (i % 3) * 4, 30, 12); fs(ctx, '#d8cdb8', 2); }
  // flowers along the fence
  for (let i = 0; i < 30; i++) { const x = 20 + i * 43, y = 246 + (i % 3) * 5, col = ['#e8434f', '#f2c23a', '#ffffff', '#a98bd0'][i % 4]; circ(ctx, x, y, 4.5); fs(ctx, col, 1.5); }
  return c;
}
// a raised wooden bed: 200 x 120, the soil is the top 76px
function bedCanvas(locked) {
  const [c, ctx] = mkCanvas(204, 124, 1.5);
  if (locked) {
    ctx.setLineDash([8, 7]); rrPath(ctx, 4, 4, 196, 112, 16); ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(43,26,16,0.55)'; ctx.stroke(); ctx.setLineDash([]);
    return c;
  }
  ctx.fillStyle = 'rgba(0,0,0,0.18)'; rrPath(ctx, 6, 14, 196, 108, 12); ctx.fill();
  rrPath(ctx, 2, 2, 196, 112, 12); fs(ctx, '#a8683a', 3.5);
  rrPath(ctx, 12, 10, 176, 74, 8); fs(ctx, '#5b3a22', 2.5);
  ctx.fillStyle = '#4a2e1a';
  for (let i = 0; i < 26; i++) { circ(ctx, 20 + (i * 37) % 166, 18 + (i * 23) % 60, 2.5); ctx.fill(); }
  ctx.strokeStyle = 'rgba(43,26,16,0.5)'; ctx.lineWidth = 2;
  for (const y of [94, 104]) { ctx.beginPath(); ctx.moveTo(10, y); ctx.lineTo(190, y); ctx.stroke(); }
  for (const x of [10, 190]) { rrPath(ctx, x - 6, 86, 12, 26, 3); fs(ctx, '#8c5530', 2); }
  return c;
}
// three plants of one crop across a bed; stage 0 = just planted, 4 = ready to pick
function cropCanvas(id, stage) {
  const [c, ctx] = mkCanvas(190, 160, 1.5);
  const base = 150, g = [0.12, 0.3, 0.55, 0.8, 1][stage];
  const xs = [40, 95, 150];
  if (stage === 0) {
    for (const x of xs) { ell(ctx, x, base - 4, 22, 8); fs(ctx, '#6b4428', 2); ctx.fillStyle = '#f3e2bf'; for (const dx of [-8, 0, 8]) { circ(ctx, x + dx, base - 7, 2); ctx.fill(); } }
    return c;
  }
  const leaf = (x, y, rx, ry, rot, col, lw = 2) => { ell(ctx, x, y, rx, ry, rot); fs(ctx, col, lw); };
  for (const [k, x] of xs.entries()) {
    const s = g * (k === 1 ? 1.08 : 0.95);
    if (id === 'basil') {
      ctx.strokeStyle = '#3f7a2a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x, base); ctx.lineTo(x, base - 70 * s); ctx.stroke();
      const pairs = Math.max(1, Math.round(4 * s));
      for (let i = 0; i < pairs; i++) {
        const y = base - 14 * s - i * 18 * s, r = (18 - i * 2.5) * Math.max(0.55, s);
        leaf(x - r * 0.9, y, r, r * 0.62, -0.5, i % 2 ? '#4fae45' : '#3f9a3a');
        leaf(x + r * 0.9, y, r, r * 0.62, 0.5, i % 2 ? '#3f9a3a' : '#4fae45');
      }
      leaf(x, base - 72 * s, 11 * Math.max(0.6, s), 13 * Math.max(0.6, s), 0, '#5cbf4f');
    } else if (id === 'parsley') {
      const n = 3 + Math.round(4 * s);
      for (let i = 0; i < n; i++) {
        const a = -Math.PI / 2 + (i - (n - 1) / 2) * 0.32, len = (40 + (i % 3) * 10) * s + 10;
        const tx = x + Math.cos(a) * len, ty = base + Math.sin(a) * len;
        ctx.strokeStyle = '#4f8a2a'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x, base); ctx.quadraticCurveTo(x + (tx - x) * 0.3, ty + 10, tx, ty); ctx.stroke();
        for (const [dx, dy] of [[0, 0], [-6, 4], [6, 4], [0, -6]]) { circ(ctx, tx + dx * Math.max(0.6, s), ty + dy * Math.max(0.6, s), 6 * Math.max(0.6, s)); fs(ctx, '#2f8a3a', 1.8); }
      }
    } else if (id === 'tomato') {
      const h = 110 * s;
      if (stage >= 2) { rrPath(ctx, x + 12, base - h - 14, 6, h + 14, 2); fs(ctx, '#c99a62', 2); }
      ctx.strokeStyle = '#3f7a2a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x, base);
      for (let i = 1; i <= 4; i++) ctx.lineTo(x + (i % 2 ? 7 : -5), base - h * i / 4); ctx.stroke();
      for (let i = 0; i < 4; i++) { const y = base - h * (0.3 + i * 0.2), dir = i % 2 ? 1 : -1; leaf(x + dir * 15 * Math.max(0.6, s), y, 15 * Math.max(0.5, s), 8 * Math.max(0.5, s), dir * 0.4, '#4a9a3a'); }
      if (stage >= 3) {
        const col = stage === 4 ? '#e0392a' : '#9cc45a';
        for (const [dx, f] of [[-12, 0.42], [10, 0.62], [-6, 0.8]]) { circ(ctx, x + dx, base - h * f, stage === 4 ? 10 : 7); fs(ctx, col, 2.5); if (stage === 4) { ctx.fillStyle = 'rgba(255,255,255,0.6)'; circ(ctx, x + dx - 3, base - h * f - 3, 2.5); ctx.fill(); } }
      }
    } else if (id === 'garlic') {
      const n = 4;
      for (let i = 0; i < n; i++) {
        const lean = (i - 1.5) * 0.28, len = (60 + (i % 2) * 18) * s + 8;
        ctx.save(); ctx.translate(x, base - 6); ctx.rotate(lean);
        ell(ctx, 0, -len / 2, 4.5 * Math.max(0.7, s), len / 2); fs(ctx, i % 2 ? '#86b35a' : '#76a44e', 2);
        ctx.restore();
      }
      if (stage === 4) { ell(ctx, x, base - 4, 17, 14); fs(ctx, '#f6efe2', 2.5); ctx.strokeStyle = '#b48ab0'; ctx.lineWidth = 1.5; for (const dx of [-7, 0, 7]) { ctx.beginPath(); ctx.moveTo(x + dx, base - 16); ctx.quadraticCurveTo(x + dx * 1.4, base - 4, x + dx, base + 8); ctx.stroke(); } }
    }
  }
  return c;
}
// the fresh basket: one picked crop, 64 x 64
function produceCanvas(id) {
  const [c, ctx] = mkCanvas(64, 64, 2);
  if (id === 'basil') { for (const [x, y, r] of [[22, 30, -0.6], [42, 30, 0.6], [32, 18, 0], [32, 40, 0]]) { ell(ctx, x, y, 12, 8, r); fs(ctx, '#4fae45', 2.5); } ctx.strokeStyle = '#2f6a25'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(32, 46); ctx.lineTo(32, 60); ctx.stroke(); }
  else if (id === 'parsley') { ctx.strokeStyle = '#4f8a2a'; ctx.lineWidth = 3; for (const tx of [18, 32, 46]) { ctx.beginPath(); ctx.moveTo(32, 60); ctx.lineTo(tx, 24); ctx.stroke(); } for (const [x, y] of [[18, 22], [32, 16], [46, 22], [25, 12], [39, 12]]) { circ(ctx, x, y, 8); fs(ctx, '#2f8a3a', 2); } }
  else if (id === 'tomato') { circ(ctx, 32, 36, 22); fs(ctx, '#e0392a', 3); for (const a of [0, 1.3, 2.6, 3.9, 5.2]) { ell(ctx, 32 + Math.cos(a) * 7, 16 + Math.sin(a) * 4, 6, 3, a); fs(ctx, '#3f8f3a', 1.5); } ctx.fillStyle = 'rgba(255,255,255,0.55)'; ell(ctx, 24, 30, 5, 7, -0.5); ctx.fill(); }
  else if (id === 'garlic') { ctx.beginPath(); ctx.moveTo(32, 8); ctx.quadraticCurveTo(36, 18, 52, 34); ctx.quadraticCurveTo(58, 58, 32, 58); ctx.quadraticCurveTo(6, 58, 12, 34); ctx.quadraticCurveTo(28, 18, 32, 8); ctx.closePath(); fs(ctx, '#f6efe2', 3); ctx.strokeStyle = '#b48ab0'; ctx.lineWidth = 2; for (const dx of [-10, 0, 10]) { ctx.beginPath(); ctx.moveTo(32 + dx * 0.4, 22); ctx.quadraticCurveTo(32 + dx * 1.3, 40, 32 + dx, 56); ctx.stroke(); } }
  return c;
}
