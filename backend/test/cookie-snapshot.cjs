// Helper: emit the exact Set-Cookie strings for a given NODE_ENV.
// Run from backend/: node test/cookie-snapshot.cjs  (env provided by parent)
const { setAuthCookies, clearAuthCookies } = require("../dist/utils/token.js");

const cookies = [];
const res = {
  cookie(name, value, options) {
    const parts = [`${name}=${value}`];
    if (options.httpOnly) parts.push("HttpOnly");
    if (options.secure) parts.push("Secure");
    if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);
    parts.push(`Max-Age=${Math.floor((options.maxAge || 0) / 1000)}`);
    parts.push(`Path=${options.path}`);
    cookies.push(parts.join("; "));
  },
  clearCookie(name, options) {
    this.cookie(name, "", { ...options, maxAge: 0 });
  },
};

setAuthCookies(res, "ACCESS_TOKEN_VALUE", "REFRESH_TOKEN_VALUE");
const setCookies = cookies.slice(0);
cookies.length = 0;
clearAuthCookies(res);

process.stdout.write(
  JSON.stringify({ setCookies, clearedCookies: cookies })
);