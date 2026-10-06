import { ReactNode } from "react";
import styles from "./StatusBadge.module.css";

type StatusBadgeVariant =
  | "success"
  | "warning"
  | "error"
  | "info"
  | "neutral"
  | "primary";

interface StatusBadgeProps {
  children: ReactNode;
  variant?: StatusBadgeVariant;
  dot?: boolean;
  className?: string;
}

const StatusBadge = ({
  children,
  variant = "neutral",
  dot = false,
  className = "",
}: StatusBadgeProps) => {
  return (
    <span className={`${styles.badge} ${styles[variant]} ${className}`}>
      {dot && <span className={styles.dot} />}
      {children}
    </span>
  );
};

export default StatusBadge;
