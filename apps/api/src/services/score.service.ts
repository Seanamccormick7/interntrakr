interface ScoreRequest {
  resumeKeywords: string[];
  jobDescription: string;
  company: string;
  role: string;
}

interface ScoreResponse {
  score: number;
  missingKeywords: string[];
  urgencyBand: "low" | "medium" | "high";
  tips: string[];
}

// Spring Boot scoring service config
const SCORE_SERVICE_URL =
  process.env.SCORE_SERVICE_URL || "http://localhost:8080";

export class ScoreService {
  // Timeout for Spring Boot service calls (10 seconds)
  private readonly TIMEOUT_MS = 10000;

  async calculateScore(request: ScoreRequest): Promise<ScoreResponse> {
    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS);

      try {
        // Call Spring Boot /score endpoint with timeout
        const response = await fetch(`${SCORE_SERVICE_URL}/score`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: request.jobDescription,
            keywords: request.resumeKeywords,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Score service returned ${response.status}`);
        }

        const data = await response.json();

        // Transform Spring Boot response to our format
        // The current Spring service only returns {score: number}
        // so we enhance it with additional logic here
        const score = Math.round(data.score * 100);

        // Calculate missing keywords
        const jobKeywords = this.extractKeywords(request.jobDescription);
        const resumeKeywordSet = new Set(
          request.resumeKeywords.map((k) => k.toLowerCase()),
        );
        const missingKeywords = jobKeywords.filter(
          (k) => !resumeKeywordSet.has(k.toLowerCase()),
        );

        // Determine urgency band based on score
        const urgencyBand = this.determineUrgency(score);

        // Generate tips
        const tips = this.generateTips(
          score,
          missingKeywords,
          request.company,
          request.role,
        );

        return {
          score,
          missingKeywords: missingKeywords.slice(0, 10), // Top 10
          urgencyBand,
          tips,
        };
      } finally {
        // Always clear the timeout
        clearTimeout(timeoutId);
      }
    } catch (error) {
      console.error("Error calling score service:", error);

      // Handle timeout specifically
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(
          "Score service timeout - request took longer than 10 seconds",
        );
      }

      // Handle other fetch errors
      if (error instanceof TypeError) {
        throw new Error(
          "Failed to connect to scoring service - is it running?",
        );
      }

      throw new Error("Failed to calculate score from scoring service");
    }
  }

  // Extract keywords from job description
  private extractKeywords(text: string): string[] {
    const normalized = text.toLowerCase();
    const tokens = normalized.split(/[^a-z0-9]+/);

    // Common tech keywords to look for
    const techKeywords = new Set([
      "javascript",
      "typescript",
      "python",
      "java",
      "react",
      "node",
      "nodejs",
      "express",
      "spring",
      "boot",
      "aws",
      "docker",
      "kubernetes",
      "mongodb",
      "postgres",
      "redis",
      "sql",
      "git",
      "api",
      "rest",
      "graphql",
      "html",
      "css",
      "tailwind",
      "vue",
      "angular",
      "django",
      "flask",
      "fastapi",
      "golang",
      "rust",
      "c++",
      "cpp",
      "ruby",
      "rails",
    ]);

    return tokens.filter(
      (token) => techKeywords.has(token) && token.length > 2,
    );
  }

  // Determine urgency based on score
  private determineUrgency(score: number): "low" | "medium" | "high" {
    if (score >= 70) return "high";
    if (score >= 40) return "medium";
    return "low";
  }

  // Generate actionable tips
  private generateTips(
    score: number,
    missingKeywords: string[],
    company: string,
    role: string,
  ): string[] {
    const tips: string[] = [];

    if (score < 50) {
      tips.push(
        `Your resume matches only ${score}% of the requirements. Consider adding more relevant keywords.`,
      );
    }

    if (missingKeywords.length > 0) {
      const topMissing = missingKeywords.slice(0, 3).join(", ");
      tips.push(`Add experience with these technologies: ${topMissing}`);
    }

    if (score >= 70) {
      tips.push(
        `Strong match! Highlight your relevant experience in your cover letter.`,
      );
      tips.push(
        `Mention specific projects that used ${missingKeywords.slice(0, 2).join(" and ")}`,
      );
    } else if (score >= 40) {
      tips.push(
        `Consider taking online courses or building projects with the missing technologies.`,
      );
      tips.push(
        `Update your resume summary to emphasize skills matching "${role}"`,
      );
    } else {
      tips.push(
        `This role may require significant upskilling in: ${missingKeywords.slice(0, 3).join(", ")}`,
      );
      tips.push(
        `Research ${company}'s tech stack and tailor your application accordingly.`,
      );
    }

    return tips.slice(0, 5); // Max 5 tips
  }
}

// Export singleton instance
export const scoreService = new ScoreService();
