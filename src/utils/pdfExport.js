import { jsPDF } from "jspdf";

const stripHtml = (html) => html.replace(/<[^>]*>/g, "");

const PAGE_W = 8.5, PAGE_H = 11;
const ML = 1.5, MR = 1, MT = 1, MB = 1;
const BODY_W = PAGE_W - ML - MR;
const FONT_SIZE = 12;
const LINE_H = FONT_SIZE * 1.6 / 72;

const elLayout = {
  "scene-heading":  { indent: 0, width: BODY_W, upper: true, bold: true },
  "action":         { indent: 0, width: BODY_W },
  "character":      { indent: 2.2, width: BODY_W - 2.2, upper: true, bold: true },
  "dialogue":       { indent: 1, width: 3.5 },
  "parenthetical":  { indent: 1.6, width: 2.1 },
  "transition":     { indent: 0, width: BODY_W, upper: true, align: "right" },
  "shot":           { indent: 0, width: BODY_W, upper: true, bold: true },
  "centered":       { indent: 0, width: BODY_W, align: "center" },
};

const SPACING_AFTER = {
  "scene-heading": LINE_H,
  "action": LINE_H,
  "character": 0,
  "dialogue": LINE_H,
  "parenthetical": 0,
  "transition": LINE_H,
  "shot": LINE_H,
  "centered": LINE_H,
};

