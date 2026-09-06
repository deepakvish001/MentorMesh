export type ProfileRole = "mentor" | "learner";

export type Profile = {
  id: string;
  role: ProfileRole;
  displayName: string;
  skills: string[];
  languages: string[];
  availableMinutesPerWeek: number;
  createdAt: string;
  updatedAt: string;
};

export type ProfileInput = Omit<Profile, "id" | "createdAt" | "updatedAt">;

export class ProfileValidationError extends Error {}

const normalizedList = (values: string[], field: string): string[] => {
  const normalized = [...new Set(values.map((value) => value.trim().toLowerCase()).filter(Boolean))];
  if (normalized.length === 0) throw new ProfileValidationError(`${field} must contain at least one value`);
  return normalized;
};

export function validateProfile(input: ProfileInput): ProfileInput {
  const displayName = input.displayName.trim();
  if (displayName.length < 2 || displayName.length > 80) {
    throw new ProfileValidationError("displayName must contain 2 to 80 characters");
  }
  if (!Number.isInteger(input.availableMinutesPerWeek) || input.availableMinutesPerWeek < 0 || input.availableMinutesPerWeek > 2_400) {
    throw new ProfileValidationError("availableMinutesPerWeek must be an integer between 0 and 2400");
  }
  if (input.role === "mentor" && input.availableMinutesPerWeek === 0) {
    throw new ProfileValidationError("mentor availability must be greater than zero");
  }
  return {
    ...input,
    displayName,
    skills: normalizedList(input.skills, "skills"),
    languages: normalizedList(input.languages, "languages"),
  };
}
