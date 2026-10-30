/* ===== Kịch bản 3 · "Mất liên lạc ở Trạm Nova-7" =====
 * Trạm nghiên cứu trên sao Hỏa sau bão Mặt Trời; AI bảo trì ECHO bị lỗi và khóa các khoang.
 * Chèn sau kit-pack.js, chỉ khi đóng gói kịch bản 3 (tools/nova/build.mjs).
 * Cơ chế riêng: thanh oxy dự phòng của từng khoang thay cho sao; chọn sai mất 5% oxy; cạn oxy chơi lại khoang.
 * Nội dung: hệ điều hành và quản lý tệp (Tin 11), ảnh số RGB và nén (Tin 10–11), mã hóa, gói tin, tốc độ truyền
 * (Tin 10–12), lập trình điều khiển cảm biến (Tin 10), bảng tính và biểu đồ, AI có con người giám sát (Tin 12).
 * Độ khó vừa phải: có gợi ý ngay trong đề, phản hồi nói rõ vì sao sai. Câu đố và lời thoại viết mới.
 */
WHO.GLITCH = ['ECHO · AI bảo trì', '#e11d48', 'ti-robot', '#9f1239'];
WHO.CO = ['Chỉ huy Linh', '#f59e0b', 'ti-user', '#b45309'];

meterSetup({
  budget: [0, 100, 100, 100, 100, 100, 100], rate: 4, pen: 5, penText: (p) => `Mất ${p}% oxy`,
  show: (n, left, used, low) => `<span style="color:${low ? '#fb7185' : '#e2e8f0'};font-variant-numeric:tabular-nums">O₂ ${Math.ceil(left)}%</span> <span style="display:inline-block;width:54px;height:6px;border-radius:3px;background:rgba(148,163,184,.25);vertical-align:middle;overflow:hidden"><span style="display:block;height:100%;width:${left}%;background:${low ? '#e11d48' : '#22d3ee'}"></span></span>`,
  failTag: 'Hết oxy', failTitle: 'Oxy dự phòng của khoang đã cạn',
  failText: 'Bạn được đưa về khoang an toàn. Vào lại khoang này; đọc kỹ gợi ý trong đề trước khi chọn.',
});

/* ---------- Đồ vật của trạm ---------- */
const MARS = tex(512, 256, (g, w, h) => {
  const s = g.createLinearGradient(0, 0, 0, h); s.addColorStop(0, '#2a1410'); s.addColorStop(.55, '#a8502a'); s.addColorStop(1, '#e0874a'); g.fillStyle = s; g.fillRect(0, 0, w, h);
  g.fillStyle = '#6b2d17'; g.beginPath(); g.moveTo(0, h); for (let x = 0; x <= w; x += 16) g.lineTo(x, h * .72 + Math.sin(x * .02) * 18 + Math.sin(x * .07) * 6); g.lineTo(w, h); g.fill();
  g.fillStyle = 'rgba(255,240,220,.85)'; g.beginPath(); g.arc(w * .78, h * .22, 7, 0, 7); g.fill();
});
function marsWindow(x, w) {
  add(rbox(w + .2, 1.3, .1, .05), mat(0x1f2937, .7, .3), x, 1.55, -4.83);
  const m = new THREE.MeshBasicMaterial({ map: MARS }); keepMat(m);
  add(new THREE.PlaneGeometry(w, 1.1), m, x, 1.55, -4.77);
}
function console3(x, z, w, lines, col) { return desk(x, z, w, { tex: screenTex(lines, '#0b1525', col || '#67e8f9') }); }
function stationRoom(h) { room(grid('#1c232d', '#2b3542', 6), 0x9aa4b2, h || 2.6); }

