"""Cắt font Tabler Icons 3.19.0 chỉ giữ các biểu tượng trò chơi dùng, ghi vendor/icons.css.
Chạy: python3 tools/nova/subset-icons.py <thư mục package của @tabler/icons-webfont@3.19.0>
Danh sách biểu tượng: mọi lớp ti-* xuất hiện trong game.src.html và các gói *.js của thư mục này."""
import base64, io, pathlib, re, sys
from fontTools import subset
from fontTools.ttLib import TTFont

here = pathlib.Path(__file__).parent
pkg = pathlib.Path(sys.argv[1])
css = (pkg / "dist/tabler-icons.min.css").read_text()
codes = dict(re.findall(r'\.ti-([a-z0-9-]+):before\{content:"\\([0-9a-f]+)"', css))
src = "".join(p.read_text() for p in [here / "game.src.html", *here.glob("*.js")])
used = sorted(set(re.findall(r"\bti-([a-z0-9]+(?:-[a-z0-9]+)*)", src)) & set(codes))
font = TTFont(pkg / "dist/fonts/tabler-icons.ttf")
for t in ("GSUB", "GPOS", "GDEF"):  # bảng ghép chữ làm fontTools lỗi; biểu tượng không cần
    if t in font: del font[t]
opts = subset.Options(); opts.flavor = "woff2"; opts.layout_features = []; opts.notdef_outline = True
sub = subset.Subsetter(opts); sub.populate(unicodes=[int(codes[n], 16) for n in used]); sub.subset(font)
buf = io.BytesIO(); font.flavor = "woff2"; font.save(buf)
b64 = base64.b64encode(buf.getvalue()).decode()
rules = "\n".join(f'.ti-{n}:before{{content:"\\{codes[n]}"}}' for n in used)
(here / "vendor/icons.css").write_text(
    "/* Tabler Icons 3.19.0 (MIT) — chỉ các biểu tượng trò chơi dùng, font nhúng sẵn. Sinh lại: xem tools/nova/README.md */\n"
    f'@font-face{{font-family:"tabler-icons";font-style:normal;font-weight:400;src:url(data:font/woff2;base64,{b64}) format("woff2")}}\n'
    '.ti{font-family:"tabler-icons"!important;speak:none;font-style:normal;font-weight:normal;font-variant:normal;text-transform:none;line-height:1;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}\n'
    + rules + "\n")
print(len(used), "biểu tượng:", " ".join(used))
