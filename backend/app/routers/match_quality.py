from fastapi import APIRouter, Depends, Query
from app.db.connection import get_pool
from app.models import MatchQualityByVertical
from typing import List
import asyncpg

router = APIRouter(prefix="/api/match-quality", tags=["match_quality"])

@router.get("/by-vertical", response_model=List[MatchQualityByVertical])
async def match_quality_by_vertical(
    days: int = Query(30, ge=1, le=90),
    pool: asyncpg.Pool = Depends(get_pool)
):
    async with pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT
                b.vertical,
                AVG(i.match_score)      AS avg_match_score,
                COUNT(*)                AS interview_count,
                COUNT(*) FILTER (WHERE i.outcome = 'shortlisted')::float
                    / NULLIF(COUNT(*), 0) AS shortlist_rate,
                COUNT(*) FILTER (WHERE i.outcome = 'rejected')::float
                    / NULLIF(COUNT(*), 0) AS rejection_rate
            FROM interviews i
            JOIN bots b ON b.id = i.bot_id
            WHERE i.started_at >= NOW() - INTERVAL '1 day' * $1
              AND i.match_score IS NOT NULL
            GROUP BY b.vertical
            ORDER BY avg_match_score DESC
        """, days)
    return [
        MatchQualityByVertical(
            vertical=r["vertical"],
            avg_match_score=round(float(r["avg_match_score"]), 3),
            shortlist_rate=round(float(r["shortlist_rate"] or 0), 3),
            rejection_rate=round(float(r["rejection_rate"] or 0), 3),
            interview_count=r["interview_count"],
        ) for r in rows
    ]
