"use client";

import { Button, Dialog, Input } from "@/components";
import { useCreateOrganizationMutation } from "@/features/organizations/api/organizationApi";
import { useToast } from "@/hooks";
import { getErrorMessage } from "@/lib";
import { ChangeEvent, FormEvent, useRef, useState } from "react";
import styles from "./CreateOrganizationDialog.module.css";
import { Upload } from "lucide-react";

interface CreateOrganizationDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateOrganizationDialog = ({
  isOpen,
  onClose,
}: CreateOrganizationDialogProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [createOrganization, { isLoading }] = useCreateOrganizationMutation();
  const { success, error } = useToast();

  const handleFileSelect = (file: File | undefined) => {
    if (file && file.type.startsWith("image/")) {
      setLogoFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    handleFileSelect(file);
  };

  const handleDragOver = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    handleFileSelect(file);
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    setName("");
    setDescription("");
    setLogoFile(null);
    setPreviewUrl(null);
    onClose();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      error("Organization name is required");
      return;
    }

    try {
      const response = await createOrganization({
        name: name.trim(),
        description: description.trim() || undefined,
        logoFile: logoFile || undefined,
      }).unwrap();

      success(response.message);

      handleClose();
    } catch (err) {
      const errMsg = getErrorMessage(err);
      error(errMsg);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} title="Create Organization">
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label className={styles.label}>Organization Name *</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Exe Corporation"
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
              type="file"
              ref={fileInputRef}
              id="org-logo-upload"
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
                  <p className={styles.fileName}>{logoFile?.name}</p>

                  <span className={styles.fileSize}>
                    {logoFile ? `${(logoFile.size / 1024).toFixed(1)} KB` : ""}
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
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isLoading}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <label
                htmlFor="org-logo-upload"
                className={`${styles.dropzone} ${isDragging ? styles.dropzoneActive : ""}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className={styles.uploadIcon}>
                  <Upload size={22} strokeWidth={2} />
                </div>

                <div className={styles.dropzoneText}>
                  <p className={styles.dropzonePrimary}>
                    <span className={styles.accentText}>Click to upload</span>{" "}
                    or dragand drop
                  </p>

                  <p className={styles.dropzoneSecondary}>
                    PNG, JPG or JPEG (max 5MB)
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
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>

          <Button type="submit" variant="primary" loading={isLoading}>
            Create
          </Button>
        </div>
      </form>
    </Dialog>
  );
};

export default CreateOrganizationDialog;
