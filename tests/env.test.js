import { describe, it, expect } from "vitest";
import { findStrayVars, RETIRED_VARS } from "../backend/src/config/env.js";

// Every key the schema actually reads, mirrored from a real boot.
const SCHEMA_KEYS = [
  "NODE_ENV",
  "PORT",
  "MONGO_URI",
  "JWT_ACCESS_SECRET",
  "ACCESS_TOKEN_TTL",
  "COOKIE_SECURE",
  "COOKIE_SAMESITE",
  "TRUST_PROXY_HOPS",
  "CORS_ORIGIN",
  "FRONTEND_URL",
  "HF_API_KEY",
  "NVIDIA_API_KEY",
  "RESEND_API_KEY",
  "EMAIL_FROM",
  "SENTRY_DSN",
  "GOOGLE_CLIENT_ID",
];

describe("stray environment variables", () => {
  it("flags a near-miss typo of a real key", () => {
    // Plural instead of singular — sets nothing, changes nothing, and without
    // this warning the only symptom is CORS mysteriously not applying.
    expect(findStrayVars({ CORS_ORIGINS: "https://x" }, SCHEMA_KEYS)).toEqual(["CORS_ORIGINS"]);
  });

  it("ignores keys the schema does read", () => {
    const env = Object.fromEntries(SCHEMA_KEYS.map((k) => [k, "x"]));
    expect(findStrayVars(env, SCHEMA_KEYS)).toEqual([]);
  });

  it("ignores platform-injected vars that merely share a prefix", () => {
    // NODE_VERSION is set by Render and shares NODE_ with NODE_ENV; reporting
    // it would train the reader to ignore the warning entirely.
    expect(findStrayVars({ NODE_VERSION: "22", NODE_OPTIONS: "--x" }, SCHEMA_KEYS)).toEqual([]);
  });

  it("ignores unrelated system vars", () => {
    expect(
      findStrayVars({ PATH: "/usr/bin", HOME: "/root", SHELL: "/bin/zsh" }, SCHEMA_KEYS)
    ).toEqual([]);
  });

  it("reports retired vars separately, not as strays", () => {
    // These get a specific message naming their replacement, so they must not
    // also surface in the generic typo list.
    const retired = Object.fromEntries(Object.keys(RETIRED_VARS).map((k) => [k, "x"]));
    expect(findStrayVars(retired, SCHEMA_KEYS)).toEqual([]);
  });

  it("names a replacement for every retired var", () => {
    for (const [name, guidance] of Object.entries(RETIRED_VARS)) {
      expect(guidance, `${name} must say what to use instead`).toMatch(/[A-Z_]{4,}/);
    }
  });
});
