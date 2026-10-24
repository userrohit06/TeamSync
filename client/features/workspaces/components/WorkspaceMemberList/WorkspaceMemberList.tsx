"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  Shield,
  Trash2,
  UserPlus,
} from "lucide-react";
import Avatar from "@/components/common/Avatar";
import Button from "@/components/common/Button";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import DataTable, { DataTableColumn } from "@/components/common/DataTable/DataTable";
import Input from "@/components/common/Input";
import PageHeader from "@/components/common/PageHeader";
import Select from "@/components/common/Select";
import { useGetMyOrganizationsQuery } from "@/features/organizations/api/organizationApi";
import {
  useGetWorkspaceByIdQuery,
  useGetWorkspaceMembersQuery,
  useRemoveWorkspaceMemberMutation,
} from "@/features/workspaces/api/workspaceApi";
import { WorkspaceMember } from "@/features/workspaces/types/workspace.types";
import { useToast } from "@/hooks";
import { getErrorMessage } from "@/lib";
import { PageSize } from "@/types";
import { AddWorkspaceMemberDialog } from "../AddWorkspaceMemberDialog";
import { UpdateWorkspaceMemberRoleDialog } from "../UpdateWorkspaceMemberRoleDialog";
import styles from "./WorkspaceMemberList.module.css";

const PAGE_SIZE_OPTIONS: PageSize[] = [10, 20, 50, 100];

interface WorkspaceMemberListProps {
  organizationId?: number;
  workspaceId: number;
}

