"""Cross-cutting HTTP concerns for the Vantage API.

Holds the pieces every endpoint needs and none of them should re-implement:

- Request/response correlation IDs (``X-Request-ID``) for tracing.
- A single structured error envelope so the frontend never has to guess
  whether a failure body is ``{"detail": ...}`` or ``{"error": ...}``.
- A consistent rule for what may leave the process in an error message.

Every exception that reaches a client goes through :func:`public_error`, which
means internal exception text (stack frames, SQL, upstream payloads) is logged
server-side and replaced with a stable, human-readable sentence on the wire.
"""

from __future__ import annotations

import logging
import os
import uuid
from typing import Any, Dict, Optional

from fastapi import HTTPException
from fastapi.responses import JSONResponse

log = logging.getLogger("vantage.api")

#: Message shown for any 5xx that reaches the client. Deliberately generic:
#: the specifics go to the log, keyed by request id.
INTERNAL_ERROR_MESSAGE = (
    "The server could not complete this request. The incident was logged; "
    "quote the request id if you report it."
)


def new_request_id() -> str:
    """A short, sortable-enough correlation id."""
    return uuid.uuid4().hex[:16]


def public_error(
    exc: Exception,
    *,
    request_id: str,
    status_code: int = 500,
    context: Optional[str] = None,
) -> HTTPException:
    """Turn an internal exception into a client-safe HTTPException.

    The full exception (with traceback) is logged against ``request_id``. The
    client receives a stable message plus the request id so support can find
    the exact log line without the client ever seeing internals.
    """
    where = f" ({context})" if context else ""
    log.exception("Unhandled error%s request_id=%s", where, request_id)
    return HTTPException(
        status_code=status_code,
        detail=INTERNAL_ERROR_MESSAGE,
        headers={"X-Request-ID": request_id},
    )


def error_body(request_id: str, message: str, code: str = "error") -> Dict[str, Any]:
    """The single error shape every non-2xx response uses."""
    return {"error": {"code": code, "message": message, "request_id": request_id}}


class RequestIdMiddleware:
    """Assigns an ``X-Request-ID`` to every request and echoes it back.

    Also stamps the request state so handlers can read it without re-parsing
    headers, and records the wall time for the structured access log line.
    """

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            return await self.app(scope, receive, send)

        headers = {k.decode().lower(): v.decode() for k, v in scope.get("headers", [])}
        incoming = headers.get("x-request-id", "").strip()
        request_id = incoming[:64] if incoming else new_request_id()

        scope.setdefault("state", {})["request_id"] = request_id

        async def send_wrapper(message):
            if message["type"] == "http.response.start":
                message = dict(message)
                existing = list(message.get("headers", []))
                existing.append((b"x-request-id", request_id.encode()))
                message["headers"] = existing
            await send(message)

        await self.app(scope, receive, send_wrapper)


def request_id_from(scope) -> str:
    """Best-effort read of the request id from an ASGI scope."""
    try:
        return scope.get("state", {}).get("request_id") or new_request_id()
    except Exception:
        return new_request_id()


def allowed_origins() -> list[str]:
    """Origins permitted to call the API.

    ``CORS_ALLOW_ORIGINS`` is a comma-separated list. When it is unset the API
    only allows local development origins, because a wildcard origin combined
    with credentialed requests is rejected by browsers anyway and would be a
    genuine security hole if it were not.
    """
    raw = os.getenv("CORS_ALLOW_ORIGINS", "").strip()
    if raw:
        return [o.strip() for o in raw.split(",") if o.strip()]
    return [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
    ]


def json_error(request_id: str, message: str, status_code: int, code: str = "error") -> JSONResponse:
    """A JSONResponse carrying the standard error envelope."""
    return JSONResponse(
        status_code=status_code,
        content=error_body(request_id, message, code),
        headers={"X-Request-ID": request_id},
    )
