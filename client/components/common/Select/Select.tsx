import { SelectHTMLAttributes, ReactNode } from "react";

import { ChevronDown } from "lucide-react";

import styles from "./Select.module.css";

interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

interface SelectProps extends Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  "size"
> {
  label?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
  selectSize?: "small" | "medium" | "large";
  leftIcon?: ReactNode;
}

const Select = ({
  label,
  error,
  hint,
  options,
  selectSize = "medium",
  leftIcon,
  className = "",
  id,
  ...props
}: SelectProps) => {
  return (
    <div className={styles.wrapper}>
      {label && (
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
      )}

      <div className={`${styles.selectWrapper} ${className}`}>
        {leftIcon && <span className={styles.leftIcon}>{leftIcon}</span>}

        <select
          id={id}
          className={`
            ${styles.select}
            ${styles[selectSize]}
            ${leftIcon ? styles.hasLeftIcon : ""}
            ${error ? styles.hasError : ""}
            ${className}
          `}
          {...props}
        >
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>

        <span className={styles.chevron}>
          <ChevronDown size={16} />
        </span>
      </div>

      {error && <span className={styles.error}>{error}</span>}

      {!error && hint && <span className={styles.hint}>{hint}</span>}
    </div>
  );
};

export default Select;
