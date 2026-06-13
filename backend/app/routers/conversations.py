from fastapi import APIRouter, Depends, Query
from app.db.connection import get_pool
from app.models import BadConversationsResponse, BadConversation
from typing import Optional, List
import asyncpg

router = APIRouter(prefix="/api/conversations", tags=["conversations"])

@router.get("/bad", response_model=BadConversationsResponse)
async def bad_conversations(
    days: int = Query(7, ge=1, le=90),
    vertical: Optional[str] = Query(None),
    min_flags: int = Query(1, ge=0),
    max_match_score: float = Query(0.5, ge=0.0, le=1.0),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    pool: asyncpg.Pool = Depends(get_pool)
):
    offset = (page - 1) * page_size
    vertical_filter = "AND b.vertical = $6" if vertical else ""

    query = f"""
        WITH flagged AS (
            SELECT
                i.id,
                i.candidate_id,
                j.title           AS job_title,
                b.vertical,
                b.name            AS bot_name,
                i.started_at,
                i.duration_ms,
                i.tokens_used,
                i.cost_usd,
                i.match_score,
                i.outcome,
                i.transcript_snippet,
                ARRAY_AGG(f.flag ORDER BY f.severity DESC) FILTER (WHERE f.flag IS NOT NULL) AS flags,
                COUNT(f.id)       AS flag_count
            FROM interviews i
            JOIN jobs j ON j.id = i.job_id
            JOIN bots b ON b.id = i.bot_id
            LEFT JOIN interview_flags f ON f.interview_id = i.id
            WHERE i.started_at >= NOW() - INTERVAL '1 day' * $1
              AND (i.match_score IS NULL OR i.match_score <= $2)
              {vertical_filter}
            GROUP BY i.id, j.title, b.vertical, b.name
            HAVING COUNT(f.id) >= $3
        )
        SELECT *, COUNT(*) OVER() AS total_count
        FROM flagged
        ORDER BY flag_count DESC, match_score ASC NULLS LAST
        LIMIT $4 OFFSET $5
    """
    params = [days, max_match_score, min_flags, page_size, offset]
    if vertical:
        params.append(vertical)

    async with pool.acquire() as conn:
        rows = await conn.fetch(query, *params)

    total = rows[0]["total_count"] if rows else 0
    items: List[BadConversation] = []
    for r in rows:
        items.append(BadConversation(
            id=r["id"],
            candidate_id=r["candidate_id"],
            job_title=r["job_title"],
            vertical=r["vertical"],
            bot_name=r["bot_name"],
            started_at=r["started_at"],
            duration_ms=r["duration_ms"],
            tokens_used=r["tokens_used"],
            cost_usd=float(r["cost_usd"]) if r["cost_usd"] else None,
            match_score=float(r["match_score"]) if r["match_score"] else None,
            outcome=r["outcome"],
            transcript_snippet=r["transcript_snippet"],
            flags=list(r["flags"]) if r["flags"] else [],
        ))

    return BadConversationsResponse(items=items, total=total, page=page, page_size=page_size)
