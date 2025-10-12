export interface ToastProps {
  id: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
  onClose: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export function Toast({
  message,
  type,
  onClose,
  action,
  onMouseEnter,
  onMouseLeave,
}: ToastProps) {
  const bgClass = {
    success: "toast-success",
    error: "toast-error",
    info: "toast-info",
    warning: "toast-warning",
  }[type];

  const icon = {
    success: "✓",
    error: "✕",
    info: "ℹ",
    warning: "⚠",
  }[type];

  const ariaRole = type === "error" || type === "warning" ? "alert" : "status";
  const ariaLive =
    type === "error" || type === "warning" ? "assertive" : "polite";

  return (
    <div
      role={ariaRole}
      aria-live={ariaLive}
      aria-atomic="true"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`toast ${bgClass}`}
    >
      <span aria-hidden="true">{icon}</span>
      <span style={{ flex: 1 }}>{message}</span>
      {action && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            action.onClick();
            onClose();
          }}
          className="btn btn-ghost"
          type="button"
        >
          {action.label}
        </button>
      )}
      <button
        onClick={onClose}
        className="toast-close btn btn-ghost"
        aria-label="Close notification"
        type="button"
      >
        ×
      </button>
    </div>
  );
}