export function exportPDF(elements, titlePage, scriptTitle) {
  const doc = new jsPDF({ unit: "in", format: "letter" });

  let pageNum = 0;
  let y = MT;
  let sceneNum = 0;

  const newPage = () => {
    if (pageNum > 0) doc.addPage();
    pageNum++;
    y = MT;
  };

  const checkPageBreak = (needed) => {
    if (y + needed > PAGE_H - MB) {
      doc.setFont("Courier", "normal");
      doc.setFontSize(10);
      doc.text(`${pageNum}.`, PAGE_W - MR, PAGE_H - 0.5, { align: "right" });
      newPage();
    }
  };

  const writeLines = (text, layout) => {
    doc.setFont("Courier", layout.bold ? "bold" : "normal");
    doc.setFontSize(FONT_SIZE);
    let str = stripHtml(text);
    if (layout.upper) str = str.toUpperCase();
    const maxW = layout.width;
    const lines = doc.splitTextToSize(str, maxW);
    for (const line of lines) {
      checkPageBreak(LINE_H);
      const xBase = ML + layout.indent;
      if (layout.align === "right") {
        doc.text(line, ML + BODY_W, y, { align: "right" });
      } else if (layout.align === "center") {
        doc.text(line, ML + BODY_W / 2, y, { align: "center" });
      } else {
        doc.text(line, xBase, y);
      }
      y += LINE_H;
    }
  };

  const writeLinesAt = (text, layout, xOffset, maxW) => {
    doc.setFont("Courier", layout.bold ? "bold" : "normal");
    doc.setFontSize(FONT_SIZE);
    let str = stripHtml(text);
    if (layout.upper) str = str.toUpperCase();
    const lines = doc.splitTextToSize(str, maxW);
    for (const line of lines) {
      checkPageBreak(LINE_H);
      doc.text(line, xOffset, y);
      y += LINE_H;
    }
  };

  const collectPdfGroup = (startIdx) => {
    const group = [startIdx];
    for (let j = startIdx + 1; j < elements.length; j++) {
      if (elements[j].type === "dialogue" || elements[j].type === "parenthetical") group.push(j);
      else break;
    }
    return group;
  };

  const measureGroup = (indices) => {
    let lines = 0;
    for (const idx of indices) {
      const el = elements[idx];
      const layout = elLayout[el.type] || elLayout["action"];
      let str = stripHtml(el.text);
      if (layout.upper) str = str.toUpperCase();
      doc.setFont("Courier", layout.bold ? "bold" : "normal");
      doc.setFontSize(FONT_SIZE);
      lines += doc.splitTextToSize(str, layout.width).length;
    }
    return lines;
  };

  // ── Title Page ──
  newPage();
  const tp = titlePage;
  doc.setFont("Courier", "bold");
  doc.setFontSize(24);
  const titleText = tp.title || scriptTitle;
  doc.text(titleText, PAGE_W / 2, 4, { align: "center" });
  doc.setFontSize(FONT_SIZE);
  doc.setFont("Courier", "normal");
  let titleY = 4.5;
  if (tp.credit) { doc.text(tp.credit, PAGE_W / 2, titleY, { align: "center" }); titleY += 0.3; }
  if (tp.author) { doc.setFont("Courier", "bold"); doc.text(tp.author, PAGE_W / 2, titleY, { align: "center" }); doc.setFont("Courier", "normal"); titleY += 0.3; }
  if (tp.source) { doc.text(`Based on ${tp.source}`, PAGE_W / 2, titleY, { align: "center" }); }
  let contactY = PAGE_H - 2;
  doc.setFontSize(10);
  if (tp.draftDate) { doc.text(tp.draftDate, PAGE_W - MR - 1, contactY); contactY += 0.25; }
  if (tp.contact) {
    const contactLines = tp.contact.split("\n");
    for (const cl of contactLines) { doc.text(cl, PAGE_W - MR - 1, contactY); contactY += 0.25; }
  }

  // ── Screenplay Content ──
  newPage();

  let ei = 0;
  while (ei < elements.length) {
    const el = elements[ei];

    if (el.type === "character" && !el.dual) {
      const leftGroup = collectPdfGroup(ei);
      const nextIdx = leftGroup[leftGroup.length - 1] + 1;
      if (nextIdx < elements.length && elements[nextIdx].type === "character" && elements[nextIdx].dual) {
        const rightGroup = collectPdfGroup(nextIdx);
        const HALF = BODY_W / 2 - 0.1;
        const leftLines = measureGroup(leftGroup);
        const rightLines = measureGroup(rightGroup);
        const totalLines = Math.max(leftLines, rightLines);
        checkPageBreak(totalLines * LINE_H);
        const startY = y;
        for (const idx of leftGroup) {
          const ge = elements[idx];
          const gl = ge.type === "character"
            ? { indent: 0.5, width: HALF - 0.5, upper: true, bold: true }
            : ge.type === "parenthetical"
            ? { indent: 0.3, width: HALF - 0.6 }
            : { indent: 0, width: HALF };
          writeLinesAt(ge.text, gl, ML + gl.indent, gl.width);
        }
        const leftEndY = y;
        y = startY;
        for (const idx of rightGroup) {
          const ge = elements[idx];
          const gl = ge.type === "character"
            ? { indent: 0.5, width: HALF - 0.5, upper: true, bold: true }
            : ge.type === "parenthetical"
            ? { indent: 0.3, width: HALF - 0.6 }
            : { indent: 0, width: HALF };
          writeLinesAt(ge.text, gl, ML + HALF + 0.2 + gl.indent, gl.width);
        }
        y = Math.max(leftEndY, y) + LINE_H;
        ei = rightGroup[rightGroup.length - 1] + 1;
        continue;
      }
    }

    const layout = elLayout[el.type] || elLayout["action"];
    if (el.type === "scene-heading") {
      sceneNum++;
      if (y > MT + LINE_H) y += LINE_H;
      checkPageBreak(LINE_H * 2);
      doc.setFont("Courier", "bold");
      doc.setFontSize(FONT_SIZE);
      doc.text(`${sceneNum}`, ML - 0.5, y, { align: "right" });
      doc.text(`${sceneNum}`, ML + BODY_W + 0.15, y);
    }
    writeLines(el.text, layout);
    y += SPACING_AFTER[el.type] ?? LINE_H;
    ei++;
  }

  doc.setFont("Courier", "normal");
  doc.setFontSize(10);
  doc.text(`${pageNum}.`, PAGE_W - MR, PAGE_H - 0.5, { align: "right" });

  doc.save(`${scriptTitle}.pdf`);
}
