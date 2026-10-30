/* ===== Gói đồ họa EduNova cho "Sự cố ở Ngôi nhà Nova" =====
 * Chèn vào cuối script trò chơi (tools/nova/build.mjs), trước dòng khởi chạy. Chỉ thay phần hình ảnh:
 * các hàm dựng phòng, sàn, cây, vật phẩm, cột sáng được khai báo lại (khai báo sau thắng), nhân vật được dựng lại
 * trong nhóm `body` cũ (giữ mảng `legs` để vòng lặp gốc vẫn đánh chân), thêm quầng sáng, bụi lấp lánh, nền chuyển màu.
 * Luật chơi, va chạm, hội thoại giữ nguyên.
 */
R.toneMappingExposure = 0.86;
sun.color.set(0xffe9cf); sun.intensity = 1.25; sun.shadow.normalBias = 0.02; sun.shadow.radius = 4;
hemi.color.set(0xdfe9ff); hemi.groundColor.set(0x8a6b4a); hemi.intensity = 0.36;
const rim = new THREE.DirectionalLight(0xbcd4ff, 0.35); rim.position.set(8, 9, -12); S.add(rim);
// Phản chiếu môi trường dịu hơn: bớt chói, màu vật liệu đậm và rõ hơn.
const ENV_K = 0.38;
const _Std = THREE.MeshStandardMaterial;
function vivid(m) { if (m && m.isMeshStandardMaterial && m.envMapIntensity === 1) m.envMapIntensity = ENV_K; return m; }

