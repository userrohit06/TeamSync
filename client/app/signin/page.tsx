"use client";

import AuthLayout from "@/features/auth/AuthLayout/AuthLayout";
import Button from "@/components/common/Button/Button";
import Input from "@/components/common/Input/Input";
import { Lock, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import {
  useGoogleSigninMutation,
  useSigninMutation,
} from "@/features/auth/api/authApi";
import useToast from "@/components/common/Toast/useToast";
import { getErrorMessage } from "@/lib/errorHandler";
import GoogleButton from "@/features/auth/GoogleButton/GoogleButton";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import Link from "next/link";

const Signup = () => {
  const [signin, { isLoading }] = useSigninMutation();
  const {
    handleGoogleSuccess,
    handleGoogleError,
    isLoading: isGoogleLoading,
  } = useGoogleAuth();
  const { success, error } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const payload = { email, password };

      const response = await signin(payload).unwrap();

      success(response.message);
    } catch (err) {
      const errMsg = getErrorMessage(err);
      error(errMsg);
    }
  };

  useEffect(() => {
    const registeredEmail = localStorage.getItem("email") as string;

    if (registeredEmail) {
      setEmail(registeredEmail);
      localStorage.removeItem("email");
    }
  }, []);

  return (
    <AuthLayout
      title="Sign in"
      subtitle="Start collaborating with your team today."
      footerText="Don't have an account?"
      footerLinkText="Sign up"
      footerLinkHref="/signup"
    >
      <form onSubmit={handleSubmit}>
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

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginTop: "-12px",
            marginBottom: "20px",
          }}
        >
          <Link
            href={"/forgot-password"}
            style={{
              fontSize: "14px",
              color: "var(--primary)",
              fontWeight: 500,
            }}
          >
            Forgot Password?
          </Link>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          variant="primary"
          size="medium"
          style={{ width: "100%" }}
          loading={isLoading}
        >
          Sign In
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
