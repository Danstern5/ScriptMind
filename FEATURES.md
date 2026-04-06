# ScriptMind — Feature Tracker

## Completed

- [x] **SmartType / Autocomplete** — Character names, scene heading locations + INT./EXT. prefixes + times of day, common transitions. Arrow keys to navigate, Tab/Enter to accept, Esc to dismiss.
- [x] **Title Page Editor** — Modal editor (Title, Credit, Author, Source, Draft Date, Contact). Visual title page rendered before screenplay. Persisted to localStorage. Included in Fountain + PDF exports. Accessible via File menu.
- [x] **Scene Numbering** — Auto-numbered on both left and right margins of scene headings (industry standard). Included in PDF export.
- [x] **Spell Check** — Browser-native spellcheck enabled on all contentEditable elements.
- [x] **FDX Export** — Final Draft XML (.fdx) export with full formatting (B/I/U), all element types, and title page metadata.
- [x] **Dual Dialogue** — Right-click a character element to toggle. Renders side-by-side in editor, PDF, FDX, and Fountain exports.
- [x] **Smart Character Rename** — Right-click a character element → "Rename Character". Replaces the name across all character elements and text mentions throughout the script.
- [x] **Custom Context Menu** — Right-click character elements for Dual Dialogue and Rename options. Uses capture-phase event handling for reliable contentEditable support.

## Up Next (priority order)

- [ ] Full-screen / distraction-free mode
- [ ] Customizable element styles
- [ ] Custom templates (screenplay, TV, stage play)
- [ ] Index cards view
- [ ] Comments / notes on scenes
- [ ] Outline / beat board
- [ ] A4 / US Letter toggle
- [ ] Revision tracking / version history
- [ ] Real-time collaboration
