"""
Per-user data API: profile, settings, playground run history, saved tool outputs, usage stats.
Every query is scoped by the authenticated user's id.
"""
import json
from typing import Optional, Any, Dict

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from auth import db_cursor, get_current_user, public_user

router = APIRouter(prefix="/api/me", tags=["me"])


def _iso(row: dict, *keys):
    for k in keys:
        if row.get(k) is not None and hasattr(row[k], "isoformat"):
            row[k] = row[k].isoformat()
    if "id" in row:
        row["id"] = str(row["id"])
    row.pop("user_id", None)
    return row


# ---------------------------------------------------------------- profile
@router.get("")
@router.get("/")
def get_me(user: dict = Depends(get_current_user)):
    return {"user": public_user(user)}

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    avatar_url: Optional[str] = None


@router.patch("/profile")
def update_profile(req: ProfileUpdate, user: dict = Depends(get_current_user)):
    with db_cursor() as cur:
        cur.execute(
            """UPDATE users SET name = COALESCE(%s, name), avatar_url = COALESCE(%s, avatar_url)
               WHERE id = %s RETURNING *""",
            (req.name.strip() if req.name else None, req.avatar_url, user["id"]),
        )
        row = cur.fetchone()
    return {"user": public_user(row)}


@router.delete("/account")
def delete_account(user: dict = Depends(get_current_user)):
    with db_cursor() as cur:
        cur.execute("DELETE FROM users WHERE id = %s", (user["id"],))
    return {"ok": True}


# ---------------------------------------------------------------- settings
class SettingsUpdate(BaseModel):
    default_model: Optional[str] = None
    temperature: Optional[float] = None
    system_instruction: Optional[str] = None


@router.get("/settings")
def get_settings(user: dict = Depends(get_current_user)):
    with db_cursor() as cur:
        cur.execute("INSERT INTO user_settings (user_id) VALUES (%s) ON CONFLICT DO NOTHING", (user["id"],))
        cur.execute("SELECT default_model, temperature, system_instruction FROM user_settings WHERE user_id = %s", (user["id"],))
        return cur.fetchone()


@router.put("/settings")
def put_settings(req: SettingsUpdate, user: dict = Depends(get_current_user)):
    if req.temperature is not None and not (0 <= req.temperature <= 2):
        raise HTTPException(status_code=400, detail="Temperature must be between 0 and 2.")
    with db_cursor() as cur:
        cur.execute(
            """INSERT INTO user_settings (user_id, default_model, temperature, system_instruction)
               VALUES (%s, COALESCE(%s, 'gemini-3.5-flash-lite'), COALESCE(%s, 0.7), %s)
               ON CONFLICT (user_id) DO UPDATE SET
                   default_model = COALESCE(EXCLUDED.default_model, user_settings.default_model),
                   temperature = COALESCE(%s, user_settings.temperature),
                   system_instruction = COALESCE(%s, user_settings.system_instruction),
                   updated_at = now()
               RETURNING default_model, temperature, system_instruction""",
            (user["id"], req.default_model, req.temperature, req.system_instruction,
             req.temperature, req.system_instruction),
        )
        return cur.fetchone()


# ---------------------------------------------------------------- playground runs (history)
class RunUpdate(BaseModel):
    title: Optional[str] = None
    pinned: Optional[bool] = None
    result_json: Optional[Dict[str, Any]] = None


@router.get("/runs")
def list_runs(q: Optional[str] = None, limit: int = Query(100, le=500), user: dict = Depends(get_current_user)):
    sql = """SELECT id, title, organizer_name, pinned, created_at, updated_at,
                    config_json->>'model' AS model
             FROM playground_runs WHERE user_id = %s"""
    params: list = [user["id"]]
    if q:
        sql += " AND (title ILIKE %s OR problem_statement ILIKE %s OR organizer_name ILIKE %s)"
        params += [f"%{q}%"] * 3
    sql += " ORDER BY pinned DESC, updated_at DESC LIMIT %s"
    params.append(limit)
    with db_cursor() as cur:
        cur.execute(sql, params)
        return {"runs": [_iso(r, "created_at", "updated_at") for r in cur.fetchall()]}


@router.get("/runs/{run_id}")
def get_run(run_id: str, user: dict = Depends(get_current_user)):
    with db_cursor() as cur:
        cur.execute("SELECT * FROM playground_runs WHERE id = %s AND user_id = %s", (run_id, user["id"]))
        row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Run not found")
    return _iso(row, "created_at", "updated_at")


