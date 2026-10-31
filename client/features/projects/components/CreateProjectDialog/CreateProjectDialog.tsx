"use client";

import { FormEvent, useState } from "react";
import { Globe, Lock } from "lucide-react";
import Button from "@/components/common/Button";
import Dialog from "@/components/common/Dialog";
import Input from "@/components/common/Input";
import Select from "@/components/common/Select";
import {
  useCreateProjectMutation,
  useGetProjectStatusesQuery,
} from "@/features/projects/api/projectApi";
import { ProjectVisibility } from "@/features/projects/types/project.types";
import { useGetWorkspaceMembersQuery } from "@/features/workspaces/api/workspaceApi";
import { useToast } from "@/hooks";
import { getErrorMessage } from "@/lib";
import styles from "./CreateProjectDialog.module.css";

interface CreateProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: number;
  organizationId?: number;
}

export const CreateProjectDialog = ({
  isOpen,
  onClose,
  workspaceId,
  organizationId = 0,
}: CreateProjectDialogProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<ProjectVisibility>("Workspace");
  const [projectStatusId, setProjectStatusId] = useState<number | undefined>(
    undefined,
  );
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([]);

  const { data: statusesData } = useGetProjectStatusesQuery(
    organizationId ? { organizationId } : undefined,
    { skip: !isOpen },
  );
  const statuses = statusesData?.data ?? [];

  const { data: membersData } = useGetWorkspaceMembersQuery(
    {
      organizationId,
      workspaceId,
      pageSize: 50,
    },
    {
      skip:
        !isOpen ||
        !workspaceId ||
        !organizationId ||
        visibility !== "Restricted",
    },
  );
  const workspaceMembers = membersData?.data?.items ?? [];

  const [createProject, { isLoading }] = useCreateProjectMutation();
  const { success: toastSuccess, error: toastError } = useToast();

  const handleClose = () => {
    setName("");
    setDescription("");
    setVisibility("Workspace");
    setProjectStatusId(undefined);
    setStartDate("");
    setDueDate("");
    setSelectedMemberIds([]);
    onClose();
  };

  const handleMemberToggle = (userId: number) => {
    setSelectedMemberIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toastError("Project name is required");
      return;
    }

    if (startDate && dueDate && new Date(dueDate) < new Date(startDate)) {
      toastError("Due date cannot be earlier than start date");
      return;
    }

    try {
      const response = await createProject({
        workspaceId,
        name: name.trim(),
        description: description.trim() || undefined,
        visibility,
        projectStatusId: projectStatusId || undefined,
        startDate: startDate || undefined,
        dueDate: dueDate || undefined,
        initialMemberIds:
          visibility === "Restricted" && selectedMemberIds.length > 0
            ? selectedMemberIds
            : undefined,
      }).unwrap();

      toastSuccess(
        response.message ||
          `Project "${response.data?.name}" created successfully`,
      );
      handleClose();
    } catch (err) {
      const errMsg = getErrorMessage(err);
      toastError(errMsg);
    }
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} title="Create New Project">
      <form onSubmit={handleSubmit} className={styles.form}>
        <Input
          label="Project Name"
          required
          placeholder="e.g. Mobile App Redesign, Marketing Q4"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isLoading}
        />

        <div className={styles.field}>
          <label className={styles.label}>Description</label>
          <textarea
            className={styles.textarea}
            placeholder="Key objectives, milestones, or notes"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isLoading}
            rows={3}
          />
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>Project Status</label>
            <Select
              value={projectStatusId ? projectStatusId.toString() : ""}
              onChange={(val: string) => {
                const parsed = val ? Number(val) : undefined;

                setProjectStatusId(
                  parsed !== undefined && !Number.isNaN(parsed)
                    ? parsed
                    : undefined,
                );
              }}
              options={[
                { label: "Default (Backlog)", value: "" },
                ...statuses.map((s) => ({
                  label: `${s.name} (${s.category})`,
                  value: s.projectStatusId.toString(),
                })),
              ]}
              disabled={isLoading}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Start Date</label>
            <input
              type="date"
              className={styles.input}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Due Date</label>
          <input
            type="date"
            className={styles.input}
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Access & Visibility</label>
          <div className={styles.visibilityToggle}>
            <div
              className={`${styles.visibilityOption} ${
                visibility === "Workspace" ? styles.visibilityActive : ""
              }`}
              onClick={() => setVisibility("Workspace")}
            >
              <Globe size={18} color="var(--primary)" />
              <div>
                <div className={styles.visibilityTitle}>Workspace-Wide</div>
                <div className={styles.visibilityDesc}>
                  All workspace members can view and collaborate
                </div>
              </div>
            </div>

            <div
              className={`${styles.visibilityOption} ${
                visibility === "Restricted" ? styles.visibilityActive : ""
              }`}
              onClick={() => setVisibility("Restricted")}
            >
              <Lock size={18} color="var(--warning)" />
              <div>
                <div className={styles.visibilityTitle}>Restricted</div>
                <div className={styles.visibilityDesc}>
                  Only specifically invited members have access
                </div>
              </div>
            </div>
          </div>
        </div>

        {visibility === "Restricted" && (
          <div className={styles.field}>
            <label className={styles.label}>
              Initial Collaborators (Workspace Members)
            </label>
            <div className={styles.memberSelection}>
              {workspaceMembers.length === 0 ? (
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  No other workspace members available to pre-assign.
                </span>
              ) : (
                workspaceMembers.map((member) => (
                  <label key={member.userId} className={styles.memberCheckItem}>
                    <input
                      type="checkbox"
                      checked={selectedMemberIds.includes(member.userId)}
                      onChange={() => handleMemberToggle(member.userId)}
                    />
                    <span style={{ fontSize: "13px", fontWeight: 500 }}>
                      {member.fullName} ({member.email})
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>
        )}

        <div className={styles.actions}>
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={isLoading}>
            Create Project
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
