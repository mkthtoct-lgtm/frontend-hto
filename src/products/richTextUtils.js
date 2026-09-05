// ============================================================================
// TIỆN ÍCH CHO RichTextEditor.jsx
// ============================================================================
// - sanitizeFullHtml / sanitizeInlineHtml: làm sạch HTML theo whitelist thẻ,
//   dùng cho MỌI nội dung trước khi lưu state hoặc render bằng
//   dangerouslySetInnerHTML - chặn script/style/thuộc tính on*, chỉ giữ các
//   thẻ định dạng cơ bản.
// - splitInlineHtmlByLine / splitInlineHtmlByChar: tách 1 chuỗi HTML "rút
//   gọn" (chỉ có b/i/u/s/br) thành mảng theo dấu xuống dòng hoặc 1 ký tự,
//   KHÔNG làm vỡ thẻ đang mở khi ranh giới cắt ngang qua nó (vd 1 đoạn <b>
//   kéo dài qua 2 dòng vẫn được đóng/mở lại đúng ở mỗi mục).
// - toInlineDisplayHtml / toFullDisplayHtml: chuyển 1 giá trị (có thể là
//   HTML mới từ editor, hoặc text thuần từ dữ liệu cũ trước khi có tính
//   năng này) thành HTML an toàn để hiển thị - đảm bảo tương thích ngược.

const FULL_ALLOWED_TAGS = new Set([
  "b", "strong", "i", "em", "u", "s", "strike",
  "p", "div", "br",
  "ul", "ol", "li",
  "h2", "h3",
  "a",
]);

const INLINE_ALLOWED_TAGS = new Set(["b", "strong", "i", "em", "u", "s", "strike", "br"]);

const VOID_TAGS = new Set(["br"]);

// Các thẻ bị loại bỏ HOÀN TOÀN cùng nội dung bên trong (không giữ lại text con)
const STRIP_WITH_CONTENT = new Set(["script", "style", "iframe", "object", "embed", "noscript"]);

const NORMALIZE_TAG = { strong: "b", em: "i" };

