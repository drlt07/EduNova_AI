/* ===== Gói hình ảnh "dễ thương" cho kịch bản 1 · Sự cố ở Ngôi nhà Nova =====
 * Dùng thay look-pack.js: giữ nhân vật chibi đội mũ và căn phòng pastel sáng của gói đồ họa, phủ tông hồng
 * cho phòng, nhân vật và giao diện. Luật chơi, độ khó và các bản sửa lỗi lấy từ pro-pack.js, giống bản THPT.
 */
const PINK = { sky: [0xffe4ef, 0xffeaf3, 0xfff0f6, 0xffe9f2, 0xfde2ff, 0x2a1830], wall: [0xffe4ec, 0xffeef4, 0xfff1f5, 0, 0xfbe7ff, 0x3b2440] };
// Màu nền và tường theo từng phòng (chương 4 ngoài trời giữ trời xanh pha hồng, phòng máy chủ tím đêm).
[1, 2, 3, 5, 6].forEach((n) => { CHS[n].bg = PINK.sky[n - 1]; });
CHS[4].bg = 0xdbeafe;
const cuteRoomBase = room;
room = function (map, wallC, h) { cuteRoomBase(map, (CH && PINK.wall[CH.n - 1]) || wallC, h); };

/* ---------- Giao diện: bảng trắng bo tròn, điểm nhấn hồng ---------- */
(function cuteCss() {
  const st = document.createElement('style');
  st.textContent = `
.g{font-family:"Nunito","Segoe UI",system-ui,-apple-system,Roboto,sans-serif;background:#ffe4ef}
.g .pn{border-radius:22px!important;border:2px solid #fbcfe8!important;box-shadow:0 18px 40px rgba(236,72,153,.18)}
.g .dlg{border-radius:20px!important;border:2px solid #fbcfe8!important;box-shadow:0 10px 30px rgba(236,72,153,.15)}
.g .chip{background:rgba(219,39,119,.78);border-radius:999px}
.g .chip:empty,.g #hudL:has(#cht:empty){display:none}
.g #title .pn>div:first-child{background:#f9a8d4!important;color:#831843!important}
.g .toast{border:2px solid #f9a8d4;border-radius:16px}
.g .bt{background:linear-gradient(180deg,#f472b6,#db2777);border-radius:999px;box-shadow:0 6px 14px rgba(219,39,119,.3)}
.g .bt2{border-radius:999px;border-color:#f9a8d4}
.g .op{border-radius:14px}
.g .op:hover{border-color:#f472b6;background:#fdf2f8}
.g .rm.open{border-color:#ec4899;background:#fdf2f8}
.g .prompt{background:linear-gradient(180deg,#f472b6,#db2777)}
.g input[type=text]{border-radius:999px;border-color:#f9a8d4}
.g .hard-tag{display:inline-block;font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#be185d;background:#fce7f3;border-radius:999px;padding:2px 10px;margin-bottom:6px}
.g #title{background:radial-gradient(ellipse at 50% 40%,rgba(251,207,232,.55),rgba(131,24,67,.35))!important}`;
  document.head.appendChild(st);
})();

/* ---------- Nhân vật: áo hoodie hồng, mũ kem, ba lô tím nhạt ---------- */
(function cuteHero() {
  const swap = { 0x4338ca: 0xf472b6, 0x312e81: 0xdb2777, 0x3730a3: 0xec4899, 0xfbbf24: 0xfff1c1, 0xf59e0b: 0xf9a8d4, 0x0e7490: 0xc4b5fd, 0x155e75: 0xa78bfa, 0x1e293b: 0x6b7280 };
  const seen = new Set();
  body.traverse((o) => { if (!o.isMesh || seen.has(o.material)) return; seen.add(o.material); const c = swap[o.material.color.getHex()]; if (c !== undefined) o.material.color.setHex(c); });
})();
// Trợ lý NOVA và mũi tên dẫn đường cũng hồng.
core.material.color.setHex(0xbe185d); core.material.emissive.setHex(0xf472b6); nring.material.color.setHex(0xfbcfe8);
ah.material.color.setHex(0xf472b6); ah.material.emissive.setHex(0xec4899); BEA.material.color.setHex(0xf472b6);

/* ---------- Chương 4: ngã tư ban ngày, vỉa hè hồng, cỏ bạc hà ---------- */
const cuteBuild4 = CHS[4].build;
CHS[4].build = function () {
  cuteBuild4.call(this);
  const tint = { 0x2b3036: 0x7fcf9b, 0x3a3f46: 0xeaa5c4, 0x20242a: 0x6b7280, 0x1b2230: 0xe9a8f0 };
  const seen = new Set();
  W.traverse((o) => {
    if (!o.isMesh || seen.has(o.material)) return; seen.add(o.material);
    const c = tint[o.material.color && o.material.color.getHex()]; if (c !== undefined) o.material.color.setHex(c);
    if (o.material.emissiveMap) o.material.emissiveIntensity = .25;
    if (o.material.blending === THREE.AdditiveBlending) o.material.opacity = .12; // vệt đèn pha ban ngày
  });
};
