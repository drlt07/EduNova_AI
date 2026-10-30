/* ===== Gói giao diện bảng thử thách và màu theo chương (mọi kịch bản, mọi phong cách) =====
 * Chèn cuối cùng (tools/nova/build.mjs), sau gói hình ảnh và gói nội dung.
 * 1. Mỗi chương một màu chủ đạo (--acc): nút, viền, khung mục tiêu, nút tương tác, dải LED trong phòng.
 *    Kịch bản có thể đặt bảng màu riêng bằng biến UI_ACC (mảng 6 màu) trước gói này.
 * 2. Bảng thử thách: dải tiêu đề có biểu tượng và tên chương, đáp án đánh chữ A/B/C/D, dấu ✓/✗ khi chọn,
 *    lời phản hồi thành ô thông báo màu (đúng / sai / gợi ý), hiệu ứng bật ra.
 */
const UI_CUTE = typeof cuteRoomBase !== 'undefined';
const UI_PAL = (typeof UI_ACC !== 'undefined' && UI_ACC) || (UI_CUTE
  ? ['#ec4899', '#a855f7', '#f97316', '#10b981', '#0ea5e9', '#e11d48']
  : ['#22d3ee', '#a78bfa', '#f59e0b', '#34d399', '#fb923c', '#f43f5e']);
function uiAccent(n) { return UI_PAL[((n || (CH && CH.n) || 1) - 1) % UI_PAL.length]; }
function uiAccentHex(n) { return parseInt(uiAccent(n).slice(1), 16); }

(function uiCss() {
  const st = document.createElement('style');
  const panelSoft = UI_CUTE ? 'rgba(255,255,255,.7)' : 'rgba(255,255,255,.04)';
  st.textContent = `
.g{--acc:#22d3ee}
.g .bt:not([style*="background"]){background:linear-gradient(180deg,color-mix(in srgb,var(--acc) 82%,white),color-mix(in srgb,var(--acc) 80%,black))!important;box-shadow:0 6px 16px color-mix(in srgb,var(--acc) 35%,transparent)!important}
.g .prompt{background:linear-gradient(180deg,color-mix(in srgb,var(--acc) 82%,white),color-mix(in srgb,var(--acc) 78%,black))!important}
.g #hudL{border-left:3px solid var(--acc)}
.g .hard-tag{color:var(--acc)!important;border-color:color-mix(in srgb,var(--acc) 55%,transparent)!important;background:color-mix(in srgb,var(--acc) 12%,transparent)!important}
.g input[type=range]{accent-color:var(--acc)}
/* Bảng thử thách */
.g #mg:not(.hidden) .pn{animation:uiPop .32s cubic-bezier(.2,.9,.3,1.15)}
@keyframes uiPop{from{transform:translateY(14px) scale(.96);opacity:0}to{transform:none;opacity:1}}
.g .mg-head{display:flex;align-items:center;gap:10px;margin:-18px -20px 14px;padding:12px 20px;border-bottom:1px solid color-mix(in srgb,var(--acc) 30%,transparent);background:linear-gradient(90deg,color-mix(in srgb,var(--acc) 22%,transparent),transparent 75%);border-radius:inherit;border-bottom-left-radius:0;border-bottom-right-radius:0}
.g .mg-head .ic{width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:19px;background:var(--acc);color:${UI_CUTE ? '#fff' : '#0b1220'};flex-shrink:0;box-shadow:0 4px 12px color-mix(in srgb,var(--acc) 40%,transparent)}
.g .mg-head .tt{font-size:12px;letter-spacing:.06em;text-transform:uppercase;opacity:.75;line-height:1.3}
.g .mg-head .rm2{font-size:14px;font-weight:600;line-height:1.3}
.g #mgb .op{transition:transform .12s,border-color .12s,background .12s;position:relative}
.g #mgb .op:not([disabled]):hover{transform:translateY(-1px);border-color:var(--acc)!important}
.g #mgb [data-i].op,.g #mgb [data-j].op{counter-increment:uiopt;padding-left:46px!important;min-height:44px}
.g #mgb [data-i].op::before,.g #mgb [data-j].op::before{content:counter(uiopt,upper-alpha);position:absolute;left:10px;top:50%;transform:translateY(-50%);width:26px;height:26px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:12.5px;font-weight:700;background:color-mix(in srgb,var(--acc) 18%,transparent);color:var(--acc)}
.g #mgb [data-i].op i,.g #mgb [data-j].op i{display:none}
.g #mgb div:has(>[data-i].op),.g #mgb div:has(>[data-j].op){counter-reset:uiopt}
.g #mgb .op.good::after,.g #mgb .op.bad::after{position:absolute;right:12px;top:50%;transform:translateY(-50%);font-weight:800;font-size:15px}
.g #mgb .op.good::after{content:"✓";color:#10b981}
.g #mgb .op.bad::after{content:"✗";color:#e11d48}
.g #mgb .op.good::before{background:#10b981!important;color:#fff!important}
.g #mgb .op.bad::before{background:#e11d48!important;color:#fff!important}
.g #fb.fb-ok,.g #fb.fb-err,.g #fb.fb-info{padding:10px 12px 10px 38px;border-radius:12px;position:relative;margin-top:12px!important}
.g #fb.fb-ok{background:color-mix(in srgb,#10b981 14%,transparent);border:1px solid color-mix(in srgb,#10b981 40%,transparent)}
.g #fb.fb-err{background:color-mix(in srgb,#e11d48 12%,transparent);border:1px solid color-mix(in srgb,#e11d48 38%,transparent)}
.g #fb.fb-info{background:${panelSoft};border:1px solid color-mix(in srgb,var(--acc) 35%,transparent)}
.g #fb.fb-ok::before,.g #fb.fb-err::before,.g #fb.fb-info::before{position:absolute;left:12px;top:10px;font-weight:800}
.g #fb.fb-ok::before{content:"✓";color:#10b981}
.g #fb.fb-err::before{content:"!";color:#e11d48}
.g #fb.fb-info::before{content:"i";color:var(--acc);font-style:italic}
.g #fb.fb-err span{color:inherit!important}
.g .term{border-left:3px solid color-mix(in srgb,var(--acc) 60%,transparent)}`;
  document.head.appendChild(st);
})();

