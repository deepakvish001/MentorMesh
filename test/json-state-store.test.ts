import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { JsonStateStore } from "../src/persistence/json-state-store.js";

test("returns empty state for a new data file and round-trips snapshots", () => {
  const directory = mkdtempSync(join(tmpdir(), "mentormesh-state-"));
  const path = join(directory, "nested", "state.json");
  const store = new JsonStateStore(path);
  assert.deepEqual(store.load(), { profiles: [], sessions: [], goals: [] });

  const state = { profiles: [], sessions: [], goals: [] };
  store.save(state);
  assert.deepEqual(store.load(), state);
  assert.ok(readFileSync(path, "utf8").endsWith("\n"));
});

test("fails fast instead of silently discarding corrupt state", () => {
  const directory = mkdtempSync(join(tmpdir(), "mentormesh-state-"));
  const path = join(directory, "state.json");
  writeFileSync(path, "not-json");
  assert.throws(() => new JsonStateStore(path).load(), /unable to load application state/);
});
