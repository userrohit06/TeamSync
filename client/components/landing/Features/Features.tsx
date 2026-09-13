import FeatureCard from "@/components/landing/FeatureCard/FeatureCard";
import styles from "./Features.module.css";
import featuresData from "@/data/featureCardData.json";

const Features = () => {
  return (
    <div className={`${styles.featureSection} container`}>
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
    </div>
  );
};

export default Features;
