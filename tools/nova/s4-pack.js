/* ===== Kịch bản 4 · "Đêm Lễ hội Ánh sáng" =====
 * Trung tâm Dữ liệu của Lễ hội Ánh sáng thành phố Nova: 5.000 vé ghi rải rác trong ba tệp bảng tính, bot phe vé lợi dụng
 * dữ liệu lộn xộn để giữ ghế trùng. Chèn sau kit-pack.js, chỉ khi đóng gói kịch bản 4 (tools/nova/build.mjs).
 * Nội dung: Tin học 11, Bài 12 – Hệ quản trị cơ sở dữ liệu và hệ cơ sở dữ liệu (Kết nối tri thức):
 * vì sao cần hệ QTCSDL, nhóm chức năng định nghĩa dữ liệu, cập nhật và truy xuất, bảo mật và an toàn (phân quyền,
 * kiểm soát giao dịch, sao lưu), giao diện lập trình ứng dụng (API), khái niệm hệ CSDL, các hệ QTCSDL phổ biến,
 * CSDL tập trung và CSDL phân tán. Tình huống, câu đố và lời thoại viết mới, không chép SGK.
 * Cơ chế riêng: thanh "Độ tin cậy dữ liệu" của từng phòng thay cho sao; chọn sai mất 5%; về 0% thì làm lại phòng.
 */
// Bảng màu chủ đạo theo phòng, tông đèn lễ hội (ui-pack.js đọc biến này).
const UI_ACC = ['#0ea5e9', '#8b5cf6', '#f59e0b', '#10b981', '#ec4899', '#f97316'];
WHO.NOVA = ['DORA · trợ lý dữ liệu', '#22d3ee', 'ti-robot', '#0e7490'];
WHO.GLITCH = ['BOT PHE VÉ', '#e11d48', 'ti-robot', '#9f1239'];
WHO.CO = ['Chị Vy · Trưởng ban tổ chức', '#f59e0b', 'ti-user', '#b45309'];

meterSetup({
  budget: [0, 100, 100, 100, 100, 100, 100], rate: 4, pen: 5, penText: (p) => `Mất ${p}% độ tin cậy`,
  show: (n, left, used, low) => `<span style="color:${low ? '#e11d48' : '#0f172a'};font-variant-numeric:tabular-nums"><i class="ti ti-database" aria-hidden="true"></i> ${Math.ceil(left)}%</span> <span style="display:inline-block;width:54px;height:6px;border-radius:3px;background:rgba(148,163,184,.3);vertical-align:middle;overflow:hidden"><span style="display:block;height:100%;width:${left}%;background:${low ? '#e11d48' : 'var(--acc)'}"></span></span>`,
  failTag: 'Dữ liệu không còn tin cậy', failTitle: 'Độ tin cậy dữ liệu của phòng đã về 0%',
  failText: 'Ban tổ chức tạm dừng bán vé để kiểm tra lại. Vào lại phòng này; đọc kỹ gợi ý trong đề trước khi chọn.',
});

/* ---------- Giao diện sáng: bỏ lớp kính tối của look-pack.js, bảng trắng, điểm nhấn theo màu chương ---------- */
(function brightUi() {
  document.querySelectorAll('style').forEach((st) => { if (st.textContent.includes('rgba(9,13,22,.93)')) st.remove(); });
  const st = document.createElement('style');
  st.textContent = `
.g{font-family:"Segoe UI",system-ui,-apple-system,Roboto,sans-serif;background:#e0f2fe}
.g .pn{background:rgba(255,255,255,.97)!important;color:#0f172a!important;border:1px solid #e2e8f0!important;border-top:4px solid var(--acc)!important;border-radius:18px!important;box-shadow:0 24px 60px rgba(30,41,59,.22)}
.g .dlg{border:1px solid #e2e8f0!important;border-left:4px solid var(--acc)!important;box-shadow:0 14px 36px rgba(30,41,59,.18)}
.g .chip{background:rgba(255,255,255,.92);color:#0f172a;border:1px solid rgba(15,23,42,.08);border-radius:12px;box-shadow:0 6px 18px rgba(15,23,42,.12)}
.g .chip:empty,.g #hudL:has(#cht:empty){display:none}
.g .toast{border:1px solid #e2e8f0;box-shadow:0 10px 26px rgba(15,23,42,.15)}
.g .op{background:#f8fafc;border-color:#e2e8f0}
.g .op:hover{background:#fff}
.g .cb{background:#f1f5f9;color:#1e293b}
.g .rm.open{border-color:var(--acc);background:color-mix(in srgb,var(--acc) 10%,white)}
.g .hard-tag{display:inline-block;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;border:1px solid;border-radius:999px;padding:2px 10px;margin-bottom:6px}
.g #title{background:radial-gradient(ellipse at 50% 35%,rgba(255,255,255,.55),rgba(124,58,237,.28))!important}`;
  document.head.appendChild(st);
})();
if (typeof PX !== 'undefined' && PX.grade) { PX.grade.uniforms.vig.value = .12; PX.bloom.strength = .3; PX.bloom.threshold = .95; }
/** Phối cảnh ban ngày (khai báo lại hàm của look-pack.js): trời sáng, ánh sáng mạnh, giữ màu tươi của vật liệu. */
function restyle() {
  const night = CH && CH.n === 6;
  S.background = gradTex(night ? 'fest6' : 'fest', night ? [[0, '#312e81'], [.55, '#7c3aed'], [1, '#f5d0fe']] : [[0, '#7dd3fc'], [.5, '#e0f2fe'], [1, '#fff7ed']]);
  S.fog.color.set(night ? 0x4c3a86 : 0xeef6ff); S.fog.near = 24; S.fog.far = 56;
  sun.color.set(0xfff1dc); sun.intensity = night ? .75 : 1;
  hemi.color.set(0xffffff); hemi.groundColor.set(night ? 0x7c3aed : 0xfde7f3); hemi.intensity = night ? .45 : .55;
  rim.color.set(0xf0abfc); rim.intensity = .45; R.toneMappingExposure = night ? .95 : .82;
}
function gradeMat(m) {
  if (!m || graded.has(m)) return; graded.add(m);
  if (m.isMeshStandardMaterial && !m.userData.keep) m.envMapIntensity = m.metalness > .5 ? .7 : .45;
}

