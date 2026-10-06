"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  ShieldCheck,
  Users,
  Clock,
  Briefcase,
  Pencil,
  Trash2,
} from "lucide-react";

import Button from "@/components/common/Button";
import Card from "@/components/common/Card";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import StatusBadge from "@/components/common/StatusBadge";
import {
  useDeleteOrganizationMutation,
  useGetOrganizationIdQuery,
} from "@/features/organizations/api/organizationApi";
import { EditOrganizationDialog } from "../EditOrganizationDialog/EditOrganizationDialog";

import styles from "./OrganizationDetails.module.css";
import { useToast } from "@/hooks";
import { getErrorMessage } from "@/lib";

interface OrganizationDetailsProps {
  organizationId: number;
}

export const OrganizationDetails = ({
  organizationId,
}: OrganizationDetailsProps) => {
  const router = useRouter();
  const { success: toastSuccess, error: toastError } = useToast();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const { data, isLoading, error } = useGetOrganizationIdQuery(organizationId);
  const [deleteOrganization, { isLoading: isDeleting }] =
    useDeleteOrganizationMutation();

  const org = data?.data;
  const isOwner = org?.currentUserRole.toLowerCase() === "owner";

  const handleDelete = async () => {
    try {
      console.log("delete click");
      await deleteOrganization(organizationId).unwrap();
      router.push("/organizations");
      toastSuccess(`${org?.name || "Organization"} deleted succesfully`);
    } catch (err) {
      const errMsg = getErrorMessage(err);
      toastError(errMsg);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p>Loading organization details...</p>
      </div>
    );
  }

  if (error || !org) {
    return (
      <div className={styles.errorState}>
        <h3>Organization Not Found</h3>
        <p>Could not load the requested organization.</p>
        <Link href="/organizations">
          <Button variant="secondary">Back to Organizations</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Link href="/organizations" className={styles.backLink}>
        <ArrowLeft size={16} /> Back to Organizations
      </Link>

      {/* Main Hero Banner */}
      <Card className={styles.heroCard}>
        <div className={styles.heroMain}>
          {org.logoUrl ? (
            <img src={org.logoUrl} alt={org.name} className={styles.logo} />
          ) : (
            <div className={styles.logoFallback}>
              {org.name.charAt(0).toUpperCase()}
            </div>
          )}

          <div className={styles.heroDetails}>
            <div className={styles.heroTitleRow}>
              <h1 className={styles.orgTitle}>{org.name}</h1>
              <StatusBadge variant="info">{org.membershipStatus}</StatusBadge>
            </div>
            <p className={styles.orgDescription}>
              {org.description || "No description provided."}
            </p>
            <span className={styles.orgIdBadge}>
              Organization ID: #{org.organizationId}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className={styles.heroActions}>
          <Button
            variant="secondary"
            onClick={() => setIsEditOpen(true)}
            size="medium"
          >
            <Pencil size={15} /> Edit
          </Button>

          <Link href={`/organizations/${org.organizationId}/members`}>
            <Button variant="secondary" size="medium">
              <Users size={15} /> Members
            </Button>
          </Link>

          {isOwner && (
            <Button
              variant="secondary"
              size="medium"
              onClick={() => setIsDeleteOpen(true)}
              className={styles.deleteButton}
            >
              <Trash2 size={15} /> Delete
            </Button>
          )}
        </div>
      </Card>

      {/* Details Grid */}
      <div className={styles.contentGrid}>
        <Card className={styles.sectionCard}>
          <h3 className={styles.sectionTitle}>
            <ShieldCheck size={18} className={styles.iconAccent} /> Membership &
            Access
          </h3>

          <div className={styles.detailsList}>
            <div className={styles.detailRow}>
              <span className={styles.label}>Your Role</span>
              <span className={styles.roleHighlight}>
                {org.currentUserRole}
              </span>
            </div>

            <div className={styles.detailRowStacked}>
              <span className={styles.label}>Role Permissions</span>
              <p className={styles.descriptionValue}>
                {org.roleDescription || "Standard workspace permissions."}
              </p>
            </div>

            <div className={styles.detailRow}>
              <span className={styles.label}>Membership Status</span>
              <StatusBadge variant="success">
                {org.membershipStatus}
              </StatusBadge>
            </div>

            <div className={styles.detailRow}>
              <span className={styles.label}>
                <Calendar size={15} /> Joined On
              </span>
              <span className={styles.value}>
                {new Date(org.joinedAt).toLocaleDateString(undefined, {
                  dateStyle: "medium",
                })}
              </span>
            </div>

            <div className={styles.detailRow}>
              <span className={styles.label}>
                <Clock size={15} /> Created At
              </span>
              <span className={styles.value}>
                {new Date(org.createdAt).toLocaleDateString(undefined, {
                  dateStyle: "medium",
                })}
              </span>
            </div>

            {org.updatedAt && (
              <div className={styles.detailRow}>
                <span className={styles.label}>
                  <Clock size={15} /> Last Updated
                </span>
                <span className={styles.value}>
                  {new Date(org.updatedAt).toLocaleDateString(undefined, {
                    dateStyle: "medium",
                  })}
                </span>
              </div>
            )}
          </div>
        </Card>

        <div className={styles.sideColumn}>
          <Card className={styles.sectionCard}>
            <h3 className={styles.sectionTitle}>
              <Briefcase size={18} className={styles.iconPrimary} />{" "}
              Organization Workspace
            </h3>
            <p className={styles.cardHelperText}>
              Manage projects, workflows, and task pipelines within this
              organization.
            </p>

            <div className={styles.actionGrid}>
              <Link href="/workspaces" className={styles.navBlock}>
                <Briefcase size={20} />
                <div>
                  <strong>Workspaces</strong>
                  <span>Browse team workspaces</span>
                </div>
              </Link>

              <Link
                href={`/organizations/${org.organizationId}/members`}
                className={styles.navBlock}
              >
                <Users size={20} />
                <div>
                  <strong>Team Members</strong>
                  <span>Manage invites & permissions</span>
                </div>
              </Link>
            </div>
          </Card>
        </div>
      </div>

      {/* Edit Organization Modal */}
      <EditOrganizationDialog
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        organization={org}
      />

      {/* Reusable Delete Confirmation Dialog */}
      <ConfirmDialog
        open={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Organization"
        description={`Are you sure you want to delete "${org.name}"? This action is permanent and cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        loading={isDeleting}
      />
    </div>
  );
};
