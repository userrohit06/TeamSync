import Link from "next/link";
import { BriefcaseBusiness, Network, Sparkles } from "lucide-react";
import styles from "./Footer.module.css";

export const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={`${styles.footerContainer} container`}>
        {/* Brand */}
        <div className={styles.brandSection}>
          <Link href="/" className={styles.logo}>
            <Sparkles size={19} className={styles.logoIcon} />
            <span>TeamSync</span>
          </Link>

          <p className={styles.description}>
            One workspace for your team&apos;s projects, tasks, files, and
            collaboration.
          </p>
        </div>

        {/* Links */}
        <div className={styles.linksSection}>
          {/* Product */}
          <div className={styles.linkGroup}>
            <h3 className={styles.groupTitle}>Product</h3>

            <Link href="#features" className={styles.footerLink}>
              Features
            </Link>

            <Link href="#pricing" className={styles.footerLink}>
              Pricing
            </Link>

            <Link href="#" className={styles.footerLink}>
              Documentation
            </Link>
          </div>

          {/* Company */}
          <div className={styles.linkGroup}>
            <h3 className={styles.groupTitle}>Company</h3>

            <Link href="#" className={styles.footerLink}>
              About
            </Link>

            <Link href="#" className={styles.footerLink}>
              Contact
            </Link>

            <Link href="#" className={styles.footerLink}>
              Careers
            </Link>
          </div>

          {/* Legal */}
          <div className={styles.linkGroup}>
            <h3 className={styles.groupTitle}>Legal</h3>

            <Link href="#" className={styles.footerLink}>
              Privacy
            </Link>

            <Link href="#" className={styles.footerLink}>
              Terms
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className={styles.bottomBar}>
        <div className={`${styles.bottomBarContainer} container`}>
          <p className={styles.copyright}>
            © {new Date().getFullYear()} TeamSync. All rights reserved.
          </p>

          <div className={styles.socialLinks}>
            <Link
              href="#"
              className={styles.socialLink}
              aria-label="TeamSync on GitHub"
            >
              <BriefcaseBusiness size={18} />
            </Link>

            <Link
              href="#"
              className={styles.socialLink}
              aria-label="TeamSync on LinkedIn"
            >
              <Network size={18} />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
