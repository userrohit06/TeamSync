import { ResetPasswordForm } from "@/features/auth";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reset Password - TeamSync",
  description: "Reset your TeamSync password.",
};

const ResetPasswordPage = () => {
  return <ResetPasswordForm />;
};

export default ResetPasswordPage;
