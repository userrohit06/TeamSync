"use client";

import Link from "next/link";
import { Menu, Moon, Sparkles, Sun } from "lucide-react";

import styles from "./Navbar.module.css";
import Button from "@/components/common/Button/Button";
import { useTheme } from "@/context/ThemeContext/ThemeContext";
import { useEffect, useState } from "react";

const Navbar = () => {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const Icon = !mounted ? (
    <Moon size={16} />
  ) : theme === "light" ? (
    <Moon size={16} />
  ) : (
    <Sun size={16} />
  );

  const AriaLabel = !mounted
    ? "Toggle theme"
    : theme === "light"
      ? "Switch to dark mode"
      : "Switch to light mode";

  return (
    <nav className={styles.navbar}>
      <div className={`${styles.navbarContainer} container`}>
        {/* Logo */}
        <Link href="/" className={styles.logoDiv}>
          <Sparkles size={16} className={styles.logoIcon} />
          <span>TeamSync</span>
        </Link>

        {/* Navigation */}
        <div className={styles.navItems}>
          <Link href="#features" className={styles.navItem}>
            Features
          </Link>

          <Link href="#solutions" className={styles.navItem}>
            How it works
          </Link>

          <Link href="#benefits" className={styles.navItem}>
            Benefits
          </Link>

          <Link href="#pricing" className={styles.navItem}>
            Pricing
          </Link>
        </div>

        {/* Right Side */}
        <div className={styles.rightSideItems}>
          {/* Theme Toggle */}
          <Button
            icon={Icon}
            variant="outline"
            size="small"
            aria-label={AriaLabel}
            onClick={toggleTheme}
          />

          {/* Login */}
          <Link href="/login" className={styles.loginLink}>
            Login
          </Link>

          {/* Get Started */}
          <Link href="/register" className={styles.navCta}>
            Get Started
          </Link>

          {/* Mobile Menu */}
          <Button
            icon={<Menu size={16} />}
            variant="outline"
            size="small"
            aria-label="Open navigation menu"
            className={styles.mobileMenuButton}
          />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
