"use client";

import {
  ChevronDown,
  ChevronRight,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  bottomNavigationItems,
  isNavigationItemActive,
  navigationSections,
  type NavigationItem,
} from "../config/navigation";

import styles from "./Sidebar.module.css";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logout } from "@/store/slices/authSlice";

interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onToggleCollapsed: () => void;
  onCloseMobile: () => void;
}

const Sidebar = ({
  collapsed,
  mobileOpen,
  onToggleCollapsed,
  onCloseMobile,
}: SidebarProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  const activeParentItems = useMemo(() => {
    const expanded: Record<string, boolean> = {};
    navigationSections.forEach((section) => {
      section.items.forEach((item) => {
        if (item.children?.length && isNavigationItemActive(pathname, item)) {
          expanded[item.label] = true;
        }
      });
    });
    return expanded;
  }, [pathname]);

  const [openItems, setOpenItems] =
    useState<Record<string, boolean>>(activeParentItems);

  useEffect(() => {
    setOpenItems((current) => ({
      ...current,
      ...activeParentItems,
    }));
  }, [activeParentItems]);

  const toggleItem = (label: string) => {
    setOpenItems((current) => ({
      ...current,
      [label]: !current[label],
    }));
  };

  const handleLogout = () => {
    dispatch(logout());
    router.replace("/signin");
  };

  const getInitials = () => {
    if (!user?.FullName) return "U";
    return user.FullName.split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        className={`${styles.backdrop} ${mobileOpen ? styles.backdropActive : ""}`}
        onClick={onCloseMobile}
        aria-hidden="true"
      />

      <aside
        className={`
          ${styles.sidebar}
          ${collapsed ? styles.collapsed : ""}
          ${mobileOpen ? styles.mobileOpen : styles.mobileClosed}
        `}
      >
        <div className={styles.sidebarInner}>
          {/* Brand Row */}
          <div className={styles.brandRow}>
            <Link
              href="/dashboard"
              className={styles.brand}
              aria-label="TeamSync dashboard"
              onClick={onCloseMobile}
            >
              <span className={styles.brandIcon}>
                <Sparkles size={18} />
              </span>
              <span className={styles.brandText}>TeamSync</span>
            </Link>

            {/* Mobile close button (X) */}
            <button
              type="button"
              className={`${styles.iconButton} ${styles.mobileCloseButton}`}
              onClick={onCloseMobile}
              aria-label="Close navigation"
            >
              <X size={18} />
            </button>

            {/* Desktop collapse button */}
            <button
              type="button"
              className={`${styles.iconButton} ${styles.desktopCollapseButton}`}
              onClick={onToggleCollapsed}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? (
                <PanelLeftOpen size={18} />
              ) : (
                <PanelLeftClose size={18} />
              )}
            </button>
          </div>

          {/* Navigation Section */}
          <nav className={styles.navigation}>
            {navigationSections.map((section) => (
              <div key={section.title} className={styles.navigationSection}>
                <div className={styles.sectionTitle}>{section.title}</div>
                <div className={styles.navigationItems}>
                  {section.items.map((item) => (
                    <NavigationItemRow
                      key={item.href}
                      item={item}
                      pathname={pathname}
                      isOpen={!!openItems[item.label]}
                      onToggle={() => toggleItem(item.label)}
                      onCloseMobile={onCloseMobile}
                    />
                  ))}
                </div>
              </div>
            ))}
          </nav>

          {/* Bottom Section */}
          <div className={styles.bottomSection}>
            <div className={styles.bottomNavigation}>
              {bottomNavigationItems.map((item) => (
                <NavigationItemRow
                  key={item.href}
                  item={item}
                  pathname={pathname}
                  isOpen={false}
                  onToggle={() => undefined}
                  onCloseMobile={onCloseMobile}
                />
              ))}
            </div>

            {/* User Badge */}
            <div className={styles.userSection}>
              <div className={styles.userInfo}>
                <div className={styles.avatar}>
                  {user?.ProfilePhoto ? (
                    <img src={user.ProfilePhoto} alt={user.FullName} />
                  ) : (
                    getInitials()
                  )}
                </div>
                <div className={styles.userDetails}>
                  <span className={styles.userName}>
                    {user?.FullName ?? "User"}
                  </span>
                  <span className={styles.userEmail}>{user?.Email ?? ""}</span>
                </div>
              </div>

              <button
                type="button"
                className={styles.logoutButton}
                onClick={handleLogout}
                aria-label="Logout"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

interface NavigationItemRowProps {
  item: NavigationItem;
  pathname: string;
  isOpen: boolean;
  onToggle: () => void;
  onCloseMobile: () => void;
}

const NavigationItemRow = ({
  item,
  pathname,
  isOpen,
  onToggle,
  onCloseMobile,
}: NavigationItemRowProps) => {
  const Icon = item.icon;
  const itemActive = isNavigationItemActive(pathname, item);
  const hasChildren = Boolean(item.children?.length);

  return (
    <div className={styles.itemWrapper}>
      <div
        className={`${styles.itemRow} ${itemActive ? styles.itemActive : ""}`}
      >
        <Link
          href={item.href}
          className={styles.itemLink}
          onClick={onCloseMobile}
        >
          <span className={styles.itemIcon}>
            <Icon size={18} />
          </span>
          <span className={styles.itemLabel}>{item.label}</span>
        </Link>

        {hasChildren && (
          <button
            type="button"
            className={styles.expandButton}
            onClick={onToggle}
            aria-label={
              isOpen ? `Collapse ${item.label}` : `Expand ${item.label}`
            }
          >
            {isOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
          </button>
        )}
      </div>

      {hasChildren && isOpen && (
        <div className={styles.subNavigation}>
          {item.children?.map((child) => {
            const ChildIcon = child.icon;
            const childActive = isNavigationItemActive(pathname, child);

            return (
              <Link
                key={child.href}
                href={child.href}
                className={`${styles.subItem} ${childActive ? styles.subItemActive : ""}`}
                onClick={onCloseMobile}
              >
                <span className={styles.subItemIcon}>
                  <ChildIcon size={15} />
                </span>
                <span className={styles.itemLabel}>{child.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Sidebar;
