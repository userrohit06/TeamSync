import { HTMLAttributes, ReactNode } from "react";
import styles from "./Card.module.css";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: "none" | "small" | "medium" | "large";
}

const Card = ({
  children,
  padding = "medium",
  className = "",
  ...props
}: CardProps) => {
  return (
    <div
      className={`${styles.card} ${styles[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
