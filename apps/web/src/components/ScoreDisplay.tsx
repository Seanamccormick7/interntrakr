import type { ScoreResponse } from "../types";

interface ScoreDisplayProps {
  score: ScoreResponse;
  onClose: () => void;
}

export function ScoreDisplay({ score, onClose }: ScoreDisplayProps) {
  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "high":
        return "var(--success)";
      case "medium":
        return "var(--warning)";
      case "low":
        return "var(--error)";
      default:
        return "var(--muted)";
    }
  };

  const getScoreColor = (scoreValue: number) => {
    if (scoreValue >= 70) return "var(--success)";
    if (scoreValue >= 40) return "var(--warning)";
    return "var(--error)";
  };

  return (
    <div className="card" style={{ padding: "20px", marginTop: "12px" }}>
      <div className="row" style={{ marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: 18 }}>Application Score</h3>
        <button onClick={onClose} className="btn btn-ghost">
          Close
        </button>
      </div>
      <div
        className="row metric-row"
        style={{
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 16,
        }}
      >
        <div className="metric">
          <span className="metric-label">Match Score:</span>
          <span
            className="metric-value"
            style={{ color: getScoreColor(score.score) }}
          >
            {score.score}%
          </span>
        </div>
        <div className="metric">
          <span className="metric-label">Urgency:</span>
          <span
            className="badge"
            style={{
              backgroundColor: getUrgencyColor(score.urgencyBand),
              textTransform: "none",
            }}
          >
            {score.urgencyBand}
          </span>
        </div>
      </div>
      {score.missingKeywords.length > 0 && (
        <div className="section" style={{ marginBottom: 16 }}>
          <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
            Missing Keywords
          </h4>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {score.missingKeywords.map((keyword, index) => (
              <span key={index} className="chip">
                {keyword}
              </span>
            ))}
          </div>
        </div>
      )}
      {score.tips.length > 0 && (
        <div className="section">
          <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
            Actionable Tips
          </h4>
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "grid",
              gap: 8,
            }}
          >
            {score.tips.map((tip, index) => (
              <li key={index} className="chip" style={{ lineHeight: 1.5 }}>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
