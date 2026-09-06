import { randomUUID } from "node:crypto";
import { Profile, ProfileInput, validateProfile } from "./profile.js";

export class ProfileNotFoundError extends Error {}

export class InMemoryProfileRepository {
  private readonly profiles = new Map<string, Profile>();

  constructor(
    private readonly idFactory: () => string = randomUUID,
    private readonly clock: () => Date = () => new Date(),
  ) {}

  create(input: ProfileInput): Profile {
    const value = validateProfile(input);
    const now = this.clock().toISOString();
    const profile: Profile = { ...value, id: this.idFactory(), createdAt: now, updatedAt: now };
    this.profiles.set(profile.id, profile);
    return structuredClone(profile);
  }

  get(id: string): Profile {
    const profile = this.profiles.get(id);
    if (!profile) throw new ProfileNotFoundError(`profile ${id} was not found`);
    return structuredClone(profile);
  }

  list(role?: Profile["role"]): Profile[] {
    return [...this.profiles.values()]
      .filter((profile) => !role || profile.role === role)
      .map((profile) => structuredClone(profile));
  }

  update(id: string, input: ProfileInput): Profile {
    const current = this.get(id);
    const value = validateProfile(input);
    const profile: Profile = { ...current, ...value, updatedAt: this.clock().toISOString() };
    this.profiles.set(id, profile);
    return structuredClone(profile);
  }
}
