import assert from "node:assert/strict";
import test from "node:test";
import { GoalRuleError, GoalService } from "../src/goals/goal-service.js";
import { InMemoryProfileRepository } from "../src/profiles/profile-repository.js";

function setup() {
  let id = 0;
  const clock = () => new Date("2026-03-01T12:00:00Z");
  const profiles = new InMemoryProfileRepository(() => `profile-${++id}`, clock);
  const learner = profiles.create({ role: "learner", displayName: "Grace Hopper", skills: ["typescript"], languages: ["english"], availableMinutesPerWeek: 0 });
  const mentor = profiles.create({ role: "mentor", displayName: "Ada Lovelace", skills: ["typescript"], languages: ["english"], availableMinutesPerWeek: 60 });
  return { profiles, learner, mentor, clock };
}

test("tracks milestones before completing a learning goal", () => {
  const { profiles, learner, clock } = setup();
  let id = 0;
  const service = new GoalService(profiles, () => `goal-part-${++id}`, clock);
  const goal = service.create(learner.id, "Build a production API");
  const withMilestone = service.addMilestone(goal.id, "Ship authentication");
  const progressed = service.completeMilestone(goal.id, withMilestone.milestones[0].id);
  const completed = service.complete(goal.id);

  assert.ok(progressed.milestones[0].completedAt);
  assert.equal(completed.status, "completed");
  assert.equal(service.list(learner.id).length, 1);
});

test("requires learner ownership and complete milestones", () => {
  const { profiles, learner, mentor, clock } = setup();
  const service = new GoalService(profiles, () => "fixed-id", clock);
  assert.throws(() => service.create(mentor.id, "Invalid owner"), GoalRuleError);
  const goal = service.create(learner.id, "Learn TypeScript");
  assert.throws(() => service.complete(goal.id), GoalRuleError);
  service.addMilestone(goal.id, "Finish the handbook");
  assert.throws(() => service.complete(goal.id), GoalRuleError);
});
