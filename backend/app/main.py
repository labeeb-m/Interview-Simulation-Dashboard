from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.db.connection import get_pool, close_pool
from app.routers import kpis, latency, cost, flags, match_quality, conversations

@asynccontextmanager
async def lifespan(app: FastAPI):
    await get_pool()
    yield
    await close_pool()

app = FastAPI(
    title="Asendia AI Monitor",
    description="Observability platform for AI recruitment agents",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(kpis.router)
app.include_router(latency.router)
app.include_router(cost.router)
app.include_router(flags.router)
app.include_router(match_quality.router)
app.include_router(conversations.router)

@app.get("/health")
async def health():
    return {"status": "ok"}
