"""
Email service for Vantage AI Studio.
Supports:
1. Standard SMTP (Gmail, Brevo, SendGrid, Amazon SES, Mailgun, etc.)
2. Resend API (via HTTP)
3. Local/Development mode (clean console logging and dev token return so flow is testable without SMTP)
"""
import os
import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional, Dict, Any
import requests

logger = logging.getLogger("auth.email")


def _generate_html_template(reset_url: str, user_name: Optional[str] = None) -> str:
    greeting_name = user_name.strip() if user_name else "there"
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset Your Vantage AI Password</title>
  <style>
    body {{
      margin: 0;
      padding: 0;
      background-color: #07070b;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #ffffff;
    }}
    .wrapper {{
      width: 100%;
      background-color: #07070b;
      padding: 40px 15px;
    }}
    .container {{
      max-width: 520px;
      margin: 0 auto;
      background-color: #111119;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      padding: 36px 32px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
    }}
    .logo {{
      font-size: 16px;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      font-weight: 800;
      color: #ffffff;
      margin-bottom: 24px;
    }}
    .logo-accent {{
      color: #ff5c93;
    }}
    h1 {{
      font-size: 24px;
      font-weight: 700;
      margin: 0 0 16px 0;
      letter-spacing: -0.02em;
      color: #ffffff;
    }}
    p {{
      font-size: 14px;
      line-height: 1.6;
      color: rgba(255, 255, 255, 0.7);
      margin: 0 0 20px 0;
    }}
    .button-container {{
      text-align: center;
      margin: 30px 0;
    }}
    .button {{
      display: inline-block;
      background: linear-gradient(135deg, #ff5c93 0%, #d946ef 100%);
      color: #000000 !important;
      text-decoration: none;
      font-weight: 700;
      font-size: 15px;
      padding: 14px 32px;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(255, 92, 147, 0.4);
    }}
    .link-box {{
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.07);
      border-radius: 10px;
      padding: 12px;
      word-break: break-all;
      font-size: 12px;
      color: #ff5c93;
      margin: 20px 0;
      font-family: monospace;
    }}
    .footer {{
      margin-top: 32px;
      padding-top: 20px;
      border-top: 1px solid rgba(255, 255, 255, 0.07);
      font-size: 12px;
      color: rgba(255, 255, 255, 0.4);
      line-height: 1.5;
    }}
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="logo">VANTAGE <span class="logo-accent">AI STUDIO</span></div>
      <h1>Password Reset Request</h1>
      <p>Hi {greeting_name},</p>
      <p>We received a request to reset your Vantage AI Studio password. Click the button below to choose a new password:</p>
      <div class="button-container">
        <a href="{reset_url}" class="button" target="_blank">Reset Password</a>
      </div>
      <p>This password reset link will expire in <strong>60 minutes</strong>. If you did not request this change, you can safely ignore this email — your account is safe.</p>
      <p style="font-size: 12px; color: rgba(255, 255, 255, 0.5);">Or paste this link into your browser:</p>
      <div class="link-box">{reset_url}</div>
      <div class="footer">
        © 2026 Vantage AI Studio. Automated message, please do not reply directly.
      </div>
    </div>
  </div>
</body>
</html>"""


def _generate_text_template(reset_url: str, user_name: Optional[str] = None) -> str:
    greeting = f"Hi {user_name.strip()},\n\n" if user_name else "Hi,\n\n"
    return (
        f"{greeting}We received a request to reset your Vantage AI Studio password.\n\n"
        f"Click the link below to set a new password:\n{reset_url}\n\n"
        f"This link will expire in 60 minutes.\n"
        f"If you did not request this, you can safely ignore this message.\n\n"
        f"- The Vantage AI Team"
    )


def send_password_reset_email(
    to_email: str,
    reset_url: str,
    user_name: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Sends a password reset email to the recipient.
    - If RESEND_API_KEY is configured, sends via Resend REST API.
    - If SMTP_HOST and SMTP_USER are configured, sends via standard SMTP.
    - Otherwise, logs the full reset link to console and returns dev details.
    """
    resend_api_key = os.getenv("RESEND_API_KEY", "").strip()
    smtp_host = os.getenv("SMTP_HOST", "").strip()
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER", "").strip()
    smtp_password = os.getenv("SMTP_PASSWORD", "").strip()
    from_email = os.getenv("SMTP_FROM_EMAIL", "").strip() or os.getenv("EMAIL_FROM", "").strip()

    # 1. Resend API
    if resend_api_key:
        try:
            sender = from_email or "Vantage AI <onboarding@resend.dev>"
            res = requests.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {resend_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "from": sender,
                    "to": [to_email],
                    "subject": "Reset your Vantage AI password",
                    "html": _generate_html_template(reset_url, user_name),
                    "text": _generate_text_template(reset_url, user_name),
                },
                timeout=10,
            )
            if res.status_code in (200, 201):
                return {"sent": True, "mode": "resend", "data": res.json()}
            else:
                logger.error(f"Resend API error: {res.status_code} {res.text}")
                return {"sent": False, "mode": "resend_error", "error": res.text, "reset_url": reset_url}
        except Exception as e:
            logger.error(f"Failed to send email via Resend: {e}")
            return {"sent": False, "mode": "resend_exception", "error": str(e), "reset_url": reset_url}

    # 2. SMTP
    if smtp_host and smtp_user:
        try:
            sender = from_email or smtp_user
            msg = MIMEMultipart("alternative")
            msg["Subject"] = "Reset your Vantage AI password"
            msg["From"] = sender
            msg["To"] = to_email

            text_part = MIMEText(_generate_text_template(reset_url, user_name), "plain")
            html_part = MIMEText(_generate_html_template(reset_url, user_name), "html")
            msg.attach(text_part)
            msg.attach(html_part)

            use_ssl = os.getenv("SMTP_USE_SSL", "false").lower() in ("true", "1") or smtp_port == 465
            if use_ssl:
                with smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=12) as server:
                    if smtp_password:
                        server.login(smtp_user, smtp_password)
                    server.send_message(msg)
            else:
                with smtplib.SMTP(smtp_host, smtp_port, timeout=12) as server:
                    server.ehlo()
                    use_tls = os.getenv("SMTP_USE_TLS", "true").lower() in ("true", "1")
                    if use_tls:
                        server.starttls()
                        server.ehlo()
                    if smtp_password:
                        server.login(smtp_user, smtp_password)
                    server.send_message(msg)

            return {"sent": True, "mode": "smtp", "recipient": to_email}
        except Exception as e:
            logger.error(f"Failed to send email via SMTP: {e}")
            print(f"\n[SMTP ERROR]: {e}")
            print(f"Fallback Reset Link for {to_email}: {reset_url}\n")
            return {"sent": False, "mode": "smtp_error", "error": str(e), "reset_url": reset_url}

    # 3. Development / Local Mode fallback
    print("\n" + "=" * 70)
    print("[PASSWORD RESET LINK GENERATED - LOCAL / DEV MODE]")
    print(f"   Recipient: {to_email}")
    print(f"   Reset URL: {reset_url}")
    print("   (To deliver to real inboxes, configure SMTP_HOST/SMTP_USER or RESEND_API_KEY in backend/.env)")
    print("=" * 70 + "\n")

    return {
        "sent": False,
        "mode": "dev_console",
        "reason": "SMTP or Resend not configured. Link generated for local testing.",
        "reset_url": reset_url,
    }
