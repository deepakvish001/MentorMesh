export type MentorProfile = {
  id: string;
  skills: string[];
  languages: string[];
  availableMinutesPerWeek: number;
};

export type LearnerRequest = {
  skills: string[];
  languages: string[];
  requestedMinutesPerWeek: number;
};

export type MatchScore = {
  mentorId: string;
  score: number;
  reasons: string[];
};

const normalize = (values: string[]) => new Set(values.map((value) => value.trim().toLowerCase()));

export function scoreMentor(mentor: MentorProfile, learner: LearnerRequest): MatchScore {
  const mentorSkills = normalize(mentor.skills);
  const skillMatches = learner.skills.filter((skill) => mentorSkills.has(skill.trim().toLowerCase())).length;
  const mentorLanguages = normalize(mentor.languages);
  const languageMatch = learner.languages.some((language) => mentorLanguages.has(language.trim().toLowerCase()));
  const capacityMatch = mentor.availableMinutesPerWeek >= learner.requestedMinutesPerWeek;
  const reasons: string[] = [];
  if (skillMatches) reasons.push(`${skillMatches} shared skill${skillMatches === 1 ? "" : "s"}`);
  if (languageMatch) reasons.push("shared language");
  if (capacityMatch) reasons.push("availability fits");
  return { mentorId: mentor.id, score: skillMatches * 50 + Number(languageMatch) * 30 + Number(capacityMatch) * 20, reasons };
}
