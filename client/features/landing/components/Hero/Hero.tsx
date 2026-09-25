"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/common";
import styles from "./Hero.module.css";

export const Hero = () => {
  const router = useRouter();

  return (
    <main className={`${styles.main} container`}>
      {/* Left section */}
      <div className={styles.textSection}>
        <div className={styles.badge}>Built for modern teams</div>

        <div className={styles.mainHeading}>Your team, working as one.</div>

        <div className={styles.secondaryPara}>
          Manage projects, tasks, files and collaboration in one place.
        </div>

        <div className={styles.actions}>
          <Button
            variant="primary"
            size="large"
            onClick={() => router.push("/signup")}
          >
            Get Started
          </Button>

          <Button variant="outline" size="large">
            See how it works
          </Button>
        </div>
      </div>

      {/* Dashboard preview section */}
      <div className={styles.dashboardPreview}>
        <Image
          src="/landing-page-dashboard-preview.avif"
          alt="TeamSync dashboard Preview"
          width={1200}
          height={750}
          priority
        />
      </div>
    </main>
  );
};

export default Hero;
