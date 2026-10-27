# Đóng gói spa/dist/index.html thành trang Artifact (không có khung html/head/body) + bản HTML độc lập.
import re, pathlib
root = pathlib.Path(__file__).parent
s = (root / "dist/index.html").read_text()
head = re.search(r"<head>(.*)</head>", s, re.S).group(1)
start = head.index('<script type="module" crossorigin>')
end = head.rindex("</script>")
js = head[start + len('<script type="module" crossorigin>'):end]
# Bản một file không có chunk rời: bỏ phép tính URL chunk của import động
# (trong khung Artifact `document.baseURI` là about:blank → "Invalid URL").
js = re.sub(r'new URL\("[\w.-]+\.js",\s*document\.baseURI\)\.href', '""', js)
# Thư viện (string_decoder, xmlbuilder) có ký tự U+FFFD thô trong chuỗi JS: đổi sang escape \uFFFD (cùng giá trị khi chạy).
js = js.replace("\ufffd", "\\uFFFD")
css = "".join(re.findall(r"<style[^>]*>.*?</style>", head[:start] + head[end:], re.S))
loader = (root / "boot.html").read_text()
html = loader.replace("{{CSS}}", css).replace("{{JS}}", js)
(root / "artifact").mkdir(exist_ok=True)
(root / "artifact/edunova-ai.html").write_text(html)
(root / "edunova-ai-demo.html").write_text('<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>' + html + "</body></html>")
print("ok", len(html))
