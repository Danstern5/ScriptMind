import { uid } from "./ids";

export function parseFountain(text, fallbackElements) {
  const lines = text.split("\n");
  const elements = [];
  let i = 0;
  while (i < lines.length && lines[i].match(/^(Title|Credit|Author|Source|Draft date|Contact|Copyright):/i)) {
    i++;
    while (i < lines.length && lines[i].startsWith("  ")) i++;
  }
  while (i < lines.length && lines[i].trim() === "") i++;

  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line) { i++; continue; }
    if (line.match(/^>.*<$/)) {
      elements.push({ id: uid(), type: "centered", text: line.replace(/^>\s*/, "").replace(/\s*<$/, "") });
    } else if (line.match(/^(INT\.|EXT\.|INT\/EXT|I\/E)/i)) {
      elements.push({ id: uid(), type: "scene-heading", text: line.toUpperCase() });
    } else if (line.startsWith(">") && !line.startsWith(">>")) {
      elements.push({ id: uid(), type: "transition", text: line.replace(/^>\s*/, "").toUpperCase() });
    } else if (line.match(/^\(.*\)$/)) {
      elements.push({ id: uid(), type: "parenthetical", text: line });
    } else if (line === line.toUpperCase() && line.length > 1 && !line.match(/^(INT\.|EXT\.)/) && line.match(/^[A-Z]/)) {
      elements.push({ id: uid(), type: "character", text: line });
      i++;
      while (i < lines.length) {
        const dl = lines[i].trim();
        if (!dl) break;
        if (dl.match(/^\(.*\)$/)) {
          elements.push({ id: uid(), type: "parenthetical", text: dl });
        } else {
          elements.push({ id: uid(), type: "dialogue", text: dl });
        }
        i++;
      }
      continue;
    } else {
      elements.push({ id: uid(), type: "action", text: line });
    }
    i++;
  }
  return elements.length > 0 ? elements : fallbackElements;
}

export function parseFDX(xmlText, fallbackElements) {
  const elements = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, "text/xml");
  const paragraphs = doc.querySelectorAll("Paragraph");
  paragraphs.forEach((p) => {
    const pType = p.getAttribute("Type") || "";
    const textNodes = p.querySelectorAll("Text");
    const text = Array.from(textNodes).map((t) => t.textContent).join("");
    if (!text.trim()) return;
    const typeMap = {
      "Scene Heading": "scene-heading",
      "Action": "action",
      "Character": "character",
      "Dialogue": "dialogue",
      "Parenthetical": "parenthetical",
      "Transition": "transition",
      "Shot": "shot",
      "General": "centered",
    };
    elements.push({ id: uid(), type: typeMap[pType] || "action", text: text.trim() });
  });
  return elements.length > 0 ? elements : fallbackElements;
}
