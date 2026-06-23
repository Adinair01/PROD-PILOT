import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../backend/src/app.js";

async function signupAndGetCookie() {
  const res = await request(app).post("/v1/auth/admin/signup").send({
    name: "PM User",
    email: "pm@acme.com",
    password: "supersecret",
    orgName: "Acme Inc",
  });
  return res.headers["set-cookie"];
}

describe("Feedback API", () => {
  let cookie;

  beforeEach(async () => {
    cookie = await signupAndGetCookie();
  });

  it("requires authentication", async () => {
    const res = await request(app).get("/v1/feedback");
    expect(res.status).toBe(401);
  });

  it("creates feedback and returns it in a paginated list", async () => {
    const create = await request(app)
      .post("/v1/feedback")
      .set("Cookie", cookie)
      .send({ message: "The login API is very slow under load" });

    expect(create.status).toBe(201);
    expect(create.body.data.message).toBe("The login API is very slow under load");

    const list = await request(app).get("/v1/feedback").set("Cookie", cookie);
    expect(list.status).toBe(200);
    expect(list.body.items).toHaveLength(1);
    expect(list.body.pagination).toMatchObject({ page: 1, total: 1 });
  });

  it("rejects empty messages with 422", async () => {
    const res = await request(app)
      .post("/v1/feedback")
      .set("Cookie", cookie)
      .send({ message: "   " });
    expect(res.status).toBe(422);
  });

  it("rejects over-long messages with 422", async () => {
    const res = await request(app)
      .post("/v1/feedback")
      .set("Cookie", cookie)
      .send({ message: "x".repeat(2001) });
    expect(res.status).toBe(422);
  });

  it("scopes feedback to the requesting organization", async () => {
    // Org A submits feedback.
    await request(app)
      .post("/v1/feedback")
      .set("Cookie", cookie)
      .send({ message: "Org A private feedback" });

    // A second org should see none of it.
    const otherCookie = (
      await request(app).post("/v1/auth/admin/signup").send({
        name: "Other PM",
        email: "pm@other.com",
        password: "supersecret",
        orgName: "Other Co",
      })
    ).headers["set-cookie"];

    const list = await request(app).get("/v1/feedback").set("Cookie", otherCookie);
    expect(list.body.items).toHaveLength(0);
  });
});
