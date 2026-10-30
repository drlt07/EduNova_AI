/* ===== Bộ dụng cụ cho các kịch bản 2, 3 của Phiêu lưu Nova =====
 * Chèn sau pro-pack.js, trước gói nội dung của từng kịch bản (tools/nova/build.mjs).
 * Gồm: thanh đo thời gian/tài nguyên thay cho sao (mỗi kịch bản tự cấu hình), đồ vật 3D dùng chung, khung code,
 * bảng gỡ lỗi chọn dòng + chọn cách sửa, vòng quyết định nhanh của trận cuối, hoạt cảnh nạp mảnh mã khóa.
 */
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const shuf = (a) => shuffleArr(a.slice());
const fbErr = (t) => `<span style="color:#be123c">${t}</span>`;

/* ---------- Thanh đo thay cho sao: đồng hồ (kịch bản 2), oxy (kịch bản 3)… ----------
 * cfg: budget[n] (đơn vị/phòng), rate (giây thật cho 1 đơn vị), pen (mất khi chọn sai), show(n, left, used) → HTML,
 *      penText(pen), failTitle, failText. Sao cuối phòng tính theo phần còn lại. */
const METER = { cfg: null, left: 0, failed: false };
function meterSetup(cfg) { METER.cfg = cfg; }
function hud() {
  const c = METER.cfg;
  if (c && stars < 3 && st === 'play') { METER.left -= c.pen * (3 - stars); stars = 3; toast(`<b style="font-weight:600">${c.penText(c.pen)}</b> vì chọn sai`, 1600); }
  $('keys').innerHTML = '<i class="ti ti-key" aria-hidden="true"></i> ' + keyN + '/5';
  if (!CH || !c) return;
  const n = CH.n, left = Math.max(0, METER.left);
  $('stars').innerHTML = c.show(n, left, c.budget[n] - left, left < c.budget[n] * .17);
}
function finish() {
  const r = Math.max(0, METER.left) / METER.cfg.budget[CH.n];
  stars = r >= .5 ? 3 : r >= .25 ? 2 : 1;
  SAVE.done[CH.n] = Math.max(SAVE.done[CH.n] || 0, stars); save();
}
const loadMeter = load;
load = function (n) { if (METER.cfg) METER.left = METER.cfg.budget[n]; METER.failed = false; return loadMeter(n); };
setInterval(() => {
  const c = METER.cfg;
  if (!c || !CH || st !== 'play' || inDlg || METER.failed || CH.won || document.hidden) return;
  if (!$('clr').classList.contains('hidden') || !$('map').classList.contains('hidden')) return;
  METER.left -= .25 / c.rate; hud();
  if (METER.left <= 0) {
    METER.failed = true; beep(220, .5, .06, 'sawtooth');
    mg(`<div style="text-align:center"><div class="hard-tag">${c.failTag}</div><div style="font-size:18px;font-weight:600;margin:4px 0">${c.failTitle}</div><div style="font-size:13px;color:#475569;margin:6px 0 14px;line-height:1.55">${c.failText}</div><button class="bt" id="re2">Chơi lại phòng</button></div>`);
    $('re2').onclick = () => { mgClose(); load(CH.n); };
  }
}, 250);

