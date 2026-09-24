import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import app from "../src/app.js";
import { env } from "../src/config/env.js";
import { User } from "../src/models/User.js";

/**
 * Authentication lifecycle integration test.
 *
 * Requires the local MongoDB (same database as the running dev backend).
 * Creates a throwaway mission_control user, exercises the full
 * login -> cookie -> authenticated request -> refresh -> logout lifecycle,
 * and verifies role authorization is NOT weakened.
 */

const server = http.createServer(app);
let port = 0;
let testUser: InstanceType<typeof User> | null = null;
const TEST_PASSWORD = "TestPass@123";
let email = "";

function parseCookies(setCookie: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const c of setCookie || []) {
    const [pair] = c.split(";");
    const eq = pair.indexOf("=");
    if (eq > 0) out[pair.slice(0, eq)] = pair.slice(eq + 1);
  }
  return out;
}

async function loginFetch() {
  return fetch(`http://127.0.0.1:${port}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: TEST_PASSWORD }),
  });
}

function cookieHeader(cookies: Record<string, string>): string {
  return Object.entries(cookies)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}

before(async () => {
  await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
  port = await new Promise<number>((resolve) => {
    server.listen(0, () => {
      resolve((server.address() as any).port as number);
    });
  });
  const hash = await bcrypt.hash(TEST_PASSWORD, 4);
  const stamp = Date.now();
  email = `mc-test-${stamp}@astroguard.local`;
  testUser = await User.create({
    name: "Test Mission Controller",
    email,
    username: `mctest${stamp}`,
    passwordHash: hash,
    role: "mission_control",
    isActive: true,
  });
});

after(async () => {
  try {
    if (testUser) await User.deleteOne({ _id: testUser._id });
  } catch {
    /* already removed */
  }
  server.close();
  await mongoose.disconnect();
});

test("successful login sets httpOnly access + refresh cookies", async () => {
  const res = await loginFetch();
  assert.equal(res.status, 200);
  const body = (await res.json()) as any;
  assert.equal(body.success, true);

  const cookies = parseCookies(res.headers.getSetCookie());
  assert.ok(cookies.astro_token, "astro_token cookie must be set");
  assert.ok(cookies.astro_refresh, "astro_refresh cookie must be set");
  for (const raw of res.headers.getSetCookie()) {
    assert.match(raw, /HttpOnly/);
    assert.match(raw, /Path=\//);
  }
});

test("protected request with a valid cookie succeeds", async () => {
  const login = await loginFetch();
  const cookies = parseCookies(login.headers.getSetCookie());
  const res = await fetch(`http://127.0.0.1:${port}/api/auth/me`, {
    headers: { Cookie: cookieHeader(cookies) },
  });
  assert.equal(res.status, 200);
  const body = (await res.json()) as any;
  assert.equal(body.success, true);
  assert.equal(body.data.user.email, email);
});

test("refresh with a valid refresh cookie returns a new access token", async () => {
  const login = await loginFetch();
  const cookies = parseCookies(login.headers.getSetCookie());
  const res = await fetch(`http://127.0.0.1:${port}/api/auth/refresh`, {
    method: "POST",
    headers: { Cookie: cookieHeader({ astro_refresh: cookies.astro_refresh }) },
  });
  assert.equal(res.status, 200);
  const body = (await res.json()) as any;
  assert.equal(body.success, true);
  assert.ok(body.data.accessToken, "refresh must return a fresh access token");
});

test("refresh with NO refresh cookie -> 401 Refresh token missing (no crash)", async () => {
  const res = await fetch(`http://127.0.0.1:${port}/api/auth/refresh`, { method: "POST" });
  assert.equal(res.status, 401);
  const body = (await res.json()) as any;
  assert.match(body.message, /Refresh token missing/);
});

test("expired access token -> 401 Session expired (drives the refresh path)", async () => {
  const login = await loginFetch();
  const cookies = parseCookies(login.headers.getSetCookie());
  const expired = jwt.sign(
    { id: testUser!._id.toString(), email, role: "mission_control" },
    env.JWT_SECRET,
    { expiresIn: "-10s" }
  );
  const res = await fetch(`http://127.0.0.1:${port}/api/auth/me`, {
    headers: { Cookie: cookieHeader({ astro_token: expired, astro_refresh: cookies.astro_refresh }) },
  });
  assert.equal(res.status, 401);
  const body = (await res.json()) as any;
  assert.match(body.message, /Session expired/);
});

test("concurrent refresh requests all succeed with a valid refresh cookie", async () => {
  const login = await loginFetch();
  const cookies = parseCookies(login.headers.getSetCookie());
  const refreshCookie = cookieHeader({ astro_refresh: cookies.astro_refresh });
  const results = await Promise.all(
    Array.from({ length: 8 }, () =>
      fetch(`http://127.0.0.1:${port}/api/auth/refresh`, {
        method: "POST",
        headers: { Cookie: refreshCookie },
      })
    )
  );
  for (const r of results) {
    assert.equal(r.status, 200, "all concurrent refreshes should succeed (no rotation conflict)");
  }
});

test("logout clears authentication cookies", async () => {
  const login = await loginFetch();
  const cookies = parseCookies(login.headers.getSetCookie());
  const res = await fetch(`http://127.0.0.1:${port}/api/auth/logout`, {
    method: "POST",
    headers: { Cookie: cookieHeader(cookies) },
  });
  assert.equal(res.status, 200);
  const cleared = res.headers.getSetCookie().join(" | ");
  for (const raw of res.headers.getSetCookie()) {
    assert.match(raw, /Expires=Thu, 01 Jan 1970|Max-Age=0/, `logout must expire the cookies: ${cleared}`);
  }
});

test("mission_control role can reach /api/v1/mission-control/dashboard (200)", async () => {
  const login = await loginFetch();
  const cookies = parseCookies(login.headers.getSetCookie());
  const res = await fetch(`http://127.0.0.1:${port}/api/v1/mission-control/dashboard`, {
    headers: { Cookie: cookieHeader(cookies) },
  });
  assert.equal(res.status, 200, "authenticated mission_control must load the dashboard");
});

test("an astronaut token calling mission-control gets 403 (authorization intact)", async () => {
  const hash = await bcrypt.hash(TEST_PASSWORD, 4);
  const stamp = Date.now();
  const astro = await User.create({
    name: "Test Astronaut",
    email: `ast-test-${stamp}@astroguard.local`,
    username: `asttest${stamp}`,
    passwordHash: hash,
    role: "astronaut",
    isActive: true,
  });
  try {
    const login = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: astro.email, password: TEST_PASSWORD }),
    });
    const cookies = parseCookies(login.headers.getSetCookie());
    const res = await fetch(`http://127.0.0.1:${port}/api/v1/mission-control/dashboard`, {
      headers: { Cookie: cookieHeader(cookies) },
    });
    assert.equal(res.status, 403, "astronaut must not access mission-control endpoints");
  } finally {
    await User.deleteOne({ _id: astro._id });
  }
});