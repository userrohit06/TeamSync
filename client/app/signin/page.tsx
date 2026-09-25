import { SigninForm } from "@/features/auth";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In - TeamSync",
  description: "Sign in to your TeamSync account.",
};

const SigninPage = () => {
  return <SigninForm />;
};

export default SigninPage;
