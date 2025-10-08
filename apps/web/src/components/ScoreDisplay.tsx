import type { ScoreResponse } from "../types";

interface ScoreDisplayProps {
  score: ScoreResponse;
  onClose: () => void;
}

export function ScoreDisplay({ score, onClose }: ScoreDisplayProps) {
  // Determine color based on urgency
  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "high":
        return "#10b981"; // green
      case "medium":
        return "#f59e0b"; // orange
      case "low":
        return "#ef4444"; // red
      default:
        return "#888";
    }
  };

  // Determine score color
  const getScoreColor = (scoreValue: number) => {
    if (scoreValue >= 70) return "#10b981";
    if (scoreValue >= 40) return "#f59e0b";
    return "#ef4444";
  };

  return (
    <div
      style={{
        border: "1px solid #333",
        borderRadius: 12,
        padding: "1.5rem",
        marginTop: "1rem",
        backgroundColor: "#1a1a1a",
      }}
    >
      {/* Header with Close Button */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
        <h3 style={{ margin: 0, fontSize: "1.25rem" }}>Application Score</h3>
        <button
          onClick={onClose}
          style={{
            padding: "0.25rem 0.5rem",
            borderRadius: 6,
            border: "1px solid #333",
            backgroundColor: "transparent",
            cursor: "pointer",
            fontSize: "0.875rem",
          }}
        >
          Close
        </button>
      </div>

      {/* Score Display */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          marginBottom: "1.5rem",
          padding: "1rem",
          borderRadius: 8,
          backgroundColor: "#242424",
        }}
      >
        <div
          style={{
            fontSize: "3rem",
            fontWeight: 700,
            color: getScoreColor(score.score),
          }}
        >
          {score.score}%
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>
            Match Score
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "0.875rem", opacity: 0.8 }}>Urgency:</span>
            <span
              style={{
                display: "inline-block",
                padding: "0.25rem 0.75rem",
                borderRadius: 6,
                fontSize: "0.875rem",
                fontWeight: 600,
                backgroundColor: getUrgencyColor(score.urgencyBand),
                color: "white",
                textTransform: "uppercase",
              }}
            >
              {score.urgencyBand}
            </span>
          </div>
        </div>
      </div>

      {/* Missing Keywords */}
      {score.missingKeywords.length > 0 && (
        <div style={{ marginBottom: "1.5rem" }}>
          <h4
            style={{
              margin: 0,
              marginBottom: "0.75rem",
              fontSize: "1rem",
              fontWeight: 600,
            }}
          >
            Missing Keywords
          </h4>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {score.missingKeywords.map((keyword, index) => (
              <span
                key={index}
                style={{
                  display: "inline-block",
                  padding: "0.375rem 0.75rem",
                  borderRadius: 6,
                  fontSize: "0.875rem",
                  backgroundColor: "#333",
                  border: "1px solid #444",
                }}
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tips */}
      {score.tips.length > 0 && (
        <div>
          <h4
            style={{
              margin: 0,
              marginBottom: "0.75rem",
              fontSize: "1rem",
              fontWeight: 600,
            }}
          >
            💡 Actionable Tips
          </h4>
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "grid",
              gap: "0.5rem",
            }}
          >
            {score.tips.map((tip, index) => (
              <li
                key={index}
                style={{
                  padding: "0.75rem",
                  borderRadius: 6,
                  backgroundColor: "#242424",
                  border: "1px solid #333",
                  fontSize: "0.875rem",
                  lineHeight: 1.5,
                }}
              >
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
