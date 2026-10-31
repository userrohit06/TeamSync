"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Archive,
  ArchiveRestore,
  ArrowLeft,
  Calendar,
  Clock,
  FolderKanban,
  Globe,
  Lock,
  Pencil,
  RefreshCw,
  Shield,
  ShieldCheck,
  Tag,
  Trash2,
  User,
  Users,
} from "lucide-react";
import Button from "@/components/common/Button";
import Card from "@/components/common/Card";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import StatusBadge from "@/components/common/StatusBadge";
import { useGetMyOrganizationsQuery } from "@/features/organizations/api/organizationApi";
import {
  useArchiveProjectMutation,
  useDeleteProjectMutation,
  useGetProjectByIdQuery,
  useRestoreArchivedProjectMutation,
} from "@/features/projects/api/projectApi";
import { useToast } from "@/hooks";
import { getErrorMessage } from "@/lib";
import { ChangeProjectStatusDialog } from "../ChangeProjectStatusDialog";
import { ChangeProjectVisibilityDialog } from "../ChangeProjectVisibilityDialog";
import { EditProjectDialog } from "../EditProjectDialog";
import { ProjectMemberList } from "../ProjectMemberList";
import { TransferProjectOwnershipDialog } from "../TransferProjectOwnershipDialog";
import styles from "./ProjectDetails.module.css";

interface ProjectDetailsProps {
  projectId: number;
  workspaceId?: number;
  organizationId?: number;
}

