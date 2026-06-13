from fastapi import APIRouter, Depends, Query
from app.db.connection import get_pool
from app.models import CostOverTime, CostByVertical
from typing import List
import asyncpg

router = APIRouter(prefix="/api/cost", tags=["cost"])

@router.get("/over-time", response_model=List[CostOverTime])
async def cost_over_time(
    days: int = Query(30, ge=1, le=90),
    pool: asyncpg.Pool = Depends(get_pool)
):
    async with pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT
                DATE(started_at)            AS date,
                AVG(cost_usd)               AS avg_cost_usd,
                SUM(cost_usd)               AS total_cost_usd,
                COUNT(*)                    AS interview_count
            FROM interviews
            WHERE started_at >= NOW() - INTERVAL '1 day' * $1
              AND cost_usd IS NOT NULL
            GROUP BY DATE(started_at)
            ORDER BY date
        """, days)
    return [
        CostOverTime(
            date=str(r["date"]),
            avg_cost_usd=round(float(r["avg_cost_usd"]), 4),
            total_cost_usd=round(float(r["total_cost_usd"]), 4),
            interview_count=r["interview_count"],
        ) for r in rows
    ]

@router.get("/by-vertical", response_model=List[CostByVertical])
async def cost_by_vertical(
    days: int = Query(30, ge=1, le=90),
    pool: asyncpg.Pool = Depends(get_pool)
):
    async with pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT
                b.vertical,
                AVG(i.cost_usd)             AS avg_cost_usd,
                SUM(i.cost_usd)             AS total_cost_usd
            FROM interviews i
            JOIN bots b ON b.id = i.bot_id
            WHERE i.started_at >= NOW() - INTERVAL '1 day' * $1
              AND i.cost_usd IS NOT NULL
            GROUP BY b.vertical
            ORDER BY avg_cost_usd DESC
        """, days)
    return [
        CostByVertical(
            vertical=r["vertical"],
            avg_cost_usd=round(float(r["avg_cost_usd"]), 4),
            total_cost_usd=round(float(r["total_cost_usd"]), 2),
        ) for r in rows
    ]
