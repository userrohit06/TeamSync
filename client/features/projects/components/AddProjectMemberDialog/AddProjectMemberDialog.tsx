"use client";

import { FormEvent, useState } from "react";
import Button from "@/components/common/Button";
import Dialog from "@/components/common/Dialog";
import Select from "@/components/common/Select";
import {
  useAddOrAssignProjectMemberMutation,
  useGetProjectRolesQuery,
} from "@/features/projects/api/projectApi";
import { useGetWorkspaceMembersQuery } from "@/features/workspaces/api/workspaceApi";
import { useToast } from "@/hooks";
import { getErrorMessage } from "@/lib";

interface AddProjectMemberDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  workspaceId: number;
  organizationId?: number;
  existingMemberUserIds?: number[];
}

export const AddProjectMemberDialog = ({
  isOpen,
  onClose,
  projectId,
  workspaceId,
  organizationId = 0,
  existingMemberUserIds = [],
}: AddProjectMemberDialogProps) => {
  const [targetUserId, setTargetUserId] = useState<string>("");
  const [projectRoleId, setProjectRoleId] = useState<string>("");

  const { data: rolesData } = useGetProjectRolesQuery(
    { excludeOwner: true },
    { skip: !isOpen }
  );
  const roles = rolesData?.data ?? [];

  const { data: membersData } = useGetWorkspaceMembersQuery(
    {
      organizationId,
      workspaceId,
      pageSize: 50,
    },
    { skip: !isOpen || !workspaceId || !organizationId }
  );
  const workspaceMembers = (membersData?.data?.items ?? []).filter(
    (m) => !existingMemberUserIds.includes(m.userId)
  );

  const [addOrAssignMember, { isLoading }] = useAddOrAssignProjectMemberMutation();
  const { success: toastSuccess, error: toastError } = useToast();

  const handleClose = () => {
    setTargetUserId("");
    setProjectRoleId("");
    onClose();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!targetUserId) {
      toastError("Please select a workspace member to add");
      return;
    }

    if (!projectRoleId) {
      toastError("Please select a project role");
      return;
    }

    try {
      const response = await addOrAssignMember({
        projectId,
        workspaceId,
        targetUserId: Number(targetUserId),
        projectRoleId: Number(projectRoleId),
      }).unwrap();

      toastSuccess(response.message || `Member assigned as ${response.data?.projectRole}`);
      handleClose();
    } catch (err) {
      const errMsg = getErrorMessage(err);
      toastError(errMsg);
    }
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} title="Add Project Collaborator">
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <p style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: "1.5" }}>
          Assign an active workspace member to this project with specific role permissions.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-secondary)" }}>
            Select Workspace Member
          </label>
          <Select
            value={targetUserId}
            onChange={(e) => setTargetUserId(e.target.value)}
            options={[
              { label: "-- Select a workspace member --", value: "" },
              ...workspaceMembers.map((m) => ({
                label: `${m.fullName} (${m.email}) - ${m.workspaceRole}`,
                value: m.userId.toString(),
              })),
            ]}
            disabled={isLoading}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-secondary)" }}>
            Project Role
          </label>
          <Select
            value={projectRoleId}
            onChange={(e) => setProjectRoleId(e.target.value)}
            options={[
              { label: "-- Select a project role --", value: "" },
              ...roles.map((r) => ({
                label: `${r.roleName} - ${r.description || ""}`,
                value: r.projectRoleId.toString(),
              })),
            ]}
            disabled={isLoading}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
          <Button type="button" variant="secondary" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={isLoading}>
            Assign Member
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
