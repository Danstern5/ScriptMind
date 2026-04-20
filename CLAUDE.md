# ScriptMind

Screenplay editor with AI collaboration.

## Stack
- **Frontend:** React 19 + Vite 7 + Tailwind CSS 4 + jsPDF
- **Backend:** FastAPI + PostgreSQL (async SQLAlchemy + asyncpg) + JWT auth
- No TypeScript (JSX only)
- Anthropic Claude API (client-side calls)

## Commands
```
# Frontend
npm run dev      # start dev server (localhost:5173)
npm run build    # production build
npm run lint     # eslint

# Backend
cd backend && uvicorn app.main:app --reload  # start API server (localhost:8000)
```

## Frontend File Structure
```
src/
  ScriptMind.jsx    # Main app component — state, handlers, layout shell (~490 lines)
  App.jsx           # Root wrapper — AuthProvider gate (renders AuthPage or ScriptMind)
  main.jsx          # Entry point
  index.css         # Tailwind + Google Fonts imports + CSS custom properties (color/font tokens)
  components/
    Icons.jsx              # SendIcon, PlusIcon, FileIcon, DownloadIcon, SparkleIcon, ChevronIcon
    ContextMenu.jsx        # Right-click context menu
    ScriptElement.jsx      # ContentEditable screenplay element (handles formatting, margins, scene numbers)
    AIMessage.jsx          # Chat message bubble — supports `msg.quote` (Courier Prime pullquote) + `**bold**`/`*em*`/`• ` markdown
    TitlePageEditor.jsx    # Modal for editing title page fields
    RenameCharacterModal.jsx # Modal for renaming characters
    FileMenu.jsx           # File dropdown (new, import, export, title page)
    Sidebar.jsx            # Scene list, stats, "Add Scene" button
    EditorArea.jsx         # Toolbar + paginated screenplay editor + page headers/footers
    AIPanel.jsx            # Chat header, messages, streaming indicator, input, quick actions
    AuthPage.jsx           # Login/signup page (email + password, mode toggle)
    ScenarioCard.jsx       # Presentational card for "what-if" scene scenarios (not yet wired — Phase 7)
    ScriptBible.jsx        # Two-mode bible editor ("writing" modal / "thinking" split col) (not yet wired — Phases 5–6)
    SelectionToolbar.jsx   # Floating dark chip shown on editor text selection (Alternatives / Consistency Check / Discuss → `useAIChat.sendMessage(prompt, quote)`)
  contexts/
    AuthContext.jsx        # AuthProvider — user/token/loading state, login/signup/logout methods
  hooks/
    useAIChat.js           # AI chat state & handlers (messages, streaming, rewrite, suggest)
    usePageLayout.js       # Page layout (dead-zone push, page count, currentPage, MORE/CONT'D markers)
    useFileOperations.js   # File I/O (new, import, export, drag & drop)
    useAuth.js             # Convenience hook for AuthContext
  utils/
    api.js          # apiPost(), apiGet() — fetch wrapper with API_BASE from VITE_API_BASE env
    ids.js          # uid(), msgId() — unique ID generators
    html.js         # stripHtml, escapeXml, htmlToFdxTextNodes, htmlToFountain
    screenplay.js   # getScenes, getWordCount, getPageCount, getSmartSuggestions, getCurrentSceneIndex
                    # Also contains: COMMON_TRANSITIONS, SCENE_PREFIXES, TIMES_OF_DAY (internal)
    elementTypes.js # getNextType, cycleType, autoFormatText, TAB_CYCLE
    export.js       # elementsToFDX, elementsToFountain
    import.js       # parseFountain(text, fallbackElements), parseFDX(xmlText, fallbackElements)
    pdfExport.js    # exportPDF(elements, titlePage, scriptTitle) — jsPDF-based PDF generation
```

## Backend File Structure
```
backend/
  .env                # DATABASE_URL, JWT_SECRET
  .env.example        # Template
  requirements.txt    # Python deps (fastapi, sqlalchemy, asyncpg, passlib, pyjwt, etc.)
  Dockerfile          # Railway deployment
  alembic.ini         # Migration config
  alembic/
    versions/         # Migration files (users + scripts tables)
  app/
    main.py           # FastAPI app — CORS middleware, router includes, /api/health
    config.py         # Settings (DATABASE_URL, JWT_SECRET, CORS_ORIGINS, token expiry)
    database.py       # AsyncSession factory & engine
    dependencies.py   # get_db(), get_current_user() — shared FastAPI dependencies
    models/
      user.py         # User (id UUID, email, password_hash, created_at, updated_at)
      script.py       # Script (id UUID, user_id FK, title, elements JSON, title_page JSON)
    routers/
      auth.py         # POST /api/auth/signup, POST /api/auth/login, GET /api/auth/me
      scripts.py      # CRUD /api/scripts/ — all protected by get_current_user
    schemas/
      user.py         # UserSignup, UserLogin, UserResponse, AuthResponse
      script.py       # ScriptCreate, ScriptUpdate, ScriptResponse, ScriptListItem
    services/
      auth.py         # hash_password, verify_password, create_access_token, decode_access_token
      scripts.py      # get_scripts_by_user, get_script_by_id, create_script, update_script, delete_script
```

