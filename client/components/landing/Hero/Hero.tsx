import Button from "@/components/common/Button/Button";
import Image from "next/image";
import styles from "./Hero.module.css";

const Hero = () => {
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
          <Button variant="primary" size="large">
            Get Started
          </Button>

          <Button variant="outline" size="large">
            See how it works
          </Button>
        </div>
      </div>

      {/* Dashboard preview section */}
      <div className="dashboardPreview">
        <img
          src={"/landing-page-dashboard-preview.avif"}
          alt="TeamSync dashboard Preview"
        />
      </div>
    </main>
  );
};

export default Hero;
