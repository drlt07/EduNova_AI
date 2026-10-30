/* ===== Kịch bản 2 · "Đêm trước kỳ thi" =====
 * Dùng lại lõi trò chơi của kịch bản 1 cùng các gói đồ họa, âm thanh, cỡ chữ, phong cách THPT; thay toàn bộ 6 chương.
 * Chèn sau pro-pack.js, chỉ khi đóng gói kịch bản 2 (tools/nova/build.mjs).
 * Cơ chế riêng: đồng hồ đếm ngược tới 6:00 sáng thay cho sao; mỗi lần chọn sai mất 10 phút; hết giờ chơi lại chương.
 * Nội dung: biểu diễn thông tin (Tin 10), CSDL và SQL (Tin 11), tìm kiếm và sắp xếp (Tin 10–11), Python (Tin 10),
 * HTML/CSS và đường link (Tin 12), an ninh mạng và pháp luật (Tin 10, 12). Câu đố và lời thoại viết mới.
 */
WHO.GLITCH = ['KHÓA ĐEN', '#e11d48', 'ti-lock', '#9f1239'];
WHO.CO = ['Cô Hạnh · GV Tin học', '#8b5cf6', 'ti-school', '#6d28d9'];
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const shuf = (a) => shuffleArr(a.slice());
const fbErr = (t) => `<span style="color:#be123c">${t}</span>`;

