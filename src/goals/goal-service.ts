import { randomUUID } from "node:crypto";
import { InMemoryProfileRepository } from "../profiles/profile-repository.js";

export type Milestone = { id: string; title: string; completedAt: string | null };
export type LearningGoal = {
  id: string;
  learnerId: string;
  title: string;
  status: "active" | "completed";
  milestones: Milestone[];
  createdAt: string;
  completedAt: string | null;
};

export class GoalRuleError extends Error {}
export class GoalNotFoundError extends Error {}

export class GoalService {
  private readonly goals = new Map<string, LearningGoal>();

  constructor(
    private readonly profiles: InMemoryProfileRepository,
    private readonly idFactory: () => string = randomUUID,
    private readonly clock: () => Date = () => new Date(),
    initialGoals: LearningGoal[] = [],
    private readonly onChange: () => void = () => undefined,
  ) {
    for (const goal of initialGoals) this.goals.set(goal.id, structuredClone(goal));
  }

  create(learnerId: string, title: string): LearningGoal {
    const learner = this.profiles.get(learnerId);
    if (learner.role !== "learner") throw new GoalRuleError("goals can only belong to learners");
    const normalizedTitle = this.validTitle(title);
    const goal: LearningGoal = {
      id: this.idFactory(), learnerId, title: normalizedTitle, status: "active", milestones: [],
      createdAt: this.clock().toISOString(), completedAt: null,
    };
    this.goals.set(goal.id, goal);
    this.onChange();
    return structuredClone(goal);
  }

  addMilestone(goalId: string, title: string): LearningGoal {
    const goal = this.getMutable(goalId);
    if (goal.status !== "active") throw new GoalRuleError("completed goals cannot be changed");
    if (goal.milestones.length >= 50) throw new GoalRuleError("a goal cannot contain more than 50 milestones");
    goal.milestones.push({ id: this.idFactory(), title: this.validTitle(title), completedAt: null });
    this.onChange();
    return structuredClone(goal);
  }

  completeMilestone(goalId: string, milestoneId: string): LearningGoal {
    const goal = this.getMutable(goalId);
    if (goal.status !== "active") throw new GoalRuleError("completed goals cannot be changed");
    const milestone = goal.milestones.find((item) => item.id === milestoneId);
    if (!milestone) throw new GoalNotFoundError(`milestone ${milestoneId} was not found`);
    milestone.completedAt ??= this.clock().toISOString();
    this.onChange();
    return structuredClone(goal);
  }

  complete(goalId: string): LearningGoal {
    const goal = this.getMutable(goalId);
    if (goal.milestones.length === 0 || goal.milestones.some((item) => item.completedAt === null)) {
      throw new GoalRuleError("all milestones must be completed before the goal");
    }
    goal.status = "completed";
    goal.completedAt = this.clock().toISOString();
    this.onChange();
    return structuredClone(goal);
  }

  list(learnerId: string): LearningGoal[] {
    return [...this.goals.values()].filter((goal) => goal.learnerId === learnerId).map((goal) => structuredClone(goal));
  }

  snapshot(): LearningGoal[] {
    return [...this.goals.values()].map((goal) => structuredClone(goal));
  }

  private getMutable(id: string): LearningGoal {
    const goal = this.goals.get(id);
    if (!goal) throw new GoalNotFoundError(`goal ${id} was not found`);
    return goal;
  }

  private validTitle(title: string): string {
    const value = title.trim();
    if (value.length < 3 || value.length > 160) throw new GoalRuleError("titles must contain 3 to 160 characters");
    return value;
  }
}
