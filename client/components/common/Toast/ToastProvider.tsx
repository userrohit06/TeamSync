"use client";

import { createContext, ReactNode, useCallback, useState } from "react";
import Toast from "./Toast";

type ToastType = "success" | "error" | "warning" | "info";

type ToastPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

export interface ToastOptions {
  type?: ToastType;
  title?: string;
  message: string;
  duration?: number;
  position?: ToastPosition;
  closable?: boolean;
  icon?: ReactNode;
}

interface ToastItem extends ToastOptions {
  id: number;
}

export interface ToastContextType {
  showToast: (options: ToastOptions) => void;

  success: (
    message: string,
    options?: Omit<ToastOptions, "message" | "type">,
  ) => void;

  error: (
    message: string,
    options?: Omit<ToastOptions, "message" | "type">,
  ) => void;

  warning: (
    message: string,
    options?: Omit<ToastOptions, "message" | "type">,
  ) => void;

  info: (
    message: string,
    options?: Omit<ToastOptions, "message" | "type">,
  ) => void;
}

export const ToastContext = createContext<ToastContextType | undefined>(
  undefined,
);

interface ToastProviderProps {
  children: ReactNode;
}

const ToastProvider = ({ children }: ToastProviderProps) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts((currentToasts) =>
      currentToasts.filter((toast) => toast.id !== id),
    );
  }, []);

  const showToast = useCallback((options: ToastOptions) => {
    const id = Date.now();

    setToasts((currentToasts) => [
      ...currentToasts,
      {
        id,
        ...options,
      },
    ]);
  }, []);

  const success = useCallback(
    (message: string, options?: Omit<ToastOptions, "message" | "type">) => {
      showToast({
        ...options,
        message,
        type: "success",
      });
    },
    [showToast],
  );

  const error = useCallback(
    (message: string, options?: Omit<ToastOptions, "message" | "type">) => {
      showToast({
        ...options,
        message,
        type: "error",
      });
    },
    [showToast],
  );

  const warning = useCallback(
    (message: string, options?: Omit<ToastOptions, "message" | "type">) => {
      showToast({
        ...options,
        message,
        type: "warning",
      });
    },
    [showToast],
  );

  const info = useCallback(
    (message: string, options?: Omit<ToastOptions, "message" | "type">) => {
      showToast({
        ...options,
        message,
        type: "info",
      });
    },
    [showToast],
  );

  return (
    <ToastContext.Provider
      value={{
        showToast,
        success,
        error,
        warning,
        info,
      }}
    >
      {children}

      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          type={toast.type}
          title={toast.title}
          message={toast.message}
          duration={toast.duration}
          position={toast.position}
          closable={toast.closable}
          icon={toast.icon}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </ToastContext.Provider>
  );
};

export default ToastProvider;