/* ---------- Đồng hồ đếm ngược ---------- */
const S2 = { start: [0, 1320, 1410, 60, 150, 240, 300], budget: [0, 90, 90, 90, 90, 60, 60], left: 90, rate: 5, pen: 10, failed: false };
const hhmm = (m) => { m = ((Math.round(m) % 1440) + 1440) % 1440; return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; };
function hud() {
  if (stars < 3 && st === 'play') { S2.left -= S2.pen * (3 - stars); stars = 3; toast(`<b style="font-weight:600">Mất ${S2.pen} phút</b> vì chọn sai`, 1600); }
  $('keys').innerHTML = '<i class="ti ti-key" aria-hidden="true"></i> ' + keyN + '/5';
  if (!CH) return;
  const n = CH.n, now = S2.start[n] + (S2.budget[n] - Math.max(0, S2.left)), low = S2.left < 15;
  $('stars').innerHTML = `<span style="color:${low ? '#fb7185' : '#e2e8f0'};font-variant-numeric:tabular-nums"><i class="ti ti-clock" aria-hidden="true"></i> ${hhmm(now)}</span> <span style="opacity:.6">· còn ${Math.max(0, Math.ceil(S2.left))} phút</span>`;
}
// Sao cuối chương tính theo thời gian còn lại (khai báo lại finish).
function finish() {
  const r = Math.max(0, S2.left) / S2.budget[CH.n];
  stars = r >= .5 ? 3 : r >= .25 ? 2 : 1;
  SAVE.done[CH.n] = Math.max(SAVE.done[CH.n] || 0, stars); save();
}
const loadS2 = load;
load = function (n) { S2.left = S2.budget[n]; S2.failed = false; return loadS2(n); };
setInterval(() => {
  if (!CH || st !== 'play' || inDlg || S2.failed || CH.won || document.hidden) return;
  if (!$('clr').classList.contains('hidden') || !$('map').classList.contains('hidden')) return;
  S2.left -= .25 / S2.rate; hud();
  if (S2.left <= 0) {
    S2.failed = true; beep(220, .5, .06, 'sawtooth');
    mg(`<div style="text-align:center"><div class="hard-tag">Hết giờ</div><div style="font-size:18px;font-weight:600;margin:4px 0">Đã quá hạn của phòng này</div><div style="font-size:13px;color:#475569;margin:6px 0 14px;line-height:1.55">KHÓA ĐEN kịp mã hóa thêm dữ liệu. Chơi lại phòng này; đọc kỹ đề trước khi chọn để không mất thời gian.</div><button class="bt" id="re2">Chơi lại phòng</button></div>`);
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

/* =================== Chương 1 · Phòng máy: biểu diễn thông tin =================== */
CHS[1] = {
  n: 1, t: 'Chương 1 · Phòng máy', room: 'Phòng máy', ic: 'ti-binary', bg: 0x1c2638, gl: [4.5, 2.3, -3.6],
  sum: ['Chữ số cũng là ký tự: "0" có mã ASCII 48', 'Một byte 8 bit biểu diễn số từ 0 đến 255', 'Tệp UTF-8 phải mở bằng UTF-8, sai bảng mã thì lỗi chữ'],
  build() {
    room(grid('#273140', '#334155', 6), 0xc9ced6, 2.4);
    [-2.6, -.6, 1.4].forEach((z) => { desk(-4.1, z, 2.6, { pcs: [-.6, .6], free: 1 }); desk(4.1, z, 2.6, { pcs: [-.6, .6], free: 1 }); box(-5.4, -2.8, z - .4, z + .4); box(2.8, 5.4, z - .4, z + .4); });
    this.note = desk(0, -3.7, 2.4, { wood: 1, tex: screenTex(['GHI CHÚ CỦA CÔ:', '00110001 00110111', '00110011'], '#1a2332', '#fde68a') });
    const wb = tex(512, 256, (g, w, h) => { g.fillStyle = '#e8ecef'; g.fillRect(0, 0, w, h); g.fillStyle = '#1e3a8a'; g.font = '600 30px sans-serif'; g.fillText('Bảng mã ASCII', 24, 46); g.font = '26px monospace'; ['"0" = 48 … "9" = 57', '"A" = 65 … "Z" = 90', '"a" = 97 … "z" = 122', '1 byte = 8 bit: 0 … 255'].forEach((t, i) => g.fillText(t, 24, 96 + i * 38)); });
    add(rbox(3, 1.4, .05, .02), mat(0x9ca3af, .5, .4), -3.4, 1.6, -4.84); add(new THREE.PlaneGeometry(2.86, 1.28), new THREE.MeshBasicMaterial({ map: wb }), -3.4, 1.6, -4.8);
    add(rbox(.5, .7, .08, .02), mat(0x1f2937, .6, .3), 5.2, 1.3, -4.8);
    this.pad = new THREE.MeshBasicMaterial({ color: 0xe11d48 }); keepMat(this.pad); add(new THREE.PlaneGeometry(.3, .12), this.pad, 5.2, 1.45, -4.75);
    spr('Cửa phòng máy chủ', '#e11d48', .6).position.set(5.2, 2.05, -4.6);
    spr('Bàn giáo viên', '#8b5cf6', .6).position.set(0, 1.7, -3.7);
    plant(6.2, 4.2); plant(-6.2, 4.2);
  },
  start: [['GLITCH', 'Toàn bộ hệ thống Trường THPT Nova đã bị KHÓA ĐEN mã hóa. Muốn có đề thi trước 6 giờ sáng thì chuẩn bị tiền chuộc.'],
    ['NOVA', '{n}, mình là NOVA, trợ lý của đội Tin học. Chúng ta sẽ không trả tiền chuộc. Ta còn thời gian đến 6 giờ sáng.'],
    ['CO', 'Cô là Hạnh, giáo viên Tin học. Mật khẩu cửa phòng máy chủ đã bị đổi; cô kịp chép lại dạng nhị phân trên màn hình bàn giáo viên.'],
    ['NOVA', 'Đồng hồ ở góc phải đang chạy. Mỗi lần chọn sai mất 10 phút, nên đọc kỹ đề trước khi chọn.']],
  steps: [
    { o: 'Giải mã ghi chú trên bàn giáo viên', at: [0, -2.7], t: 'Đọc ghi chú nhị phân', f() { s2Ascii(); } },
    { o: 'Mở khóa bảng điều khiển cửa phòng máy chủ', at: [5.2, -3.9], t: 'Nhập mã mở khóa', f() { s2Bits(); } },
    { o: 'Sửa tệp danh sách thí sinh bị lỗi chữ', at: [-3.5, 2.6], t: 'Mở tệp danh sách', f() { s2Encoding(); } },
    { o: 'Nhặt mảnh mã khóa', key: 1 }],
};
function s2Ascii() {
  const bytes = ['00110001', '00110111', '00110011'], ans = ['1', '7', '3'];
  const sel = (i) => `<select id="as${i}"><option value="">?</option>${'0123456789'.split('').map((d) => `<option>${d}</option>`).join('')}</select>`;
  mg(`${tag('Thử thách 1 · Mã ASCII')}${h2('Ghi chú nhị phân của cô Hạnh')}${desc('Mỗi nhóm 8 bit là mã ASCII của một ký tự. Đổi từng byte sang thập phân rồi tra bảng: "0" = 48, "1" = 49, … "9" = 57.')}
${bytes.map((b, i) => `<div class="cb" style="justify-content:space-between"><span>Byte ${i + 1}: <b style="letter-spacing:.12em">${b}</b></span><span>ký tự ${sel(i)}</span></div>`).join('')}${fbBox}${runBtn('chk', 'Kiểm tra')}`);
  $('chk').onclick = () => {
    const v = ans.map((_, i) => $('as' + i).value);
    if (v.some((x) => !x)) { $('fb').innerHTML = fbErr('Chọn ký tự cho cả ba byte.'); return; }
    const k = v.findIndex((x, i) => x !== ans[i]);
    if (k >= 0) { bad(); const d = parseInt(bytes[k], 2); $('fb').innerHTML = fbErr(`Byte ${k + 1} chưa đúng. Gợi ý: ${bytes[k]} = ${d} trong hệ thập phân; lấy ${d} − 48.`); return; }
    good(); $('fb').textContent = 'Ba byte là các ký tự "1", "7", "3": mã cửa là 173. Lưu ý: chữ số trên màn hình cũng là ký tự, có mã riêng.';
    doneStep([['NOVA', 'Mã cửa là 173. Bảng điều khiển cửa chỉ nhận 8 công tắc bit, cần đổi 173 sang nhị phân.']]);
  };
}
function s2Bits() {
  const W8 = [128, 64, 32, 16, 8, 4, 2, 1], on = W8.map(() => 0);
  const draw = (msg) => {
    const v = W8.reduce((a, w, i) => a + (on[i] ? w : 0), 0);
    mg(`${tag('Thử thách 2 · Số nhị phân')}${h2('Bật đúng các công tắc để tạo số 173')}${desc('Mỗi công tắc là một bit, bit bên trái có trọng số lớn nhất. Tổng trọng số các bit đang bật chính là giá trị của byte.')}
<div style="display:grid;grid-template-columns:repeat(8,1fr);gap:6px">${W8.map((w, i) => `<button class="op" data-b="${i}" style="flex-direction:column;align-items:center;justify-content:center;padding:8px 2px;${on[i] ? 'border-color:#22d3ee;background:rgba(8,145,178,.25)' : ''}"><b style="font-size:20px">${on[i]}</b><span style="font-size:11px;opacity:.7">${w}</span></button>`).join('')}</div>
<div class="term" style="min-height:0;margin-top:10px">${on.join('')} (2) = ${v} (10)</div><div id="fb" style="font-size:13px;min-height:20px;margin-top:10px;line-height:1.55">${msg || ''}</div>${runBtn('unl', 'Mở khóa')}`);
    document.querySelectorAll('#mgb [data-b]').forEach((b) => (b.onclick = () => { on[+b.dataset.b] ^= 1; beep(600 + +b.dataset.b * 40, .05, .03); draw(); }));
    $('unl').onclick = () => {
      if (v !== 173) { bad(); draw(fbErr(`Byte hiện là ${v}, chưa phải 173. Cách nhanh: lấy 173 trừ dần trọng số lớn nhất còn trừ được (173 − 128 = 45, 45 − 32 = 13, …).`)); return; }
      good(); CH.pad.color.set(0x22c55e); $('fb').textContent = '10101101 = 128 + 32 + 8 + 4 + 1 = 173. Cửa đã mở.';
      doneStep([['CO', 'Cửa mở rồi! Nhưng tệp danh sách thí sinh trên máy dãy trái hiện toàn chữ lạ. Không có danh sách thì không xếp được phòng thi.']]);
    };
  };
  draw();
}
function s2Encoding() {
  quiz('Thử thách 3 · Bảng mã ký tự', 'Tệp danh sách mở ra hiện "NguyÃªn VÄƒn An" thay vì "Nguyên Văn An". Làm gì để sửa?',
    'Tệp được lưu bằng UTF-8, mỗi chữ có dấu tiếng Việt chiếm 2–3 byte.', [
      { i: 'ti-file-text', t: 'Mở lại tệp và chọn bảng mã UTF-8', ok: 1, e: 'Đúng. Phần mềm đang đọc từng byte như một ký tự Latin-1 nên mỗi chữ có dấu tách thành 2–3 ký tự lạ. Đọc đúng bảng mã UTF-8 thì chữ hiện lại.' },
      { i: 'ti-file-text', t: 'Đổi phông chữ sang Times New Roman', e: 'Phông chữ chỉ quyết định hình dáng nét chữ; dữ liệu đã bị đọc sai bảng mã từ trước.' },
      { i: 'ti-file-text', t: 'Lưu lại tệp theo bảng mã ASCII', e: 'ASCII chỉ có 128 ký tự, không có chữ có dấu tiếng Việt; lưu như vậy còn làm mất thêm dữ liệu.' },
      { i: 'ti-file-text', t: 'Gõ lại toàn bộ danh sách', e: 'Dữ liệu không mất, chỉ bị đọc sai. Gõ lại mất nhiều giờ và dễ sai sót.' }],
    () => { jingle(); talk([['NOVA', 'Danh sách 65 thí sinh đã hiện đúng. Mảnh mã khóa đầu tiên đang ở cạnh máy chủ phòng máy.']], toKey(-1.5, -1.6)); });
}

/* =================== Chương 2 · Phòng giáo vụ: CSDL và SQL =================== */
const DIEM = [
  ['A01', 'Lê Minh Anh', '12A1', 'Toán', 6.5, 'gv_hanh', '16:02'], ['A02', 'Trần Bảo', '12A1', 'Toán', 9.8, 'admin_tmp', '22:07'],
  ['A03', 'Phạm Chi', '12A2', 'Văn', 7.0, 'gv_long', '15:40'], ['A04', 'Đỗ Dũng', '12A2', 'Toán', 9.6, 'admin_tmp', '22:08'],
  ['A05', 'Vũ Hà', '12A1', 'Anh', 9.4, 'gv_mai', '14:10'], ['A06', 'Ngô Khánh', '12A3', 'Văn', 9.9, 'admin_tmp', '22:09'],
  ['A07', 'Bùi Lan', '12A3', 'Toán', 5.5, 'gv_hanh', '16:05'], ['A08', 'Hồ Nam', '12A2', 'Anh', 9.7, 'admin_tmp', '22:11']];
CHS[2] = {
  n: 2, t: 'Chương 2 · Phòng giáo vụ', room: 'Phòng giáo vụ', ic: 'ti-database', bg: 0x1c2638, gl: [-4, 2.3, -3.4],
  sum: ['SELECT … WHERE lọc đúng các dòng cần tìm', 'UPDATE luôn cần WHERE, nếu không sẽ sửa cả bảng', 'Khóa chính và CHECK chặn dữ liệu trùng và sai miền giá trị'],
  build() {
    room(stripes('#4a3a2e', '#43352a', 4), 0xc8c1b6, 2.4);
    desk(-2.6, -3.2, 2, { tex: screenTex(['SELECT * FROM DIEM', 'WHERE ...', '_'], '#0b1525', '#86efac') });
    desk(2.6, -3.2, 2, { tex: screenTex(['DIEM:', 'PRIMARY KEY ?', 'CHECK ?'], '#0b1525', '#fde68a') });
    for (let i = 0; i < 4; i++) { add(rbox(.9, 1.4, .6, .03), mat(0x6b7280, .7, .35), -6.3, .7, -3.2 + i * 1.1); add(rbox(.5, .04, .02, .01), mat(0xd1d5db, .9, .2), -5.99, 1.1, -3.2 + i * 1.1).rotation.y = Math.PI / 2; }
    box(-6.8, -5.8, -3.8, 0.4);
    add(rbox(1.2, 1.9, .7, .04), mat(0x334155, .7, .3), 6, .95, -3.8); box(5.4, 6.6, -4.2, -3.4);
    spr('Tủ sao lưu', '#0e7490', .6).position.set(6, 2.2, -3.8);
    add(rbox(1.4, .9, .9, .05), mat(0xe5e7eb, .2, .5), 4.8, .45, 2.4); box(4.1, 5.5, 1.9, 2.9);
    plant(-6.2, 4.2); plant(6.2, 4.2);
  },
  start: [['CO', 'Máy giáo vụ ghi nhận có người sửa điểm lúc gần 22 giờ. Cô nghi có tài khoản lạ.'], ['GLITCH', 'Vài điểm 9, điểm 10 cho vui thôi mà. Ai mà biết dòng nào là thật?'], ['NOVA', 'Cơ sở dữ liệu biết: bảng DIEM lưu cả người sửa và giờ sửa. {n}, viết truy vấn tìm các dòng bị sửa.']],
  steps: [
    { o: 'Truy vấn bảng điểm trên máy giáo vụ', at: [-2.6, -2.2], t: 'Viết truy vấn SQL', f() { s2Sql(); } },
    { o: 'Khôi phục điểm từ tủ sao lưu', at: [5.4, -2.8], t: 'Chạy lệnh khôi phục', f() { s2Update(); } },
    { o: 'Đặt ràng buộc cho bảng điểm', at: [2.6, -2.2], t: 'Cài ràng buộc', f() { s2Constraint(); } },
    { o: 'Nhặt mảnh mã khóa', key: 1 }],
};
function s2Sql() {
  const S_ = (id, ops) => `<select id="${id}">${ops.map(([v, t]) => `<option value="${v}">${esc(t)}</option>`).join('')}</select>`;
  mg(`${tag('Thử thách 1 · Truy vấn SQL')}${h2('Tìm mọi dòng điểm bị tài khoản lạ sửa')}${desc('Bảng DIEM(SBD, HoTen, Lop, Mon, Diem, NguoiSua, LucSua). Bảng HOCSINH(SBD, HoTen, NgaySinh) không có cột điểm.')}
<div class="cb">SELECT ${S_('q1', [['all', '*'], ['few', 'SBD, HoTen, Mon, Diem']])}</div>
<div class="cb">FROM ${S_('q2', [['diem', 'DIEM'], ['hs', 'HOCSINH']])}</div>
<div class="cb">WHERE ${S_('q3', [['none', '(không lọc)'], ['hi', 'Diem > 9'], ['who', "NguoiSua = 'admin_tmp'"], ['lop', "Lop = '12A1'"]])};</div>
<div id="res" style="margin-top:8px"></div>${fbBox}${runBtn('run2', 'Chạy truy vấn')}`);
  $('run2').onclick = () => {
    const q1 = $('q1').value, q2 = $('q2').value, q3 = $('q3').value;
    if (q2 === 'hs') { bad(); $('res').innerHTML = '<div class="term" style="min-height:0;color:#fda4af">Lỗi: bảng HOCSINH không có cột Diem, NguoiSua.</div>'; $('fb').textContent = ''; return; }
    const f = { none: () => true, hi: (r) => r[4] > 9, who: (r) => r[5] === 'admin_tmp', lop: (r) => r[2] === '12A1' }[q3];
    const rows = DIEM.filter(f), cols = q1 === 'all' ? [0, 1, 2, 3, 4, 5, 6] : [0, 1, 3, 4], H = ['SBD', 'HoTen', 'Lop', 'Mon', 'Diem', 'NguoiSua', 'LucSua'];
    $('res').innerHTML = `<div class="term" style="min-height:0;white-space:normal;overflow:auto"><table style="border-collapse:collapse;font-size:12px;width:100%"><tr>${cols.map((c) => `<th style="text-align:left;padding:2px 6px;color:#94a3b8;font-weight:500">${H[c]}</th>`).join('')}</tr>${rows.map((r) => `<tr>${cols.map((c) => `<td style="padding:2px 6px;color:${r[5] === 'admin_tmp' ? '#fda4af' : '#e2e8f0'}">${esc(r[c])}</td>`).join('')}</tr>`).join('')}</table><div style="opacity:.6;font-size:11.5px;margin-top:4px">${rows.length} dòng</div></div>`;
    if (q3 === 'who') { good(); $('fb').textContent = '4 dòng do admin_tmp sửa trong khoảng 22:07 – 22:11. Đây là các điểm cần khôi phục.'; doneStep([['NOVA', 'Đã khoanh vùng 4 dòng. Bản sao lưu lúc 18:00 nằm trong tủ sao lưu cạnh tường phải.']]); return; }
    bad();
    $('fb').innerHTML = fbErr(q3 === 'hi' ? 'Điểm cao chưa chắc là bị sửa: Vũ Hà 9,4 môn Anh do cô Mai nhập lúc 14:10. Lọc theo dấu vết của kẻ gian, không lọc theo điểm.'
      : q3 === 'none' ? 'Không lọc thì phải dò tay cả bảng; ở trường thật có hàng chục nghìn dòng.' : 'Lớp 12A1 có cả dòng bị sửa và dòng bình thường; điều kiện này không tách được hai loại.');
  };
}
function s2Update() {
  quiz('Thử thách 2 · Câu lệnh UPDATE', 'Câu lệnh nào khôi phục đúng 4 điểm bị sửa từ bảng SAOLUU?', 'SAOLUU có cùng cấu trúc với DIEM, chụp lúc 18:00.', [
    { i: 'ti-database', t: "UPDATE DIEM SET Diem = (SELECT S.Diem FROM SAOLUU S WHERE S.SBD = DIEM.SBD AND S.Mon = DIEM.Mon) WHERE NguoiSua = 'admin_tmp';", ok: 1, e: 'Đúng: chỉ sửa 4 dòng của admin_tmp, mỗi dòng lấy lại điểm cùng SBD và cùng môn trong bản sao lưu.' },
    { i: 'ti-database', t: 'UPDATE DIEM SET Diem = (SELECT S.Diem FROM SAOLUU S WHERE S.SBD = DIEM.SBD AND S.Mon = DIEM.Mon);', e: 'Thiếu WHERE nên ghi đè cả bảng, kể cả điểm thầy cô nhập đúng sau 18:00.' },
    { i: 'ti-database', t: "DELETE FROM DIEM WHERE NguoiSua = 'admin_tmp';", e: 'Xóa đi thì 4 học sinh mất luôn điểm môn đó, không phải khôi phục.' },
    { i: 'ti-database', t: "UPDATE SAOLUU SET Diem = (SELECT D.Diem FROM DIEM D WHERE D.SBD = SAOLUU.SBD AND D.Mon = SAOLUU.Mon);", e: 'Ngược chiều: lệnh này ghi điểm đã bị sửa đè lên bản sao lưu, mất luôn bản đúng.' }],
    () => { jingle(); talk([['CO', 'Bốn điểm đã về đúng. Nhưng nhật ký còn ghi một lệnh chèn dòng điểm 12 cho học sinh A02 môn Toán.'], ['NOVA', 'Cần ràng buộc để cơ sở dữ liệu tự chặn kiểu dữ liệu sai này. Máy bên phải đang mở cấu trúc bảng.']], adv); });
}
function s2Constraint() {
  quiz('Thử thách 3 · Ràng buộc dữ liệu', 'KHÓA ĐEN chèn dòng (A02, Toán, 12): trùng học sinh và môn đã có, điểm vượt thang 10. Cặp ràng buộc nào chặn được cả hai lỗi?', 'Bảng DIEM, mỗi học sinh có một điểm cho mỗi môn.', [
    { i: 'ti-shield', t: 'PRIMARY KEY (SBD, Mon) và CHECK (Diem BETWEEN 0 AND 10)', ok: 1, e: 'Khóa chính gồm SBD và Mon chặn dòng trùng học sinh và môn; CHECK chặn điểm ngoài thang 0–10.' },
    { i: 'ti-shield', t: 'PRIMARY KEY (SBD) và CHECK (Diem <= 10)', e: 'Khóa chính chỉ là SBD thì mỗi học sinh chỉ được có một dòng, tức một môn duy nhất.' },
    { i: 'ti-shield', t: 'UNIQUE (HoTen) và NOT NULL (Diem)', e: 'Trùng họ tên là chuyện bình thường; NOT NULL chỉ chặn ô trống, không chặn điểm 12.' },
    { i: 'ti-shield', t: 'FOREIGN KEY (SBD) REFERENCES HOCSINH(SBD)', e: 'Khóa ngoại chỉ bảo đảm SBD có trong bảng HOCSINH; không chặn trùng dòng hay điểm 12.' }],
    () => { jingle(); talk([['NOVA', 'Lệnh chèn điểm 12 bị từ chối, đúng như mong đợi. Mảnh mã khóa thứ hai đã hiện cạnh tủ hồ sơ.']], toKey(-4.6, .9)); });
}

/* =================== Chương 3 · Thư viện: tìm kiếm và sắp xếp =================== */
CHS[3] = {
  n: 3, t: 'Chương 3 · Thư viện', room: 'Thư viện', ic: 'ti-books', bg: 0x1c2638, gl: [3.6, 2.4, -3.6],
  sum: ['Tìm nhị phân chỉ dùng được trên danh sách đã sắp xếp', 'Mỗi lần so sánh loại bỏ một nửa: 15 hộp chỉ cần tối đa 4 lần', 'Số lần đổi chỗ của sắp xếp nổi bọt bằng số cặp nghịch thế'],
  build() {
    room(stripes('#3a2d24', '#33281f', 4), 0xd6cdbd, 2.6);
    shelf(-4.6, -4.5, 3.6); shelf(0, -4.5, 3.4); shelf(4.6, -4.5, 3.6);
    shelf(-6.45, -.6, 3, Math.PI / 2); shelf(6.45, -.6, 3, -Math.PI / 2);
    [[-2.6, .9], [2.6, .9]].forEach(([x, z]) => { add(rbox(2, .07, 1.1, .02), mat(0x5b3d28, 0, .5), x, .76, z); [-.85, .85].forEach((dx) => add(rbox(.06, .74, .9, .02), mat(0x3b2a1e, 0, .6), x + dx, .37, z)); add(new THREE.CylinderGeometry(.14, .18, .04, 16), mat(0xfef3c7, 0, .4, { emissive: 0xfde68a, emissiveIntensity: .8 }), x + .5, .82, z - .2); box(x - 1, x + 1, z - .55, z + .55); });
    add(rbox(2.2, .95, .7, .04), mat(0x4a3424, 0, .6), 0, .48, -1.8); box(-1.1, 1.1, -2.15, -1.45);
    spr('Kệ hồ sơ thí sinh', '#b45309', .6).position.set(-4.6, 2.6, -4.3);
    plant(-6.2, 4.2); plant(6.2, 4.2);
  },
  start: [['GLITCH', 'Ta trộn lại thứ tự phòng thi rồi. Còn hồ sơ gốc? Tìm trong 10.000 hồ sơ thì sáng mai chưa xong.'], ['NOVA', 'Hồ sơ trên kệ được xếp tăng dần theo số báo danh. Nếu biết cách tìm thì không cần lật từng hồ sơ.']],
  steps: [
    { o: 'Tìm hồ sơ gốc trên kệ (tối đa 4 lần mở)', at: [-4.6, -3.6], t: 'Tìm hồ sơ', f() { s2BinSearch(); } },
    { o: 'Xếp lại danh sách phòng thi trên bàn đọc', at: [2.6, 2.1], t: 'Sắp xếp danh sách', f() { s2Bubble(); } },
    { o: 'Trả lời thủ thư ở quầy', at: [0, -.9], t: 'Nói chuyện với thủ thư', f() { s2Log(); } },
    { o: 'Nhặt mảnh mã khóa', key: 1 }],
};
function s2BinSearch() {
  let arr, target, opened, left;
  const reset = () => { const s = new Set(); while (s.size < 15) s.add(100 + Math.floor(Math.random() * 900)); arr = [...s].sort((a, b) => a - b); target = arr[Math.floor(Math.random() * 15)]; opened = {}; left = 4; };
  const draw = (msg) => {
    mg(`${tag('Thử thách 1 · Tìm kiếm nhị phân')}${h2(`Tìm hồ sơ số báo danh ${target}`)}${desc('15 hộp hồ sơ xếp tăng dần theo số báo danh, nhưng nhãn đã bị che. Mỗi lần mở được xem số của một hộp. Chỉ được mở tối đa 4 lần.')}
<div style="display:grid;grid-template-columns:repeat(15,1fr);gap:3px">${arr.map((v, i) => `<button class="op" data-k="${i}" style="padding:10px 0;justify-content:center;font-size:12px;${opened[i] !== undefined ? (v === target ? 'border-color:#10b981;background:rgba(16,185,129,.2)' : 'opacity:.75') : ''}">${opened[i] !== undefined ? v : '?'}</button>`).join('')}</div>
<div style="font-size:12.5px;color:#64748b;margin-top:6px">Còn ${left} lần mở</div><div id="fb" style="font-size:13px;min-height:20px;margin-top:8px;line-height:1.55">${msg || ''}</div>`);
    document.querySelectorAll('#mgb [data-k]').forEach((b) => (b.onclick = () => {
      const i = +b.dataset.k; if (opened[i] !== undefined || left <= 0) return;
      opened[i] = arr[i]; left--; beep(520, .06, .03);
      if (arr[i] === target) { good(); draw(`Tìm thấy sau ${4 - left} lần mở. Mở hộp giữa rồi bỏ đi một nửa: 15 → 7 → 3 → 1, tối đa 4 lần.`); doneStep([['NOVA', 'Có hồ sơ gốc rồi. Danh sách phòng thi trên bàn đọc bên phải đang bị xáo trộn.']]); return; }
      if (left <= 0) { bad(); reset(); draw(fbErr('Hết 4 lần mở mà chưa thấy. Mở hộp ở giữa trước: số cần tìm lớn hơn thì bỏ nửa trái, nhỏ hơn thì bỏ nửa phải. Kệ đã được xếp lại, thử lần nữa.')); return; }
      draw(`Hộp ${i + 1} có số ${arr[i]}: ${target > arr[i] ? 'số cần tìm lớn hơn, nó nằm bên phải' : 'số cần tìm nhỏ hơn, nó nằm bên trái'}.`);
    }));
  };
  reset(); draw();
}
function s2Bubble() {
  const a = ['P07', 'P03', 'P09', 'P01', 'P05'];
  const inv = (x) => { let c = 0; for (let i = 0; i < x.length; i++) for (let j = i + 1; j < x.length; j++) if (x[i] > x[j]) c++; return c; };
  const need = inv(a); let swaps = 0;
  const draw = (msg) => {
    mg(`${tag('Thử thách 2 · Sắp xếp nổi bọt')}${h2('Xếp các phòng thi theo thứ tự tăng dần')}${desc(`Chỉ được đổi chỗ hai phòng đứng cạnh nhau (nút ⇄). Danh sách này cần đúng ${need} lần đổi chỗ; đổi một cặp đã đúng thứ tự là phí thời gian.`)}
<div style="display:flex;align-items:center;justify-content:center;gap:4px;flex-wrap:wrap">${a.map((v, i) => `<div class="cb" style="width:auto;padding:10px 12px;font-size:16px">${v}</div>${i < a.length - 1 ? `<button class="bt2" data-s="${i}" aria-label="Đổi chỗ ${v} và ${a[i + 1]}" style="padding:6px 8px">⇄</button>` : ''}`).join('')}</div>
<div style="font-size:12.5px;color:#64748b;margin-top:8px;text-align:center">Đã đổi ${swaps} lần · còn ${inv(a)} cặp sai thứ tự</div><div id="fb" style="font-size:13px;min-height:20px;margin-top:8px;line-height:1.55">${msg || ''}</div>`);
    document.querySelectorAll('#mgb [data-s]').forEach((b) => (b.onclick = () => {
      const i = +b.dataset.s;
      if (a[i] < a[i + 1]) { bad(); draw(fbErr(`${a[i]} và ${a[i + 1]} đã đúng thứ tự; đổi chỗ chỉ tạo thêm một cặp sai.`)); return; }
      [a[i], a[i + 1]] = [a[i + 1], a[i]]; swaps++; beep(700, .06, .03);
      if (inv(a) === 0) { good(); draw(`Xong sau ${swaps} lần đổi chỗ, bằng đúng số cặp nghịch thế ban đầu (${need}). Mỗi lần đổi chỗ hai phần tử kề nhau bị ngược chỉ sửa được một cặp.`); doneStep([['NOVA', 'Danh sách phòng thi đã đúng thứ tự. Thủ thư ở quầy đang cần hỏi một việc.']]); return; }
      draw();
    }));
  };
  draw();
}
function s2Log() {
  quiz('Thử thách 3 · Độ phức tạp', 'Thủ thư hỏi: kho có 10.000 hồ sơ đã xếp theo số báo danh. Tìm nhị phân cần tối đa bao nhiêu lần so sánh?', 'Mỗi lần so sánh loại đi một nửa số hồ sơ còn lại.', [
    { i: 'ti-search', t: '14 lần', ok: 1, e: '2^13 = 8192 < 10.000 ≤ 16.384 = 2^14, nên chỉ cần tối đa 14 lần chia đôi.' },
    { i: 'ti-search', t: '100 lần', e: '100 là căn bậc hai của 10.000; tìm nhị phân giảm theo lũy thừa của 2, không theo căn bậc hai.' },
    { i: 'ti-search', t: '5.000 lần', e: 'Đó là số lần trung bình của tìm tuần tự (lật lần lượt từng hồ sơ).' },
    { i: 'ti-search', t: '10.000 lần', e: 'Đó là trường hợp xấu nhất của tìm tuần tự.' }],
    () => { jingle(); talk([['NOVA', 'Chính xác. Mảnh mã khóa thứ ba nằm giữa hai bàn đọc.']], toKey(0, 1.2)); });
}

/* =================== Chương 4 · Phòng máy chủ: lập trình Python =================== */
CHS[4] = {
  n: 4, t: 'Chương 4 · Phòng máy chủ', room: 'Phòng máy chủ', ic: 'ti-code', bg: 0x0b111c, dark: 1, gl: [0, 2.6, -3.8],
  sum: ['Chia lấy phần nguyên phải làm tròn lên khi xếp phòng', 'range(a, b) bắt đầu từ a, kết thúc trước b', 'Kiểm tra danh sách rỗng trước khi chia cho len()'],
  build() {
    room(grid('#111827', '#1f2937', 6), 0x1f2937, 2.6);
    this.leds = [];
    [-3.6, -1.4, .8].forEach((z) => { rack(-5.6, z, this.leds); rack(5.6, z, this.leds); });
    [-2.6, -1.3, 1.3, 2.6].forEach((x) => rack(x, -4.3, this.leds));
    desk(0, -2.4, 2.2, { tex: screenTex(['Traceback (most recent', '  call last):', 'xep_phong.py line 2'], '#0b1525', '#fda4af') });
    spr('Bàn điều khiển', '#0e7490', .6).position.set(0, 1.75, -2.4);
    spr('Máy tính điểm', '#0e7490', .55).position.set(-4.8, 2.5, -1.4);
    spr('Máy thống kê phòng', '#0e7490', .55).position.set(4.8, 2.5, -1.4);
  },
  start: [['GLITCH', 'Chương trình xếp phòng thi của các ngươi đầy lỗi. Ta chẳng cần sửa gì, nó tự hỏng.'], ['CO', 'Máy chủ báo lỗi ở ba chương trình Python. Sáng mai cần cả ba để in danh sách phòng và bảng điểm.'], ['NOVA', 'Đọc code từng dòng, tự chạy thử trong đầu với dữ liệu thật. Đừng sửa cho đến khi biết chắc dòng nào sai.']],
  steps: [
    { o: 'Sửa chương trình xếp phòng ở bàn điều khiển', at: [0, -1.3], t: 'Mở chương trình xếp phòng', f() { s2Rooms(); } },
    { o: 'Kiểm tra chương trình tính điểm ở dãy máy trái', at: [-4.6, -.3], t: 'Chạy thử từng dòng', f() { s2Trace(); } },
    { o: 'Chặn lỗi phòng trống ở dãy máy phải', at: [4.6, -.3], t: 'Mở chương trình thống kê', f() { s2Zero(); } },
    { o: 'Nhặt mảnh mã khóa', key: 1 }],
  tick(dt) { this.leds.forEach((l, i) => { const r = Math.sin(tm * 4 + i * 1.3); l.material.emissive.setHex(si < 3 && r > .6 ? 0xe11d48 : 0x22c55e); l.material.emissiveIntensity = r > -.5 ? 1.4 : .15; }); },
};
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
function s2Rooms() {
  codeFix({
    tag: 'Thử thách 1 · Gỡ lỗi Python', title: 'Có 65 thí sinh, mỗi phòng 24 chỗ, nhưng chương trình chỉ xếp được 48 em',
    desc: 'Chạy với len(ds) = 65 và suc_chua = 24. Tính giá trị từng biến để tìm dòng sai.',
    code: ['def xep_phong(ds, suc_chua):', '    so_phong = len(ds) // suc_chua', '    phong = []', '    for i in range(so_phong):', '        phong.append(ds[i*suc_chua:(i+1)*suc_chua])', '    return phong'],
    bug: 1, lineHint: (i) => i === 4 ? 'Dòng cắt danh sách đúng: phòng i nhận các em từ i*24 đến trước (i+1)*24. Vấn đề là số vòng lặp.' : 'Dòng này chạy đúng. Hãy tính so_phong với 65 và 24.',
    fixes: [
      { t: 'so_phong = (len(ds) + suc_chua - 1) // suc_chua', ok: 1, e: '(65 + 23) // 24 = 3 phòng: chia rồi làm tròn lên, đúng cả khi chia hết (48 em → 2 phòng).' },
      { t: 'so_phong = len(ds) // suc_chua + 1', e: 'Với 65 em thì đúng, nhưng 48 em sẽ thành 3 phòng, có một phòng trống.' },
      { t: 'so_phong = round(len(ds) / suc_chua)', e: 'round làm tròn gần nhất: 50 em → 50/24 ≈ 2,08 → 2 phòng, vẫn sót 2 em.' },
      { t: 'so_phong = len(ds) / suc_chua', e: 'Phép / cho số thực (2,708…); range() không nhận số thực nên chương trình báo TypeError.' }],
  }, () => doneStep([['NOVA', '65 em đã có đủ 3 phòng. Chương trình tính điểm trung bình ở dãy máy bên trái cũng cho kết quả lạ.']]));
}
function s2Trace() {
  const code = ['diem = [7, 9, 4, 10]', 'tong = 0', 'for i in range(1, len(diem)):', '    tong += diem[i]', 'print(tong / len(diem))'];
  mg(`${tag('Thử thách 2 · Chạy thử bằng tay')}${h2('Chương trình này in ra gì?')}${codeBlock(code)}
<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:8px">${shuf([['5.75', 1, 'Đúng: range(1, 4) cho i = 1, 2, 3 nên tong = 9 + 4 + 10 = 23, chia 4 được 5.75. Điểm 7 đầu tiên bị bỏ sót.'], ['7.5', 0, '7.5 là điểm trung bình đúng nếu cộng đủ cả 4 điểm; hãy xem range(1, ...) bắt đầu từ đâu.'], ['7.67', 0, '23 / 3 = 7.67, nhưng chương trình chia cho len(diem) = 4, không phải 3.'], ['Lỗi IndexError', 0, 'Chỉ số chạy tới 3, vẫn nằm trong danh sách 4 phần tử nên không lỗi.']]).map(([t, ok, e]) => `<button class="op" data-ok="${ok}" data-e="${esc(e)}" style="justify-content:center;font-family:var(--font-mono)">${t}</button>`).join('')}</div>${fbBox}`);
  document.querySelectorAll('#mgb [data-ok]').forEach((b) => (b.onclick = () => {
    if (b.disabled) return;
    $('fb').textContent = b.dataset.e;
    if (b.dataset.ok !== '1') { b.classList.add('bad'); b.disabled = true; bad(); return; }
    b.classList.add('good'); good();
    setTimeout(() => codeFix({
      tag: 'Thử thách 2 · Sửa lỗi', title: 'Sửa để chương trình tính đúng điểm trung bình 7.5', desc: 'Điểm đầu tiên (7) đang bị bỏ qua.', code, bug: 2,
      lineHint: (i) => i === 3 ? 'Dòng cộng dồn đúng; vấn đề là i không bao giờ bằng 0.' : 'Dòng này đúng. Xem lại vòng lặp chạy những giá trị i nào.',
      fixes: [
        { t: 'for i in range(len(diem)):', ok: 1, e: 'range(4) cho i = 0, 1, 2, 3: cộng đủ 30, trung bình 7.5.' },
        { t: 'for i in range(1, len(diem) + 1):', e: 'i chạy tới 4 nhưng chỉ số cuối là 3: IndexError.' },
        { t: 'for i in range(0, len(diem) - 1):', e: 'i chạy 0, 1, 2: lại bỏ sót điểm 10 cuối cùng.' }],
    }, () => doneStep([['NOVA', 'Đúng 7.5 rồi. Còn chương trình thống kê ở dãy máy bên phải bị dừng giữa chừng.']])), 1500);
  }));
}
function s2Zero() {
  quiz('Thử thách 3 · Ngoại lệ', 'Phòng P12 chưa có thí sinh: diem = []. Dòng print(tong / len(diem)) gây ra gì và sửa thế nào?', 'Chương trình thống kê chạy lần lượt cho mọi phòng.', [
    { i: 'ti-bug', t: 'ZeroDivisionError; kiểm tra if len(diem) > 0 trước khi chia', ok: 1, e: 'len([]) = 0 nên phép chia cho 0 làm chương trình dừng. Kiểm tra trước rồi mới chia (hoặc dùng try/except ZeroDivisionError).' },
    { i: 'ti-bug', t: 'IndexError; bọc vòng for trong try', e: 'Vòng for trên danh sách rỗng không chạy lần nào nên không có IndexError.' },
    { i: 'ti-bug', t: 'Không lỗi, Python tự in 0', e: 'Python không tự trả về 0 khi chia cho 0; chương trình báo lỗi và dừng.' },
    { i: 'ti-bug', t: 'TypeError; đổi diem sang chuỗi', e: 'Kiểu dữ liệu vẫn đúng là số; lỗi nằm ở mẫu số bằng 0.' }],
    () => { jingle(); talk([['CO', 'Cả ba chương trình đã chạy. Cô in thử được danh sách phòng rồi!'], ['NOVA', 'Mảnh mã khóa thứ tư đang ở giữa phòng máy chủ.']], toKey(0, .6)); });
}

/* =================== Chương 5 · Phòng truyền thông: HTML, CSS, đường link =================== */
CHS[5] = {
  n: 5, t: 'Chương 5 · Phòng truyền thông', room: 'Phòng truyền thông', ic: 'ti-world-www', bg: 0x1c2638, gl: [-3.8, 2.4, -3.4],
  sum: ['Thẻ HTML phải đóng đúng và lồng đúng thứ tự', 'Bộ chọn lớp viết .ten-lop; cỡ chữ cần đơn vị px', 'Tên miền thật là phần ngay trước dấu / đầu tiên'],
  build() {
    room(stripes('#2b3442', '#273040', 4), 0xc9d0da, 2.6);
    this.wall = new THREE.MeshBasicMaterial({ map: screenTex(['HACKED BY KHÓA ĐEN', '', 'Lich thi: ???'], '#2a0a12', '#fb7185') }); keepMat(this.wall);
    add(rbox(4.6, 2, .1, .04), mat(0x0d1117, .5, .3), 0, 1.45, -4.82); add(new THREE.PlaneGeometry(4.4, 1.85), this.wall, 0, 1.45, -4.76);
    desk(0, -2.6, 2.4, { tex: screenTex(['<h1>Lịch thi', '<p>Môn Toán', '<a href=...'], '#0b1525', '#93c5fd') });
    desk(-4.2, -.6, 2, { tex: screenTex(['.gio-thi {', '  color: ?', '}'], '#0b1525', '#c4b5fd') });
    desk(4.2, -.6, 2, { tex: screenTex(['Hộp thư: 1 thư mới', 'Phòng Đào tạo', '"Lịch thi đã đổi"'], '#0b1525', '#fde68a') });
    [[-2.8, 2.2], [2.8, 2.2]].forEach(([x, z]) => { add(new THREE.CylinderGeometry(.03, .03, 1.5, 8), mat(0x1f2937, .7, .3), x, .75, z); add(rbox(.3, .2, .35, .04), mat(0x111827, .5, .3), x, 1.6, z); box(x - .2, x + .2, z - .2, z + .2); });
    plant(-6.2, 4.2); plant(6.2, 4.2);
  },
  start: [['GLITCH', 'Màn hình thông báo của trường giờ là của ta. Phụ huynh sẽ nhận một đường link lịch thi rất “chính thức”.'], ['NOVA', 'Trang thông báo do HTML và CSS dựng nên. {n}, sửa mã trang trên máy giữa, rồi kiểm tra thư trên máy bên phải.']],
  steps: [
    { o: 'Sửa mã HTML trang thông báo ở máy giữa', at: [0, -1.5], t: 'Mở mã trang', f() { s2Html(); } },
    { o: 'Định dạng giờ thi bằng CSS ở máy bên trái', at: [-4.2, .5], t: 'Mở tệp CSS', f() { s2Css(); } },
    { o: 'Kiểm tra đường link trong thư ở máy bên phải', at: [4.2, .5], t: 'Mở hộp thư', f() { s2Link(); } },
    { o: 'Nhặt mảnh mã khóa', key: 1 }],
};
function s2Html() {
  const L = [
    [['<h1>Lịch thi học kỳ I<h1>', 'Thẻ đóng thiếu dấu /, trình duyệt hiểu là mở thêm một thẻ h1 nữa.'], ['<h1>Lịch thi học kỳ I</h1>', ''], ['<h1>Lịch thi học kỳ I</h2>', 'Mở h1 nhưng đóng h2: thẻ đóng phải cùng tên thẻ mở.']],
    [['<p>Môn Toán: <span class="gio-thi">7:30</span></p>', ''], ['<p>Môn Toán: <span>7:30</p></span>', 'Lồng sai thứ tự: thẻ mở sau (span) phải đóng trước.'], ['<p>Môn Toán: <span class=gio-thi">7:30</span></p>', 'Giá trị thuộc tính thiếu dấu ngoặc kép mở.']],
    [['<a href="lichthi.html>Xem chi tiết</a>', 'Thiếu dấu " đóng nên cả phần chữ bị nuốt vào địa chỉ link.'], ['<a src="lichthi.html">Xem chi tiết</a>', 'Thẻ a dùng thuộc tính href; src dành cho img, script…'], ['<a href="lichthi.html">Xem chi tiết</a>', '']]];
  const order = L.map((opts) => shuf(opts.map((o, k) => [...o, k])));
  const pick = L.map(() => 0);
  const draw = (msg) => {
    const html = order.map((opts, i) => opts[pick[i]][0]).join('\n');
    mg(`${tag('Thử thách 1 · HTML')}${h2('Sửa ba dòng mã của trang thông báo')}${desc('Chọn phiên bản đúng cho từng dòng. Khung bên dưới hiển thị trang theo mã bạn chọn.')}
${order.map((opts, i) => `<div class="cb" style="justify-content:space-between"><span style="flex-shrink:0;opacity:.6">Dòng ${i + 1}</span><select data-l="${i}" style="font-family:var(--font-mono);font-size:12px;max-width:80%">${opts.map((o, j) => `<option value="${j}" ${pick[i] === j ? 'selected' : ''}>${esc(o[0])}</option>`).join('')}</select></div>`).join('')}
<div style="margin-top:8px;border-radius:8px;padding:10px 12px;background:white;color:#0f172a;font-family:Georgia,serif;max-height:150px;overflow:auto" id="pv"></div>
<div id="fb" style="font-size:13px;min-height:20px;margin-top:8px;line-height:1.55">${msg || ''}</div>${runBtn('pub', 'Xuất bản trang')}`);
    const pv = $('pv'); pv.innerHTML = html.replace(/<a /g, '<a onclick="return false" ');
    document.querySelectorAll('#mgb [data-l]').forEach((s) => (s.onchange = () => { pick[+s.dataset.l] = +s.value; draw(); }));
    $('pub').onclick = () => {
      const wrong = order.findIndex((opts, i) => opts[pick[i]][1]);
      if (wrong >= 0) { bad(); draw(fbErr(`Dòng ${wrong + 1} còn lỗi: ${order[wrong][pick[wrong]][1]}`)); return; }
      good(); CH.wall.map = screenTex(['LỊCH THI HỌC KỲ I', 'Môn Toán: 7:30', 'Xem chi tiết >'], '#0b1525', '#e2e8f0'); CH.wall.needsUpdate = true;
      $('fb').textContent = 'Trang đã hiển thị đúng: tiêu đề, giờ thi và đường link.';
      doneStep([['NOVA', 'Màn hình đã về nội dung thật. Nhưng giờ thi chưa nổi bật; phụ huynh hay đọc lướt. Máy bên trái mở sẵn tệp CSS.']]);
    };
  };
  draw();
}
function s2Css() {
  const F = { sel: [['.gio-thi', 1, ''], ['span.gio-thi', 1, ''], ['#gio-thi', 0, 'Dấu # chọn theo id; phần tử có class="gio-thi", không có id.'], ['gio-thi', 0, 'Không có dấu chấm thì CSS tìm thẻ tên <gio-thi>, không tồn tại.']],
    color: [['red', 1, ''], ['#0000ff', 0, 'Mã #0000ff là màu xanh dương.'], ['green', 0, 'Yêu cầu là màu đỏ.']],
    fw: [['font-weight: bold', 1, ''], ['font-style: bold', 0, 'font-style chỉ nhận normal, italic, oblique; chữ đậm dùng font-weight.'], ['font-weight: italic', 0, 'italic là kiểu nghiêng, thuộc font-style.']],
    fs: [['20px', 1, ''], ['20', 0, 'Thiếu đơn vị: trình duyệt bỏ qua cả khai báo font-size.'], ['20%', 0, '20% là 20% cỡ chữ của phần tử cha, chữ sẽ rất nhỏ.']] };
  const order = Object.fromEntries(Object.entries(F).map(([k, v]) => [k, shuf(v)]));
  const cur = { sel: 0, color: 0, fw: 0, fs: 0 };
  const S_ = (k) => `<select data-k="${k}" style="font-family:var(--font-mono)">${order[k].map((o, j) => `<option value="${j}" ${cur[k] === j ? 'selected' : ''}>${esc(o[0])}</option>`).join('')}</select>`;
  const draw = (msg) => {
    const g = (k) => order[k][cur[k]], ok = g('sel')[1];
    const st2 = ok ? `color:${g('color')[0]};${g('fw')[0].startsWith('font-weight: bold') ? 'font-weight:bold;' : ''}${g('fs')[0] === '20px' ? 'font-size:20px;' : g('fs')[0] === '20%' ? 'font-size:20%;' : ''}` : '';
    mg(`${tag('Thử thách 2 · CSS')}${h2('Giờ thi: màu đỏ, chữ đậm, cỡ 20px')}${desc('HTML: &lt;span class="gio-thi"&gt;7:30&lt;/span&gt;. Chọn bộ chọn và ba khai báo.')}
<div class="term" style="white-space:normal;min-height:0">${S_('sel')} {<br>&nbsp;&nbsp;color: ${S_('color')};<br>&nbsp;&nbsp;${S_('fw')};<br>&nbsp;&nbsp;font-size: ${S_('fs')};<br>}</div>
<div style="margin-top:8px;border-radius:8px;padding:10px 12px;background:white;color:#0f172a;font-family:Georgia,serif">Môn Toán: <span style="${st2}">7:30</span></div>
<div id="fb" style="font-size:13px;min-height:20px;margin-top:8px;line-height:1.55">${msg || ''}</div>${runBtn('apply', 'Áp dụng')}`);
    document.querySelectorAll('#mgb [data-k]').forEach((s) => (s.onchange = () => { cur[s.dataset.k] = +s.value; draw(); }));
    $('apply').onclick = () => {
      const w = ['sel', 'color', 'fw', 'fs'].find((k) => !g(k)[1]);
      if (w) { bad(); draw(fbErr(g(w)[2])); return; }
      good(); $('fb').textContent = 'Giờ thi đã nổi bật. Lưu ý: .gio-thi và span.gio-thi đều chọn đúng phần tử.';
      doneStep([['NOVA', 'Trang đã ổn. Giờ là hộp thư: KHÓA ĐEN gửi thư giả mạo Phòng Đào tạo cho phụ huynh.']]);
    };
  };
  draw();
}
function s2Link() {
  quiz('Thử thách 3 · Đường link', 'Thư "Phòng Đào tạo: lịch thi đã đổi". Trường dùng tên miền thpt-nova.edu.vn. Đường link nào thật sự thuộc trường?', 'Đọc tên miền: phần ngay trước dấu / đầu tiên sau https://, đọc từ phải sang trái.', [
    { i: 'ti-world-www', t: 'https://thpt-nova.edu.vn/thong-bao/lich-thi', ok: 1, e: 'Tên miền là thpt-nova.edu.vn, đúng của trường; phần sau dấu / chỉ là đường dẫn trong trang.' },
    { i: 'ti-world-www', t: 'https://thpt-nova.edu.vn.lichthi-update.com/login', e: 'Tên miền thật là lichthi-update.com; "thpt-nova.edu.vn" chỉ là tên miền con kẻ gian tự đặt.' },
    { i: 'ti-world-www', t: 'https://thpt-n0va.edu.vn/lich-thi', e: 'Chữ "o" bị thay bằng số 0: một tên miền khác hoàn toàn, đăng ký để đánh lừa.' },
    { i: 'ti-world-www', t: 'http://thpt-nova.edu.vn@203.0.113.9/lich-thi', e: 'Phần trước dấu @ chỉ là tên đăng nhập; máy chủ thật là 203.0.113.9. Lại còn dùng http không mã hóa.' }],
    () => { jingle(); talk([['NOVA', 'Đã gửi cảnh báo cho phụ huynh kèm đường link thật. Mảnh mã khóa thứ năm ở trước màn hình lớn.']], toKey(0, -.4)); });
}

/* =================== Chương cuối · Trung tâm dữ liệu: an ninh mạng và pháp luật =================== */
CHS[6] = {
  n: 6, t: 'Chương cuối · Trung tâm dữ liệu', room: 'Trung tâm dữ liệu', ic: 'ti-shield', bg: 0x05080f, dark: 1, gl: [0, 2.6, -2.6],
  sum: [],
  build() {
    room(grid('#0b1220', '#1e293b', 6), 0x111827, 2.8);
    this.leds = [];
    for (let i = 0; i < 4; i++) { rack(-5.6, -3.6 + i * 2.1, this.leds); rack(5.6, -3.6 + i * 2.1, this.leds); }
    add(new THREE.CylinderGeometry(.8, 1, .5, 32), mat(0x334155, .6, .35), 0, .25, 1.2); box(-1, 1, .3, 2.1);
    spr('Máy giải mã', '#0e7490', .7).position.set(0, 1.3, 1.2);
    this.crys = []; for (let i = 0; i < 5; i++) { const c = new THREE.Mesh(new THREE.OctahedronGeometry(.18, 0), kmat); c.scale.y = 1.5; c.visible = false; W.add(c); this.crys.push(c); }
    GL.scale.setScalar(2.4);
  },
  start: [['GLITCH', '5 giờ sáng rồi. Các ngươi có 5 mảnh khóa, nhưng ta vẫn còn trong mạng của trường.'], ['NOVA', '{n}, nạp 5 mảnh mã khóa vào máy giải mã. Sau đó xử lý sự cố: mỗi tình huống chọn Làm hoặc Không làm.']],
  steps: [
    { o: 'Nạp 5 mảnh mã khóa vào máy giải mã', at: [0, 2.4], t: 'Nạp mảnh mã khóa', f() { CH.ins = 0; CH.busy = 1; CH.crys.forEach((c) => (c.visible = true)); beep(500, .4, .05, 'triangle'); } },
    { o: 'Xử lý sự cố cùng NOVA', at: [0, 2.4], t: 'Bắt đầu xử lý sự cố', f() { s2Boss(); } }],
  tick(dt) {
    this.leds.forEach((l, i) => { const r = Math.sin(tm * 5 + i * 1.7); l.material.emissive.setHex(si < 1 || this.won ? 0x22c55e : r > .4 ? 0xe11d48 : 0x22c55e); l.material.emissiveIntensity = r > -.4 ? 1.4 : .1; });
    if (this.ins !== undefined && this.ins < 1) {
      this.ins += dt * .45;
      this.crys.forEach((c, i) => { const a = i / 5 * Math.PI * 2 + tm * 2, r = 1.6 * (1 - this.ins); c.position.set(Math.cos(a) * r, 1 + this.ins * .6, 1.2 + Math.sin(a) * r); c.rotation.y += dt * 3; });
      if (this.ins >= 1) { this.busy = 0; this.crys.forEach((c) => (c.visible = false)); NOVA.scale.setScalar(1.8); jingle(); talk([['NOVA', 'Đề thi và bảng điểm đã giải mã xong. Giờ chặn KHÓA ĐEN lại.'], ['GLITCH', 'Thử xem các ngươi xử lý sự cố có bài bản không.']], adv); }
    }
    if (this.won && GL.visible) { glBurst += dt; GL.children.forEach((c) => { c.position.addScaledVector(c.userData.v, dt); c.userData.v.y -= 6 * dt; }); if (glBurst > 2) GL.visible = false; }
  },
};
function s2Boss() {
  const C = shuf([
    ['Ngắt máy tính bị nhiễm khỏi mạng nội bộ ngay', 1, 'Cách ly máy nhiễm để mã độc không lây sang máy khác là bước đầu tiên khi xử lý sự cố.'],
    ['Chuyển tiền chuộc để KHÓA ĐEN gửi khóa giải mã', 0, 'Trả tiền không bảo đảm lấy lại dữ liệu và tiếp tay cho tội phạm; nhà trường đã có bản sao lưu.'],
    ['Khôi phục dữ liệu từ bản sao lưu ngoại tuyến (không cắm vào mạng)', 1, 'Quy tắc 3-2-1: 3 bản sao, 2 loại thiết bị, 1 bản để ngoài. Bản ngoại tuyến không bị mã hóa theo.'],
    ['Mở tệp "diem_thi_final.xlsm" gửi từ email lạ để xem KHÓA ĐEN đã sửa gì', 0, 'Tệp .xlsm chứa macro, có thể là mã độc mới. Không mở tệp từ nguồn không tin cậy.'],
    ['Đổi mật khẩu tài khoản quản trị và bật xác thực hai bước', 1, 'Tài khoản admin_tmp đã bị lộ; mật khẩu mới kèm xác thực hai bước chặn đăng nhập lại.'],
    ['Đăng danh sách học sinh bị lộ thông tin lên mạng xã hội để cảnh báo', 0, 'Công khai dữ liệu cá nhân của học sinh là vi phạm quy định bảo vệ dữ liệu cá nhân; thông báo riêng cho người liên quan.'],
    ['Báo cáo sự cố cho ban giám hiệu và cơ quan chức năng, giữ nguyên nhật ký hệ thống', 1, 'Nhật ký là chứng cứ để điều tra; báo cáo đúng kênh là trách nhiệm của nhà trường.'],
    ['Dùng phần mềm giải mã "crack" tải trên mạng cho nhanh', 0, 'Phần mềm bẻ khóa vi phạm bản quyền và thường cài kèm mã độc.'],
  ]);
  let i = 0, hp = 100, hearts = 3, tl = 12, tmr = null;
  const draw = () => {
    const c = C[i];
    mg(`<div style="display:flex;gap:12px;align-items:center;margin-bottom:10px"><div style="flex:1"><div style="font-size:12px;color:#fb7185"><i class="ti ti-lock" aria-hidden="true"></i> KHÓA ĐEN</div><div class="hp"><div style="width:${hp}%;background:#e11d48"></div></div></div><div style="font-size:18px;color:#e11d48" aria-label="Năng lượng NOVA">${'<i class="ti ti-heart" aria-hidden="true"></i>'.repeat(hearts)}</div></div>
<div style="font-size:12px;color:#64748b">Tình huống ${i + 1}/${C.length} · còn <b id="tl" style="font-weight:500">${tl}</b> giây</div><div style="font-size:16px;font-weight:500;margin:8px 0 14px;line-height:1.5;min-height:48px">${c[0]}</div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><button class="bt" id="do1" style="background:#0f766e">Làm</button><button class="bt" id="do0" style="background:#9f1239">Không làm</button></div><div id="fb" style="font-size:13px;min-height:38px;margin-top:10px;line-height:1.5"></div>`);
    $('do1').onclick = () => ans(1); $('do0').onclick = () => ans(0);
    clearInterval(tmr); tl = 12; tmr = setInterval(() => { tl--; if ($('tl')) $('tl').textContent = tl; if (tl <= 0) { clearInterval(tmr); ans(-1); } }, 1000);
  };
  const ans = (a) => {
    clearInterval(tmr); const c = C[i]; $('do1').disabled = $('do0').disabled = true;
    if (a === c[1]) { hp = Math.max(0, hp - 100 / C.length); good(); $('fb').innerHTML = '<span style="color:#6ee7b7">Đúng.</span> ' + c[2]; }
    else { hearts--; bad(); $('fb').innerHTML = fbErr((a < 0 ? 'Hết giờ. ' : 'Chưa đúng. ') + c[2]); }
    setTimeout(() => {
      i++;
      if (hearts <= 0) { mg(`<div style="text-align:center"><div style="font-size:17px;font-weight:600">NOVA cạn năng lượng</div><div style="font-size:13px;color:#475569;margin:6px 0 14px">Đọc kỹ từng tình huống rồi thử lại.</div><button class="bt" id="re">Thử lại</button></div>`); $('re').onclick = () => { i = 0; hp = 100; hearts = 3; draw(); }; return; }
      if (i >= C.length) { mgClose(); CH.won = 1; glBurst = 0; jingle(); setTimeout(() => beep(200, .6, .06, 'sawtooth'), 300); talk([['GLITCH', 'Sao lưu ngoại tuyến… xác thực hai bước… Không còn chỗ nào để ta bám vào.'], ['CO', '5 giờ 58. Đề thi, bảng điểm và trang thông báo đều đã về. Cảm ơn em, {n}!'], ['NOVA', 'Kỳ thi sẽ diễn ra đúng giờ. Đội Tin học hoàn thành nhiệm vụ.']], () => { finish(); cert(); }); return; }
      draw();
    }, 2600);
  };
  draw();
}
function cert() {
  const d = new Date();
  $('clrb').innerHTML = `<div style="width:56px;height:56px;border-radius:50%;background:rgba(34,211,238,.15);color:#22d3ee;display:flex;align-items:center;justify-content:center;font-size:30px;margin:0 auto 8px"><i class="ti ti-certificate" aria-hidden="true"></i></div><div style="font-size:12px;color:#64748b;letter-spacing:1px">Chứng nhận</div><div style="font-size:19px;font-weight:600;margin:2px 0">Đội Tin học Trường THPT Nova</div><div style="font-size:13px;color:#475569">trao cho</div><div style="font-size:22px;font-weight:600;color:#22d3ee;margin:4px 0">${esc(name)}</div><div style="font-size:13px;color:#b45309;margin:4px 0"><i class="ti ti-star" aria-hidden="true"></i> ${sumStars()} / 18 sao</div>
<div style="font-size:12.5px;color:#475569;line-height:1.6;margin:8px 0">Đã giải mã dữ liệu nhị phân, khôi phục cơ sở dữ liệu điểm, tìm và sắp xếp hồ sơ, gỡ lỗi Python, sửa trang web và xử lý sự cố mã độc tống tiền trước giờ thi.</div><div style="font-size:12px;color:#64748b">Ngày ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()} · EduNova</div><button class="bt" id="tomap2" style="margin-top:12px"><i class="ti ti-map" aria-hidden="true"></i> Về bản đồ</button>`;
  $('clr').classList.remove('hidden'); $('tomap2').onclick = () => { $('clr').classList.add('hidden'); showMap(); };
}

/* ---------- Bài kiểm tra kỹ thuật trước khi nhặt mảnh mã khóa (thay bộ câu của kịch bản 1) ---------- */
Object.keys(HARD).forEach((k) => delete HARD[k]);
Object.assign(HARD, {
  1: [
    { q: 'Chữ "ế" (U+1EBF) lưu bằng UTF-8 chiếm bao nhiêu byte?', ops: [
      { t: '3 byte', ok: 1, e: 'Mã U+0800 đến U+FFFF dùng 3 byte trong UTF-8; U+1EBF nằm trong khoảng này.' },
      { t: '1 byte', e: '1 byte chỉ đủ cho 128 ký tự ASCII, không có chữ có dấu.' },
      { t: '2 byte', e: '2 byte dành cho U+0080 đến U+07FF (như chữ "é" U+00E9); "ế" có mã lớn hơn.' },
      { t: '4 byte', e: '4 byte dành cho ký tự từ U+10000 trở lên, như nhiều biểu tượng cảm xúc.' }] },
    { q: 'Số nhị phân 1011 0110 viết trong hệ 16 là gì?', ops: [
      { t: 'B6', ok: 1, e: 'Tách thành hai nhóm 4 bit: 1011 = B, 0110 = 6.' },
      { t: '6B', e: 'Đảo thứ tự hai nhóm: nhóm 4 bit bên trái là chữ số hàng cao.' },
      { t: '182', e: '182 là giá trị thập phân của số này, không phải cách viết hệ 16.' },
      { t: 'A6', e: '1011 là 11, tức B; A là 1010.' }] },
  ],
  2: [
    { q: 'Bảng DIEM có khóa chính (SBD, Mon) và đã có dòng (A01, Toán, 7). Lệnh INSERT dòng (A01, Toán, 8) sẽ ra sao?', ops: [
      { t: 'Bị từ chối vì trùng khóa chính', ok: 1, e: 'Hai dòng không được trùng giá trị khóa chính; muốn đổi điểm phải dùng UPDATE.' },
      { t: 'Ghi đè điểm 7 thành 8', e: 'INSERT chỉ thêm dòng mới, không ghi đè dòng cũ.' },
      { t: 'Thêm thành công, bảng có hai dòng A01 Toán', e: 'Khóa chính tồn tại chính là để ngăn điều này.' },
      { t: 'Tự đổi SBD thành A02', e: 'Hệ quản trị CSDL không tự sửa dữ liệu của người dùng.' }] },
    { q: "SELECT COUNT(*) FROM DIEM WHERE NguoiSua = 'admin_tmp'; trả về gì với bảng vừa xem?", ops: [
      { t: '4', ok: 1, e: 'COUNT(*) đếm số dòng thỏa điều kiện: 4 dòng do admin_tmp sửa.' },
      { t: '8', e: '8 là tổng số dòng của bảng; WHERE đã lọc bớt.' },
      { t: 'Danh sách 4 học sinh', e: 'COUNT trả về một con số, không trả về danh sách dòng.' },
      { t: 'Tổng điểm của 4 dòng', e: 'Tính tổng dùng SUM(Diem), không phải COUNT.' }] },
  ],
  3: [
    { q: 'Vì sao không dùng tìm kiếm nhị phân trên danh sách chưa sắp xếp?', ops: [
      { t: 'Vì so sánh với phần tử giữa không cho biết nên bỏ nửa nào', ok: 1, e: 'Tìm nhị phân dựa vào thứ tự: chỉ khi danh sách tăng dần thì "lớn hơn" mới có nghĩa là "nằm bên phải".' },
      { t: 'Vì máy tính không tìm được phần tử giữa', e: 'Phần tử giữa luôn tính được bằng chỉ số (đầu + cuối) // 2.' },
      { t: 'Vì danh sách chưa sắp xếp luôn dài hơn', e: 'Độ dài không đổi khi sắp xếp.' },
      { t: 'Vì Python cấm', e: 'Không có quy định nào như vậy; thuật toán đơn giản là cho kết quả sai.' }] },
    { q: 'Sắp xếp nổi bọt tăng dần, sau lượt duyệt đầu tiên điều gì chắc chắn đúng?', ops: [
      { t: 'Phần tử lớn nhất đã về cuối danh sách', ok: 1, e: 'Phần tử lớn nhất được đổi chỗ liên tục về bên phải cho tới cuối.' },
      { t: 'Phần tử nhỏ nhất đã về đầu danh sách', e: 'Phần tử nhỏ nhất mỗi lượt chỉ dịch sang trái được một vị trí.' },
      { t: 'Danh sách đã sắp xếp xong', e: 'Thường cần nhiều lượt; một lượt chỉ chắc chắn đặt đúng một phần tử.' },
      { t: 'Không có gì chắc chắn', e: 'Có: phần tử lớn nhất đã đúng chỗ.' }] },
  ],
  4: [
    { q: 'range(2, 10, 3) sinh ra các số nào?', ops: [
      { t: '2, 5, 8', ok: 1, e: 'Bắt đầu từ 2, mỗi lần cộng 3, dừng trước 10.' },
      { t: '2, 5, 8, 11', e: '11 vượt quá giới hạn 10 nên không được sinh ra.' },
      { t: '3, 6, 9', e: 'Tham số đầu là giá trị bắt đầu (2), tham số thứ ba là bước nhảy.' },
      { t: '2, 3, 4, …, 9', e: 'Đó là range(2, 10) với bước mặc định 1.' }] },
    { q: 'a = [1, 2, 3]; b = a; b.append(4); print(len(a)) in ra gì?', ops: [
      { t: '4', ok: 1, e: 'b = a không tạo bản sao; a và b cùng trỏ tới một danh sách nên a cũng có 4 phần tử.' },
      { t: '3', e: 'Muốn a giữ nguyên phải sao chép: b = a.copy().' },
      { t: 'Lỗi', e: 'Đoạn code hợp lệ.' },
      { t: '1', e: 'len trả về số phần tử, không phải phần tử đầu.' }] },
  ],
  5: [
    { q: 'Trong https://lichthi.thpt-nova.edu.vn/hk1?lop=12A1, tên miền đầy đủ là gì?', ops: [
      { t: 'lichthi.thpt-nova.edu.vn', ok: 1, e: 'Tên miền nằm giữa "https://" và dấu / đầu tiên; "lichthi" là tên miền con của thpt-nova.edu.vn.' },
      { t: 'thpt-nova.edu.vn/hk1', e: '/hk1 là đường dẫn trong trang, không thuộc tên miền.' },
      { t: 'lop=12A1', e: 'Đó là tham số truy vấn sau dấu ?.' },
      { t: 'https', e: 'https là giao thức.' }] },
    { q: 'CSS có p { color: blue } và .note { color: red }. Đoạn <p class="note"> có màu gì?', ops: [
      { t: 'Đỏ', ok: 1, e: 'Bộ chọn lớp (.note) cụ thể hơn bộ chọn thẻ (p) nên được ưu tiên, dù viết trước hay sau.' },
      { t: 'Xanh', e: 'Bộ chọn thẻ có độ ưu tiên thấp hơn bộ chọn lớp.' },
      { t: 'Tím (pha hai màu)', e: 'CSS không pha màu; chỉ một khai báo thắng.' },
      { t: 'Đen mặc định', e: 'Cả hai quy tắc đều khớp, nên không dùng màu mặc định.' }] },
  ],
});
