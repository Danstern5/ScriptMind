# ScriptMind

Screenplay editor with AI collaboration. Fully client-side, no backend.

## Stack
- React 19 + Vite 7 + Tailwind CSS 4 + jsPDF
- No TypeScript (JSX only)
- localStorage for persistence
- Anthropic Claude API (client-side calls)

## Commands
```
npm run dev      # start dev server
npm run build    # production build
npm run lint     # eslint
```

## File Structure
```
src/
  ScriptMind.jsx    # Main app component — constants + ScriptMind component (~1200 lines)
  App.jsx           # Root wrapper
  main.jsx          # Entry point
  components/
    Icons.jsx              # SendIcon, PlusIcon, FileIcon, DownloadIcon, SparkleIcon, ChevronIcon
    ContextMenu.jsx        # Right-click context menu
    ScriptElement.jsx      # ContentEditable screenplay element (handles formatting, margins, scene numbers)
    AIMessage.jsx          # Chat message bubble (AI or user)
    TitlePageEditor.jsx    # Modal for editing title page fields
    RenameCharacterModal.jsx # Modal for renaming characters
    FileMenu.jsx           # File dropdown (new, import, export, title page)
  utils/
    ids.js          # uid(), msgId() — unique ID generators
    html.js         # stripHtml, escapeXml, htmlToFdxTextNodes, htmlToFountain
    screenplay.js   # getScenes, getWordCount, getPageCount, getSmartSuggestions, getCurrentSceneIndex
                    # Also contains: COMMON_TRANSITIONS, SCENE_PREFIXES, TIMES_OF_DAY (internal)
    elementTypes.js # getNextType, cycleType, autoFormatText, TAB_CYCLE
    export.js       # elementsToFDX, elementsToFountain
    import.js       # parseFountain(text, fallbackElements), parseFDX(xmlText, fallbackElements)
    pdfExport.js    # exportPDF(elements, titlePage, scriptTitle) — jsPDF-based PDF generation
```

## ScriptMind.jsx Structure
Top-level constants: `ELEMENT_TYPES`, `DEFAULT_SCRIPT`, `DEFAULT_TITLE_PAGE`, `INITIAL_MESSAGES`, page layout constants (`PAGE_HEIGHT`, `PAGE_GAP`, `HEADER_HEIGHT`, `FOOTER_HEIGHT`).

Main `ScriptMind` component: 16 useState hooks, multiple useEffect hooks, all event handlers.

## Conventions
- 8 element types: `scene-heading`, `action`, `character`, `dialogue`, `parenthetical`, `transition`, `shot`, `centered`
- Element shape: `{ id, type, text, dual? }`
- IDs prefixed: `el-` for elements, `m-` for messages
- ContentEditable divs for text editing
- Rich text via `document.execCommand()` (Cmd+B/I/U)
- Dark theme, Courier Prime for screenplay text, IBM Plex Sans for UI
- Desktop-only layout (sidebar 220px, editor 680px, AI panel 360px)

## Page Layout System
- Visual pagination using SVG clipPath to clip content into page-sized regions
- Constants: `PAGE_HEIGHT=880`, `PAGE_GAP=32`, `HEADER_HEIGHT=44`, `FOOTER_HEIGHT=32`
- Single useEffect owns both dead-zone push (elements crossing page boundaries get paddingTop) and numPages calculation (measured after padding via scrollHeight)
- Auto-scrolls active element into view when off-screen
- `getPageCount()` in utils/screenplay.js is a word-based estimate (250 words/page) for display only — not used for visual layout

## Import/Export
- Import accepts `.fountain`, `.fdx`, `.txt` — parsers return fallback (`DEFAULT_SCRIPT.elements`) on failure
- Export: PDF (`utils/pdfExport.js`), `.fountain`, `.fdx` (Final Draft XML)
- `parseFountain` and `parseFDX` in `utils/import.js` take a second `fallbackElements` parameter
