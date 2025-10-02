import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import type { AppItem } from "../types";

type ApplicationFormProps = {
  initialData?: AppItem | null;
  onSubmit: (data: Partial<AppItem>) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
};

const STATUSES = [
  "SAVED",
  "APPLIED",
  "OA",
  "INTERVIEW",
  "REJECTED",
  "OFFER",
] as const;

export function ApplicationForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
}: ApplicationFormProps) {
  const [company, setCompany] = useState(initialData?.company || "");
  const [role, setRole] = useState(initialData?.role || "");
  const [link, setLink] = useState(initialData?.link || "");
  const [deadline, setDeadline] = useState(
    initialData?.deadline ? initialData.deadline.slice(0, 16) : "",
  );
  const [status, setStatus] = useState<AppItem["status"]>(
    initialData?.status || "SAVED",
  );
  const [errors, setErrors] = useState<{ company?: string; role?: string }>({});

  // Reset form when initialData changes
  useEffect(() => {
    if (initialData) {
      setCompany(initialData.company);
      setRole(initialData.role);
      setLink(initialData.link || "");
      setDeadline(
        initialData.deadline ? initialData.deadline.slice(0, 16) : "",
      );
      setStatus(initialData.status || "SAVED");
    }
  }, [initialData]);

  const validate = () => {
    const newErrors: { company?: string; role?: string } = {};

    if (!company.trim()) {
      newErrors.company = "Company name is required";
    }
    if (!role.trim()) {
      newErrors.role = "Role is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    const data: Partial<AppItem> = {
      company: company.trim(),
      role: role.trim(),
      link: link.trim() || undefined,
      deadline: deadline ? new Date(deadline).toISOString() : undefined,
      status,
    };

    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: "grid", gap: "1rem" }}>
        {/* Company */}
        <div>
          <label
            htmlFor="company"
            style={{
              display: "block",
              marginBottom: "0.25rem",
              fontWeight: 500,
            }}
          >
            Company *
          </label>
          <input
            type="text"
            id="company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            style={{
              width: "100%",
              padding: "0.5rem",
              borderRadius: 8,
              border: errors.company ? "1px solid #c33" : "1px solid #333",
              backgroundColor: "transparent",
              color: "inherit",
            }}
            disabled={isSubmitting}
          />
          {errors.company && (
            <span style={{ fontSize: "0.875rem", color: "#c33" }}>
              {errors.company}
            </span>
          )}
        </div>

        {/* Role */}
        <div>
          <label
            htmlFor="role"
            style={{
              display: "block",
              marginBottom: "0.25rem",
              fontWeight: 500,
            }}
          >
            Role *
          </label>
          <input
            type="text"
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            style={{
              width: "100%",
              padding: "0.5rem",
              borderRadius: 8,
              border: errors.role ? "1px solid #c33" : "1px solid #333",
              backgroundColor: "transparent",
              color: "inherit",
            }}
            disabled={isSubmitting}
          />
          {errors.role && (
            <span style={{ fontSize: "0.875rem", color: "#c33" }}>
              {errors.role}
            </span>
          )}
        </div>

        {/* Link */}
        <div>
          <label
            htmlFor="link"
            style={{
              display: "block",
              marginBottom: "0.25rem",
              fontWeight: 500,
            }}
          >
            Job Link
          </label>
          <input
            type="url"
            id="link"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://..."
            style={{
              width: "100%",
              padding: "0.5rem",
              borderRadius: 8,
              border: "1px solid #333",
              backgroundColor: "transparent",
              color: "inherit",
            }}
            disabled={isSubmitting}
          />
        </div>

        {/* Deadline */}
        <div>
          <label
            htmlFor="deadline"
            style={{
              display: "block",
              marginBottom: "0.25rem",
              fontWeight: 500,
            }}
          >
            Deadline
          </label>
          <input
            type="datetime-local"
            id="deadline"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            style={{
              width: "100%",
              padding: "0.5rem",
              borderRadius: 8,
              border: "1px solid #333",
              backgroundColor: "transparent",
              color: "inherit",
            }}
            disabled={isSubmitting}
          />
        </div>

        {/* Status */}
        <div>
          <label
            htmlFor="status"
            style={{
              display: "block",
              marginBottom: "0.25rem",
              fontWeight: 500,
            }}
          >
            Status
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as AppItem["status"])}
            style={{
              width: "100%",
              padding: "0.5rem",
              borderRadius: 8,
              border: "1px solid #333",
              backgroundColor: "#1a1a1a",
              color: "inherit",
            }}
            disabled={isSubmitting}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              flex: 1,
              padding: "0.75rem",
              borderRadius: 8,
              border: "1px solid #646cff",
              backgroundColor: "#646cff",
              color: "white",
              fontWeight: 600,
              cursor: isSubmitting ? "not-allowed" : "pointer",
              opacity: isSubmitting ? 0.6 : 1,
            }}
          >
            {isSubmitting ? "Saving..." : initialData ? "Update" : "Create"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            style={{
              flex: 1,
              padding: "0.75rem",
              borderRadius: 8,
              border: "1px solid #333",
              backgroundColor: "transparent",
              cursor: isSubmitting ? "not-allowed" : "pointer",
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}
