/* ===== Gói "THPT" cho "Sự cố ở Ngôi nhà Nova" =====
 * Chèn sau các gói đồ họa, âm thanh, cỡ chữ (tools/nova/build.mjs). Mục tiêu: hình ảnh trưởng thành, độ khó cao hơn.
 * 1. Hậu kỳ: bloom (vật phát sáng tỏa sáng), chỉnh màu điện ảnh, viền tối, hạt nhiễu nhẹ. Máy yếu tự tắt bớt.
 * 2. Phối cảnh: phòng buổi tối, màu vật liệu trầm, dải đèn LED; chương 4 thành ngã tư thành phố lúc chạng vạng.
 * 3. Nhân vật tỉ lệ người thật (áo khoác kỹ thuật, tai nghe), nhãn 3D và giao diện kính tối.
 * 4. Độ khó: đáp án xáo trộn; mỗi chương có bài kiểm tra kỹ thuật trước khi nhặt mảnh mã khóa;
 *    chương 4 viết chương trình đèn 5 tham số và xếp 3 luật ưu tiên.
 * 5. Chương 4: đường kéo dài (xe không còn chạy ra khoảng trống), xe dừng khi người chơi đứng trên làn.
 */
const PX = { on: true, comp: null, w: 0, h: 0, pr: 0, lastCH: null, slow: 0, frames: 0, t0: 0 };
const V2 = (x, y) => new THREE.Vector2(x, y);
const shuffleArr = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const keepMat = (m) => { m.userData.keep = 1; return m; };

/* ---------- 1. Hậu kỳ ---------- */
(function postFx() {
  if (!THREE.EffectComposer || !THREE.UnrealBloomPass || !THREE.ShaderPass) { PX.on = false; return; }
  let pref = ''; try { pref = localStorage.getItem('nova_fx') || ''; } catch (e) { /* bộ nhớ bị chặn */ }
  if (pref === 'lo') PX.on = false;
  PX.force = pref === 'hi';
  // Vùng đệm có stencil để được độ sâu 24 bit (16 bit gây sọc ở các mặt sàn sát nhau)
  const rt = new THREE.WebGLRenderTarget(G.clientWidth || 800, G.clientHeight || 500, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat, stencilBuffer: true });
  const comp = new THREE.EffectComposer(R, rt);
  cam.near = .5; cam.updateProjectionMatrix();
  comp.addPass(new THREE.RenderPass(S, cam));
  PX.bloom = new THREE.UnrealBloomPass(new THREE.Vector2(512, 512), .42, .4, .9);
  comp.addPass(PX.bloom);
  PX.grade = new THREE.ShaderPass({
    uniforms: { tDiffuse: { value: null }, vig: { value: .42 }, time: { value: 0 } },
    vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: [
      'uniform sampler2D tDiffuse;uniform float vig;uniform float time;varying vec2 vUv;',
      'vec3 toSRGB(vec3 c){return mix(c*12.92,1.055*pow(c,vec3(1./2.4))-.055,step(.0031308,c));}',
      'void main(){vec3 c=texture2D(tDiffuse,vUv).rgb;float l=dot(c,vec3(.2126,.7152,.0722));',
      // bóng tối hơi xanh lạnh, vùng sáng hơi ấm
      'c=mix(c,c*vec3(.9,1.,1.08),1.-smoothstep(0.,.3,l));c=mix(c,c*vec3(1.05,1.,.93),smoothstep(.4,1.,l));',
      'c=toSRGB(clamp(c,0.,1.));c=clamp((c-.5)*1.07+.5,0.,1.);',
      'float d=distance(vUv,vec2(.5));c*=1.-vig*smoothstep(.32,.9,d);',
      'vec2 q=floor(gl_FragCoord.xy)+fract(time)*61.;float n=fract(sin(dot(q,vec2(12.9898,78.233)))*43758.5453);c+=(n-.5)*.012;',
      'gl_FragColor=vec4(c,1.);}',
    ].join('\n'),
  });
  comp.addPass(PX.grade);
  PX.comp = comp;
  const render0 = R.render.bind(R);
  let inside = false;
  R.render = function (s, c) {
    if (PX.on && s === S && c === cam && !inside) {
      inside = true;
      try {
        const w = G.clientWidth, h = G.clientHeight, pr = R.getPixelRatio();
        if (w !== PX.w || h !== PX.h || pr !== PX.pr) { PX.w = w; PX.h = h; PX.pr = pr; comp.setPixelRatio(pr); comp.setSize(w, h); }
        PX.grade.uniforms.time.value = (performance.now() / 1000) % 100;
        comp.render();
      } finally { inside = false; }
    } else render0(s, c);
  };
})();