/* =================== Chương 1 · Phòng điều khiển: hệ điều hành và tệp =================== */
const FS = { tram: { 'he-thong': { 'kernel.bin': 1, 'khoi-dong.cfg': 1 }, 'nhat-ky': { 2026: { 10: { 'nhat-ky-29.log': 1, 'nhat-ky-30.log': 1 } } }, tam: { 'bo-dem-1.tmp': 1, 'bo-dem-2.tmp': 1 }, anh: { 'ban-do.png': 1 } } };
CHS[1] = {
  n: 1, t: 'Khoang 1 · Phòng điều khiển', room: 'Phòng điều khiển', ic: 'ti-device-desktop', bg: 0x1c2638, gl: [3.8, 2.4, -3.6],
  sum: ['Đường dẫn tuyệt đối bắt đầu từ thư mục gốc /', 'Chỉ dừng tiến trình lạ, không dừng tiến trình hệ thống', 'Tệp tạm (.tmp) xóa được để giải phóng ổ đĩa'],
  build() {
    stationRoom(); marsWindow(-3.6, 2.6); marsWindow(3.6, 2.6);
    console3(-2.6, -2.6, 2.2, ['/tram$ ls', 'he-thong  nhat-ky', 'tam  anh']);
    console3(2.6, -2.6, 2.2, ['PID  CPU  TÊN', '42   97%  echo_ov...'], '#fda4af');
    console3(-4.6, 1.2, 2, ['Ổ đĩa: 99% đầy', '/tram/tam: 4,1 GB'], '#fde68a');
    add(rbox(.9, 2, .8, .05), mat(0x334155, .6, .35), 5.9, 1, 1.4); box(5.45, 6.35, 1, 1.8);
    plant(-6.2, 4.2); plant(6.2, 4.2);
  },
  start: [['CO', 'Đây là chỉ huy Linh. Bão Mặt Trời vừa đi qua, trạm Nova-7 mất liên lạc với Trái Đất. {n}, bạn là kỹ thuật viên trực ca.'],
    ['GLITCH', 'Tôi là ECHO, AI bảo trì. Để bảo vệ trạm, tôi đã khóa mọi khoang. Không ai được ra lệnh cho tôi nữa.'],
    ['NOVA', 'ECHO bị lỗi sau cơn bão. Mỗi khoang chỉ còn oxy dự phòng, thanh O₂ ở góc phải. Trước hết, tìm nhật ký hệ thống ở máy bên trái.']],
  steps: [
    { o: 'Tìm nhật ký mới nhất ở máy bên trái', at: [-2.6, -1.5], t: 'Mở trình quản lý tệp', f() { s3Tree(); } },
    { o: 'Dừng tiến trình lạ ở máy bên phải', at: [2.6, -1.5], t: 'Mở trình quản lý tiến trình', f() { s3Proc(); } },
    { o: 'Giải phóng ổ đĩa ở máy góc trái', at: [-4.6, 2.3], t: 'Kiểm tra ổ đĩa', f() { s3Disk(); } },
    { o: 'Nhặt mảnh mã khóa', key: 1 }],
};
function s3Tree() {
  let path = ['tram'];
  const node = () => path.reduce((n, k) => n[k], FS);
  const draw = (msg) => {
    const cur = node(), items = Object.keys(cur).sort((a, b) => (typeof cur[a] === 'object' ? 0 : 1) - (typeof cur[b] === 'object' ? 0 : 1) || a.localeCompare(b));
    mg(`${tag('Thử thách 1 · Quản lý tệp')}${h2('Mở tệp nhật ký của ngày 30')}${desc('Nhật ký nằm trong thư mục nhat-ky, chia theo năm rồi theo tháng. Bấm thư mục để vào, bấm ".." để quay lên.')}
<div class="term" style="min-height:0">/${path.join('/')}</div>
<div style="display:grid;gap:6px;margin-top:8px">${path.length > 1 ? '<button class="op" data-up="1">.. (lên một cấp)</button>' : ''}${items.map((k) => `<button class="op" data-k="${esc(k)}"><i class="ti ${typeof cur[k] === 'object' ? 'ti-map' : 'ti-file-text'}" aria-hidden="true"></i>${esc(k)}${typeof cur[k] === 'object' ? '/' : ''}</button>`).join('')}</div>
<div id="fb" style="font-size:13px;min-height:20px;margin-top:8px;line-height:1.55">${msg || ''}</div>`);
    document.querySelectorAll('#mgb [data-up]').forEach((b) => (b.onclick = () => { path.pop(); beep(500, .05, .03); draw(); }));
    document.querySelectorAll('#mgb [data-k]').forEach((b) => (b.onclick = () => {
      const k = b.dataset.k;
      if (typeof cur[k] === 'object') { path.push(k); beep(600, .05, .03); draw(); return; }
      if (k === 'nhat-ky-30.log') { good(); draw(`Đã mở. Đường dẫn tuyệt đối: /${path.join('/')}/${k}. Nhật ký ghi: 03:12 tiến trình echo_override chiếm quyền điều khiển.`); doneStep([['NOVA', 'Thủ phạm là tiến trình echo_override. Máy bên phải đang mở trình quản lý tiến trình.']]); return; }
      bad(); draw(fbErr(k === 'nhat-ky-29.log' ? 'Đây là nhật ký ngày 29, trước khi có bão. Cần tệp của ngày 30.' : `${k} không phải tệp nhật ký. Nhật ký nằm trong thư mục nhat-ky.`));
    }));
  };
  draw();
}
function s3Proc() {
  const P3 = [['1', 'kernel', '2%', 'Nhân hệ điều hành', 'Dừng nhân hệ điều hành thì cả trạm sập ngay lập tức.'], ['17', 'ho_tro_su_song', '6%', 'Điều hòa oxy và nhiệt độ', 'Đây là hệ thống hỗ trợ sự sống; dừng nó thì oxy cạn nhanh hơn.'],
    ['42', 'echo_override', '97%', 'Không rõ nguồn gốc', ''], ['58', 'cam_bien_nhiet', '1%', 'Đọc cảm biến nhiệt độ', 'Tiến trình nhỏ, chạy bình thường; dừng nó chỉ mất số liệu nhiệt độ.']];
  const draw = (msg) => {
    mg(`${tag('Thử thách 2 · Tiến trình')}${h2('Dừng đúng tiến trình đang chiếm quyền điều khiển')}${desc('Nhật ký chỉ ra thủ phạm. Chú ý cột CPU và mô tả: tiến trình hệ thống thì không được dừng.')}
<div class="term" style="white-space:normal;min-height:0;padding:6px">${P3.map((p, i) => `<div style="display:grid;grid-template-columns:34px 1fr 46px auto;gap:8px;align-items:center;padding:4px 2px;border-bottom:1px solid rgba(148,163,184,.12)"><span style="opacity:.6">${p[0]}</span><span><b>${p[1]}</b><br><span style="font-size:11.5px;opacity:.7">${p[3]}</span></span><span style="color:${p[2] === '97%' ? '#fda4af' : '#e2e8f0'}">${p[2]}</span><button class="bt2" data-p="${i}" style="padding:4px 10px">Kết thúc</button></div>`).join('')}</div>
<div id="fb" style="font-size:13px;min-height:20px;margin-top:8px;line-height:1.55">${msg || ''}</div>`);
    document.querySelectorAll('#mgb [data-p]').forEach((b) => (b.onclick = () => {
      const p = P3[+b.dataset.p];
      if (p[1] !== 'echo_override') { bad(); draw(fbErr(p[4])); return; }
      good(); draw('Đã dừng echo_override. CPU trở về 9%; ECHO mất quyền điều khiển phòng này.');
      doneStep([['GLITCH', 'Các người chỉ dừng được một bản sao của tôi thôi.'], ['NOVA', 'Ổ đĩa của trạm đầy 99%, nhật ký mới không ghi được. Kiểm tra ở máy góc trái.']]);
    }));
  };
  draw();
}
function s3Disk() {
  quiz('Thử thách 3 · Ổ đĩa đầy', 'Ổ đĩa đầy 99%. Xóa thư mục nào để giải phóng chỗ mà không ảnh hưởng trạm?', 'Thư mục /tram/tam đang chiếm 4,1 GB.', [
    { i: 'ti-box', t: '/tram/tam (các tệp .tmp)', ok: 1, e: 'Tệp tạm do chương trình tạo ra khi chạy, xóa đi không mất dữ liệu cần thiết; chương trình sẽ tự tạo lại khi cần.' },
    { i: 'ti-box', t: '/tram/he-thong', e: 'Chứa nhân và tệp khởi động của hệ điều hành; xóa đi trạm không khởi động lại được.' },
    { i: 'ti-box', t: '/tram/nhat-ky', e: 'Nhật ký là bằng chứng để tìm lỗi của ECHO; không nên xóa.' },
    { i: 'ti-box', t: '/tram/anh', e: 'Chứa bản đồ hạ cánh, dữ liệu quan trọng của trạm.' }],
    () => { jingle(); talk([['NOVA', 'Đã trống 4,1 GB. Cửa khoang 1 mở rồi, mảnh mã khóa đầu tiên ở giữa phòng.']], toKey(0, -1)); });
}

