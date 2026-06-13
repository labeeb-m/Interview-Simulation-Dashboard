from fastapi import APIRouter, Depends, Query
from app.db.connection import get_pool
from app.models import LatencyByBot, LatencyByVertical, LatencyBucket
from typing import List
import asyncpg

router = APIRouter(prefix="/api/latency", tags=["latency"])

@router.get("/by-bot", response_model=List[LatencyByBot])
async def latency_by_bot(
    days: int = Query(7, ge=1, le=90),
    pool: asyncpg.Pool = Depends(get_pool)
):
    async with pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT
                b.name                              AS bot_name,
                b.vertical,
                AVG(i.duration_ms)                  AS avg_ms,
                PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY i.duration_ms) AS p50_ms,
                PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY i.duration_ms) AS p95_ms,
                PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY i.duration_ms) AS p99_ms
            FROM interviews i
            JOIN bots b ON b.id = i.bot_id
            WHERE i.started_at >= NOW() - INTERVAL '1 day' * $1
              AND i.duration_ms IS NOT NULL
            GROUP BY b.name, b.vertical
            ORDER BY avg_ms DESC
        """, days)
    return [
        LatencyByBot(
            bot_name=r["bot_name"],
            vertical=r["vertical"],
            avg_ms=round(float(r["avg_ms"]), 1),
            p50_ms=round(float(r["p50_ms"]), 1),
            p95_ms=round(float(r["p95_ms"]), 1),
            p99_ms=round(float(r["p99_ms"]), 1),
        ) for r in rows
    ]

@router.get("/by-vertical", response_model=List[LatencyByVertical])
async def latency_by_vertical(
    days: int = Query(7, ge=1, le=90),
    pool: asyncpg.Pool = Depends(get_pool)
):
    async with pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT
                b.vertical,
                AVG(i.duration_ms)                  AS avg_ms,
                PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY i.duration_ms) AS p95_ms
            FROM interviews i
            JOIN bots b ON b.id = i.bot_id
            WHERE i.started_at >= NOW() - INTERVAL '1 day' * $1
              AND i.duration_ms IS NOT NULL
            GROUP BY b.vertical
            ORDER BY avg_ms DESC
        """, days)
    return [
        LatencyByVertical(
            vertical=r["vertical"],
            avg_ms=round(float(r["avg_ms"]), 1),
            p95_ms=round(float(r["p95_ms"]), 1),
        ) for r in rows
    ]

@router.get("/distribution", response_model=List[LatencyBucket])
async def latency_distribution(
    days: int = Query(7, ge=1, le=90),
    pool: asyncpg.Pool = Depends(get_pool)
):
    async with pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT
                CASE
                    WHEN duration_ms < 30000  THEN '0–30s'
                    WHEN duration_ms < 60000  THEN '30–60s'
                    WHEN duration_ms < 120000 THEN '1–2m'
                    WHEN duration_ms < 180000 THEN '2–3m'
                    WHEN duration_ms < 300000 THEN '3–5m'
                    ELSE '5m+'
                END AS bucket,
                COUNT(*) AS count
            FROM interviews
            WHERE started_at >= NOW() - INTERVAL '1 day' * $1
              AND duration_ms IS NOT NULL
            GROUP BY bucket
            ORDER BY MIN(duration_ms)
        """, days)
    return [LatencyBucket(bucket=r["bucket"], count=r["count"]) for r in rows]
