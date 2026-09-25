"use client";

import { ReactNode } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import ReduxProvider from "./ReduxProvider";
import { ThemeProvider } from "@/context/ThemeContext/ThemeContext";
import ToastProvider from "@/components/common/Toast/ToastProvider";

interface AppProvidersProps {
  children: ReactNode;
}

export const AppProviders = ({ children }: AppProvidersProps) => {
  return (
    <ReduxProvider>
      <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_CLIENT_ID || ""}>
        <ThemeProvider>
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </GoogleOAuthProvider>
    </ReduxProvider>
  );
};

export default AppProviders;
