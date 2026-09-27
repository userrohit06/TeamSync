"use client";

import { FolderKanban, ListChecks, Users } from "lucide-react";

import styles from "./page.module.css";

import { useAppSelector } from "@/store/hooks";

const DashboardPage = () => {
  const user = useAppSelector((state) => state.auth.user);

  return (
    <section className={styles.page}>
      <div className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>Workspace overview</span>

          <h2>
            Welcome back
            {user?.FullName ? `, ${user.FullName.split(" ")[0]}` : ""}.
          </h2>

          <p>
            Manage your organizations, workspaces, projects and team
            collaboration from one place.
          </p>
        </div>
      </div>

      <div className={styles.stats}>
        <div className={styles.card}>
          <div className={styles.cardIcon}>
            <FolderKanban size={19} />
          </div>

          <span>Projects</span>

          <strong>0</strong>
        </div>

        <div className={styles.card}>
          <div className={styles.cardIcon}>
            <ListChecks size={19} />
          </div>

          <span>Tasks</span>

          <strong>0</strong>
        </div>

        <div className={styles.card}>
          <div className={styles.cardIcon}>
            <Users size={19} />
          </div>

          <span>Team members</span>

          <strong>0</strong>
        </div>
      </div>
    </section>
  );
};

export default DashboardPage;
