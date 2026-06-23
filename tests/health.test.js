import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../backend/src/app.js";

describe("Health checks", () => {
  it("liveness returns ok", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  it("readiness reports DB connectivity", async () => {
    const res = await request(app).get("/health/ready");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: "ready", db: "up" });
  });

  it("unknown routes return 404 JSON", async () => {
    const res = await request(app).get("/v1/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Route not found");
  });
});
