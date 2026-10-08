"""
Authentication: email/password (bcrypt) + Google Sign-In, issuing JWT bearer tokens.
"""
import os
import secrets
import datetime as dt
from contextlib import contextmanager
from typing import Optional

import bcrypt
import jwt
import psycopg2.extras
from dotenv import load_dotenv, set_key
from email_validator import validate_email, EmailNotValidError
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel

from db import get_db_connection

load_dotenv()

ENV_PATH = os.path.join(os.path.dirname(__file__), ".env")

# Persist a JWT secret so sessions survive server restarts.
JWT_SECRET = os.getenv("JWT_SECRET")
if not JWT_SECRET:
    JWT_SECRET = secrets.token_urlsafe(48)
    try:
        set_key(ENV_PATH, "JWT_SECRET", JWT_SECRET)
    except Exception:
        pass
JWT_ALG = "HS256"
JWT_TTL_DAYS = int(os.getenv("JWT_TTL_DAYS", "30"))
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")

router = APIRouter(prefix="/api/auth", tags=["auth"])


# ---------------------------------------------------------------- helpers
@contextmanager
def db_cursor():
    conn = get_db_connection(register=False)
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        yield cur
        conn.commit()
        cur.close()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed: Optional[str]) -> bool:
    if not hashed:
        return False
    try:
        return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))
    except ValueError:
        return False


def create_token(user_id: str) -> str:
    now = dt.datetime.now(dt.timezone.utc)
    payload = {"sub": str(user_id), "iat": now, "exp": now + dt.timedelta(days=JWT_TTL_DAYS)}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


def decode_token(token: str) -> Optional[str]:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG]).get("sub")
    except jwt.PyJWTError:
        return None


def user_id_from_request(request: Request) -> Optional[str]:
    """Returns the user id from an `Authorization: Bearer <jwt>` header, or None."""
    header = request.headers.get("authorization", "")
    if not header.lower().startswith("bearer "):
        return None
    return decode_token(header[7:].strip())


def public_user(row: dict) -> dict:
    return {
        "id": str(row["id"]),
        "email": row["email"],
        "name": row.get("name") or row["email"].split("@")[0],
        "avatar_url": row.get("avatar_url"),
        "has_password": bool(row.get("password_hash")),
        "google_linked": bool(row.get("google_sub")),
        "created_at": row["created_at"].isoformat() if row.get("created_at") else None,
    }


def get_current_user(request: Request) -> dict:
    uid = user_id_from_request(request)
    if not uid:
        raise HTTPException(status_code=401, detail="Not authenticated")
    with db_cursor() as cur:
        cur.execute("SELECT * FROM users WHERE id = %s", (uid,))
        row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=401, detail="User no longer exists")
    return row


def _session_response(row: dict) -> dict:
    return {"token": create_token(row["id"]), "user": public_user(row)}


def _ensure_settings(cur, user_id):
    cur.execute(
        "INSERT INTO user_settings (user_id) VALUES (%s) ON CONFLICT (user_id) DO NOTHING",
        (user_id,),
    )


from email_service import send_password_reset_email

# ---------------------------------------------------------------- schemas
class RegisterRequest(BaseModel):
    email: str
    password: str
    name: Optional[str] = None


class LoginRequest(BaseModel):
    email: str
    password: str


class GoogleLoginRequest(BaseModel):
    credential: str  # Google Identity Services ID token


class ChangePasswordRequest(BaseModel):
    current_password: Optional[str] = None
    new_password: str


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


def _normalize_email(email: str) -> str:
    try:
        return validate_email(email.strip(), check_deliverability=False).normalized.lower()
    except EmailNotValidError as e:
        raise HTTPException(status_code=400, detail=str(e))


def _check_password_strength(pw: str):
    if len(pw) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters.")


# ---------------------------------------------------------------- routes
@router.get("/config")
def auth_config():
    return {"google_client_id": GOOGLE_CLIENT_ID or None}


