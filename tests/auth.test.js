import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../backend/src/app.js";
import { User } from "../backend/src/models/user.js";
import { PasswordResetToken } from "../backend/src/models/password-reset-token.model.js";
import { hashToken } from "../backend/src/utils/token.js";

const validSignup = {
  name: "Jane Admin",
  email: "jane@acme.com",
  password: "supersecret",
  orgName: "Acme Inc",
};

function extractCookie(res, name) {
  const raw = res.headers["set-cookie"].find((c) => c.startsWith(`${name}=`));
  return raw.split(";")[0]; // "name=value", enough for a request's Cookie header
}

async function signupAndLogin() {
  await request(app).post("/v1/auth/admin/signup").send(validSignup);
  return request(app)
    .post("/v1/auth/login")
    .send({ email: validSignup.email, password: validSignup.password });
}

describe("POST /v1/auth/admin/signup", () => {
  it("creates an organization + admin and sets auth cookies", async () => {
    const res = await request(app).post("/v1/auth/admin/signup").send(validSignup);

    expect(res.status).toBe(201);
    expect(res.body.data.user.email).toBe("jane@acme.com");
    expect(res.body.data.user.role).toBe("ADMIN");
    expect(res.body.data.organization.name).toBe("Acme Inc");
    // Password hash must never leak to the client.
    expect(res.body.data.user.passwordHash).toBeUndefined();

    const cookies = res.headers["set-cookie"].join(";");
    expect(cookies).toContain("accessToken=");
    expect(cookies).toContain("refreshToken=");
  });

  it("rejects duplicate organizations with 409", async () => {
    await request(app).post("/v1/auth/admin/signup").send(validSignup);
    const res = await request(app).post("/v1/auth/admin/signup").send(validSignup);
    expect(res.status).toBe(409);
  });

  it("rejects invalid input with 422", async () => {
    const res = await request(app)
      .post("/v1/auth/admin/signup")
      .send({ name: "A", email: "not-an-email", password: "short", orgName: "" });
    expect(res.status).toBe(422);
    expect(res.body.error).toBe("Validation failed");
    expect(Array.isArray(res.body.details)).toBe(true);
  });
});

describe("POST /v1/auth/login", () => {
  it("logs in with valid credentials", async () => {
    await request(app).post("/v1/auth/admin/signup").send(validSignup);
    const res = await request(app)
      .post("/v1/auth/login")
      .send({ email: validSignup.email, password: validSignup.password });

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(validSignup.email);
    expect(res.headers["set-cookie"].join(";")).toContain("accessToken=");
  });

  it("rejects wrong password with 401", async () => {
    await request(app).post("/v1/auth/admin/signup").send(validSignup);
    const res = await request(app)
      .post("/v1/auth/login")
      .send({ email: validSignup.email, password: "wrongpassword" });
    expect(res.status).toBe(401);
  });

  it("blocks NoSQL injection objects via validation", async () => {
    await request(app).post("/v1/auth/admin/signup").send(validSignup);
    const res = await request(app)
      .post("/v1/auth/login")
      .send({ email: { $gt: "" }, password: { $gt: "" } });
    // The object never reaches the query — it's rejected as invalid input.
    expect(res.status).toBe(422);
  });
});

describe("POST /v1/auth/refresh", () => {
  it("rotates the session and issues new access + refresh cookies", async () => {
    const loginRes = await signupAndLogin();
    const oldRefreshCookie = extractCookie(loginRes, "refreshToken");

    const refreshRes = await request(app).post("/v1/auth/refresh").set("Cookie", oldRefreshCookie);

    expect(refreshRes.status).toBe(200);
    const newCookies = refreshRes.headers["set-cookie"].join(";");
    expect(newCookies).toContain("accessToken=");
    expect(newCookies).toContain("refreshToken=");
    expect(extractCookie(refreshRes, "refreshToken")).not.toBe(oldRefreshCookie);
  });

  it("rejects replay of a rotated-away token and revokes the whole session family", async () => {
    const loginRes = await signupAndLogin();
    const oldRefreshCookie = extractCookie(loginRes, "refreshToken");

    const firstRefresh = await request(app)
      .post("/v1/auth/refresh")
      .set("Cookie", oldRefreshCookie);
    const rotatedForwardCookie = extractCookie(firstRefresh, "refreshToken");

    // Replaying the old, already-rotated-away token is treated as reuse.
    const replay = await request(app).post("/v1/auth/refresh").set("Cookie", oldRefreshCookie);
    expect(replay.status).toBe(401);

    // The legitimately-rotated-forward token is also rejected now — proves
    // reuse detection revoked the whole family, not just the replayed doc.
    const afterReuse = await request(app)
      .post("/v1/auth/refresh")
      .set("Cookie", rotatedForwardCookie);
    expect(afterReuse.status).toBe(401);
  });

  it("rejects a missing refresh cookie", async () => {
    const res = await request(app).post("/v1/auth/refresh");
    expect(res.status).toBe(401);
  });
});

