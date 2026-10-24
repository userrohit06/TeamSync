"use client";

import { FormEvent, useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";
import Button from "@/components/common/Button";
import Dialog from "@/components/common/Dialog";
import Select from "@/components/common/Select";
import { useGetOrganizationMembersQuery } from "@/features/organizations/api/organizationApi";
import {
  useGetWorkspaceRolesQuery,
  useTransferWorkspaceOwnershipMutation,
} from "@/features/workspaces/api/workspaceApi";
import { WorkspaceDetails, WorkspaceItem } from "@/features/workspaces/types/workspace.types";
import { useToast } from "@/hooks";
import { getErrorMessage } from "@/lib";
import styles from "./TransferWorkspaceOwnershipDialog.module.css";

interface TransferWorkspaceOwnershipDialogProps {
  isOpen: boolean;
  onClose: () => void;
  workspace: WorkspaceDetails | WorkspaceItem | null;
}

export const TransferWorkspaceOwnershipDialog = ({
  isOpen,
  onClose,
  workspace,
}: TransferWorkspaceOwnershipDialogProps) => {
  const { success: toastSuccess, error: toastError } = useToast();
  const [selectedUserId, setSelectedUserId] = useState("");
  const [previousOwnerRoleId, setPreviousOwnerRoleId] = useState("2"); // default Member

  const organizationId = workspace?.organizationId ?? 0;
  const workspaceId = workspace?.workspaceId ?? 0;

  const { data: orgMembersData, isLoading: isLoadingOrgMembers } =
    useGetOrganizationMembersQuery(
      { organizationId, pageSize: 50 },
      { skip: !isOpen || !organizationId },
    );

  const { data: rolesData, isLoading: isLoadingRoles } =
    useGetWorkspaceRolesQuery(organizationId, { skip: !isOpen || !organizationId });

  const [transferOwnership, { isLoading: isSubmitting }] =
    useTransferWorkspaceOwnershipMutation();

  const orgMembers = orgMembersData?.data?.items ?? [];
  const roles = rolesData?.data ?? [];

  const recipientOptions = useMemo(
    () =>
      orgMembers.map((m) => ({
        label: `${m.fullName} (${m.email})`,
        value: String(m.userId),
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

  const handleClose = () => {
    setSelectedUserId("");
    onClose();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!workspace) return;

    if (!selectedUserId) {
      toastError("Please select a new workspace owner");
      return;
    }

    try {
      await transferOwnership({
        organizationId,
        workspaceId,
        newOwnerUserId: Number(selectedUserId),
        previousOwnerNewRoleId: previousOwnerRoleId ? Number(previousOwnerRoleId) : undefined,
      }).unwrap();

      toastSuccess("Workspace ownership transferred successfully");
      handleClose();
    } catch (err) {
      const msg = getErrorMessage(err);
      toastError(msg);
    }
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} title="Transfer Workspace Ownership">
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.warningBox}>
          <AlertTriangle size={18} color="var(--warning)" style={{ flexShrink: 0 }} />
          <span>
            Transferring ownership gives the new owner full administrative control of this
            workspace. You will receive the role specified below.
          </span>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Select New Owner *</label>
          <Select
            value={selectedUserId}
            onChange={(val) =>
              setSelectedUserId(
                typeof val === "string" ? val : (val as any).target.value,
              )
            }
            options={recipientOptions}
            disabled={isLoadingOrgMembers || isSubmitting}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Your New Role in this Workspace</label>
          <Select
            value={previousOwnerRoleId}
            onChange={(val) =>
              setPreviousOwnerRoleId(
                typeof val === "string" ? val : (val as any).target.value,
              )
            }
            options={roleOptions}
            disabled={isLoadingRoles || isSubmitting}
          />
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
            Transfer Ownership
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
