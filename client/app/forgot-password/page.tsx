import { ForgotPasswordForm } from "@/features/auth";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forgot Password - TeamSync",
  description: "Recover access to your TeamSync account.",
};

const ForgotPasswordPage = () => {
  return <ForgotPasswordForm />;
};

export default ForgotPasswordPage;
