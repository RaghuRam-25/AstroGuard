import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import dotenv from "dotenv";

dotenv.config();

const here = path.dirname(fileURLToPath(import.meta.url));
const snapshotScript = path.join(here, "cookie-snapshot.cjs");
const baseEnv = { ...process.env };

function snapshot(nodeEnv: string) {
  const env = {
    ...baseEnv,
    NODE_ENV: nodeEnv,
    JWT_SECRET: "unit-test-access-secret-not-real",
    REFRESH_TOKEN_SECRET: "unit-test-refresh-secret-not-real",
  };
  const r = spawnSync(process.execPath, [snapshotScript], {
    env,
    encoding: "utf8",
    timeout: 30000,
  });
  assert.equal(r.status, 0, `snapshot failed: ${r.stderr}`);
  return JSON.parse(r.stdout);
}

test("development cookies -> SameSite=Lax, NOT Secure (localhost is same-site)", () => {
  const { setCookies } = snapshot("development");
  assert.equal(setCookies.length, 2);
  const [access, refresh] = setCookies;
  assert.match(access, /^astro_token=ACCESS_TOKEN_VALUE/);
  assert.match(refresh, /^astro_refresh=REFRESH_TOKEN_VALUE/);
  for (const c of setCookies) {
    assert.match(c, /HttpOnly/);
    assert.match(c, /SameSite=Lax/i);
    assert.doesNotMatch(c, /Secure/);
    assert.match(c, /Path=\//);
  }
  assert.match(access, /Max-Age=900/);
  assert.match(refresh, /Max-Age=604800/);
});

test("production cookies -> SameSite=None + Secure (cross-site Vercel -> Render)", () => {
  const { setCookies } = snapshot("production");
  assert.equal(setCookies.length, 2);
  for (const c of setCookies) {
    assert.match(c, /HttpOnly/);
    assert.match(c, /Secure/, `must be Secure in production: ${c}`);
    assert.match(c, /SameSite=None/i, `must be SameSite=None in production: ${c}`);
    assert.match(c, /Path=\//);
  }
});

test("clearAuthCookies matches the same attributes so cookies are actually cleared", () => {
  const { clearedCookies } = snapshot("production");
  assert.equal(clearedCookies.length, 2);
  for (const c of clearedCookies) {
    assert.match(c, /SameSite=None/i);
    assert.match(c, /Secure/);
    assert.match(c, /Max-Age=0/);
  }
});