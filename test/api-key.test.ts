import assert from "node:assert/strict";
import test from "node:test";
import { parseApiKeys } from "../src/security/api-key.guard.js";

test("parses member and coordinator credentials", () => {
  const principals = parseApiKeys("0123456789abcdef:member,fedcba9876543210:coordinator");
  assert.equal(principals.get("0123456789abcdef")?.role, "member");
  assert.equal(principals.get("fedcba9876543210")?.role, "coordinator");
});

test("fails closed for missing, weak, duplicate, and unsupported credentials", () => {
  assert.throws(() => parseApiKeys(undefined), /API_KEYS is required/);
  assert.throws(() => parseApiKeys("short:member"), /at least 16/);
  assert.throws(() => parseApiKeys("0123456789abcdef:admin"), /unsupported API role/);
  assert.throws(() => parseApiKeys("0123456789abcdef:member,0123456789abcdef:coordinator"), /duplicate API key/);
});