describe("POST /v1/auth/logout", () => {
  it("revokes the session so the refresh cookie can no longer be used", async () => {
    const loginRes = await signupAndLogin();
    const refreshCookie = extractCookie(loginRes, "refreshToken");

    const logoutRes = await request(app).post("/v1/auth/logout").set("Cookie", refreshCookie);
    expect(logoutRes.status).toBe(200);

    const refreshAfterLogout = await request(app)
      .post("/v1/auth/refresh")
      .set("Cookie", refreshCookie);
    expect(refreshAfterLogout.status).toBe(401);
  });

  it("succeeds even without a refresh cookie", async () => {
    const res = await request(app).post("/v1/auth/logout");
    expect(res.status).toBe(200);
  });
});

describe("POST /v1/auth/forgot-password", () => {
  it("returns the same generic message whether or not the email matches an account", async () => {
    await request(app).post("/v1/auth/admin/signup").send(validSignup);

    const known = await request(app)
      .post("/v1/auth/forgot-password")
      .send({ email: validSignup.email });
    const unknown = await request(app)
      .post("/v1/auth/forgot-password")
      .send({ email: "nobody@nowhere.com" });

    expect(known.status).toBe(200);
    expect(unknown.status).toBe(200);
    expect(known.body.message).toBe(unknown.body.message);
  });

  it("rejects invalid input with 422", async () => {
    const res = await request(app).post("/v1/auth/forgot-password").send({ email: "not-an-email" });
    expect(res.status).toBe(422);
  });
});

describe("POST /v1/auth/reset-password", () => {
  it("resets the password and revokes existing sessions", async () => {
    const loginRes = await signupAndLogin();
    const refreshCookie = extractCookie(loginRes, "refreshToken");

    // The API never returns the raw reset token (it's only emailed) — the
    // test constructs one directly via the model + the same token util the
    // service uses, mirroring how a real token would land in the DB.
    const user = await User.findOne({ email: validSignup.email });
    const rawToken = "test_reset_token_0123456789abcdef";
    await PasswordResetToken.create({
      userId: user._id,
      tokenHash: hashToken(rawToken),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });

    const resetRes = await request(app)
      .post("/v1/auth/reset-password")
      .send({ token: rawToken, newPassword: "brandnewpassword" });
    expect(resetRes.status).toBe(200);

    const oldLogin = await request(app)
      .post("/v1/auth/login")
      .send({ email: validSignup.email, password: validSignup.password });
    expect(oldLogin.status).toBe(401);

    const newLogin = await request(app)
      .post("/v1/auth/login")
      .send({ email: validSignup.email, password: "brandnewpassword" });
    expect(newLogin.status).toBe(200);

    // The reset revoked the session that was active before the password changed.
    const refreshAfterReset = await request(app)
      .post("/v1/auth/refresh")
      .set("Cookie", refreshCookie);
    expect(refreshAfterReset.status).toBe(401);
  });

  it("rejects an invalid or expired token with 400", async () => {
    const res = await request(app)
      .post("/v1/auth/reset-password")
      .send({ token: "not-a-real-token", newPassword: "brandnewpassword" });
    expect(res.status).toBe(400);
  });

  it("rejects reuse of an already-used token with 400", async () => {
    await request(app).post("/v1/auth/admin/signup").send(validSignup);
    const user = await User.findOne({ email: validSignup.email });
    const rawToken = "test_reset_token_reuse_0123456789ab";
    await PasswordResetToken.create({
      userId: user._id,
      tokenHash: hashToken(rawToken),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });

    const first = await request(app)
      .post("/v1/auth/reset-password")
      .send({ token: rawToken, newPassword: "firstnewpassword" });
    expect(first.status).toBe(200);

    const second = await request(app)
      .post("/v1/auth/reset-password")
      .send({ token: rawToken, newPassword: "secondnewpassword" });
    expect(second.status).toBe(400);
  });
});
