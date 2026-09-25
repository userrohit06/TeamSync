"use client";

import { CheckCircle2, Info, TriangleAlert, X, XCircle } from "lucide-react";
import { ReactNode, useCallback, useEffect, useState } from "react";
import styles from "./Toast.module.css";
import Button from "@/components/common/Button/Button";

type ToastType = "success" | "error" | "warning" | "info";

type ToastPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

interface ToastProps {
  type?: ToastType;
  title?: string;
  message: string;
  duration?: number;
  position?: ToastPosition;
  closable?: boolean;
  onClose?: () => void;
  icon?: ReactNode;
}

const icons: Record<ToastType, ReactNode> = {
  success: <CheckCircle2 size={20} />,
  error: <XCircle size={20} />,
  warning: <TriangleAlert size={20} />,
  info: <Info size={20} />,
};

const Toast = ({
  type = "success",
  title,
  message,
  duration = 2500,
  position = "top-right",
  closable = true,
  onClose,
  icon,
}: ToastProps) => {
  const [isVisible, setIsVisible] = useState(true);

  const handleClose = useCallback(() => {
    setIsVisible(false);

    // small delay so the exit animation can finish
    setTimeout(() => {
      onClose?.();
    }, 180);
  }, [onClose]);

  useEffect(() => {
    if (duration <= 0) return;

    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, handleClose]);

  if (!isVisible) return null;

  return (
    <div
      className={`${styles.container} ${styles[position]}`}
      role={type === "error" ? "alert" : "status"}
      aria-live={type === "error" ? "assertive" : "polite"}
    >
      <div className={`${styles.toast} ${styles[type]}`}>
        <div className={styles.accent} />

        <div className={styles.icon}>{icon ?? icons[type]}</div>

        <div className={styles.content}>
          {title && <div className={styles.title}>{title}</div>}

          <div className={styles.message}>{message}</div>
        </div>

        {closable && (
          <Button
            icon={<X size={16} />}
            variant="outline"
            aria-label="Close notification"
            onClick={handleClose}
            size="small"
          />
        )}
      </div>
    </div>
  );
};

export default Toast;
