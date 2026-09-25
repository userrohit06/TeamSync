import { FeatureCard } from "../FeatureCard";
import styles from "./Features.module.css";
import featuresData from "../../data/featureCardData.json";

export const Features = () => {
  return (
    <section className={`${styles.featureSection} container`} id="features">
      <div className={styles.heading}>
        <div className={styles.line1}>Everything your team needs</div>

        <div className={styles.line2}>
          One workspace for planning, execution and collaboration
        </div>
      </div>

      <div className={styles.featureCards}>
        {featuresData.features.map((feature) => (
          <FeatureCard
            key={feature.featureId}
            title={feature.title}
            description={feature.description}
            icon={feature.icon}
          />
        ))}
      </div>
    </section>
  );
};

export default Features;
