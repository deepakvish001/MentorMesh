import assert from "node:assert/strict";
import test from "node:test";
import { MatchesController, ProfilesController } from "../src/app.js";
import { MatchingService } from "../src/matching/matching-service.js";
import { InMemoryProfileRepository } from "../src/profiles/profile-repository.js";

test("profile and matching controllers expose an end-to-end application path", () => {
  let id = 0;
  const profiles = new InMemoryProfileRepository(() => `profile-${++id}`);
  const profileApi = new ProfilesController(profiles);
  const matchApi = new MatchesController(new MatchingService(profiles));
  profileApi.create({ role: "mentor", displayName: "Ada Lovelace", skills: ["typescript"], languages: ["english"], availableMinutesPerWeek: 60 });
  const learner = profileApi.create({ role: "learner", displayName: "Grace Hopper", skills: ["typescript"], languages: ["english"], availableMinutesPerWeek: 0 });

  const matches = matchApi.find({ learnerId: learner.id, requestedMinutesPerWeek: 60 });
  assert.equal(matches.length, 1);
  assert.equal(matches[0].score, 100);
});
