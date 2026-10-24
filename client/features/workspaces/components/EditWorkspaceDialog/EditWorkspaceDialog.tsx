"use client";

import { FormEvent, useEffect, useState } from "react";
import { Globe, Lock } from "lucide-react";
import Button from "@/components/common/Button";
import Dialog from "@/components/common/Dialog";
import Input from "@/components/common/Input";
import { useUpdateWorkspaceMutation } from "@/features/workspaces/api/workspaceApi";
import { WorkspaceDetails, WorkspaceItem } from "@/features/workspaces/types/workspace.types";
import { useToast } from "@/hooks";
import { getErrorMessage } from "@/lib";
import styles from "./EditWorkspaceDialog.module.css";

interface EditWorkspaceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  workspace: WorkspaceDetails | WorkspaceItem | null;
}

export const EditWorkspaceDialog = ({
  isOpen,
  onClose,
  workspace,
}: EditWorkspaceDialogProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);

  const [updateWorkspace, { isLoading }] = useUpdateWorkspaceMutation();
  const { success: toastSuccess, error: toastError } = useToast();

  useEffect(() => {
    if (workspace && isOpen) {
      setName(workspace.name);
      setDescription(workspace.description || "");
      const priv =
        "visibility" in workspace
          ? workspace.visibility.toLowerCase() === "private"
          : Boolean(workspace.isPrivate);
      setIsPrivate(priv);
    }
  }, [workspace, isOpen]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!workspace) return;

    if (!name.trim()) {
      toastError("Workspace name cannot be empty");
      return;
    }

    try {
      await updateWorkspace({
        organizationId: workspace.organizationId,
        workspaceId: workspace.workspaceId,
        name: name.trim(),
        description: description.trim() || null,
        isPrivate,
      }).unwrap();

      toastSuccess("Workspace updated successfully");
      onClose();
    } catch (err) {
      const errMsg = getErrorMessage(err);
      toastError(errMsg);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} title="Edit Workspace">
      <form onSubmit={handleSubmit} className={styles.form}>
        <Input
          label="Workspace Name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isLoading}
        />

        <div className={styles.field}>
          <label className={styles.label}>Description</label>
          <textarea
            className={styles.textarea}
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
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={isLoading}>
            Save Changes
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
