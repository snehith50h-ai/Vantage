import sys
from fastapi.testclient import TestClient
from main import app
from db import get_db_connection

client = TestClient(app)

def test_full_reset_flow():
    test_email = "snehith50h@gmail.com"
    
    # 1. Request forgot password
    res = client.post("/api/auth/forgot-password", json={"email": test_email})
    assert res.status_code == 200, f"Forgot password failed: {res.text}"
    data = res.json()
    assert data["ok"] is True
    print("Forgot password response:", data)
    
    dev_url = data.get("dev_reset_url")
    assert dev_url, "dev_reset_url should be returned in local mode"
    token = dev_url.split("token=")[-1]
    assert token, "Token not found in dev_reset_url"
    print(f"Extracted reset token: {token[:12]}...")
    
    # 2. Verify token
    res_verify = client.get(f"/api/auth/verify-reset-token?token={token}")
    assert res_verify.status_code == 200, f"Verify token failed: {res_verify.text}"
    verify_data = res_verify.json()
    assert verify_data["valid"] is True
    assert verify_data["email"] == test_email
    print("Verify token response:", verify_data)
    
    # 3. Reset password to new password
    new_pw = "NewSecurePassword123!"
    res_reset = client.post("/api/auth/reset-password", json={
        "token": token,
        "new_password": new_pw
    })
    assert res_reset.status_code == 200, f"Reset password failed: {res_reset.text}"
    reset_data = res_reset.json()
    assert reset_data["ok"] is True
    assert "token" in reset_data, "Should return session token after reset"
    print("Reset password success! Logged in session token created.")
    
    # 4. Verify token cannot be reused
    res_reuse = client.get(f"/api/auth/verify-reset-token?token={token}")
    assert res_reuse.status_code == 400, "Used token should be rejected"
    print("Token reuse correctly rejected:", res_reuse.json()["detail"])
    
    # 5. Verify login with the new password works
    res_login = client.post("/api/auth/login", json={
        "email": test_email,
        "password": new_pw
    })
    assert res_login.status_code == 200, f"Login with new password failed: {res_login.text}"
    print("Successfully logged in with newly reset password!")

if __name__ == "__main__":
    test_full_reset_flow()
    print("\nALL BACKEND RESET PASSWORD TESTS PASSED SUCCESSFULLY!")
