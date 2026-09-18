"use client";

import Link from "next/link";
import { Menu, Moon, Sparkles, Sun, X } from "lucide-react";

import styles from "./Navbar.module.css";
import Button from "@/components/common/Button/Button";
import { useTheme } from "@/context/ThemeContext/ThemeContext";
import { useEffect, useState } from "react";

const Navbar = () => {
  const { theme, toggleTheme } = useTheme();

  const [mounted, setMounted] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const closeMenu = () => setIsMenuOpen(false);

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

        {/* Desktop Navigation */}
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

          {/* Desktop Login */}
          <Link href="/signin" className={styles.loginLink}>
            Login
          </Link>

          {/* Desktop CTA */}
          <Link href="/signup" className={styles.navCta}>
            Get Started
          </Link>

          {/* Mobile Menu Button */}
          <Button
            icon={isMenuOpen ? <X size={16} /> : <Menu size={16} />}
            variant="outline"
            size="small"
            aria-label={
              isMenuOpen ? "Close navigation menu" : "Open navigation menu"
            }
            aria-expanded={isMenuOpen}
            className={styles.mobileMenuButton}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          />
        </div>
      </div>

      {/* Mobile Navigation */}
      <div
        className={`${styles.mobileMenu} ${isMenuOpen ? styles.mobileMenuOpen : styles.mobileMenuClosed}`}
      >
        <Link
          href="#features"
          className={styles.mobileNavItem}
          onClick={closeMenu}
        >
          Features
        </Link>

        <Link
          href="#solutions"
          className={styles.mobileNavItem}
          onClick={closeMenu}
        >
          How it works
        </Link>

        <Link
          href="#benefits"
          className={styles.mobileNavItem}
          onClick={closeMenu}
        >
          Benefits
        </Link>

        <Link
          href="#pricing"
          className={styles.mobileNavItem}
          onClick={closeMenu}
        >
          Pricing
        </Link>

        <div className={styles.mobileDivider} />

        <Link
          href={"/signin"}
          className={styles.mobileLogin}
          onClick={closeMenu}
        >
          Login
        </Link>

        <Link href="/signup" className={styles.mobileCta} onClick={closeMenu}>
          Get Started
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
