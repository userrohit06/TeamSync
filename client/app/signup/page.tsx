import { SignupForm } from "@/features/auth";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Account - TeamSync",
  description: "Start collaborating with your team today.",
};

const SignupPage = () => {
  return <SignupForm />;
};

export default SignupPage;
