/* ===== Gói luật chơi cho "Sự cố ở Ngôi nhà Nova" (dùng chung mọi giao diện) =====
 * Chèn sau các gói đồ họa, âm thanh, cỡ chữ (tools/nova/build.mjs); gói hình ảnh (look-pack.js hoặc cute-pack.js) chèn sau.
 * 1. Độ khó: đáp án xáo trộn; mỗi chương có bài kiểm tra kỹ thuật trước khi nhặt mảnh mã khóa;
 *    chương 4 viết chương trình đèn 5 tham số và xếp 3 luật ưu tiên.
 * 2. Chương 4: đường kéo dài (xe không còn chạy ra khoảng trống), xe dừng ở vạch khi đèn đỏ, dừng khi người chơi
 *    đứng trên làn; xe có bánh, kính, đèn. Chương 5: ẩn mái gác che màn hình.
 */
const shuffleArr = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const keepMat = (m) => { m.userData.keep = 1; return m; };

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
load = function (n) { const r = loadPro(n); if (typeof restyle === 'function') restyle(); if (CH) CH.hardOk = 0; return r; };
const interactBase = interact;
interact = function () {
  if (!$('mg').classList.contains('hidden')) return;
  if (nearI && nearI.k === 'key' && !inDlg && HARD[CH.n] && !CH.hardOk) { hardRun(HARD[CH.n], () => { CH.hardOk = 1; interactBase(); }); return; }
  interactBase();
};
$('prompt').onclick = () => interact();
