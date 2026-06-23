# ScriptMind — Local Run & Handoff Notes

This is the active working copy of ScriptMind.

- **Project folder:** `/Users/danielsternberg/ScriptMind-dev`
- **Git branch:** `feature/ai-proxy` (pushed to GitHub, tracks `origin/feature/ai-proxy`)
- **GitHub repo:** https://github.com/Danstern5/ScriptMind.git

## How to start the app (easiest)

1. Open the **Terminal** app.
2. Type this and press Enter:
   ```
   cd ~/ScriptMind-dev && ./start.sh
   ```
3. Wait a few seconds, then open **http://localhost:5173** in your browser.
4. To stop everything, click the Terminal window and press **Ctrl+C**.

The `start.sh` script starts the database (if needed), the backend API, and the frontend together.

## What's running where

| Piece | URL / Port | Notes |
|---|---|---|
| Frontend (React + Vite) | http://localhost:5173 | What you see in the browser |
| Backend API (FastAPI) | http://localhost:8000 | Handles login + the AI proxy |
| Database (PostgreSQL 16) | localhost:5432 | Database name: `scriptmind` |

## Manual start (if you ever need it)

```bash
# Backend
cd ~/ScriptMind-dev/backend
./venv/bin/uvicorn app.main:app --reload --port 8000

# Frontend (in a second Terminal tab)
cd ~/ScriptMind-dev
npm run dev
```

## Requirements (already installed on this Mac)

- Node.js + npm
- Python 3.12 (the backend's virtual environment lives at `backend/venv`)
- PostgreSQL 16 (Homebrew), with a `scriptmind` database

## Config / secrets

- Backend config lives in `backend/.env` (DATABASE_URL, JWT_SECRET, ANTHROPIC_API_KEY).
- ⚠️ `backend/.env` contains a **real Anthropic API key** — it is git-ignored. Do not paste its
  contents into chat tools or anywhere public.

## AI proxy

AI calls go **browser → backend → Claude**, so the API key stays on the server.
Backend AI endpoints: `/api/ai/chat` and `/api/ai/explore`.

## Architecture overview

See `CLAUDE.md` in this folder for the full file structure and conventions.
