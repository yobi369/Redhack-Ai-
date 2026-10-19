import { afterAll, beforeAll, describe, expect, it } from "vitest";
import http from "http";
import app from "../../server";

describe("Authentication endpoint regression", () => {
  let server: http.Server;
  let baseUrl: string;

  beforeAll(async () => {
    await new Promise<void>((resolve) => {
      server = app.listen(0, "127.0.0.1", () => {
        const address = server.address() as { port: number };
        baseUrl = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it("does not issue a token for a seeded user without password credentials", async () => {
    const response = await fetch(`${baseUrl}/api/v2/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: "m.vance@apex-cyber.internal",
        password: "any-password-must-not-work",
      }),
    });

    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({ code: "AUTH_FAILED" });
  });
});
