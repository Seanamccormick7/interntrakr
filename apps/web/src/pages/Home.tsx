import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function Home() {
  const { isAuthenticated } = useAuth();
  return (
    <section className="section" style={{ gap: 24 }}>
      <div className="card" style={{ padding: 24 }}>
        <div className="hero-grid">
          <div className="section" style={{ gap: 16 }}>
            <h1 className="hero-title" style={{ margin: 0 }}>
              Tack all of your internship applications in one place.
            </h1>
            <p
              className="hero-desc"
              style={{ margin: 0, opacity: 0.9, maxWidth: 720 }}
            >
              InternTrakr helps you save and organize applications, track
              deadlines, and get real-time match insights so you can follow up
              at the right time, every time. Created by interns, for interns.
            </p>
            <div
              className="row"
              style={{ gap: 8, justifyContent: "flex-start" }}
            >
              {isAuthenticated ? (
                <Link to="/applications" className="btn btn-primary btn-cta">
                  Go to Applications
                </Link>
              ) : (
                <Link to="/signup" className="btn btn-primary btn-cta">
                  Get Started
                </Link>
              )}
            </div>
          </div>
          <div className="preview-box">
            <img
              src="/InternTrakrHeroImage.png"
              alt="InternTrakr preview"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: "inherit",
              }}
            />
          </div>
        </div>
      </div>

      <div className="grid-responsive">
        <div className="card" style={{ padding: 20 }}>
          <div className="section">
            <div
              className="row"
              style={{ gap: 12, justifyContent: "flex-start" }}
            >
              <h3 style={{ margin: 0, fontSize: 18 }}>
                Organize your pipeline
              </h3>
            </div>
            <p style={{ margin: 0, opacity: 0.9 }}>
              Save roles, update statuses, and keep notes so nothing slips.
            </p>
          </div>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <div className="section">
            <div
              className="row"
              style={{ gap: 12, justifyContent: "flex-start" }}
            >
              <h3 style={{ margin: 0, fontSize: 18 }}>Never miss a deadline</h3>
            </div>
            <p style={{ margin: 0, opacity: 0.9 }}>
              See upcoming deadlines at a glance and act in time.
            </p>
          </div>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <div className="section">
            <div
              className="row"
              style={{ gap: 12, justifyContent: "flex-start" }}
            >
              <h3 style={{ margin: 0, fontSize: 18 }}>Improve your match</h3>
            </div>
            <p style={{ margin: 0, opacity: 0.9 }}>
              Get a quick score and tips to tailor your resume and application.
            </p>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 20 }}>
        <div
          className="grid"
          style={{
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          }}
        >
          <div className="section">
            <div className="label">1. Add an application</div>
            <p style={{ margin: 0, opacity: 0.9 }}>
              Create a new entry with company, role, and optional link or
              deadline.
            </p>
          </div>
          <div className="section">
            <div className="label">2. Track progress</div>
            <p style={{ margin: 0, opacity: 0.9 }}>
              Update statuses from saved to interviews and offers as you move
              forward.
            </p>
          </div>
          <div className="section">
            <div className="label">3. Check your match</div>
            <p style={{ margin: 0, opacity: 0.9 }}>
              Use the match score to see gaps and get actionable tips.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
