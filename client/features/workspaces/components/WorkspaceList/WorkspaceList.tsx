"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  Globe,
  Lock,
  Pencil,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import { Button, Input, Select } from "@/components";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import DataTable, { DataTableColumn } from "@/components/common/DataTable/DataTable";
import PageHeader from "@/components/common/PageHeader";
import { useGetMyOrganizationsQuery } from "@/features/organizations/api/organizationApi";
import {
  useDeleteWorkspaceMutation,
  useGetWorkspacesQuery,
} from "@/features/workspaces/api/workspaceApi";
import { WorkspaceItem } from "@/features/workspaces/types/workspace.types";
import { useToast } from "@/hooks";
import { getErrorMessage } from "@/lib";
import { PageSize } from "@/types";
import { CreateWorkspaceDialog } from "../CreateWorkspaceDialog";
import { EditWorkspaceDialog } from "../EditWorkspaceDialog";
import styles from "./WorkspaceList.module.css";

const PAGE_SIZE_OPTIONS: PageSize[] = [10, 20, 50, 100];

interface WorkspaceListProps {
  organizationId?: number;
}

export const WorkspaceList = ({ organizationId: initialOrgId }: WorkspaceListProps) => {
  const { success: toastSuccess, error: toastError } = useToast();

  // Load organizations for switcher if not provided or to allow switching
  const { data: orgData, isLoading: isLoadingOrgs } = useGetMyOrganizationsQuery({
    pageSize: 50,
  });
  const orgList = orgData?.data?.items ?? [];

  const [selectedOrgId, setSelectedOrgId] = useState<number>(initialOrgId || 0);

  useEffect(() => {
    if (initialOrgId) {
      setSelectedOrgId(initialOrgId);
    } else if (orgList.length > 0 && selectedOrgId === 0) {
      setSelectedOrgId(orgList[0].organizationId);
    }
  }, [initialOrgId, orgList, selectedOrgId]);

  const [pageSize, setPageSize] = useState<PageSize>(10);
  const [currentCursor, setCurrentCursor] = useState<string | undefined>(undefined);
  const [cursorHistory, setCursorHistory] = useState<(string | undefined)[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState<WorkspaceItem | null>(null);
  const [deletingWorkspace, setDeletingWorkspace] = useState<WorkspaceItem | null>(null);

  const { data, isLoading, isFetching, error, refetch } = useGetWorkspacesQuery(
    {
      organizationId: selectedOrgId,
      pageSize,
      cursor: currentCursor,
      searchTerm: searchTerm.trim() || undefined,
    },
    { skip: !selectedOrgId },
  );

  const [deleteWorkspace, { isLoading: isDeleting }] = useDeleteWorkspaceMutation();

  const pagedResult = data?.data;
  const workspaces = pagedResult?.items ?? [];
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

  const handleOrgChange = (newOrgIdStr: string) => {
    const id = Number(newOrgIdStr);
    setSelectedOrgId(id);
    setCurrentCursor(undefined);
    setCursorHistory([]);
  };

  const handleDelete = async () => {
    if (!deletingWorkspace) return;
    try {
      await deleteWorkspace({
        organizationId: deletingWorkspace.organizationId,
        workspaceId: deletingWorkspace.workspaceId,
      }).unwrap();
      toastSuccess(`Workspace "${deletingWorkspace.name}" deleted successfully`);
      setDeletingWorkspace(null);
    } catch (err) {
      const msg = getErrorMessage(err);
      toastError(msg);
    }
  };

  const orgSelectOptions = useMemo(
    () =>
      orgList.map((org) => ({
        label: org.name,
        value: String(org.organizationId),
      })),
    [orgList],
  );

  const columns: DataTableColumn<WorkspaceItem>[] = useMemo(
    () => [
      {
        key: "name",
        header: "Workspace",
        render: (row) => (
          <div className={styles.wsCell}>
            <div className={styles.wsIconFallback}>
              {row.name.charAt(0).toUpperCase()}
            </div>
            <div className={styles.wsDetails}>
              <Link
                href={`/workspaces/${row.workspaceId}?orgId=${row.organizationId}`}
                className={styles.wsNameLink}
                onClick={(e) => e.stopPropagation()}
              >
                {row.name}
              </Link>
              <span className={styles.wsSlug}>{row.slug}</span>
            </div>
          </div>
        ),
      },
      {
        key: "description",
        header: "Description",
        render: (row) => (
          <span className={styles.wsDescription}>
            {row.description?.trim() ? row.description : "No description"}
          </span>
        ),
      },
      {
        key: "visibility",
        header: "Visibility",
        align: "center",
        render: (row) =>
          row.isPrivate ? (
            <span className={`${styles.visibilityBadge} ${styles.privateBadge}`}>
              <Lock size={12} /> Private
            </span>
          ) : (
            <span className={styles.visibilityBadge}>
              <Globe size={12} /> Public
            </span>
          ),
      },
      {
        key: "role",
        header: "Your Role",
        align: "center",
        render: (row) => (
          <span
            className={`${styles.roleBadge} ${
              row.currentUserWorkspaceRole?.toLowerCase() === "admin"
                ? styles.adminBadge
                : ""
            }`}
          >
            {row.currentUserWorkspaceRole || "Member"}
          </span>
        ),
      },
      {
        key: "createdAt",
        header: "Created",
        render: (row) => (
          <span className={styles.dateCell}>
            {new Date(row.createdAt).toLocaleDateString(undefined, {
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
          const isAdmin =
            row.currentUserWorkspaceRole?.toLowerCase() === "admin" ||
            row.currentUserWorkspaceRole?.toLowerCase() === "owner";

          return (
            <div className={styles.actionsCell} onClick={(e) => e.stopPropagation()}>
              <Link
                href={`/workspaces/${row.workspaceId}?orgId=${row.organizationId}`}
                className={styles.iconLink}
                title="Workspace Details"
              >
                <ArrowRight size={14} />
              </Link>

              <Link
                href={`/workspaces/${row.workspaceId}/members?orgId=${row.organizationId}`}
                className={styles.iconLink}
                title="Members"
              >
                <Users size={14} />
              </Link>

              {isAdmin && (
                <>
                  <button
                    type="button"
                    className={styles.iconLink}
                    title="Edit Workspace"
                    onClick={() => setEditingWorkspace(row)}
                  >
                    <Pencil size={13} />
                  </button>

                  <button
                    type="button"
                    className={`${styles.iconLink} ${styles.deleteBtn}`}
                    title="Delete Workspace"
                    onClick={() => setDeletingWorkspace(row)}
                  >
                    <Trash2 size={13} />
                  </button>
                </>
              )}
            </div>
          );
        },
      },
    ],
    [],
  );

  if (!isLoadingOrgs && orgList.length === 0) {
    return (
      <div className={styles.noOrgState}>
        <Briefcase size={36} color="var(--primary)" />
        <h3>No Organizations Found</h3>
        <p>You need to create or join an organization first before accessing workspaces.</p>
        <Link href="/organizations">
          <Button variant="primary" size="small">
            Go to Organizations
          </Button>
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <h3>Failed to load workspaces</h3>
        <p>Could not retrieve workspace records.</p>
        <button type="button" onClick={() => refetch()} className={styles.retryBtn}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <PageHeader
        title="Workspaces"
        description="Collaborate in isolated team workspaces with dedicated members and permissions"
        action={
          <Button
            variant="primary"
            size="small"
            onClick={() => setIsCreateOpen(true)}
            disabled={!selectedOrgId}
          >
            <Plus size={14} /> Create Workspace
          </Button>
        }
      />

      {/* Top Filter and Controls */}
      <div className={styles.topBar}>
        {orgList.length > 1 && !initialOrgId && (
          <div className={styles.orgSelectorWrapper}>
            <span className={styles.orgSelectLabel}>Organization:</span>
            <Select
              value={String(selectedOrgId)}
              onChange={(val) =>
                handleOrgChange(
                  typeof val === "string" ? val : (val as any).target.value,
                )
              }
              options={orgSelectOptions}
              disabled={isLoadingOrgs}
            />
          </div>
        )}

        <div className={styles.filterBar}>
          <div className={styles.searchInput}>
            <Input
              inputSize="small"
              placeholder="Search workspaces by name or slug..."
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
      </div>

      {/* Workspaces Table */}
      <DataTable<WorkspaceItem>
        columns={columns}
        data={workspaces}
        rowKey={(item: WorkspaceItem) => item.workspaceId}
        loading={isLoading || isFetching}
        emptyTitle={searchTerm ? "No matching workspaces" : "No workspaces found"}
        emptyDescription={
          searchTerm
            ? "No workspaces match your search filter."
            : "No workspaces available in this organization. Create one to get started!"
        }
      />

      {/* Keyset Pagination Bar */}
      <div className={styles.paginationBar}>
        <div className={styles.pageInfo}>
          <span>Showing {workspaces.length} workspace(s)</span>
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

      {/* Dialogs */}
      <CreateWorkspaceDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        organizationId={selectedOrgId}
      />

      <EditWorkspaceDialog
        isOpen={Boolean(editingWorkspace)}
        onClose={() => setEditingWorkspace(null)}
        workspace={editingWorkspace}
      />

      <ConfirmDialog
        open={Boolean(deletingWorkspace)}
        onClose={() => setDeletingWorkspace(null)}
        onConfirm={handleDelete}
        title="Delete Workspace"
        description={`Are you sure you want to delete "${deletingWorkspace?.name}"? All associated data within this workspace will be inaccessible.`}
        confirmText="Delete"
        variant="danger"
        loading={isDeleting}
      />
    </div>
  );
};
