/* ===== Gói âm thanh và toàn màn hình cho "Sự cố ở Ngôi nhà Nova" =====
 * Chèn sau gói đồ họa (tools/nova/build.mjs). Nhạc nền sinh bằng Web Audio (không cần tệp nhạc): mỗi phòng một
 * giai điệu, trận cuối dồn dập hơn; tiếng bước chân khi đi. Nút loa gốc vẫn tắt/bật mọi âm thanh; thêm nút nhạc,
 * thanh âm lượng và nút toàn màn hình (phím F). Lựa chọn được nhớ trên trình duyệt.
 */
const AUD = (() => { try { return Object.assign({ music: true, vol: .7 }, JSON.parse(localStorage.getItem('nova_audio') || '{}')); } catch (e) { return { music: true, vol: .7 }; } })();
function audSave() { try { localStorage.setItem('nova_audio', JSON.stringify(AUD)); } catch (e) { /* bộ nhớ bị chặn: bỏ qua */ } }
const SVG = {
  music: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>',
  musicOff: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/><path d="M3 3l18 18"/></svg>',
  full: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
  exit: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>',
};

/* ---------- Nút điều khiển trên thanh trên cùng ---------- */
const bar = $('mute').parentElement;
const mBtn = document.createElement('button'); mBtn.className = 'chip'; mBtn.style.cssText = 'border:none;cursor:pointer;display:flex;align-items:center';
const vol = document.createElement('input'); vol.type = 'range'; vol.min = '0'; vol.max = '1'; vol.step = '.05'; vol.value = String(AUD.vol); vol.setAttribute('aria-label', 'Âm lượng'); vol.style.cssText = 'width:70px;accent-color:#22d3ee;cursor:pointer';
const volWrap = document.createElement('div'); volWrap.className = 'chip'; volWrap.style.cssText = 'display:flex;align-items:center;padding:4px 10px'; volWrap.appendChild(vol);
const fBtn = document.createElement('button'); fBtn.className = 'chip'; fBtn.style.cssText = 'border:none;cursor:pointer;display:flex;align-items:center';
bar.insertBefore(mBtn, $('mute')); bar.insertBefore(volWrap, $('mute')); bar.appendChild(fBtn);
function drawAudioBtns() { mBtn.innerHTML = AUD.music ? SVG.music : SVG.musicOff; mBtn.setAttribute('aria-label', AUD.music ? 'Tắt nhạc nền' : 'Bật nhạc nền'); mBtn.title = mBtn.getAttribute('aria-label'); }
drawAudioBtns();

/* ---------- Toàn màn hình (khung trò chơi; trong iframe cần allowfullscreen) ---------- */
const fsEl = () => document.fullscreenElement || document.webkitFullscreenElement;
function drawFs() { const on = !!fsEl(); fBtn.innerHTML = on ? SVG.exit : SVG.full; fBtn.setAttribute('aria-label', on ? 'Thoát toàn màn hình (F)' : 'Toàn màn hình (F)'); fBtn.title = fBtn.getAttribute('aria-label'); G.style.height = on ? '100vh' : ''; G.style.borderRadius = on ? '0' : ''; }
function toggleFs() {
  try {
    if (fsEl()) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    else { const r = (G.requestFullscreen || G.webkitRequestFullscreen); const p = r && r.call(G); if (p && p.catch) p.catch(() => toast('Trình duyệt chưa cho phép toàn màn hình ở trang này.')); }
  } catch (e) { toast('Trình duyệt chưa cho phép toàn màn hình ở trang này.'); }
}
fBtn.onclick = toggleFs;
['fullscreenchange', 'webkitfullscreenchange'].forEach((ev) => document.addEventListener(ev, () => { drawFs(); setTimeout(size, 60); }));
addEventListener('keydown', (e) => { if (e.key.toLowerCase() === 'f' && document.activeElement !== $('nm') && e.target.tagName !== 'SELECT' && e.target.tagName !== 'INPUT') toggleFs(); });
drawFs();