/* ---------- Kết cấu vẽ bằng canvas ---------- */
function hexCss(h) { return '#' + h.toString(16).padStart(6, '0'); }
function shade(h, k) { const c = new THREE.Color(h); c.offsetHSL(0, 0, k); return c; }
function halo(color, size) {
  const t = tex(128, 128, (g, w, h) => { const r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.25, 'rgba(255,255,255,.55)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, w, h); });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: .85 }));
  s.scale.setScalar(size); return s;
}
/** Sàn gỗ: tấm ván so le, vân gỗ, khe tối, màu lệch nhẹ giữa các tấm. */
function stripes(a, b, rep) {
  const t = tex(512, 512, (g, w, h) => {
    const rows = 8, rh = h / rows, A = new THREE.Color(a), B = new THREE.Color(b);
    for (let i = 0; i < rows; i++) {
      const off = (i % 2) * w * .37 + (i % 3) * 40;
      for (let k = -1; k < 3; k++) {
        const x0 = off + k * w * .62, c = (i + k) % 2 ? A.clone() : B.clone();
        c.offsetHSL(0, (Math.sin(i * 7 + k * 3) * .03), Math.sin(i * 13 + k * 5) * .035);
        g.fillStyle = '#' + c.getHexString(); g.fillRect(x0, i * rh, w * .62, rh);
        g.strokeStyle = 'rgba(70,40,15,.10)'; g.lineWidth = 1.2;
        for (let v = 0; v < 6; v++) { const y = i * rh + 6 + v * (rh - 12) / 5 + Math.sin(v + k) * 2; g.beginPath(); g.moveTo(x0, y); g.bezierCurveTo(x0 + w * .2, y + 3, x0 + w * .4, y - 3, x0 + w * .62, y + 1); g.stroke(); }
        g.fillStyle = 'rgba(40,20,5,.35)'; g.fillRect(x0, i * rh, 2, rh);
      }
      g.fillStyle = 'rgba(40,20,5,.4)'; g.fillRect(0, i * rh + rh - 2, w, 2);
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep * .5, rep * .5); t.anisotropy = 8; return t;
}
/** Gạch lát: mạch vữa, gạch lệch sắc nhẹ, ánh bóng góc. */
function grid(a, b, rep) {
  const t = tex(512, 512, (g, w, h) => {
    const n = 4, s = w / n, A = new THREE.Color(a);
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const c = A.clone(); c.offsetHSL(0, 0, Math.sin(i * 3.1 + j * 1.7) * .025);
      g.fillStyle = '#' + c.getHexString(); g.fillRect(i * s, j * s, s, s);
      const r = g.createLinearGradient(i * s, j * s, i * s + s, j * s + s); r.addColorStop(0, 'rgba(255,255,255,.10)'); r.addColorStop(1, 'rgba(0,0,0,.06)'); g.fillStyle = r; g.fillRect(i * s, j * s, s, s);
    }
    g.strokeStyle = b; g.lineWidth = 6; for (let i = 0; i <= n; i++) { g.beginPath(); g.moveTo(i * s, 0); g.lineTo(i * s, h); g.stroke(); g.beginPath(); g.moveTo(0, i * s); g.lineTo(w, i * s); g.stroke(); }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep); t.anisotropy = 8; return t;
}

/* ---------- Phòng: sàn có vân nổi, tường hai tông, chân tường, cửa sổ nắng, tranh, đèn ấm ---------- */
function room(map, wallC, h) {
  FL = add(new THREE.PlaneGeometry(14, 10), mat(0xffffff, 0, .62, { map, bumpMap: map, bumpScale: .015 }), 0, 0, 0); FL.rotation.x = -Math.PI / 2;
  add(rbox(14.6, .2, 10.6, .08), mat(0x9aa6b5, 0, .7), 0, -.11, 0);
  const dark = CH && CH.dark, WC = mat(wallC, 0, .85), WL = mat(shade(wallC, dark ? .04 : -.08), 0, .8), TR = mat(dark ? 0x334155 : 0xffffff, .05, .45), BB = mat(dark ? 0x0f172a : 0x7c5a3a, 0, .55);
  [[-7, -5, 7, -5, h], [-7, -5, -7, 5, h], [7, -5, 7, 5, h], [-7, 5, -1, 5, .45], [1, 5, 7, 5, .45]].forEach(([x1, z1, x2, z2, hh]) => {
    const v = x1 === x2, L = Math.abs(v ? z2 - z1 : x2 - x1) + .25, cx = (x1 + x2) / 2, cz = (z1 + z2) / 2;
    const low = Math.min(hh, .9);
    add(rbox(v ? .25 : L, low, v ? L : .25, .06), WL, cx, low / 2, cz);
    if (hh > low) add(rbox(v ? .25 : L, hh - low, v ? L : .25, .06), WC, cx, low + (hh - low) / 2, cz);
    add(rbox(v ? .3 : L + .05, .08, v ? L + .05 : .3, .03), TR, cx, hh + .04, cz);
    if (hh > 1) { const inX = v ? (x1 < 0 ? .16 : -.16) : 0, inZ = v ? 0 : .16; add(rbox(v ? .06 : L - .3, .14, v ? L - .3 : .06, .02), BB, cx + inX, .07, cz + inZ); add(rbox(v ? .04 : L - .3, .04, v ? L - .3 : .04, .01), TR, cx + inX, low, cz + inZ); }
  });
  if (!dark && h > 2) {
    // Cửa sổ trên tường sau: khung trắng, kính sáng, nắng hắt chéo xuống sàn
    const WX = 2.6, WY = 1.55;
    add(rbox(1.4, 1.05, .08, .03), mat(0xffffff, 0, .4), WX, WY, -4.83);
    add(new THREE.PlaneGeometry(1.22, .88), new THREE.MeshBasicMaterial({ color: 0xcfe8ff }), WX, WY, -4.78);
    add(rbox(.05, .88, .05, .01), mat(0xffffff), WX, WY, -4.76); add(rbox(1.22, .05, .05, .01), mat(0xffffff), WX, WY, -4.76);
    const shaft = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 3.2), new THREE.MeshBasicMaterial({ map: tex(64, 256, (g, w, hh) => { const r = g.createLinearGradient(0, 0, 0, hh); r.addColorStop(0, 'rgba(255,244,214,.16)'); r.addColorStop(1, 'rgba(255,244,214,0)'); g.fillStyle = r; g.fillRect(0, 0, w, hh); }), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
    shaft.position.set(WX + .2, .9, -3.7); shaft.rotation.set(-.95, 0, -.12); W.add(shaft);
    const patch = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.1), new THREE.MeshBasicMaterial({ map: tex(128, 128, (g) => { const r = g.createRadialGradient(64, 64, 4, 64, 64, 64); r.addColorStop(0, 'rgba(255,236,190,.22)'); r.addColorStop(1, 'rgba(255,236,190,0)'); g.fillStyle = r; g.fillRect(0, 0, 128, 128); }), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    patch.rotation.x = -Math.PI / 2; patch.position.set(WX + .4, .015, -2.6); W.add(patch);
    // Tranh treo tường hai bên
    [[-6.86, -1.2, Math.PI / 2, ['#38bdf8', '#fde68a', '#22c55e']], [6.86, 1.2, -Math.PI / 2, ['#f472b6', '#a78bfa', '#fef3c7']]].forEach(([x, z, ry, cs]) => {
      const fr = add(rbox(.07, .72, 1, .02), mat(0x3f2a1a, 0, .5), x, 1.5, z); fr.rotation.y = 0;
      const art = new THREE.Mesh(new THREE.PlaneGeometry(.86, .58), new THREE.MeshStandardMaterial({ map: tex(160, 108, (g, w, hh) => { g.fillStyle = cs[2]; g.fillRect(0, 0, w, hh); g.fillStyle = cs[0]; g.beginPath(); g.moveTo(0, hh); g.lineTo(w * .45, hh * .3); g.lineTo(w * .8, hh); g.fill(); g.fillStyle = cs[1]; g.beginPath(); g.arc(w * .75, hh * .3, 14, 0, 7); g.fill(); }), roughness: .8 }));
      art.position.set(x + (x < 0 ? .05 : -.05), 1.5, z); art.rotation.y = ry; W.add(art);
    });
  }
  // Đèn trần ấm (không đổ bóng, chỉ làm ấm màu và tạo chiều sâu)
  const lamp = new THREE.PointLight(dark ? 0x38bdf8 : 0xffd9a8, dark ? .5 : .45, 16, 2); lamp.position.set(0, 3.2, .5); W.add(lamp);
}

/* ---------- Cây: chậu tiện tròn, đất, nhiều chùm lá ---------- */
function plant(x, z) {
  const pot = new THREE.LatheGeometry([new THREE.Vector2(.18, 0), new THREE.Vector2(.24, .02), new THREE.Vector2(.3, .5), new THREE.Vector2(.33, .52), new THREE.Vector2(.33, .56), new THREE.Vector2(.29, .56)], 28);
  add(pot, mat(0xc2410c, 0, .55), x, 0, z);
  add(new THREE.CylinderGeometry(.28, .28, .03, 24), mat(0x3f2a1a, 0, .95), x, .53, z);
  const greens = [0x3f7d20, 0x4d7c0f, 0x65a30d, 0x15803d];
  [[0, .95, 0, .42], [.18, 1.18, .06, .3], [-.16, 1.12, -.08, .32], [.04, 1.35, -.05, .25], [-.06, .82, .18, .26]].forEach(([dx, y, dz, r], i) => add(new THREE.IcosahedronGeometry(r, 1), mat(greens[i % 4], 0, .75, { flatShading: true }), x + dx, y, z + dz));
  box(x - .4, x + .4, z - .4, z + .4);
}

/* ---------- Cột sáng và vật phẩm phát sáng ---------- */
const BEAM_TEX = tex(16, 256, (g, w, hh) => { const r = g.createLinearGradient(0, 0, 0, hh); r.addColorStop(0, 'rgba(255,255,255,0)'); r.addColorStop(.75, 'rgba(255,255,255,.22)'); r.addColorStop(1, 'rgba(255,255,255,.5)'); g.fillStyle = r; g.fillRect(0, 0, w, hh); });
function beam(x, z) {
  const b = new THREE.Mesh(new THREE.CylinderGeometry(.32, .42, 3, 28, 1, true), new THREE.MeshBasicMaterial({ color: 0xfbbf24, map: BEAM_TEX, transparent: true, opacity: .45, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
  b.position.set(x, 1.5, z); W.add(b);
  const ring = new THREE.Mesh(new THREE.RingGeometry(.34, .46, 40), new THREE.MeshBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: .7, depthWrite: false, side: THREE.DoubleSide }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = -1.48; b.add(ring);
  return b;
}
function pickup(n, f, x, z, mk) { const g = new THREE.Group(); g.position.set(x, .6, z); W.add(g); mk(g); g.add(halo(0xfde68a, .7)); g.children[g.children.length - 1].material.opacity = .45; return { n, f, x, z, g, b: beam(x, z), got: 0 }; }

/* ---------- Nhân vật kỹ thuật viên: áo hoodie, mũ kỹ thuật, tay vung khi đi ---------- */
const ARMS = [];
(function rebuildHero() {
  body.children.slice().forEach((c) => body.remove(c));
  const skin = mat(0xf3c9a4, 0, .55), hood = mat(0x4338ca, 0, .78), pant = mat(0x1e293b, 0, .8), shoe = mat(0xf8fafc, 0, .4), sole = mat(0x334155, 0, .6), cap = mat(0xfbbf24, 0, .45), hair = mat(0x3b2416, 0, .7);
  const torso = new THREE.LatheGeometry([new THREE.Vector2(.001, .5), new THREE.Vector2(.26, .5), new THREE.Vector2(.31, .62), new THREE.Vector2(.31, .95), new THREE.Vector2(.27, 1.12), new THREE.Vector2(.16, 1.2), new THREE.Vector2(.001, 1.2)], 32);
  add(torso, hood, 0, 0, 0, body);
  add(new THREE.TorusGeometry(.29, .035, 10, 32), mat(0x312e81, 0, .7), 0, .55, 0, body).rotation.x = Math.PI / 2;
  add(rbox(.04, .4, .02, .01), mat(0xe0e7ff, .3, .4), 0, .82, .305, body);
  add(rbox(.2, .12, .04, .03), mat(0x3730a3, 0, .7), 0, .7, .3, body); // túi áo
  add(new THREE.SphereGeometry(.07, 12, 8), mat(0x22d3ee, 0, .3, { emissive: 0x22d3ee, emissiveIntensity: .6 }), .14, 1.0, .27, body); // huy hiệu
  // Ba lô kỹ thuật viên
  add(rbox(.38, .42, .2, .07), mat(0x0e7490, 0, .6), 0, .88, -.3, body);
  add(rbox(.3, .14, .06, .04), mat(0x155e75, 0, .6), 0, .76, -.41, body);
  [-.13, .13].forEach((x) => add(rbox(.05, .4, .05, .02), mat(0x0e7490, 0, .6), x, .9, .25, body));
  // Đầu
  add(new THREE.SphereGeometry(.27, 32, 24), skin, 0, 1.47, 0, body);
  [-.27, .27].forEach((x) => add(new THREE.SphereGeometry(.06, 12, 8), skin, x, 1.46, 0, body));
  const hairM = add(new THREE.SphereGeometry(.285, 32, 16, 0, Math.PI * 2, 0, Math.PI * .55), hair, 0, 1.5, -.02, body); hairM.rotation.x = -.25;
  add(new THREE.SphereGeometry(.29, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2), cap, 0, 1.56, 0, body);
  add(rbox(.34, .035, .24, .015), cap, 0, 1.58, .25, body);
  add(new THREE.SphereGeometry(.04, 10, 8), mat(0xf59e0b, 0, .4), 0, 1.85, 0, body);
  [-.09, .09].forEach((x) => {
    add(new THREE.SphereGeometry(.05, 14, 10), mat(0xffffff, 0, .25), x, 1.47, .235, body);
    add(new THREE.SphereGeometry(.032, 12, 8), mat(0x0f172a, 0, .2), x, 1.465, .27, body);
    add(new THREE.SphereGeometry(.011, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff }), x + .012, 1.48, .298, body);
    const ck = add(new THREE.SphereGeometry(.04, 10, 8), mat(0xfb7185, 0, .7, { transparent: true, opacity: .55 }), x * 1.7, 1.39, .21, body); ck.scale.set(1, .6, .4);
  });
  const mouth = add(new THREE.TorusGeometry(.04, .009, 6, 16, Math.PI), mat(0x9f1239, 0, .5), 0, 1.38, .255, body); mouth.rotation.z = Math.PI;
  // Chân: khớp ở hông để vòng lặp gốc vung chân (legs[0], legs[1])
  [-.12, .12].forEach((x, i) => {
    const hip = new THREE.Group(); hip.position.set(x, .5, 0); body.add(hip);
    add(new THREE.CylinderGeometry(.095, .085, .36, 14), pant, 0, -.18, 0, hip);
    add(rbox(.17, .1, .26, .045), shoe, 0, -.4, .04, hip);
    add(rbox(.18, .03, .27, .012), sole, 0, -.45, .04, hip);
    legs[i] = hip;
  });
  // Tay: khớp ở vai, vung ngược chân khi đi
  [-.34, .34].forEach((x) => {
    const sh = new THREE.Group(); sh.position.set(x, 1.08, 0); body.add(sh);
    const arm = add(new THREE.CylinderGeometry(.075, .065, .42, 14), hood, 0, -.2, 0, sh); arm.rotation.z = x < 0 ? -.12 : .12;
    add(new THREE.SphereGeometry(.075, 14, 10), skin, x < 0 ? .03 : -.03, -.44, 0, sh);
    ARMS.push(sh);
  });
  // Bóng mềm dưới chân (đi theo người chơi, không xoay)
  const blob = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.1), new THREE.MeshBasicMaterial({ map: tex(128, 128, (g) => { const r = g.createRadialGradient(64, 64, 6, 64, 64, 64); r.addColorStop(0, 'rgba(15,23,42,.45)'); r.addColorStop(1, 'rgba(15,23,42,0)'); g.fillStyle = r; g.fillRect(0, 0, 128, 128); }), transparent: true, depthWrite: false }));
  blob.rotation.x = -Math.PI / 2; blob.position.y = .012; P.add(blob);
  body.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = false; } });
})();

/* ---------- Quầng sáng: NOVA, Glitch, mảnh mã khóa ---------- */
{ const h = halo(0x22d3ee, .8); h.material.opacity = .4; NOVA.add(h); }
const novaFins = [0, 1, 2].map((i) => { const f = new THREE.Mesh(new THREE.ConeGeometry(.05, .18, 8), new THREE.MeshStandardMaterial({ color: 0xa5f3fc, emissive: 0x22d3ee, emissiveIntensity: .8 })); f.rotation.z = Math.PI / 2; NOVA.add(f); return f; });
const glHalo = halo(0xe11d48, 1.6); glHalo.userData.v = new THREE.Vector3(); GL.add(glHalo); // code gốc coi mọi con của GL là mảnh vỡ (cần userData.v)
{ const h = halo(0x22d3ee, 1.1); h.material.opacity = .55; KEY.add(h); }

/* ---------- Bụi lấp lánh bay chậm trong phòng ---------- */
const DUST_N = 90, dustG = new THREE.BufferGeometry(), dustP = new Float32Array(DUST_N * 3), dustS = new Float32Array(DUST_N);
for (let i = 0; i < DUST_N; i++) { dustP[i * 3] = (Math.random() - .5) * 13; dustP[i * 3 + 1] = Math.random() * 3; dustP[i * 3 + 2] = (Math.random() - .5) * 9; dustS[i] = .05 + Math.random() * .12; }
dustG.setAttribute('position', new THREE.BufferAttribute(dustP, 3));
const dust = new THREE.Points(dustG, new THREE.PointsMaterial({ size: .06, map: tex(32, 32, (g) => { const r = g.createRadialGradient(16, 16, 0, 16, 16, 16); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 32, 32); }), color: 0xfff3c4, transparent: true, opacity: .7, depthWrite: false, blending: THREE.AdditiveBlending }));
S.add(dust);

/* ---------- Nền chuyển màu theo phòng ---------- */
const BG_CACHE = {};
function skyFor(hex) {
  if (!BG_CACHE[hex]) BG_CACHE[hex] = tex(4, 256, (g, w, hh) => { const top = new THREE.Color(hex).offsetHSL(0, .05, .1), bot = new THREE.Color(hex).offsetHSL(0, 0, -.12); const r = g.createLinearGradient(0, 0, 0, hh); r.addColorStop(0, '#' + top.getHexString()); r.addColorStop(1, '#' + bot.getHexString()); g.fillStyle = r; g.fillRect(0, 0, w, hh); });
  return BG_CACHE[hex];
}

/* ---------- Hoạt cảnh thêm mỗi khung hình (chạy song song vòng lặp gốc) ---------- */
let fxLast = 0;
function fx(now) {
  const dt = Math.min(.05, (now - (fxLast || now)) / 1000); fxLast = now;
  if (S.background && S.background.isColor) { const hx = S.background.getHex(); S.background = skyFor(hx); S.userData.bg = hx; }
  const dark = CH && CH.dark;
  dust.material.color.set(dark ? 0x67e8f9 : 0xfff3c4); dust.visible = !(CH && CH.outdoor);
  for (let i = 0; i < DUST_N; i++) { dustP[i * 3 + 1] += dustS[i] * dt; dustP[i * 3] += Math.sin(tm * .5 + i) * .002; if (dustP[i * 3 + 1] > 3.2) dustP[i * 3 + 1] = 0; }
  dustG.attributes.position.needsUpdate = true;
  const sw = walkT ? Math.sin(walkT) * .65 : Math.sin(tm * 1.6) * .04;
  ARMS[0].rotation.x = sw; ARMS[1].rotation.x = -sw;
  novaFins.forEach((f, i) => { const a = tm * 3 + i * 2.094; f.position.set(Math.cos(a) * .3, Math.sin(tm * 4 + i) * .03, Math.sin(a) * .3); f.rotation.y = -a; });
  glHalo.material.opacity = .55 + Math.sin(tm * 9) * .3 * (Math.random() > .9 ? 1 : .4);
  S.traverse(vividOnce);
  requestAnimationFrame(fx);
}
const seen = new WeakSet();
function vividOnce(o) { if (o.isMesh && !seen.has(o)) { seen.add(o); const m = o.material; if (Array.isArray(m)) m.forEach(vivid); else vivid(m); } }
requestAnimationFrame(fx);
