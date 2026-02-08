import request from "supertest";
import app from "../server.js";

describe("Application Server Basic Tests", () => {

  test("Health check should return 200", async () => {
    const res = await request(app).get("/health");
    expect(res.statusCode).toBe(200);
  });

});