export const ProjectDetails = ({
  projectId,
  workspaceId: propWorkspaceId,
  organizationId: propOrgId,
}: ProjectDetailsProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orgParam = searchParams.get("orgId");
  const wsParam = searchParams.get("workspaceId");

  const { data: orgData } = useGetMyOrganizationsQuery({ pageSize: 50 });
  const fallbackOrgId = orgData?.data?.items?.[0]?.organizationId ?? 0;
  const organizationId = propOrgId || (orgParam ? Number(orgParam) : fallbackOrgId);
  const workspaceId = propWorkspaceId || (wsParam ? Number(wsParam) : undefined);

  const { success: toastSuccess, error: toastError } = useToast();

  const [activeTab, setActiveTab] = useState<"overview" | "members">("overview");

  // Modals state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isVisibilityOpen, setIsVisibilityOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const { data, isLoading, error } = useGetProjectByIdQuery(
    { projectId, workspaceId },
    { skip: !projectId }
  );

  const [archiveProject, { isLoading: isArchiving }] = useArchiveProjectMutation();
  const [restoreArchivedProject, { isLoading: isRestoringArchive }] =
    useRestoreArchivedProjectMutation();
  const [deleteProject, { isLoading: isDeleting }] = useDeleteProjectMutation();

  const project = data?.data;

  const handleToggleArchive = async () => {
    if (!project) return;
    try {
      if (project.isArchived) {
        await restoreArchivedProject({ projectId, workspaceId: project.workspaceId }).unwrap();
        toastSuccess(`Project "${project.name}" restored from archive`);
      } else {
        await archiveProject({ projectId, workspaceId: project.workspaceId }).unwrap();
        toastSuccess(`Project "${project.name}" archived`);
      }
    } catch (err) {
      toastError(getErrorMessage(err));
    }
  };

  const handleDelete = async () => {
    if (!project) return;
    try {
      await deleteProject({ projectId, workspaceId: project.workspaceId }).unwrap();
      toastSuccess(`Project "${project.name}" deleted successfully`);
      router.push(`/workspaces/${project.workspaceId}/projects?orgId=${organizationId}`);
    } catch (err) {
      toastError(getErrorMessage(err));
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p>Loading project details...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className={styles.errorState}>
        <h3>Project Not Found</h3>
        <p>Could not load the requested project or access is restricted.</p>
        <Link href={workspaceId ? `/workspaces/${workspaceId}/projects?orgId=${organizationId}` : "/workspaces/projects"}>
          <Button variant="secondary" size="small">
            Back to Projects
          </Button>
        </Link>
      </div>
    );
  }

  const isRestricted = project.visibility === "Restricted";

  return (
    <div className={styles.container}>
      <Link
        href={`/workspaces/${project.workspaceId}/projects?orgId=${organizationId}`}
        className={styles.backLink}
      >
        <ArrowLeft size={15} /> Back to Projects ({project.workspaceName})
      </Link>

      {project.isArchived && (
        <div className={styles.archivedBanner}>
          <Archive size={16} />
          <span>
            This project is archived
            {project.archivedAt &&
              ` on ${new Date(project.archivedAt).toLocaleDateString(undefined, { dateStyle: "medium" })}`}
            . Editing and member changes are disabled until restored.
          </span>
        </div>
      )}

      {/* Hero Banner */}
      <div className={styles.heroCard}>
        <div className={styles.heroMain}>
          <div className={styles.iconFallback}>
            <FolderKanban size={26} />
          </div>

          <div className={styles.heroDetails}>
            <div className={styles.heroTitleRow}>
              <h1 className={styles.projectTitle}>{project.name}</h1>

              <div
                className={styles.statusPill}
                style={{
                  backgroundColor: `${project.projectStatusColor || "var(--primary)"}22`,
                  color: project.projectStatusColor || "var(--primary)",
                }}
                onClick={() => project.canEdit && setIsStatusOpen(true)}
                title={project.canEdit ? "Click to change status" : undefined}
              >
                <span
                  className={styles.colorDot}
                  style={{ backgroundColor: project.projectStatusColor || "var(--primary)" }}
                />
                {project.projectStatusName} ({project.projectStatusCategory})
              </div>

              <StatusBadge variant={isRestricted ? "warning" : "info"}>
                {isRestricted ? (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                    <Lock size={12} /> Restricted
                  </span>
                ) : (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                    <Globe size={12} /> Workspace
                  </span>
                )}
              </StatusBadge>
            </div>

            <span className={styles.projectSlug}>slug: {project.slug}</span>

            <p className={styles.projectDescription}>
              {project.description || "No description provided for this project."}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className={styles.heroActions}>
          {project.canEdit && (
            <>
              <Button
                variant="secondary"
                size="small"
                onClick={() => setIsStatusOpen(true)}
                disabled={project.isArchived}
              >
                <Tag size={14} /> Status
              </Button>

              <Button
                variant="secondary"
                size="small"
                onClick={() => setIsEditOpen(true)}
                disabled={project.isArchived}
              >
                <Pencil size={14} /> Edit
              </Button>

              <Button
                variant="secondary"
                size="small"
                onClick={() => setIsVisibilityOpen(true)}
                disabled={project.isArchived}
              >
                <Lock size={14} /> Visibility
              </Button>

              <Button
                variant="secondary"
                size="small"
                onClick={handleToggleArchive}
                loading={isArchiving || isRestoringArchive}
              >
                {project.isArchived ? (
                  <>
                    <ArchiveRestore size={14} /> Unarchive
                  </>
                ) : (
                  <>
                    <Archive size={14} /> Archive
                  </>
                )}
              </Button>
            </>
          )}

          {project.canTransferOwnership && !project.isArchived && (
            <Button
              variant="secondary"
              size="small"
              onClick={() => setIsTransferOpen(true)}
            >
              <ShieldCheck size={14} /> Transfer
            </Button>
          )}

          {project.canDelete && (
            <Button
              variant="secondary"
              size="small"
              onClick={() => setIsDeleteOpen(true)}
              className={styles.deleteButton}
            >
              <Trash2 size={14} /> Delete
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabsRow}>
        <button
          className={`${styles.tabButton} ${activeTab === "overview" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          <FolderKanban size={15} /> Overview & Metadata
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === "members" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("members")}
        >
          <Users size={15} /> Collaborators ({project.explicitMemberCount})
        </button>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === "overview" && (
        <div className={styles.contentGrid}>
          <div className={styles.sectionCard}>
            <h3 className={styles.sectionTitle}>
              <Calendar size={16} color="var(--primary)" /> Timeline & Schedule
            </h3>
            <div className={styles.detailsList}>
              <div className={styles.detailRow}>
                <span className={styles.label}>Start Date</span>
                <span className={styles.value}>
                  {project.startDate
                    ? new Date(project.startDate).toLocaleDateString(undefined, {
                        dateStyle: "medium",
                      })
                    : "Not set"}
                </span>
              </div>

              <div className={styles.detailRow}>
                <span className={styles.label}>Due Date</span>
                <span className={styles.value}>
                  {project.dueDate
                    ? new Date(project.dueDate).toLocaleDateString(undefined, {
                        dateStyle: "medium",
                      })
                    : "Not set"}
                </span>
              </div>

              <div className={styles.detailRow}>
                <span className={styles.label}>Created At</span>
                <span className={styles.value}>
                  {new Date(project.createdAt).toLocaleDateString(undefined, {
                    dateStyle: "medium",
                  })}
                </span>
              </div>

              {project.updatedAt && (
                <div className={styles.detailRow}>
                  <span className={styles.label}>Last Updated</span>
                  <span className={styles.value}>
                    {new Date(project.updatedAt).toLocaleDateString(undefined, {
                      dateStyle: "medium",
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className={styles.sectionCard}>
            <h3 className={styles.sectionTitle}>
              <Shield size={16} color="var(--primary)" /> Access & Ownership
            </h3>
            <div className={styles.detailsList}>
              <div className={styles.detailRow}>
                <span className={styles.label}>Parent Workspace</span>
                <span className={styles.value}>
                  <Link
                    href={`/workspaces/${project.workspaceId}?orgId=${organizationId}`}
                    style={{ color: "var(--primary)", textDecoration: "none" }}
                  >
                    {project.workspaceName}
                  </Link>
                </span>
              </div>

              <div className={styles.detailRow}>
                <span className={styles.label}>Project Owner</span>
                <span className={styles.value}>
                  <User size={13} /> {project.ownerName}
                  {project.ownerEmail && (
                    <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                      ({project.ownerEmail})
                    </span>
                  )}
                </span>
              </div>

              <div className={styles.detailRow}>
                <span className={styles.label}>Your Effective Role</span>
                <span className={styles.roleHighlight}>
                  {project.currentUserProjectRole || "Member"}
                </span>
              </div>

              <div className={styles.detailRow}>
                <span className={styles.label}>Visibility Mode</span>
                <span className={styles.value}>
                  {isRestricted ? "Restricted (Explicit Members)" : "Workspace-Wide Access"}
                </span>
              </div>

              <div className={styles.detailRow}>
                <span className={styles.label}>Explicit Members</span>
                <span className={styles.value}>
                  <Users size={13} /> {project.explicitMemberCount} user(s)
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Collaborators */}
      {activeTab === "members" && (
        <Card>
          <ProjectMemberList
            projectId={project.projectId}
            workspaceId={project.workspaceId}
            organizationId={organizationId}
            canManageMembers={project.canManageMembers && !project.isArchived}
          />
        </Card>
      )}

      {/* Dialogs */}
      <EditProjectDialog
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        project={project}
        organizationId={organizationId}
      />

      <ChangeProjectStatusDialog
        isOpen={isStatusOpen}
        onClose={() => setIsStatusOpen(false)}
        project={project}
        organizationId={organizationId}
      />

      <ChangeProjectVisibilityDialog
        isOpen={isVisibilityOpen}
        onClose={() => setIsVisibilityOpen(false)}
        project={project}
        organizationId={organizationId}
      />

      <TransferProjectOwnershipDialog
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        project={project}
        organizationId={organizationId}
      />

      <ConfirmDialog
        open={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Project"
        description={`Are you sure you want to delete "${project.name}"? You can restore it later if needed.`}
        confirmText="Delete Project"
        variant="danger"
        loading={isDeleting}
      />
    </div>
  );
};
