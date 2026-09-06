import { randomUUID } from "node:crypto";
import { InMemoryProfileRepository } from "../profiles/profile-repository.js";

export type SessionStatus = "scheduled" | "completed" | "cancelled";

export type MentoringSession = {
  id: string;
  mentorId: string;
  learnerId: string;
  startsAt: string;
  endsAt: string;
  status: SessionStatus;
  createdAt: string;
};

export type ScheduleSession = Omit<MentoringSession, "id" | "status" | "createdAt">;

export class SessionRuleError extends Error {}
export class SessionNotFoundError extends Error {}

export class SessionService {
  private readonly sessions = new Map<string, MentoringSession>();

  constructor(
    private readonly profiles: InMemoryProfileRepository,
    private readonly idFactory: () => string = randomUUID,
    private readonly clock: () => Date = () => new Date(),
    initialSessions: MentoringSession[] = [],
    private readonly onChange: () => void = () => undefined,
  ) {
    for (const session of initialSessions) this.sessions.set(session.id, structuredClone(session));
  }

  schedule(input: ScheduleSession): MentoringSession {
    const mentor = this.profiles.get(input.mentorId);
    const learner = this.profiles.get(input.learnerId);
    if (mentor.role !== "mentor" || learner.role !== "learner") {
      throw new SessionRuleError("sessions require one mentor and one learner");
    }
    const startsAt = new Date(input.startsAt);
    const endsAt = new Date(input.endsAt);
    if (!Number.isFinite(startsAt.valueOf()) || !Number.isFinite(endsAt.valueOf())) {
      throw new SessionRuleError("session timestamps must be valid ISO dates");
    }
    const durationMinutes = (endsAt.valueOf() - startsAt.valueOf()) / 60_000;
    if (durationMinutes < 15 || durationMinutes > 240) {
      throw new SessionRuleError("sessions must last between 15 and 240 minutes");
    }
    if (startsAt.valueOf() <= this.clock().valueOf()) {
      throw new SessionRuleError("sessions must start in the future");
    }
    const conflicts = [...this.sessions.values()].some((session) =>
      session.status === "scheduled"
      && (session.mentorId === mentor.id || session.learnerId === learner.id)
      && startsAt < new Date(session.endsAt)
      && endsAt > new Date(session.startsAt));
    if (conflicts) throw new SessionRuleError("mentor or learner already has a session in this time range");

    const session: MentoringSession = {
      id: this.idFactory(),
      mentorId: mentor.id,
      learnerId: learner.id,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      status: "scheduled",
      createdAt: this.clock().toISOString(),
    };
    this.sessions.set(session.id, session);
    this.onChange();
    return structuredClone(session);
  }

  list(profileId?: string): MentoringSession[] {
    return [...this.sessions.values()]
      .filter((session) => !profileId || session.mentorId === profileId || session.learnerId === profileId)
      .sort((left, right) => left.startsAt.localeCompare(right.startsAt))
      .map((session) => structuredClone(session));
  }

  snapshot(): MentoringSession[] {
    return this.list();
  }

  cancel(id: string): MentoringSession {
    return this.transition(id, "cancelled");
  }

  complete(id: string): MentoringSession {
    const session = this.get(id);
    if (new Date(session.endsAt) > this.clock()) throw new SessionRuleError("a session cannot be completed before it ends");
    return this.transition(id, "completed");
  }

  private get(id: string): MentoringSession {
    const session = this.sessions.get(id);
    if (!session) throw new SessionNotFoundError(`session ${id} was not found`);
    return session;
  }

  private transition(id: string, status: Exclude<SessionStatus, "scheduled">): MentoringSession {
    const current = this.get(id);
    if (current.status !== "scheduled") throw new SessionRuleError(`cannot change a ${current.status} session`);
    const session = { ...current, status };
    this.sessions.set(id, session);
    this.onChange();
    return structuredClone(session);
  }
}
