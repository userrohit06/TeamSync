"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Crown, Shield } from "lucide-react";

import Avatar from "@/components/common/Avatar";
import Button from "@/components/common/Button";
import Dialog from "@/components/common/Dialog";
import Select from "@/components/common/Select";
import {
  useGetOrganizationRolesQuery,
  useTransferOwnershipMutation,
} from "@/features/organizations/api/organizationApi";
import { OrganizationMember } from "@/features/organizations/types/organization.types";
import { useToast } from "@/hooks";
import { getErrorMessage } from "@/lib";

import styles from "./TransferOwnershipDialog.module.css";

interface TransferOwnershipDialogProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: number;
  targetMember: OrganizationMember | null;
}

export const TransferOwnershipDialog = ({
  isOpen,
  onClose,
  organizationId,
  targetMember,
}: TransferOwnershipDialogProps) => {
  const { success: toastSuccess, error: toastError } = useToast();
  const [selectedNewRoleId, setSelectedNewRoleId] = useState<string>("");
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch non-owner roles (Admin, Member, etc.)
  const { data: rolesData, isLoading: isLoadingRoles } =
    useGetOrganizationRolesQuery({ excludeOwner: true }, { skip: !isOpen });

  const [transferOwnership, { isLoading: isSubmitting }] =
    useTransferOwnershipMutation();

  const roles = rolesData?.data ?? [];

  const roleOptions = useMemo(
    () =>
      roles.map((r) => ({
        label: r.roleName,
        value: String(r.roleId),
      })),
    [roles],
  );

  // Pre-select "Admin" role if found, or first available non-owner role
  useEffect(() => {
    if (roles.length > 0 && !selectedNewRoleId) {
      const adminRole = roles.find((r) => r.roleName.toLowerCase() === "admin");
      setSelectedNewRoleId(
        String(adminRole ? adminRole.roleId : roles[0].roleId),
      );
    }
  }, [roles, selectedNewRoleId]);

  const handleClose = () => {
    setFormError(null);
    onClose();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!targetMember) return;

    try {
      setFormError(null);
      await transferOwnership({
        organizationId,
        newOwnerUserId: targetMember.userId,
        previousOwnerNewRoleId: selectedNewRoleId
          ? Number(selectedNewRoleId)
          : undefined,
      }).unwrap();

      toastSuccess(
        `Ownership successfully transferred to ${targetMember.fullName}`,
      );
      handleClose();
    } catch (err) {
      const msg = getErrorMessage(err);
      setFormError(msg);
      toastError(msg);
    }
  };

  const activeRoleDescription = roles.find(
    (r) => String(r.roleId) === selectedNewRoleId,
  )?.description;

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      title="Transfer Organization Ownership"
    >
      <form onSubmit={handleSubmit} className={styles.form}>
        {formError && <div className={styles.errorMessage}>{formError}</div>}

        {/* Warning Alert Box */}
        <div className={styles.warningBox}>
          <AlertTriangle size={20} className={styles.warningIcon} />
          <div className={styles.warningContent}>
            <strong>Irreversible Action</strong>
            <p>
              Transferring ownership will grant complete administrative
              authority to the selected member. You will forfeit your owner
              status and be demoted.
            </p>
          </div>
        </div>

        {/* Target New Owner Display */}
        {targetMember && (
          <div className={styles.targetSection}>
            <span className={styles.label}>New Primary Owner</span>
            <div className={styles.memberCard}>
              <Avatar
                src={targetMember.profilePhotoUrl ?? undefined}
                name={targetMember.fullName}
                size="medium"
              />
              <div className={styles.memberInfo}>
                <div className={styles.nameRow}>
                  <strong>{targetMember.fullName}</strong>
                  <span className={styles.newBadge}>
                    <Crown size={12} /> New Owner
                  </span>
                </div>
                <span>{targetMember.email}</span>
              </div>
            </div>
          </div>
        )}

        {/* Selector for Current Owner's New Role */}
        <div className={styles.field}>
          <label className={styles.label}>Your New Role After Transfer</label>
          <Select
            value={selectedNewRoleId}
            onChange={(val) =>
              setSelectedNewRoleId(
                typeof val === "string" ? val : (val as any).target.value,
              )
            }
            options={roleOptions}
            placeholder={
              isLoadingRoles
                ? "Loading available roles..."
                : "Select your new role (defaults to Admin)"
            }
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
            Confirm Transfer
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
