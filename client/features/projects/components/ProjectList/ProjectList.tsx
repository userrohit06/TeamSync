"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Archive,
  ArchiveRestore,
  ExternalLink,
  Globe,
  Lock,
  Pencil,
  Plus,
  Tag,
  Trash2,
  Users,
} from "lucide-react";
import Avatar from "@/components/common/Avatar";
import Button from "@/components/common/Button";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import DataTable, {
  DataTableColumn,
} from "@/components/common/DataTable/DataTable";
import Input from "@/components/common/Input";
import PageHeader from "@/components/common/PageHeader";
import Select from "@/components/common/Select";
import StatusBadge from "@/components/common/StatusBadge";
import { useGetMyOrganizationsQuery } from "@/features/organizations/api/organizationApi";
import {
  useArchiveProjectMutation,
  useDeleteProjectMutation,
  useGetProjectsQuery,
  useGetProjectStatusesQuery,
  useRestoreArchivedProjectMutation,
} from "@/features/projects/api/projectApi";
import { ProjectItem } from "@/features/projects/types/project.types";
import { useGetWorkspacesQuery } from "@/features/workspaces/api/workspaceApi";
import { useToast } from "@/hooks";
import { getErrorMessage } from "@/lib";
import { PageSize } from "@/types";
import { ChangeProjectStatusDialog } from "../ChangeProjectStatusDialog";
import { CreateProjectDialog } from "../CreateProjectDialog";
import { EditProjectDialog } from "../EditProjectDialog";
import styles from "./ProjectList.module.css";

const PAGE_SIZE_OPTIONS: PageSize[] = [10, 20, 50, 100];

interface ProjectListProps {
  workspaceId?: number;
  organizationId?: number;
}

