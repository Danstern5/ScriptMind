# Port Dan's Redesign Branch into Refactored Main

## Status

- ✅ **Phase 0** — Branch created, CSS tokens defined, App.jsx auth wiring fixed, bcrypt pinned
- ✅ **Phase 1** — All 9 files rethemed (Sidebar, EditorArea, AIPanel chat mode, ContextMenu, FileMenu, RenameCharacterModal, TitlePageEditor, AuthPage, ScriptMind shell)
- ⬜ Phase 2 — AIMessage feature port (`msg.quote` + markdown)
- ⬜ Phase 3 — Drop in new components (ScenarioCard, ScriptBible, SelectionToolbar)
- ⬜ Phase 4 — Selection Toolbar wiring (write fresh)
- ⬜ Phase 5 — Script Bible (modal mode)
- ⬜ Phase 6 — Thinking Mode infrastructure (write fresh)
- ⬜ Phase 7 — Explore tab / Scenario Cards (write fresh)
- ⬜ Phase 8 — Cleanup & merge

## Context

Partner Dan pushed `origin/Redesign416-dan` — a UI redesign with a new white/grey palette and four new features (Thinking Mode, Script Bible, Scenario Cards, Selection Toolbar). Main has since refactored the monolithic `ScriptMind.jsx` into `Sidebar`/`EditorArea`/`AIPanel` + extracted hooks. A direct `git merge` produces unresolvable conflicts because the file boundaries no longer match.

**Decisions locked with user:**
- **Theme:** Adopt Dan's white/grey across the board
- **Features:** Bring in all four (Thinking Mode, Script Bible, Scenario Cards, Selection Toolbar)
- **Sequencing:** Feature-by-feature on a port branch, user approval after each phase

**What we learned from exploration:**
- Most "modified" shared files (utils, `useAIChat`, `Icons`, `ScriptElement`) are actually **identical** to main — no port needed
- 4 components (`ContextMenu`, `FileMenu`, `RenameCharacterModal`, `TitlePageEditor`) differ **only** in color palette → easy retheme
- `AIMessage.jsx` is the one shared file with real feature divergence (Dan added `msg.quote` + `**bold**` parsing)
- All real complexity is concentrated in: 3 new components, AIPanel tab system, ScriptMind.jsx state additions, theme migration

## Strategy

