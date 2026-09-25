import Link from "next/link";
import { ArrowRight } from "lucide-react";
import styles from "./FinalCTA.module.css";

export const FinalCTA = () => {
  return (
    <section className={`${styles.ctaSection} container`}>
      <div className={styles.ctaContent}>
        <div className={styles.badge}>Ready to get started?</div>

        <h2 className={styles.title}>Bring your team together.</h2>

        <p className={styles.description}>
          Manage projects, tasks, files, and collaboration from one workspace
          built for modern teams.
        </p>

        <div className={styles.actions}>
          <Link href="/signup" className={styles.primaryButton}>
            Get Started
            <ArrowRight size={18} />
          </Link>

          <Link href="/signin" className={styles.secondaryButton}>
            Sign in
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
