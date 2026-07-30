const request = require("supertest");
const app = require("../index");

describe("smoke test", () => {
  test("unknown route returns 404", async () => {
    const res = await request(app).get("/definitely-not-a-route");
    expect(res.statusCode).toBe(404);
  });

  test("register rejects a missing body with a 4xx", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({}); // no email/password
    expect(res.statusCode).toBeGreaterThanOrEqual(400);
    expect(res.statusCode).toBeLessThan(500);
  });
});