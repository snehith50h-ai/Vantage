from __future__ import annotations

import logging
from typing import Any, Dict, List, Literal, Optional
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status
from app.models import TesterFeedbackCreate, TesterFeedbackItem
from db import get_db_connection

router = APIRouter(prefix="/api/feedback", tags=["feedback"])
log = logging.getLogger("vantage.feedback")


@router.get("", response_model=Dict[str, Any])
def list_tester_feedback(
    persona: Optional[str] = Query(None, description="Filter by tester persona"),
    category: Optional[str] = Query(None, description="Filter by feedback category"),
    sort_by: Literal["upvotes", "recent"] = Query("upvotes", description="Sort order"),
):
    """Returns community reviews and early tester feedback (MakersWall & PostHog style)."""
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        query = """
            SELECT id, persona, category, rating, feedback, author_name, author_handle, upvotes, created_at
            FROM tester_feedback
            WHERE 1=1
        """
        params: List[Any] = []
        if persona:
            query += " AND persona = %s"
            params.append(persona)
        if category:
            query += " AND category = %s"
            params.append(category)

        if sort_by == "recent":
            query += " ORDER BY created_at DESC"
        else:
            query += " ORDER BY upvotes DESC, created_at DESC"

        cur.execute(query, params)
        rows = cur.fetchall()

        items = [
            TesterFeedbackItem(
                id=str(r[0]),
                persona=r[1],
                category=r[2],
                rating=r[3],
                feedback=r[4],
                author_name=r[5],
                author_handle=r[6],
                upvotes=r[7],
                created_at=r[8].strftime("%Y-%m-%d %H:%M:%S") if r[8] else "",
            )
            for r in rows
        ]

        # Calculate high-level stats
        total_count = len(items)
        avg_rating = round(sum(i.rating for i in items) / total_count, 1) if total_count > 0 else 0.0
        persona_counts: Dict[str, int] = {}
        for i in items:
            persona_counts[i.persona] = persona_counts.get(i.persona, 0) + 1

        return {
            "feedback": [i.dict() for i in items],
            "stats": {
                "total_reviews": total_count,
                "average_rating": avg_rating,
                "persona_counts": persona_counts,
            },
        }
    except Exception as e:
        log.exception("Failed to query tester feedback")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch feedback.",
        )
    finally:
        cur.close()
        conn.close()


@router.post("", response_model=TesterFeedbackItem, status_code=status.HTTP_201_CREATED)
def submit_tester_feedback(req: TesterFeedbackCreate):
    """Submits new early tester feedback from the in-app widget or Early Testers Wall."""
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute(
            """
            INSERT INTO tester_feedback (persona, category, rating, feedback, author_name, author_handle, upvotes)
            VALUES (%s, %s, %s, %s, %s, %s, 0)
            RETURNING id, created_at;
            """,
            (
                req.persona,
                req.category,
                req.rating,
                req.feedback.strip(),
                req.author_name or "Early Tester",
                req.author_handle,
            ),
        )
        row = cur.fetchone()
        conn.commit()
        feedback_id = str(row[0])
        created_at_str = row[1].strftime("%Y-%m-%d %H:%M:%S") if row[1] else ""

        return TesterFeedbackItem(
            id=feedback_id,
            persona=req.persona,
            category=req.category,
            rating=req.rating,
            feedback=req.feedback.strip(),
            author_name=req.author_name or "Early Tester",
            author_handle=req.author_handle,
            upvotes=0,
            created_at=created_at_str,
        )
    except Exception as e:
        conn.rollback()
        log.exception("Failed to submit feedback")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save feedback.",
        )
    finally:
        cur.close()
        conn.close()


@router.post("/{feedback_id}/upvote")
def upvote_tester_feedback(feedback_id: str):
    """Upvotes a tester feedback review (MakersWall peer praise)."""
    try:
        uid = UUID(feedback_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid feedback UUID")

    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute(
            """
            UPDATE tester_feedback
            SET upvotes = upvotes + 1
            WHERE id = %s
            RETURNING upvotes;
            """,
            (str(uid),),
        )
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Feedback not found")
        conn.commit()
        return {"ok": True, "id": str(uid), "upvotes": row[0]}
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        log.exception("Failed to upvote feedback")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upvote feedback",
        )
    finally:
        cur.close()
        conn.close()
