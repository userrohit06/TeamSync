import { ReactNode } from "react";
import styles from "./PageHeader.module.css";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

const PageHeader = ({ title, description, action }: PageHeaderProps) => {
  return (
    <div className={styles.header}>
      <div className={styles.text}>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>

      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
};

export default PageHeader;