/* ---------- Đồ vật dùng chung ---------- */
function screenTex(lines, bg, fg) {
  return tex(512, 288, (g, w, h) => {
    g.fillStyle = bg || '#0b1525'; g.fillRect(0, 0, w, h);
    g.fillStyle = fg || '#67e8f9'; g.font = '600 30px "Consolas",monospace';
    lines.forEach((l, i) => g.fillText(l, 22, 52 + i * 42));
  });
}
function desk(x, z, w, opt) {
  opt = opt || {};
  const top = mat(opt.wood ? 0x6b4a32 : 0x2f3640, opt.wood ? 0 : .3, .5), leg = mat(0x1f242b, .7, .35);
  add(rbox(w, .07, .8, .02), top, x, .78, z);
  [[-w / 2 + .08, -.32], [w / 2 - .08, -.32], [-w / 2 + .08, .32], [w / 2 - .08, .32]].forEach(([dx, dz]) => add(rbox(.05, .76, .05, .015), leg, x + dx, .38, z + dz));
  const scr = [];
  (opt.pcs || [0]).forEach((dx) => {
    add(rbox(.62, .38, .04, .02), mat(0x0d1117, .5, .3), x + dx, 1.12, z - .22);
    const sm = new THREE.MeshBasicMaterial({ map: opt.tex || screenTex(['>_'], '#0b1525', '#38bdf8') }); keepMat(sm);
    add(new THREE.PlaneGeometry(.58, .33), sm, x + dx, 1.12, z - .195); scr.push(sm);
    add(rbox(.06, .14, .06, .02), leg, x + dx, .9, z - .24);
    add(rbox(.42, .02, .14, .01), mat(0x2a2f37, .2, .6), x + dx, .82, z + .05);
  });
  if (!opt.free) box(x - w / 2, x + w / 2, z - .4, z + .4);
  return scr;
}
function shelf(x, z, w, rot) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot || 0; W.add(g);
  const wood = mat(0x4a3424, 0, .65);
  add(rbox(w, 2.2, .45, .03), mat(0x2b1f16, 0, .8), 0, 1.1, -.02, g);
  const cols = [0x7f1d1d, 0x1e3a8a, 0x14532d, 0x78350f, 0x4c1d95, 0x334155, 0x9a3412, 0x155e75];
  [.32, .82, 1.32, 1.82].forEach((y) => {
    add(rbox(w - .06, .04, .42, .01), wood, 0, y - .06, .02, g);
    let cx = -w / 2 + .1;
    while (cx < w / 2 - .14) { const bw = .06 + Math.random() * .06, bh = .3 + Math.random() * .12; add(new THREE.BoxGeometry(bw, bh, .3), mat(cols[Math.floor(Math.random() * cols.length)], 0, .7), cx + bw / 2, y - .04 + bh / 2, .04, g); cx += bw + .01; }
  });
  const hw = rot ? .3 : w / 2, hd = rot ? w / 2 : .3;
  box(x - hw, x + hw, z - hd, z + hd);
}
function rack(x, z, leds) {
  add(rbox(.9, 2.2, 1, .04), mat(0x0b0f14, .6, .35), x, 1.1, z);
  const face = x < 0 ? .46 : -.46;
  for (let j = 0; j < 10; j++) { const m = new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0x22c55e, emissiveIntensity: 1.2 }); leds.push(add(new THREE.SphereGeometry(.025, 8, 6), m, x + face, .35 + j * .18, z - .3 + (j % 3) * .25)); }
  box(x - .45, x + .45, z - .5, z + .5);
}
function codeBlock(lines, mark) {
  return `<div class="term" style="white-space:normal;padding:8px 6px">${lines.map((l, i) => `<button class="cb" data-line="${i}" style="width:100%;margin:2px 0;border:1px solid transparent;cursor:${mark ? 'pointer' : 'default'};text-align:left;justify-content:flex-start;white-space:pre"><span style="opacity:.45;width:20px;display:inline-block">${i + 1}</span>${esc(l)}</button>`).join('')}</div>`;
}
const tag = (t) => `<div class="hard-tag">${t}</div>`;
const h2 = (t) => `<div style="font-size:17px;font-weight:600;margin-bottom:4px;line-height:1.4">${t}</div>`;
const desc = (t) => `<div style="font-size:13px;color:#475569;margin-bottom:10px;line-height:1.55">${t}</div>`;
const fbBox = '<div id="fb" style="font-size:13px;min-height:20px;margin-top:10px;line-height:1.55"></div>';
const runBtn = (id, t) => `<div style="text-align:right;margin-top:8px"><button class="bt" id="${id}">${t}</button></div>`;
const doneStep = (lines, then) => setTimeout(() => { mgClose(); jingle(); talk(lines, then || adv); }, 1500);
const toKey = (x, z) => () => { keyAt(x, 1.2, z); adv(); };

