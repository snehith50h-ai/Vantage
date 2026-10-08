"""
ASGI middleware that auto-saves AI results for signed-in users (like ChatGPT history)
and records usage events. Existing endpoints don't need to change.

- POST /api/strategize, /api/playground/generate -> playground_runs  (X-Run-Id response header)
  Send `X-Run-Id: <id>` in the request to update an existing conversation instead of creating one.
- Other AI tool endpoints -> saved_items (X-Item-Id response header)
- Every AI call -> usage_events (token counts estimated at ~4 chars/token)
"""
import json
import time
import uuid

import anyio

from auth import db_cursor, decode_token

RUN_ENDPOINTS = {"/api/strategize", "/api/playground/generate"}

# path -> (kind, field used for the title)
ITEM_ENDPOINTS = {
    "/api/team/profile": ("team", "team_name"),
    "/api/project/scope": ("scope", "project_idea"),
    "/api/project/execution": ("execution", "core_workflow"),
    "/api/project/xray": ("xray", "project_contract"),
    "/api/project/postmortem": ("postmortem", "project_name"),
    "/api/mentor": ("mentor", "project_state"),
    "/api/github/analyze": ("github", "repo_url"),
}

USAGE_ONLY = {"/api/edit-architecture"}

TRACKED = RUN_ENDPOINTS | set(ITEM_ENDPOINTS) | USAGE_ONLY


def _title(text, fallback):
    text = (text or "").strip().replace("\n", " ")
    if not text:
        return fallback
    return text[:80] + ("…" if len(text) > 80 else "")


def _valid_uuid(v):
    try:
        return str(uuid.UUID(v))
    except (ValueError, TypeError, AttributeError):
        return None


def _persist(user_id, path, req_json, resp_json, run_id, item_id, latency_ms, status, in_chars, out_chars):
    model = req_json.get("model") if isinstance(req_json, dict) else None
    with db_cursor() as cur:
        cur.execute(
            """INSERT INTO usage_events (user_id, endpoint, model, input_tokens, output_tokens, latency_ms, status_code)
               VALUES (%s, %s, %s, %s, %s, %s, %s)""",
            (user_id, path, model, in_chars // 4, out_chars // 4, latency_ms, status),
        )
        if status >= 400 or resp_json is None:
            return

        if path in RUN_ENDPOINTS:
            config = {k: v for k, v in req_json.items() if k not in ("organizer_name", "problem_statement", "title")}
            title = req_json.get("title") or _title(req_json.get("problem_statement"), "Untitled strategy")
            cur.execute(
                """INSERT INTO playground_runs (id, user_id, title, organizer_name, problem_statement, config_json, result_json)
                   VALUES (%s, %s, %s, %s, %s, %s, %s)
                   ON CONFLICT (id) DO UPDATE SET
                       title = EXCLUDED.title,
                       organizer_name = EXCLUDED.organizer_name,
                       problem_statement = EXCLUDED.problem_statement,
                       config_json = EXCLUDED.config_json,
                       result_json = EXCLUDED.result_json,
                       updated_at = now()
                   WHERE playground_runs.user_id = EXCLUDED.user_id""",
                (run_id, user_id, title, req_json.get("organizer_name"), req_json.get("problem_statement"),
                 json.dumps(config), json.dumps(resp_json)),
            )
        elif path in ITEM_ENDPOINTS:
            kind, field = ITEM_ENDPOINTS[path]
            cur.execute(
                """INSERT INTO saved_items (id, user_id, kind, title, input_json, output_json)
                   VALUES (%s, %s, %s, %s, %s, %s)""",
                (item_id, user_id, kind, _title(str(req_json.get(field) or ""), kind.title()),
                 json.dumps(req_json), json.dumps(resp_json)),
            )


class PersistenceMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http" or scope["method"] != "POST" or scope["path"] not in TRACKED:
            return await self.app(scope, receive, send)

        headers = {k.decode().lower(): v.decode() for k, v in scope.get("headers", [])}
        auth = headers.get("authorization", "")
        user_id = decode_token(auth[7:].strip()) if auth.lower().startswith("bearer ") else None
        if not user_id:
            return await self.app(scope, receive, send)

        path = scope["path"]
        run_id = item_id = None
        extra_headers = []
        if path in RUN_ENDPOINTS:
            run_id = _valid_uuid(headers.get("x-run-id")) or str(uuid.uuid4())
            extra_headers.append((b"x-run-id", run_id.encode()))
        elif path in ITEM_ENDPOINTS:
            item_id = str(uuid.uuid4())
            extra_headers.append((b"x-item-id", item_id.encode()))

        req_chunks, resp_chunks = [], []
        status_holder = {"status": 500}
        started = time.perf_counter()

        async def recv_wrapper():
            message = await receive()
            if message["type"] == "http.request":
                req_chunks.append(message.get("body", b""))
            return message

        async def save():
            latency_ms = int((time.perf_counter() - started) * 1000)
            req_body, resp_body = b"".join(req_chunks), b"".join(resp_chunks)
            try:
                req_json = json.loads(req_body or b"{}")
            except ValueError:
                req_json = {}
            try:
                resp_json = json.loads(resp_body) if resp_body else None
            except ValueError:
                resp_json = None
            try:
                await anyio.to_thread.run_sync(
                    _persist, user_id, path, req_json, resp_json, run_id, item_id,
                    latency_ms, status_holder["status"], len(req_body), len(resp_body),
                )
            except Exception as e:  # never break the user's request because of history saving
                print(f"[persistence] failed to save for user {user_id} on {path}: {e}")

        async def send_wrapper(message):
            if message["type"] == "http.response.start":
                status_holder["status"] = message["status"]
                message = dict(message)
                message["headers"] = list(message.get("headers", [])) + extra_headers
            elif message["type"] == "http.response.body":
                resp_chunks.append(message.get("body", b""))
                if not message.get("more_body", False):
                    # Save before the client receives the end of the response,
                    # so history is consistent the moment the UI refreshes.
                    await save()
            await send(message)

        await self.app(scope, recv_wrapper, send_wrapper)
