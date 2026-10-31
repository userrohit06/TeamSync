"use client";

import { FormEvent, useEffect, useState } from "react";
import Button from "@/components/common/Button";
import Dialog from "@/components/common/Dialog";
import Input from "@/components/common/Input";
import Select from "@/components/common/Select";
import {
  useGetProjectStatusesQuery,
  useUpdateProjectMutation,
} from "@/features/projects/api/projectApi";
import { ProjectDetails, ProjectItem } from "@/features/projects/types/project.types";
import { useToast } from "@/hooks";
import { getErrorMessage } from "@/lib";
import styles from "./EditProjectDialog.module.css";

interface EditProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectDetails | ProjectItem;
  organizationId?: number;
}

export const EditProjectDialog = ({
  isOpen,
  onClose,
  project,
  organizationId,
}: EditProjectDialogProps) => {
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description || "");
  const [projectStatusId, setProjectStatusId] = useState<number>(project.projectStatusId);
  const [startDate, setStartDate] = useState(
    project.startDate ? project.startDate.split("T")[0] : ""
  );
  const [dueDate, setDueDate] = useState(
    project.dueDate ? project.dueDate.split("T")[0] : ""
  );

  useEffect(() => {
    setName(project.name);
    setDescription(project.description || "");
    setProjectStatusId(project.projectStatusId);
    setStartDate(project.startDate ? project.startDate.split("T")[0] : "");
    setDueDate(project.dueDate ? project.dueDate.split("T")[0] : "");
  }, [project]);

  const { data: statusesData } = useGetProjectStatusesQuery(
    organizationId ? { organizationId } : undefined,
    { skip: !isOpen }
  );
  const statuses = statusesData?.data ?? [];

  const [updateProject, { isLoading }] = useUpdateProjectMutation();
  const { success: toastSuccess, error: toastError } = useToast();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toastError("Project name cannot be empty");
      return;
    }

    if (startDate && dueDate && new Date(dueDate) < new Date(startDate)) {
      toastError("Due date cannot be earlier than start date");
      return;
    }

    try {
      const response = await updateProject({
        projectId: project.projectId,
        workspaceId: project.workspaceId,
        name: name.trim(),
        description: description.trim() || null,
        projectStatusId,
        startDate: startDate || null,
        dueDate: dueDate || null,
        updateDates: true,
      }).unwrap();

      toastSuccess(response.message || "Project updated successfully");
      onClose();
    } catch (err) {
      const errMsg = getErrorMessage(err);
      toastError(errMsg);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} title="Edit Project Details">
      <form onSubmit={handleSubmit} className={styles.form}>
        <Input
          label="Project Name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isLoading}
        />

        <div className={styles.field}>
          <label className={styles.label}>Description</label>
          <textarea
            className={styles.textarea}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isLoading}
            rows={3}
          />
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>Status</label>
            <Select
              value={projectStatusId.toString()}
              onChange={(e) => setProjectStatusId(Number(e.target.value))}
              options={statuses.map((s) => ({
                label: `${s.name} (${s.category})`,
                value: s.projectStatusId.toString(),
              }))}
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

        <div className={styles.actions}>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={isLoading}>
            Save Changes
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
