"use client";

import { useMemo, useState } from "react";
import { useGetMyOrganizationsQuery } from "@/features/organizations/api/organizationApi";

import styles from "./OrganizationList.module.css";
import { PageSize } from "@/types";
import DataTable, {
  DataTableColumn,
} from "@/components/common/DataTable/DataTable";
import { UserOrganization } from "@/features/organizations/types/organization.types";
import { Button, Input, Select } from "@/components";
import PageHeader from "@/components/common/PageHeader";
import CreateOrganizationDialog from "@/features/organizations/components/CreateOrganizationDialog/CreateOrganizationDialog";
import Link from "next/link";
import { ArrowRight, Settings, Users } from "lucide-react";

const PAGE_SIZE_OPTIONS: PageSize[] = [10, 20, 50, 100];

const OrganizationList = () => {
  const [pageSize, setPageSize] = useState<PageSize>(10);
  const [currentCursor, setCurrentCursor] = useState<string | undefined>(
    undefined,
  );
  const [cursorHistory, setCursorHistory] = useState<(string | undefined)[]>(
    [],
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data, isLoading, isFetching, error, refetch } =
    useGetMyOrganizationsQuery({
      pageSize,
      cursor: currentCursor,
      searchTerm: searchTerm.trim() || undefined,
    });

  const pagedResult = data?.data;
  const organizations = pagedResult?.items ?? [];
  const hasNextPage = Boolean(
    pagedResult?.hasNextPage && pagedResult?.nextCursor,
  );
  const hasPreviousPage = cursorHistory.length > 0;

  // Move Forward: Save current cursor to stack and apply nextCursor
  const handleNextPage = () => {
    if (!pagedResult?.nextCursor) return;
    setCursorHistory((prev) => [...prev, currentCursor]);
    setCurrentCursor(pagedResult.nextCursor);
  };

  // Move Backward: Pop previous cursor from stack
  const handlePreviousPage = () => {
    if (!cursorHistory.length) return;
    const previousCursor = cursorHistory[cursorHistory.length - 1];
    setCursorHistory((prev) => prev.slice(0, -1));
    setCurrentCursor(previousCursor);
  };

  // Reset pagination state when filters change
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

  const columns: DataTableColumn<UserOrganization>[] = useMemo(
    () => [
      {
        key: "organization",
        header: "Organization",
        render: (row) => (
          <div className={styles.orgCell}>
            {row.logoUrl ? (
              <img
                src={row.logoUrl}
                alt={row.name}
                className={styles.orgLogo}
              />
            ) : (
              <div className={styles.orgAvatarFallback}>
                {row.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className={styles.orgDetails}>
              <Link
                href={`/organizations/${row.organizationId}`}
                className={styles.orgNameLink}
                onClick={(e) => e.stopPropagation()}
              >
                {row.name}
              </Link>

              <span className={styles.orgMeta}>
                Joined {new Date(row.joinedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        ),
      },
      {
        key: "description",
        header: "Description",
        render: (row) => (
          <span className={styles.orgDescription}>
            {row.description?.trim() ? row.description : "No description"}
          </span>
        ),
      },
      {
        key: "role",
        header: "Role",
        align: "center",
        render: (row) => (
          <div className={styles.roleWrapper}>
            <span className={styles.roleBadge}>{row.roleName ?? "Member"}</span>
            {row.roleDescription && (
              <span className={styles.roleDescText}>{row.roleDescription}</span>
            )}
          </div>
        ),
      },
      {
        key: "actions",
        header: "Actions",
        align: "right",
        render: (row) => (
          <div
            className={styles.actionsCell}
            onClick={(e) => e.stopPropagation()}
          >
            <Link
              href={`/organizations/${row.organizationId}`}
              className={styles.iconLink}
              title="View Organization Details"
            >
              <ArrowRight size={14} />
            </Link>

            <Link
              href={`/organizations/${row.organizationId}/members`}
              className={styles.iconLink}
              title="Members"
            >
              <Users size={14} />
            </Link>

            <Link
              href={`/organizations/${row.organizationId}/settings`}
              className={styles.iconLink}
              title="Organization Settings"
            >
              <Settings size={14} />
            </Link>
          </div>
        ),
      },
    ],
    [],
  );

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <h3>Failed to load organizations</h3>
        <p>Could not retrieve organization records.</p>
        <button
          type="button"
          onClick={() => refetch()}
          className={styles.retryBtn}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      <div className={styles.wrapper}>
        <PageHeader
          title="Organizations"
          description="Manage organizations and view memberships"
          action={
            <Button
              variant="primary"
              size="small"
              onClick={() => setIsCreateOpen(true)}
            >
              + Create Organization
            </Button>
          }
        />
        {/* Top Filter and Search Bar */}
        <div className={styles.actions}>
          <Input
            type="text"
            placeholder="Search organizations..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            inputSize="small"
            style={{ width: "10rem" }}
          />

          <Select
            options={PAGE_SIZE_OPTIONS.map((size) => ({
              label: size.toString(),
              value: size.toString(),
            }))}
            value={pageSize}
            onChange={(e) =>
              handlePageSizeChange(Number(e.target.value) as PageSize)
            }
            className={styles.pageSizeSelect}
            selectSize="small"
          />
        </div>

        {/* Main Table */}
        <DataTable<UserOrganization>
          columns={columns}
          data={organizations}
          rowKey={(row) => row.organizationId}
          loading={isLoading}
          emptyTitle="No organizations found"
          emptyDescription={
            searchTerm
              ? `No records found matching "${searchTerm}".`
              : "No organizations associated with this account."
          }
        />

        {/* Cursor Navigation Bar */}
        {organizations.length > 0 && (
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

      {/* Organization creation modal */}
      <CreateOrganizationDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
    </>
  );
};

export default OrganizationList;