@router.patch("/runs/{run_id}")
def update_run(run_id: str, req: RunUpdate, user: dict = Depends(get_current_user)):
    with db_cursor() as cur:
        cur.execute(
            """UPDATE playground_runs SET
                   title = COALESCE(%s, title),
                   pinned = COALESCE(%s, pinned),
                   result_json = COALESCE(%s::jsonb, result_json),
                   updated_at = now()
               WHERE id = %s AND user_id = %s
               RETURNING id, title, pinned, updated_at""",
            (req.title, req.pinned, json.dumps(req.result_json) if req.result_json is not None else None,
             run_id, user["id"]),
        )
        row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Run not found")
    return _iso(row, "updated_at")


@router.delete("/runs/{run_id}")
def delete_run(run_id: str, user: dict = Depends(get_current_user)):
    with db_cursor() as cur:
        cur.execute("DELETE FROM playground_runs WHERE id = %s AND user_id = %s", (run_id, user["id"]))
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Run not found")
    return {"ok": True}


# ---------------------------------------------------------------- saved items (projects / teams)
class ItemUpdate(BaseModel):
    title: str


@router.get("/items")
def list_items(kind: Optional[str] = None, user: dict = Depends(get_current_user)):
    sql = "SELECT id, kind, title, created_at FROM saved_items WHERE user_id = %s"
    params: list = [user["id"]]
    if kind:
        sql += " AND kind = %s"
        params.append(kind)
    sql += " ORDER BY created_at DESC LIMIT 300"
    with db_cursor() as cur:
        cur.execute(sql, params)
        return {"items": [_iso(r, "created_at") for r in cur.fetchall()]}


@router.get("/items/{item_id}")
def get_item(item_id: str, user: dict = Depends(get_current_user)):
    with db_cursor() as cur:
        cur.execute("SELECT * FROM saved_items WHERE id = %s AND user_id = %s", (item_id, user["id"]))
        row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Item not found")
    return _iso(row, "created_at")


@router.patch("/items/{item_id}")
def rename_item(item_id: str, req: ItemUpdate, user: dict = Depends(get_current_user)):
    with db_cursor() as cur:
        cur.execute("UPDATE saved_items SET title = %s WHERE id = %s AND user_id = %s", (req.title, item_id, user["id"]))
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Item not found")
    return {"ok": True}


@router.delete("/items/{item_id}")
def delete_item(item_id: str, user: dict = Depends(get_current_user)):
    with db_cursor() as cur:
        cur.execute("DELETE FROM saved_items WHERE id = %s AND user_id = %s", (item_id, user["id"]))
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Item not found")
    return {"ok": True}


# ---------------------------------------------------------------- usage
@router.get("/usage")
def usage(days: int = Query(14, ge=1, le=90), user: dict = Depends(get_current_user)):
    uid = user["id"]
    with db_cursor() as cur:
        cur.execute(
            """SELECT COUNT(*)::int AS requests,
                      COALESCE(SUM(input_tokens),0)::int AS input_tokens,
                      COALESCE(SUM(output_tokens),0)::int AS output_tokens,
                      COALESCE(AVG(latency_ms),0)::int AS avg_latency_ms
               FROM usage_events WHERE user_id = %s""",
            (uid,),
        )
        totals = cur.fetchone()
        cur.execute(
            """SELECT to_char(d::date, 'YYYY-MM-DD') AS day,
                      COALESCE(COUNT(u.id),0)::int AS requests,
                      COALESCE(SUM(u.input_tokens + u.output_tokens),0)::int AS tokens
               FROM generate_series(current_date - (%s - 1), current_date, interval '1 day') d
               LEFT JOIN usage_events u ON u.user_id = %s AND u.created_at::date = d::date
               GROUP BY d ORDER BY d""",
            (days, uid),
        )
        daily = cur.fetchall()
        cur.execute(
            """SELECT endpoint, COUNT(*)::int AS requests,
                      COALESCE(SUM(input_tokens + output_tokens),0)::int AS tokens
               FROM usage_events WHERE user_id = %s GROUP BY endpoint ORDER BY requests DESC""",
            (uid,),
        )
        by_endpoint = cur.fetchall()
        cur.execute(
            """SELECT COALESCE(model,'unknown') AS model, COUNT(*)::int AS requests
               FROM usage_events WHERE user_id = %s GROUP BY model ORDER BY requests DESC""",
            (uid,),
        )
        by_model = cur.fetchall()
        cur.execute("SELECT COUNT(*)::int AS n FROM playground_runs WHERE user_id = %s", (uid,))
        runs = cur.fetchone()["n"]
        cur.execute("SELECT COUNT(*)::int AS n FROM saved_items WHERE user_id = %s", (uid,))
        items = cur.fetchone()["n"]
    return {"totals": {**totals, "runs": runs, "saved_items": items},
            "daily": daily, "by_endpoint": by_endpoint, "by_model": by_model}
