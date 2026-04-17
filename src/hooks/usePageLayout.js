import { useState, useRef, useEffect } from "react";
import { stripHtml } from "../utils/html";

// Page dimensions for visual page breaks
const PAGE_HEIGHT = 880;
const PAGE_GAP = 32;
const HEADER_HEIGHT = 44;
const FOOTER_HEIGHT = 32;

export { PAGE_HEIGHT, PAGE_GAP, HEADER_HEIGHT, FOOTER_HEIGHT };

export default function usePageLayout(elements, activeElId, editorScrollRef) {
  const contentRef = useRef(null);
  const [numPages, setNumPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageBreakMarkers, setPageBreakMarkers] = useState([]); // [{pageIndex, characterName}]

  // Calculate which visual page the active element is on
  useEffect(() => {
    if (!activeElId || !contentRef.current) return;
    const el = document.getElementById(`script-el-${activeElId}`);
    if (!el) return;
    const offsetTop = el.offsetTop;
    const page = Math.floor(offsetTop / (PAGE_HEIGHT + PAGE_GAP)) + 1;
    setCurrentPage(Math.min(page, numPages));
  }, [activeElId, numPages]);

  // Scroll active element into view when it's off-screen
  useEffect(() => {
    if (!activeElId || !editorScrollRef.current) return;
    const dom = document.getElementById(`script-el-${activeElId}`);
    if (!dom) return;
    const rect = dom.getBoundingClientRect();
    const container = editorScrollRef.current.getBoundingClientRect();
    if (rect.bottom > container.bottom || rect.top < container.top) {
      dom.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, [activeElId]);

  // Push elements out of dead zones and calculate page count
  useEffect(() => {
    if (!contentRef.current) return;
    // Check if content needs more than one page
    const measurePages = () => {
      const totalH = contentRef.current.scrollHeight;
      return Math.max(1, Math.ceil(totalH / (PAGE_HEIGHT + PAGE_GAP)));
    };
    if (numPages <= 1) {
      const needed = measurePages();
      if (needed !== numPages) setNumPages(needed);
      return;
    }
    // Clear previous adjustments
    elements.forEach(el => {
      const dom = document.getElementById(`script-el-${el.id}`);
      if (dom) dom.style.paddingTop = "";
    });
    // Iterate elements in document order; inner loop finds which boundary (if any) is crossed
    for (const el of elements) {
      const dom = document.getElementById(`script-el-${el.id}`);
      if (!dom) continue;
      const top = dom.offsetTop;
      const bottom = top + dom.offsetHeight;
      for (let p = 0; p < numPages - 1; p++) {
        const bodyEnd = (p + 1) * PAGE_HEIGHT + p * PAGE_GAP - FOOTER_HEIGHT;
        const nextBodyStart = (p + 1) * (PAGE_HEIGHT + PAGE_GAP) + HEADER_HEIGHT;
        if ((top >= bodyEnd && top < nextBodyStart) || (top < bodyEnd && bottom > bodyEnd)) {
          dom.style.paddingTop = `${nextBodyStart - top}px`;
          break;
        }
      }
    }
    // After dead-zone padding, recheck if content now needs more (or fewer) pages
    const needed = measurePages();
    if (needed !== numPages) setNumPages(needed);
  }, [elements, numPages]);

  // Compute (MORE)/(CONT'D) markers: detect dialogue crossing page boundaries
  useEffect(() => {
    if (!contentRef.current || numPages <= 1) { setPageBreakMarkers([]); return; }
    const markers = [];
    for (let p = 0; p < numPages - 1; p++) {
      const breakY = (p + 1) * PAGE_HEIGHT + p * PAGE_GAP;
      // Find the last character name before this break point
      let lastCharName = null;
      let dialogueCrossesBreak = false;
      for (const el of elements) {
        const dom = document.getElementById(`script-el-${el.id}`);
        if (!dom) continue;
        const top = dom.offsetTop;
        const bottom = top + dom.offsetHeight;
        if (el.type === "character") lastCharName = stripHtml(el.text);
        if (el.type !== "character" && el.type !== "dialogue" && el.type !== "parenthetical") {
          if (top > breakY) break;
          lastCharName = null;
        }
        // Dialogue block crosses page break
        if ((el.type === "dialogue" || el.type === "parenthetical") && lastCharName && top < breakY && bottom > breakY) {
          dialogueCrossesBreak = true;
          break;
        }
        if (top > breakY) break;
      }
      if (dialogueCrossesBreak && lastCharName) {
        markers.push({ pageIndex: p, characterName: lastCharName });
      }
    }
    setPageBreakMarkers(markers);
  }, [elements, numPages]);

  return { contentRef, numPages, currentPage, pageBreakMarkers };
}
