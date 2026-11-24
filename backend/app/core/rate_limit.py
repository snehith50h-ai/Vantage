"""In-process sliding-window rate limiting for expensive endpoints.

The AI endpoints in this API are not free to run: each call fans out to a
multi-model council. Without a cap, one misbehaving client can drain the
platform's inference budget. This is a deliberate, dependency-free limiter
(single process, in-memory) — it is the right size for this service.

Configuration (environment):

``RATE_LIMIT_ENABLED``      ``true``/``false``. Default ``true``.
``RATE_LIMIT_PER_MINUTE``   Requests per minute per client. Default ``30``.
``RATE_LIMIT_EXEMPT_PATHS`` Comma-separated path prefixes that are never
                            limited. Default: the health and auth-config
                            probes.

The limiter identifies clients by authenticated user id when a bearer token is
present, and by client IP otherwise, so one user cannot starve another.
"""

from __future__ import annotations

import json
import os
import time
from collections import defaultdict, deque
from typing import Deque, Dict, Tuple

from app.core.http import request_id_from

DEFAULT_LIMIT = 30
WINDOW_SECONDS = 60.0

#: Paths that must never be rate limited (probes, docs, static metadata).
DEFAULT_EXEMPT = (
    "/api/health",
    "/api/models",
    "/api/auth/config",
    "/docs",
    "/redoc",
    "/openapi.json",
)


def _truthy(value: str | None, default: bool = True) -> bool:
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


class SlidingWindowLimiter:
    """Tracks request timestamps per key and rejects over-budget clients."""

    def __init__(self, limit: int = DEFAULT_LIMIT, window: float = WINDOW_SECONDS):
        self.limit = limit
        self.window = window
        self._hits: Dict[str, Deque[float]] = defaultdict(deque)
        self._last_sweep = time.monotonic()

    def check(self, key: str, now: float | None = None) -> Tuple[bool, int, float]:
        """Returns ``(allowed, remaining, retry_after_seconds)``."""
        now = now if now is not None else time.monotonic()
        self._sweep(now)

        hits = self._hits[key]
        cutoff = now - self.window
        while hits and hits[0] <= cutoff:
            hits.popleft()

        if len(hits) >= self.limit:
            retry_after = max(0.0, hits[0] + self.window - now)
            return False, 0, retry_after

        hits.append(now)
        return True, self.limit - len(hits), 0.0

    def _sweep(self, now: float) -> None:
        """Drops fully-expired windows so the dict cannot grow without bound."""
        if now - self._last_sweep < self.window:
            return
        self._last_sweep = now
        cutoff = now - self.window
        stale = [k for k, hits in self._hits.items() if not hits or hits[-1] <= cutoff]
        for k in stale:
            del self._hits[k]

    def reset(self) -> None:
        self._hits.clear()


_limiter = SlidingWindowLimiter(
    limit=int(os.getenv("RATE_LIMIT_PER_MINUTE", str(DEFAULT_LIMIT))),
    window=WINDOW_SECONDS,
)
_enabled = _truthy(os.getenv("RATE_LIMIT_ENABLED"), default=True)
_exempt = tuple(
    p.strip()
    for p in os.getenv("RATE_LIMIT_EXEMPT_PATHS", ",".join(DEFAULT_EXEMPT)).split(",")
    if p.strip()
)


def is_exempt(path: str) -> bool:
    return any(path.startswith(prefix) for prefix in _exempt)


def client_key(scope, user_id: str | None) -> str:
    """Identifies the caller: authenticated user if known, else IP."""
    if user_id:
        return f"user:{user_id}"
    # Uvicorn resolves forwarding information only from configured trusted proxies.
    client = scope.get("client")
    ip = client[0] if client else "unknown"
    return f"ip:{ip}"


def check_limit(scope, user_id: str | None) -> Tuple[bool, int, float]:
    """Applies the limiter. Returns ``(allowed, remaining, retry_after)``."""
    if not _enabled or is_exempt(scope.get("path", "")):
        return True, -1, 0.0
    return _limiter.check(client_key(scope, user_id))


def limiter_enabled() -> bool:
    return _enabled


def limiter_state() -> dict:
    """Introspection for the health endpoint."""
    return {
        "enabled": _enabled,
        "limit_per_minute": _limiter.limit,
        "exempt_paths": list(_exempt),
    }


class RateLimitMiddleware:
    """Rejects over-budget requests with ``429`` and a ``Retry-After`` header.

    Runs before the routing layer so an abusive client is stopped before any
    model is contacted. The response uses the shared error envelope.
    """

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            return await self.app(scope, receive, send)

        headers = {k.decode().lower(): v.decode() for k, v in scope.get("headers", [])}
        auth = headers.get("authorization", "")
        user_id = None
        if auth.lower().startswith("bearer "):
            try:
                from auth import decode_token

                user_id = decode_token(auth[7:].strip())
            except Exception:
                user_id = None

        allowed, remaining, retry_after = check_limit(scope, user_id)

        if not allowed:
            request_id = request_id_from(scope)
            retry_after = max(1, int(retry_after + 0.999))
            body = {
                "error": {
                    "code": "rate_limited",
                    "message": (
                        "Too many requests. Wait for the cooldown to finish, "
                        "then retry."
                    ),
                    "request_id": request_id,
                }
            }
            payload = json.dumps(body).encode()
            await send(
                {
                    "type": "http.response.start",
                    "status": 429,
                    "headers": [
                        (b"content-type", b"application/json"),
                        (b"content-length", str(len(payload)).encode()),
                        (b"retry-after", str(retry_after).encode()),
                        (b"x-request-id", request_id.encode()),
                    ],
                }
            )
            await send({"type": "http.response.body", "body": payload})
            return

        async def send_wrapper(message):
            if message["type"] == "http.response.start":
                message = dict(message)
                extra = list(message.get("headers", []))
                if remaining >= 0:
                    extra.append((b"x-ratelimit-remaining", str(remaining).encode()))
                message["headers"] = extra
            await send(message)

        await self.app(scope, receive, send_wrapper)
