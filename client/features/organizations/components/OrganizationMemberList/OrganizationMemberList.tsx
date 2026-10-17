"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Crown,
  Mail,
  ShieldCheck,
  UserCog,
  UserMinus,
  UserPlus,
} from "lucide-react";

import Avatar from "@/components/common/Avatar";
import Button from "@/components/common/Button";
import PageHeader from "@/components/common/PageHeader";
import StatusBadge from "@/components/common/StatusBadge";
import {
  useGetOrganizationIdQuery,
  useGetOrganizationMembersQuery,
  useRemoveMemberMutation,
} from "@/features/organizations/api/organizationApi";

import styles from "./OrganizationMemberList.module.css";
import { PageSize } from "@/types";
import DataTable, {
  DataTableColumn,
} from "@/components/common/DataTable/DataTable";
import { OrganizationMember } from "@/features/organizations/types/organization.types";
import { AddMemberDialog } from "@/features/organizations/components/AddMemberDialog/AddMemberDialog";
import { UpdateMemberRoleDialog } from "@/features/organizations/components/UpdateMemberRoleDialog/UpdateMemberRoleDialog";
import { useToast } from "@/hooks";
import { useAppSelector } from "@/store";
import { getErrorMessage } from "@/lib";
import { ConfirmDialog } from "@/components";
import { TransferOwnershipDialog } from "@/features/organizations/components/TransferOwnershipDialog/TransferOwnershipDialog";

const PAGE_SIZE_OPTIONS: PageSize[] = [10, 20, 50, 100];

interface OrganizationMemberListProps {
  organizationId: number;
}

