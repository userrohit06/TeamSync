"use client";

import { FormEvent, useState } from "react";
import { Globe, Lock } from "lucide-react";
import Button from "@/components/common/Button";
import Dialog from "@/components/common/Dialog";
import Input from "@/components/common/Input";
import { useCreateWorkspaceMutation } from "@/features/workspaces/api/workspaceApi";
import { useToast } from "@/hooks";
import { getErrorMessage } from "@/lib";
import styles from "./CreateWorkspaceDialog.module.css";

interface CreateWorkspaceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: number;
}

export const CreateWorkspaceDialog = ({
  isOpen,
  onClose,
  organizationId,
}: CreateWorkspaceDialogProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);

  const [createWorkspace, { isLoading }] = useCreateWorkspaceMutation();
  const { success: toastSuccess, error: toastError } = useToast();

  const handleClose = () => {
    setName("");
    setDescription("");
    setIsPrivate(false);
    onClose();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toastError("Workspace name is required");
      return;
    }

    try {
      const response = await createWorkspace({
        organizationId,
        name: name.trim(),
        description: description.trim() || undefined,
        isPrivate,
      }).unwrap();

      toastSuccess(response.message || "Workspace created successfully");
      handleClose();
    } catch (err) {
      const errMsg = getErrorMessage(err);
      toastError(errMsg);
    }
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} title="Create Workspace">
      <form onSubmit={handleSubmit} className={styles.form}>
        <Input
          label="Workspace Name"
          required
          placeholder="e.g. Engineering, Marketing, Design"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isLoading}
        />

        <div className={styles.field}>
          <label className={styles.label}>Description</label>
          <textarea
            className={styles.textarea}
            placeholder="Brief description of the workspace purpose"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isLoading}
            rows={3}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Visibility</label>
          <div className={styles.visibilityToggle}>
            <div
              className={`${styles.visibilityOption} ${!isPrivate ? styles.visibilityActive : ""}`}
              onClick={() => setIsPrivate(false)}
            >
              <Globe size={18} color="var(--primary)" />
              <div>
                <div className={styles.visibilityTitle}>Public</div>
                <div className={styles.visibilityDesc}>
                  Any member in the organization can view and join
                </div>
              </div>
            </div>

            <div
              className={`${styles.visibilityOption} ${isPrivate ? styles.visibilityActive : ""}`}
              onClick={() => setIsPrivate(true)}
            >
              <Lock size={18} color="var(--warning)" />
              <div>
                <div className={styles.visibilityTitle}>Private</div>
                <div className={styles.visibilityDesc}>
                  Only explicitly invited members can access
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.actions}>
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={isLoading}>
            Create Workspace
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
