"use client";

import {
  ChangeEvent,
  KeyboardEvent,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Check, ChevronDown, X } from "lucide-react";

import styles from "./Select.module.css";

export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export type SelectValue = string | string[];

interface SelectProps {
  id?: string;
  label?: string;
  placeholder?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
  value?: SelectValue;
  onChange?: (value: any) => void;
  multiple?: boolean;
  disabled?: boolean;
  selectSize?: "small" | "medium" | "large";
  leftIcon?: ReactNode;
  className?: string;
}

const Select = ({
  id,
  label,
  placeholder,
  error,
  hint,
  options = [],
  value,
  onChange,
  multiple = false,
  disabled = false,
  selectSize = "medium",
  leftIcon,
  className = "",
}: SelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Normalize selected values into an array
  const selectedValues = useMemo<string[]>(() => {
    if (value === undefined || value === null || value === "") return [];
    return Array.isArray(value) ? value : [String(value)];
  }, [value]);

  // Selected Option Objects map
  const selectedOptions = useMemo(() => {
    return options.filter((opt) => selectedValues.includes(opt.value));
  }, [options, selectedValues]);

  // Filter options based on inline search text
  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return options;
    const lower = searchTerm.toLowerCase();
    return options.filter((opt) => opt.label.toLowerCase().includes(lower));
  }, [options, searchTerm]);

  // Close when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Auto-focus input when it transforms into edit mode
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleContainerClick = () => {
    if (disabled) return;
    if (!isOpen) {
      setIsOpen(true);
      setSearchTerm("");
    }
  };

  const handleSelectOption = (opt: SelectOption) => {
    if (opt.disabled) return;

    if (multiple) {
      const isSelected = selectedValues.includes(opt.value);
      const nextValues = isSelected
        ? selectedValues.filter((v) => v !== opt.value)
        : [...selectedValues, opt.value];

      onChange?.(nextValues);
      setSearchTerm("");
      // Keep input focused for more multi selections
      inputRef.current?.focus();
    } else {
      onChange?.(opt.value);
      setIsOpen(false);
      setSearchTerm("");
    }
  };

  const handleRemoveSingle = (e: React.MouseEvent, val: string) => {
    e.stopPropagation();
    if (disabled) return;
    const nextValues = selectedValues.filter((v) => v !== val);
    onChange?.(multiple ? nextValues : "");
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    onChange?.(multiple ? [] : "");
    setSearchTerm("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      setSearchTerm("");
    }
    if (
      e.key === "Backspace" &&
      searchTerm === "" &&
      selectedValues.length > 0
    ) {
      if (multiple) {
        onChange?.(selectedValues.slice(0, -1));
      } else {
        onChange?.("");
      }
    }
  };

  return (
    <div className={`${styles.wrapper} ${className}`} ref={containerRef}>
      {label && (
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
      )}

      <div
        id={id}
        tabIndex={disabled ? -1 : 0}
        onClick={handleContainerClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            handleContainerClick();
          }
        }}
        className={`
          ${styles.control}
          ${styles[selectSize]}
          ${leftIcon ? styles.hasLeftIcon : ""}
          ${isOpen ? styles.isOpen : ""}
          ${error ? styles.hasError : ""}
          ${disabled ? styles.disabled : ""}
        `}
      >
        {leftIcon && <span className={styles.leftIcon}>{leftIcon}</span>}

        <div className={styles.valueArea}>
          {/* MULTI-SELECT DISPLAY (When closed or not actively typing) */}
          {multiple && !isOpen && selectedOptions.length > 0 && (
            <div className={styles.tagsGroup}>
              {selectedOptions.slice(0, 3).map((opt) => (
                <span key={opt.value} className={styles.tag}>
                  {opt.label}
                  <button
                    type="button"
                    onClick={(e) => handleRemoveSingle(e, opt.value)}
                    className={styles.tagCloseBtn}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
              {selectedOptions.length > 3 && (
                <span className={styles.moreBadge}>
                  +{selectedOptions.length - 3}
                </span>
              )}
            </div>
          )}

          {/* SINGLE SELECT DISPLAY (When closed) */}
          {!multiple && !isOpen && selectedOptions.length > 0 && (
            <span className={styles.singleValue}>
              {selectedOptions[0].label}
            </span>
          )}

          {/* ACTIVE EDITING INPUT: Trigger morphs directly into input when open */}
          {isOpen ? (
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setSearchTerm(e.target.value)
              }
              onKeyDown={handleKeyDown}
              className={styles.inlineInput}
              placeholder={
                selectedOptions.length === 0
                  ? (placeholder ?? "")
                  : multiple
                    ? `${selectedOptions.length} selected - type to filter...`
                    : (selectedOptions[0]?.label ?? "")
              }
            />
          ) : (
            selectedOptions.length === 0 && (
              <span className={styles.placeholderText}>
                {placeholder ?? ""}
              </span>
            )
          )}
        </div>

        {/* Right Action Icons */}
        <div className={styles.actionsRight}>
          {selectedValues.length > 0 && !disabled && (
            <button
              type="button"
              className={styles.clearBtn}
              onClick={handleClearAll}
              title="Clear selection"
            >
              <X size={14} />
            </button>
          )}

          <span
            className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ""}`}
          >
            <ChevronDown size={16} />
          </span>
        </div>

        {/* DROPDOWN MENU */}
        {isOpen && (
          <div className={styles.menu}>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = selectedValues.includes(opt.value);
                return (
                  <div
                    key={opt.value}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectOption(opt);
                    }}
                    className={`
                      ${styles.option}
                      ${isSelected ? styles.optionSelected : ""}
                      ${opt.disabled ? styles.optionDisabled : ""}
                    `}
                  >
                    <span className={styles.optionLabel}>{opt.label}</span>
                    {isSelected && (
                      <Check size={14} className={styles.checkIcon} />
                    )}
                  </div>
                );
              })
            ) : (
              <div className={styles.noOptions}>
                No results for "{searchTerm}"
              </div>
            )}
          </div>
        )}
      </div>

      {error && <span className={styles.error}>{error}</span>}
      {!error && hint && <span className={styles.hint}>{hint}</span>}
    </div>
  );
};

export default Select;
