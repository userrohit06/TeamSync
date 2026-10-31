"use client";

import { useMemo, useState } from "react";
import { Trash2, UserPlus } from "lucide-react";
import Avatar from "@/components/common/Avatar";
import Button from "@/components/common/Button";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import DataTable, { DataTableColumn } from "@/components/common/DataTable/DataTable";
import Input from "@/components/common/Input";
import StatusBadge from "@/components/common/StatusBadge";
import {
  useAddOrAssignProjectMemberMutation,
  useGetProjectMembersQuery,
  useGetProjectRolesQuery,
  useRemoveProjectMemberMutation,
} from "@/features/projects/api/projectApi";
import { ProjectMember } from "@/features/projects/types/project.types";
import { useToast } from "@/hooks";
import { getErrorMessage } from "@/lib";
import { PageSize } from "@/types";
import { AddProjectMemberDialog } from "../AddProjectMemberDialog";
import styles from "./ProjectMemberList.module.css";

interface ProjectMemberListProps {
  projectId: number;
  workspaceId: number;
  organizationId?: number;
  canManageMembers?: boolean;
}

export const ProjectMemberList = ({
  projectId,
  workspaceId,
  organizationId,
  canManageMembers = false,
}: ProjectMemberListProps) => {
  const { success: toastSuccess, error: toastError } = useToast();

  const [pageSize, setPageSize] = useState<PageSize>(10);
  const [currentCursor, setCurrentCursor] = useState<string | undefined>(undefined);
  const [cursorHistory, setCursorHistory] = useState<(string | undefined)[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [removingMember, setRemovingMember] = useState<ProjectMember | null>(null);

  const { data, isLoading, isFetching } = useGetProjectMembersQuery({
    projectId,
    workspaceId,
    pageSize,
    cursor: currentCursor,
    searchTerm: searchTerm.trim() || undefined,
  });

  const { data: rolesData } = useGetProjectRolesQuery(
    { excludeOwner: true },
    { skip: !canManageMembers }
  );
  const assignableRoles = rolesData?.data ?? [];

  const [addOrAssignMember, { isLoading: isUpdatingRole }] = useAddOrAssignProjectMemberMutation();
  const [removeMember, { isLoading: isRemoving }] = useRemoveProjectMemberMutation();

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

  const handleRoleChange = async (member: ProjectMember, newRoleIdStr: string) => {
    const roleId = Number(newRoleIdStr);
    if (!roleId) return;

    try {
      await addOrAssignMember({
        projectId,
        workspaceId,
        targetUserId: member.userId,
        projectRoleId: roleId,
      }).unwrap();
      toastSuccess(`Updated role for ${member.fullName}`);
    } catch (err) {
      toastError(getErrorMessage(err));
    }
  };

  const handleConfirmRemove = async () => {
    if (!removingMember) return;
    try {
      await removeMember({
        projectId,
        workspaceId,
        targetUserId: removingMember.userId,
      }).unwrap();
      toastSuccess(`Removed ${removingMember.fullName} from project`);
      setRemovingMember(null);
    } catch (err) {
      toastError(getErrorMessage(err));
    }
  };

  const columns: DataTableColumn<ProjectMember>[] = useMemo(
    () => [
      {
        key: "user",
        header: "User",
        render: (item: ProjectMember) => (
          <div className={styles.userCell}>
            <Avatar name={item.fullName} src={item.profilePhoto || undefined} size="small" />
            <div>
              <div className={styles.userName}>{item.fullName}</div>
              <div className={styles.userEmail}>{item.email}</div>
            </div>
          </div>
        ),
      },
      {
        key: "projectRole",
        header: "Project Role",
        render: (item: ProjectMember) => {
          if (item.isOwner) {
            return <span className={`${styles.roleBadge} ${styles.badgeOwner}`}>Owner</span>;
          }

          if (canManageMembers && item.isExplicit) {
            const currentRole = assignableRoles.find((r) => r.roleName === item.projectRole);
            return (
              <select
                className={styles.roleSelect}
                value={currentRole ? currentRole.projectRoleId : ""}
                onChange={(e) => handleRoleChange(item, e.target.value)}
                disabled={isUpdatingRole}
              >
                {assignableRoles.map((r) => (
                  <option key={r.projectRoleId} value={r.projectRoleId}>
                    {r.roleName}
                  </option>
                ))}
              </select>
            );
          }

          const badgeClass =
            item.projectRole.toLowerCase() === "admin" ? styles.badgeAdmin : styles.badgeMember;
          return <span className={`${styles.roleBadge} ${badgeClass}`}>{item.projectRole}</span>;
        },
      },
      {
        key: "workspaceRole",
        header: "Workspace Role",
        render: (item: ProjectMember) => (
          <StatusBadge variant="info">
            {item.workspaceRole || "Member"}
          </StatusBadge>
        ),
      },
      {
        key: "isExplicit",
        header: "Membership",
        render: (item: ProjectMember) =>
          item.isExplicit ? (
            <span style={{ fontSize: "12px", color: "var(--success)", fontWeight: 500 }}>
              Explicit Member
            </span>
          ) : (
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              Workspace Access
            </span>
          ),
      },
      {
        key: "joinedAt",
        header: "Joined Date",
        render: (item: ProjectMember) =>
          item.joinedAt ? (
            <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
              {new Date(item.joinedAt).toLocaleDateString(undefined, { dateStyle: "medium" })}
            </span>
          ) : (
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>-</span>
          ),
      },
      {
        key: "actions",
        header: "",
        render: (item: ProjectMember) => {
          if (!canManageMembers || item.isOwner || !item.isExplicit) return null;
          return (
            <div className={styles.actionsCell}>
              <button
                className={styles.removeButton}
                title="Remove Member"
                onClick={() => setRemovingMember(item)}
              >
                <Trash2 size={15} />
              </button>
            </div>
          );
        },
      },
    ],
    [canManageMembers, assignableRoles, isUpdatingRole]
  );

  return (
    <div className={styles.container}>
      <div className={styles.controls}>
        <div className={styles.searchWrap}>
          <Input
            placeholder="Search collaborators by name or email..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            disabled={isLoading}
          />
        </div>

        {canManageMembers && (
          <Button variant="primary" size="small" onClick={() => setIsAddOpen(true)}>
            <UserPlus size={14} /> Add Collaborator
          </Button>
        )}
      </div>

      <DataTable<ProjectMember>
        columns={columns}
        data={members}
        rowKey={(item: ProjectMember) => item.userId}
        loading={isLoading || isFetching}
        emptyTitle={searchTerm ? "No matching collaborators" : "No project collaborators found"}
        emptyDescription={
          searchTerm
            ? "No members match your search filter."
            : "No collaborators assigned to this project yet."
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

      <AddProjectMemberDialog
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        projectId={projectId}
        workspaceId={workspaceId}
        organizationId={organizationId}
        existingMemberUserIds={members.filter((m) => m.isExplicit).map((m) => m.userId)}
      />

      <ConfirmDialog
        open={Boolean(removingMember)}
        onClose={() => setRemovingMember(null)}
        onConfirm={handleConfirmRemove}
        title="Remove Member from Project"
        description={`Are you sure you want to remove "${removingMember?.fullName}" from this project? They will lose explicit access.`}
        confirmText="Remove Member"
        variant="danger"
        loading={isRemoving}
      />
    </div>
  );
};