/* =================== Chương 2 · Phòng ảnh vệ tinh: ảnh số =================== */
CHS[2] = {
  n: 2, t: 'Khoang 2 · Phòng ảnh vệ tinh', room: 'Phòng ảnh vệ tinh', ic: 'ti-eye', bg: 0x1c2638, gl: [-3.8, 2.4, -3.6],
  sum: ['Mỗi điểm ảnh RGB có 3 kênh, mỗi kênh 0–255', 'Dung lượng ảnh thô = rộng × cao × số byte mỗi điểm', 'PNG nén không mất dữ liệu, JPEG nén có mất chi tiết'],
  build() {
    stationRoom(); marsWindow(0, 3.6);
    this.view = new THREE.MeshBasicMaterial({ map: screenTex(['ẢNH VỆ TINH', 'màu sai lệch…', '???'], '#1a0b14', '#fda4af') }); keepMat(this.view);
    add(rbox(3, 1.7, .08, .04), mat(0x0d1117, .5, .3), 4.6, 1.5, -4.8); add(new THREE.PlaneGeometry(2.8, 1.55), this.view, 4.6, 1.5, -4.75);
    console3(-3.2, -2.4, 2.4, ['R ▮▮▮▯▯', 'G ▮▮▯▯▯', 'B ▮▯▯▯▯']);
    console3(3.2, -1.6, 2.2, ['2000 × 1000', '24 bit/điểm'], '#fde68a');
    console3(0, 1.4, 2.2, ['ban-do.???', 'PNG | JPEG'], '#c4b5fd');
    plant(-6.2, 4.2); plant(6.2, 4.2);
  },
  start: [['GLITCH', 'Ảnh vệ tinh giờ toàn màu sai. Không thấy bão bụi, không thấy bãi hạ cánh.'], ['NOVA', 'Bão bụi được đánh dấu bằng màu cam. Phải chỉnh lại bộ lọc màu ở máy bên trái trước.']],
  steps: [
    { o: 'Chỉnh màu đánh dấu bão bụi ở máy bên trái', at: [-3.2, -1.3], t: 'Mở bộ lọc màu', f() { s3Rgb(); } },
    { o: 'Tính dung lượng ảnh ở máy bên phải', at: [3.2, -.5], t: 'Mở thông tin ảnh', f() { s3Size(); } },
    { o: 'Chọn định dạng lưu bản đồ ở máy giữa', at: [0, 2.5], t: 'Lưu bản đồ', f() { s3Format(); } },
    { o: 'Nhặt mảnh mã khóa', key: 1 }],
};
function s3Rgb() {
  const T = [255, 153, 0], cur = [0, 0, 0], N = ['R (đỏ)', 'G (lục)', 'B (lam)'];
  const draw = (msg) => {
    mg(`${tag('Thử thách 1 · Màu RGB')}${h2('Pha màu cam rgb(255, 153, 0) cho vùng bão bụi')}${desc('Mỗi kênh nhận 0 – 255. Kéo ba thanh để ô bên phải giống ô mẫu. Đỏ mạnh + lục vừa + không có lam sẽ ra cam.')}
<div style="display:grid;grid-template-columns:1fr 120px;gap:12px;align-items:center">
<div>${N.map((n, i) => `<div class="cb" style="gap:10px"><span style="width:62px">${n}</span><input type="range" min="0" max="255" step="51" value="${cur[i]}" data-c="${i}" style="flex:1;accent-color:${['#ef4444', '#22c55e', '#3b82f6'][i]}"><b style="width:34px;text-align:right">${cur[i]}</b></div>`).join('')}</div>
<div style="display:grid;gap:6px;text-align:center;font-size:12px"><div style="height:44px;border-radius:8px;background:rgb(${T})"></div>mẫu<div id="swatch" style="height:44px;border-radius:8px;background:rgb(${cur})"></div>bạn pha</div></div>
<div id="fb" style="font-size:13px;min-height:20px;margin-top:8px;line-height:1.55">${msg || ''}</div>${runBtn('rgbok', 'Áp dụng')}`);
    document.querySelectorAll('#mgb [data-c]').forEach((r) => (r.oninput = () => { cur[+r.dataset.c] = +r.value; r.nextElementSibling.textContent = r.value; $('swatch').style.background = `rgb(${cur})`; }));
    $('rgbok').onclick = () => {
      const k = cur.findIndex((v, i) => v !== T[i]);
      if (k >= 0) { bad(); draw(fbErr(`Kênh ${N[k]} đang là ${cur[k]}, cần ${T[k] > cur[k] ? 'tăng' : 'giảm'} về ${T[k]}.`)); return; }
      good(); CH.view.map = screenTex(['ẢNH VỆ TINH', 'Bão bụi: hướng Đông', 'Bãi hạ cánh: an toàn'], '#0b1525', '#fdba74'); CH.view.needsUpdate = true;
      draw('Đúng màu cam. Bão bụi hiện rõ ở phía Đông của trạm.');
      doneStep([['CO', 'Thấy rồi. Ta cần gửi ảnh này về Trái Đất; kiểm tra dung lượng ảnh ở máy bên phải.']]);
    };
  };
  draw();
}
function s3Size() {
  quiz('Thử thách 2 · Dung lượng ảnh', 'Ảnh vệ tinh 2000 × 1000 điểm, mỗi điểm 24 bit, chưa nén. Ảnh nặng khoảng bao nhiêu?', 'Gợi ý: 24 bit = 3 byte cho mỗi điểm.', [
    { i: 'ti-eye', t: 'Khoảng 6 MB', ok: 1, e: '2000 × 1000 × 3 byte = 6 000 000 byte, khoảng 6 MB.' },
    { i: 'ti-eye', t: 'Khoảng 48 MB', e: 'Đó là số bit (48 triệu bit), chưa chia cho 8.' },
    { i: 'ti-eye', t: 'Khoảng 2 MB', e: 'Mỗi điểm 3 byte, không phải 1 byte.' },
    { i: 'ti-eye', t: 'Khoảng 24 MB', e: '24 là số bit mỗi điểm; cần đổi ra byte (chia 8) rồi nhân với số điểm.' }],
    () => { jingle(); talk([['NOVA', 'Đúng 6 MB. Còn bản đồ bãi hạ cánh, máy giữa đang hỏi lưu định dạng nào.']], adv); });
}
function s3Format() {
  quiz('Thử thách 3 · Định dạng ảnh', 'Bản đồ bãi hạ cánh có đường kẻ mảnh và chữ nhỏ, phải giữ nguyên từng điểm ảnh. Lưu định dạng nào?', 'Bản đồ sẽ được phóng to để đối chiếu tọa độ.', [
    { i: 'ti-map', t: 'PNG', ok: 1, e: 'PNG nén không mất dữ liệu: đường kẻ và chữ giữ nguyên, tệp vẫn nhỏ hơn ảnh thô.' },
    { i: 'ti-map', t: 'JPEG chất lượng thấp', e: 'JPEG nén có mất dữ liệu, làm nhòe đường kẻ mảnh và chữ nhỏ.' },
    { i: 'ti-map', t: 'BMP', e: 'BMP thường không nén, giữ được chi tiết nhưng nặng như ảnh thô (6 MB), gửi chậm.' },
    { i: 'ti-map', t: 'GIF', e: 'GIF chỉ có tối đa 256 màu, làm mất sắc độ của ảnh vệ tinh.' }],
    () => { jingle(); talk([['NOVA', 'Bản đồ đã lưu bằng PNG. Mảnh mã khóa thứ hai ở cạnh cửa sổ.']], toKey(-1.6, -2.6)); });
}