/* Dải tiêu đề + phân loại phản hồi mỗi khi nội dung bảng thay đổi */
let uiLastBtn = null;
$('mgb').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) uiLastBtn = b; }, true);
function uiDecorate() {
  const mgb = $('mgb');
  if (CH && !mgb.querySelector('.mg-head') && !$('mg').classList.contains('hidden')) {
    const h = document.createElement('div'); h.className = 'mg-head';
    const [part, room] = String(CH.t || '').split(' · ');
    h.innerHTML = `<div class="ic"><i class="ti ${CH.ic || 'ti-star'}" aria-hidden="true"></i></div><div><div class="tt">${part || ''}</div><div class="rm2">${room || CH.room || ''}</div></div>`;
    mgb.prepend(h);
  }
  const fb = $('fb');
  if (fb) {
    const txt = fb.textContent.trim(), html = fb.innerHTML;
    let k = '';
    if (txt) {
      if (/be123c|fda4af/.test(html) || /^(Sai|Chưa đúng|Hết giờ)/.test(txt) || (uiLastBtn && uiLastBtn.classList.contains('bad') && mgb.contains(uiLastBtn))) k = 'fb-err';
      else if ((uiLastBtn && uiLastBtn.classList.contains('good') && mgb.contains(uiLastBtn)) || /6ee7b7|0f766e/.test(html) || /^(Đúng|Chính xác|Tìm thấy|Xong|Đã )/.test(txt)) k = 'fb-ok';
      else k = 'fb-info';
    }
    if (fb.dataset.k !== k) { fb.classList.remove('fb-ok', 'fb-err', 'fb-info'); if (k) fb.classList.add(k); fb.dataset.k = k; }
  }
}
new MutationObserver(() => requestAnimationFrame(uiDecorate)).observe($('mgb'), { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['class'] });
new MutationObserver(uiDecorate).observe($('mg'), { attributes: true, attributeFilter: ['class'] });

/* Màu chủ đạo đổi theo chương */
const uiLoad = load;
load = function (n) { const r = uiLoad(n); G.style.setProperty('--acc', uiAccent(n)); return r; };
G.style.setProperty('--acc', uiAccent(1));