function sanitizeNode(node, allowedTags, out) {
  if (node.nodeType === Node.TEXT_NODE) {
    out.appendChild(document.createTextNode(node.nodeValue));
    return;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return;

  const tag = node.tagName.toLowerCase();

  if (STRIP_WITH_CONTENT.has(tag)) return;

  if (allowedTags.has(tag)) {
    const cleanTag = NORMALIZE_TAG[tag] || tag;
    const clean = document.createElement(cleanTag);
    if (cleanTag === "a") {
      const href = (node.getAttribute("href") || "").trim();
      if (/^(https?:|mailto:)/i.test(href)) {
        clean.setAttribute("href", href);
        clean.setAttribute("target", "_blank");
        clean.setAttribute("rel", "noopener noreferrer");
      }
    }
    out.appendChild(clean);
    if (!VOID_TAGS.has(cleanTag)) {
      Array.from(node.childNodes).forEach((child) => sanitizeNode(child, allowedTags, clean));
    }
    return;
  }

  // Thẻ không nằm trong whitelist: "gỡ vỏ", vẫn giữ nội dung con bên trong
  Array.from(node.childNodes).forEach((child) => sanitizeNode(child, allowedTags, out));
}

function sanitizeHtml(html, allowedTags) {
  if (!html) return "";
  const src = document.createElement("div");
  src.innerHTML = html;
  const out = document.createElement("div");
  Array.from(src.childNodes).forEach((child) => sanitizeNode(child, allowedTags, out));
  return out.innerHTML;
}

export const sanitizeFullHtml = (html) => sanitizeHtml(html, FULL_ALLOWED_TAGS);
export const sanitizeInlineHtml = (html) => sanitizeHtml(html, INLINE_ALLOWED_TAGS);

// Văn bản thuần (bỏ hết thẻ) - dùng để kiểm tra rỗng, so khớp tiền tố...
export const stripHtmlTags = (html) => {
  if (!html) return "";
  const div = document.createElement("div");
  div.innerHTML = html;
  return (div.textContent || div.innerText || "").trim();
};

// Chuỗi này trông giống HTML thật (đã từng qua editor) hay là text thuần
// (dữ liệu cũ, nhập trước khi có tính năng soạn thảo định dạng)?
const looksLikeHtml = (text) =>
  /<\/?(b|strong|i|em|u|s|strike|br|p|div|ul|ol|li|h2|h3|a)\b[^>]*>/i.test(text);

const escapeHtml = (text) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Chuyển 1 giá trị (HTML mới HOẶC text thuần cũ) sang HTML an toàn để hiển
// thị bằng dangerouslySetInnerHTML - tương thích ngược với dữ liệu đã lưu
// trước khi có tính năng soạn thảo định dạng này.
export const toInlineDisplayHtml = (text) => {
  if (!text) return "";
  return looksLikeHtml(text) ? sanitizeInlineHtml(text) : escapeHtml(text);
};

export const toFullDisplayHtml = (text) => {
  if (!text) return "";
  if (looksLikeHtml(text)) return sanitizeFullHtml(text);
  return text
    .split(/\n{2,}/)
    .map((para) => `<p>${escapeHtml(para).replace(/\n/g, "<br>")}</p>`)
    .join("");
};

// ── Tách / nối nội dung rút gọn, giữ định dạng qua ranh giới cắt ───────────

const tokenize = (html) => {
  const tokens = [];
  const re = /<[^>]+>/g;
  let last = 0;
  let m;
  while ((m = re.exec(html)) !== null) {
    if (m.index > last) tokens.push({ type: "text", value: html.slice(last, m.index) });
    tokens.push({ type: "tag", value: m[0] });
    last = re.lastIndex;
  }
  if (last < html.length) tokens.push({ type: "text", value: html.slice(last) });
  return tokens;
};

function splitTokens(tokens, { byBr = false, byChar = null }) {
  const segments = [[]];
  const openStack = [];

  const closeAllOpenInto = (segTokens) => {
    for (let i = openStack.length - 1; i >= 0; i--) segTokens.push({ type: "tag", value: `</${openStack[i]}>` });
  };
  const reopenAllInto = (segTokens) => {
    openStack.forEach((t) => segTokens.push({ type: "tag", value: `<${t}>` }));
  };
  const newSegment = () => {
    const cur = segments[segments.length - 1];
    closeAllOpenInto(cur);
    segments.push([]);
    reopenAllInto(segments[segments.length - 1]);
  };

  tokens.forEach((tok) => {
    if (tok.type === "tag") {
      const tagMatch = /^<\/?([a-z0-9]+)/i.exec(tok.value);
      const tagName = tagMatch ? tagMatch[1].toLowerCase() : "";
      const isClosing = /^<\//.test(tok.value);
      const isBr = tagName === "br" && !isClosing;

      if (byBr && isBr) {
        newSegment();
        return;
      }
      segments[segments.length - 1].push(tok);
      if (!isBr) {
        if (isClosing) {
          const idx = openStack.lastIndexOf(tagName);
          if (idx !== -1) openStack.splice(idx, 1);
        } else {
          openStack.push(tagName);
        }
      }
      return;
    }

    if (byChar) {
      let buf = "";
      for (const ch of tok.value) {
        if (ch === byChar) {
          if (buf) segments[segments.length - 1].push({ type: "text", value: buf });
          buf = "";
          newSegment();
        } else {
          buf += ch;
        }
      }
      if (buf) segments[segments.length - 1].push({ type: "text", value: buf });
    } else {
      segments[segments.length - 1].push(tok);
    }
  });

  return segments.map((segTokens) => segTokens.map((t) => t.value).join(""));
}

// Tách 1 ô rich-text rút gọn (Điểm nổi bật / Các bước quy trình) thành mảng
// HTML theo từng dòng - đã trim và loại bỏ dòng rỗng.
export const splitInlineHtmlByLine = (html) => {
  if (!html) return [];
  const clean = sanitizeInlineHtml(html);
  const segments = splitTokens(tokenize(clean), { byBr: true });
  return segments.map((s) => s.trim()).filter((s) => stripHtmlTags(s).length > 0);
};

// Tách 1 ô rich-text rút gọn (Tags) thành mảng HTML theo 1 ký tự phân cách
// (vd dấu phẩy) - đã trim và loại bỏ mục rỗng.
export const splitInlineHtmlByChar = (html, char) => {
  if (!html) return [];
  const clean = sanitizeInlineHtml(html);
  const segments = splitTokens(tokenize(clean), { byChar: char });
  return segments.map((s) => s.trim()).filter((s) => stripHtmlTags(s).length > 0);
};

// Nối mảng giá trị (HTML mới hoặc text thuần cũ) thành 1 chuỗi để đổ vào ô
// rich-text rút gọn khi mở form sửa 1 sản phẩm đã lưu trước đó.
const toSafeItemHtml = (item) => (looksLikeHtml(item) ? sanitizeInlineHtml(item) : escapeHtml(item));
export const joinInlineHtmlByLine = (items) => (items || []).map(toSafeItemHtml).join("<br>");
export const joinInlineHtmlByChar = (items, sep) => (items || []).map(toSafeItemHtml).join(sep);
