import { useEffect, useState } from "react";
import { apiGet, withAuth } from "../lib/api";
import type { AppItem } from "../types";

export default function Applications() {
  const [items, setItems] = useState<AppItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        // Get token from localStorage
        const token = localStorage.getItem("access_token");
        if (!token) {
          throw new Error("No authentication token found");
        }

        // Fetch with auth token
        const data = await apiGet<AppItem[]>("/applications", withAuth(token));
        if (mounted) setItems(data);
      } catch (err: unknown) {
        if (mounted)
          setError(
            err instanceof Error ? err.message : "Failed to load applications",
          );
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <p>Loading applications…</p>;
  if (error) return <p style={{ color: "tomato" }}>{error}</p>;
  if (!items || items.length === 0) {
    return (
      <section>
        <h1>Applications</h1>
        <p>No applications yet. Add one in the API or UI (coming next).</p>
      </section>
    );
  }

  return (
    <section>
      <h1 style={{ marginBottom: "1rem" }}>Applications</h1>
      <ul
        style={{
          listStyle: "none",
          padding: 0,
          margin: 0,
          display: "grid",
          gap: "0.75rem",
        }}
      >
        {items.map((app) => (
          <li
            key={app.id}
            style={{
              border: "1px solid #333",
              borderRadius: 12,
              padding: "1rem",
              display: "grid",
              gap: "0.25rem",
            }}
          >
            <div style={{ fontWeight: 700 }}>
              {app.company} — {app.role}
            </div>
            {app.deadline && (
              <div style={{ opacity: 0.8 }}>
                Deadline: {new Date(app.deadline).toLocaleString()}
              </div>
            )}
            {app.status && <div>Status: {app.status}</div>}
            {app.link && (
              <div>
                <a href={app.link} target="_blank" rel="noreferrer">
                  Job link
                </a>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
