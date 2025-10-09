import { useEffect, useState } from "react";
import { apiGet, apiPost, apiPut, apiDelete, withAuth } from "../lib/api";
import type { AppItem, ScoreResponse } from "../types";
import { Modal } from "../components/Modal";
import { ApplicationForm } from "../components/ApplicationForm";
import { ScoreDisplay } from "../components/ScoreDisplay";
import { useToast } from "../contexts/ToastContext";
type ApiResponse = Omit<AppItem, "id"> & { _id?: string; id?: string };

const normalizeItem = (item: ApiResponse): AppItem => ({
  ...item,
  id: item.id || item._id || "",
});

export default function Applications() {
  const { showToast } = useToast();
  const [items, setItems] = useState<AppItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<AppItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AppItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Score state
  const [scoringId, setScoringId] = useState<string | null>(null);
  const [scores, setScores] = useState<Record<string, ScoreResponse>>({});
  const [loadingScores, setLoadingScores] = useState<Record<string, boolean>>(
    {},
  );

  // Load applications
  const loadApplications = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("No authentication token found");

      const data = await apiGet<ApiResponse[]>(
        "/applications",
        withAuth(token),
      );
      const normalized = data.map(normalizeItem);
      setItems(normalized);
      setFilteredItems(normalized);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to load applications",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...items];

    if (statusFilter !== "ALL") {
      filtered = filtered.filter((item) => item.status === statusFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.company.toLowerCase().includes(query) ||
          item.role.toLowerCase().includes(query),
      );
    }

    setFilteredItems(filtered);
  }, [items, statusFilter, searchQuery]);


  // Get score for application
  const handleGetScore = async (app: AppItem) => {
    setLoadingScores((prev) => ({ ...prev, [app.id]: true }));

    try {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("No authentication token found");

      // Mock resume keywords - in real app, get from user profile
      const resumeKeywords = [
        "javascript",
        "typescript",
        "react",
        "node",
        "express",
        "mongodb",
        "aws",
        "docker",
      ];

      // Use job link description or generate from role/company
      const jobDescription = app.link
        ? `${app.role} at ${app.company}. Check ${app.link} for details.`
        : `${app.role} position at ${app.company}. Full-stack development role.`;

      const scoreData = await apiPost<ScoreResponse>(
        "/recommendations/score",
        {
          resumeKeywords,
          jobDescription,
          company: app.company,
          role: app.role,
        },
        withAuth(token),
      );

      setScores((prev) => ({ ...prev, [app.id]: scoreData }));
      setScoringId(app.id);
      showToast({ message: "Score calculated successfully!", type: "success" });
    } catch (err) {
      showToast({
        message: err instanceof Error ? err.message : "Failed to calculate score",
        type: "error",
      });
    } finally {
      setLoadingScores((prev) => ({ ...prev, [app.id]: false }));
    }
  };

  // Close score display
  const handleCloseScore = (appId: string) => {
    if (scoringId === appId) {
      setScoringId(null);
    }
  };

  const handleCreate = async (data: Partial<AppItem>) => {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("No authentication token found");

      const response = await apiPost<ApiResponse>(
        "/applications",
        data,
        withAuth(token),
      );
      const newItem = normalizeItem(response);
      setItems((prev) => [...prev, newItem]);
      setIsModalOpen(false);
      showToast({ message: "Application created successfully!", type: "success" });
    } catch (err) {
      showToast({
        message: err instanceof Error ? err.message : "Failed to create application",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (data: Partial<AppItem>) => {
    if (!editingItem) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("No authentication token found");

      const response = await apiPut<ApiResponse>(
        `/applications/${editingItem.id}`,
        data,
        withAuth(token),
      );
      const updated = normalizeItem(response);
      setItems((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item)),
      );
      setIsModalOpen(false);
      setEditingItem(null);
      showToast({ message: "Application updated successfully!", type: "success" });
    } catch (err) {
      showToast({
        message: err instanceof Error ? err.message : "Failed to update application",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this application?")) return;

    try {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("No authentication token found");

      await apiDelete(`/applications/${id}`, withAuth(token));
      setItems((prev) => prev.filter((item) => item.id !== id));
      showToast({ message: "Application deleted successfully!", type: "success" });
    } catch (err) {
      showToast({
        message: err instanceof Error ? err.message : "Failed to delete application",
        type: "error",
      });
    }
  };

  const openCreateModal = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: AppItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "SAVED":
        return "#888";
      case "APPLIED":
        return "#646cff";
      case "OA":
        return "#f59e0b";
      case "INTERVIEW":
        return "#10b981";
      case "REJECTED":
        return "#ef4444";
      case "OFFER":
        return "#22c55e";
      default:
        return "#888";
    }
  };

  if (loading) return <p>Loading applications…</p>;
  if (error) return <p style={{ color: "tomato" }}>{error}</p>;

  return (
    <section>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1.5rem",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <h1 style={{ margin: 0 }}>Applications</h1>
        <button
          onClick={openCreateModal}
          style={{
            padding: "0.75rem 1.5rem",
            borderRadius: 8,
            border: "1px solid #646cff",
            backgroundColor: "#646cff",
            color: "white",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          + New Application
        </button>
      </div>

      {/* Feedback */}

      {/* Filters */}
      <div
        style={{
          display: "flex",
          gap: "1rem",
          marginBottom: "1.5rem",
          flexWrap: "wrap",
        }}
      >
        <input
          type="text"
          placeholder="Search company or role..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            flex: 1,
            minWidth: 250,
            padding: "0.5rem",
            borderRadius: 8,
            border: "1px solid #333",
            backgroundColor: "transparent",
          }}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: 8,
            border: "1px solid #333",
            backgroundColor: "#1a1a1a",
          }}
        >
          <option value="ALL">All Status</option>
          <option value="SAVED">Saved</option>
          <option value="APPLIED">Applied</option>
          <option value="OA">OA</option>
          <option value="INTERVIEW">Interview</option>
          <option value="REJECTED">Rejected</option>
          <option value="OFFER">Offer</option>
        </select>
      </div>

      {/* Applications List */}
      {filteredItems.length === 0 ? (
        <p style={{ textAlign: "center", opacity: 0.6, padding: "3rem 0" }}>
          {items.length === 0
            ? 'No applications yet. Click "New Application" to get started!'
            : "No applications match your filters."}
        </p>
      ) : (
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
            display: "grid",
            gap: "1rem",
          }}
        >
          {filteredItems.map((app) => (
            <li
              key={app.id}
              style={{
                border: "1px solid #333",
                borderRadius: 12,
                padding: "1.25rem",
                display: "grid",
                gap: "0.75rem",
                transition: "border-color 0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.borderColor = "#646cff")
              }
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#333")}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "start",
                }}
              >
                <div>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: "1.125rem",
                      marginBottom: "0.25rem",
                    }}
                  >
                    {app.company} — {app.role}
                  </div>
                  {app.status && (
                    <span
                      style={{
                        display: "inline-block",
                        padding: "0.25rem 0.75rem",
                        borderRadius: 6,
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        backgroundColor: getStatusColor(app.status),
                        color: "white",
                      }}
                    >
                      {app.status}
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    onClick={() => handleGetScore(app)}
                    disabled={loadingScores[app.id]}
                    style={{
                      padding: "0.5rem 1rem",
                      borderRadius: 8,
                      border: "1px solid #646cff",
                      backgroundColor: scores[app.id]
                        ? "#646cff"
                        : "transparent",
                      color: scores[app.id] ? "white" : "#646cff",
                      cursor: loadingScores[app.id] ? "wait" : "pointer",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      opacity: loadingScores[app.id] ? 0.6 : 1,
                    }}
                  >
                    {loadingScores[app.id]
                      ? "Calculating..."
                      : scores[app.id]
                        ? `${scores[app.id].score}% Match`
                        : "Get Score"}
                  </button>
                  <button
                    onClick={() => openEditModal(app)}
                    style={{
                      padding: "0.5rem 1rem",
                      borderRadius: 8,
                      border: "1px solid #333",
                      backgroundColor: "transparent",
                      cursor: "pointer",
                      fontSize: "0.875rem",
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(app.id)}
                    style={{
                      padding: "0.5rem 1rem",
                      borderRadius: 8,
                      border: "1px solid #c33",
                      backgroundColor: "transparent",
                      color: "#c33",
                      cursor: "pointer",
                      fontSize: "0.875rem",
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>

              {app.deadline && (
                <div style={{ opacity: 0.8, fontSize: "0.875rem" }}>
                  📅 Deadline: {new Date(app.deadline).toLocaleString()}
                </div>
              )}

              {app.link && (
                <div style={{ fontSize: "0.875rem" }}>
                  <a
                    href={app.link}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: "#646cff", textDecoration: "none" }}
                  >
                    🔗 View Job Posting
                  </a>
                </div>
              )}

              {/* Score Display */}
              {scores[app.id] && scoringId === app.id && (
                <ScoreDisplay
                  score={scores[app.id]}
                  onClose={() => handleCloseScore(app.id)}
                />
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingItem ? "Edit Application" : "New Application"}
      >
        <ApplicationForm
          initialData={editingItem}
          onSubmit={editingItem ? handleUpdate : handleCreate}
          onCancel={closeModal}
          isSubmitting={isSubmitting}
        />
      </Modal>
    </section>
  );
}
