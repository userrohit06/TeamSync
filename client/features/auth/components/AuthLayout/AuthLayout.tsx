"use client";

import { ReactNode } from "react";
import styles from "./AuthLayout.module.css";
import Link from "next/link";
import { Sparkles } from "lucide-react";

export interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footerText: string;
  footerLinkText: string;
  footerLinkHref: string;
}

export const AuthLayout = ({
  title,
  subtitle,
  children,
  footerText,
  footerLinkText,
  footerLinkHref,
}: AuthLayoutProps) => {
  return (
    <main className={styles.page}>
      <div className={styles.backgroundGlow} />

      <div className={styles.container}>
        {/* Logo */}
        <Link href={"/"} className={styles.logo}>
          <Sparkles size={20} className={styles.logoIcon} />
          <span>TeamSync</span>
        </Link>

        {/* Auth Card */}
        <div className={styles.card}>
          <div className={styles.header}>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>

          <div className={styles.content}>{children}</div>

          <div className={styles.footer}>
            <span>{footerText}</span>

            <Link href={footerLinkHref}>{footerLinkText}</Link>
          </div>
        </div>

        {/* Back to Home */}
        <Link href={"/"} className={styles.backHome}>
          ← Back to home
        </Link>
      </div>
    </main>
  );
};

export default AuthLayout;
