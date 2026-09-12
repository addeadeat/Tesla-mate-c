import { test } from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error Node-only project scanner is deliberately plain JavaScript.
import { secretFindings } from "../../../scripts/secret-rules.mjs";

test("secret scanner blocks env/token files and literal values without exposing them", () => {
  assert(secretFindings("deploy/.env", "").length > 0);
  assert(secretFindings("stuff/tokens.json", "{}").length > 0);
  assert(secretFindings("a.pem", "").length > 0);
  const literal = [
    "DATABASE",
    "_PASS",
    "=",
    "test-only-not-a-real-secret",
  ].join("");
  const findings = secretFindings("config.txt", literal);
  assert(findings.length > 0);
  assert(!JSON.stringify(findings).includes("test-only-not-a-real-secret"));
  assert.equal(
    secretFindings(".env.example", ["ENCRYPTION_KEY", "="].join("")).length,
    0,
  );
  assert.equal(
    secretFindings(
      "deploy/docker-compose.yml",
      "  DATABASE_PASS: ${DATABASE_PASS:?Required}",
    ).length,
    0,
  );
});
