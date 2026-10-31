"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Clock,
  FolderKanban,
  Globe,
  Lock,
  Pencil,
  ShieldCheck,
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
  useDeleteWorkspaceMutation,
  useGetWorkspaceByIdQuery,
} from "@/features/workspaces/api/workspaceApi";
import { useToast } from "@/hooks";
import { getErrorMessage } from "@/lib";
import { EditWorkspaceDialog } from "../EditWorkspaceDialog";
import { TransferWorkspaceOwnershipDialog } from "../TransferWorkspaceOwnershipDialog";
import styles from "./WorkspaceDetails.module.css";

interface WorkspaceDetailsProps {
  organizationId?: number;
  workspaceId: number;
}

export const WorkspaceDetails = ({
  organizationId: propOrgId,
  workspaceId,
}: WorkspaceDetailsProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orgParam = searchParams.get("orgId");

  const { data: orgData } = useGetMyOrganizationsQuery({ pageSize: 50 });
  const fallbackOrgId = orgData?.data?.items?.[0]?.organizationId ?? 0;
  const organizationId = propOrgId || (orgParam ? Number(orgParam) : fallbackOrgId);

  const { success: toastSuccess, error: toastError } = useToast();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);

  const { data, isLoading, error } = useGetWorkspaceByIdQuery(
    { organizationId, workspaceId },
    { skip: !organizationId || !workspaceId },
  );

  const [deleteWorkspace, { isLoading: isDeleting }] = useDeleteWorkspaceMutation();

  const ws = data?.data;
  const isAdmin =
    ws?.currentUserWorkspaceRole?.toLowerCase() === "admin" ||
    ws?.currentUserWorkspaceRole?.toLowerCase() === "owner";

  const handleDelete = async () => {
    try {
      await deleteWorkspace({ organizationId, workspaceId }).unwrap();
      toastSuccess(`Workspace "${ws?.name || "Workspace"}" deleted successfully`);
      router.push(`/workspaces?orgId=${organizationId}`);
    } catch (err) {
      const msg = getErrorMessage(err);
      toastError(msg);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p>Loading workspace details...</p>
      </div>
    );
  }

  if (error || !ws) {
    return (
      <div className={styles.errorState}>
        <h3>Workspace Not Found</h3>
        <p>Could not load the requested workspace.</p>
        <Link href={`/workspaces?orgId=${organizationId}`}>
          <Button variant="secondary" size="small">
            Back to Workspaces
          </Button>
        </Link>
      </div>
    );
  }

  const isPrivate = ws.visibility.toLowerCase() === "private";

  return (
    <div className={styles.container}>
      <Link href={`/workspaces?orgId=${organizationId}`} className={styles.backLink}>
        <ArrowLeft size={15} /> Back to Workspaces
      </Link>

      {/* Main Hero Banner */}
      <Card className={styles.heroCard}>
        <div className={styles.heroMain}>
          <div className={styles.logoFallback}>
            {ws.name.charAt(0).toUpperCase()}
          </div>

          <div className={styles.heroDetails}>
            <div className={styles.heroTitleRow}>
              <h1 className={styles.workspaceTitle}>{ws.name}</h1>
              <StatusBadge variant={isPrivate ? "warning" : "info"}>
                {isPrivate ? "Private" : "Public"}
              </StatusBadge>
              <StatusBadge variant="success">{ws.status}</StatusBadge>
            </div>
            <span className={styles.workspaceSlug}>slug: {ws.slug}</span>
            <p className={styles.workspaceDescription}>
              {ws.description || "No description provided for this workspace."}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className={styles.heroActions}>
          <Link href={`/workspaces/${ws.workspaceId}/projects?orgId=${organizationId}`}>
            <Button variant="secondary" size="small">
              <FolderKanban size={14} /> Projects
            </Button>
          </Link>

          <Link href={`/workspaces/${ws.workspaceId}/members?orgId=${organizationId}`}>
            <Button variant="secondary" size="small">
              <Users size={14} /> Members ({ws.totalMembers})
            </Button>
          </Link>

          {isAdmin && (
            <>
              <Button
                variant="secondary"
                size="small"
                onClick={() => setIsEditOpen(true)}
              >
                <Pencil size={14} /> Edit
              </Button>

              <Button
                variant="secondary"
                size="small"
                onClick={() => setIsDeleteOpen(true)}
                className={styles.deleteButton}
              >
                <Trash2 size={14} /> Delete
              </Button>
            </>
          )}
        </div>
      </Card>

      {/* Details Grid */}
      <div className={styles.contentGrid}>
        <Card className={styles.sectionCard}>
          <h3 className={styles.sectionTitle}>
            <ShieldCheck size={16} color="var(--primary)" /> Workspace Info & Access
          </h3>

          <div className={styles.detailsList}>
            <div className={styles.detailRow}>
              <span className={styles.label}>Your Role</span>
              <span className={styles.roleHighlight}>
                {ws.currentUserWorkspaceRole || "Member"}
              </span>
            </div>

            <div className={styles.detailRow}>
              <span className={styles.label}>Visibility</span>
              <span className={styles.value}>
                {isPrivate ? (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                    <Lock size={13} color="var(--warning)" /> Private
                  </span>
                ) : (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                    <Globe size={13} color="var(--primary)" /> Public
                  </span>
                )}
              </span>
            </div>

            <div className={styles.detailRow}>
              <span className={styles.label}>
                <User size={14} /> Created By
              </span>
              <span className={styles.value}>{ws.createdByUserName}</span>
            </div>

            {ws.updatedByUserName && (
              <div className={styles.detailRow}>
                <span className={styles.label}>
                  <User size={14} /> Last Modified By
                </span>
                <span className={styles.value}>{ws.updatedByUserName}</span>
              </div>
            )}

            <div className={styles.detailRow}>
              <span className={styles.label}>
                <Calendar size={14} /> Created Date
              </span>
              <span className={styles.value}>
                {new Date(ws.createdAt).toLocaleDateString(undefined, {
                  dateStyle: "medium",
                })}
              </span>
            </div>

            {ws.updatedAt && (
              <div className={styles.detailRow}>
                <span className={styles.label}>
                  <Clock size={14} /> Last Updated
                </span>
                <span className={styles.value}>
                  {new Date(ws.updatedAt).toLocaleDateString(undefined, {
                    dateStyle: "medium",
                  })}
                </span>
              </div>
            )}
          </div>
        </Card>

        <Card className={styles.sectionCard}>
          <h3 className={styles.sectionTitle}>
            <Users size={16} color="var(--primary)" /> Team Collaboration
          </h3>
          <p className={styles.cardHelperText}>
            Invite collaborators, manage permissions, and track active team members within this workspace.
          </p>

          <div className={styles.actionGrid}>
            <Link
              href={`/workspaces/${ws.workspaceId}/projects?orgId=${organizationId}`}
              className={styles.navBlock}
            >
              <FolderKanban size={18} />
              <div>
                <strong>Workspace Projects</strong>
                <span>View, manage, and create deliverables</span>
              </div>
            </Link>

            <Link
              href={`/workspaces/${ws.workspaceId}/members?orgId=${organizationId}`}
              className={styles.navBlock}
            >
              <Users size={18} />
              <div>
                <strong>Workspace Members</strong>
                <span>Manage {ws.totalMembers} collaborator(s)</span>
              </div>
            </Link>

            {isAdmin && (
              <div
                className={styles.navBlock}
                style={{ cursor: "pointer" }}
                onClick={() => setIsTransferOpen(true)}
              >
                <ShieldCheck size={18} />
                <div>
                  <strong>Transfer Ownership</strong>
                  <span>Assign workspace leadership to another member</span>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Edit Modal */}
      <EditWorkspaceDialog
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        workspace={ws}
      />

      {/* Transfer Ownership Modal */}
      <TransferWorkspaceOwnershipDialog
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        workspace={ws}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Workspace"
        description={`Are you sure you want to delete "${ws.name}"? This action cannot be undone.`}
        confirmText="Delete Workspace"
        variant="danger"
        loading={isDeleting}
      />
    </div>
  );
};
