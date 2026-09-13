import { ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./Button.module.css";

type ButtonVariant = "primary" | "secondary" | "outline" | "danger";
type ButtonSize = "small" | "medium" | "large";
type IconPosition = "left" | "right";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children?: ReactNode;
  icon?: ReactNode;
  iconPosition?: IconPosition;
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const Button = ({
  children,
  icon,
  iconPosition = "left",
  variant = "primary",
  size = "medium",
  className = "",
  ...props
}: ButtonProps) => {
  const buttonClassName = [
    styles.button,
    styles[variant],
    styles[size],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button className={buttonClassName} {...props}>
      {icon && iconPosition === "left" && (
        <span className={styles.icon}>{icon}</span>
      )}

      {children && <span>{children}</span>}

      {icon && iconPosition === "right" && (
        <span className={styles.icon}>{icon}</span>
      )}
    </button>
  );
};

export default Button;