/* ---------- Phòng lễ hội: sàn sáng, cờ dây, bóng bay, biển lễ hội, bục thử thách, kim tuyến ---------- */
const FEST = ['#f43f5e', '#f59e0b', '#facc15', '#22c55e', '#06b6d4', '#6366f1', '#ec4899'];
const hex = (c) => parseInt(c.slice(1), 16);
function festRoom(ch, o) {
  room(grid(o.floor[0], o.floor[1], 6), o.wall, 2.8);
  ch.fx = { flags: [], balloons: [], sparks: [], si: 0 };
  // hai dây cờ đuôi nheo vắt ngang phòng
  const tri = new THREE.Shape(); tri.moveTo(-.16, 0); tri.lineTo(.16, 0); tri.lineTo(0, -.34); tri.lineTo(-.16, 0);
  const triG = new THREE.ShapeGeometry(tri);
  [[-4.3, 2.35], [-2.7, 2.5]].forEach(([z, y]) => {
    add(new THREE.CylinderGeometry(.008, .008, 13.6, 4), mat(0x475569), 0, y + .02, z).rotation.z = Math.PI / 2;
    for (let i = 0; i < 19; i++) {
      const x = -6.3 + i * .7, sag = .18 * (1 - Math.pow((x / 6.6), 2));
      const f = new THREE.Mesh(triG, new THREE.MeshStandardMaterial({ color: hex(FEST[(i + (z > -3 ? 3 : 0)) % FEST.length]), side: THREE.DoubleSide, roughness: .6 }));
      f.position.set(x, y - sag, z); W.add(f); ch.fx.flags.push(f);
    }
  });
  // chùm bóng bay ở hai góc sau
  [[-6.1, -4.1], [6.1, -4.1], [-6.1, 3.9], [6.1, 3.9]].forEach(([x, z], k) => {
    for (let i = 0; i < 3; i++) {
      const b = add(new THREE.SphereGeometry(.24, 20, 16), new THREE.MeshStandardMaterial({ color: hex(FEST[(k * 3 + i) % FEST.length]), roughness: .25, metalness: .05 }), x + (i - 1) * .26, 1.9 + (i % 2) * .3, z + (i === 1 ? .15 : 0));
      b.scale.y = 1.18; b.userData.y = b.position.y; b.userData.p = k * 3 + i;
      add(new THREE.CylinderGeometry(.005, .005, 1.6, 4), mat(0xe2e8f0), b.position.x, b.position.y - 1, b.position.z);
      ch.fx.balloons.push(b);
    }
  });
  // biển lễ hội trên tường sau
  const bt = tex(1024, 256, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#7c3aed'); gr.addColorStop(.5, '#ec4899'); gr.addColorStop(1, '#f59e0b');
    g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(255,255,255,.18)'; for (let i = 0; i < 40; i++) { g.beginPath(); g.arc(Math.random() * w, Math.random() * h, 2 + Math.random() * 5, 0, 7); g.fill(); }
    g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; let fs = 92; do { g.font = `800 ${fs}px "Segoe UI",system-ui,sans-serif`; fs -= 4; } while (g.measureText(o.title).width > w - 80 && fs > 40); g.fillText(o.title, w / 2, h / 2 - 18);
    g.font = '600 40px "Segoe UI",system-ui,sans-serif'; g.fillText('LỄ HỘI ÁNH SÁNG · 20/12/2026', w / 2, h / 2 + 62);
  });
  const bm = keepMat(new THREE.MeshBasicMaterial({ map: bt })); add(new THREE.PlaneGeometry(4.4, 1.1), bm, -2, 1.45, -4.8);
  // biểu trưng giữa sàn
  const lg = tex(512, 512, (g, w) => {
    g.translate(w / 2, w / 2); for (let i = 0; i < 16; i++) { g.fillStyle = FEST[i % FEST.length] + 'bb'; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, 250, i * Math.PI / 8, (i + .5) * Math.PI / 8); g.fill(); }
    g.fillStyle = 'rgba(255,255,255,.9)'; g.beginPath(); g.arc(0, 0, 120, 0, 7); g.fill();
    g.strokeStyle = o.acc; g.lineWidth = 10; g.beginPath(); g.arc(0, 0, 120, 0, 7); g.stroke();
    g.fillStyle = o.acc; g.font = '800 56px "Segoe UI",system-ui,sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(o.badge, 0, 4);
  });
  const lm = keepMat(new THREE.MeshBasicMaterial({ map: lg, transparent: true })); const logo = add(new THREE.PlaneGeometry(2.4, 2.4), lm, 0, .012, .1); logo.rotation.x = -Math.PI / 2;
  // kim tuyến lấp lánh bay lơ lửng
  for (let i = 0; i < 26; i++) {
    const sp = add(new THREE.OctahedronGeometry(.05, 0), keepMat(new THREE.MeshBasicMaterial({ color: hex(FEST[i % FEST.length]) })), -6 + Math.random() * 12, .4 + Math.random() * 2, -4.2 + Math.random() * 8.4);
    sp.userData.v = .15 + Math.random() * .25; ch.fx.sparks.push(sp);
  }
  // pháo giấy khi hoàn thành một thử thách
  const N = 220, pos = new Float32Array(N * 3), col = new Float32Array(N * 3), c = new THREE.Color();
  for (let i = 0; i < N; i++) { pos[i * 3 + 1] = -50; c.set(FEST[i % FEST.length]); col.set([c.r, c.g, c.b], i * 3); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const pts = new THREE.Points(geo, keepMat(new THREE.PointsMaterial({ size: .11, vertexColors: true }))); pts.frustumCulled = false; W.add(pts);
  ch.fx.conf = { pts, vel: new Float32Array(N * 3), next: 0, N };
  const pl = new THREE.PointLight(hex(o.acc), .7, 14, 2); pl.position.set(0, 2.4, 0); W.add(pl); // ánh màu chương
}
function confetti(ch, x, y, z, n) {
  const C = ch.fx && ch.fx.conf; if (!C) return;
  const p = C.pts.geometry.attributes.position.array;
  for (let k = 0; k < n; k++) {
    const i = C.next; C.next = (C.next + 1) % C.N;
    p[i * 3] = x; p[i * 3 + 1] = y; p[i * 3 + 2] = z;
    const a = Math.random() * Math.PI * 2, s = 1.5 + Math.random() * 2.5;
    C.vel[i * 3] = Math.cos(a) * s; C.vel[i * 3 + 1] = 3 + Math.random() * 3.5; C.vel[i * 3 + 2] = Math.sin(a) * s;
  }
}
function festTick(ch, dt) {
  const F = ch.fx; if (!F) return; dt = Math.min(dt || .016, .05);
  F.flags.forEach((f, i) => { f.rotation.x = Math.sin(tm * 2.2 + i * .7) * .25; });
  F.balloons.forEach((b) => { b.position.y = b.userData.y + Math.sin(tm * 1.4 + b.userData.p) * .07; b.rotation.z = Math.sin(tm + b.userData.p) * .08; });
  F.sparks.forEach((sp) => { sp.position.y += sp.userData.v * dt; sp.rotation.y += dt * 2; if (sp.position.y > 2.6) sp.position.y = .2; });
  const C = F.conf, p = C.pts.geometry.attributes.position.array;
  for (let i = 0; i < C.N; i++) {
    if (p[i * 3 + 1] < -1) continue;
    C.vel[i * 3 + 1] -= 7 * dt; p[i * 3] += C.vel[i * 3] * dt; p[i * 3 + 1] += C.vel[i * 3 + 1] * dt; p[i * 3 + 2] += C.vel[i * 3 + 2] * dt;
    if (p[i * 3 + 1] < .02) { p[i * 3 + 1] = .02; C.vel[i * 3] *= .6; C.vel[i * 3 + 2] *= .6; C.vel[i * 3 + 1] = 0; if (Math.random() < .02) p[i * 3 + 1] = -50; }
  }
  C.pts.geometry.attributes.position.needsUpdate = true;
  // mỗi khi qua một thử thách: pháo giấy quanh người chơi
  if (si > F.si) confetti(ch, P.position.x, 2, P.position.z, 70);
  F.si = si;
  if (ch.won && !F.wonFx) { F.wonFx = 1; confetti(ch, 0, 2.4, 0, 200); }
}
/** Bục thử thách: chân lục giác trắng, viền phát sáng màu chương, màn hình nghiêng. */
function podium(x, z, lines, col) {
  const acc = uiAccentHex(), glow = keepMat(new THREE.MeshStandardMaterial({ color: acc, emissive: acc, emissiveIntensity: 1.1 }));
  add(new THREE.CylinderGeometry(.6, .7, .9, 6), mat(0x334155, .3, .35), x, .45, z);
  add(new THREE.CylinderGeometry(.74, .74, .05, 6), glow, x, .03, z);
  add(new THREE.CylinderGeometry(.63, .63, .04, 6), glow, x, .91, z);
  const fr = add(rbox(1.22, .74, .05, .02), mat(0x1e293b, .4, .4), x, 1.42, z - .02); fr.rotation.x = -.35;
  const sm = keepMat(new THREE.MeshBasicMaterial({ map: screenTex(lines, '#0b1525', col || '#67e8f9') }));
  const sc = add(new THREE.PlaneGeometry(1.12, .64), sm, x, 1.42, z + .01); sc.rotation.x = -.35;
  box(x - .7, x + .7, z - .65, z + .65);
}

