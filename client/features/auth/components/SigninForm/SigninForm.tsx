"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Lock, Mail } from "lucide-react";
import { AuthLayout } from "../AuthLayout";
import { GoogleButton } from "../GoogleButton";
import { Button, Input, useToast } from "@/components/common";
import { useSigninMutation } from "../../api";
import { useGoogleAuth } from "../../hooks";
import { getErrorMessage } from "@/lib";

export const SigninForm = () => {
  const [signin, { isLoading }] = useSigninMutation();
  const { handleGoogleSuccess, handleGoogleError } = useGoogleAuth();
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
    const registeredEmail = localStorage.getItem("email");

    if (registeredEmail) {
      localStorage.removeItem("email");
      queueMicrotask(() => {
        setEmail(registeredEmail);
      });
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
            label="Email address"
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
            placeholder="Enter your password"
            leftIcon={<Lock size={18} />}
            showPasswordToggle
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
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
            href="/forgot-password"
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

export default SigninForm;
