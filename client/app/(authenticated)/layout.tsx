import type { ReactNode } from "react";

import AuthenticatedShell from "@/features/authenticated-layout/components/AuthenticatedShell";

interface AuthenticatedLayoutProps {
  children: ReactNode;
}

const AuthenticatedLayout = ({ children }: AuthenticatedLayoutProps) => {
  return <AuthenticatedShell>{children}</AuthenticatedShell>;
};

export default AuthenticatedLayout;
