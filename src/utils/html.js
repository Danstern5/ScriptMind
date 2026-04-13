export function stripHtml(html) {
  return html.replace(/<[^>]*>/g, "");
}

export function escapeXml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function htmlToFdxTextNodes(html) {
  const plain = html.replace(/<br\s*\/?>/gi, "\n");
  const parts = [];
  const tagRe = /<(b|strong|i|em|u)>(.*?)<\/\1>/gi;
  let last = 0;
  let m;
  while ((m = tagRe.exec(plain)) !== null) {
    if (m.index > last) {
      const text = plain.slice(last, m.index).replace(/<[^>]*>/g, "");
      if (text) parts.push({ style: "", text });
    }
    const tag = m[1].toLowerCase();
    const style = (tag === "b" || tag === "strong") ? "Bold" : tag === "i" || tag === "em" ? "Italic" : "Underline";
    parts.push({ style, text: m[2].replace(/<[^>]*>/g, "") });
    last = m.index + m[0].length;
  }
  if (last < plain.length) {
    const text = plain.slice(last).replace(/<[^>]*>/g, "");
    if (text) parts.push({ style: "", text });
  }
  if (parts.length === 0) parts.push({ style: "", text: plain.replace(/<[^>]*>/g, "") });
  return parts.map(p =>
    p.style
      ? `<Text Style="${p.style}">${escapeXml(p.text)}</Text>`
      : `<Text>${escapeXml(p.text)}</Text>`
  ).join("");
}

export function htmlToFountain(html) {
  return html
    .replace(/<b>(.*?)<\/b>/gi, "**$1**")
    .replace(/<strong>(.*?)<\/strong>/gi, "**$1**")
    .replace(/<i>(.*?)<\/i>/gi, "*$1*")
    .replace(/<em>(.*?)<\/em>/gi, "*$1*")
    .replace(/<u>(.*?)<\/u>/gi, "_$1_")
    .replace(/<[^>]*>/g, "");
}
