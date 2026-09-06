import assert from "node:assert/strict";
import test from "node:test";
import { MatchingService, MatchRequestError } from "../src/matching/matching-service.js";
import { InMemoryProfileRepository } from "../src/profiles/profile-repository.js";

const profile = (role: "mentor" | "learner", displayName: string, skills: string[], languages: string[], capacity: number) => ({
  role,
  displayName,
  skills,
  languages,
  availableMinutesPerWeek: capacity,
});

test("ranks mentors by explainable fit and honors result limits", () => {
  let id = 0;
  const profiles = new InMemoryProfileRepository(() => `profile-${++id}`);
  const learner = profiles.create(profile("learner", "Grace Hopper", ["typescript", "sql"], ["english"], 0));
  const best = profiles.create(profile("mentor", "Ada Lovelace", ["typescript", "sql"], ["english"], 90));
  profiles.create(profile("mentor", "Linus Torvalds", ["git"], ["english"], 90));

  const matches = new MatchingService(profiles).findMatches({ learnerId: learner.id, requestedMinutesPerWeek: 60, limit: 1 });

  assert.equal(matches.length, 1);
  assert.equal(matches[0].mentorId, best.id);
  assert.equal(matches[0].score, 150);
  assert.deepEqual(matches[0].reasons, ["2 shared skills", "shared language", "availability fits"]);
});

test("rejects invalid limits and mentor-originated requests", () => {
  const profiles = new InMemoryProfileRepository(() => "profile-1");
  const mentor = profiles.create(profile("mentor", "Ada Lovelace", ["typescript"], ["english"], 60));
  const service = new MatchingService(profiles);

  assert.throws(() => service.findMatches({ learnerId: mentor.id, requestedMinutesPerWeek: 60 }), MatchRequestError);
  assert.throws(() => service.findMatches({ learnerId: mentor.id, requestedMinutesPerWeek: 0 }), MatchRequestError);
});
