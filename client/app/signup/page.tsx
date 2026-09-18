"use client";

import AuthLayout from "@/features/auth/AuthLayout/AuthLayout";
import Button from "@/components/common/Button/Button";
import Input from "@/components/common/Input/Input";
import { Lock, Mail, User } from "lucide-react";
import { useState } from "react";
import { useSignupMutation } from "@/features/auth/api/authApi";
import useToast from "@/components/common/Toast/useToast";
import { getErrorMessage } from "@/lib/errorHandler";

const Signup = () => {
  const [signup, { isLoading }] = useSignupMutation();

  const { success, error } = useToast();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const formData = new FormData();

      formData.append("FullName", fullName);
      formData.append("Email", email);
      formData.append("Password", password);

      const response = await signup(formData).unwrap();

      success(response.message);
    } catch (err) {
      const errMsg = getErrorMessage(err);
      error(errMsg);
    }
  };

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
            label="password"
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
    </AuthLayout>
  );
};

export default Signup;
