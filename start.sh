#!/usr/bin/env bash
# ScriptMind — one-command launcher.
# Usage: open Terminal, run:  ./start.sh   (from inside the ScriptMind-dev folder)
# Press Ctrl+C to stop everything.

set -e
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

echo "ScriptMind starting from: $DIR"

# 1) Make sure the database (PostgreSQL) is running.
if ! (lsof -nP -iTCP:5432 -sTCP:LISTEN >/dev/null 2>&1); then
  echo "Database not running — starting PostgreSQL..."
  brew services start postgresql@16 >/dev/null 2>&1 || true
  sleep 2
fi

# 2) Start the backend API (http://localhost:8000)
cd "$DIR/backend"
./venv/bin/uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!
cd "$DIR"

# 3) Start the frontend (http://localhost:5173)
npm run dev &
FRONTEND_PID=$!

# When you press Ctrl+C, stop both servers.
trap 'echo; echo "Stopping..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null' EXIT INT TERM

echo ""
echo "------------------------------------------------------------"
echo "  Backend:  http://localhost:8000"
echo "  App:      http://localhost:5173   <-- open this in your browser"
echo "  (Press Ctrl+C in this window to stop everything.)"
echo "------------------------------------------------------------"

wait
