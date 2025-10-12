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
        <div>
          <label htmlFor="company" className="label">
            Company *
          </label>
          <input
            type="text"
            id="company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="input"
            style={{ borderColor: errors.company ? "#c33" : undefined }}
            disabled={isSubmitting}
          />
          {errors.company && (
            <span className="helper-error">{errors.company}</span>
          )}
        </div>
        <div>
          <label htmlFor="role" className="label">
            Role *
          </label>
          <input
            type="text"
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="input"
            style={{ borderColor: errors.role ? "#c33" : undefined }}
            disabled={isSubmitting}
          />
          {errors.role && <span className="helper-error">{errors.role}</span>}
        </div>
        <div>
          <label htmlFor="link" className="label">
            Job Link
          </label>
          <input
            type="url"
            id="link"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://..."
            className="input"
            disabled={isSubmitting}
          />
        </div>
        <div>
          <label htmlFor="deadline" className="label">
            Deadline
          </label>
          <input
            type="datetime-local"
            id="deadline"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="input"
            disabled={isSubmitting}
          />
        </div>
        <div>
          <label htmlFor="status" className="label">
            Status
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as AppItem["status"])}
            className="select"
            disabled={isSubmitting}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div
          className="row"
          style={{ justifyContent: "stretch", gap: 12, marginTop: 8 }}
        >
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary"
            style={{
              flex: 1,
              opacity: isSubmitting ? 0.6 : 1,
              cursor: isSubmitting ? "not-allowed" : "pointer",
            }}
          >
            {isSubmitting ? "Saving..." : initialData ? "Update" : "Create"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="btn"
            style={{
              flex: 1,
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
