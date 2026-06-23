import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../backend/src/app.js";

const validSignup = {
  name: "Jane Admin",
  email: "jane@acme.com",
  password: "supersecret",
  orgName: "Acme Inc",
};

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
