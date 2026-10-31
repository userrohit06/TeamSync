import type { Metadata } from "next";
import { ProjectList } from "@/features/projects/components/ProjectList";

interface PageProps {
  params: Promise<{ workspaceId: string }>;
  searchParams: Promise<{ orgId?: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { workspaceId } = await params;

  return {
    title: `Workspace #${workspaceId} Projects | TeamSync`,
    description: "View and manage projects in this workspace",
  };
}

const WorkspaceProjectsPage = async ({ params, searchParams }: PageProps) => {
  const { workspaceId } = await params;
  const { orgId } = await searchParams;

  const parsedWsId = Number(workspaceId);
  const parsedOrgId = orgId ? Number(orgId) : undefined;

  return <ProjectList workspaceId={parsedWsId} organizationId={parsedOrgId} />;
};

export default WorkspaceProjectsPage;
