"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { AuthLayout } from "../AuthLayout";
import { Button, Input, useToast } from "@/components/common";
import { useForgotPasswordMutation } from "../../api";
import { getErrorMessage } from "@/lib";

export const ForgotPasswordForm = () => {
  const { success, error } = useToast();
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const response = await forgotPassword({ email }).unwrap();
      success(response.message);
      setIsSubmitted(true);
    } catch (err) {
      const errMsg = getErrorMessage(err);
      error(errMsg);
    }
  };

  if (isSubmitted) {
    return (
      <AuthLayout
        title="Check your email"
        subtitle={`We have dispatched a password recovery link to ${email} if it is registered in our system.`}
        footerText="Didn't get the email?"
        footerLinkText="Try again"
        footerLinkHref="#"
      >
        <div style={{ textAlign: "center", marginTop: "10px" }}>
          <Link
            href="/signin"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              color: "var(--primary)",
              fontWeight: 500,
            }}
          >
            <ArrowLeft size={16} /> Back to Sign in
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Forgot Password"
      subtitle="Provide your account's email address to recover your access."
      footerText="Remember your password?"
      footerLinkText="Sign in"
      footerLinkHref="/signin"
    >
      <form onSubmit={handleSubmit}>
        {/* Email Address */}
        <div style={{ marginBottom: "24px" }}>
          <Input
            id="email"
            name="email"
            label="Email Address"
            type="email"
            placeholder="Enter your registered email"
            leftIcon={<Mail size={18} />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
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
          Send Reset Link
        </Button>
      </form>
    </AuthLayout>
  );
};

export default ForgotPasswordForm;
