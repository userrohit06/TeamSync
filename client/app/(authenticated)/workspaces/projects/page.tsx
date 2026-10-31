import type { Metadata } from "next";
import { ProjectList } from "@/features/projects/components/ProjectList";

export const metadata: Metadata = {
  title: "Projects | TeamSync",
  description: "Manage team projects, track task deadlines, and collaborate on deliverables",
};

interface PageProps {
  searchParams: Promise<{ orgId?: string; workspaceId?: string }>;
}

const ProjectsPage = async ({ searchParams }: PageProps) => {
  const { orgId, workspaceId } = await searchParams;
  const parsedOrgId = orgId ? Number(orgId) : undefined;
  const parsedWsId = workspaceId ? Number(workspaceId) : undefined;

  return <ProjectList organizationId={parsedOrgId} workspaceId={parsedWsId} />;
};

export default ProjectsPage;
