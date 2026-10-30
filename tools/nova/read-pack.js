/* ===== Gói dễ đọc và sửa lỗi cho "Sự cố ở Ngôi nhà Nova" =====
 * Chèn sau gói âm thanh (tools/nova/build.mjs).
 * 1. Cỡ chữ: mặc định lớn hơn bản gốc; nút "A+" trên thanh trên cùng đổi Vừa / Lớn / Rất lớn (nhớ trên trình duyệt).
 *    Chữ trong khung thoại, bảng thử thách, thông báo, nhãn 3D đều phóng theo.
 * 2. Sửa lỗi kẹt: ở chương 2 và 3 điểm xuất phát nằm trong vùng va chạm của ghế sofa nên nhân vật không đi được.
 *    Sau khi vào phòng, nếu chỗ đứng bị chặn thì dời ra ô trống gần nhất.
 */
const TS_LEVELS = [{ k: 1.12, t: 'Vừa' }, { k: 1.3, t: 'Lớn' }, { k: 1.5, t: 'Rất lớn' }];
let tsI = (() => { try { const raw = localStorage.getItem('nova_text'), v = raw === null ? 1 : +raw; return v >= 0 && v < TS_LEVELS.length ? v : 1; } catch (e) { return 1; } })();

// Mọi cỡ chữ cố định (viết trong thuộc tính style hoặc lớp CSS của trò chơi) nhân với --ts.
(function textCss() {
  const sizes = [10.5, 11, 11.5, 12, 12.5, 13, 13.5, 14, 14.5, 16, 17, 18, 19, 20];
  const inline = sizes.map((s) => `.g [style*="font-size:${s}px"]{font-size:calc(${s}px * var(--ts))!important}`).join('\n');
  const cls = [['.chip', 12.5], ['.toast', 13], ['.op', 13.5], ['.bt', 14], ['.bt2', 13.5], ['.cb', 12.5], ['.cb select', 12.5], ['.phs', 12], ['.slot', 12.5], ['.prt', 13], ['.port', 12], ['.term', 12], ['input[type=text]', 14]]
    .map(([c, s]) => `.g ${c}{font-size:calc(${s}px * var(--ts))}`).join('\n');
  const st = document.createElement('style');
  st.textContent = `${inline}\n${cls}
.g{--ts:1.3}
.g #mg .pn{width:min(680px,95%)!important}
.g #clr .pn{width:min(420px,94%)!important}
.g #title .pn{width:min(400px,94%)!important}
.g #map .pn{width:min(620px,95%)!important}
.g .toast{max-width:min(460px,90%)}
.g #dtx{line-height:1.6}
.g .op{padding:12px 14px}`;
  document.head.appendChild(st);
})();

const tsBtn = document.createElement('button'); tsBtn.className = 'chip'; tsBtn.style.cssText = 'border:none;cursor:pointer;font-weight:600;min-width:38px';
$('mute').parentElement.insertBefore(tsBtn, $('mapb'));
function labelScale() { return 1 + (TS_LEVELS[tsI].k - 1) * .8; }
function applyTs() {
  const L = TS_LEVELS[tsI];
  G.style.setProperty('--ts', String(L.k));
  tsBtn.textContent = 'A+';
  tsBtn.setAttribute('aria-label', `Cỡ chữ: ${L.t}. Bấm để đổi`); tsBtn.title = tsBtn.getAttribute('aria-label');
  if (typeof W !== 'undefined' && W) W.traverse((o) => { if (o.isSprite && o.userData.base) o.scale.set(o.userData.base[0] * labelScale(), o.userData.base[1] * labelScale(), 1); });
}
tsBtn.onclick = () => { tsI = (tsI + 1) % TS_LEVELS.length; try { localStorage.setItem('nova_text', String(tsI)); } catch (e) { /* bộ nhớ bị chặn */ } applyTs(); toast(`Cỡ chữ: <b style="font-weight:600">${TS_LEVELS[tsI].t}</b>`, 1400); };

// Nhãn 3D (bảng tên thiết bị): ghi lại kích thước gốc rồi phóng theo cỡ chữ. Khai báo lại spr (khai báo sau thắng).
function spr(t, bg, sc) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 96;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthTest: false, transparent: true }));
  s.userData.c = c; s.userData.base = [1.9 * (sc || 1), .36 * (sc || 1)];
  s.scale.set(s.userData.base[0] * labelScale(), s.userData.base[1] * labelScale(), 1); s.renderOrder = 8; W.add(s);
  if (t) setS(s, t, bg);
  return s;
}

// Điểm xuất phát bị kẹt trong đồ vật: dời ra ô trống gần nhất (ưu tiên phía trước phòng).
function unstick() {
  if (!P || !blocked(P.position.x, P.position.z)) return;
  const x0 = P.position.x, z0 = P.position.z;
  for (let r = .2; r <= 5; r += .15) {
    for (let a = 0; a < 24; a++) {
      const ang = Math.PI / 2 + (a % 2 ? 1 : -1) * Math.ceil(a / 2) * (Math.PI / 12); // bắt đầu từ phía trước phòng (+z), quét dần sang hai bên
      const x = x0 + Math.cos(ang) * r, z = z0 + Math.sin(ang) * r;
      if (!blocked(x, z) && [[.12, 0], [-.12, 0], [0, .12], [0, -.12]].some(([dx, dz]) => !blocked(x + dx, z + dz))) { P.position.x = x; P.position.z = z; return; }
    }
  }
}
const _loadOrig = load;
load = function (n) { const r = _loadOrig(n); unstick(); applyTs(); return r; };
applyTs();
