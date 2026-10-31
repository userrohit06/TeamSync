"use client";

import { FormEvent, useState } from "react";
import Button from "@/components/common/Button";
import Dialog from "@/components/common/Dialog";
import Select from "@/components/common/Select";
import { useTransferProjectOwnershipMutation } from "@/features/projects/api/projectApi";
import { ProjectDetails, ProjectItem } from "@/features/projects/types/project.types";
import { useGetWorkspaceMembersQuery } from "@/features/workspaces/api/workspaceApi";
import { useToast } from "@/hooks";
import { getErrorMessage } from "@/lib";

interface TransferProjectOwnershipDialogProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectDetails | ProjectItem;
  organizationId?: number;
}

export const TransferProjectOwnershipDialog = ({
  isOpen,
  onClose,
  project,
  organizationId = 0,
}: TransferProjectOwnershipDialogProps) => {
  const [targetUserId, setTargetUserId] = useState<string>("");

  const { data: membersData } = useGetWorkspaceMembersQuery(
    {
      organizationId,
      workspaceId: project.workspaceId,
      pageSize: 50,
    },
    { skip: !isOpen || !project.workspaceId || !organizationId }
  );
  const eligibleMembers = (membersData?.data?.items ?? []).filter(
    (m) => m.userId !== project.ownerUserId
  );

  const [transferOwnership, { isLoading }] = useTransferProjectOwnershipMutation();
  const { success: toastSuccess, error: toastError } = useToast();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!targetUserId) {
      toastError("Please select a target user to transfer ownership to");
      return;
    }

    try {
      const response = await transferOwnership({
        projectId: project.projectId,
        workspaceId: project.workspaceId,
        newOwnerUserId: Number(targetUserId),
      }).unwrap();

      toastSuccess(
        response.message || `Project ownership transferred to ${response.data?.ownerName}`
      );
      onClose();
    } catch (err) {
      const errMsg = getErrorMessage(err);
      toastError(errMsg);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} title="Transfer Project Ownership">
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <p style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: "1.5" }}>
          Transferring ownership of <strong>{project.name}</strong> will grant full control over project
          settings, visibility, members, and deletion to the new owner. You will become a Project Admin.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-secondary)" }}>
            Select New Owner (Workspace Member)
          </label>
          <Select
            value={targetUserId}
            onChange={(e) => setTargetUserId(e.target.value)}
            options={[
              { label: "-- Select a workspace member --", value: "" },
              ...eligibleMembers.map((m) => ({
                label: `${m.fullName} (${m.email}) - ${m.workspaceRole}`,
                value: m.userId.toString(),
              })),
            ]}
            disabled={isLoading}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={isLoading}>
            Transfer Ownership
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
