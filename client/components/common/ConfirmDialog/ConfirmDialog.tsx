"use client";

import { AlertTriangle } from "lucide-react";

import { Button } from "../Button";
import { Dialog } from "../Dialog";

import styles from "./ConfirmDialog.module.css";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  variant?: "danger" | "primary";
}

const ConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  loading = false,
  variant = "danger",
}: ConfirmDialogProps) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      size="small"
      closeOnOverlayClick={!loading}
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            size="small"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </Button>

          <Button
            type="button"
            variant={variant === "danger" ? "danger" : "primary"}
            size="small"
            loading={loading}
            onClick={onConfirm}
          >
            {confirmText}
          </Button>
        </>
      }
    >
      <div className={styles.content}>
        <div
          className={`
            ${styles.icon}
            ${variant === "danger" ? styles.danger : styles.primary}
          `}
        >
          <AlertTriangle size={19} />
        </div>

        <p>{description}</p>
      </div>
    </Dialog>
  );
};

export default ConfirmDialog;