/* ---------- 2. Giao diện kính tối ---------- */
(function proCss() {
  const st = document.createElement('style');
  const P = '.g .pn';
  st.textContent = `
.g{font-family:"Segoe UI",system-ui,-apple-system,Roboto,sans-serif;background:#0a0f18}
.g .pn{background:rgba(9,13,22,.93)!important;color:#e2e8f0!important;border:1px solid rgba(148,163,184,.2)!important;border-radius:10px!important;box-shadow:0 24px 70px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.05);backdrop-filter:blur(12px)}
.g .dlg{background:rgba(9,13,22,.9)!important;color:#e2e8f0;border:1px solid rgba(148,163,184,.2)!important;border-radius:10px!important;backdrop-filter:blur(10px);box-shadow:0 18px 50px rgba(0,0,0,.45)}
.g .dlg::before{content:"";position:absolute;left:14px;right:14px;top:-1px;height:2px;background:linear-gradient(90deg,#22d3ee,transparent)}
.g .chip{background:rgba(9,13,22,.78);border:1px solid rgba(148,163,184,.18);border-radius:8px;backdrop-filter:blur(8px)}
.g .toast{background:rgba(9,13,22,.92);color:#e2e8f0;border:1px solid rgba(34,211,238,.35);border-radius:8px}
.g .bt{background:linear-gradient(180deg,#0891b2,#0e7490);border-radius:8px;letter-spacing:.01em;box-shadow:0 0 0 1px rgba(34,211,238,.35),0 6px 18px rgba(8,145,178,.35)}
.g .bt2{background:rgba(30,41,59,.9);color:#e2e8f0;border:1px solid rgba(148,163,184,.28);border-radius:8px}
.g .op{background:rgba(30,41,59,.65);border:1px solid rgba(148,163,184,.22);color:#e2e8f0;border-radius:8px}
.g .op:hover{border-color:#22d3ee;background:rgba(8,145,178,.12)}
.g .op.bad{background:rgba(225,29,72,.14);border-color:#e11d48}
.g .op.good{background:rgba(16,185,129,.16);border-color:#10b981}
.g .op[disabled]{cursor:default}
.g .op i{color:#94a3b8!important}
.g .cb{background:rgba(30,41,59,.8);color:#c7d2fe}
.g .cb select,.g select{background:#0b1220;color:#e2e8f0;border:1px solid #334155}
.g .slot{background:rgba(30,41,59,.55);color:#cbd5e1;border-color:#475569}
.g .slot.ok{background:rgba(16,185,129,.15);color:#a7f3d0;border-color:#10b981}
.g .prt{background:rgba(67,56,202,.22);color:#c7d2fe}
.g .rm{background:rgba(30,41,59,.65);color:#e2e8f0;border-color:#334155}
.g .rm.open{background:rgba(8,145,178,.14);border-color:#22d3ee}
.g .rm.done{background:rgba(16,185,129,.12);border-color:#10b981}
.g input[type=text]{background:#0b1220;color:#e2e8f0;border-color:#334155}
.g .term{border:1px solid #1e293b}
${P} [style*="color:#64748b"]:not(.phs *){color:#94a3b8!important}
${P} [style*="color:#475569"]:not(.phs *){color:#cbd5e1!important}
${P} [style*="color:#0f172a"]:not(.phs *){color:#e2e8f0!important}
${P} [style*="color:#334155"]:not(.phs *){color:#cbd5e1!important}
${P} [style*="background:#f8fafc"]:not(.phs *),${P} [style*="background:#fff;"]:not(.phs *),${P} [style*="background:#ffffff"]:not(.phs *){background:rgba(30,41,59,.65)!important}
${P} [style*="background:#EEF2FF"]:not(.phs *){background:rgba(67,56,202,.22)!important}
${P} [style*="background:#E1F5EE"]:not(.phs *){background:rgba(16,185,129,.15)!important}
${P} [style*="color:#085041"]:not(.phs *),${P} [style*="color:#0f766e"]:not(.phs *){color:#6ee7b7!important}
${P} [style*="color:#312e81"]:not(.phs *),${P} [style*="color:#3730A3"]:not(.phs *),${P} [style*="color:#4338CA"]:not(.phs *){color:#a5b4fc!important}
${P} [style*="color:#A32D2D"]:not(.phs *),${P} [style*="color:#be123c"]:not(.phs *){color:#fda4af!important}
.g #title{background:radial-gradient(ellipse at 50% 40%,rgba(8,47,73,.35),rgba(2,6,23,.82))!important}
.g .chip:empty{display:none}
.g .hard-tag{display:inline-block;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#22d3ee;border:1px solid rgba(34,211,238,.4);border-radius:4px;padding:1px 6px;margin-bottom:6px}`;
  document.head.appendChild(st);
})();

/* Nhãn 3D: khung kính tối, vạch màu trạng thái bên trái (khai báo lại setS, khai báo sau thắng). */
function setS(s, t, bg) {
  const c = s.userData.c, g = c.getContext('2d');
  if (s.userData.lbl === t + bg) return;
  s.userData.lbl = t + bg;
  g.clearRect(0, 0, 512, 96); g.font = '600 34px "Segoe UI",system-ui,sans-serif';
  const w = Math.min(504, g.measureText(t).width + 64), x0 = (512 - w) / 2;
  const rr = (x, y, ww, hh, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + ww, y, x + ww, y + hh, r); g.arcTo(x + ww, y + hh, x, y + hh, r); g.arcTo(x, y + hh, x, y, r); g.arcTo(x, y, x + ww, y, r); g.closePath(); };
  rr(x0, 14, w, 68, 10); g.fillStyle = 'rgba(8,12,22,.88)'; g.fill(); g.strokeStyle = 'rgba(148,163,184,.4)'; g.lineWidth = 2; g.stroke();
  rr(x0 + 8, 26, 7, 44, 3); g.fillStyle = bg; g.fill();
  g.fillStyle = '#f1f5f9'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(t, 256 + 6, 49);
  s.material.map.needsUpdate = true;
}

