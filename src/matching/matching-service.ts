import { scoreMentor, MatchScore } from "./scoring.js";
import { InMemoryProfileRepository } from "../profiles/profile-repository.js";

export type MatchRequest = {
  learnerId: string;
  requestedMinutesPerWeek: number;
  limit?: number;
};

export class MatchRequestError extends Error {}

export class MatchingService {
  constructor(private readonly profiles: InMemoryProfileRepository) {}

  findMatches(request: MatchRequest): MatchScore[] {
    if (!Number.isInteger(request.requestedMinutesPerWeek) || request.requestedMinutesPerWeek <= 0) {
      throw new MatchRequestError("requestedMinutesPerWeek must be a positive integer");
    }
    const limit = request.limit ?? 5;
    if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
      throw new MatchRequestError("limit must be an integer between 1 and 50");
    }
    const learner = this.profiles.get(request.learnerId);
    if (learner.role !== "learner") throw new MatchRequestError("matches can only be requested for learners");

    return this.profiles
      .list("mentor")
      .map((mentor) => scoreMentor(mentor, {
        skills: learner.skills,
        languages: learner.languages,
        requestedMinutesPerWeek: request.requestedMinutesPerWeek,
      }))
      .filter((match) => match.score > 0)
      .sort((left, right) => right.score - left.score || left.mentorId.localeCompare(right.mentorId))
      .slice(0, limit);
  }
}
