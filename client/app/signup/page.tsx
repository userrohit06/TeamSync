"use client";

import AuthLayout from "@/features/auth/AuthLayout/AuthLayout";
import Button from "@/components/common/Button/Button";
import Input from "@/components/common/Input/Input";
import { ImagePlus, Lock, Mail, User, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useSignupMutation } from "@/features/auth/api/authApi";
import useToast from "@/components/common/Toast/useToast";
import { getErrorMessage } from "@/lib/errorHandler";
import {
  PROFILE_PHOTO_MAX_SIZE,
  PROFILE_PHOTO_ALLOWED_TYPES,
} from "@/constants/constants";
import styles from "./signup.module.css";
import { useRouter } from "next/navigation";
import GoogleButton from "@/features/auth/GoogleButton/GoogleButton";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";

const Signup = () => {
  const [signup, { isLoading }] = useSignupMutation();
  const {
    handleGoogleSuccess,
    handleGoogleError,
    isLoading: isGoogleLoading,
  } = useGoogleAuth();
  const { success, error, warning } = useToast();
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    console.log(file);

    if (!file) return;

    if (!PROFILE_PHOTO_ALLOWED_TYPES.includes(file.type)) {
      warning(
        `Allowed file types are: ${PROFILE_PHOTO_ALLOWED_TYPES.join(", ")}`,
      );
      e.target.value = "";
      return;
    }

    if (file.size > PROFILE_PHOTO_MAX_SIZE) {
      warning(`Profile photo must be less than ${PROFILE_PHOTO_MAX_SIZE} MB.`);
      e.target.value = "";
      return;
    }

    setProfilePhoto(file);

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleRemoveProfilePhoto = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setProfilePhoto(null);
    setPreviewUrl(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const formData = new FormData();

      formData.append("FullName", fullName);
      formData.append("Email", email);
      formData.append("Password", password);

      if (profilePhoto) {
        formData.append("ProfilePhoto", profilePhoto);
      }

      const response = await signup(formData).unwrap();

      success(response.message);

      localStorage.setItem("email", email);

      // clear form
      setFullName("");
      setEmail("");
      setPassword("");
      setProfilePhoto(null);
      setPreviewUrl(null);

      router.push("/signin");
    } catch (err) {
      const errMsg = getErrorMessage(err);
      error(errMsg);
    }
  };

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start collaborating with your team today."
      footerText="Already have an account?"
      footerLinkText="Sign in"
      footerLinkHref="/signin"
    >
      <form onSubmit={handleSubmit}>
        {/* Full Name */}
        <div style={{ marginBottom: "18px" }}>
          <Input
            id="fullName"
            name="fullName"
            label="Full name"
            type="text"
            placeholder="Enter your full name"
            leftIcon={<User size={18} />}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            autoComplete="name"
            inputSize="medium"
          />
        </div>

        {/* Email */}
        <div style={{ marginBottom: "18px" }}>
          <Input
            id="email"
            name="email"
            label="Emal address"
            type="email"
            placeholder="Enter your email"
            leftIcon={<Mail size={18} />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            inputSize="medium"
          />
        </div>

        {/* Password */}
        <div style={{ marginBottom: "22px" }}>
          <Input
            id="password"
            name="password"
            label="Password"
            type="password"
            placeholder="Create a password"
            leftIcon={<Lock size={18} />}
            showPasswordToggle
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            inputSize="medium"
          />
        </div>

        {/* Profile Photo */}
        <div className={styles.photoSection}>
          <div className={styles.photoHeader}>
            <label className={styles.photoLabel}>Profile photo</label>

            <span className={styles.optional}>Optional</span>
          </div>

          <div className={styles.photoUpload}>
            {previewUrl ? (
              <div className={styles.previewWrapper}>
                <img
                  src={previewUrl}
                  alt="Profile preview"
                  className={styles.preview}
                />

                <button
                  type="button"
                  className={styles.removePhoto}
                  onClick={handleRemoveProfilePhoto}
                  aria-label="Remove profile photo"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className={styles.photoPlaceholder}>
                <ImagePlus size={24} />
              </div>
            )}

            <div className={styles.photoInfo}>
              <div className={styles.photoTitle}>
                {profilePhoto ? profilePhoto.name : "Upload your profile photo"}
              </div>

              {!profilePhoto && (
                <div className={styles.photoHint}>
                  JPG, JPEG or PNG • Max % MB
                </div>
              )}

              <label
                htmlFor="profilePhoto"
                className={styles.choosePhoto}
                style={profilePhoto ? { marginTop: "0.3rem" } : {}}
              >
                {profilePhoto ? "Change Photo" : "Choose Photo"}
              </label>

              <input
                type="file"
                id="profilePhoto"
                name="profilePhoto"
                accept=".jpg,.jpeg,.png,image/jpeg,image/jpeg,image/png"
                onChange={handleProfilePhotoChange}
                className={styles.fileInput}
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          variant="primary"
          size="medium"
          style={{ width: "100%" }}
          loading={isLoading}
        >
          Sign up
        </Button>
      </form>

      <div>
        <GoogleButton
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
        />
      </div>
    </AuthLayout>
  );
};

export default Signup;
