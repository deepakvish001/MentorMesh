import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { LearningGoal } from "../goals/goal-service.js";
import { Profile } from "../profiles/profile.js";
import { MentoringSession } from "../sessions/session-service.js";

export type ApplicationState = {
  profiles: Profile[];
  sessions: MentoringSession[];
  goals: LearningGoal[];
};

const emptyState = (): ApplicationState => ({ profiles: [], sessions: [], goals: [] });

export class JsonStateStore {
  constructor(private readonly path: string) {}

  load(): ApplicationState {
    try {
      const value: unknown = JSON.parse(readFileSync(this.path, "utf8"));
      if (!value || typeof value !== "object") throw new Error("state root must be an object");
      const state = value as Partial<ApplicationState>;
      if (!Array.isArray(state.profiles) || !Array.isArray(state.sessions) || !Array.isArray(state.goals)) {
        throw new Error("state collections must be arrays");
      }
      return structuredClone(state as ApplicationState);
    } catch (error) {
      if (error instanceof Error && "code" in error && error.code === "ENOENT") return emptyState();
      throw new Error(`unable to load application state from ${this.path}`, { cause: error });
    }
  }

  save(state: ApplicationState): void {
    mkdirSync(dirname(this.path), { recursive: true });
    const temporaryPath = `${this.path}.tmp`;
    writeFileSync(temporaryPath, `${JSON.stringify(state, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
    renameSync(temporaryPath, this.path);
  }
}