/* ---------- 3. Nhân vật tỉ lệ người thật ---------- */
(function proHero() {
  body.children.slice().forEach((c) => body.remove(c)); ARMS.length = 0;
  const skin = mat(0xc89377, 0, .62), jacket = mat(0x1d2430, .15, .5), inner = mat(0x3b4452, 0, .85), jeans = mat(0x22324a, 0, .85),
    shoe = mat(0xe5e7eb, 0, .45), sole = mat(0x0f141b, 0, .7), hair = mat(0x15100c, 0, .7), gear = mat(0x0b0f14, .5, .32),
    glow = mat(0x22d3ee, 0, .3, { emissive: 0x22d3ee, emissiveIntensity: 1.6 });
  add(rbox(.32, .16, .2, .06), jeans, 0, .93, 0, body); // hông
  const torso = add(new THREE.LatheGeometry([V2(.001, .92), V2(.165, .93), V2(.185, 1.06), V2(.205, 1.3), V2(.225, 1.44), V2(.19, 1.52), V2(.075, 1.565), V2(.001, 1.565)], 28), jacket, 0, 0, 0, body);
  torso.scale.z = .7;
  add(rbox(.11, .42, .02, .01), inner, 0, 1.3, .135, body); // áo trong lộ ra ở cổ
  add(rbox(.012, .5, .012, .004), glow, .06, 1.22, .15, body); // đường viền phát sáng trên áo khoác
  add(rbox(.012, .5, .012, .004), glow, -.06, 1.22, .15, body);
  add(new THREE.TorusGeometry(.08, .028, 8, 20), jacket, 0, 1.55, 0, body).rotation.x = Math.PI / 2; // cổ áo
  add(new THREE.CylinderGeometry(.045, .05, .1, 12), skin, 0, 1.6, 0, body);
  const head = add(new THREE.SphereGeometry(.112, 28, 20), skin, 0, 1.735, 0, body); head.scale.set(.9, 1.12, 1);
  [-.1, .1].forEach((x) => add(new THREE.SphereGeometry(.022, 10, 8), skin, x, 1.73, 0, body));
  const hr = add(new THREE.SphereGeometry(.12, 28, 16, 0, Math.PI * 2, 0, Math.PI * .55), hair, 0, 1.765, -.012, body); hr.scale.set(.96, 1.06, 1.06); hr.rotation.x = -.32;
  add(rbox(.2, .05, .1, .02), hair, 0, 1.83, .04, body).rotation.x = -.2; // tóc mái
  [-.038, .038].forEach((x) => add(new THREE.SphereGeometry(.011, 8, 6), mat(0x0b0b0b, 0, .3), x, 1.75, .097, body));
  add(new THREE.TorusGeometry(.128, .011, 8, 24, Math.PI), gear, 0, 1.745, 0, body); // tai nghe
  [-.115, .115].forEach((x) => {
    add(new THREE.CylinderGeometry(.042, .042, .035, 18), gear, x, 1.73, 0, body).rotation.z = Math.PI / 2;
    add(new THREE.CylinderGeometry(.02, .02, .037, 12), glow, x * 1.06, 1.73, 0, body).rotation.z = Math.PI / 2;
  });
  const boom = add(new THREE.CylinderGeometry(.006, .006, .13, 6), gear, .095, 1.69, .06, body); boom.rotation.set(Math.PI / 2.4, 0, .5);
  add(rbox(.28, .36, .11, .04), gear, 0, 1.2, -.165, body); // ba lô gọn
  add(rbox(.18, .015, .012, .005), glow, 0, 1.3, -.222, body);
  [-.09, .09].forEach((x, i) => {
    const hip = new THREE.Group(); hip.position.set(x, .9, 0); body.add(hip);
    add(new THREE.CylinderGeometry(.072, .06, .44, 14), jeans, 0, -.22, 0, hip);
    add(new THREE.CylinderGeometry(.058, .05, .4, 14), jeans, 0, -.62, 0, hip);
    add(rbox(.11, .08, .26, .035), shoe, 0, -.85, .05, hip);
    add(rbox(.115, .025, .27, .01), sole, 0, -.895, .05, hip);
    legs[i] = hip;
  });
  [-.235, .235].forEach((x) => {
    const sh = new THREE.Group(); sh.position.set(x, 1.47, 0); sh.rotation.z = x < 0 ? -.07 : .07; body.add(sh);
    add(new THREE.CylinderGeometry(.056, .05, .33, 12), jacket, 0, -.16, 0, sh);
    add(new THREE.CylinderGeometry(.049, .043, .3, 12), jacket, 0, -.47, 0, sh);
    add(new THREE.CylinderGeometry(.046, .046, .025, 12), glow, 0, -.61, 0, sh);
    add(new THREE.SphereGeometry(.044, 12, 10), skin, 0, -.66, 0, sh);
    ARMS.push(sh);
  });
  body.traverse((o) => { if (o.isMesh) o.castShadow = true; });
})();

/* ---------- 4. Phối cảnh buổi tối ---------- */
const PX_BG = {};
function gradTex(key, stops) {
  if (!PX_BG[key]) PX_BG[key] = tex(4, 256, (g, w, h) => { const r = g.createLinearGradient(0, 0, 0, h); stops.forEach(([p, c]) => r.addColorStop(p, c)); g.fillStyle = r; g.fillRect(0, 0, w, h); });
  return PX_BG[key];
}
const graded = new WeakSet();
function gradeMat(m) {
  if (!m || graded.has(m)) return; graded.add(m);
  // vệt nắng, cột sáng (vật liệu không chịu sáng, trong suốt): dịu bớt để không chói lóa
  if (m.isMeshBasicMaterial && m.transparent && !m.userData.keep) { m.opacity *= .5; return; }
  if (!m.isMeshStandardMaterial) return;
  // Ánh sáng môi trường mạnh làm cảnh phẳng như ban trưa: giữ thấp để bóng tối và đèn tạo chiều sâu.
  m.envMapIntensity = m.metalness > .5 ? .55 : (CH && CH.outdoor ? .18 : .28);
  if (m.userData.keep) return;
  const lit = m.emissive && m.emissiveIntensity > 0 && m.emissive.getHex() !== 0;
  if (!lit) {
    const hsl = {}; m.color.getHSL(hsl);
    hsl.s *= .5; if (hsl.l > .36) hsl.l = .36 + (hsl.l - .36) * .3;
    m.color.setHSL(hsl.h, hsl.s, hsl.l);
  }
  if (m.map) m.color.multiplyScalar(.5);
}
function restyle() {
  const out = CH && CH.outdoor, dark = CH && CH.dark;
  S.background = out ? gradTex('dusk', [[0, '#0b1530'], [.45, '#2a3a63'], [.8, '#7a5a6e'], [1, '#d08a5c']])
    : dark ? gradTex('srv', [[0, '#070b14'], [1, '#03050a']]) : gradTex('eve', [[0, '#1c2638'], [1, '#0a0f18']]);
  S.fog.color.set(out ? 0x2b3352 : dark ? 0x05080f : 0x0e1420);
  S.fog.near = out ? 16 : 22; S.fog.far = out ? 42 : 46;
  sun.color.set(out ? 0xffc79a : 0xffe2c2); sun.intensity = out ? .32 : dark ? .3 : .6;
  hemi.color.set(0x9fb6dc); hemi.groundColor.set(0x262320); hemi.intensity = out ? .14 : dark ? .14 : .22;
  rim.color.set(0x60a5fa); rim.intensity = out ? .28 : .5;
  R.toneMappingExposure = dark ? 1.05 : out ? .9 : .8;
}
// Dải LED chân tường và mép tường: chạy sau hàm room() hiện có.
const roomBase = room;
room = function (map, wallC, h) {
  roomBase(map, wallC, h);
  const led = keepMat(new THREE.MeshBasicMaterial({ color: CH && CH.dark ? 0x38bdf8 : 0x22d3ee }));
  const add2 = (w, d, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, .025, d), led); m.position.set(x, y, z); W.add(m); };
  add2(13.4, .02, 0, .2, -4.84); add2(.02, 9.4, -6.84, .2, 0); add2(.02, 9.4, 6.84, .2, 0);
  const top = keepMat(new THREE.MeshBasicMaterial({ color: 0x0ea5e9, transparent: true, opacity: .55 }));
  [[13.4, .02, 0, h - .06, -4.84], [.02, 9.4, -6.84, h - .06, 0], [.02, 9.4, 6.84, h - .06, 0]].forEach(([w, d, x, y, z]) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, .02, d), top); m.position.set(x, y, z); W.add(m); });
};

