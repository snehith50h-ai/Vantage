async function runTest() {
  console.log("=== 1. Testing Next.js Pages ===");
  const forgotPage = await fetch("http://localhost:3000/forgot-password");
  console.log("Forgot Password Page status:", forgotPage.status, forgotPage.statusText);
  if (forgotPage.status !== 200) throw new Error("Forgot page failed to load");

  const resetPage = await fetch("http://localhost:3000/reset-password");
  console.log("Reset Password Page status:", resetPage.status, resetPage.statusText);
  if (resetPage.status !== 200) throw new Error("Reset page failed to load");

  console.log("\n=== 2. Requesting Password Reset Link from API ===");
  const email = "snehith50h@gmail.com";
  const forgotRes = await fetch("http://localhost:8000/api/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email })
  });
  const forgotData = await forgotRes.json();
  console.log("API Response:", forgotData);

  const resetUrl = forgotData.dev_reset_url;
  if (!resetUrl) throw new Error("dev_reset_url not returned in response");
  console.log("Generated Reset URL:", resetUrl);

  const urlObj = new URL(resetUrl);
  const token = urlObj.searchParams.get("token");
  console.log("Extracted Token:", token);

  console.log("\n=== 3. Verifying Reset Token ===");
  const verifyRes = await fetch(`http://localhost:8000/api/auth/verify-reset-token?token=${token}`);
  const verifyData = await verifyRes.json();
  console.log("Verify Response:", verifyData);
  if (!verifyData.valid) throw new Error("Token verification failed");

  console.log("\n=== 4. Setting New Password ===");
  const newPassword = "SuperSecretPassword2026!";
  const resetRes = await fetch("http://localhost:8000/api/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, new_password: newPassword })
  });
  const resetData = await resetRes.json();
  console.log("Reset Password Response:", resetData);
  if (!resetData.ok) throw new Error("Password reset failed");

  console.log("\n=== 5. Verifying Token Cannot Be Reused ===");
  const reuseRes = await fetch(`http://localhost:8000/api/auth/verify-reset-token?token=${token}`);
  console.log("Reuse check status:", reuseRes.status);
  const reuseData = await reuseRes.json();
  console.log("Reuse response (expected error):", reuseData);
  if (reuseRes.status !== 400) throw new Error("Used token was not rejected");

  console.log("\n=== 6. Logging In With New Password ===");
  const loginRes = await fetch("http://localhost:8000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: newPassword })
  });
  const loginData = await loginRes.json();
  console.log("Login Status:", loginRes.status);
  console.log("Logged In User:", loginData.user);
  if (loginRes.status !== 200 || !loginData.token) throw new Error("Login with new password failed");

  console.log("\n>>> FULL END-TO-END FLOW VERIFIED SUCCESSFULLY! <<<");
}

runTest().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
