"use client";

import Button from "@/components/common/Button/Button";
import Input from "@/components/common/Input/Input";
import useToast from "@/components/common/Toast/useToast";
import { useResetPasswordMutation } from "@/features/auth/api/authApi";
import AuthLayout from "@/features/auth/AuthLayout/AuthLayout";
import { getErrorMessage } from "@/lib/errorHandler";
import { Lock } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import React, { Suspense, useState } from "react";

const ResetPasswordForm = () => {
  const [resetPassword, { isLoading }] = useResetPasswordMutation();
  const { success, error } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Extract token payload variable directly from the URL link query string
  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      error("Passwords do not match.");
      return;
    }

    if (!token) {
      error("Reset token is missing or corrupted.");
      return;
    }

    try {
      const response = await resetPassword({ newPassword, token }).unwrap();

      // delay redirection briefly so the success toast is fully readable
      setTimeout(() => {
        router.push("/signin");
      }, 2000);
    } catch (err) {
      const errMsg = getErrorMessage(err);
      error(errMsg);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* New Password */}
      <div style={{ marginBottom: "18px" }}>
        <Input
          id="newPassword"
          name="newPassword"
          label="New Password"
          type="password"
          placeholder="Enter your new password"
          leftIcon={<Lock size={18} />}
          showPasswordToggle
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          inputSize="medium"
        />
      </div>

      {/* Confirm Password */}
      <div style={{ marginBottom: "18px" }}>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          label="Confirm Password"
          type="password"
          placeholder="Repeat your new password"
          leftIcon={<Lock size={18} />}
          showPasswordToggle
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          inputSize="medium"
        />
      </div>

      {/* Submit Action */}
      <Button
        type="submit"
        variant="primary"
        size="medium"
        style={{ width: "100%" }}
        loading={isLoading}
      >
        Update Password
      </Button>
    </form>
  );
};

// Main export wrapping form in a Suspense boundary (Required by Next.js when reading client query parameters)

const ResetPassword = () => {
  return (
    <AuthLayout
      title="Reset Password"
      subtitle="Please enter and confirm your secure new account password credentials below."
      footerText="Remembered it?"
      footerLinkText="Sign in"
      footerLinkHref="/signin"
    >
      <Suspense
        fallback={
          <div style={{ color: "var(--text-secondary)" }}>
            Loading layout context...
          </div>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </AuthLayout>
  );
};

export default ResetPassword;
