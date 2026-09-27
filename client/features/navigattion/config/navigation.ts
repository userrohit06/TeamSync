import {
  Activity,
  BriefcaseBusiness,
  Building2,
  CheckSquare2,
  ClipboardList,
  FileText,
  FolderKanban,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";

import type { LucideIcon } from "lucide-react";

export interface NavigationItem {
  label: string;
  href: string;
  icon: LucideIcon;
  children?: NavigationItem[];
}

export interface NavigationSection {
  title: string;
  items: NavigationItem[];
}

export const navigationSections: NavigationSection[] = [
  {
    title: "Overview",
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
      },
    ],
  },

  {
    title: "Organization",
    items: [
      {
        label: "Organizations",
        href: "/organizations",
        icon: Building2,
        children: [
          {
            label: "Members",
            href: "/organizations/members",
            icon: Users,
          },
          {
            label: "Roles",
            href: "/organizations/roles",
            icon: ShieldCheck,
          },
          {
            label: "Settings",
            href: "/organizations/settings",
            icon: Settings,
          },
        ],
      },
    ],
  },

  {
    title: "Work Management",
    items: [
      {
        label: "Workspaces",
        href: "/workspaces",
        icon: BriefcaseBusiness,
        children: [
          {
            label: "Projects",
            href: "/workspaces/projects",
            icon: FolderKanban,
          },
          {
            label: "Tasks",
            href: "/workspaces/tasks",
            icon: CheckSquare2,
          },
        ],
      },
    ],
  },

  {
    title: "Collaboration",
    items: [
      {
        label: "Files",
        href: "/files",
        icon: FileText,
      },
      {
        label: "Activity",
        href: "/activity",
        icon: Activity,
      },
    ],
  },
];

export const bottomNavigationItems: NavigationItem[] = [
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
  },
  {
    label: "Profile",
    href: "/profile",
    icon: ClipboardList,
  },
];

export const isNavigationItemActive = (
  pathname: string,
  item: NavigationItem,
): boolean => {
  if (pathname === item.href) {
    return true;
  }

  if (item.children?.length) {
    return item.children.some((child) =>
      isNavigationItemActive(pathname, child),
    );
  }

  return pathname.startsWith(`${item.href}/`);
};

export const getNavigationTitle = (pathname: string) => {
  const allItems = [
    ...navigationSections.flatMap((section) => section.items),
    ...bottomNavigationItems,
  ];

  for (const item of allItems) {
    if (pathname === item.href) {
      return item.label;
    }

    const child = item.children?.find(
      (childItem) =>
        pathname === childItem.href ||
        pathname.startsWith(`${childItem.href}/`),
    );

    if (child) {
      return child.label;
    }

    if (pathname.startsWith(`${item.href}/`)) {
      return item.label;
    }
  }

  return "Dashboard";
};