@router.post("/register")
def register(req: RegisterRequest):
    email = _normalize_email(req.email)
    _check_password_strength(req.password)
    with db_cursor() as cur:
        cur.execute("SELECT id FROM users WHERE email = %s", (email,))
        if cur.fetchone():
            raise HTTPException(status_code=409, detail="An account with this email already exists.")
        cur.execute(
            """INSERT INTO users (email, password_hash, name, last_login_at)
               VALUES (%s, %s, %s, now()) RETURNING *""",
            (email, hash_password(req.password), (req.name or "").strip() or None),
        )
        row = cur.fetchone()
        _ensure_settings(cur, row["id"])
    return _session_response(row)


@router.post("/login")
def login(req: LoginRequest):
    email = _normalize_email(req.email)
    with db_cursor() as cur:
        cur.execute("SELECT * FROM users WHERE email = %s", (email,))
        row = cur.fetchone()
        if not row or not verify_password(req.password, row.get("password_hash")):
            if row and not row.get("password_hash") and row.get("google_sub"):
                raise HTTPException(status_code=401, detail="This account uses Google Sign-In.")
            raise HTTPException(status_code=401, detail="Invalid email or password.")
        cur.execute("UPDATE users SET last_login_at = now() WHERE id = %s", (row["id"],))
    return _session_response(row)


@router.post("/google")
def google_login(req: GoogleLoginRequest):
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=501, detail="Google Sign-In is not configured on the server (GOOGLE_CLIENT_ID).")
    from google.oauth2 import id_token
    from google.auth.transport import requests as g_requests

    try:
        info = id_token.verify_oauth2_token(req.credential, g_requests.Request(), GOOGLE_CLIENT_ID)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=f"Invalid Google credential: {e}")
    if not info.get("email_verified"):
        raise HTTPException(status_code=401, detail="Google email is not verified.")

    sub, email = info["sub"], info["email"].lower()
    with db_cursor() as cur:
        cur.execute("SELECT * FROM users WHERE google_sub = %s OR email = %s ORDER BY google_sub NULLS LAST LIMIT 1", (sub, email))
        row = cur.fetchone()
        if row:
            cur.execute(
                """UPDATE users SET google_sub = %s, last_login_at = now(),
                       name = COALESCE(name, %s), avatar_url = COALESCE(avatar_url, %s)
                   WHERE id = %s RETURNING *""",
                (sub, info.get("name"), info.get("picture"), row["id"]),
            )
        else:
            cur.execute(
                """INSERT INTO users (email, google_sub, name, avatar_url, last_login_at)
                   VALUES (%s, %s, %s, %s, now()) RETURNING *""",
                (email, sub, info.get("name"), info.get("picture")),
            )
        row = cur.fetchone()
        _ensure_settings(cur, row["id"])
    return _session_response(row)


@router.get("/me")
def me(user: dict = Depends(get_current_user)):
    return {"user": public_user(user)}


@router.post("/change-password")
def change_password(req: ChangePasswordRequest, user: dict = Depends(get_current_user)):
    _check_password_strength(req.new_password)
    if user.get("password_hash") and not verify_password(req.current_password or "", user["password_hash"]):
        raise HTTPException(status_code=401, detail="Current password is incorrect.")
    with db_cursor() as cur:
        cur.execute("UPDATE users SET password_hash = %s WHERE id = %s", (hash_password(req.new_password), user["id"]))
    return {"ok": True}