/* ---------- Bảng thử thách dùng chung của kịch bản ---------- */
/** Chọn nhiều đáp án: cfg {tag, title, desc, items:[[nhãn, đúng 1/0, giải thích]], ok, done}. */
function s4Multi(cfg) {
  const items = shuf(cfg.items), on = new Set();
  const draw = (msg) => {
    mg(`${tag(cfg.tag)}${h2(cfg.title)}${desc(cfg.desc)}
<div style="display:grid;gap:6px">${items.map((it, i) => `<button class="op" data-m="${i}" aria-pressed="${on.has(i)}" style="${on.has(i) ? 'border-color:#22d3ee;background:rgba(34,211,238,.12)' : ''}"><i class="ti ${on.has(i) ? 'ti-check' : 'ti-box'}" aria-hidden="true"></i>${it[0]}</button>`).join('')}</div>
<div id="fb" style="font-size:13px;min-height:20px;margin-top:8px;line-height:1.55">${msg || ''}</div>${runBtn('mok', cfg.ok || 'Kiểm tra')}`);
    document.querySelectorAll('#mgb [data-m]').forEach((b) => (b.onclick = () => { const i = +b.dataset.m; on.has(i) ? on.delete(i) : on.add(i); beep(600, .04, .02); draw(); }));
    $('mok').onclick = () => {
      const wrong = items.findIndex((it, i) => !it[1] && on.has(i));
      if (wrong >= 0) { bad(); draw(fbErr(`Chưa đúng: "${items[wrong][0]}". ${items[wrong][2]}`)); return; }
      const miss = items.findIndex((it, i) => it[1] && !on.has(i));
      if (miss >= 0) { bad(); draw(fbErr(`Còn thiếu ít nhất một lựa chọn đúng. Gợi ý: ${items[miss][2]}`)); return; }
      good(); draw(cfg.win); cfg.done();
    };
  };
  draw();
}
/** Xếp mỗi mục vào một nhóm: cfg {tag, title, desc, buckets:[...], items:[[nội dung, chỉ số nhóm đúng, giải thích]], win, done}. */
function s4Classify(cfg) {
  const items = shuf(cfg.items), pick = items.map(() => -1);
  const draw = (msg) => {
    mg(`${tag(cfg.tag)}${h2(cfg.title)}${desc(cfg.desc)}
<div style="display:grid;gap:8px">${items.map((it, i) => `<div class="cb" style="flex-wrap:wrap;gap:8px;align-items:center;white-space:normal;font-family:'Inter',system-ui,sans-serif"><span style="flex:1 1 220px;line-height:1.45">${it[0]}</span><select data-c="${i}" aria-label="Chọn nhóm" style="flex:0 1 auto;max-width:100%">${['— chọn —'].concat(cfg.buckets).map((b, j) => `<option value="${j - 1}" ${pick[i] === j - 1 ? 'selected' : ''}>${b}</option>`).join('')}</select></div>`).join('')}</div>
<div id="fb" style="font-size:13px;min-height:20px;margin-top:8px;line-height:1.55">${msg || ''}</div>${runBtn('cok', cfg.ok || 'Kiểm tra')}`);
    document.querySelectorAll('#mgb [data-c]').forEach((s) => (s.onchange = () => { pick[+s.dataset.c] = +s.value; }));
    $('cok').onclick = () => {
      if (pick.some((p) => p < 0)) { draw(fbErr('Hãy chọn nhóm cho tất cả các dòng.')); return; }
      const k = items.findIndex((it, i) => pick[i] !== it[1]);
      if (k >= 0) { bad(); draw(fbErr(`Xem lại: "${items[k][0]}". ${items[k][2]}`)); return; }
      good(); draw(cfg.win); cfg.done();
    };
  };
  draw();
}
/** Sắp xếp các bước theo đúng thứ tự: cfg {tag, title, desc, steps:[...], why:[lý do cho từng vị trí], win, done}. */
function s4Order(cfg) {
  const pool = shuf(cfg.steps.map((s, i) => i)); let next = 0;
  const draw = (msg) => {
    mg(`${tag(cfg.tag)}${h2(cfg.title)}${desc(cfg.desc)}
<ol style="margin:0 0 8px 18px;padding:0;font-size:13.5px;line-height:1.6">${cfg.steps.slice(0, next).map((s) => `<li>${s}</li>`).join('') || '<li style="list-style:none;margin-left:-18px;color:#64748b">Chưa có bước nào.</li>'}</ol>
<div style="display:grid;gap:6px">${pool.filter((i) => i >= next).map((i) => `<button class="op" data-o="${i}">${cfg.steps[i]}</button>`).join('')}</div>
<div id="fb" style="font-size:13px;min-height:20px;margin-top:8px;line-height:1.55">${msg || ''}</div>`);
    document.querySelectorAll('#mgb [data-o]').forEach((b) => (b.onclick = () => {
      const i = +b.dataset.o;
      if (i !== next) { bad(); draw(fbErr(cfg.why[next])); return; }
      next++; beep(600 + next * 60, .05, .03);
      if (next === cfg.steps.length) { good(); draw(cfg.win); cfg.done(); return; }
      draw();
    }));
  };
  draw();
}

/* =================== Chương 1 · Phòng hồ sơ: vì sao cần hệ QTCSDL =================== */
// Ba bản ghi của cùng một khán giả trong ba tệp; mỗi tệp sai một ô so với hai tệp còn lại.
const REC = { f: ['Hạng vé', 'Số ghế', 'Số điện thoại'], files: ['Tệp Phòng Vé', 'Tệp Phòng Khán giả', 'Tệp Phòng Bảo vệ'],
  v: [['VIP', 'A21', '0912 345 678'], ['VIP', 'A12', '0912 345 678'], ['Thường', 'A12', '0912 345 687']] };
CHS[1] = {
  n: 1, t: 'Chương 1 · Phòng hồ sơ', room: 'Phòng hồ sơ', ic: 'ti-file-text', bg: 0x1c2638, gl: [3.8, 2.4, -3.6],
  sum: ['Lưu rời rạc nhiều tệp gây dư thừa và không nhất quán', 'Khó truy xuất dữ liệu theo tiêu chí khi tệp không liên kết', 'Hệ QTCSDL là phần mềm quản lý tập trung việc lưu trữ, cập nhật, truy xuất'],
  build() {
    festRoom(this, { floor: ['#e0f2fe', '#7dd3fc'], wall: 0xbae6fd, title: 'PHÒNG HỒ SƠ', badge: 'CH.1', acc: uiAccent(1) });
    podium(-3.2, -2.4, ['TepPhongVe.xlsx', 'TepKhanGia.xlsx', 'TepBaoVe.xlsx'], '#fde68a');
    podium(3.2, -1.6, ['TRÙNG LẶP: 1.240 dòng', 'LỆCH SỐ GHẾ: 87'], '#fda4af');
    podium(0, 1.4, ['Cần: một phần mềm', 'quản lý chung?'], '#c4b5fd');
    plant(-6.2, 4.2); plant(6.2, 4.2);
  },
  start: [['CO', 'Chào {n}, chị là Vy, trưởng ban tổ chức Lễ hội Ánh sáng. 5.000 vé đã bán, nhưng sáng nay hai khán giả cầm vé cùng một ghế.'],
    ['NOVA', 'Tôi là DORA, trợ lý dữ liệu. Tôi chỉ gợi ý, quyết định là của bạn. Dữ liệu vé đang nằm trong ba tệp bảng tính do ba phòng ghi riêng.'],
    ['GLITCH', 'Tệp lộn xộn là thiên đường của tôi. Ghế nào trùng, tôi giữ cả hai rồi bán lại giá gấp đôi.'],
    ['NOVA', 'Thanh tím ở góc phải là độ tin cậy dữ liệu của phòng; chọn sai sẽ mất 5%. Bắt đầu với ba tệp ở bục bên trái.']],
  steps: [
    { o: 'So sánh ba tệp ở bục bên trái', at: [-3.2, -1.3], t: 'Mở ba tệp', f() { s4Conflict(); } },
    { o: 'Gọi tên vấn đề ở bục bên phải', at: [3.2, -.5], t: 'Xem báo cáo trùng lặp', f() { s4Redundant(); } },
    { o: 'Liệt kê khó khăn ở bục giữa', at: [0, 2.5], t: 'Viết báo cáo cho ban tổ chức', f() { s4Problems(); } },
    { o: 'Nhặt mảnh mã khóa', key: 1 }],
  tick(dt) { festTick(this, dt); },
};
function s4Conflict() {
  const found = new Set(), odd = REC.v[0].map((_, c) => REC.v.findIndex((r, i) => REC.v.filter((q) => q[c] === r[c]).length === 1));
  const draw = (msg) => {
    mg(`${tag('Thử thách 1 · Ba tệp rời rạc')}${h2('Tìm 3 ô mâu thuẫn trong hồ sơ của khán giả Lê Minh An')}${desc('Cùng một người được ghi ở cả ba tệp. Ô nào khác với hai tệp còn lại là ô bị nhập sai. Bấm vào ô đó.')}
<div class="term" style="white-space:normal;min-height:0;padding:6px;overflow-x:auto"><table style="border-collapse:collapse;font-size:12.5px;width:100%;font-family:var(--font-sans,'Inter',system-ui,sans-serif)"><tr><th style="text-align:left;color:#94a3b8;font-weight:500;padding:4px">Trường</th>${REC.files.map((f) => `<th style="color:#94a3b8;font-weight:500;padding:4px">${f}</th>`).join('')}</tr>
${REC.f.map((f, c) => `<tr><td style="padding:4px;color:#cbd5e1">${f}</td>${REC.v.map((r, i) => `<td style="padding:3px"><button class="bt2" data-cell="${c}-${i}" style="width:100%;padding:5px;${found.has(c) && odd[c] === i ? 'background:#9f1239;color:#fff' : ''}">${r[c]}</button></td>`).join('')}</tr>`).join('')}</table></div>
<div style="font-size:12.5px;color:#64748b;margin-top:6px">Đã tìm: ${found.size}/3</div>
<div id="fb" style="font-size:13px;min-height:20px;margin-top:6px;line-height:1.55">${msg || ''}</div>`);
    document.querySelectorAll('#mgb [data-cell]').forEach((b) => (b.onclick = () => {
      const [c, i] = b.dataset.cell.split('-').map(Number);
      if (odd[c] !== i) { bad(); draw(fbErr(`Ô "${REC.v[i][c]}" trùng khớp với ít nhất một tệp khác. Tìm ô khác hẳn hai tệp còn lại.`)); return; }
      if (found.has(c)) return;
      found.add(c); beep(700, .06, .03);
      if (found.size === 3) { good(); draw('Đủ 3 ô mâu thuẫn. Mỗi phòng sửa tệp của mình mà không ai cập nhật tệp kia, nên cùng một khán giả có ba phiên bản khác nhau.'); doneStep([['NOVA', 'Bục bên phải đang thống kê có 1.240 dòng bị ghi lặp. Xem thử vấn đề đó tên là gì.']]); return; }
      draw(`Đúng: ${REC.f[c]} ở ${REC.files[i]} bị lệch.`);
    }));
  };
  draw();
}
function s4Redundant() {
  quiz('Thử thách 2 · Dữ liệu lặp lại', 'Cùng một khán giả được ghi ở cả ba tệp. Hiện tượng này gọi là gì và dẫn tới hậu quả nào?', 'Đây chính là nguồn gốc của các ô mâu thuẫn vừa tìm được.', [
    { i: 'ti-database', t: 'Dư thừa dữ liệu, dễ dẫn tới dữ liệu không nhất quán', ok: 1, e: 'Một thông tin lưu nhiều nơi thì phải sửa ở mọi nơi; quên một chỗ là các bản ghi mâu thuẫn nhau.' },
    { i: 'ti-database', t: 'Bảo mật dữ liệu, khiến người lạ đọc được tệp', e: 'Vấn đề ở đây là cùng một thông tin bị lưu lặp lại, không phải ai được đọc tệp.' },
    { i: 'ti-database', t: 'Dữ liệu phân tán, giúp truy cập nhanh hơn', e: 'CSDL phân tán là một kiến trúc có chủ đích, có cơ chế đồng bộ; ba tệp ghi tay rời rạc thì không.' },
    { i: 'ti-database', t: 'Sao lưu dữ liệu, giúp chống mất dữ liệu', e: 'Sao lưu là bản sao có kế hoạch để khôi phục; ba tệp do ba phòng tự ghi không phải bản sao lưu.' }],
    () => { jingle(); talk([['CO', 'Vậy chị cần báo cáo gửi ban giám đốc: dùng tệp rời rạc thì khó khăn ở đâu? Bục giữa đang mở báo cáo.']], adv); });
}
function s4Problems() {
  s4Multi({
    tag: 'Thử thách 3 · Báo cáo', title: 'Chọn TẤT CẢ các khó khăn khi quản lý vé bằng các tệp rời, không có hệ QTCSDL',
    desc: 'Có thể chọn nhiều ý. Bấm lại để bỏ chọn.', items: [
      ['Cùng một thông tin bị lưu ở nhiều nơi (dư thừa)', 1, 'cùng một khán giả có mặt ở ba tệp.'],
      ['Sửa ở tệp này nhưng quên sửa ở tệp khác nên dữ liệu mâu thuẫn', 1, 'nhớ lại ba ô lệch vừa tìm được.'],
      ['Khó lấy nhanh danh sách theo tiêu chí, ví dụ mọi khán giả VIP khu A', 1, 'phải mở và lọc thủ công từng tệp.'],
      ['Không kiểm soát được ai đã đọc, sửa hay xóa dữ liệu', 1, 'tệp bảng tính chép đi đâu cũng mở được.'],
      ['Máy tính không thể lưu được bảng dữ liệu', 0, 'máy tính vẫn lưu được tệp; vấn đề là cách tổ chức và quản lý.'],
      ['Bảng tính không chứa được chữ tiếng Việt', 0, 'bảng tính hiển thị tiếng Việt bình thường.']],
    win: 'Báo cáo đã gửi. Ban giám đốc đồng ý chuyển toàn bộ dữ liệu vé vào một CSDL dùng hệ quản trị CSDL.',
    done: () => doneStep([['NOVA', 'Hệ quản trị CSDL là phần mềm giúp tạo lập, cập nhật, truy xuất và bảo vệ CSDL. Mảnh mã khóa đầu tiên ở cạnh giá hồ sơ.']], toKey(-4.6, 2.6)),
  });
}