/* ---------- Nhạc nền sinh bằng Web Audio ---------- */
// Mỗi phòng: tốc độ, nốt gốc (MIDI), vòng hợp âm (bậc so với gốc, 3 nốt), kiểu sóng giai điệu.
const SONGS = {
  title: { bpm: 72, root: 57, prog: [[0, 4, 7], [-3, 0, 4], [-7, -3, 0], [-5, -1, 2]], lead: 'sine', pad: .9 },
  1: { bpm: 96, root: 60, prog: [[0, 4, 7], [-3, 0, 4], [-7, -3, 0], [-5, -1, 2]], lead: 'triangle' },
  2: { bpm: 100, root: 62, prog: [[0, 4, 7], [5, 9, 12], [-3, 0, 4], [-5, -1, 2]], lead: 'triangle' },
  3: { bpm: 92, root: 65, prog: [[0, 4, 7], [2, 5, 9], [-1, 2, 5], [0, 4, 7]], lead: 'sine' },
  4: { bpm: 108, root: 64, prog: [[0, 4, 7], [-5, -1, 2], [-3, 0, 4], [-7, -3, 0]], lead: 'square' },
  5: { bpm: 88, root: 59, prog: [[0, 3, 7], [-4, 0, 3], [-2, 2, 5], [-5, -2, 2]], lead: 'triangle' },
  6: { bpm: 132, root: 57, prog: [[0, 3, 7], [0, 3, 7], [-4, 0, 3], [-2, 2, 5]], lead: 'sawtooth', tense: 1 },
};
let music = null; // { gain, filter, next, step, key }
const midiHz = (m) => 440 * Math.pow(2, (m - 69) / 12);
function ensureMusic() {
  if (!AUD.music || !snd) return null;
  try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; }
  if (ac.state === 'suspended') ac.resume();
  if (!music) {
    const gain = ac.createGain(); gain.gain.value = 0; const filter = ac.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 2400;
    filter.connect(gain); gain.connect(ac.destination);
    music = { gain, filter, next: ac.currentTime + .1, step: 0, key: '' };
  }
  return music;
}
function note(dest, type, hz, t, dur, vol, attack) {
  const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.value = hz;
  g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + (attack || .01)); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  o.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + .05);
}
function songKey() { return st === 'play' && CH ? String(CH.n) : 'title'; }
function scheduleMusic() {
  const m = ensureMusic();
  const want = AUD.music && snd ? .55 * AUD.vol : 0;
  if (!m) { if (music) music.gain.gain.setTargetAtTime(0, ac.currentTime, .2); return; }
  m.gain.gain.setTargetAtTime(want * .35, ac.currentTime, .4);
  const k = songKey(); if (k !== m.key) { m.key = k; m.step = 0; m.next = Math.max(m.next, ac.currentTime + .05); }
  const S2 = SONGS[k] || SONGS.title, beat = 60 / S2.bpm / 2; // nốt móc đơn
  m.filter.frequency.setTargetAtTime(S2.tense ? 1800 : 2600, ac.currentTime, .5);
  while (m.next < ac.currentTime + .35) {
    const t = m.next, bar = Math.floor(m.step / 8) % S2.prog.length, i = m.step % 8, ch = S2.prog[bar].map((x) => S2.root + x);
    if (i === 0) {
      ch.forEach((n) => note(m.filter, 'sine', midiHz(n), t, beat * 8.2, .05 * (S2.pad || .6), .35)); // nền hợp âm
      note(m.filter, 'sine', midiHz(ch[0] - 12), t, beat * 3.5, .12); // bè trầm
    }
    if (i === 4) note(m.filter, 'sine', midiHz(ch[0] - 12), t, beat * 3.5, .09);
    if (k !== 'title') {
      const arp = [0, 1, 2, 1, 2, 0, 1, 2][i], up = i === 3 || i === 7 ? 12 : 0;
      note(m.filter, S2.lead, midiHz(ch[arp] + 12 + up), t, beat * (S2.tense ? .7 : 1.4), S2.lead === 'square' || S2.lead === 'sawtooth' ? .022 : .045);
      if (S2.tense && i % 2 === 0) note(m.filter, 'square', midiHz(ch[0] - 24), t, beat * .5, .05); // nhịp dồn trận cuối
    }
    m.next += beat; m.step++;
  }
}
setInterval(scheduleMusic, 100);
mBtn.onclick = () => { AUD.music = !AUD.music; audSave(); drawAudioBtns(); scheduleMusic(); };
vol.oninput = () => { AUD.vol = +vol.value; audSave(); };
// Nút loa gốc chỉ đổi biến snd; nhạc theo cùng (vòng lặp scheduleMusic đọc snd mỗi 100 ms).

/* ---------- Tiếng bước chân ---------- */
let stepPhase = 0, noiseBuf = null;
function stepSound() {
  if (!snd || !ac) return;
  if (!noiseBuf) { noiseBuf = ac.createBuffer(1, ac.sampleRate * .08, ac.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3); }
  const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
  s.buffer = noiseBuf; f.type = 'bandpass'; f.frequency.value = CH && CH.outdoor ? 900 : 1400 + Math.random() * 300; f.Q.value = 1.2; g.gain.value = .06 * AUD.vol;
  s.connect(f); f.connect(g); g.connect(ac.destination); s.start();
}
(function stepLoop() {
  if (walkT && st === 'play') { const ph = Math.floor(walkT / Math.PI); if (ph !== stepPhase) { stepPhase = ph; stepSound(); } } else stepPhase = 0;
  requestAnimationFrame(stepLoop);
})();
// Hiệu ứng gốc theo thanh âm lượng: khai báo lại beep (cùng script, khai báo sau thắng).
function beep(f, d, v, type) { if (!snd) return; try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); const o = ac.createOscillator(), g = ac.createGain(); o.type = type || 'sine'; o.frequency.value = f; g.gain.value = Math.max(.0002, (v || .05) * AUD.vol * 1.4); g.gain.exponentialRampToValueAtTime(.0001, ac.currentTime + d); o.connect(g); g.connect(ac.destination); o.start(); o.stop(ac.currentTime + d); } catch (e) { /* trình duyệt không có Web Audio */ } }
