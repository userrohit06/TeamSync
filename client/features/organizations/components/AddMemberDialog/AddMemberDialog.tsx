"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Shield } from "lucide-react";

import Button from "@/components/common/Button";
import Dialog from "@/components/common/Dialog";
import Select from "@/components/common/Select";
import {
  useAddMemberMutation,
  useGetOrganizationRolesQuery,
} from "@/features/organizations/api/organizationApi";
import { useGetUsersQuery } from "@/features/users/api/userApi";
import { useToast } from "@/hooks";
import { getErrorMessage } from "@/lib";

import styles from "./AddMemberDialog.module.css";

interface AddMemberDialogProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: number;
}

export const AddMemberDialog = ({
  isOpen,
  onClose,
  organizationId,
}: AddMemberDialogProps) => {
  const { success: toastSuccess, error: toastError } = useToast();

  const [selectedUserEmail, setSelectedUserEmail] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch active users list
  const { data: userData, isLoading: isLoadingUsers } = useGetUsersQuery(
    {
      pageSize: 50,
      mode: "Active",
    },
    { skip: !isOpen },
  );

  // Fetch roles (excluding owner)
  const { data: rolesData, isLoading: isLoadingRoles } =
    useGetOrganizationRolesQuery({ excludeOwner: true }, { skip: !isOpen });

  const [addMember, { isLoading: isSubmitting }] = useAddMemberMutation();

  const users = userData?.data?.items ?? [];
  const roles = rolesData?.data ?? [];

  // Map users into Select options
  const userOptions = useMemo(
    () =>
      users.map((u) => ({
        label: `${u.fullName} (${u.email})`,
        value: u.email,
      })),
    [users],
  );

  // Map roles into Select options
  const roleOptions = useMemo(
    () =>
      roles.map((r) => ({
        label: r.roleName,
        value: String(r.roleId),
      })),
    [roles],
  );

  // Set default role when options load
  useEffect(() => {
    if (roles.length > 0 && !selectedRoleId) {
      setSelectedRoleId(String(roles[0].roleId));
    }
  }, [roles, selectedRoleId]);

  const handleClose = () => {
    setSelectedUserEmail("");
    setSelectedRoleId(roles.length > 0 ? String(roles[0].roleId) : "");
    setFormError(null);
    onClose();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!selectedUserEmail) {
      setFormError("Please select a user to add.");
      return;
    }

    if (!selectedRoleId) {
      setFormError("Please select a role.");
      return;
    }

    try {
      setFormError(null);
      await addMember({
        organizationId,
        email: selectedUserEmail,
        roleId: Number(selectedRoleId),
      }).unwrap();

      toastSuccess("Member added successfully");
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
    <Dialog open={isOpen} onClose={handleClose} title="Add Member">
      <form onSubmit={handleSubmit} className={styles.form}>
        {/* User Selection using Custom Select */}
        <div className={styles.fieldTop}>
          <label className={styles.label}>Select User *</label>
          <Select
            value={selectedUserEmail}
            onChange={(val) =>
              setSelectedUserEmail(
                typeof val === "string" ? val : (val as any).target.value,
              )
            }
            options={userOptions}
            // placeholder={
            //   isLoadingUsers ? "Loading users..." : "Search and select a user"
            // }
            disabled={isLoadingUsers || isSubmitting}
          />
        </div>

        {/* Role Selection using Custom Select */}
        <div className={styles.fieldBottom}>
          <label className={styles.label}>Assign Role *</label>
          <Select
            value={selectedRoleId}
            onChange={(val) =>
              setSelectedRoleId(
                typeof val === "string" ? val : (val as any).target.value,
              )
            }
            options={roleOptions}
            // placeholder={
            //   isLoadingRoles ? "Loading roles..." : "Select role"
            // }
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