@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest):
    email = _normalize_email(req.email)
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000").rstrip("/")

    with db_cursor() as cur:
        cur.execute("SELECT id, email, name FROM users WHERE email = %s", (email,))
        user = cur.fetchone()

        if not user:
            # Generic success message to protect against user enumeration
            return {
                "ok": True,
                "message": "If an account with that email exists, password reset instructions have been sent.",
                "email_sent": False,
            }

        # Invalidate any prior active reset tokens for this user
        cur.execute(
            "UPDATE password_reset_tokens SET used = TRUE WHERE user_id = %s AND used = FALSE",
            (user["id"],),
        )

        token = secrets.token_urlsafe(32)
        expires_at = dt.datetime.now(dt.timezone.utc) + dt.timedelta(hours=1)

        cur.execute(
            """INSERT INTO password_reset_tokens (user_id, token, expires_at, used)
               VALUES (%s, %s, %s, FALSE)""",
            (user["id"], token, expires_at),
        )

    reset_url = f"{frontend_url}/reset-password?token={token}"
    email_res = send_password_reset_email(user["email"], reset_url, user.get("name"))

    resp: dict = {
        "ok": True,
        "message": "If an account with that email exists, password reset instructions have been sent.",
        "email_sent": email_res.get("sent", False),
        "delivery_mode": email_res.get("mode"),
    }

    # In dev mode / if SMTP is not configured, provide the reset link directly
    # so testing and unblocking are immediate
    if not email_res.get("sent"):
        resp["dev_reset_url"] = reset_url
        resp["dev_notice"] = (
            "SMTP is not configured in backend/.env, so the link was generated and logged to console. "
            "Click the dev link or configure SMTP in backend/.env to deliver to real inboxes."
        )

    return resp


@router.get("/verify-reset-token")
def verify_reset_token(token: str):
    clean_token = (token or "").strip()
    if not clean_token:
        raise HTTPException(status_code=400, detail="Token is required.")

    with db_cursor() as cur:
        cur.execute(
            """SELECT t.id, t.expires_at, t.used, u.email, u.name
               FROM password_reset_tokens t
               JOIN users u ON u.id = t.user_id
               WHERE t.token = %s""",
            (clean_token,),
        )
        row = cur.fetchone()

    if not row:
        raise HTTPException(status_code=400, detail="Invalid or unrecognized password reset link.")
    if row["used"]:
        raise HTTPException(status_code=400, detail="This password reset link has already been used.")
    if row["expires_at"] < dt.datetime.now(dt.timezone.utc):
        raise HTTPException(status_code=400, detail="This password reset link has expired (links are valid for 1 hour). Please request a new one.")

    email_parts = row["email"].split("@")
    user_part = email_parts[0]
    masked = user_part[0] + "***" + (user_part[-1] if len(user_part) > 1 else "") + "@" + email_parts[1]

    return {
        "valid": True,
        "email": row["email"],
        "masked_email": masked,
        "name": row.get("name") or "",
    }


@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest):
    _check_password_strength(req.new_password)
    clean_token = (req.token or "").strip()
    if not clean_token:
        raise HTTPException(status_code=400, detail="Token is required.")

    with db_cursor() as cur:
        cur.execute(
            """SELECT t.id, t.user_id, t.expires_at, t.used, u.email, u.name, u.avatar_url, u.google_sub, u.created_at
               FROM password_reset_tokens t
               JOIN users u ON u.id = t.user_id
               WHERE t.token = %s""",
            (clean_token,),
        )
        row = cur.fetchone()

        if not row:
            raise HTTPException(status_code=400, detail="Invalid or unrecognized password reset link.")
        if row["used"]:
            raise HTTPException(status_code=400, detail="This password reset link has already been used.")
        if row["expires_at"] < dt.datetime.now(dt.timezone.utc):
            raise HTTPException(status_code=400, detail="This password reset link has expired. Please request a new one.")

        hashed = hash_password(req.new_password)
        cur.execute("UPDATE users SET password_hash = %s WHERE id = %s", (hashed, row["user_id"]))
        cur.execute("UPDATE password_reset_tokens SET used = TRUE WHERE id = %s", (row["id"],))

        cur.execute("SELECT * FROM users WHERE id = %s", (row["user_id"],))
        user_row = cur.fetchone()

    return {
        "ok": True,
        "message": "Password has been successfully reset.",
        **_session_response(user_row),
    }

