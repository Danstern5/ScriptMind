from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import ai, auth, scripts

app = FastAPI(title="ScriptMind API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(scripts.router, prefix="/api/scripts", tags=["scripts"])
app.include_router(ai.router, prefix="/api/ai", tags=["ai"])


@app.get("/api/health")
async def health():
    return {"status": "ok"}
