from fastapi import APIRouter, Depends, Query
from app.db.connection import get_pool
from app.models import FlagTrend, FlagSummary
from typing import List
import asyncpg

router = APIRouter(prefix="/api/flags", tags=["flags"])

@router.get("/summary", response_model=List[FlagSummary])
async def flags_summary(
    days: int = Query(7, ge=1, le=90),
    pool: asyncpg.Pool = Depends(get_pool)
):
    async with pool.acquire() as conn:
        total_row = await conn.fetchrow(
            "SELECT COUNT(*) AS n FROM interviews WHERE started_at >= NOW() - INTERVAL '1 day' * $1", days
        )
        total = total_row["n"] or 1
        rows = await conn.fetch("""
            SELECT
                f.flag,
                f.severity,
                COUNT(*) AS count
            FROM interview_flags f
            JOIN interviews i ON i.id = f.interview_id
            WHERE i.started_at >= NOW() - INTERVAL '1 day' * $1
            GROUP BY f.flag, f.severity
            ORDER BY count DESC
        """, days)
    return [
        FlagSummary(
            flag=r["flag"],
            count=r["count"],
            severity=r["severity"],
            rate=round(r["count"] / total, 4),
        ) for r in rows
    ]

@router.get("/trend", response_model=List[FlagTrend])
async def flags_trend(
    days: int = Query(14, ge=1, le=90),
    pool: asyncpg.Pool = Depends(get_pool)
):
    async with pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT
                DATE(i.started_at)  AS date,
                f.flag,
                COUNT(*)            AS count
            FROM interview_flags f
            JOIN interviews i ON i.id = f.interview_id
            WHERE i.started_at >= NOW() - INTERVAL '1 day' * $1
            GROUP BY DATE(i.started_at), f.flag
            ORDER BY date, f.flag
        """, days)
    return [FlagTrend(date=str(r["date"]), flag=r["flag"], count=r["count"]) for r in rows]