/* ---------- 5. Chương 4: ngã tư thành phố lúc chạng vạng ---------- */
function carBody(g, col, amb) {
  g.children.slice().forEach((c) => g.remove(c));
  const paint = keepMat(mat(col, .55, .3)), glass = keepMat(mat(0x0b1220, .7, .1)), tyre = keepMat(mat(0x0d0f12, 0, .85)), rimM = keepMat(mat(0x9ca3af, .9, .3));
  add(rbox(1.02, .24, .5, .08), paint, 0, .27, 0, g);
  add(rbox(.6, .2, .45, .08), glass, -.06, .48, 0, g);
  add(rbox(.5, .035, .44, .015), paint, -.06, .6, 0, g);
  [[.33, .23], [.33, -.23], [-.33, .23], [-.33, -.23]].forEach(([x, z]) => {
    add(new THREE.CylinderGeometry(.11, .11, .08, 18), tyre, x, .12, z, g).rotation.x = Math.PI / 2;
    add(new THREE.CylinderGeometry(.06, .06, .085, 12), rimM, x, .12, z, g).rotation.x = Math.PI / 2;
  });
  const head = keepMat(new THREE.MeshBasicMaterial({ color: 0xfff4dc })), tail = keepMat(new THREE.MeshBasicMaterial({ color: 0xff2a2a }));
  [.15, -.15].forEach((z) => { add(new THREE.BoxGeometry(.02, .05, .11), head, .515, .3, z, g); add(new THREE.BoxGeometry(.02, .045, .1), tail, -.515, .3, z, g); });
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(1.4, .8), new THREE.MeshBasicMaterial({ map: PX_POOL, transparent: true, opacity: .55, depthWrite: false, blending: THREE.AdditiveBlending }));
  pool.rotation.x = -Math.PI / 2; pool.position.set(1.15, .02, 0); g.add(pool);
  g.traverse((o) => { if (o.isMesh && o !== pool) o.castShadow = true; });
  if (!amb) return null;
  add(rbox(1.03, .05, .51, .02), keepMat(mat(0xdc2626, 0, .5)), 0, .32, 0, g);
  return add(rbox(.2, .07, .32, .03), keepMat(new THREE.MeshStandardMaterial({ color: 0xe11d48, emissive: 0xe11d48, emissiveIntensity: 2 })), -.06, .66, 0, g);
}
const PX_POOL = tex(128, 64, (g) => { const r = g.createRadialGradient(40, 32, 2, 64, 32, 64); r.addColorStop(0, 'rgba(255,240,200,.9)'); r.addColorStop(1, 'rgba(255,240,200,0)'); g.fillStyle = r; g.fillRect(0, 0, 128, 64); });
const PX_WIN = tex(128, 256, (g, w, h) => {
  g.fillStyle = '#0c111b'; g.fillRect(0, 0, w, h);
  for (let y = 10; y < h - 10; y += 18) for (let x = 8; x < w - 8; x += 15) { const on = Math.random() < .42; g.fillStyle = on ? (Math.random() < .55 ? '#fbbf6a' : '#d6ecff') : '#161e2b'; g.fillRect(x, y, 9, 11); }
});
const build4 = CHS[4].build;
CHS[4].build = function () {
  build4.call(this);
  const asphalt = keepMat(mat(0x20242a, .15, .5)), side = keepMat(mat(0x3a3f46, 0, .85)), white = keepMat(mat(0xd9dee5, 0, .6)), yellow = keepMat(mat(0xd4a514, 0, .6));
  FL.material = side;
  W.traverse((o) => { if (o.isMesh && o.geometry.type === 'PlaneGeometry' && o.material.color && o.material.color.getHex() === 0x475569) o.material = asphalt; });
  const ground = add(new THREE.PlaneGeometry(80, 80), keepMat(mat(0x2b3036, 0, .9)), 0, -.02, 0); ground.rotation.x = -Math.PI / 2;
  const r1 = add(new THREE.PlaneGeometry(60, 1.8), asphalt, 0, .006, 0); r1.rotation.x = -Math.PI / 2;
  const r2 = add(new THREE.PlaneGeometry(1.8, 60), asphalt, 0, .007, 0); r2.rotation.x = -Math.PI / 2;
  for (let i = 7.2; i <= 26; i += 1.2) [i, -i].forEach((v) => add(new THREE.PlaneGeometry(.6, .06), yellow, v, .02, 0).rotation.x = -Math.PI / 2);
  for (let i = 4.9; i <= 26; i += 1.2) [i, -i].forEach((v) => add(new THREE.PlaneGeometry(.06, .6), yellow, 0, .02, v).rotation.x = -Math.PI / 2);
  for (let k = -.7; k <= .7; k += .28) { // vạch qua đường
    add(new THREE.PlaneGeometry(.16, .5), white, 1.35, .021, k).rotation.x = -Math.PI / 2;
    add(new THREE.PlaneGeometry(.16, .5), white, -1.35, .021, k).rotation.x = -Math.PI / 2;
    const a = add(new THREE.PlaneGeometry(.5, .16), white, k, .021, 1.35); a.rotation.x = -Math.PI / 2;
    const b = add(new THREE.PlaneGeometry(.5, .16), white, k, .021, -1.35); b.rotation.x = -Math.PI / 2;
  }
  const winM = keepMat(new THREE.MeshStandardMaterial({ color: 0x1b2230, roughness: .85, emissive: 0xffffff, emissiveMap: PX_WIN, emissiveIntensity: .85 }));
  const blocks = [[-13, -12, 5, 9], [-6, -13, 6, 12], [2, -12.5, 5, 7], [9, -12, 6, 10], [15, -9, 5, 8], [-16, -4, 5, 7], [16, 3, 5, 11], [-15, 6, 6, 9], [11, 11, 7, 6], [-6, 13, 6, 8], [4, 14, 5, 10]];
  blocks.forEach(([x, z, w, h]) => { const m = add(new THREE.BoxGeometry(w, h, w * .8), winM, x, h / 2 - .02, z); m.castShadow = false; });
  const poleM = keepMat(mat(0x2a2f36, .7, .35)), lampM = keepMat(new THREE.MeshBasicMaterial({ color: 0xffe2b0 }));
  [[3.4, 1.4, -1], [-3.4, -1.4, 1]].forEach(([x, z, d]) => {
    add(new THREE.CylinderGeometry(.05, .06, 3.2, 10), poleM, x, 1.6, z);
    add(rbox(.9, .05, .08, .02), poleM, x - .4 * d, 3.18, z);
    add(rbox(.3, .05, .16, .02), lampM, x - .8 * d, 3.13, z);
    const pl = new THREE.PointLight(0xffc98a, 1.6, 9, 2); pl.position.set(x - .8 * d, 3, z); W.add(pl);
    box(x - .12, x + .12, z - .12, z + .12);
  });
  this.cars.forEach((c, i) => carBody(c.g, [0x1f2937, 0xe5e7eb, 0x7f1d1d, 0x1e3a8a][i % 4]));
  this.siren = carBody(this.amb.g, 0xf3f4f6, true);
  this.cfg = { first: 0, ew: 4, ns: 4, y: 1 };
  this.honk = 0;
};
CHS[4].light = function (ax) {
  if (this.mode === 'chaos') return 'g';
  if (this.mode === 'pri' && this.amb.g.visible && this.amb.s < .6) return ax === 1 ? 'g' : 'r';
  const c = this.cfg || { first: 0, ew: 4, ns: 4, y: 1 };
  const ph = c.first === 0 ? [[0, c.ew], [1, c.ns]] : [[1, c.ns], [0, c.ew]];
  let t = this.pt % (c.ew + c.ns + 2 * c.y);
  for (const [a, g] of ph) { if (t < g) return ax === a ? 'g' : 'r'; t -= g; if (t < c.y) return ax === a ? 'y' : 'r'; t -= c.y; }
  return 'r';
};
CHS[4].tick = function (dt) {
  if (!(dt > 0)) return;
  this.pt += dt; this.honk -= dt;
  this.heads.forEach((L, i) => { const s = this.light(i); ['r', 'y', 'g'].forEach((k) => (L[k].material.emissiveIntensity = s === k ? 2.4 : 0)); });
  const px = P.position.x, pz = P.position.z;
  this.cars.forEach((c) => {
    if (!c.g.visible) return;
    const lt = this.light(c.ax);
    let lim = 99;
    if (this.mode === 'chaos' && !c.amb) lim = c.ax ? -.2 : .2;
    // xe đã dừng đúng vạch (s = -1,3) vẫn phải chờ: bản gốc dùng s < -1,3 nên xe dừng xong lại vượt đèn đỏ
    else if (c.s < -1.29 && lt !== 'g') lim = -1.3;
    this.cars.forEach((o) => { if (o !== c && o.g.visible && o.ax === c.ax && o.s > c.s && o.s - c.s < 1.4) lim = Math.min(lim, o.s - 1.2); });
    const inLane = c.ax === 0 ? Math.abs(pz - .45) < .6 && px > c.s : Math.abs(px + .45) < .6 && pz > c.s; // người chơi đứng trên làn: xe dừng
    const ahead = c.ax === 0 ? px : pz;
    if (inLane && ahead - c.s < 2.2) { lim = Math.min(lim, ahead - 1.05); if (this.honk <= 0 && c.v < .3 && ahead - c.s < 1.3) { beep(330, .18, .04, 'square'); setTimeout(() => beep(330, .18, .04, 'square'), 220); this.honk = 2.5; } }
    c.v = Math.min(2.6, c.v + 3 * dt);
    let ns = Math.min(c.s + c.v * dt, lim); if (ns < c.s) ns = c.s;
    c.v = (ns - c.s) / dt; c.s = ns;
    if (c.s > 16) { c.s = -16; if (c.amb) c.g.visible = false; }
    if (c.ax === 0) { c.g.position.set(c.s, 0, .45); c.g.rotation.y = 0; } else { c.g.position.set(-.45, 0, c.s); c.g.rotation.y = -Math.PI / 2; }
  });
  this.bang.visible = this.mode === 'chaos' || (si === 1 && this.mode !== 'pri');
  if (si === 1) setS(this.bang, 'Xe cấp cứu bị kẹt!', '#e11d48');
  if (this.siren) { const on = Math.floor(tm * 6) % 2; this.siren.material.emissive.setHex(on ? 0xe11d48 : 0x2563eb); this.siren.material.color.setHex(on ? 0xe11d48 : 0x2563eb); }
};