/* =================== Chương 2 · Phòng Bản thiết kế: định nghĩa dữ liệu =================== */
CHS[2] = {
  n: 2, t: 'Chương 2 · Phòng Bản thiết kế', room: 'Phòng Bản thiết kế', ic: 'ti-database', bg: 0x1c2638, gl: [-3.8, 2.4, -3.6],
  sum: ['Định nghĩa dữ liệu: khai báo CSDL, tạo và sửa cấu trúc bảng', 'Ràng buộc toàn vẹn giúp chặn dữ liệu sai ngay khi nhập', 'Một hệ QTCSDL có thể quản trị nhiều CSDL'],
  build() {
    festRoom(this, { floor: ['#f3e8ff', '#c084fc'], wall: 0xddd6fe, title: 'BẢN THIẾT KẾ CSDL', badge: 'CH.2', acc: uiAccent(2) });
    podium(-3.2, -2.4, ['CREATE ?', 'CSDL: ________'], '#86efac');
    podium(3.2, -1.6, ['Bảng Ve', 'MaVe | Tuoi | ...'], '#c4b5fd');
    podium(0, 1.4, ['NHẬP THỬ: 4 bản ghi', 'chấp nhận? từ chối?'], '#fde68a');
    plant(-6.2, 4.2); plant(6.2, 4.2);
  },
  start: [['NOVA', 'Muốn dùng hệ QTCSDL, trước hết phải mô tả dữ liệu sẽ được lưu như thế nào: tên CSDL, các bảng, các trường và luật cho từng trường.'],
    ['GLITCH', 'Cứ để trống luật đi. Tôi sẽ nhập vé tuổi âm, số điện thoại 9 số, mã vé trùng… cho vui.']],
  steps: [
    { o: 'Khởi tạo CSDL ở bục bên trái', at: [-3.2, -1.3], t: 'Bắt đầu thiết kế', f() { s4Create(); } },
    { o: 'Đặt ràng buộc cho bảng Vé ở bục bên phải', at: [3.2, -.5], t: 'Mở cấu trúc bảng', f() { s4Constraints(); } },
    { o: 'Nhập thử dữ liệu ở bục giữa', at: [0, 2.5], t: 'Chạy nhập thử', f() { s4Insert(); } },
    { o: 'Nhặt mảnh mã khóa', key: 1 }],
  tick(dt) { festTick(this, dt); },
};
function s4Create() {
  quiz('Thử thách 1 · Khai báo CSDL', 'Bắt đầu xây dựng CSDL cho lễ hội bằng hệ QTCSDL, việc nào cần làm TRƯỚC?', 'Chưa có cấu trúc thì dữ liệu chưa có chỗ để lưu.', [
    { i: 'ti-database', t: 'Khai báo CSDL tên LeHoiNova rồi tạo cấu trúc các bảng (Khán giả, Vé, Ghế)', ok: 1, e: 'Đây là nhóm chức năng định nghĩa dữ liệu: khai báo CSDL với tên xác định, tạo lập kiến trúc bên trong.' },
    { i: 'ti-database', t: 'Nhập ngay 5.000 dòng vé từ ba tệp cũ', e: 'Chưa định nghĩa bảng và trường thì hệ QTCSDL chưa biết lưu dữ liệu vào đâu.' },
    { i: 'ti-database', t: 'Phân quyền cho nhân viên bán vé', e: 'Phân quyền thuộc nhóm bảo mật, làm sau khi đã có CSDL.' },
    { i: 'ti-database', t: 'Viết ứng dụng điện thoại để khán giả mua vé', e: 'Ứng dụng cần một CSDL đã được định nghĩa để kết nối tới.' }],
    () => { jingle(); talk([['NOVA', 'CSDL LeHoiNova đã được khai báo. Bảng Vé đã có các trường; giờ đặt luật cho từng trường ở bục bên phải.']], adv); });
}
function s4Constraints() {
  s4Classify({
    tag: 'Thử thách 2 · Ràng buộc toàn vẹn', title: 'Gắn mỗi trường của bảng Vé với ràng buộc phù hợp',
    desc: 'Ràng buộc là luật hệ QTCSDL tự kiểm tra mỗi khi có dữ liệu được nhập hoặc sửa.',
    buckets: ['Duy nhất, không được bỏ trống', 'Số nguyên từ 0 đến 120', 'Gồm đúng 10 chữ số', 'Không muộn hơn ngày 20/12/2026'],
    items: [['MaVe (mã vé)', 0, 'Mã vé dùng để phân biệt từng vé nên không được trùng và không được trống.'],
      ['Tuoi (tuổi khán giả)', 1, 'Tuổi là số nguyên, không âm và không vô lý.'],
      ['SoDienThoai', 2, 'Số điện thoại di động ở Việt Nam có 10 chữ số.'],
      ['NgayMua (ngày mua vé)', 3, 'Vé chỉ được mua trước hoặc trong ngày diễn ra lễ hội.']],
    ok: 'Lưu cấu trúc bảng', win: 'Đã lưu. Từ giờ hệ QTCSDL tự chặn dữ liệu vi phạm các luật này.',
    done: () => doneStep([['GLITCH', 'Để xem luật của các người chặn được gì.'], ['NOVA', 'Bục giữa đang có 4 bản ghi chờ nhập. Dự đoán xem bản nào bị từ chối.']]),
  });
}
function s4Insert() {
  s4Multi({
    tag: 'Thử thách 3 · Nhập thử', title: 'Bản ghi nào sẽ bị hệ QTCSDL TỪ CHỐI?',
    desc: 'Trong bảng đã có vé V0412. Chọn tất cả bản ghi vi phạm ràng buộc vừa đặt.', ok: 'Chạy nhập thử', items: [
      ['V0412 · 17 tuổi · 0981 234 567 · mua 02/12', 1, 'mã V0412 đã tồn tại, vi phạm ràng buộc duy nhất.'],
      ['V0890 · -3 tuổi · 0903 111 222 · mua 05/12', 1, 'tuổi -3 nằm ngoài khoảng 0 đến 120.'],
      ['V0891 · 25 tuổi · 090 311 122 · mua 06/12', 1, 'số điện thoại này chỉ có 9 chữ số.'],
      ['V0892 · 16 tuổi · 0977 654 321 · mua 10/12', 0, 'bản ghi này thỏa mọi ràng buộc nên được nhập bình thường.']],
    win: '3 bản ghi bị từ chối kèm lý do, 1 bản ghi hợp lệ được lưu. Dữ liệu sai bị chặn ngay từ cửa vào.',
    done: () => doneStep([['NOVA', 'Đó là sức mạnh của ràng buộc toàn vẹn. Mảnh mã khóa thứ hai ở cạnh bàn bản vẽ.']], toKey(4.4, 1.4)),
  });
}

