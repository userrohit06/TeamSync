"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Shield } from "lucide-react";

import Avatar from "@/components/common/Avatar";
import Button from "@/components/common/Button";
import Dialog from "@/components/common/Dialog";
import Select from "@/components/common/Select";
import {
  useGetOrganizationRolesQuery,
  useUpdateMemberRoleMutation,
} from "@/features/organizations/api/organizationApi";
import { OrganizationMember } from "@/features/organizations/types/organization.types";
import { useToast } from "@/hooks";
import { getErrorMessage } from "@/lib";

import styles from "./UpdateMemberRoleDialog.module.css";

interface UpdateMemberRoleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: number;
  member: OrganizationMember | null;
}

export const UpdateMemberRoleDialog = ({
  isOpen,
  onClose,
  organizationId,
  member,
}: UpdateMemberRoleDialogProps) => {
  const { success: toastSuccess, error: toastError } = useToast();
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch available roles excluding Owner
  const { data: rolesData, isLoading: isLoadingRoles } =
    useGetOrganizationRolesQuery({ excludeOwner: true }, { skip: !isOpen });

  const [updateMemberRole, { isLoading: isUpdating }] =
    useUpdateMemberRoleMutation();

  const roles = rolesData?.data ?? [];

  // Transform roles to Select options format
  const roleOptions = useMemo(
    () =>
      roles.map((r) => ({
        label: r.roleName,
        value: String(r.roleId),
      })),
    [roles],
  );

  // Pre-select the member's current role
  useEffect(() => {
    if (member && isOpen) {
      setSelectedRoleId(String(member.roleId));
      setFormError(null);
    }
  }, [member, isOpen]);

  const handleClose = () => {
    setFormError(null);
    onClose();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!member) return;

    if (!selectedRoleId) {
      setFormError("Please select a role.");
      return;
    }

    try {
      setFormError(null);
      await updateMemberRole({
        organizationId,
        targetUserId: member.userId,
        roleId: Number(selectedRoleId),
      }).unwrap();

      toastSuccess(`Role updated for ${member.fullName}`);
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
    <Dialog open={isOpen} onClose={handleClose} title="Change Member Role">
      <form onSubmit={handleSubmit} className={styles.form}>
        {formError && <div className={styles.errorMessage}>{formError}</div>}

        {member && (
          <div className={styles.memberCard}>
            <Avatar
              src={member.profilePhotoUrl ?? undefined}
              name={member.fullName}
              size="medium"
            />
            <div className={styles.memberInfo}>
              <strong>{member.fullName}</strong>
              <span>{member.email}</span>
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
            placeholder={isLoadingRoles ? "Loading roles..." : "Choose a role"}
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
            onClick={handleClose}
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