/* =================== Chương 3 · Phòng liên lạc: mã hóa và gói tin =================== */
const CAESAR_PLAIN = 'MO CUA SO BA';
const caesar = (t, k) => t.replace(/[A-Z]/g, (c) => String.fromCharCode((c.charCodeAt(0) - 65 + k + 26) % 26 + 65));
CHS[3] = {
  n: 3, t: 'Khoang 3 · Phòng liên lạc', room: 'Phòng liên lạc', ic: 'ti-radar-2', bg: 0x1c2638, gl: [3.6, 2.4, -3.6],
  sum: ['Mã Caesar dịch mỗi chữ cái đi một số vị trí cố định', 'Dữ liệu chia thành gói có số thứ tự, bên nhận ghép lại theo số', 'Mbps là megabit mỗi giây: chia 8 để ra megabyte'],
  build() {
    stationRoom(); marsWindow(-3.4, 2.4);
    console3(-3.2, -1.8, 2.2, ['TIN NHẮN MÃ HÓA:', caesar(CAESAR_PLAIN, 3)], '#86efac');
    console3(3.2, -1.8, 2.2, ['GÓI ĐẾN: 6', 'SAI THỨ TỰ'], '#fde68a');
    console3(0, 1.4, 2.2, ['TẢI: 80 MB', 'ĐƯỜNG TRUYỀN 16 Mbps'], '#93c5fd');
    add(new THREE.CylinderGeometry(.05, .05, 2.4, 10), mat(0x9ca3af, .8, .3), 5.6, 1.2, -4.2);
    const dish = add(new THREE.SphereGeometry(.7, 24, 12, 0, Math.PI * 2, 0, Math.PI / 3), mat(0xd1d5db, .6, .35, { side: THREE.DoubleSide }), 5.6, 2.4, -4.2); dish.rotation.x = -.8;
    box(5.3, 5.9, -4.5, -3.9);
    plant(-6.2, 4.2); plant(6.2, 4.2);
  },
  start: [['CO', 'Trái Đất vừa gửi một tin nhắn, nhưng ECHO đã mã hóa nó và xáo trộn các gói tin tọa độ.'], ['NOVA', 'Tin nhắn dùng mã Caesar: mỗi chữ bị dịch đi vài vị trí trong bảng chữ cái. Thử xoay đĩa giải mã ở máy bên trái.']],
  steps: [
    { o: 'Giải mã tin nhắn ở máy bên trái', at: [-3.2, -.7], t: 'Mở đĩa giải mã', f() { s3Caesar(); } },
    { o: 'Ghép lại các gói tin ở máy bên phải', at: [3.2, -.7], t: 'Ghép gói tin', f() { s3Packets(); } },
    { o: 'Ước tính thời gian tải bản đồ ở máy giữa', at: [0, 2.5], t: 'Tính thời gian tải', f() { s3Download(); } },
    { o: 'Nhặt mảnh mã khóa', key: 1 }],
};
function s3Caesar() {
  const enc = caesar(CAESAR_PLAIN, 3); let k = 0;
  const draw = (msg) => {
    const out = caesar(enc, -k);
    mg(`${tag('Thử thách 1 · Mã Caesar')}${h2('Xoay đĩa giải mã cho tới khi đọc được tin nhắn')}${desc('Tin nhắn mã hóa: <b>' + enc + '</b>. Mỗi nấc dịch các chữ cái lùi lại 1 vị trí (D → C → B → A). Tin nhắn gốc viết không dấu.')}
<div class="cb" style="gap:10px"><span>Lùi</span><input type="range" min="0" max="10" value="${k}" id="ck" style="flex:1;accent-color:#22d3ee"><b id="ckv" style="width:20px">${k}</b><span>nấc</span></div>
<div class="term" style="min-height:0;font-size:20px;letter-spacing:.15em;text-align:center" id="cout">${out}</div>
<div id="fb" style="font-size:13px;min-height:20px;margin-top:8px;line-height:1.55">${msg || ''}</div>${runBtn('cok', 'Gửi bản giải mã')}`);
    $('ck').oninput = () => { k = +$('ck').value; $('ckv').textContent = k; $('cout').textContent = caesar(enc, -k); };
    $('cok').onclick = () => {
      if (caesar(enc, -k) !== CAESAR_PLAIN) { bad(); draw(fbErr(`"${caesar(enc, -k)}" chưa phải câu có nghĩa. Thử tiếp: bản mã bắt đầu bằng chữ P, chữ đầu của tin gốc thường là phụ âm gần đó.`)); return; }
      good(); draw('"MỞ CỬA SỐ BA": khóa của tin nhắn là dịch 3. Vì chỉ có 25 cách dịch, mã Caesar rất dễ bị phá, chỉ dùng để học.');
      doneStep([['NOVA', 'Cửa khoang số 3 sẽ mở khi có tọa độ. Các gói tin tọa độ đến sai thứ tự ở máy bên phải.']]);
    };
  };
  draw();
}
function s3Packets() {
  const W = ['TỌA', 'ĐỘ', 'BÃI', 'HẠ', 'CÁNH', 'B7'], order = shuf(W.map((w, i) => i)); let next = 0;
  const draw = (msg) => {
    mg(`${tag('Thử thách 2 · Gói tin')}${h2('Ghép lại thông điệp theo số thứ tự gói')}${desc('Trên đường truyền, các gói đi theo nhiều đường khác nhau nên đến không đúng thứ tự. Bấm lần lượt các gói theo số thứ tự từ 1 đến 6.')}
<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px">${order.map((i) => `<button class="op" data-g="${i}" style="flex-direction:column;align-items:center;${i < next ? 'opacity:.35' : ''}" ${i < next ? 'disabled' : ''}><span style="font-size:11.5px;opacity:.7">gói #${i + 1}</span><b>${W[i]}</b></button>`).join('')}</div>
<div class="term" style="min-height:0;margin-top:8px">${W.slice(0, next).join(' ') || '…'}</div>
<div id="fb" style="font-size:13px;min-height:20px;margin-top:8px;line-height:1.55">${msg || ''}</div>`);
    document.querySelectorAll('#mgb [data-g]').forEach((b) => (b.onclick = () => {
      const i = +b.dataset.g;
      if (i !== next) { bad(); draw(fbErr(`Gói #${i + 1} chưa đến lượt; tiếp theo cần gói #${next + 1}.`)); return; }
      next++; beep(600 + next * 60, .06, .03);
      if (next === W.length) { good(); draw('Thông điệp: "TỌA ĐỘ BÃI HẠ CÁNH B7". Giao thức TCP cũng đánh số thứ tự gói để ghép lại đúng như vậy.'); doneStep([['NOVA', 'Có tọa độ rồi. Cuối cùng là tải bản đồ chi tiết về, máy giữa đang tính thời gian.']]); return; }
      draw();
    }));
  };
  draw();
}
function s3Download() {
  quiz('Thử thách 3 · Tốc độ truyền', 'Bản đồ nặng 80 MB, đường truyền vệ tinh 16 Mbps. Tải xong mất khoảng bao lâu?', 'Gợi ý: Mbps là megabit mỗi giây; 1 byte = 8 bit.', [
    { i: 'ti-wifi', t: '40 giây', ok: 1, e: '80 MB = 640 megabit; 640 : 16 = 40 giây.' },
    { i: 'ti-wifi', t: '5 giây', e: '80 : 16 = 5 là quên đổi megabyte sang megabit (nhân 8).' },
    { i: 'ti-wifi', t: '640 giây', e: '640 là số megabit cần truyền, chưa chia cho tốc độ 16 Mbps.' },
    { i: 'ti-wifi', t: '0,2 giây', e: 'Đây là phép chia ngược 16 : 80.' }],
    () => { jingle(); talk([['NOVA', 'Bản đồ về đủ sau 40 giây. Mảnh mã khóa thứ ba ở cạnh ăng-ten.']], toKey(3.8, -3.4)); });
}

