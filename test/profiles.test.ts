import assert from "node:assert/strict";
import test from "node:test";
import { ProfileValidationError } from "../src/profiles/profile.js";
import { InMemoryProfileRepository, ProfileNotFoundError } from "../src/profiles/profile-repository.js";

const validMentor = {
  role: "mentor" as const,
  displayName: " Ada Lovelace ",
  skills: [" TypeScript ", "typescript", "Mentoring"],
  languages: ["English"],
  availableMinutesPerWeek: 120,
};

test("creates normalized mentor profiles with stable metadata", () => {
  const repository = new InMemoryProfileRepository(() => "profile-1", () => new Date("2026-01-02T03:04:05Z"));
  const profile = repository.create(validMentor);

  assert.equal(profile.id, "profile-1");
  assert.equal(profile.displayName, "Ada Lovelace");
  assert.deepEqual(profile.skills, ["typescript", "mentoring"]);
  assert.equal(profile.createdAt, "2026-01-02T03:04:05.000Z");
});

test("filters profiles by role and returns defensive copies", () => {
  let nextId = 0;
  const repository = new InMemoryProfileRepository(() => `profile-${++nextId}`);
  const mentor = repository.create(validMentor);
  repository.create({ ...validMentor, role: "learner", availableMinutesPerWeek: 0 });

  const mentors = repository.list("mentor");
  assert.equal(mentors.length, 1);
  mentors[0].skills.push("mutated");
  assert.deepEqual(repository.get(mentor.id).skills, ["typescript", "mentoring"]);
});

test("rejects unusable profiles and reports missing ids", () => {
  const repository = new InMemoryProfileRepository();
  assert.throws(() => repository.create({ ...validMentor, skills: [] }), ProfileValidationError);
  assert.throws(() => repository.create({ ...validMentor, availableMinutesPerWeek: 0 }), ProfileValidationError);
  assert.throws(() => repository.get("missing"), ProfileNotFoundError);
});