export const OrganizationMemberList = ({
  organizationId,
}: OrganizationMemberListProps) => {
  const { success: toastSuccess, error: toastError } = useToast();
  const currentLoggedInUserId = useAppSelector(
    (state) => state.auth.user?.UserId,
  );

  const [pageSize, setPageSize] = useState<PageSize>(10);
  const [currentCursor, setCurrentCursor] = useState<string | undefined>(
    undefined,
  );
  const [cursorHistory, setCursorHistory] = useState<(string | undefined)[]>(
    [],
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [selectedMemberForRole, setSelectedMemberForRole] =
    useState<OrganizationMember | null>(null);
  const [memberToRemove, setMemberToRemove] =
    useState<OrganizationMember | null>(null);
  const [memberForOwnershipTransfer, setMemberForOwnershipTransfer] =
    useState<OrganizationMember | null>(null);

  const { data, isLoading, isFetching, error, refetch } =
    useGetOrganizationMembersQuery({
      organizationId,
      pageSize,
      cursor: currentCursor,
      searchTerm: searchTerm.trim() || undefined,
    });

  const [removeMember, { isLoading: isRemoving }] = useRemoveMemberMutation();

  const { data: orgData } = useGetOrganizationIdQuery(organizationId);
  const currentUserRole = orgData?.data.currentUserRole.toLowerCase();
  const canManageMembers =
    currentUserRole === "owner" || currentUserRole === "admin";
  const isOwner = currentUserRole === "owner";

  const pagedResult = data?.data;
  const members = pagedResult?.items ?? [];
  const hasNextPage = Boolean(
    pagedResult?.hasNextPage && pagedResult?.nextCursor,
  );
  const hasPreviousPage = cursorHistory.length > 0;

  const handleNextPage = () => {
    if (!pagedResult?.nextCursor) return;
    setCursorHistory((prev) => [...prev, currentCursor]);
    setCurrentCursor(pagedResult.nextCursor);
  };

  const handlePreviousPage = () => {
    if (!cursorHistory.length) return;
    const previousCursor = cursorHistory[cursorHistory.length - 1];
    setCursorHistory((prev) => prev.slice(0, -1));
    setCurrentCursor(previousCursor);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentCursor(undefined);
    setCursorHistory([]);
  };

  const handlePageSizeChange = (newSize: PageSize) => {
    setPageSize(newSize);
    setCurrentCursor(undefined);
    setCursorHistory([]);
  };

  const handleCofirmRemove = async () => {
    if (!memberToRemove) return;

    try {
      await removeMember({
        organizationId,
        targetUserId: memberToRemove.userId,
      }).unwrap();

      toastSuccess(`${memberToRemove.fullName} removed from organization`);
      setMemberToRemove(null);
    } catch (error) {
      const msg = getErrorMessage(error);
      toastError(msg);
    }
  };

  const columns: DataTableColumn<OrganizationMember>[] = useMemo(
    () => [
      {
        key: "user",
        header: "Member",
        render: (row) => (
          <div className={styles.userCell}>
            <Avatar
              src={row.profilePhotoUrl ?? undefined}
              name={row.fullName}
              size="medium"
            />
            <div className={styles.userInfo}>
              <span className={styles.userName}>{row.fullName}</span>
              <span className={styles.userEmail}>
                <Mail size={12} /> {row.email}
              </span>
            </div>
          </div>
        ),
      },
      {
        key: "role",
        header: "Role",
        render: (row) => (
          <div className={styles.roleCell}>
            <span
              className={
                row.roleName.toLowerCase() === "owner"
                  ? styles.ownerBadge
                  : styles.roleBadge
              }
            >
              <ShieldCheck size={13} /> {row.roleName}
            </span>
            <span className={styles.roleDesc} title={row.roleDescription}>
              {row.roleDescription}
            </span>
          </div>
        ),
      },
      {
        key: "status",
        header: "Status",
        align: "center",
        render: (row) => (
          <StatusBadge
            variant={
              row.membershipStatus.toLowerCase() === "active"
                ? "success"
                : "warning"
            }
          >
            {row.membershipStatus}
          </StatusBadge>
        ),
      },
      {
        key: "joinedAt",
        header: "Joined On",
        align: "right",
        render: (row) => (
          <span className={styles.dateCell}>
            {new Date(row.joinedAt).toLocaleDateString(undefined, {
              dateStyle: "medium",
            })}
          </span>
        ),
      },
      {
        key: "actions",
        header: "Actions",
        align: "right",
        render: (row) => {
          const isTargetOwner = row.roleName.toLowerCase() === "owner";
          const isTargetAdmin = row.roleName.toLowerCase() === "admin";
          const isCurrentUserOwner = currentUserRole === "owner";
          const isCurrentUserAdmin = currentUserRole === "admin";

          // 1. Transfer ownership:
          // Only visible to owner of the organization, and on rows where target is NOT owner
          const canTransfer = isCurrentUserOwner && !isTargetOwner;

          // 2. Change role:
          // - If current user is Owner: show on every row except owner
          // - If current user is Admin: show on every row except owner and admin
          const canChangeRole =
            (isCurrentUserOwner && !isTargetOwner) ||
            (isCurrentUserAdmin && !isTargetOwner && !isTargetAdmin);

          // 3. Remove:
          // Same conditions as Change Role
          const canRemove = canChangeRole;

          // If no action applies to this row, render nothing
          if (!canTransfer && !canChangeRole && !canRemove) return null;

          return (
            <div
              className={styles.actionRow}
              onClick={(e) => e.stopPropagation()}
            >
              {canTransfer && (
                <button
                  type="button"
                  className={`${styles.actionBtn} ${styles.transferActionBtn}`}
                  onClick={() => setMemberForOwnershipTransfer(row)}
                  title="Transfer Ownership"
                >
                  <Crown size={15} />
                  <span>Transfer</span>
                </button>
              )}

              {canChangeRole && (
                <button
                  type="button"
                  className={styles.actionBtn}
                  onClick={() => setSelectedMemberForRole(row)}
                  title="Change Role"
                >
                  <UserCog size={15} />
                  <span>Change Role</span>
                </button>
              )}

              {canRemove && (
                <button
                  type="button"
                  className={`${styles.actionBtn} ${styles.removeActionBtn}`}
                  onClick={() => setMemberToRemove(row)}
                  title="Remove Member"
                >
                  <UserMinus size={15} />
                  <span>Remove</span>
                </button>
              )}
            </div>
          );
        },
      },
    ],
    [canManageMembers, currentLoggedInUserId],
  );

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <h3>Failed to load organization members</h3>
        <p>Could not retrieve membership records.</p>
        <button
          type="button"
          onClick={() => refetch()}
          className={styles.retryBtn}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Link
        href={`/organizations/${organizationId}`}
        className={styles.backLink}
      >
        <ArrowLeft size={16} /> Back to Organization
      </Link>

      <PageHeader
        title="Organization Members"
        description="View and oversee users collaborating in this organization"
        action={
          <Button
            variant="primary"
            size="medium"
            onClick={() => setIsAddMemberOpen(true)}
          >
            <UserPlus size={16} /> Invite Member
          </Button>
        }
      />

      <div className={styles.filterBar}>
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          className={styles.searchInput}
        />

        <select
          value={pageSize}
          onChange={(e) =>
            handlePageSizeChange(Number(e.target.value) as PageSize)
          }
          className={styles.pageSizeSelect}
        >
          {PAGE_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>
              {size} per page
            </option>
          ))}
        </select>
      </div>

      <DataTable<OrganizationMember>
        columns={columns}
        data={members}
        rowKey={(row: OrganizationMember) => row.organizationMemberId}
        loading={isLoading}
        emptyTitle="No members found"
        emptyDescription={
          searchTerm
            ? `No members matching "${searchTerm}".`
            : "No active members found in this organization."
        }
      />

      {members.length > 0 && (
        <div className={styles.paginationBar}>
          <div className={styles.statusGroup}>
            <span className={styles.pageInfo}>
              Showing page {cursorHistory.length + 1}
            </span>
            {isFetching && !isLoading && (
              <span className={styles.fetchingBadge}>Syncing...</span>
            )}
          </div>

          <div className={styles.paginationControls}>
            <button
              type="button"
              className={styles.paginationBtn}
              onClick={handlePreviousPage}
              disabled={!hasPreviousPage || isFetching}
            >
              Previous
            </button>
            <button
              type="button"
              className={styles.paginationBtn}
              onClick={handleNextPage}
              disabled={!hasNextPage || isFetching}
            >
              Next
            </button>
          </div>
        </div>
      )}

      <AddMemberDialog
        isOpen={isAddMemberOpen}
        onClose={() => setIsAddMemberOpen(false)}
        organizationId={organizationId}
      />

      <UpdateMemberRoleDialog
        isOpen={Boolean(selectedMemberForRole)}
        onClose={() => setSelectedMemberForRole(null)}
        organizationId={organizationId}
        member={selectedMemberForRole}
      />

      <ConfirmDialog
        open={Boolean(memberToRemove)}
        onClose={() => setMemberToRemove(null)}
        onConfirm={handleCofirmRemove}
        title="Remove Member"
        description={`Are you sure want to remove ${memberToRemove?.fullName} (${memberToRemove?.email}) from this organization? They will immediately lose all workspace access.`}
        variant="danger"
        loading={isRemoving}
      />

      <TransferOwnershipDialog
        isOpen={Boolean(memberForOwnershipTransfer)}
        onClose={() => setMemberForOwnershipTransfer(null)}
        organizationId={organizationId}
        targetMember={memberForOwnershipTransfer}
      />
    </div>
  );
};