export const WorkspaceMemberList = ({
  organizationId: propOrgId,
  workspaceId,
}: WorkspaceMemberListProps) => {
  const searchParams = useSearchParams();
  const orgParam = searchParams.get("orgId");

  const { data: orgData } = useGetMyOrganizationsQuery({ pageSize: 50 });
  const fallbackOrgId = orgData?.data?.items?.[0]?.organizationId ?? 0;
  const organizationId = propOrgId || (orgParam ? Number(orgParam) : fallbackOrgId);

  const { success: toastSuccess, error: toastError } = useToast();

  const [pageSize, setPageSize] = useState<PageSize>(20);
  const [currentCursor, setCurrentCursor] = useState<string | undefined>(undefined);
  const [cursorHistory, setCursorHistory] = useState<(string | undefined)[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingRoleMember, setEditingRoleMember] = useState<WorkspaceMember | null>(null);
  const [removingMember, setRemovingMember] = useState<WorkspaceMember | null>(null);

  const { data: wsData } = useGetWorkspaceByIdQuery({ organizationId, workspaceId });
  const workspaceName = wsData?.data?.name || "Workspace";
  const currentUserRole = wsData?.data?.currentUserWorkspaceRole?.toLowerCase() || "";
  const isAdmin = currentUserRole === "admin" || currentUserRole === "owner";

  const { data, isLoading, isFetching, error, refetch } = useGetWorkspaceMembersQuery({
    organizationId,
    workspaceId,
    pageSize,
    cursor: currentCursor,
    searchTerm: searchTerm.trim() || undefined,
  });

  const [removeMember, { isLoading: isRemoving }] = useRemoveWorkspaceMemberMutation();

  const pagedResult = data?.data;
  const members = pagedResult?.items ?? [];
  const hasNextPage = Boolean(pagedResult?.hasNextPage && pagedResult?.nextCursor);
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

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setCurrentCursor(undefined);
    setCursorHistory([]);
  };

  const handlePageSizeChange = (val: PageSize) => {
    setPageSize(val);
    setCurrentCursor(undefined);
    setCursorHistory([]);
  };

  const handleRemove = async () => {
    if (!removingMember) return;
    try {
      await removeMember({
        organizationId,
        workspaceId,
        targetUserId: removingMember.userId,
      }).unwrap();
      toastSuccess(`Removed ${removingMember.fullName} from workspace`);
      setRemovingMember(null);
    } catch (err) {
      const msg = getErrorMessage(err);
      toastError(msg);
    }
  };

  const columns: DataTableColumn<WorkspaceMember>[] = useMemo(
    () => [
      {
        key: "user",
        header: "Member",
        render: (row) => (
          <div className={styles.userCell}>
            <Avatar name={row.fullName} src={row.profilePhoto || undefined} size="small" />
            <div className={styles.userInfo}>
              <span className={styles.userName}>{row.fullName}</span>
              <span className={styles.userEmail}>{row.email}</span>
            </div>
          </div>
        ),
      },
      {
        key: "workspaceRole",
        header: "Workspace Role",
        align: "center",
        render: (row) => (
          <span
            className={`${styles.roleBadge} ${
              row.workspaceRole.toLowerCase() === "admin" ? styles.adminBadge : ""
            }`}
          >
            <Shield size={11} /> {row.workspaceRole}
          </span>
        ),
      },
      {
        key: "orgRole",
        header: "Org Role",
        align: "center",
        render: (row) => (
          <span className={styles.typeBadge}>
            {row.organizationRole || "Member"}
          </span>
        ),
      },
      {
        key: "membershipType",
        header: "Access Type",
        align: "center",
        render: (row) => (
          <span
            className={`${styles.typeBadge} ${
              row.isExplicit ? styles.explicitBadge : ""
            }`}
          >
            {row.isExplicit ? "Explicit Member" : "Org Inherited"}
          </span>
        ),
      },
      {
        key: "joinedAt",
        header: "Joined",
        render: (row) => (
          <span className={styles.dateCell}>
            {row.joinedAt
              ? new Date(row.joinedAt).toLocaleDateString(undefined, {
                  dateStyle: "medium",
                })
              : "Inherited"}
          </span>
        ),
      },
      {
        key: "actions",
        header: "Actions",
        align: "right",
        render: (row) => {
          if (!isAdmin) return null;

          return (
            <div className={styles.actionRow} onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className={styles.actionBtn}
                title="Change Role"
                onClick={() => setEditingRoleMember(row)}
              >
                <Pencil size={12} /> Edit Role
              </button>

              {row.isExplicit && (
                <button
                  type="button"
                  className={`${styles.actionBtn} ${styles.removeActionBtn}`}
                  title="Remove from Workspace"
                  onClick={() => setRemovingMember(row)}
                >
                  <Trash2 size={12} /> Remove
                </button>
              )}
            </div>
          );
        },
      },
    ],
    [isAdmin],
  );

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <h3>Failed to load members</h3>
        <p>Could not retrieve workspace members list.</p>
        <button type="button" onClick={() => refetch()} className={styles.retryBtn}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Link href={`/workspaces/${workspaceId}?orgId=${organizationId}`} className={styles.backLink}>
        <ArrowLeft size={15} /> Back to {workspaceName}
      </Link>

      <PageHeader
        title={`${workspaceName} Members`}
        description="View and manage team members and access roles for this workspace"
        action={
          isAdmin ? (
            <Button
              variant="primary"
              size="small"
              onClick={() => setIsAddOpen(true)}
            >
              <UserPlus size={14} /> Add Member
            </Button>
          ) : undefined
        }
      />

      {/* Filter and controls */}
      <div className={styles.filterBar}>
        <div className={styles.searchInput}>
          <Input
            inputSize="small"
            placeholder="Search members by name or email..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>

        <div className={styles.pageSizeSelect}>
          <Select
            value={pageSize.toString()}
            onChange={(val) =>
              handlePageSizeChange(
                Number(
                  typeof val === "string" ? val : (val as any).target.value,
                ) as PageSize,
              )
            }
            options={PAGE_SIZE_OPTIONS.map((size) => ({
              label: `${size} / page`,
              value: size.toString(),
            }))}
          />
        </div>
      </div>

      {/* Table */}
      <DataTable<WorkspaceMember>
        columns={columns}
        data={members}
        rowKey={(item: WorkspaceMember) => item.userId}
        loading={isLoading || isFetching}
        emptyTitle={searchTerm ? "No matching members" : "No members found"}
        emptyDescription={
          searchTerm
            ? "Try adjusting your search criteria."
            : "No members have joined this workspace yet."
        }
      />

      {/* Pagination Bar */}
      <div className={styles.paginationBar}>
        <div className={styles.pageInfo}>
          <span>Showing {members.length} member(s)</span>
          {isFetching && <span className={styles.fetchingBadge}>Updating...</span>}
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

      {/* Add Member Dialog */}
      <AddWorkspaceMemberDialog
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        organizationId={organizationId}
        workspaceId={workspaceId}
      />

      {/* Update Role Dialog */}
      <UpdateWorkspaceMemberRoleDialog
        isOpen={Boolean(editingRoleMember)}
        onClose={() => setEditingRoleMember(null)}
        organizationId={organizationId}
        workspaceId={workspaceId}
        member={editingRoleMember}
      />

      {/* Remove Member Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(removingMember)}
        onClose={() => setRemovingMember(null)}
        onConfirm={handleRemove}
        title="Remove Member from Workspace"
        description={`Are you sure you want to remove "${removingMember?.fullName}" from this workspace? They will lose explicit workspace access.`}
        confirmText="Remove Member"
        variant="danger"
        loading={isRemoving}
      />
    </div>
  );
};