// Chương 5 (gác mái): mái nghiêng phía trước nằm giữa camera và phòng, che gần hết màn hình. Ẩn đi (kiểu cắt nhà búp bê).
const build5 = CHS[5].build;
CHS[5].build = function () {
  build5.call(this);
  W.children.forEach((o) => { if (o.isMesh && o.geometry.type === 'PlaneGeometry' && o.geometry.parameters.height === 4.2 && o.position.z > 0) o.visible = false; });
};

/* Thử thách 1 chương 4: chương trình đèn 5 tham số (khai báo lại rules1). */
function rules1() {
  const sel = (id, ops) => `<select id="${id}"><option value="">chọn…</option>${ops.map(([v, t]) => `<option value="${v}">${t}</option>`).join('')}</select>`;
  const lamp = [['g', 'xanh'], ['r', 'đỏ'], ['y', 'vàng']];
  mg(`<div class="hard-tag">Thử thách 1 · Lập trình bộ điều khiển</div><div style="font-size:17px;font-weight:500;margin-bottom:4px">Viết lại chương trình đèn tín hiệu</div>
<div style="font-size:13px;color:#475569;margin-bottom:10px;line-height:1.55">Đông–Tây là trục chính, lượng xe gấp đôi Bắc–Nam. Xe chạy khoảng 36 km/h (10 m/s); tài xế mất khoảng 1 giây để phản ứng và thêm khoảng 2 giây để phanh dừng hẳn.</div>
<div class="cb">LẶP LẠI:</div>
<div class="cb">&nbsp; Pha 1: Đông–Tây ${sel('a', lamp)} &nbsp;Bắc–Nam ${sel('b', lamp)}</div>
<div class="cb">&nbsp; Thời gian xanh: ${sel('e', [['eq', 'hai hướng bằng nhau'], ['ew', 'Đông–Tây gấp đôi Bắc–Nam'], ['ns', 'Bắc–Nam gấp đôi Đông–Tây']])}</div>
<div class="cb">&nbsp; Trước khi đổi pha, bật vàng ${sel('r4c', [['0', '0 giây (đổi ngay)'], ['1', '1 giây'], ['3', '3 giây']])}</div>
<div class="cb">&nbsp; Khi một hướng đang vàng, hướng kia ${sel('d', [['g', 'vẫn xanh'], ['r', 'giữ đỏ']])}</div>
<div class="cb">&nbsp; Pha 2: đảo ngược màu đèn hai hướng</div>
<div id="fb" style="font-size:13px;min-height:20px;margin-top:10px;line-height:1.5"></div><div style="text-align:right;margin-top:6px"><button class="bt" id="run">Chạy thử</button></div>`);
  $('run').onclick = () => {
    const v = (k) => $(k).value, a = v('a'), b = v('b'), e = v('e'), c = v('r4c'), d = v('d');
    if (!a || !b || !e || !c || !d) { $('fb').innerHTML = '<span style="color:#be123c">Hãy chọn đủ cả năm ô.</span>'; return; }
    const err = a === 'y' || b === 'y' ? 'Pha bắt đầu bằng đèn vàng thì không hướng nào được đi; vàng chỉ để báo sắp đổi.'
      : a === b ? (a === 'g' ? 'Hai hướng cùng xanh thì hai dòng xe cắt nhau giữa ngã tư.' : 'Hai hướng cùng đỏ thì không ai đi được.')
      : c === '0' ? 'Đổi ngay không qua vàng: xe đang chạy 10 m/s không kịp dừng trước vạch.'
      : c === '1' ? 'Vàng 1 giây chỉ đủ để tài xế phản ứng (1 giây), chưa đủ thời gian phanh (thêm 2 giây). Tính lại tổng thời gian cần để dừng.'
      : d === 'g' ? 'Hướng đang vàng vẫn còn xe đi qua giao lộ; nếu hướng kia xanh ngay thì hai dòng xe xung đột.'
      : e === 'eq' ? 'Đèn an toàn rồi, nhưng trục Đông–Tây có lượng xe gấp đôi mà thời gian xanh bằng nhau thì trục chính sẽ ùn. Chia thời gian theo lưu lượng.'
      : e === 'ns' ? 'Ngược rồi: hướng nhiều xe hơn (Đông–Tây) mới cần xanh lâu hơn.' : null;
    if (err) { bad(); $('fb').innerHTML = `<span style="color:#be123c">${err}</span>`; return; }
    good(); $('fb').textContent = 'Chương trình hợp lý: hai hướng luân phiên, vàng 3 giây, hướng kia giữ đỏ, trục chính xanh lâu hơn.';
    setTimeout(() => {
      mgClose(); CH.mode = 'normal'; CH.pt = 0; CH.cfg = { first: a === 'g' ? 0 : 1, ew: 5, ns: 2.5, y: 1.5 }; jingle();
      talk([['NOVA', 'Giao lộ chạy lại theo chương trình mới (mô phỏng đã tua nhanh thời gian).'], ['GLITCH', 'Để xem nó xử lý thế nào khi có một xe cấp cứu đang tới.']], adv);
    }, 1400);
  };
}
/* Thử thách 2 chương 4: xếp ba luật theo thứ tự xét (khai báo lại rules2). */
function rules2() {
  const order = ['cycle', 'rush', 'pri'];
  const TX = { cycle: 'NẾU (luôn đúng) THÌ chạy chu kỳ xanh – vàng – đỏ như bình thường', rush: 'NẾU đang giờ cao điểm THÌ kéo dài đèn xanh cho Đông–Tây', pri: 'NẾU cảm biến phát hiện xe cấp cứu THÌ bật xanh cho hướng của xe cấp cứu, đỏ hướng kia' };
  function draw(msg) {
    mg(`<div class="hard-tag">Thử thách 2 · Thứ tự ưu tiên</div><div style="font-size:17px;font-weight:500;margin-bottom:4px">Sắp xếp lại ba luật</div><div style="font-size:13px;color:#475569;margin-bottom:10px;line-height:1.55">Bộ điều khiển xét từ trên xuống, gặp luật đầu tiên đúng điều kiện thì làm theo và bỏ qua các luật còn lại. Bây giờ là giờ cao điểm và xe cấp cứu đang tới từ hướng Bắc.</div>${order.map((k, i) => `<div class="cb" style="justify-content:space-between"><span><b style="font-weight:500">${i + 1}.</b> ${TX[k]}</span><span style="display:flex;gap:4px;flex-shrink:0"><button class="bt2" data-u="${i}" style="padding:4px 8px" aria-label="Lên"><i class="ti ti-arrow-up" aria-hidden="true"></i></button><button class="bt2" data-d="${i}" style="padding:4px 8px" aria-label="Xuống"><i class="ti ti-arrow-down" aria-hidden="true"></i></button></span></div>`).join('')}<div id="fb" style="font-size:13px;min-height:20px;margin-top:10px;line-height:1.5">${msg || ''}</div><div style="text-align:right;margin-top:6px"><button class="bt" id="run">Chạy thử</button></div>`);
    document.querySelectorAll('#mgb [data-u],#mgb [data-d]').forEach((b) => (b.onclick = () => { const i = +(b.dataset.u || b.dataset.d), j = b.dataset.u !== undefined ? i - 1 : i + 1; if (j < 0 || j > 2) return; [order[i], order[j]] = [order[j], order[i]]; beep(700, .06, .03); draw(); }));
    $('run').onclick = () => {
      const err = order[0] === 'cycle' || order[1] === 'cycle' ? 'Luật chu kỳ luôn đúng: đứng ở đâu thì mọi luật bên dưới nó không bao giờ được xét. Nó phải ở cuối, giống nhánh NGƯỢC LẠI.'
        : order[0] === 'rush' ? 'Giờ cao điểm thì luật cao điểm đúng trước, bật xanh Đông–Tây; xe cấp cứu từ hướng Bắc vẫn phải chờ.' : null;
      if (err) { bad(); draw(`<span style="color:#be123c">${err}</span>`); return; }
      good(); $('fb').textContent = 'Chính xác: luật ưu tiên cao nhất đứng đầu, luật "luôn đúng" để cuối cùng.';
      setTimeout(() => { mgClose(); CH.mode = 'pri'; jingle(); talk([['NOVA', 'Đèn tự chuyển xanh cho xe cấp cứu. Mảnh mã khóa thứ tư đã hiện cạnh hộp điều khiển.']], () => { keyAt(2.6, 1.4, -.6); adv(); }); }, 1400);
    };
  }
  draw();
}

