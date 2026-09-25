import { FolderKanban, ListChecks, Users } from "lucide-react";
import styles from "./FeatureCard.module.css";

const iconMap = {
  FolderKanban,
  ListChecks,
  Users,
};

export interface FeatureCardProps {
  title: string;
  description: string;
  icon: string;
}

export const FeatureCard = ({ title, description, icon }: FeatureCardProps) => {
  const Icon = iconMap[icon as keyof typeof iconMap];

  return (
    <div className={styles.card}>
      <div className={styles.iconWrapper}>
        <Icon size={22} />
      </div>

      <div className={styles.title}>{title}</div>
      <div className={styles.description}>{description}</div>
    </div>
  );
};

export default FeatureCard;