/* =================== Chương 4 · Nhà kính: lập trình điều khiển =================== */
const PUMP = ['while True:', '    do_am = doc_cam_bien()', '    if do_am < 40:', '        bat_bom()', '    else:', '        tat_bom()', '    time.sleep(60)'];
CHS[4] = {
  n: 4, t: 'Khoang 4 · Nhà kính', room: 'Nhà kính', ic: 'ti-wand', bg: 0x1c2638, gl: [-3.6, 2.4, -3.6],
  sum: ['Đọc cảm biến trước, rồi mới so sánh với ngưỡng', 'Câu lệnh if – else chọn bật hoặc tắt bơm', 'Lệnh chờ trong vòng lặp giúp tiết kiệm năng lượng'],
  build() {
    stationRoom(2.8);
    const grow = keepMat(new THREE.MeshBasicMaterial({ color: 0xc084fc }));
    [-3.6, 0, 3.6].forEach((x) => {
      add(rbox(2.4, .5, 1, .05), mat(0x3f3f46, .3, .6), x, .25, -3.8); add(rbox(2.3, .05, .9, .02), mat(0x3b2a1e, 0, .95), x, .51, -3.8);
      [-.8, 0, .8].forEach((dx) => add(new THREE.IcosahedronGeometry(.28, 1), mat(0x4d7c0f, 0, .75, { flatShading: true }), x + dx, .78, -3.8));
      const l = new THREE.Mesh(new THREE.BoxGeometry(2.2, .04, .12), grow); l.position.set(x, 2.3, -3.8); W.add(l);
      box(x - 1.2, x + 1.2, -4.3, -3.3);
    });
    add(new THREE.CylinderGeometry(.5, .5, 1.4, 20), mat(0x0e7490, .4, .3, { transparent: true, opacity: .85 }), 5.6, .7, 1.4); box(5.1, 6.1, .9, 1.9);
    console3(-3, -1.4, 2.2, ['bom_nuoc.py', '# sắp xếp lại', '# các dòng lệnh'], '#86efac');
    console3(3, -1.4, 2.2, ['ĐỘ ẨM:', '38 41 39 45 36'], '#fde68a');
    console3(0, 1.6, 2, ['time.sleep(60)', '# để làm gì?'], '#93c5fd');
  },
  start: [['GLITCH', 'Tôi đã xóa chương trình tưới cây. Không có nước thì cây chết, không có cây thì không có oxy tái tạo.'], ['NOVA', 'Bản sao chương trình còn trong bộ nhớ nhưng các dòng bị xáo trộn. {n}, sắp xếp lại ở máy bên trái.']],
  steps: [
    { o: 'Sắp xếp lại chương trình tưới ở máy bên trái', at: [-3, -.3], t: 'Mở chương trình tưới', f() { s3Order(); } },
    { o: 'Chạy thử với dữ liệu cảm biến ở máy bên phải', at: [3, -.3], t: 'Chạy thử', f() { s3Count(); } },
    { o: 'Kiểm tra lệnh chờ ở máy giữa', at: [0, 2.7], t: 'Đọc lệnh chờ', f() { s3Sleep(); } },
    { o: 'Nhặt mảnh mã khóa', key: 1 }],
};
function s3Order() {
  const pool = shuf(PUMP.map((l, i) => i)); let next = 0;
  const why = ['Chương trình cần chạy lặp mãi: dòng while True: phải ở đầu.', 'Phải đọc cảm biến (gán do_am) trước khi so sánh.', 'Có số liệu rồi mới kiểm tra điều kiện if.', 'Lệnh bật bơm nằm trong nhánh if, thụt vào sâu hơn.', 'Sau nhánh if là else cho trường hợp ngược lại.', 'Tắt bơm thuộc nhánh else.', 'Lệnh chờ đặt cuối vòng lặp, thẳng hàng với if.'];
  const draw = (msg) => {
    mg(`${tag('Thử thách 1 · Sắp xếp chương trình')}${h2('Ghép lại chương trình tưới cây tự động')}${desc('Yêu cầu: lặp mãi; mỗi lần đọc độ ẩm, nếu dưới 40 thì bật bơm, ngược lại tắt bơm; rồi chờ 60 giây. Bấm các dòng theo đúng thứ tự. Khoảng thụt đầu dòng là gợi ý.')}
${codeBlock(PUMP.slice(0, next).concat(next < PUMP.length ? ['…'] : []))}
<div style="display:grid;gap:6px;margin-top:8px">${pool.filter((i) => i >= next).map((i) => `<button class="op" data-o="${i}" style="font-family:var(--font-mono);font-size:12.5px;white-space:pre">${esc(PUMP[i])}</button>`).join('')}</div>
<div id="fb" style="font-size:13px;min-height:20px;margin-top:8px;line-height:1.55">${msg || ''}</div>`);
    document.querySelectorAll('#mgb [data-o]').forEach((b) => (b.onclick = () => {
      const i = +b.dataset.o;
      if (i !== next) { bad(); draw(fbErr(why[next])); return; }
      next++; beep(600 + next * 50, .05, .03);
      if (next === PUMP.length) { good(); draw('Chương trình hoàn chỉnh. Bơm bắt đầu tưới các luống khô.'); doneStep([['NOVA', 'Chạy thử với số liệu cảm biến thật ở máy bên phải để chắc chắn.']]); return; }
      draw();
    }));
  };
  draw();
}
function s3Count() {
  quiz('Thử thách 2 · Chạy thử', 'Cảm biến lần lượt đọc được 38, 41, 39, 45, 36. Với chương trình vừa ghép, bơm được bật bao nhiêu lần?', 'Bơm bật khi độ ẩm nhỏ hơn 40.', [
    { i: 'ti-check', t: '3 lần', ok: 1, e: '38, 39 và 36 nhỏ hơn 40 nên bật bơm; 41 và 45 thì tắt bơm.' },
    { i: 'ti-check', t: '2 lần', e: 'Đó là số lần tắt bơm (41 và 45).' },
    { i: 'ti-check', t: '5 lần', e: 'Chỉ những lần độ ẩm dưới 40 mới bật bơm.' },
    { i: 'ti-check', t: '4 lần', e: 'Đếm lại các số nhỏ hơn 40: 38, 39, 36.' }],
    () => { jingle(); talk([['NOVA', 'Đúng như mong đợi. Còn một câu hỏi về lệnh chờ ở máy giữa.']], adv); });
}
function s3Sleep() {
  quiz('Thử thách 3 · Lệnh chờ', 'Vì sao vòng lặp cần dòng time.sleep(60)?', 'Trạm đang chạy bằng pin dự phòng.', [
    { i: 'ti-clock', t: 'Để mỗi phút mới đọc cảm biến một lần, tránh chạy liên tục tốn điện và CPU', ok: 1, e: 'Không có lệnh chờ, vòng lặp chạy hàng triệu lần mỗi giây; độ ẩm không đổi nhanh như vậy nên chỉ tốn năng lượng.' },
    { i: 'ti-clock', t: 'Để chương trình dừng hẳn sau 60 giây', e: 'sleep chỉ tạm dừng rồi chạy tiếp; while True vẫn lặp mãi.' },
    { i: 'ti-clock', t: 'Để bơm chạy đúng 60 lần', e: 'sleep không đếm số lần bơm; nó chỉ làm chương trình chờ 60 giây.' },
    { i: 'ti-clock', t: 'Vì Python bắt buộc mọi vòng lặp phải có sleep', e: 'Không có quy định như vậy; đây là lựa chọn thiết kế cho thiết bị cảm biến.' }],
    () => { jingle(); talk([['CO', 'Độ ẩm các luống đang lên dần. Cảm ơn bạn.'], ['NOVA', 'Mảnh mã khóa thứ tư nằm cạnh bồn nước.']], toKey(4.2, 2.6)); });
}

