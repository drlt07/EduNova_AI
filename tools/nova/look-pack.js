/* ===== Gói hình ảnh "THPT" cho Phiêu lưu Nova =====
 * Chèn sau pro-pack.js (luật chơi, sửa lỗi, độ khó) ở các kịch bản phong cách trưởng thành (tools/nova/build.mjs).
 * 1. Hậu kỳ: bloom (vật phát sáng tỏa sáng), chỉnh màu điện ảnh, viền tối, hạt nhiễu nhẹ. Máy yếu tự tắt bớt.
 * 2. Giao diện kính tối, nhãn 3D tối.
 * 3. Nhân vật tỉ lệ người thật (áo khoác kỹ thuật, tai nghe).
 * 4. Phối cảnh buổi tối: màu vật liệu trầm, dải đèn LED; ngã tư chương 4 lúc chạng vạng.
 * Bản dễ thương (cute-pack.js) dùng thay gói này.
 */
const PX = { on: true, comp: null, w: 0, h: 0, pr: 0, lastCH: null, slow: 0, frames: 0, t0: 0 };
const V2 = (x, y) => new THREE.Vector2(x, y);

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
.g .chip:empty,.g #hudL:has(#cht:empty){display:none}
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