/* ---------- Bảng gỡ lỗi: bấm dòng sai rồi chọn cách sửa ---------- */
function codeFix(cfg, done) {
  let picked = null;
  const draw = (msg) => {
    mg(`${tag(cfg.tag)}${h2(cfg.title)}${desc(cfg.desc)}${codeBlock(cfg.code, 1)}
${picked === null ? '<div style="font-size:12.5px;color:#64748b;margin-top:8px">Bước 1: bấm vào dòng code bị sai.</div>' : `<div style="font-size:12.5px;color:#64748b;margin:8px 0 6px">Bước 2: chọn cách sửa dòng ${picked + 1}.</div><div style="display:grid;gap:6px">${cfg.fixOrder.map((o, j) => `<button class="op" data-f="${j}" style="font-family:var(--font-mono);font-size:12.5px">${esc(o.t)}</button>`).join('')}</div>`}
<div id="fb" style="font-size:13px;min-height:20px;margin-top:8px;line-height:1.55">${msg || ''}</div>`);
    document.querySelectorAll('#mgb [data-line]').forEach((b) => {
      if (+b.dataset.line === picked) b.style.borderColor = '#22d3ee';
      b.onclick = () => { const i = +b.dataset.line; if (i === cfg.bug) { picked = i; beep(700, .06, .03); draw(); } else { bad(); draw(fbErr(cfg.lineHint(i))); } };
    });
    document.querySelectorAll('#mgb [data-f]').forEach((b) => (b.onclick = () => {
      const o = cfg.fixOrder[+b.dataset.f];
      if (!o.ok) { bad(); draw(fbErr(o.e)); return; }
      good(); draw(o.e); done();
    }));
  };
  cfg.fixOrder = shuf(cfg.fixes); draw();
}

/* ---------- Vòng quyết định nhanh của trận cuối ----------
 * o: items [[câu, đáp án 1/0, giải thích]], yes/no (nhãn nút), enemy (tên + biểu tượng), secs, onWin. */
function rapidRound(o) {
  const C = shuf(o.items);
  let i = 0, hp = 100, hearts = 3, tl = o.secs, tmr = null;
  const draw = () => {
    const c = C[i];
    mg(`<div style="display:flex;gap:12px;align-items:center;margin-bottom:10px"><div style="flex:1"><div style="font-size:12px;color:#fb7185"><i class="ti ${o.icon}" aria-hidden="true"></i> ${o.enemy}</div><div class="hp"><div style="width:${hp}%;background:#e11d48"></div></div></div><div style="font-size:18px;color:#e11d48" aria-label="Năng lượng NOVA">${'<i class="ti ti-heart" aria-hidden="true"></i>'.repeat(hearts)}</div></div>
<div style="font-size:12px;color:#64748b">${o.label || 'Tình huống'} ${i + 1}/${C.length} · còn <b id="tl" style="font-weight:500">${tl}</b> giây</div><div style="font-size:16px;font-weight:500;margin:8px 0 14px;line-height:1.5;min-height:48px">${c[0]}</div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><button class="bt" id="do1" style="background:#0f766e">${o.yes}</button><button class="bt" id="do0" style="background:#9f1239">${o.no}</button></div><div id="fb" style="font-size:13px;min-height:38px;margin-top:10px;line-height:1.5"></div>`);
    $('do1').onclick = () => ans(1); $('do0').onclick = () => ans(0);
    clearInterval(tmr); tl = o.secs; tmr = setInterval(() => { tl--; if ($('tl')) $('tl').textContent = tl; if (tl <= 0) { clearInterval(tmr); ans(-1); } }, 1000);
  };
  const ans = (a) => {
    clearInterval(tmr); const c = C[i]; $('do1').disabled = $('do0').disabled = true;
    if (a === c[1]) { hp = Math.max(0, hp - 100 / C.length); good(); $('fb').innerHTML = '<span style="color:#6ee7b7">Đúng.</span> ' + c[2]; }
    else { hearts--; bad(); $('fb').innerHTML = fbErr((a < 0 ? 'Hết giờ. ' : 'Chưa đúng. ') + c[2]); }
    setTimeout(() => {
      i++;
      if (hearts <= 0) { mg(`<div style="text-align:center"><div style="font-size:17px;font-weight:600">NOVA cạn năng lượng</div><div style="font-size:13px;color:#475569;margin:6px 0 14px">Đọc kỹ từng tình huống rồi thử lại.</div><button class="bt" id="re">Thử lại</button></div>`); $('re').onclick = () => { i = 0; hp = 100; hearts = 3; draw(); }; return; }
      if (i >= C.length) { mgClose(); CH.won = 1; glBurst = 0; jingle(); setTimeout(() => beep(200, .6, .06, 'sawtooth'), 300); o.onWin(); return; }
      draw();
    }, 2600);
  };
  draw();
}