/* =================== Chương 3 · Quầy vé: cập nhật và truy xuất =================== */
const GUESTS = [['Nguyễn Hà', 'VIP', 'A', 1], ['Trần Bảo', 'Thường', 'B', 1], ['Lê Minh An', 'VIP', 'A', 1], ['Phạm Thu', 'VIP', 'B', 1],
  ['Đỗ Khang', 'VIP', 'A', 0], ['Vũ Lan', 'Thường', 'A', 1], ['Hoàng Nam', 'VIP', 'A', 1], ['Bùi Mai', 'Thường', 'B', 0]];
CHS[3] = {
  n: 3, t: 'Chương 3 · Quầy vé', room: 'Quầy vé', ic: 'ti-receipt', bg: 0x1c2638, gl: [3.6, 2.4, -3.6],
  sum: ['Cập nhật dữ liệu gồm thêm, sửa, xóa bản ghi', 'Truy xuất là lấy ra dữ liệu thỏa các tiêu chí', 'Truy xuất chỉ đọc, không làm thay đổi dữ liệu'],
  build() {
    festRoom(this, { floor: ['#fef3c7', '#fbbf24'], wall: 0xfde68a, title: 'QUẦY VÉ', badge: 'CH.3', acc: uiAccent(3) });
    add(rbox(5.2, 1, .7, .05), mat(0xffffff, .05, .4), 0, .5, -1.9); add(rbox(5.22, .12, .72, .03), keepMat(new THREE.MeshStandardMaterial({ color: uiAccentHex(3), emissive: uiAccentHex(3), emissiveIntensity: .9 })), 0, .82, -1.9); box(-2.6, 2.6, -2.25, -1.55);
    podium(-3.6, -3.6, ['YÊU CẦU CỦA KHÁCH', 'thêm | sửa | xóa ?'], '#fde68a');
    podium(3.6, -3.6, ['TRUY XUẤT', 'Hạng? Khu? Đã trả?'], '#86efac');
    podium(0, 2, ['SELECT …', 'dữ liệu có đổi?'], '#93c5fd');
    plant(-6.2, 4.2); plant(6.2, 4.2);
  },
  start: [['CO', 'Quầy vé mở cửa rồi. Khách xếp hàng đổi thông tin, mua thêm và hủy vé.'], ['NOVA', 'Mọi thay đổi giờ đi qua hệ QTCSDL. Bắt đầu với các yêu cầu ở bục bên trái.']],
  steps: [
    { o: 'Xử lý yêu cầu của khách ở bục bên trái', at: [-3.6, -2.5], t: 'Mở hàng chờ', f() { s4Update(); } },
    { o: 'Lấy danh sách khán giả ở bục bên phải', at: [3.6, -2.5], t: 'Mở công cụ truy xuất', f() { s4Query(); } },
    { o: 'Trả lời câu hỏi của chị Vy ở bục giữa', at: [0, 3.1], t: 'Đọc câu hỏi', f() { s4ReadOnly(); } },
    { o: 'Nhặt mảnh mã khóa', key: 1 }],
  tick(dt) { festTick(this, dt); },
};
function s4Update() {
  s4Classify({
    tag: 'Thử thách 1 · Cập nhật dữ liệu', title: 'Mỗi yêu cầu cần thao tác nào trên CSDL?',
    desc: 'Cập nhật dữ liệu gồm ba thao tác: thêm, sửa và xóa bản ghi.', buckets: ['Thêm bản ghi', 'Sửa bản ghi', 'Xóa bản ghi'],
    items: [['Khách mới Trần Thu mua một vé hạng Thường', 0, 'Khách chưa có trong CSDL nên cần thêm một bản ghi mới.'],
      ['Anh Minh An đổi sang số điện thoại mới', 1, 'Bản ghi đã có, chỉ cần thay giá trị một trường.'],
      ['Vé V0098 đã hoàn tiền và hủy', 2, 'Vé không còn hiệu lực nên xóa bản ghi khỏi bảng Vé.'],
      ['Ghế A12 bị nhập nhầm thành A21', 1, 'Sửa giá trị sai trong bản ghi đã có.']],
    win: 'Hàng chờ đã xử lý xong. Mỗi thay đổi chỉ cần làm một lần, ở một nơi duy nhất.',
    done: () => doneStep([['CO', 'Bộ phận lễ tân cần danh sách khách VIP khu A đã thanh toán để đón tiếp. Bục bên phải.']]),
  });
}
function s4Query() {
  const F = [['Hạng vé', ['Tất cả', 'VIP', 'Thường']], ['Khu', ['Tất cả', 'A', 'B']], ['Thanh toán', ['Tất cả', 'Đã trả', 'Chưa trả']]], sel = [0, 0, 0];
  const match = (g) => (sel[0] === 0 || g[1] === F[0][1][sel[0]]) && (sel[1] === 0 || g[2] === F[1][1][sel[1]]) && (sel[2] === 0 || g[3] === (sel[2] === 1 ? 1 : 0));
  const draw = (msg) => {
    const rows = GUESTS.filter(match);
    mg(`${tag('Thử thách 2 · Truy xuất dữ liệu')}${h2('Lấy danh sách khán giả VIP ở khu A đã thanh toán')}${desc('Chọn tiêu chí; kết quả bên dưới tự cập nhật. Khi đúng yêu cầu, bấm Gửi cho lễ tân.')}
<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:6px">${F.map(([n, o], i) => `<label class="cb" style="gap:6px;font-family:'Inter',system-ui,sans-serif">${n}<select data-q="${i}" style="flex:1">${o.map((v, j) => `<option value="${j}" ${sel[i] === j ? 'selected' : ''}>${v}</option>`).join('')}</select></label>`).join('')}</div>
<div class="term" style="white-space:normal;min-height:0;padding:6px;margin-top:8px;font-family:var(--font-sans,'Inter',system-ui,sans-serif)"><div style="color:#94a3b8;font-size:12px;margin-bottom:4px">${rows.length} kết quả</div>${rows.map((g) => `<div style="font-size:12.5px;padding:2px 0">${g[0]} · ${g[1]} · khu ${g[2]} · ${g[3] ? 'đã trả' : 'chưa trả'}</div>`).join('')}</div>
<div id="fb" style="font-size:13px;min-height:20px;margin-top:8px;line-height:1.55">${msg || ''}</div>${runBtn('qok', 'Gửi cho lễ tân')}`);
    document.querySelectorAll('#mgb [data-q]').forEach((s) => (s.onchange = () => { sel[+s.dataset.q] = +s.value; draw(); }));
    $('qok').onclick = () => {
      const want = [1, 1, 1], k = want.findIndex((w, i) => sel[i] !== w);
      if (k >= 0) { bad(); draw(fbErr(`Tiêu chí "${F[k][0]}" chưa đúng yêu cầu: cần ${F[k][1][want[k]]}.`)); return; }
      good(); draw('3 khách: Nguyễn Hà, Lê Minh An, Hoàng Nam. Truy xuất theo nhiều tiêu chí chỉ mất một giây thay vì cả buổi lọc ba tệp.');
      doneStep([['CO', 'Nhanh thật. Nhưng chị lo: lấy danh sách như vậy có làm thay đổi dữ liệu vé không? Câu hỏi ở bục giữa.']]);
    };
  };
  draw();
}
function s4ReadOnly() {
  quiz('Thử thách 3 · Truy xuất và cập nhật', 'Vừa lấy danh sách khách VIP khu A. Dữ liệu trong CSDL thay đổi thế nào?', 'Nghĩ xem thao tác vừa rồi là đọc hay ghi.', [
    { i: 'ti-search', t: 'Không thay đổi: truy xuất chỉ đọc dữ liệu thỏa tiêu chí', ok: 1, e: 'Truy xuất (truy vấn chọn) chỉ lấy dữ liệu ra; chỉ các thao tác cập nhật (thêm, sửa, xóa) mới làm dữ liệu thay đổi.' },
    { i: 'ti-search', t: 'Các khách không thuộc khu A bị xóa khỏi CSDL', e: 'Tiêu chí lọc chỉ chọn dòng để hiển thị; các dòng khác vẫn nằm nguyên trong CSDL.' },
    { i: 'ti-search', t: 'Hạng vé của mọi khách bị đổi thành VIP', e: 'Đổi giá trị là thao tác sửa; truy xuất không ghi gì vào CSDL.' },
    { i: 'ti-search', t: 'CSDL tạo thêm một bản sao của bảng Vé', e: 'Kết quả truy xuất là dữ liệu hiển thị cho người dùng, không tự thêm bảng vào CSDL.' }],
    () => { jingle(); talk([['NOVA', 'Chính xác. Mảnh mã khóa thứ ba ở cạnh quầy vé.']], toKey(3.4, -1)); });
}