## Auth System
- JWT (HS256) with 7-day expiry, stored in localStorage as `scriptmind_token`
- Password hashing: bcrypt via passlib — **bcrypt is pinned to `<4.1`** because bcrypt 4.x raises a hard 72-byte ValueError on passlib's internal capability probe, breaking signup
- Frontend: AuthContext validates token on mount via `GET /api/auth/me`
- App.jsx wraps `<AuthProvider>` around an `<AppGate>` that renders `AuthPage` while logged out / `Loading…` during validation / `ScriptMind` once authenticated
- All `/api/scripts/` routes require `Authorization: Bearer <token>`
- CORS allows `localhost:5173` and `localhost:3000`

## ScriptMind.jsx Structure
Top-level constants: `ELEMENT_TYPES`, `DEFAULT_SCRIPT`, `DEFAULT_TITLE_PAGE`, `INITIAL_MESSAGES`, page layout constants (`PAGE_HEIGHT`, `PAGE_GAP`, `HEADER_HEIGHT`, `FOOTER_HEIGHT`).

Main `ScriptMind` component: 16 useState hooks, multiple useEffect hooks, all event handlers.

## Conventions
- 8 element types: `scene-heading`, `action`, `character`, `dialogue`, `parenthetical`, `transition`, `shot`, `centered`
- Element shape: `{ id, type, text, dual? }`
- IDs prefixed: `el-` for elements, `m-` for messages
- ContentEditable divs for text editing
- Rich text via `document.execCommand()` (Cmd+B/I/U)
- White/grey theme with green accent (`#4ade80`); Playfair Display for headers, IBM Plex Sans for UI, IBM Plex Mono for labels, Courier Prime for screenplay text
- All colors and fonts go through CSS custom properties defined in `src/index.css` (`var(--bg-canvas)`, `var(--text-primary)`, `var(--accent-green)`, `var(--font-serif)`, etc.) — never hardcode hex values
- Desktop-only layout (sidebar 220px, editor 680px, AI panel 360px)
- Color system documented in `colorscheme.md`

## Page Layout System
- Visual pagination using SVG clipPath to clip content into page-sized regions
- Constants exported from `src/hooks/usePageLayout.js`: `PAGE_HEIGHT=880`, `PAGE_GAP=32`, `HEADER_HEIGHT=44`, `FOOTER_HEIGHT=32`
- `usePageLayout` hook owns dead-zone push (elements crossing page boundaries get paddingTop), numPages calculation, currentPage tracking, scroll-into-view, and (MORE)/(CONT'D) markers
- Auto-scrolls active element into view when off-screen
- `getPageCount()` in utils/screenplay.js is a word-based estimate (250 words/page) for display only — not used for visual layout

## Import/Export
- Import accepts `.fountain`, `.fdx`, `.txt` — parsers return fallback (`DEFAULT_SCRIPT.elements`) on failure
- Export: PDF (`utils/pdfExport.js`), `.fountain`, `.fdx` (Final Draft XML)
- `parseFountain` and `parseFDX` in `utils/import.js` take a second `fallbackElements` parameter

## Port In Progress (`port-redesign` branch)

The `port-redesign` branch is incrementally bringing partner Dan's `origin/Redesign416-dan` features into the refactored main. Phases 0–4 complete; Phases 5–8 remaining. Full plan: `PORT_REDESIGN_PLAN.md`.

- ✅ Phase 0+1 — CSS tokens + theme migration across existing shell
- ✅ Phase 2 — `AIMessage` `msg.quote` + `**bold**` markdown parsing
- ✅ Phase 3 — `ScenarioCard`, `ScriptBible`, `SelectionToolbar` components added (not yet wired)
- ✅ Phase 4 — `SelectionToolbar` wired: `toolbarSelection` state, editor-scoped mouseup/mousedown/Escape listeners, `handleSelectionAction` → `useAIChat.sendMessage(prompt, quote)` (optional `quote` arg carries to user msg as `msg.quote` and prepends to API content)
- ⬜ Phase 5 — Script Bible modal mode + localStorage persistence (key `scriptmind_bible_<scriptId>`)
- ⬜ Phase 6 — Thinking Mode infrastructure (panel width animation + tab bar)
- ⬜ Phase 7 — Explore tab + Scenario Cards
- ⬜ Phase 8 — Cleanup & merge to `main`

**Planned new utils (Phases 5/7):** `src/utils/scriptBible.js` (`DEFAULT_SCRIPT_BIBLE`), `src/utils/scenarios.js` (`PLACEHOLDER_SCENARIOS`).

**Planned ScriptMind.jsx additions (Phases 5–7):** state — `isThinkingMode`, `aiPanelTab` (`"chat" | "bible" | "explore"`), `scriptBible`, `scenarios`, `anchoredScenario`, `isExploring`, `showScriptBible`; handlers — `handleExplore`, `handleDiscuss`, `toggleScenarioImpact/Preview`.

**Out of scope for this port:** Real AI for Script Bible "AI reading" fields and Explore scenario generation (placeholders ship now); backend persistence for `scriptBible` (localStorage only).

