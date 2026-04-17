import { useState, useRef } from "react";
import { uid } from "../utils/ids";
import { exportPDF } from "../utils/pdfExport";
import { elementsToFDX, elementsToFountain } from "../utils/export";
import { parseFountain, parseFDX } from "../utils/import";

const DEFAULT_SCRIPT_ELEMENTS = [
  { id: "el-1", type: "action", text: "" },
];

const DEFAULT_TITLE_PAGE = {
  title: "Untitled Screenplay",
  credit: "written by",
  author: "",
  source: "",
  draftDate: "",
  contact: "",
};

export default function useFileOperations({ elements, scriptTitle, titlePage, setElements, setActiveElId, setScriptTitle, setTitlePage, setMessages, showNotification }) {
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);
  const fileInputRef = useRef(null);

  const handleNew = () => {
    setElements([{ id: uid(), type: "scene-heading", text: "" }]);
    setActiveElId(null);
    setScriptTitle("untitled_screenplay");
    setTitlePage(DEFAULT_TITLE_PAGE);
    setMessages([]);
    showNotification("New script created");
  };

  const handleImport = () => fileInputRef.current?.click();

  const processFile = (file) => {
    if (!file) return;
    const name = file.name.toLowerCase();
    const validExts = [".fountain", ".fdx", ".txt"];
    if (!validExts.some((ext) => name.endsWith(ext))) {
      showNotification("Unsupported format — use .fountain, .fdx, or .txt");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      if (name.endsWith(".fdx")) {
        setElements(parseFDX(text, DEFAULT_SCRIPT_ELEMENTS));
      } else {
        setElements(parseFountain(text, DEFAULT_SCRIPT_ELEMENTS));
      }
      setScriptTitle(file.name.replace(/\.(fountain|fdx|txt)$/, ""));
      showNotification(`Imported ${file.name}`);
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e) => {
    processFile(e.target.files?.[0]);
    e.target.value = "";
  };

  // Drag & drop handlers
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items?.length > 0) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;
    const file = e.dataTransfer.files?.[0];
    processFile(file);
  };

  const handleExportFountain = () => {
    const content = elementsToFountain(elements, scriptTitle, titlePage);
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${scriptTitle}.fountain`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification("Exported .fountain file");
  };

  const handleExportFDX = () => {
    const content = elementsToFDX(elements, scriptTitle, titlePage);
    const blob = new Blob([content], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${scriptTitle}.fdx`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification("Exported .fdx file (Final Draft)");
  };

  const handleExportPDF = () => {
    exportPDF(elements, titlePage, scriptTitle);
    showNotification("Exported PDF");
  };

  return {
    isDragging,
    fileInputRef,
    handleNew,
    handleImport,
    handleFileChange,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    handleExportFountain,
    handleExportFDX,
    handleExportPDF,
  };
}
