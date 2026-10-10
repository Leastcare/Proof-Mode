"""
ProofMode FastAPI application entry point.
"""
from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.routes_compile  import router as compile_router
from app.api.routes_verify   import router as verify_router
from app.api.routes_reverify import router as reverify_router

# ── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="ProofMode API",
    description=(
        "Deterministic verification engine for AI-transformed CSV data. "
        "AI proposes. Human approves. Code verifies."
    ),
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ──────────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routes ────────────────────────────────────────────────────────────────────

app.include_router(compile_router,  tags=["Contract"])
app.include_router(verify_router,   tags=["Verification"])
app.include_router(reverify_router, tags=["Verification"])


# ── Health check ──────────────────────────────────────────────────────────────

@app.get("/health", tags=["System"])
async def health():
    return {"status": "ok", "service": "ProofMode API"}


@app.get("/", tags=["System"])
async def root():
    return {
        "service": "ProofMode API",
        "version": "0.1.0",
        "docs": "/docs",
        "endpoints": ["/compile-contract", "/verify", "/reverify"],
    }
