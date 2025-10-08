import { Request, Response } from "express";
import { scoreService } from "../services/score.service";

// POST /recommendations/score
export async function getScore(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const { resumeKeywords, jobDescription, company, role } = req.body;

    // Validate required fields
    if (!resumeKeywords || !jobDescription || !company || !role) {
      res.status(400).json({
        error: "Missing required fields",
        details:
          "resumeKeywords, jobDescription, company, and role are required",
      });
      return;
    }

    // Call Spring Boot scoring service
    const scoreData = await scoreService.calculateScore({
      resumeKeywords,
      jobDescription,
      company,
      role,
    });

    res.status(200).json(scoreData);
  } catch (error) {
    console.error("Score calculation error:", error);
    res.status(500).json({
      error: "Failed to calculate score",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
