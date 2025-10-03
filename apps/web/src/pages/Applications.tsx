import { useEffect, useState } from "react";
import { apiGet, apiPost, apiPut, apiDelete, withAuth } from "../lib/api";
import type { AppItem } from "../types";
import { Modal } from "../components/Modal";
import { ApplicationForm } from "../components/ApplicationForm";

type FeedbackType = { type: "success" | "error"; message: string } | null;

// Type for API response that might have _id instead of id
type ApiResponse = Omit<AppItem, "id"> & { _id?: string; id?: string };

// Helper to normalize API response
const normalizeItem = (item: ApiResponse): AppItem => ({
  ...item,
  id: item.id || item._id || "",
});

export default function Applications() {
  const [items, setItems] = useState<AppItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<AppItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<FeedbackType>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AppItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Load applications
  const loadApplications = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const data = await apiGet<ApiResponse[]>(
        "/applications",
        withAuth(token),
      );
      // Transform _id to id if needed
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

  // Show feedback temporarily
  const showFeedback = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 5000);
  };

  // Create application
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
      // Normalize response
      const newItem = normalizeItem(response);
      setItems((prev) => [...prev, newItem]);
      setIsModalOpen(false);
      showFeedback("success", "Application created successfully!");
    } catch (err) {
      showFeedback(
        "error",
        err instanceof Error ? err.message : "Failed to create application",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update application
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
      // Normalize response
      const updated = normalizeItem(response);
      setItems((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item)),
      );
      setIsModalOpen(false);
      setEditingItem(null);
      showFeedback("success", "Application updated successfully!");
    } catch (err) {
      showFeedback(
        "error",
        err instanceof Error ? err.message : "Failed to update application",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete application
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this application?")) return;

    try {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("No authentication token found");

      await apiDelete(`/applications/${id}`, withAuth(token));
      setItems((prev) => prev.filter((item) => item.id !== id));
      showFeedback("success", "Application deleted successfully!");
    } catch (err) {
      showFeedback(
        "error",
        err instanceof Error ? err.message : "Failed to delete application",
      );
    }
  };

  // Open create modal
  const openCreateModal = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  // Open edit modal
  const openEditModal = (item: AppItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  // Status badge color
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
      {feedback && (
        <div
          style={{
            padding: "0.75rem 1rem",
            marginBottom: "1rem",
            borderRadius: 8,
            backgroundColor: feedback.type === "success" ? "#d1fae5" : "#fee",
            border: `1px solid ${feedback.type === "success" ? "#10b981" : "#c33"}`,
            color: feedback.type === "success" ? "#065f46" : "#c33",
          }}
        >
          {feedback.message}
        </div>
      )}

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
          placeholder="Search by company or role..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            flex: 1,
            minWidth: 250,
            padding: "0.5rem 1rem",
            borderRadius: 8,
            border: "1px solid #333",
            backgroundColor: "transparent",
            color: "inherit",
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
            color: "inherit",
          }}
        >
          <option value="ALL">All Statuses</option>
          <option value="SAVED">Saved</option>
          <option value="APPLIED">Applied</option>
          <option value="OA">OA</option>
          <option value="INTERVIEW">Interview</option>
          <option value="REJECTED">Rejected</option>
          <option value="OFFER">Offer</option>
        </select>
      </div>

      {/* Results count */}
      <p style={{ marginBottom: "1rem", opacity: 0.8 }}>
        Showing {filteredItems.length} of {items.length} applications
      </p>

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