export const ProjectList = ({
  workspaceId: initialWsId,
  organizationId: initialOrgId,
}: ProjectListProps) => {
  const { success: toastSuccess, error: toastError } = useToast();

  // Load organizations
  const { data: orgData } = useGetMyOrganizationsQuery({ pageSize: 50 });
  const orgList = orgData?.data?.items ?? [];

  const [selectedOrgId, setSelectedOrgId] = useState<number>(initialOrgId || 0);

  useEffect(() => {
    if (initialOrgId) {
      setSelectedOrgId(initialOrgId);
    } else if (orgList.length > 0 && selectedOrgId === 0) {
      setSelectedOrgId(orgList[0].organizationId);
    }
  }, [initialOrgId, orgList, selectedOrgId]);

  // Load workspaces
  const { data: wsData } = useGetWorkspacesQuery(
    { organizationId: selectedOrgId, pageSize: 50 },
    { skip: !selectedOrgId },
  );
  const workspaceList = wsData?.data?.items ?? [];

  const [selectedWsId, setSelectedWsId] = useState<number | undefined>(
    initialWsId,
  );

  useEffect(() => {
    if (initialWsId) {
      setSelectedWsId(initialWsId);
    }
  }, [initialWsId]);

  // Load statuses for filter
  const { data: statusesData } = useGetProjectStatusesQuery(
    selectedOrgId ? { organizationId: selectedOrgId } : undefined,
    { skip: !selectedOrgId },
  );
  const statuses = statusesData?.data ?? [];

  // Filter and pagination states
  const [pageSize, setPageSize] = useState<PageSize>(10);
  const [currentCursor, setCurrentCursor] = useState<string | undefined>(
    undefined,
  );
  const [cursorHistory, setCursorHistory] = useState<(string | undefined)[]>(
    [],
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatusId, setSelectedStatusId] = useState<number | undefined>(
    undefined,
  );
  const [includeArchived, setIncludeArchived] = useState(false);

  // Dialogs
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectItem | null>(
    null,
  );
  const [statusChangingProject, setStatusChangingProject] =
    useState<ProjectItem | null>(null);
  const [deletingProject, setDeletingProject] = useState<ProjectItem | null>(
    null,
  );

  // Mutations
  const [deleteProject, { isLoading: isDeleting }] = useDeleteProjectMutation();
  const [archiveProject] = useArchiveProjectMutation();
  const [restoreArchivedProject] = useRestoreArchivedProjectMutation();

  const { data, isLoading, isFetching } = useGetProjectsQuery(
    {
      workspaceId: selectedWsId,
      pageSize,
      cursor: currentCursor,
      searchTerm: searchTerm.trim() || undefined,
      projectStatusId: selectedStatusId,
      includeArchived,
    },
    { skip: selectedWsId !== undefined && selectedWsId <= 0 },
  );

  const pagedResult = data?.data;
  const projects = pagedResult?.items ?? [];
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

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setCurrentCursor(undefined);
    setCursorHistory([]);
  };

  const handleToggleArchive = async (proj: ProjectItem) => {
    try {
      if (proj.isArchived) {
        await restoreArchivedProject({
          projectId: proj.projectId,
          workspaceId: proj.workspaceId,
        }).unwrap();
        toastSuccess(`Project "${proj.name}" restored from archive`);
      } else {
        await archiveProject({
          projectId: proj.projectId,
          workspaceId: proj.workspaceId,
        }).unwrap();
        toastSuccess(`Project "${proj.name}" archived`);
      }
    } catch (err) {
      toastError(getErrorMessage(err));
    }
  };

  const handleDelete = async () => {
    if (!deletingProject) return;
    try {
      await deleteProject({
        projectId: deletingProject.projectId,
        workspaceId: deletingProject.workspaceId,
      }).unwrap();
      toastSuccess(`Project "${deletingProject.name}" deleted successfully`);
      setDeletingProject(null);
    } catch (err) {
      toastError(getErrorMessage(err));
    }
  };

  const activeWorkspace = workspaceList.find(
    (w) => w.workspaceId === selectedWsId,
  );

  const columns: DataTableColumn<ProjectItem>[] = useMemo(
    () => [
      {
        key: "name",
        header: "Project",
        render: (item: ProjectItem) => (
          <div className={styles.projectCell}>
            <Link
              href={`/workspaces/${item.workspaceId}/projects/${item.projectId}?orgId=${selectedOrgId}`}
              className={styles.projectName}
            >
              {item.name}
            </Link>
            <span className={styles.projectSlug}>{item.slug}</span>
            {item.description && (
              <span className={styles.projectDesc}>{item.description}</span>
            )}
          </div>
        ),
      },
      ...(!initialWsId
        ? ([
            {
              key: "workspace",
              header: "Workspace",
              render: (item: ProjectItem) => (
                <Link
                  href={`/workspaces/${item.workspaceId}?orgId=${selectedOrgId}`}
                  style={{
                    color: "var(--primary)",
                    textDecoration: "none",
                    fontSize: "13px",
                  }}
                >
                  {item.workspaceName || `Workspace #${item.workspaceId}`}
                </Link>
              ),
            },
          ] as DataTableColumn<ProjectItem>[])
        : []),
      {
        key: "status",
        header: "Status",
        render: (item: ProjectItem) => (
          <div
            className={styles.statusPill}
            style={{
              backgroundColor: `${item.projectStatusColor || "var(--primary)"}22`,
              color: item.projectStatusColor || "var(--primary)",
            }}
          >
            <span
              className={styles.colorDot}
              style={{
                backgroundColor: item.projectStatusColor || "var(--primary)",
              }}
            />
            {item.projectStatusName}
          </div>
        ),
      },
      {
        key: "visibility",
        header: "Visibility",
        render: (item: ProjectItem) =>
          item.visibility === "Restricted" ? (
            <StatusBadge variant="warning">
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <Lock size={11} /> Restricted
              </span>
            </StatusBadge>
          ) : (
            <StatusBadge variant="info">
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <Globe size={11} /> Workspace
              </span>
            </StatusBadge>
          ),
      },
      {
        key: "owner",
        header: "Owner",
        render: (item: ProjectItem) => (
          <div className={styles.ownerCell}>
            <Avatar
              name={item.ownerName}
              src={item.ownerAvatarUrl || undefined}
              size="small"
            />
            <span className={styles.ownerName}>{item.ownerName}</span>
          </div>
        ),
      },
      {
        key: "members",
        header: "Members",
        render: (item: ProjectItem) => (
          <span
            style={{
              fontSize: "13px",
              color: "var(--text-secondary)",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <Users size={13} /> {item.explicitMemberCount}
          </span>
        ),
      },
      {
        key: "dueDate",
        header: "Due Date",
        render: (item: ProjectItem) =>
          item.dueDate ? (
            <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
              {new Date(item.dueDate).toLocaleDateString(undefined, {
                dateStyle: "medium",
              })}
            </span>
          ) : (
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              -
            </span>
          ),
      },
      {
        key: "actions",
        header: "",
        render: (item: ProjectItem) => {
          const canManage =
            item.currentUserProjectRole.toLowerCase() === "owner" ||
            item.currentUserProjectRole.toLowerCase() === "admin";

          return (
            <div className={styles.actionsCell}>
              <Link
                href={`/workspaces/${item.workspaceId}/projects/${item.projectId}?orgId=${selectedOrgId}`}
                className={styles.actionIconBtn}
                title="View Project Details"
              >
                <ExternalLink size={15} />
              </Link>

              {canManage && !item.isArchived && (
                <>
                  <button
                    className={styles.actionIconBtn}
                    title="Change Status"
                    onClick={() => setStatusChangingProject(item)}
                  >
                    <Tag size={15} />
                  </button>

                  <button
                    className={styles.actionIconBtn}
                    title="Edit Project"
                    onClick={() => setEditingProject(item)}
                  >
                    <Pencil size={15} />
                  </button>
                </>
              )}

              {canManage && (
                <button
                  className={styles.actionIconBtn}
                  title={
                    item.isArchived ? "Restore Project" : "Archive Project"
                  }
                  onClick={() => handleToggleArchive(item)}
                >
                  {item.isArchived ? (
                    <ArchiveRestore size={15} />
                  ) : (
                    <Archive size={15} />
                  )}
                </button>
              )}

              {canManage && (
                <button
                  className={`${styles.actionIconBtn} ${styles.deleteBtn}`}
                  title="Delete Project"
                  onClick={() => setDeletingProject(item)}
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          );
        },
      },
    ],
    [initialWsId, selectedOrgId],
  );

  return (
    <div className={styles.container}>
      <PageHeader
        title={
          activeWorkspace ? `Projects in ${activeWorkspace.name}` : "Projects"
        }
        description="Organize, track, and manage team deliverables, deadlines, and project members"
        action={
          <Button
            variant="primary"
            onClick={() => {
              if (!selectedWsId && workspaceList.length > 0) {
                setSelectedWsId(workspaceList[0].workspaceId);
              }
              setIsCreateOpen(true);
            }}
          >
            <Plus size={16} /> New Project
          </Button>
        }
      />

      {/* Filter and Control Bar */}
      <div className={styles.filtersBar}>
        <div className={styles.filterGroup}>
          <div className={styles.searchWrap}>
            <Input
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {!initialWsId && (
            <div className={styles.selectWrap}>
              <Select
                value={selectedWsId ? selectedWsId.toString() : ""}
                onChange={(e) => {
                  setSelectedWsId(
                    e.target.value ? Number(e.target.value) : undefined,
                  );
                  setCurrentCursor(undefined);
                  setCursorHistory([]);
                }}
                options={[
                  { label: "All Workspaces", value: "" },
                  ...workspaceList.map((ws) => ({
                    label: ws.name,
                    value: ws.workspaceId.toString(),
                  })),
                ]}
              />
            </div>
          )}

          <div className={styles.selectWrap}>
            <Select
              value={selectedStatusId ? selectedStatusId.toString() : ""}
              onChange={(value) => {
                setSelectedStatusId(value ? Number(value) : undefined);
                setCurrentCursor(undefined);
                setCursorHistory([]);
              }}
              options={[
                { label: "All Statuses", value: "" },
                ...statuses.map((s) => ({
                  label: s.name,
                  value: s.projectStatusId.toString(),
                })),
              ]}
            />
          </div>

          <label className={styles.archiveToggle}>
            <input
              type="checkbox"
              checked={includeArchived}
              onChange={(e) => {
                setIncludeArchived(e.target.checked);
                setCurrentCursor(undefined);
                setCursorHistory([]);
              }}
            />
            Include Archived
          </label>
        </div>

        <div className={styles.selectWrap}>
          <Select
            value={pageSize.toString()}
            onChange={(value) => {
              setPageSize(Number(value) as PageSize);
              setCurrentCursor(undefined);
              setCursorHistory([]);
            }}
            options={PAGE_SIZE_OPTIONS.map((size) => ({
              label: `${size} / page`,
              value: size.toString(),
            }))}
          />
        </div>
      </div>

      {/* Projects DataTable */}
      <DataTable<ProjectItem>
        columns={columns}
        data={projects}
        rowKey={(item: ProjectItem) => item.projectId}
        loading={isLoading || isFetching}
        emptyTitle={searchTerm ? "No matching projects" : "No projects found"}
        emptyDescription={
          searchTerm
            ? "No projects match your search filter."
            : "No projects available. Create your first project to start tracking deliverables!"
        }
      />

      {/* Keyset Pagination Bar */}
      <div className={styles.paginationBar}>
        <div className={styles.pageInfo}>
          <span>Showing {projects.length} project(s)</span>
          {isFetching && (
            <span className={styles.fetchingBadge}>Updating...</span>
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

      {/* Dialogs */}
      {selectedWsId && (
        <CreateProjectDialog
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          workspaceId={selectedWsId}
          organizationId={selectedOrgId}
        />
      )}

      {editingProject && (
        <EditProjectDialog
          isOpen={Boolean(editingProject)}
          onClose={() => setEditingProject(null)}
          project={editingProject}
          organizationId={selectedOrgId}
        />
      )}

      {statusChangingProject && (
        <ChangeProjectStatusDialog
          isOpen={Boolean(statusChangingProject)}
          onClose={() => setStatusChangingProject(null)}
          project={statusChangingProject}
          organizationId={selectedOrgId}
        />
      )}

      <ConfirmDialog
        open={Boolean(deletingProject)}
        onClose={() => setDeletingProject(null)}
        onConfirm={handleDelete}
        title="Delete Project"
        description={`Are you sure you want to delete "${deletingProject?.name}"? You can restore it later.`}
        confirmText="Delete Project"
        variant="danger"
        loading={isDeleting}
      />
    </div>
  );
};