/* ---------- 6. Độ khó: xáo đáp án, bài kiểm tra kỹ thuật trước khi nhặt mảnh mã khóa ---------- */
const quizBase = quiz;
quiz = function (tag, title, desc, ops, ok) { return quizBase(tag, title, desc, shuffleArr(ops.slice()), ok); };

const HARD = {
  1: [
    { q: 'Video 6 GB không chép được vào USB còn trống 10 GB. Nguyên nhân hợp lý nhất?', d: 'USB đang định dạng FAT32.', ops: [
      { t: 'FAT32 giới hạn mỗi tệp tối đa 4 GB', ok: 1, e: 'Đúng. FAT32 lưu kích thước tệp bằng 32 bit nên một tệp không vượt quá 4 GB. Định dạng lại sang exFAT hoặc NTFS sẽ chép được.' },
      { t: 'Dung lượng tính theo GiB nên 10 GB thực ra chỉ còn 6 GB', e: 'Chênh lệch GB và GiB chỉ khoảng 7%; 10 GB vẫn còn khoảng 9,3 GiB.' },
      { t: 'USB bị nhiễm mã độc', e: 'Mã độc không tạo ra giới hạn đúng 4 GB như vậy; lỗi chỉ xảy ra với tệp lớn hơn 4 GB.' },
      { t: 'Video phải nén thành .zip mới chép được', e: 'Nén không bắt buộc; vấn đề nằm ở hệ thống tệp.' }] },
    { q: 'Ảnh 1920 × 1080 điểm ảnh, mỗi điểm 24 bit, lưu không nén chiếm khoảng bao nhiêu?', ops: [
      { t: 'Khoảng 6 MB', ok: 1, e: '1920 × 1080 × 3 byte = 6 220 800 byte, khoảng 6 MB.' },
      { t: 'Khoảng 50 MB', e: 'Đó là số bit (khoảng 49,8 triệu bit), chưa chia cho 8.' },
      { t: 'Khoảng 2 MB', e: 'Mỗi điểm 24 bit là 3 byte, không phải 1 byte.' },
      { t: 'Khoảng 600 KB', e: 'Đó là cỡ thường gặp sau khi nén JPEG, không phải ảnh thô.' }] },
  ],
  2: [
    { q: 'Router 192.168.1.1, mặt nạ 255.255.255.0. Địa chỉ tĩnh nào gán cho máy in dùng được?', ops: [
      { t: '192.168.1.77', ok: 1, e: 'Cùng mạng 192.168.1.0/24, không trùng router, không phải địa chỉ mạng hay địa chỉ quảng bá.' },
      { t: '192.168.1.255', e: 'Đây là địa chỉ quảng bá (broadcast) của mạng, không gán cho thiết bị.' },
      { t: '192.168.1.0', e: 'Đây là địa chỉ mạng, không gán cho thiết bị.' },
      { t: '192.168.2.77', e: 'Khác mạng (192.168.2.x) nên không giao tiếp trực tiếp với router 192.168.1.1.' }] },
    { q: 'Laptop ping 8.8.8.8 thành công nhưng mở edunova.vn báo "không tìm thấy máy chủ". Lỗi ở đâu?', ops: [
      { t: 'Máy chủ DNS', ok: 1, e: 'Ping bằng địa chỉ IP thành công nghĩa là đường truyền và gateway đều ổn; chỉ khâu đổi tên miền thành IP (DNS) hỏng.' },
      { t: 'Gateway sai', e: 'Nếu gateway sai thì không ping được ra 8.8.8.8 ngoài Internet.' },
      { t: 'Dây mạng lỏng', e: 'Dây lỏng thì mất mọi kết nối, kể cả ping.' },
      { t: 'Trùng địa chỉ IP', e: 'Trùng IP làm mọi kết nối chập chờn, không chỉ riêng tên miền.' }] },
  ],
  3: [
    { q: 'Mã QR bị xước một góc nhưng vẫn quét được. Vì sao?', ops: [
      { t: 'Mã QR chứa thêm dữ liệu sửa lỗi (Reed–Solomon)', ok: 1, e: 'QR có 4 mức sửa lỗi L, M, Q, H, khôi phục được khoảng 7% đến 30% dữ liệu hỏng.' },
      { t: 'Ba ô vuông lớn ở góc lưu bản sao dữ liệu', e: 'Ba ô lớn là mẫu định vị để xác định hướng và kích thước, không chứa dữ liệu.' },
      { t: 'Điện thoại đoán nội dung từ các mã đã quét trước', e: 'Ứng dụng quét giải mã từ chính các ô, không đoán.' },
      { t: 'Mã QR lưu toàn bộ nội dung hai lần', e: 'Không lặp toàn bộ; phần dư thừa là mã sửa lỗi được tính toán.' }] },
    { q: 'Quét mã QR để chuyển khoản, dấu hiệu nào cho thấy mã có thể đã bị tráo?', ops: [
      { t: 'Tên người nhận hiện ra khác tên cửa hàng', ok: 1, e: 'Ứng dụng ngân hàng hiện tên chủ tài khoản nhận tiền; khác tên cửa hàng là dấu hiệu tráo mã.' },
      { t: 'Giữa mã QR có logo', e: 'Logo ở giữa là bình thường nhờ khả năng sửa lỗi của QR.' },
      { t: 'Phải tự nhập số tiền', e: 'Mã QR tĩnh thường để người mua tự nhập số tiền.' },
      { t: 'Mã in trên giấy decal', e: 'Chất liệu in không cho biết mã thật hay giả.' }] },
  ],
  4: [
    { q: 'Bộ điều khiển xét lần lượt: NẾU t < 6 THÌ Đông–Tây xanh; NẾU t < 8 THÌ Đông–Tây vàng; NẾU t < 11 THÌ Bắc–Nam xanh; NGƯỢC LẠI Bắc–Nam vàng. Tại t = 7, hướng nào đang được đi?', ops: [
      { t: 'Đông–Tây (đèn vàng)', ok: 1, e: 't = 7: luật 1 sai (7 không nhỏ hơn 6), luật 2 đúng nên Đông–Tây vàng và các luật sau không được xét.' },
      { t: 'Bắc–Nam (đèn xanh)', e: 'Điều kiện 7 < 11 đúng, nhưng luật 2 đứng trước đã đúng nên luật 3 không được xét.' },
      { t: 'Cả hai hướng', e: 'Mỗi lần chỉ một luật được thực hiện, nên chỉ một hướng được đi.' },
      { t: 'Không hướng nào', e: 'Luật 2 đúng điều kiện nên vẫn có một hướng được đi.' }] },
  ],
  5: [
    { q: 'Mô hình lọc thư rác đúng 99% trên dữ liệu đã học nhưng chỉ đúng 70% với thư mới. Đây là hiện tượng gì?', ops: [
      { t: 'Quá khớp: mô hình học thuộc dữ liệu huấn luyện', ok: 1, e: 'Mô hình nhớ chi tiết của dữ liệu cũ thay vì quy luật chung; cần dữ liệu đa dạng hơn hoặc mô hình đơn giản hơn.' },
      { t: 'Mô hình chưa đủ phức tạp', e: 'Mô hình quá đơn giản thì đã sai nhiều ngay trên dữ liệu huấn luyện.' },
      { t: 'Thư mới bị mã hóa', e: 'Thư được đọc như văn bản bình thường; vấn đề nằm ở cách mô hình học.' },
      { t: 'Máy tính chạy quá chậm', e: 'Tốc độ máy không làm thay đổi độ chính xác.' }] },
    { q: '1000 thư gồm 950 thư thường và 50 thư rác. Một mô hình luôn trả lời "thư thường". Độ chính xác của nó là bao nhiêu?', ops: [
      { t: '95%', ok: 1, e: 'Đúng 950/1000 nhưng không bắt được thư rác nào: độ chính xác cao vẫn có thể vô dụng khi dữ liệu lệch.' },
      { t: '50%', e: 'Nó đúng với toàn bộ 950 thư thường, không phải một nửa.' },
      { t: '5%', e: '5% là tỉ lệ thư rác, cũng là phần nó bỏ sót.' },
      { t: '0%', e: 'Nó vẫn đúng với mọi thư thường.' }] },
  ],
};
function hardRun(list, done) {
  let i = 0;
  const step = () => {
    const q = list[i], ops = shuffleArr(q.ops.slice());
    mg(`<div class="hard-tag">Kiểm tra kỹ thuật ${i + 1}/${list.length}</div><div style="font-size:17px;font-weight:500;margin-bottom:4px;line-height:1.45">${q.q}</div>${q.d ? `<div style="font-size:13px;color:#475569;margin-bottom:12px">${q.d}</div>` : '<div style="height:8px"></div>'}<div style="display:grid;gap:8px">${ops.map((o, j) => `<button class="op" data-j="${j}">${o.t}</button>`).join('')}</div><div id="fb" style="font-size:13px;min-height:20px;margin-top:10px;line-height:1.5"></div><div style="text-align:right;margin-top:6px"><button class="bt" id="hnext" style="display:none">${i + 1 < list.length ? 'Câu tiếp theo' : 'Mở khóa mảnh mã'}</button></div>`);
    document.querySelectorAll('#mgb .op').forEach((b) => (b.onclick = () => {
      if (b.disabled) return;
      const o = ops[+b.dataset.j]; $('fb').textContent = o.e;
      if (o.ok) { b.classList.add('good'); good(); document.querySelectorAll('#mgb .op').forEach((x) => (x.disabled = true)); $('hnext').style.display = ''; $('hnext').focus(); }
      else { b.classList.remove('shake'); void b.offsetWidth; b.classList.add('bad', 'shake'); b.disabled = true; bad(); }
    }));
    $('hnext').onclick = () => { i++; if (i < list.length) step(); else { mgClose(); done(); } };
  };
  talk([['NOVA', 'Mảnh mã khóa này được bảo vệ bằng một bài kiểm tra kỹ thuật. Trả lời đúng để mở khóa; mỗi lần chọn sai mất một sao.']], step);
}
// Mỗi lần vào phòng (kể cả chơi lại cùng phòng): đặt lại ánh sáng buổi tối và bài kiểm tra kỹ thuật.
const loadPro = load;
load = function (n) { const r = loadPro(n); restyle(); if (CH) CH.hardOk = 0; return r; };
const interactBase = interact;
interact = function () {
  if (!$('mg').classList.contains('hidden')) return;
  if (nearI && nearI.k === 'key' && !inDlg && HARD[CH.n] && !CH.hardOk) { hardRun(HARD[CH.n], () => { CH.hardOk = 1; interactBase(); }); return; }
  interactBase();
};
$('prompt').onclick = () => interact();

/* ---------- Vòng lặp phụ: phối cảnh theo phòng, chỉnh màu vật liệu mới, tự giảm hiệu ứng khi máy yếu ---------- */
(function proLoop(now) {
  if (CH !== PX.lastCH) { PX.lastCH = CH; restyle(); }
  if (W) W.traverse((o) => { if (o.isMesh) { const m = o.material; if (Array.isArray(m)) m.forEach(gradeMat); else gradeMat(m); } });
  if (PX.on && !PX.force && st === 'play') {
    if (!PX.t0) PX.t0 = now;
    PX.frames++;
    if (now - PX.t0 > 4000) { const fps = PX.frames * 1000 / (now - PX.t0); PX.slow = fps < 26 ? PX.slow + 1 : 0; PX.frames = 0; PX.t0 = now; if (PX.slow >= 2) { PX.on = false; toast('Đã tắt bớt hiệu ứng ánh sáng để trò chơi chạy mượt hơn.', 2600); } }
  }
  requestAnimationFrame(proLoop);
})(0);