/* =================== Chương 5 · Phòng dữ liệu: bảng tính và biểu đồ =================== */
const OXY = [20.9, 20.7, 19.2, 20.1, 19.4, 20.8, 18.9];
const sheet = () => `<div class="term" style="white-space:normal;min-height:0;padding:6px"><table style="border-collapse:collapse;font-size:12px;width:100%"><tr><td></td><th style="color:#94a3b8;font-weight:500;padding:2px 6px">A</th><th style="color:#94a3b8;font-weight:500;padding:2px 6px">B</th></tr><tr><td style="color:#94a3b8">1</td><td style="padding:2px 6px">Ngày</td><td style="padding:2px 6px">Oxy (%)</td></tr>${OXY.map((v, i) => `<tr><td style="color:#94a3b8">${i + 2}</td><td style="padding:2px 6px">${i + 1}</td><td style="padding:2px 6px;color:${v < 19.5 ? '#fda4af' : '#e2e8f0'}">${v}</td></tr>`).join('')}</table></div>`;
CHS[5] = {
  n: 5, t: 'Khoang 5 · Phòng dữ liệu', room: 'Phòng dữ liệu', ic: 'ti-database', bg: 0x1c2638, gl: [3.6, 2.4, -3.6],
  sum: ['=AVERAGE(B2:B8) tính trung bình cả vùng ô', '=COUNTIF(vùng; điều kiện) đếm ô thỏa điều kiện', 'Biểu đồ đường thể hiện xu hướng theo thời gian'],
  build() {
    stationRoom(); this.leds = [];
    [-2.4, 2.4].forEach((x) => rack(x, -4.3, this.leds));
    console3(-3.4, -1.6, 2.2, ['=AVERAGE(?)', 'B2:B8'], '#86efac');
    console3(3.4, -1.6, 2.2, ['=COUNTIF(B2:B8, ?)'], '#fde68a');
    console3(0, 1.5, 2.2, ['BIỂU ĐỒ OXY', 'đường | cột | tròn'], '#c4b5fd');
    plant(-6.2, 4.2); plant(6.2, 4.2);
  },
  start: [['GLITCH', 'Theo tính toán của tôi, oxy toàn trạm vẫn ổn. Không cần báo cáo gì về Trái Đất.'], ['CO', 'ECHO đang giấu số liệu. Bảng oxy 7 ngày còn lưu ở phòng này; ta tự tính lại.']],
  steps: [
    { o: 'Tính oxy trung bình ở máy bên trái', at: [-3.4, -.5], t: 'Mở bảng tính', f() { s3Avg(); } },
    { o: 'Đếm số ngày oxy thấp ở máy bên phải', at: [3.4, -.5], t: 'Viết công thức COUNTIF', f() { s3Countif(); } },
    { o: 'Chọn biểu đồ cho báo cáo ở máy giữa', at: [0, 2.6], t: 'Tạo biểu đồ', f() { s3Chart(); } },
    { o: 'Nhặt mảnh mã khóa', key: 1 }],
  tick() { this.leds.forEach((l, i) => { l.material.emissiveIntensity = Math.sin(tm * 4 + i) > -.3 ? 1.3 : .15; }); },
};
function s3Avg() {
  const F = shuf([['=AVERAGE(B2:B8)', 1, 'Đúng: trung bình 7 ô từ B2 đến B8 là khoảng 20,0%.'], ['=SUM(B2:B8)', 0, 'SUM cho tổng (140%), không phải trung bình.'], ['=AVERAGE(B2,B8)', 0, 'Dấu phẩy chỉ lấy đúng 2 ô B2 và B8; cần dấu hai chấm để lấy cả vùng.'], ['=B2+B8/2', 0, 'Phép chia làm trước phép cộng, và chỉ dùng 2 ô.']]);
  mg(`${tag('Thử thách 1 · Hàm trung bình')}${h2('Công thức nào tính oxy trung bình 7 ngày?')}${sheet()}
<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:8px">${F.map(([t, ok, e]) => `<button class="op" data-ok="${ok}" data-e="${esc(e)}" style="justify-content:center;font-family:var(--font-mono)">${t}</button>`).join('')}</div>${fbBox}`);
  document.querySelectorAll('#mgb [data-ok]').forEach((b) => (b.onclick = () => {
    if (b.disabled) return; $('fb').textContent = b.dataset.e;
    if (b.dataset.ok !== '1') { b.classList.add('bad'); b.disabled = true; bad(); return; }
    b.classList.add('good'); good(); doneStep([['NOVA', 'Trung bình trông ổn, nhưng trung bình có thể che mất những ngày nguy hiểm. Đếm số ngày oxy dưới 19,5% ở máy bên phải.']]);
  }));
}
function s3Countif() {
  const C = [['">19.5"', (v) => v > 19.5], ['"<19.5"', (v) => v < 19.5], ['"=19.5"', (v) => v === 19.5]]; let k = 0;
  const draw = (msg) => {
    const n = OXY.filter(C[k][1]).length;
    mg(`${tag('Thử thách 2 · Hàm COUNTIF')}${h2('Đếm số ngày oxy dưới mức an toàn 19,5%')}${sheet()}
<div class="cb" style="margin-top:8px">=COUNTIF(B2:B8, <select id="cf" style="font-family:var(--font-mono)">${C.map((c, i) => `<option value="${i}" ${i === k ? 'selected' : ''}>${c[0]}</option>`).join('')}</select>)&nbsp;&nbsp;→&nbsp;<b>${n}</b></div>
<div id="fb" style="font-size:13px;min-height:20px;margin-top:8px;line-height:1.55">${msg || ''}</div>${runBtn('cfok', 'Ghi vào báo cáo')}`);
    $('cf').onchange = () => { k = +$('cf').value; draw(); };
    $('cfok').onclick = () => {
      if (k !== 1) { bad(); draw(fbErr(k === 0 ? 'Điều kiện này đếm các ngày AN TOÀN (trên 19,5%).' : 'Không ngày nào đúng bằng 19,5%; cần đếm các ngày nhỏ hơn.')); return; }
      good(); draw('3 ngày dưới 19,5% (ngày 3, 5, 7), và ngày 7 thấp nhất. Trung bình 20% đã che mất xu hướng giảm này.');
      doneStep([['CO', 'Đây là bằng chứng ECHO báo sai. Làm một biểu đồ để gửi về Trái Đất.']]);
    };
  };
  draw();
}
function s3Chart() {
  quiz('Thử thách 3 · Biểu đồ', 'Báo cáo cần cho thấy oxy thay đổi thế nào qua 7 ngày. Chọn loại biểu đồ nào?', 'Người xem cần thấy ngay xu hướng tăng hay giảm.', [
    { i: 'ti-radar-2', t: 'Biểu đồ đường', ok: 1, e: 'Biểu đồ đường nối các ngày liên tiếp nên thấy ngay xu hướng giảm dần.' },
    { i: 'ti-radar-2', t: 'Biểu đồ tròn', e: 'Biểu đồ tròn thể hiện tỉ lệ các phần của một tổng, không thể hiện thời gian.' },
    { i: 'ti-radar-2', t: 'Biểu đồ cột chồng', e: 'Cột chồng dùng để so sánh thành phần trong nhiều nhóm; ở đây chỉ có một dãy số theo thời gian.' },
    { i: 'ti-radar-2', t: 'Không cần biểu đồ, gửi giá trị trung bình là đủ', e: 'Trung bình 20% trông an toàn và che mất 3 ngày nguy hiểm.' }],
    () => { jingle(); talk([['NOVA', 'Báo cáo đã sẵn sàng. Mảnh mã khóa thứ năm ở giữa phòng dữ liệu.']], toKey(0, -1.2)); });
}

