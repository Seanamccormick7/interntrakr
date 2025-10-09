import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { createPortal } from "react-dom";
import { nanoid } from "nanoid";
import { Toast, ToastProps } from "../components/Toast";

interface ToastItem {
  id: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextType {
  showToast: (toast: Omit<ToastItem, "id"> & { id?: string }) => string;
  hideToast: (id: string) => void;
  toasts: ToastItem[];
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const MAX_TOASTS = 5;
const DEFAULT_DURATION = 5000; // 5 seconds

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [pausedToasts, setPausedToasts] = useState<Set<string>>(new Set());
  const [timers, setTimers] = useState<Map<string, NodeJS.Timeout>>(new Map());

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    setTimers((prev) => {
      const timer = prev.get(id);
      if (timer) clearTimeout(timer);
      const newTimers = new Map(prev);
      newTimers.delete(id);
      return newTimers;
    });
    setPausedToasts((prev) => {
      const newPaused = new Set(prev);
      newPaused.delete(id);
      return newPaused;
    });
  }, []);

  const showToast = useCallback(
    (toast: Omit<ToastItem, "id"> & { id?: string }) => {
      const id = toast.id || nanoid();
      const duration = toast.duration ?? DEFAULT_DURATION;

      setToasts((prev) => {
        // Cap at MAX_TOASTS, remove oldest if needed
        const newToasts = [...prev, { ...toast, id }];
        return newToasts.slice(-MAX_TOASTS);
      });

      // Set auto-dismiss timer
      const timer = setTimeout(() => {
        if (!pausedToasts.has(id)) {
          hideToast(id);
        }
      }, duration);

      setTimers((prev) => new Map(prev).set(id, timer));

      return id;
    },
    [hideToast, pausedToasts],
  );

  const handlePause = useCallback((id: string) => {
    setPausedToasts((prev) => new Set(prev).add(id));
    // Clear the timer when paused
    setTimers((prev) => {
      const timer = prev.get(id);
      if (timer) clearTimeout(timer);
      const newTimers = new Map(prev);
      newTimers.delete(id);
      return newTimers;
    });
  }, []);

  const handleResume = useCallback(
    (id: string, duration: number = DEFAULT_DURATION) => {
      setPausedToasts((prev) => {
        const newPaused = new Set(prev);
        newPaused.delete(id);
        return newPaused;
      });

      // Restart the timer when resumed
      const timer = setTimeout(() => {
        hideToast(id);
      }, duration);

      setTimers((prev) => new Map(prev).set(id, timer));
    },
    [hideToast],
  );

  // Handle ESC key to dismiss newest toast
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && toasts.length > 0) {
        const newestToast = toasts[toasts.length - 1];
        hideToast(newestToast.id);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [toasts, hideToast]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [timers]);

  return (
    <ToastContext.Provider value={{ showToast, hideToast, toasts }}>
      {children}
      {createPortal(
        <div
          className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none"
          aria-label="Notifications"
        >
          {toasts.map((toast) => (
            <Toast
              key={toast.id}
              {...toast}
              onClose={() => hideToast(toast.id)}
              onMouseEnter={() => handlePause(toast.id)}
              onMouseLeave={() =>
                handleResume(toast.id, toast.duration ?? DEFAULT_DURATION)
              }
            />
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

