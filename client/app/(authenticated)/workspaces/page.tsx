import type { Metadata } from "next";
import { WorkspaceList } from "@/features/workspaces/components/WorkspaceList/WorkspaceList";

export const metadata: Metadata = {
  title: "Workspaces | TeamSync",
  description: "Manage team workspaces, projects, and permissions",
};

interface PageProps {
  searchParams: Promise<{ orgId?: string }>;
}

const WorkspacesPage = async ({ searchParams }: PageProps) => {
  const { orgId } = await searchParams;
  const parsedOrgId = orgId ? Number(orgId) : undefined;

  return <WorkspaceList organizationId={parsedOrgId} />;
};

export default WorkspacesPage;
