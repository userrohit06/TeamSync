import { Check } from "lucide-react";
import styles from "./Pricing.module.css";
import pricingData from "../../data/pricingData.json";

export const Pricing = () => {
  return (
    <section id="pricing" className={`${styles.pricingSection} container`}>
      {/* Section Heading */}
      <div className={styles.heading}>
        <h2 className={styles.title}>Simple pricing for every team</h2>

        <p className={styles.subtitle}>
          Start for free and upgrade when your team needs more power.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className={styles.pricingGrid}>
        {pricingData.plans.map((plan) => (
          <article
            key={plan.planId}
            className={`${styles.card} ${
              plan.popular ? styles.popularCard : ""
            }`}
          >
            {/* Popular Badge */}
            {plan.popular && (
              <div className={styles.popularBadge}>Most Popular</div>
            )}

            {/* Plan Header */}
            <div className={styles.cardHeader}>
              <h3 className={styles.planName}>{plan.name}</h3>

              <p className={styles.planDescription}>{plan.description}</p>
            </div>

            {/* Price */}
            <div className={styles.priceWrapper}>
              <span className={styles.price}>{plan.price}</span>

              <span className={styles.period}>{plan.period}</span>
            </div>

            {/* Features */}
            <ul className={styles.featureList}>
              {plan.features.map((feature) => (
                <li key={feature} className={styles.featureItem}>
                  <Check size={18} className={styles.checkIcon} />

                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <button
              className={`${styles.planButton} ${
                plan.variant === "primary"
                  ? styles.primaryButton
                  : styles.outlineButton
              }`}
            >
              {plan.buttonText}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
};

export default Pricing;
