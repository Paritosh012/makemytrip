/**
 * Single source of truth for every auth cookie.
 *
 * WHY THIS FILE EXISTS:
 * res.cookie() and res.clearCookie() must agree on domain, path, secure and
 * sameSite. If even one attribute differs, the browser treats them as two
 * different cookies and the "clear" silently does nothing. That was the
 * logout bug: login wrote sameSite:"None", logout cleared sameSite:"lax".
 *
 * These are functions, not constants, so NODE_ENV is read at call time
 * (safer if dotenv loads after this module).
 */

// Refresh cookie is scoped to the auth routes only, so it is NOT attached to
// every single API request. Change this if your auth router is mounted
// somewhere other than /api/auth.
const REFRESH_COOKIE_PATH = "/api/auth";

const ACCESS_COOKIE_NAME = "accessToken";
const REFRESH_COOKIE_NAME = "refreshToken";
const SETUP_COOKIE_NAME = "setupToken";

const ACCESS_MAX_AGE_MS = 15 * 60 * 1000; // 15 minutes
const REFRESH_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const SETUP_MAX_AGE_MS = 10 * 60 * 1000; // 10 minutes

const isProduction = () => process.env.NODE_ENV === "production";

/**
 * In production the frontend and backend are on different Render domains,
 * which is a cross-site request -> the browser only sends the cookie if it is
 * SameSite=None, and it only accepts SameSite=None if Secure is also set.
 *
 * In local dev localhost:5173 -> localhost:5000 counts as same-site, so "lax"
 * works and we must NOT set secure (there is no https on localhost).
 */
const baseOptions = () => ({
  httpOnly: true,
  secure: isProduction(),
  sameSite: isProduction() ? "none" : "lax",
});

const accessCookieOptions = () => ({
  ...baseOptions(),
  path: "/",
  maxAge: ACCESS_MAX_AGE_MS,
});

const refreshCookieOptions = () => ({
  ...baseOptions(),
  path: REFRESH_COOKIE_PATH,
  maxAge: REFRESH_MAX_AGE_MS,
});

const setupCookieOptions = () => ({
  ...baseOptions(),
  path: "/",
  maxAge: SETUP_MAX_AGE_MS,
});

/**
 * clearCookie() rejects maxAge/expires, but every OTHER attribute must match
 * exactly. Strip the age, keep the rest.
 */
const clearOptions = (options) => {
  const { maxAge, expires, ...rest } = options;
  return rest;
};

module.exports = {
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  SETUP_COOKIE_NAME,
  ACCESS_MAX_AGE_MS,
  REFRESH_MAX_AGE_MS,
  SETUP_MAX_AGE_MS,
  REFRESH_COOKIE_PATH,
  accessCookieOptions,
  refreshCookieOptions,
  setupCookieOptions,
  clearOptions,
};