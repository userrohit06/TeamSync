import { LayoutDashboard, ListChecks, Users } from "lucide-react";

import styles from "./Solutions.module.css";
import solutionsData from "@/data/solutionsData.json";

const iconMap = {
  LayoutDashboard,
  ListChecks,
  Users,
};

const Solutions = () => {
  return (
    <section className={`${styles.solutionsSection} container`}>
      {/* Section Heading */}
      <div className={styles.heading}>
        <h2 className={styles.title}>Built for the way teams work</h2>

        <p className={styles.subtitle}>
          Keep your entire workflow connected from planning to execution.
        </p>
      </div>

      {/* Dashboard Preview */}
      <div className={styles.preview}>
        <div className={styles.previewContent}>
          <span>TeamSync Workspace</span>

          <div className={styles.previewLine}></div>

          <div className={styles.previewCards}>
            <div></div>
            <div></div>
            <div></div>
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className={styles.steps}>
        {solutionsData.solutions.map((solution) => {
          const Icon = iconMap[solution.icon as keyof typeof iconMap];

          return (
            <article key={solution.step} className={styles.step}>
              <div className={styles.stepNumber}>{solution.step}</div>

              <div className={styles.stepIcon}>
                <Icon size={22} />
              </div>

              <div className={styles.stepContent}>
                <h3 className={styles.stepTitle}>{solution.title}</h3>

                <p className={styles.stepDescription}>{solution.description}</p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};

export default Solutions;

// The dashboard preview above is intentionally a CSS mockup, not another random image. Later, when we have a real TeamSync dashboard, we can replace that preview with an actual screenshot/mockup.

// And this gives the landing page a nice progression:

// Hero → What TeamSync has → How a team actually uses it.
