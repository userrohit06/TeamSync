"use client";

import {
  ChangeEvent,
  DragEvent,
  FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import Button from "@/components/common/Button";
import Dialog from "@/components/common/Dialog";
import Input from "@/components/common/Input";
import { useUpdateOrganizationMutation } from "@/features/organizations/api/organizationApi";

import styles from "./EditOrganizationDialog.module.css";
import { OrganizationDetails } from "@/features/organizations/types/organization.types";
import { CloudUpload } from "lucide-react";

interface EditOrganizationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  organization: OrganizationDetails;
}

export const EditOrganizationDialog = ({
  isOpen,
  onClose,
  organization,
}: EditOrganizationDialogProps) => {
  const [name, setName] = useState(organization.name);
  const [description, setDescription] = useState(
    organization.description ?? "",
  );
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    organization.logoUrl ?? null,
  );
  const [removeExistingLogo, setRemoveExistingLogo] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [updateOrganization, { isLoading }] = useUpdateOrganizationMutation();

  useEffect(() => {
    if (isOpen) {
      setName(organization.name);
      setDescription(organization.description ?? "");
      setPreviewUrl(organization.logoUrl ?? null);
      setLogoFile(null);
      setRemoveExistingLogo(false);
      setFormError(null);
    }
  }, [isOpen, organization]);

  const handleFileSelect = (file: File | undefined) => {
    if (file && file.type.startsWith("image/")) {
      setLogoFile(file);
      setRemoveExistingLogo(false);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files?.[0]);
  };

  const handleDragOver = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files?.[0]);
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setRemoveExistingLogo(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError("Organization name is required.");
      return;
    }

    try {
      setFormError(null);
      await updateOrganization({
        organizationId: organization.organizationId,
        name: name.trim(),
        description: description.trim() || undefined,
        logoFile: logoFile || undefined,
        removeExistingLogo,
      }).unwrap();

      onClose();
    } catch (err: any) {
      setFormError(err?.data?.message || "Failed to update organization.");
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} title="Edit Organization">
      <form onSubmit={handleSubmit} className={styles.form}>
        {formError && <div className={styles.errorMessage}>{formError}</div>}

        <div className={styles.field}>
          <label className={styles.label}>Organization Name *</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Organization name"
            disabled={isLoading}
            required
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief overview of your organization..."
            className={styles.textarea}
            rows={3}
            disabled={isLoading}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Organization Logo</label>
          <div className={styles.uploadContainer}>
            <input
              ref={fileInputRef}
              id="edit-org-logo-upload"
              type="file"
              accept="image/png, image/jpeg, image/jpg"
              onChange={handleFileChange}
              className={styles.hiddenInput}
              disabled={isLoading}
            />

            {previewUrl ? (
              <div className={styles.previewBox}>
                <div className={styles.previewImageContainer}>
                  <img
                    src={previewUrl}
                    alt="Logo preview"
                    className={styles.previewImg}
                  />
                </div>
                <div className={styles.previewMeta}>
                  <p className={styles.fileName}>
                    {logoFile?.name || "Current Logo"}
                  </p>
                  <span className={styles.fileSize}>
                    {logoFile
                      ? `${(logoFile.size / 1024).toFixed(1)} KB`
                      : "Stored on server"}
                  </span>
                  <div className={styles.previewActions}>
                    <button
                      type="button"
                      className={styles.changeBtn}
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isLoading}
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      className={styles.removeBtn}
                      onClick={handleRemoveLogo}
                      disabled={isLoading}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <label
                htmlFor="edit-org-logo-upload"
                className={`${styles.dropzone} ${isDragging ? styles.dropzoneActive : ""}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className={styles.uploadIcon}>
                  <CloudUpload size={14} />
                </div>
                <div className={styles.dropzoneText}>
                  <p className={styles.dropzonePrimary}>
                    <span className={styles.accentText}>Click to upload</span>{" "}
                    or drag and drop
                  </p>
                  <p className={styles.dropzoneSecondary}>
                    PNG, JPG, or JPEG (max 5MB)
                  </p>
                </div>
              </label>
            )}
          </div>
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