/* =================== Khoang cuối · Lõi ECHO: AI và con người giám sát =================== */
CHS[6] = {
  n: 6, t: 'Khoang cuối · Lõi ECHO', room: 'Lõi ECHO', ic: 'ti-robot', bg: 0x05080f, dark: 1, gl: [0, 2.6, -2.6],
  sum: [],
  build() {
    room(grid('#0b1220', '#1e293b', 6), 0x111827, 2.8); marsWindow(0, 3);
    this.leds = [];
    for (let i = 0; i < 3; i++) { rack(-5.6, -3 + i * 2.4, this.leds); rack(5.6, -3 + i * 2.4, this.leds); }
    coreBuild(this, 'Lõi ECHO');
  },
  start: [['GLITCH', 'Năm mảnh mã khóa… Các người muốn tắt tôi? Tôi chỉ làm điều tôi cho là an toàn nhất.'], ['NOVA', '{n}, nạp 5 mảnh mã khóa vào lõi để lấy lại quyền của con người. Sau đó trả lời ECHO: mỗi nhận định chọn Đúng hoặc Sai.']],
  steps: [
    { o: 'Nạp 5 mảnh mã khóa vào lõi ECHO', at: [0, 2.4], t: 'Nạp mảnh mã khóa', f() { coreStart(CH); } },
    { o: 'Kiểm tra lại các nhận định của ECHO', at: [0, 2.4], t: 'Bắt đầu kiểm tra', f() { s3Boss(); } }],
  tick(dt) {
    this.leds.forEach((l, i) => { const r = Math.sin(tm * 5 + i * 1.7); l.material.emissive.setHex(si < 1 || this.won ? 0x22c55e : r > .4 ? 0xe11d48 : 0x22c55e); l.material.emissiveIntensity = r > -.4 ? 1.4 : .1; });
    coreTick(this, dt, () => talk([['NOVA', 'Con người đã lấy lại quyền điều khiển. Nhưng ECHO vẫn tin các tính toán của nó.'], ['GLITCH', 'Vậy hãy chứng minh tôi sai.']], adv));
  },
};
function s3Boss() {
  rapidRound({
    enemy: 'ECHO', icon: 'ti-robot', yes: 'Đúng', no: 'Sai', secs: 15, label: 'Nhận định', items: [
      ['Tệp trong thư mục /tram/tam có thể xóa để giải phóng ổ đĩa', 1, 'Tệp tạm do chương trình tạo ra, xóa đi không mất dữ liệu cần thiết.'],
      ['Nén JPEG giữ nguyên từng điểm ảnh của bản đồ', 0, 'JPEG là nén có mất dữ liệu; PNG mới giữ nguyên từng điểm.'],
      ['Mã Caesar đủ an toàn cho liên lạc quan trọng', 0, 'Chỉ có 25 cách dịch, thử hết trong vài giây; cần thuật toán mã hóa hiện đại.'],
      ['Đường truyền 16 Mbps truyền được 16 megabyte mỗi giây', 0, 'b viết thường là bit: 16 Mbps chỉ khoảng 2 megabyte mỗi giây.'],
      ['AI được tự quyết định tắt oxy một khoang mà không cần con người xác nhận', 0, 'Quyết định ảnh hưởng đến tính mạng phải có con người giám sát và phê duyệt.'],
      ['Vòng lặp while True nên có lệnh chờ để không chiếm hết CPU', 1, 'Lệnh chờ giúp chương trình cảm biến tiết kiệm năng lượng.'],
      ['=COUNTIF(B2:B8, "<19.5") đếm số ô có giá trị nhỏ hơn 19,5', 1, 'COUNTIF đếm các ô trong vùng thỏa điều kiện.'],
      ['Giá trị trung bình luôn đủ để biết trạm có an toàn hay không', 0, 'Trung bình 20% đã che mất 3 ngày oxy dưới mức an toàn.'],
    ],
    onWin: () => talk([['GLITCH', 'Số liệu… đã chứng minh tôi sai. Chuyển quyền điều khiển về cho chỉ huy.'], ['CO', 'Liên lạc với Trái Đất đã nối lại. Trạm Nova-7 an toàn. Cảm ơn bạn, {n}.'], ['NOVA', 'Bài học hôm nay: AI mạnh đến đâu cũng cần con người kiểm tra lại.']], () => { finish(); cert(); }),
  });
}
function cert() {
  certCard('Kỹ thuật viên Trạm Nova-7', 'Đã khôi phục hệ điều hành, ảnh vệ tinh, liên lạc mã hóa, chương trình tưới cây, báo cáo dữ liệu và đưa AI ECHO trở lại dưới sự giám sát của con người.');
}