/* =================== Chương 4 · Phòng An ninh: bảo mật và an toàn CSDL =================== */
CHS[4] = {
  n: 4, t: 'Chương 4 · Phòng An ninh', room: 'Phòng An ninh', ic: 'ti-shield', bg: 0x1c2638, gl: [-3.6, 2.4, -3.6],
  sum: ['Phân quyền: mỗi người chỉ được làm đúng việc của mình', 'Kiểm soát giao dịch đồng thời giữ dữ liệu nhất quán', 'Sao lưu dự phòng để khôi phục khi có sự cố'],
  build() {
    festRoom(this, { floor: ['#dcfce7', '#4ade80'], wall: 0xbbf7d0, title: 'PHÒNG AN NINH', badge: 'CH.4', acc: uiAccent(4) });
    this.leds = []; [-2.4, 2.4].forEach((x) => rack(x, -4.3, this.leds));
    podium(-4.4, -1.4, ['PHÂN QUYỀN', 'ai được làm gì?'], '#86efac');
    podium(4.4, -1.4, ['10:00:00', 'A12 ← Hà | A12 ← Tùng'], '#fda4af');
    podium(0, 1.6, ['CẢNH BÁO BÃO', 'nguy cơ mất điện'], '#fde68a');
    plant(-6.2, 4.2); plant(6.2, 4.2);
  },
  start: [['GLITCH', 'Bảng vé giờ gọn gàng quá. Nhưng ai cũng mở được nó, kể cả tôi.'], ['NOVA', 'Không phải ai cũng được đọc và sửa mọi dữ liệu. Phòng an ninh có ba việc: phân quyền, kiểm soát giao dịch và sao lưu.']],
  steps: [
    { o: 'Phân quyền truy cập ở bục bên trái', at: [-4.4, -.3], t: 'Mở bảng phân quyền', f() { s4Roles(); } },
    { o: 'Xử lý hai giao dịch trùng ở bục bên phải', at: [4.4, -.3], t: 'Xem nhật ký giao dịch', f() { s4Concurrent(); } },
    { o: 'Chuẩn bị cho bão ở bục giữa', at: [0, 2.7], t: 'Mở kế hoạch dự phòng', f() { s4Backup(); } },
    { o: 'Nhặt mảnh mã khóa', key: 1 }],
  tick(dt) { festTick(this, dt); this.leds.forEach((l, i) => { l.material.emissiveIntensity = Math.sin(tm * 4 + i) > -.3 ? 1.3 : .15; }); },
};
function s4Roles() {
  s4Classify({
    tag: 'Thử thách 1 · Phân quyền', title: 'Mỗi người dùng nên có quyền nào trên CSDL vé?',
    desc: 'Nguyên tắc: chỉ cấp đúng quyền đủ để làm việc, không hơn.', buckets: ['Không truy cập trực tiếp CSDL', 'Chỉ xem danh sách vé', 'Xem, thêm và sửa vé', 'Toàn quyền, kể cả xóa và sao lưu'],
    items: [['Bảo vệ cổng soát vé', 1, 'Bảo vệ chỉ cần kiểm tra vé hợp lệ, không cần sửa dữ liệu.'],
      ['Nhân viên quầy vé', 2, 'Nhân viên bán và đổi vé nên cần thêm, sửa; không nên được xóa hàng loạt.'],
      ['Quản trị hệ thống', 3, 'Người quản trị chịu trách nhiệm cấu trúc, sao lưu và khôi phục nên có toàn quyền.'],
      ['Khán giả mua vé trên điện thoại', 0, 'Khán giả chỉ dùng ứng dụng; ứng dụng mới là nơi gửi yêu cầu tới CSDL.']],
    win: 'Đã phân quyền. BOT PHE VÉ bị chặn vì không có tài khoản nào được cấp quyền.',
    done: () => doneStep([['GLITCH', 'Không vào được… Vậy thì tôi mua cùng lúc với người khác.'], ['NOVA', 'Bục bên phải báo hai nhân viên vừa bán cùng một ghế trong cùng một giây.']]),
  });
}
function s4Concurrent() {
  quiz('Thử thách 2 · Giao dịch đồng thời', 'Lúc 10:00:00, nhân viên Hà và nhân viên Tùng cùng bán ghế A12 cho hai khách khác nhau. Hệ QTCSDL nên làm gì?', 'Dữ liệu phải nhất quán: một ghế chỉ thuộc một vé.', [
    { i: 'ti-lock', t: 'Kiểm soát giao dịch: xử lý lần lượt, giao dịch sau thấy A12 đã bán và bị từ chối', ok: 1, e: 'Hệ QTCSDL khóa bản ghi khi một giao dịch đang ghi, nên hai giao dịch không thể cùng giành một ghế.' },
    { i: 'ti-lock', t: 'Cho cả hai thành công, đến cổng thì bảo vệ xử lý', e: 'Đây chính là lỗi trùng ghế ban đầu; CSDL sẽ mất tính nhất quán.' },
    { i: 'ti-lock', t: 'Hủy cả hai giao dịch cho công bằng', e: 'Không cần hủy cả hai; giao dịch đến trước hoàn toàn hợp lệ.' },
    { i: 'ti-lock', t: 'Ưu tiên người bấm sau vì thông tin mới hơn', e: 'Ghi đè giao dịch đã hoàn tất làm khách đầu tiên mất vé mà không biết.' }],
    () => { jingle(); talk([['NOVA', 'Ghế A12 thuộc khách của chị Hà; khách của anh Tùng được mời chọn ghế khác.'], ['CO', 'Đài khí tượng vừa báo bão đêm nay, có thể mất điện. Bục giữa đang mở kế hoạch dự phòng.']], adv); });
}
function s4Backup() {
  quiz('Thử thách 3 · Sao lưu', 'Nếu ổ cứng máy chủ hỏng vì mất điện đột ngột, việc nào giúp khôi phục toàn bộ dữ liệu vé?', 'Cần một bản sao nằm ở nơi khác.', [
    { i: 'ti-server-2', t: 'Sao lưu dự phòng CSDL định kỳ ra thiết bị hoặc địa điểm khác', ok: 1, e: 'Hệ QTCSDL hỗ trợ sao lưu (backup) và khôi phục (restore); bản sao ở nơi khác không bị hỏng cùng máy chủ.' },
    { i: 'ti-server-2', t: 'Đặt mật khẩu thật mạnh cho tài khoản quản trị', e: 'Mật khẩu chống truy cập trái phép, không giúp khôi phục dữ liệu khi ổ cứng hỏng.' },
    { i: 'ti-server-2', t: 'Thêm ràng buộc cho tất cả các trường', e: 'Ràng buộc chặn dữ liệu sai khi nhập, không chống mất dữ liệu.' },
    { i: 'ti-server-2', t: 'In toàn bộ bảng vé ra giấy', e: 'Bản giấy không khôi phục lại được CSDL để bán vé tiếp.' }],
    () => {
      jingle();
      talk([['GLITCH', 'Mất điện rồi! Dữ liệu của các người đi đời…'], ['NOVA', 'Đã khôi phục từ bản sao lưu lúc 21:00. Không mất vé nào.'], ['NOVA', 'Mảnh mã khóa thứ tư ở cạnh tủ máy chủ.']], toKey(0, -3.2));
    });
}

