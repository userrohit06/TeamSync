import type { Metadata } from "next";
import { ProjectDetails } from "@/features/projects/components/ProjectDetails";

interface PageProps {
  params: Promise<{ workspaceId: string; projectId: string }>;
  searchParams: Promise<{ orgId?: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { projectId } = await params;

  return {
    title: `Project #${projectId} | TeamSync`,
    description: "View project details, collaborators, milestones, and task deliverables",
  };
}

const ProjectDetailsPage = async ({ params, searchParams }: PageProps) => {
  const { workspaceId, projectId } = await params;
  const { orgId } = await searchParams;

  const parsedWsId = Number(workspaceId);
  const parsedProjId = Number(projectId);
  const parsedOrgId = orgId ? Number(orgId) : undefined;

  return (
    <ProjectDetails
      projectId={parsedProjId}
      workspaceId={parsedWsId}
      organizationId={parsedOrgId}
    />
  );
};

export default ProjectDetailsPage;