Work on a new branch `port-redesign` off `main`. Each phase below is a self-contained checkpoint — at the end, dev server runs, feature works, no regressions, user reviews. Phases are ordered by dependency: theme first (so we don't recolor twice), then leaf components, then the orchestration that uses them.

## Phase 0 — Branch & Color Tokens

- Create branch `port-redesign` off `main`
- Read Dan's `src/index.css` and inline styles from his components to extract the palette
  - Likely tokens: bg `#ffffff` / `#f8f8f8` / `#f0f0f0`, borders `#e0e0e0`, text `#1a1a1a`, accent green (TBD), serif `Playfair Display`, mono `Courier Prime`
- Define CSS custom properties in `src/index.css` so subsequent phases reference tokens, not hex literals
- No visual change yet — just tokens declared

**Verify:** `npm run dev` still loads the dark theme unchanged.

## Phase 1 — Retheme Existing Shell (cosmetic only, no behavior change)

Files: `Sidebar.jsx`, `EditorArea.jsx`, `AIPanel.jsx` (chat-only mode), `ContextMenu.jsx`, `FileMenu.jsx`, `RenameCharacterModal.jsx`, `TitlePageEditor.jsx`, `AuthPage.jsx`, top-bar in `ScriptMind.jsx`

- For each file: cross-reference Dan's version (`git show origin/Redesign416-dan:<path>`) for color decisions, but keep main's structure/props/handlers
- Swap dark slate Tailwind/inline colors for the new tokens
- Update fonts: serif headers where Dan uses them
- `colorscheme.md` — update to reflect new palette

**Verify:** App is fully functional but visually white/grey. All existing flows (auth, edit, save, import, export, PDF, page layout) work. No new features yet.

## Phase 2 — AIMessage Feature Port

File: `src/components/AIMessage.jsx`

Reference: `git show origin/Redesign416-dan:src/components/AIMessage.jsx`

- Add `msg.quote` rendering (Courier Prime block above the message body, used by Selection Toolbar in Phase 4)
- Add lightweight markdown: `**bold**` → `<strong>`, `*emphasis*` → styled em, `- ` lines → bullets with green accent
- Avatar/badge styling already done in Phase 1

**Verify:** Hand-craft a test message in `useAIChat` (or temporarily in `INITIAL_MESSAGES`) with `quote` + `**bold**` and confirm it renders. Revert the test message before moving on.

## Phase 3 — Drop In New Components (presentational only, not wired)

Copy from Dan's branch:
- `git show origin/Redesign416-dan:src/components/ScenarioCard.jsx > src/components/ScenarioCard.jsx`
- Same for `ScriptBible.jsx` and `SelectionToolbar.jsx`

These are pure presentational components with all state managed by their parent — they slot in cleanly. Convert any obviously dark-theme color hardcodes to the Phase 0 tokens (most should already be light since Dan wrote them light).

**Verify:** `npm run lint` passes (catches missing imports). Components aren't rendered anywhere yet — that comes in Phases 4–7.

## Phase 4 — Selection Toolbar (component ported, wiring fresh)

**Approach:** `SelectionToolbar.jsx` component itself was copied in Phase 3 (presentational, ~30 lines). The wiring — selection detection, event listeners, `handleSelectionAction` — is **written fresh** against our `useAIChat` hook and `ScriptElement` behavior. Don't translate Dan's monolithic event-handler code; it assumes the old state shape and event flow.

Files: `src/ScriptMind.jsx`, `src/components/EditorArea.jsx`

- Add `toolbarSelection` state (`{ rect, text } | null`) to `ScriptMind.jsx`
- Author `mouseup` / `selectionchange` listeners fresh — scoped to the editor container, must not steal focus or break `ScriptElement`'s contentEditable behavior. Decide our own debounce/dismissal rules.
- `handleSelectionAction(actionType, text)` — written fresh; call `useAIChat.sendMessage` with a quoted prompt. The AI response uses the `msg.quote` field added in Phase 2.
- Render `<SelectionToolbar selection={toolbarSelection} onAction={handleSelectionAction} />` near the top of the layout (so floating positioning works)
- Click-outside / new-selection dismissal

**Reference Dan for:** action button labels, prompt template strings, visual placement above/below selection. **Author ourselves:** event listener strategy, state shape, integration with `useAIChat`.

**Reuse:** `useAIChat` (`/src/hooks/useAIChat.js`) — no changes needed; just call `sendMessage` with a templated prompt.

**Verify:** Select dialogue text → toolbar appears → click "Discuss" → chat receives a message with the selected text quoted above the AI reply.

## Phase 5 — Script Bible (modal mode)

Files: `src/ScriptMind.jsx`, `src/components/Sidebar.jsx`, optional new `src/utils/scriptBible.js`

- Add `scriptBible` state with localStorage persistence (key e.g. `scriptmind_bible_<scriptId>`)
- Move `DEFAULT_SCRIPT_BIBLE` constant to `src/utils/scriptBible.js`
- Add `showScriptBible` toggle state
- Add "Script Bible" button to `Sidebar.jsx` (in stats footer per Dan's design)
- Render `<ScriptBible bible={scriptBible} onChange={setScriptBible} mode="writing" />` as a modal overlay
- Persist to localStorage in a `useEffect`

**Verify:** Open Script Bible from sidebar, edit logline/characters/world facts, close, reload page → state persists.

## Phase 6 — Thinking Mode Infrastructure (write fresh, not port)

**Approach change:** Dan's Thinking Mode logic lives inside his old monolithic `ScriptMind.jsx` and assumes the old state shape. Translating it to our refactored hooks/components is effectively a rewrite. Instead, we **author this in our architecture from scratch**, using Dan's branch only as a visual/UX design reference (`git show origin/Redesign416-dan:src/ScriptMind.jsx` for screenshots-via-code; his JSX shows desired layout/tab labels/animation feel).

Files: `src/ScriptMind.jsx`, `src/components/AIPanel.jsx`, `src/components/EditorArea.jsx`, `src/components/Sidebar.jsx`

- Add `isThinkingMode` and `aiPanelTab` (`"chat" | "bible" | "explore"`) state to `ScriptMind.jsx`
- Add toggle button (likely in `Sidebar.jsx` or top bar)
- `EditorArea.jsx`: when `isThinkingMode`, animate flex shrink via CSS transition (decide our own duration/easing)
- `AIPanel.jsx`:
  - Animate width 360px ↔ ~100% on `isThinkingMode`, synced timing with EditorArea
  - When thinking: render tab bar (Bible / Explore / Chat)
  - Tab content switches based on `aiPanelTab`
  - Bible tab: `<ScriptBible mode="thinking" />` (two-column layout — writer intent vs AI reading)
  - Chat tab: existing chat content
  - Explore tab: empty placeholder for Phase 7

**Reference Dan for:** tab labels, panel proportions, color of active tab indicator. **Author ourselves:** state plumbing, animation timing, where the toggle lives, how chat behaves when collapsed/restored.

**Verify:** Toggle Thinking Mode → editor shrinks, panel expands smoothly. Switch tabs. Bible tab edits the same `scriptBible` state as Phase 5's modal.

## Phase 7 — Explore Tab / Scenario Cards (write fresh, not port)

**Approach change:** Same reasoning — `ScenarioCard.jsx` (the leaf component, copied in Phase 3) holds the feature; the tab orchestration is short and architecture-specific. We write it fresh.

Files: `src/ScriptMind.jsx`, `src/components/AIPanel.jsx`, new `src/utils/scenarios.js`

- Move `PLACEHOLDER_SCENARIOS` data into `src/utils/scenarios.js` (copy verbatim from Dan's `ScriptMind.jsx`)
- Add state: `scenarios`, `anchoredScenario`, `isExploring`
- Handlers (author ourselves, simple):
  - `handleExplore()` — populate `scenarios` from `PLACEHOLDER_SCENARIOS`, switch tab to explore
  - `handleDiscuss(idx)` — set `anchoredScenario`, switch to Chat tab, seed chat via `useAIChat.sendMessage`
  - `toggleScenarioImpact(idx)` / `toggleScenarioPreview(idx)` — trivial array map
- AIPanel Explore tab: "✦ Alternative Scene Analysis" trigger button → renders `<ScenarioCard>` grid

**Reference Dan for:** scenario data structure, button copy, layout. **Author ourselves:** the handlers, state, and how `useAIChat` integration works.

**Verify:** In Thinking Mode → Explore tab → click "Alternative Scene Analysis" → 3 cards appear → expand impact/preview → click Discuss → Chat tab opens with anchored scenario.

## Phase 8 — Cleanup & Merge

- Update `CLAUDE.md`:
  - Refresh frontend file structure (3 new components, new utils)
  - Update theme line ("white/grey, Playfair Display + Courier Prime")
  - Add brief notes on Thinking Mode and Script Bible state shape
- Run `npm run lint` clean
- Merge `port-redesign` → `main` (squash or merge — user's call)
- Delete `origin/Redesign416-dan` (only with user's explicit go-ahead)

## Critical Files

**To create on main (copied from Dan's branch):**
- `src/components/ScenarioCard.jsx`
- `src/components/ScriptBible.jsx`
- `src/components/SelectionToolbar.jsx`
- `src/utils/scenarios.js` (extract `PLACEHOLDER_SCENARIOS`)
- `src/utils/scriptBible.js` (extract `DEFAULT_SCRIPT_BIBLE`)

**To modify on main:**
- `src/index.css` — color tokens, fonts (Phase 0)
- `src/ScriptMind.jsx` — new state (`isThinkingMode`, `aiPanelTab`, `scriptBible`, `scenarios`, `anchoredScenario`, `isExploring`, `toolbarSelection`, `showScriptBible`), handlers (`handleExplore`, `handleDiscuss`, `toggleScenarioImpact`, `toggleScenarioPreview`, `handleSelectionAction`), selection event listeners
- `src/components/Sidebar.jsx` — retheme + Script Bible button + Thinking Mode toggle
- `src/components/EditorArea.jsx` — retheme + flex-shrink animation
- `src/components/AIPanel.jsx` — retheme + width animation + tab system + multi-mode content
- `src/components/AIMessage.jsx` — `msg.quote` rendering + markdown parsing
- `src/components/ContextMenu.jsx`, `FileMenu.jsx`, `RenameCharacterModal.jsx`, `TitlePageEditor.jsx`, `AuthPage.jsx` — retheme only
- `colorscheme.md` — document new palette

**Reused as-is (no port needed):**
- `src/hooks/useAIChat.js` — verified identical between branches; Selection Toolbar and Scenario Cards both call its `sendMessage`
- `src/hooks/usePageLayout.js`, `useFileOperations.js`, `useAuth.js` — no changes
- `src/utils/*` (elementTypes, export, html, ids, import, pdfExport, screenplay) — verified identical

## Verification (per phase)

Each phase ends with:
1. `npm run dev` and manually exercise the new feature
2. `npm run lint`
3. Smoke-test untouched features that the new state/handlers might have impacted (auth, save/load, FDX/Fountain export, PDF export, page layout, drag-drop import)
4. User review before moving to next phase

## Out of Scope (intentionally)

- Real AI integration for Script Bible's "AI reading" fields and Explore's scenario generation — Dan ships placeholders, we keep placeholders. Real AI is a follow-up.
- Backend persistence for `scriptBible` — Phase 5 uses localStorage. Wiring it into the script JSON column on the backend is a follow-up.
- Mobile/responsive layout — main is desktop-only per CLAUDE.md and Dan's branch keeps that constraint.
