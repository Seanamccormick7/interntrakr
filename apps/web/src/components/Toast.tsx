import React from "react";

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
  const bgColor = {
    success: "bg-green-500",
    error: "bg-red-500",
    info: "bg-blue-500",
    warning: "bg-yellow-500",
  }[type];

  const icon = {
    success: "✓",
    error: "✕",
    info: "ℹ",
    warning: "⚠",
  }[type];

  // Use 'status' for info/success (polite), 'alert' for error/warning (assertive)
  const ariaRole = type === "error" || type === "warning" ? "alert" : "status";
  const ariaLive = type === "error" || type === "warning" ? "assertive" : "polite";

  return (
    <div
      role={ariaRole}
      aria-live={ariaLive}
      aria-atomic="true"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`${bgColor} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px] max-w-[500px] pointer-events-auto`}
      style={{
        animation: "slideIn 0.3s ease-out",
      }}
    >
      <span className="text-xl" aria-hidden="true">
        {icon}
      </span>
      <span className="flex-1">{message}</span>
      {action && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            action.onClick();
            onClose();
          }}
          className="underline hover:no-underline font-semibold"
          type="button"
        >
          {action.label}
        </button>
      )}
      <button
        onClick={onClose}
        className="text-xl opacity-70 hover:opacity-100 ml-2"
        aria-label="Close notification"
        type="button"
      >
        ×
      </button>
    </div>
  );
}

