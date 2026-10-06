"use client";

import { Menu } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";

import { useAppSelector } from "@/store/hooks";

import styles from "./AuthenticatedShell.module.css";
import Sidebar from "@/features/navigattion/components/Sidebar";
import { getNavigationTitle } from "@/features/navigattion/config/navigation";

interface AuthenticatedShellProps {
  children: ReactNode;
}

const SIDEBAR_STORAGE_KEY = "teamsync-sidebar-collapsed";

const AuthenticatedShell = ({ children }: AuthenticatedShellProps) => {
  const pathname = usePathname();
  const router = useRouter();

  const token = useAppSelector((state) => state.auth.token);

  const user = useAppSelector((state) => state.auth.user);

  const [collapsed, setCollapsed] = useState(false);

  const [mobileOpen, setMobileOpen] = useState(true);

  const [authChecking, setAuthChecking] = useState(true);

  useEffect(() => {
    try {
      const savedCollapsed = localStorage.getItem(SIDEBAR_STORAGE_KEY);

      if (savedCollapsed === "true") {
        setCollapsed(true);
      }
    } catch (error) {
      console.error("Failed to load sidebar preference:", error);
    }
  }, []);

  useEffect(() => {
    if (!token) {
      router.replace("/signin");
      return;
    }

    setAuthChecking(false);
  }, [token, router]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleToggleCollapsed = () => {
    setCollapsed((current) => {
      const next = !current;

      try {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
      } catch (error) {
        console.error("Failed to save sidebar preference:", error);
      }

      return next;
    });
  };

  const handleCloseMobile = useCallback(() => {
    setMobileOpen(false);
  }, []);

  if (authChecking || !token) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loadingOrb} />

        <span>Loading TeamSync...</span>
      </div>
    );
  }

  const pageTitle = getNavigationTitle(pathname);

  return (
    <div
      className={`
        ${styles.shell}
        ${collapsed ? styles.collapsed : ""}
      `}
    >
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onToggleCollapsed={handleToggleCollapsed}
        onCloseMobile={handleCloseMobile}
      />

      <div className={styles.mainArea}>
        <header className={styles.topbar}>
          <button
            type="button"
            className={styles.mobileMenuButton}
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
          >
            <Menu size={19} />
          </button>

          <div className={styles.pageHeading}>
            <span>TeamSync</span>

            <h1>{pageTitle}</h1>
          </div>

          <div className={styles.topbarUser}>
            <div className={styles.topbarAvatar}>
              {user?.ProfilePhoto ? (
                <img src={user.ProfilePhoto} alt={user.FullName} />
              ) : (
                (user?.FullName?.charAt(0).toUpperCase() ?? "U")
              )}
            </div>
          </div>
        </header>

        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
};

export default AuthenticatedShell;
