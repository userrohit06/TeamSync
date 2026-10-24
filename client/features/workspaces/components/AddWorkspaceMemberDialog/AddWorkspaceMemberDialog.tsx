"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Shield } from "lucide-react";
import Button from "@/components/common/Button";
import Dialog from "@/components/common/Dialog";
import Select from "@/components/common/Select";
import { useGetOrganizationMembersQuery } from "@/features/organizations/api/organizationApi";
import {
  useAddWorkspaceMemberMutation,
  useGetWorkspaceRolesQuery,
} from "@/features/workspaces/api/workspaceApi";
import { useToast } from "@/hooks";
import { getErrorMessage } from "@/lib";
import styles from "./AddWorkspaceMemberDialog.module.css";

interface AddWorkspaceMemberDialogProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: number;
  workspaceId: number;
}

export const AddWorkspaceMemberDialog = ({
  isOpen,
  onClose,
  organizationId,
  workspaceId,
}: AddWorkspaceMemberDialogProps) => {
  const { success: toastSuccess, error: toastError } = useToast();
  const [selectedEmail, setSelectedEmail] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState("");

  // Fetch organization members to invite from
  const { data: orgMembersData, isLoading: isLoadingOrgMembers } =
    useGetOrganizationMembersQuery(
      { organizationId, pageSize: 50 },
      { skip: !isOpen || !organizationId },
    );

  // Fetch workspace roles
  const { data: rolesData, isLoading: isLoadingRoles } =
    useGetWorkspaceRolesQuery(organizationId, { skip: !isOpen || !organizationId });

  const [addWorkspaceMember, { isLoading: isSubmitting }] =
    useAddWorkspaceMemberMutation();

  const orgMembers = orgMembersData?.data?.items ?? [];
  const roles = rolesData?.data ?? [];

  const memberOptions = useMemo(
    () =>
      orgMembers.map((m) => ({
        label: `${m.fullName} (${m.email}) - Org ${m.roleName}`,
        value: m.email,
      })),
    [orgMembers],
  );

  const roleOptions = useMemo(
    () =>
      roles.map((r) => ({
        label: r.roleName,
        value: String(r.roleId),
      })),
    [roles],
  );

  useEffect(() => {
    if (roles.length > 0 && !selectedRoleId) {
      // Default to Member role or first role
      const defaultRole = roles.find((r) => r.roleName.toLowerCase() === "member") || roles[0];
      setSelectedRoleId(String(defaultRole.roleId));
    }
  }, [roles, selectedRoleId]);

  const handleClose = () => {
    setSelectedEmail("");
    setSelectedRoleId(roles.length > 0 ? String(roles[0].roleId) : "");
    onClose();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!selectedEmail) {
      toastError("Please select a member to add");
      return;
    }

    if (!selectedRoleId) {
      toastError("Please select a role");
      return;
    }

    try {
      await addWorkspaceMember({
        organizationId,
        workspaceId,
        email: selectedEmail,
        roleId: Number(selectedRoleId),
      }).unwrap();

      toastSuccess("Member added to workspace successfully");
      handleClose();
    } catch (err) {
      const msg = getErrorMessage(err);
      toastError(msg);
    }
  };

  const activeRoleDescription = roles.find(
    (r) => String(r.roleId) === selectedRoleId,
  )?.description;

  return (
    <Dialog open={isOpen} onClose={handleClose} title="Add Member to Workspace">
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label className={styles.label}>Select Organization Member *</label>
          <Select
            value={selectedEmail}
            onChange={(val) =>
              setSelectedEmail(
                typeof val === "string" ? val : (val as any).target.value,
              )
            }
            options={memberOptions}
            disabled={isLoadingOrgMembers || isSubmitting}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Assign Workspace Role *</label>
          <Select
            value={selectedRoleId}
            onChange={(val) =>
              setSelectedRoleId(
                typeof val === "string" ? val : (val as any).target.value,
              )
            }
            options={roleOptions}
            disabled={isLoadingRoles || isSubmitting}
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
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={isSubmitting}>
            Add Member
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