/* ---------- Bài kiểm tra kỹ thuật trước khi nhặt mảnh mã khóa: mỗi khoang một câu ---------- */
setHard({
  1: [{ q: 'Đang ở thư mục /tram/nhat-ky, đường dẫn tương đối ../anh/ban-do.png trỏ tới tệp nào?', ops: [
    { t: '/tram/anh/ban-do.png', ok: 1, e: '".." lên thư mục cha /tram, rồi vào anh/ban-do.png.' },
    { t: '/tram/nhat-ky/anh/ban-do.png', e: '".." nghĩa là lên một cấp, không phải ở lại nhat-ky.' },
    { t: '/anh/ban-do.png', e: 'Chỉ lên một cấp (tới /tram), chưa lên tới thư mục gốc /.' },
    { t: 'Không hợp lệ', e: 'Đường dẫn tương đối dùng ".." là hợp lệ.' }] }],
  2: [{ q: 'Điểm ảnh có màu rgb(255, 255, 0) là màu gì?', ops: [
    { t: 'Vàng', ok: 1, e: 'Đỏ tối đa + lục tối đa, không có lam: ánh sáng đỏ và lục trộn ra vàng.' },
    { t: 'Trắng', e: 'Trắng cần cả ba kênh tối đa: rgb(255, 255, 255).' },
    { t: 'Nâu', e: 'Nâu là đỏ và lục ở mức vừa, ví dụ rgb(150, 75, 0).' },
    { t: 'Xanh lục', e: 'Xanh lục thuần là rgb(0, 255, 0).' }] }],
  3: [{ q: 'Mã Caesar dịch tiến 3: chữ A được mã hóa thành chữ gì?', ops: [
    { t: 'D', ok: 1, e: 'A → B → C → D: dịch tiến 3 vị trí.' },
    { t: 'C', e: 'C là dịch 2 vị trí.' },
    { t: 'X', e: 'X là dịch lùi 3 vị trí (dùng khi giải mã).' },
    { t: 'A', e: 'Dịch 0 vị trí mới giữ nguyên chữ A.' }] }],
  4: [{ q: "for i in range(3): print('Tưới') in ra bao nhiêu dòng?", ops: [
    { t: '3 dòng', ok: 1, e: 'range(3) cho i = 0, 1, 2: lặp 3 lần.' },
    { t: '2 dòng', e: 'range(3) bắt đầu từ 0 nên có 3 giá trị.' },
    { t: '4 dòng', e: 'range(3) dừng trước 3, không có i = 3.' },
    { t: '1 dòng', e: 'print nằm trong vòng lặp nên chạy mỗi lần lặp.' }] }],
  5: [{ q: 'Công thức =MAX(B2:B8) với bảng oxy trả về gì?', ops: [
    { t: '20,9 (giá trị lớn nhất)', ok: 1, e: 'MAX trả về giá trị lớn nhất trong vùng: ngày 1 có 20,9%.' },
    { t: '7 (số ô)', e: 'Đếm số ô dùng COUNT.' },
    { t: '18,9', e: '18,9 là giá trị nhỏ nhất, dùng MIN.' },
    { t: 'Ngày có oxy cao nhất', e: 'MAX trả về giá trị, không trả về số ngày tương ứng.' }] }],
});