/* =================== Chương 5 · Cổng Ứng dụng: API, hệ CSDL, các hệ QTCSDL =================== */
CHS[5] = {
  n: 5, t: 'Chương 5 · Cổng Ứng dụng', room: 'Cổng Ứng dụng', ic: 'ti-world-www', bg: 0x1c2638, gl: [3.6, 2.4, -3.6],
  sum: ['Ứng dụng gửi yêu cầu tới hệ QTCSDL qua API', 'Hệ CSDL gồm CSDL, hệ QTCSDL và các phần mềm ứng dụng', 'Chọn hệ QTCSDL theo quy mô: MySQL, PostgreSQL… hay SQLite'],
  build() {
    festRoom(this, { floor: ['#fce7f3', '#f472b6'], wall: 0xfbcfe8, title: 'CỔNG ỨNG DỤNG', badge: 'CH.5', acc: uiAccent(5) });
    podium(-3.4, -1.6, ['App Vé Nova', '→ API → ?'], '#f9a8d4');
    podium(3.4, -1.6, ['HỆ CSDL =', '? + ? + ?'], '#c4b5fd');
    podium(0, 1.5, ['MySQL  PostgreSQL', 'SQLite  Access'], '#93c5fd');
        plant(-6.2, 4.2); plant(6.2, 4.2);
  },
  start: [['CO', 'Ứng dụng Vé Nova trên điện thoại sắp mở bán đợt cuối. Khán giả không biết gì về bảng hay trường cả.'], ['NOVA', 'Đúng vậy: người dùng thao tác trên ứng dụng, còn ứng dụng nói chuyện với hệ QTCSDL qua giao diện lập trình ứng dụng, gọi là API.']],
  steps: [
    { o: 'Sắp xếp đường đi của một lần mua vé ở bục bên trái', at: [-3.4, -.5], t: 'Mở sơ đồ', f() { s4Api(); } },
    { o: 'Ghép các thành phần của hệ CSDL ở bục bên phải', at: [3.4, -.5], t: 'Mở sơ đồ hệ thống', f() { s4System(); } },
    { o: 'Chọn hệ QTCSDL ở bục giữa', at: [0, 2.6], t: 'So sánh các hệ QTCSDL', f() { s4Dbms(); } },
    { o: 'Nhặt mảnh mã khóa', key: 1 }],
  tick(dt) { festTick(this, dt); },
};
function s4Api() {
  s4Order({
    tag: 'Thử thách 1 · Giao diện lập trình ứng dụng', title: 'Sắp xếp các bước của một lần mua vé trên điện thoại',
    desc: 'Bấm lần lượt từ bước đầu tiên đến bước cuối cùng.',
    steps: ['Khán giả chọn ghế và bấm "Mua vé" trên ứng dụng', 'Ứng dụng gửi yêu cầu tới hệ QTCSDL qua API', 'Hệ QTCSDL kiểm tra ràng buộc, quyền và giao dịch', 'Bản ghi vé mới được lưu vào CSDL', 'Ứng dụng nhận kết quả và báo "Mua vé thành công"'],
    why: ['Mọi thứ bắt đầu từ thao tác của người dùng trên ứng dụng.', 'Ứng dụng không tự sửa tệp dữ liệu; nó gửi yêu cầu qua API.', 'Trước khi ghi, hệ QTCSDL phải kiểm tra ràng buộc, quyền và tránh trùng giao dịch.', 'Chỉ khi kiểm tra xong, dữ liệu mới được ghi vào CSDL.', 'Cuối cùng kết quả mới được trả về cho người dùng.'],
    win: 'Đúng thứ tự. Nhờ API, nhà phát triển viết ứng dụng mà không cần biết dữ liệu được lưu chi tiết thế nào.',
    done: () => doneStep([['NOVA', 'Giờ hãy nhìn toàn cảnh: hệ thống bán vé gồm những thành phần nào? Bục bên phải.']]),
  });
}
function s4System() {
  s4Multi({
    tag: 'Thử thách 2 · Hệ cơ sở dữ liệu', title: 'Chọn các thành phần tạo nên hệ CSDL của lễ hội',
    desc: 'Hệ CSDL không chỉ là dữ liệu. Chọn tất cả thành phần thuộc hệ CSDL.', items: [
      ['CSDL LeHoiNova (các bảng Khán giả, Vé, Ghế)', 1, 'phải có chính CSDL chứa dữ liệu.'],
      ['Hệ QTCSDL quản trị CSDL đó', 1, 'cần phần mềm quản trị việc lưu trữ, cập nhật, truy xuất và bảo mật.'],
      ['Các phần mềm ứng dụng: ứng dụng Vé Nova, trang quản lý của ban tổ chức', 1, 'người dùng làm việc với CSDL thông qua phần mềm ứng dụng.'],
      ['Máy chiếu trên sân khấu lễ hội', 0, 'máy chiếu là thiết bị trình diễn, không tham gia lưu trữ hay khai thác CSDL.'],
      ['Ba tệp bảng tính cũ của các phòng', 0, 'dữ liệu đã được chuyển vào CSDL; ba tệp cũ không còn là một phần của hệ thống.']],
    win: 'Hệ CSDL = CSDL + hệ QTCSDL + các phần mềm ứng dụng khai thác CSDL đó.',
    done: () => doneStep([['CO', 'Năm sau lễ hội mở rộng ra cả nước. Chị cần biết nên dùng hệ QTCSDL nào. Bục giữa.']]),
  });
}
function s4Dbms() {
  s4Classify({
    tag: 'Thử thách 3 · Các hệ QTCSDL phổ biến', title: 'Chọn loại hệ QTCSDL phù hợp cho mỗi tình huống',
    desc: 'MySQL, PostgreSQL, SQL Server, Oracle chạy trên máy chủ, phục vụ nhiều người cùng lúc. SQLite gọn nhẹ, nhúng ngay trong ứng dụng.',
    buckets: ['Hệ QTCSDL máy chủ (MySQL, PostgreSQL…)', 'SQLite nhúng trong ứng dụng'],
    items: [['Hệ thống bán vé trực tuyến, hàng nghìn người truy cập cùng lúc', 0, 'Nhiều người dùng đồng thời qua mạng cần hệ QTCSDL máy chủ.'],
      ['Ứng dụng ghi chú ca trực trên điện thoại của một bảo vệ', 1, 'Dữ liệu nhỏ của một người, lưu ngay trên máy: SQLite là đủ.'],
      ['Trang quản lý chung cho ban tổ chức ở nhiều nơi', 0, 'Nhiều người ở nhiều nơi cùng dùng một CSDL: chọn hệ QTCSDL máy chủ.'],
      ['Trò chơi nhỏ lưu bảng điểm cao ngay trên máy', 1, 'Ứng dụng đơn lẻ, không cần máy chủ: SQLite phù hợp.']],
    win: 'Chọn đúng theo quy mô. Microsoft Access cũng là một hệ QTCSDL, nhưng hiệu suất hạn chế nên ít dùng cho ứng dụng trực tuyến lớn.',
    done: () => doneStep([['NOVA', 'Mảnh mã khóa thứ năm ở cạnh màn hình ứng dụng. Sau đó là trận cuối ở Trung tâm điều phối.']], toKey(4.6, -3.4)),
  });
}

