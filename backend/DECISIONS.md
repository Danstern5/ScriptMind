# Backend Decisions Log

Tracks architectural and implementation choices made during backend setup.

---

## Project Structure

**`dependencies.py` for shared FastAPI dependencies**
- Houses `get_db` (async DB session) and `get_current_user` (JWT validation)
- These are injected into routes via `Depends()` — avoids repeating auth/session logic in every router
- Standard FastAPI convention for keeping route handlers clean

**Separate `services/` layer from `routers/`**
- Routers handle HTTP (request parsing, status codes, responses)
- Services handle business logic (password hashing, DB queries)
- Keeps routers thin and logic reusable/testable
- Example: `routers/auth.py` defines `/signup`, `/login`, `/me` endpoints and returns HTTP responses. `services/auth.py` does the actual bcrypt hashing, DB user lookups, and JWT creation. The router never touches bcrypt or SQLAlchemy directly; the service never touches HTTP status codes.

**Separate `schemas/` from `models/`**
- `models/` = SQLAlchemy ORM classes (what's in the database)
- `schemas/` = Pydantic models (what the API accepts/returns)
- Prevents leaking DB internals (like password_hash) into API responses
- Response schemas also power FastAPI's auto-generated Swagger docs at `/docs` — consumers see the exact shape of every response

**`dependencies.py` bridges routers and services**
- `get_current_user` extracts JWT from the Authorization header, calls service to decode it, and injects the authenticated user into any protected route via `Depends()`
- Flow: HTTP request → dependency extracts/validates token → route handler receives user object → calls service for business logic

## Database

**JSONB for `elements` and `title_page` columns**
- Frontend stores screenplay as an array of `{id, type, text, dual?}` objects
- Storing as JSONB means no schema translation — save/load the exact same shape
- Alternative was normalizing elements into rows, but that adds complexity with no benefit since we always load the full script

**UUID primary keys instead of auto-increment integers**
- Safe to expose in URLs (no enumeration attacks)
- Generated client-side or server-side without coordination

**async SQLAlchemy + asyncpg**
- FastAPI is async-native, so async DB driver avoids blocking the event loop
- asyncpg is the fastest PostgreSQL driver for Python

## Auth

**JWT access tokens (stateless)**
- No server-side session store needed
- Token sent in `Authorization: Bearer <token>` header
- 7-day expiry default — long enough for a writing tool, avoids constant re-login

**bcrypt via passlib for password hashing**
- Industry standard, slow-by-design to resist brute force
- passlib wraps bcrypt with a clean API

## Config

**pydantic-settings for configuration**
- Reads from `.env` file automatically
- Type validation on startup — app won't start with missing/invalid config
- `DATABASE_URL` and `JWT_SECRET` are required (no defaults), everything else has sensible defaults

**CORS origins list in config**
- Defaults to localhost dev ports (5173, 3000)
- Vercel production domain gets added later via env var

## Deployment

**Dockerfile for Railway**
- Railway builds from Dockerfile
- Keeps deployment config explicit and reproducible
