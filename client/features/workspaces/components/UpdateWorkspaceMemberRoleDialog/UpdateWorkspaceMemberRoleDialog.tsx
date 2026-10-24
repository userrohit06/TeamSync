"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Shield } from "lucide-react";
import Avatar from "@/components/common/Avatar";
import Button from "@/components/common/Button";
import Dialog from "@/components/common/Dialog";
import Select from "@/components/common/Select";
import {
  useGetWorkspaceRolesQuery,
  useUpdateWorkspaceMemberRoleMutation,
} from "@/features/workspaces/api/workspaceApi";
import { WorkspaceMember } from "@/features/workspaces/types/workspace.types";
import { useToast } from "@/hooks";
import { getErrorMessage } from "@/lib";
import styles from "./UpdateWorkspaceMemberRoleDialog.module.css";

interface UpdateWorkspaceMemberRoleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: number;
  workspaceId: number;
  member: WorkspaceMember | null;
}

export const UpdateWorkspaceMemberRoleDialog = ({
  isOpen,
  onClose,
  organizationId,
  workspaceId,
  member,
}: UpdateWorkspaceMemberRoleDialogProps) => {
  const { success: toastSuccess, error: toastError } = useToast();
  const [selectedRoleId, setSelectedRoleId] = useState("");

  const { data: rolesData, isLoading: isLoadingRoles } =
    useGetWorkspaceRolesQuery(organizationId, { skip: !isOpen || !organizationId });

  const [updateMemberRole, { isLoading: isUpdating }] =
    useUpdateWorkspaceMemberRoleMutation();

  const roles = rolesData?.data ?? [];

  const roleOptions = useMemo(
    () =>
      roles.map((r) => ({
        label: r.roleName,
        value: String(r.roleId),
      })),
    [roles],
  );

  useEffect(() => {
    if (member && roles.length > 0 && isOpen) {
      const match = roles.find(
        (r) => r.roleName.toLowerCase() === member.workspaceRole.toLowerCase(),
      );
      if (match) {
        setSelectedRoleId(String(match.roleId));
      } else if (roles[0]) {
        setSelectedRoleId(String(roles[0].roleId));
      }
    }
  }, [member, roles, isOpen]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!member) return;

    if (!selectedRoleId) {
      toastError("Please select a role");
      return;
    }

    try {
      await updateMemberRole({
        organizationId,
        workspaceId,
        targetUserId: member.userId,
        roleId: Number(selectedRoleId),
      }).unwrap();

      toastSuccess(`Role updated for ${member.fullName}`);
      onClose();
    } catch (err) {
      const msg = getErrorMessage(err);
      toastError(msg);
    }
  };

  const activeRoleDescription = roles.find(
    (r) => String(r.roleId) === selectedRoleId,
  )?.description;

  return (
    <Dialog open={isOpen} onClose={onClose} title="Change Workspace Role">
      <form onSubmit={handleSubmit} className={styles.form}>
        {member && (
          <div className={styles.memberBanner}>
            <Avatar name={member.fullName} src={member.profilePhoto || undefined} size="medium" />
            <div className={styles.memberInfo}>
              <span className={styles.memberName}>{member.fullName}</span>
              <span className={styles.memberEmail}>{member.email}</span>
            </div>
          </div>
        )}

        <div className={styles.field}>
          <label className={styles.label}>Select New Role *</label>
          <Select
            value={selectedRoleId}
            onChange={(val) =>
              setSelectedRoleId(
                typeof val === "string" ? val : (val as any).target.value,
              )
            }
            options={roleOptions}
            disabled={isLoadingRoles || isUpdating}
          />

          {activeRoleDescription && (
            <span className={styles.roleHelpText}>
              <Shield size={13} /> {activeRoleDescription}
            </span>
          )}
        </div>

        <div className={styles.actions}>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isUpdating}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={isUpdating}>
            Update Role
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