/* =================== Chương cuối · Trung tâm điều phối: CSDL tập trung và phân tán =================== */
CHS[6] = {
  n: 6, t: 'Chương cuối · Trung tâm điều phối', room: 'Trung tâm điều phối', ic: 'ti-server-2', bg: 0x312e81, gl: [0, 2.6, -2.6],
  sum: [],
  build() {
    festRoom(this, { floor: ['#ede9fe', '#a78bfa'], wall: 0xc4b5fd, title: 'TRUNG TÂM ĐIỀU PHỐI', badge: 'FINAL', acc: uiAccent(6) });
    this.leds = [];
    for (let i = 0; i < 3; i++) { rack(-5.6, -3 + i * 2.4, this.leds); rack(5.6, -3 + i * 2.4, this.leds); }
    coreBuild(this, 'Máy chủ LeHoiNova');
  },
  start: [['GLITCH', 'Ba điểm bán vé ở ba quận cùng mở. Máy chủ trung tâm của các người sắp quá tải, còn tôi thì đã sẵn sàng.'],
    ['NOVA', '{n}, nạp 5 mảnh mã khóa vào máy chủ để khóa quyền của BOT PHE VÉ. Sau đó ta chọn kiến trúc CSDL cho ba điểm bán.']],
  steps: [
    { o: 'Nạp 5 mảnh mã khóa vào máy chủ', at: [0, 2.4], t: 'Nạp mảnh mã khóa', f() { coreStart(CH); } },
    { o: 'Phân biệt CSDL tập trung và phân tán', at: [0, 2.4], t: 'Mở sơ đồ ba điểm bán', f() { s4Arch(); } },
    { o: 'Đối đầu BOT PHE VÉ', at: [0, 2.4], t: 'Bắt đầu kiểm tra', f() { s4Boss(); } }],
  tick(dt) {
    festTick(this, dt);
    this.leds.forEach((l, i) => { const r = Math.sin(tm * 5 + i * 1.7); l.material.emissive.setHex(si < 1 || this.won ? 0x22c55e : r > .4 ? 0xe11d48 : 0x22c55e); l.material.emissiveIntensity = r > -.4 ? 1.4 : .1; });
    coreTick(this, dt, () => talk([['NOVA', 'BOT PHE VÉ đã mất quyền ghi vào CSDL.'], ['CO', 'Còn ba điểm bán vé ở ba quận: nên lưu dữ liệu ở một máy chủ hay ở nhiều nơi?']], adv));
  },
};
function s4Arch() {
  s4Classify({
    tag: 'Thử thách cuối · Tập trung hay phân tán', title: 'Mỗi mô tả nói về CSDL tập trung hay CSDL phân tán?',
    desc: 'CSDL tập trung: toàn bộ dữ liệu lưu ở một nơi, người dùng truy cập qua mạng. CSDL phân tán: dữ liệu lưu ở nhiều máy tại nhiều địa điểm, kết nối thành một hệ thống chung.',
    buckets: ['CSDL tập trung', 'CSDL phân tán'],
    items: [['Mọi vé lưu trên một máy chủ ở trụ sở; ba quầy truy cập qua mạng', 0, 'Dữ liệu chỉ nằm ở một nơi.'],
      ['Mỗi quận có máy chủ lưu vé của quận, các máy chủ kết nối thành một hệ thống', 1, 'Dữ liệu nằm ở nhiều địa điểm nhưng vẫn là một CSDL chung.'],
      ['Máy chủ trụ sở hỏng thì cả ba quầy cùng ngừng bán', 0, 'Nhược điểm của tập trung: phụ thuộc vào một máy chủ.'],
      ['Một quận mất kết nối vẫn bán tiếp được vé của quận mình', 1, 'Ưu điểm của phân tán: một nơi gặp sự cố, nơi khác vẫn hoạt động.'],
      ['Quản trị, phân quyền và sao lưu ở một nơi nên đơn giản hơn', 0, 'Ưu điểm của tập trung: dễ quản lý, dễ đảm bảo nhất quán.'],
      ['Cần cơ chế đồng bộ phức tạp để dữ liệu giữa các nơi luôn khớp nhau', 1, 'Nhược điểm của phân tán: thiết kế và bảo đảm nhất quán phức tạp hơn.']],
    win: 'Ban tổ chức chọn CSDL phân tán cho ba quận, có đồng bộ về trụ sở: một quận gặp sự cố, hai quận còn lại vẫn bán vé.',
    done: () => doneStep([['GLITCH', 'Được lắm. Nhưng tôi vẫn còn vài câu đố cuối cùng.']]),
  });
}
function s4Boss() {
  rapidRound({
    enemy: 'BOT PHE VÉ', icon: 'ti-robot', yes: 'Đúng', no: 'Sai', secs: 15, label: 'Nhận định', items: [
      ['Hệ QTCSDL là phần mềm giúp tạo lập, cập nhật, truy xuất và bảo vệ CSDL', 1, 'Đó chính là các nhóm chức năng của hệ QTCSDL.'],
      ['Lưu cùng một thông tin ở nhiều tệp giúp dữ liệu luôn nhất quán', 0, 'Ngược lại: dư thừa dễ dẫn tới mâu thuẫn khi chỉ sửa ở một nơi.'],
      ['Ràng buộc toàn vẹn thuộc nhóm chức năng định nghĩa dữ liệu', 1, 'Ràng buộc được khai báo khi tạo cấu trúc CSDL.'],
      ['Truy xuất dữ liệu theo tiêu chí sẽ xóa các bản ghi không thỏa tiêu chí', 0, 'Truy xuất chỉ đọc; dữ liệu trong CSDL giữ nguyên.'],
      ['Ai biết đường dẫn tới CSDL cũng nên được sửa dữ liệu', 0, 'Hệ QTCSDL phân quyền: chỉ người có thẩm quyền mới được đọc hoặc sửa.'],
      ['Sao lưu dự phòng giúp khôi phục dữ liệu khi có sự cố', 1, 'Bản sao lưu ở nơi khác dùng để khôi phục khi máy chủ gặp sự cố.'],
      ['Hệ CSDL gồm CSDL, hệ QTCSDL và các phần mềm ứng dụng', 1, 'Ba thành phần cùng phối hợp để người dùng khai thác dữ liệu.'],
      ['Trong CSDL phân tán, mọi dữ liệu bắt buộc nằm trên một máy duy nhất', 0, 'Đó là CSDL tập trung; phân tán lưu ở nhiều máy tại nhiều nơi.'],
    ],
    onWin: () => talk([['GLITCH', 'Không còn ghế trùng, không còn kẽ hở nào… Tôi rút lui.'], ['CO', 'Đúng 19:00, cổng lễ hội mở. 5.000 khán giả vào đúng ghế của mình. Cảm ơn em, {n}.'], ['NOVA', 'Dữ liệu tốt không tự nhiên mà có: cần thiết kế, ràng buộc, phân quyền và sao lưu.']], () => { finish(); cert(); }),
  });
}
function cert() {
  certCard('Kỹ thuật viên Dữ liệu Nova', 'Đã chuyển dữ liệu vé từ các tệp rời rạc vào CSDL, đặt ràng buộc toàn vẹn, cập nhật và truy xuất dữ liệu, phân quyền, kiểm soát giao dịch, sao lưu, kết nối ứng dụng qua API và chọn kiến trúc CSDL cho Lễ hội Ánh sáng.');
}

/* ---------- Bài kiểm tra kỹ thuật trước khi nhặt mảnh mã khóa: mỗi phòng một câu ---------- */
setHard({
  1: [{ q: 'Trường THPT A lưu điểm học sinh ở sổ điểm của từng giáo viên bộ môn và ở bảng tổng hợp của giáo vụ. Rủi ro lớn nhất là gì?', ops: [
    { t: 'Điểm ở hai nơi lệch nhau khi chỉ sửa một nơi', ok: 1, e: 'Dư thừa dữ liệu dẫn tới không nhất quán; một CSDL chung tránh được điều này.' },
    { t: 'Không in được bảng điểm', e: 'Vẫn in được; vấn đề là dữ liệu ở hai nơi có thể khác nhau.' },
    { t: 'Máy tính chạy chậm hơn', e: 'Tốc độ máy không phải rủi ro chính của việc lưu trùng.' },
    { t: 'Học sinh không xem được điểm', e: 'Việc xem điểm phụ thuộc phân quyền, không phải do lưu ở hai nơi.' }] }],
  2: [{ q: 'Trường "LopHoc" chỉ nhận các giá trị 10A1, 10A2, 11A1… Khi nhập "10A9" (lớp không tồn tại), điều gì xảy ra nếu đã đặt ràng buộc?', ops: [
    { t: 'Hệ QTCSDL từ chối bản ghi và báo lỗi', ok: 1, e: 'Ràng buộc toàn vẹn được kiểm tra tự động mỗi khi nhập hoặc sửa dữ liệu.' },
    { t: 'Hệ QTCSDL tự đổi thành 10A1', e: 'Hệ QTCSDL không tự đoán sửa dữ liệu; nó chặn và báo lỗi.' },
    { t: 'Bản ghi được lưu, cuối năm mới kiểm tra', e: 'Mục đích của ràng buộc là chặn ngay khi nhập.' },
    { t: 'Cả bảng bị xóa', e: 'Chỉ bản ghi vi phạm bị từ chối; dữ liệu khác không ảnh hưởng.' }] }],
  3: [{ q: 'Thao tác nào sau đây KHÔNG làm thay đổi dữ liệu trong CSDL?', ops: [
    { t: 'Lấy danh sách học sinh có điểm Tin từ 9 trở lên', ok: 1, e: 'Đây là truy xuất theo tiêu chí, chỉ đọc dữ liệu.' },
    { t: 'Thêm học sinh mới chuyển trường đến', e: 'Thêm bản ghi là cập nhật dữ liệu.' },
    { t: 'Sửa điểm bị nhập nhầm', e: 'Sửa bản ghi là cập nhật dữ liệu.' },
    { t: 'Xóa học sinh đã chuyển đi', e: 'Xóa bản ghi là cập nhật dữ liệu.' }] }],
  4: [{ q: 'Thủ thư trường được xem và cập nhật bảng Mượn sách, nhưng không được xem bảng Học phí. Đây là chức năng nào của hệ QTCSDL?', ops: [
    { t: 'Kiểm soát quyền truy cập (bảo mật)', ok: 1, e: 'Mỗi người dùng chỉ được truy cập phần dữ liệu đúng thẩm quyền.' },
    { t: 'Ràng buộc toàn vẹn', e: 'Ràng buộc kiểm tra giá trị dữ liệu, không quyết định ai được xem bảng nào.' },
    { t: 'Sao lưu dự phòng', e: 'Sao lưu để khôi phục khi có sự cố, không liên quan tới quyền xem.' },
    { t: 'Truy xuất theo tiêu chí', e: 'Truy xuất là lấy dữ liệu ra; ai được lấy thì do phân quyền quyết định.' }] }],
  5: [{ q: 'Ứng dụng tra cứu điểm của trường cần đọc dữ liệu từ CSDL điểm. Ứng dụng kết nối với hệ QTCSDL thông qua gì?', ops: [
    { t: 'Giao diện lập trình ứng dụng (API) do hệ QTCSDL cung cấp', ok: 1, e: 'API cho phép phần mềm ứng dụng gửi yêu cầu truy xuất tới CSDL.' },
    { t: 'Mở trực tiếp tệp dữ liệu và tự đọc từng byte', e: 'Ứng dụng không nên đọc trực tiếp tệp của CSDL; mọi truy cập đi qua hệ QTCSDL.' },
    { t: 'Sao chép CSDL vào điện thoại học sinh', e: 'Sao chép toàn bộ dữ liệu làm lộ thông tin và khó cập nhật.' },
    { t: 'Gửi email cho giáo vụ mỗi lần tra cứu', e: 'Đây là quy trình thủ công, không phải cách ứng dụng làm việc với CSDL.' }] }],
});
