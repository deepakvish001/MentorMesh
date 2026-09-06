import assert from "node:assert/strict";
import test from "node:test";
import { InMemoryProfileRepository } from "../src/profiles/profile-repository.js";
import { SessionRuleError, SessionService } from "../src/sessions/session-service.js";

const clock = () => new Date("2026-02-01T09:00:00Z");

function setup() {
  let profileId = 0;
  const profiles = new InMemoryProfileRepository(() => `profile-${++profileId}`, clock);
  const mentor = profiles.create({ role: "mentor", displayName: "Ada Lovelace", skills: ["typescript"], languages: ["english"], availableMinutesPerWeek: 120 });
  const learner = profiles.create({ role: "learner", displayName: "Grace Hopper", skills: ["typescript"], languages: ["english"], availableMinutesPerWeek: 0 });
  return { profiles, mentor, learner };
}

test("schedules normalized sessions and lists them by participant", () => {
  const { profiles, mentor, learner } = setup();
  const service = new SessionService(profiles, () => "session-1", clock);
  const session = service.schedule({ mentorId: mentor.id, learnerId: learner.id, startsAt: "2026-02-02T10:00:00Z", endsAt: "2026-02-02T11:00:00Z" });

  assert.equal(session.status, "scheduled");
  assert.equal(session.startsAt, "2026-02-02T10:00:00.000Z");
  assert.deepEqual(service.list(mentor.id), [session]);
});

test("blocks overlapping sessions for either participant", () => {
  const { profiles, mentor, learner } = setup();
  let sessionId = 0;
  const service = new SessionService(profiles, () => `session-${++sessionId}`, clock);
  service.schedule({ mentorId: mentor.id, learnerId: learner.id, startsAt: "2026-02-02T10:00:00Z", endsAt: "2026-02-02T11:00:00Z" });

  assert.throws(() => service.schedule({ mentorId: mentor.id, learnerId: learner.id, startsAt: "2026-02-02T10:30:00Z", endsAt: "2026-02-02T11:30:00Z" }), SessionRuleError);
});

test("cancellation releases the time range", () => {
  const { profiles, mentor, learner } = setup();
  let sessionId = 0;
  const service = new SessionService(profiles, () => `session-${++sessionId}`, clock);
  const first = service.schedule({ mentorId: mentor.id, learnerId: learner.id, startsAt: "2026-02-02T10:00:00Z", endsAt: "2026-02-02T11:00:00Z" });
  assert.equal(service.cancel(first.id).status, "cancelled");

  const replacement = service.schedule({ mentorId: mentor.id, learnerId: learner.id, startsAt: "2026-02-02T10:00:00Z", endsAt: "2026-02-02T11:00:00Z" });
  assert.equal(replacement.status, "scheduled");
});

test("rejects short, past, and early-completed sessions", () => {
  const { profiles, mentor, learner } = setup();
  const service = new SessionService(profiles, () => "session-1", clock);
  assert.throws(() => service.schedule({ mentorId: mentor.id, learnerId: learner.id, startsAt: "2026-02-02T10:00:00Z", endsAt: "2026-02-02T10:05:00Z" }), SessionRuleError);
  assert.throws(() => service.schedule({ mentorId: mentor.id, learnerId: learner.id, startsAt: "2026-01-01T10:00:00Z", endsAt: "2026-01-01T11:00:00Z" }), SessionRuleError);
  const session = service.schedule({ mentorId: mentor.id, learnerId: learner.id, startsAt: "2026-02-02T10:00:00Z", endsAt: "2026-02-02T11:00:00Z" });
  assert.throws(() => service.complete(session.id), SessionRuleError);
});
