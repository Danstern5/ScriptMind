import { escapeXml, htmlToFdxTextNodes, htmlToFountain } from "./html";

const FDX_TYPE_MAP = {
  "scene-heading": "Scene Heading",
  "action": "Action",
  "character": "Character",
  "dialogue": "Dialogue",
  "parenthetical": "Parenthetical",
  "transition": "Transition",
  "shot": "Shot",
  "centered": "Action",
};

export function elementsToFDX(elements, title = "Untitled", tp = null) {
  const t = tp || { title, credit: "written by", author: "Writer", source: "", draftDate: "", contact: "" };
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<FinalDraft DocumentType="Script" Template="No" Version="5">\n`;
  xml += `  <Content>\n`;
  const collectFdxGroup = (startIdx) => {
    const group = [startIdx];
    for (let j = startIdx + 1; j < elements.length; j++) {
      if (elements[j].type === "dialogue" || elements[j].type === "parenthetical") group.push(j);
      else break;
    }
    return group;
  };
  const writeParagraph = (el, dualPos) => {
    const fdxType = FDX_TYPE_MAP[el.type] || "Action";
    const alignment = el.type === "centered" ? ` Alignment="Center"` : "";
    const pos = dualPos ? ` Position="${dualPos}"` : "";
    xml += `    <Paragraph Type="${fdxType}"${alignment}${pos}>\n`;
    xml += `      ${htmlToFdxTextNodes(el.text)}\n`;
    xml += `    </Paragraph>\n`;
  };
  let fi = 0;
  while (fi < elements.length) {
    const el = elements[fi];
    if (el.type === "character" && !el.dual) {
      const leftGroup = collectFdxGroup(fi);
      const nextIdx = leftGroup[leftGroup.length - 1] + 1;
      if (nextIdx < elements.length && elements[nextIdx].type === "character" && elements[nextIdx].dual) {
        const rightGroup = collectFdxGroup(nextIdx);
        for (const idx of leftGroup) writeParagraph(elements[idx], "Left");
        for (const idx of rightGroup) writeParagraph(elements[idx], "Right");
        fi = rightGroup[rightGroup.length - 1] + 1;
        continue;
      }
    }
    writeParagraph(el, null);
    fi++;
  }
  xml += `  </Content>\n`;
  xml += `  <TitlePage>\n    <Content>\n`;
  xml += `      <Paragraph Type="Title"><Text>${escapeXml(t.title || title)}</Text></Paragraph>\n`;
  if (t.credit) xml += `      <Paragraph Type="Credit"><Text>${escapeXml(t.credit)}</Text></Paragraph>\n`;
  if (t.author) xml += `      <Paragraph Type="Author"><Text>${escapeXml(t.author)}</Text></Paragraph>\n`;
  if (t.source) xml += `      <Paragraph Type="Source"><Text>${escapeXml(t.source)}</Text></Paragraph>\n`;
  if (t.draftDate) xml += `      <Paragraph Type="Draft Date"><Text>${escapeXml(t.draftDate)}</Text></Paragraph>\n`;
  if (t.contact) xml += `      <Paragraph Type="Contact"><Text>${escapeXml(t.contact)}</Text></Paragraph>\n`;
  xml += `    </Content>\n  </TitlePage>\n`;
  xml += `</FinalDraft>\n`;
  return xml;
}

export function elementsToFountain(elements, title = "Untitled", tp = null) {
  const t = tp || { title, credit: "written by", author: "Writer", source: "", draftDate: "", contact: "" };
  let fountain = `Title: ${t.title || title}\nCredit: ${t.credit || "written by"}\nAuthor: ${t.author || "Writer"}\n`;
  if (t.source) fountain += `Source: ${t.source}\n`;
  if (t.draftDate) fountain += `Draft date: ${t.draftDate}\n`;
  if (t.contact) fountain += `Contact: ${t.contact}\n`;
  fountain += "\n";
  elements.forEach((el) => {
    const text = htmlToFountain(el.text);
    switch (el.type) {
      case "scene-heading":
        fountain += `\n${text}\n\n`;
        break;
      case "action":
        fountain += `${text}\n\n`;
        break;
      case "character":
        fountain += el.dual ? `${text} ^\n` : `${text}\n`;
        break;
      case "dialogue":
        fountain += `${text}\n\n`;
        break;
      case "parenthetical":
        fountain += `(${text.replace(/^\(|\)$/g, "")})\n`;
        break;
      case "transition":
        fountain += `> ${text}\n\n`;
        break;
      case "shot":
        fountain += `${text}\n\n`;
        break;
      case "centered":
        fountain += `> ${text} <\n\n`;
        break;
      default:
        fountain += `${text}\n\n`;
    }
  });
  return fountain;
}
