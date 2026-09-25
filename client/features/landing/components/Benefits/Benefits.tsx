import { Activity, FolderKanban, Users, Zap } from "lucide-react";
import styles from "./Benefits.module.css";
import benefitsData from "../../data/benefitsData.json";

const iconMap = {
  FolderKanban,
  Users,
  Zap,
  Activity,
};

export const Benefits = () => {
  return (
    <section className={`${styles.benefitsSection} container`} id="benefits">
      <div className={styles.heading}>
        <h2 className={styles.title}>Work without the chaos</h2>

        <p className={styles.subtitle}>
          Everything your team needs stays connected, organized, and easy to
          find.
        </p>
      </div>

      <div className={styles.benefitsGrid}>
        {benefitsData.benefits.map((benefit) => {
          const Icon = iconMap[benefit.icon as keyof typeof iconMap];

          return (
            <article key={benefit.benefitId} className={styles.card}>
              <div className={styles.iconWrapper}>
                <Icon size={22} />
              </div>

              <h3 className={styles.cardTitle}>{benefit.title}</h3>

              <p className={styles.cardDescription}>{benefit.description}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
};

export default Benefits;
