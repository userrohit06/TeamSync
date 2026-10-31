"use client";

import { useState } from "react";
import { Globe, Lock } from "lucide-react";
import Button from "@/components/common/Button";
import Dialog from "@/components/common/Dialog";
import { useChangeProjectVisibilityMutation } from "@/features/projects/api/projectApi";
import { ProjectDetails, ProjectItem, ProjectVisibility } from "@/features/projects/types/project.types";
import { useGetWorkspaceMembersQuery } from "@/features/workspaces/api/workspaceApi";
import { useToast } from "@/hooks";
import { getErrorMessage } from "@/lib";
import styles from "./ChangeProjectVisibilityDialog.module.css";

interface ChangeProjectVisibilityDialogProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectDetails | ProjectItem;
  organizationId?: number;
}

export const ChangeProjectVisibilityDialog = ({
  isOpen,
  onClose,
  project,
  organizationId = 0,
}: ChangeProjectVisibilityDialogProps) => {
  const [visibility, setVisibility] = useState<ProjectVisibility>(project.visibility);
  const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([]);

  const { data: membersData } = useGetWorkspaceMembersQuery(
    {
      organizationId,
      workspaceId: project.workspaceId,
      pageSize: 50,
    },
    {
      skip:
        !isOpen ||
        !project.workspaceId ||
        !organizationId ||
        visibility !== "Restricted" ||
        project.visibility === "Restricted",
    }
  );
  const workspaceMembers = membersData?.data?.items ?? [];

  const [changeVisibility, { isLoading }] = useChangeProjectVisibilityMutation();
  const { success: toastSuccess, error: toastError } = useToast();

  const handleMemberToggle = (userId: number) => {
    setSelectedMemberIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleApply = async () => {
    if (visibility === project.visibility) {
      onClose();
      return;
    }

    try {
      const response = await changeVisibility({
        projectId: project.projectId,
        workspaceId: project.workspaceId,
        visibility,
        initialMemberIds:
          visibility === "Restricted" && selectedMemberIds.length > 0
            ? selectedMemberIds
            : undefined,
      }).unwrap();

      toastSuccess(response.message || `Project visibility updated to ${response.data?.visibility}`);
      onClose();
    } catch (err) {
      const errMsg = getErrorMessage(err);
      toastError(errMsg);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} title="Change Project Visibility">
      <div className={styles.container}>
        <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
          Choose who in the workspace can view and access <strong>{project.name}</strong>:
        </p>

        <div className={styles.visibilityToggle}>
          <div
            className={`${styles.visibilityOption} ${
              visibility === "Workspace" ? styles.visibilityActive : ""
            }`}
            onClick={() => setVisibility("Workspace")}
          >
            <Globe size={18} color="var(--primary)" />
            <div>
              <div className={styles.visibilityTitle}>Workspace-Wide</div>
              <div className={styles.visibilityDesc}>
                Open to all active workspace members
              </div>
            </div>
          </div>

          <div
            className={`${styles.visibilityOption} ${
              visibility === "Restricted" ? styles.visibilityActive : ""
            }`}
            onClick={() => setVisibility("Restricted")}
          >
            <Lock size={18} color="var(--warning)" />
            <div>
              <div className={styles.visibilityTitle}>Restricted</div>
              <div className={styles.visibilityDesc}>
                Only explicit project members can view
              </div>
            </div>
          </div>
        </div>

        {visibility === "Restricted" && project.visibility === "Workspace" && (
          <div>
            <label
              style={{
                fontSize: "13px",
                fontWeight: 500,
                color: "var(--text-secondary)",
                display: "block",
                marginBottom: "6px",
              }}
            >
              Select Initial Explicit Members:
            </label>
            <div className={styles.memberSelection}>
              {workspaceMembers.length === 0 ? (
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  Project owner will automatically retain full access.
                </span>
              ) : (
                workspaceMembers.map((member) => (
                  <label key={member.userId} className={styles.memberCheckItem}>
                    <input
                      type="checkbox"
                      checked={selectedMemberIds.includes(member.userId)}
                      onChange={() => handleMemberToggle(member.userId)}
                    />
                    <span style={{ fontSize: "13px" }}>
                      {member.fullName} ({member.email})
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>
        )}

        <div className={styles.actions}>
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleApply} loading={isLoading}>
            Apply Visibility
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
