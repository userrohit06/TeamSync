"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, ShieldCheck, UserPlus } from "lucide-react";

import Avatar from "@/components/common/Avatar";
import Button from "@/components/common/Button";
import PageHeader from "@/components/common/PageHeader";
import StatusBadge from "@/components/common/StatusBadge";
import { useGetOrganizationMembersQuery } from "@/features/organizations/api/organizationApi";

import styles from "./OrganizationMemberList.module.css";
import { PageSize } from "@/types";
import DataTable, {
  DataTableColumn,
} from "@/components/common/DataTable/DataTable";
import { OrganizationMember } from "@/features/organizations/types/organization.types";

const PAGE_SIZE_OPTIONS: PageSize[] = [10, 20, 50, 100];

interface OrganizationMemberListProps {
  organizationId: number;
}

export const OrganizationMemberList = ({
  organizationId,
}: OrganizationMemberListProps) => {
  const [pageSize, setPageSize] = useState<PageSize>(10);
  const [currentCursor, setCurrentCursor] = useState<string | undefined>(
    undefined,
  );
  const [cursorHistory, setCursorHistory] = useState<(string | undefined)[]>(
    [],
  );
  const [searchTerm, setSearchTerm] = useState("");

  const { data, isLoading, isFetching, error, refetch } =
    useGetOrganizationMembersQuery({
      organizationId,
      pageSize,
      cursor: currentCursor,
      searchTerm: searchTerm.trim() || undefined,
    });

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
    ],
    [],
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
          <Button variant="primary" size="medium">
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
    </div>
  );
};
