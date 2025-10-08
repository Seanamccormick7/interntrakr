export type AppItem = {
  id: string;
  company: string;
  role: string;
  link?: string;
  deadline?: string;
  status?: "SAVED" | "APPLIED" | "OA" | "INTERVIEW" | "REJECTED" | "OFFER";
};

// Score response from backend
export type ScoreResponse = {
  score: number;
  missingKeywords: string[];
  urgencyBand: "low" | "medium" | "high";
  tips: string[];
};

// Request payload for scoring
export type ScoreRequest = {
  resumeKeywords: string[];
  jobDescription: string;
  company: string;
  role: string;
};
