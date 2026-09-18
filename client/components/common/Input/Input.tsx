"use client";

import { InputHTMLAttributes, ReactNode, useState } from "react";
import styles from "./Input.module.css";
import { Eye, EyeOff } from "lucide-react";

type InputSize = "small" | "medium" | "large";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: ReactNode;
  showPasswordToggle?: boolean;
  inputSize?: InputSize;
}

const Input = ({
  label,
  error,
  leftIcon,
  showPasswordToggle = false,
  type = "text",
  className,
  inputSize = "small",
  ...props
}: InputProps) => {
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === "password";
  const inputType = isPassword && showPassword ? "text" : type;

  return (
    <div className={styles.wrapper}>
      {label && (
        <label htmlFor={props.id || props.name} className={styles.label}>
          {label}

          {props.required && <span className={styles.required}>*</span>}
        </label>
      )}

      <div
        className={`${styles.inputWrapper} ${error ? styles.inputError : ""}`}
      >
        {leftIcon && <span className={styles.leftIcon}>{leftIcon}</span>}

        <input
          {...props}
          id={props.id || props.name}
          type={inputType}
          className={`${styles.input} ${styles[inputSize]} ${leftIcon ? styles.hasLeftIcon : ""} ${showPasswordToggle && isPassword ? styles.hasRightIcon : ""}`}
        />

        {showPasswordToggle && isPassword && (
          <button
            type="button"
            className={styles.passwordToggle}
            onClick={() => setShowPassword((current) => !current)}
            aria-label={showPassword ? "Hide Password" : "Show Password"}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>

      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
};

export default Input;
