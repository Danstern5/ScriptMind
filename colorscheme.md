# Color System

All colors are inline styles (no CSS variables or Tailwind theme). Slate-based dark theme with white/black accents.

## Backgrounds (darkest → lightest)
- `#6D8196` — main bg, panel/bar backgrounds, input fields (slate-950)
- `#6D8196` — editor area background
- `#162032` — gradient midpoints (header bar, sidebar, status bar gradients)
- `#1e293b` — cards, surfaces, modals, chat bubbles, dropdowns (slate-800)
- `#0c1017` — editor radial gradient center (subtle slate tint)

## Borders
- `#334155` — standard borders, dividers, scrollbar thumb (slate-700)
- `#475569` — heavier borders (autocomplete, context menu) (slate-600)

## Accent (primary)
- `#64748b` — active states, highlights, accent text, pulse animation (slate-500)
- `#94a3b8` — lighter accent (gradient dot) (slate-400)
- `rgba(100,116,139,...)` — translucent accent overlays (various opacities)

## Text
- `#e8e8e8` / `#f1f5f9` — primary text (near-white)
- `#888888` — secondary text, inactive items
- `#555555` — dim labels, metadata
- `#aaa` — placeholders
- `#111` / `#333333` — text on white page paper (stays dark)

## Files with colors
- `ScriptMind.jsx` — bulk of the UI colors
- `AIMessage.jsx` — chat bubbles
- `ContextMenu.jsx` — right-click menu
- `FileMenu.jsx` — file dropdown
- `TitlePageEditor.jsx` — title page modal
- `RenameCharacterModal.jsx` — rename modal
- `ScriptElement.jsx` — page paper text only