/* ---------- Trận cuối: nạp 5 mảnh mã khóa vào lõi (hoạt cảnh) và mảnh vỡ phản diện khi thắng ---------- */
function coreBuild(ch, label) {
  add(new THREE.CylinderGeometry(.8, 1, .5, 32), mat(0x334155, .6, .35), 0, .25, 1.2); box(-1, 1, .3, 2.1);
  spr(label, '#0e7490', .7).position.set(0, 1.3, 1.2);
  ch.crys = []; for (let i = 0; i < 5; i++) { const c = new THREE.Mesh(new THREE.OctahedronGeometry(.18, 0), kmat); c.scale.y = 1.5; c.visible = false; W.add(c); ch.crys.push(c); }
  GL.scale.setScalar(2.4);
}
function coreStart(ch) { ch.ins = 0; ch.busy = 1; ch.crys.forEach((c) => (c.visible = true)); beep(500, .4, .05, 'triangle'); }
function coreTick(ch, dt, onDone) {
  if (ch.ins !== undefined && ch.ins < 1) {
    ch.ins += dt * .45;
    ch.crys.forEach((c, i) => { const a = i / 5 * Math.PI * 2 + tm * 2, r = 1.6 * (1 - ch.ins); c.position.set(Math.cos(a) * r, 1 + ch.ins * .6, 1.2 + Math.sin(a) * r); c.rotation.y += dt * 3; });
    if (ch.ins >= 1) { ch.busy = 0; ch.crys.forEach((c) => (c.visible = false)); NOVA.scale.setScalar(1.8); jingle(); onDone(); }
  }
  if (ch.won && GL.visible) { glBurst += dt; GL.children.forEach((c) => { c.position.addScaledVector(c.userData.v, dt); c.userData.v.y -= 6 * dt; }); if (glBurst > 2) GL.visible = false; }
}
function certCard(title, body) {
  const d = new Date();
  $('clrb').innerHTML = `<div style="width:56px;height:56px;border-radius:50%;background:rgba(34,211,238,.15);color:#22d3ee;display:flex;align-items:center;justify-content:center;font-size:30px;margin:0 auto 8px"><i class="ti ti-certificate" aria-hidden="true"></i></div><div style="font-size:12px;color:#64748b;letter-spacing:1px">Chứng nhận</div><div style="font-size:19px;font-weight:600;margin:2px 0">${title}</div><div style="font-size:13px;color:#475569">trao cho</div><div style="font-size:22px;font-weight:600;color:#22d3ee;margin:4px 0">${esc(name)}</div><div style="font-size:13px;color:#b45309;margin:4px 0"><i class="ti ti-star" aria-hidden="true"></i> ${sumStars()} / 18 sao</div>
<div style="font-size:12.5px;color:#475569;line-height:1.6;margin:8px 0">${body}</div><div style="font-size:12px;color:#64748b">Ngày ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()} · EduNova</div><button class="bt" id="tomap2" style="margin-top:12px"><i class="ti ti-map" aria-hidden="true"></i> Về bản đồ</button>`;
  $('clr').classList.remove('hidden'); $('tomap2').onclick = () => { $('clr').classList.add('hidden'); showMap(); };
}
function setHard(sets) { Object.keys(HARD).forEach((k) => delete HARD[k]); Object.assign(HARD, sets); }
