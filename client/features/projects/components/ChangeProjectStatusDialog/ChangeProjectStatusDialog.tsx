"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import Button from "@/components/common/Button";
import Dialog from "@/components/common/Dialog";
import {
  useChangeProjectStatusMutation,
  useGetProjectStatusesQuery,
} from "@/features/projects/api/projectApi";
import { ProjectDetails, ProjectItem } from "@/features/projects/types/project.types";
import { useToast } from "@/hooks";
import { getErrorMessage } from "@/lib";
import styles from "./ChangeProjectStatusDialog.module.css";

interface ChangeProjectStatusDialogProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectDetails | ProjectItem;
  organizationId?: number;
}

export const ChangeProjectStatusDialog = ({
  isOpen,
  onClose,
  project,
  organizationId,
}: ChangeProjectStatusDialogProps) => {
  const [selectedStatusId, setSelectedStatusId] = useState<number>(project.projectStatusId);

  const { data: statusesData } = useGetProjectStatusesQuery(
    organizationId ? { organizationId } : undefined,
    { skip: !isOpen }
  );
  const statuses = statusesData?.data ?? [];

  const [changeStatus, { isLoading }] = useChangeProjectStatusMutation();
  const { success: toastSuccess, error: toastError } = useToast();

  const handleApply = async () => {
    if (selectedStatusId === project.projectStatusId) {
      onClose();
      return;
    }

    try {
      const response = await changeStatus({
        projectId: project.projectId,
        workspaceId: project.workspaceId,
        projectStatusId: selectedStatusId,
      }).unwrap();

      toastSuccess(response.message || `Status updated to ${response.data?.projectStatusName}`);
      onClose();
    } catch (err) {
      const errMsg = getErrorMessage(err);
      toastError(errMsg);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} title="Change Project Status">
      <div className={styles.container}>
        <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
          Select the current progress phase for <strong>{project.name}</strong>:
        </p>

        <div className={styles.statusGrid}>
          {statuses.map((status) => {
            const isSelected = selectedStatusId === status.projectStatusId;
            return (
              <div
                key={status.projectStatusId}
                className={`${styles.statusOption} ${isSelected ? styles.statusActive : ""}`}
                onClick={() => setSelectedStatusId(status.projectStatusId)}
              >
                <div className={styles.statusInfo}>
                  <span
                    className={styles.colorDot}
                    style={{ backgroundColor: status.colorHex || "var(--primary)" }}
                  />
                  <div>
                    <div className={styles.statusName}>{status.name}</div>
                    <div className={styles.statusCategory}>{status.category}</div>
                  </div>
                </div>

                {isSelected && <Check size={16} color="var(--primary)" />}
              </div>
            );
          })}
        </div>

        <div className={styles.actions}>
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleApply} loading={isLoading}>
            Update Status
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
