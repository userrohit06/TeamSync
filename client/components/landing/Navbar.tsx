import Link from "next/link";
import { Menu, Sparkles, Sun } from "lucide-react";

import styles from "./Navbar.module.css";
import Button from "@/components/common/Button/Button";

const Navbar = () => {
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
            Solutions
          </Link>

          <Link href="#pricing" className={styles.navItem}>
            Pricing
          </Link>
        </div>

        {/* Right Side */}
        <div className={styles.rightSideItems}>
          {/* Theme */}
          <Button
            icon={<Sun size={16} />}
            variant="outline"
            size="small"
            aria-label="Toggle theme"
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
