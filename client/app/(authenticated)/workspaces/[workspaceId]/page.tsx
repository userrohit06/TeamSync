import type { Metadata } from "next";
import { WorkspaceDetails } from "@/features/workspaces/components/WorkspaceDetails/WorkspaceDetails";

interface PageProps {
  params: Promise<{ workspaceId: string }>;
  searchParams: Promise<{ orgId?: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { workspaceId } = await params;

  return {
    title: `Workspace #${workspaceId} | TeamSync`,
    description: "View workspace details, team members, and settings",
  };
}

const WorkspaceDetailsPage = async ({ params, searchParams }: PageProps) => {
  const { workspaceId } = await params;
  const { orgId } = await searchParams;

  const parsedWsId = Number(workspaceId);
  const parsedOrgId = orgId ? Number(orgId) : undefined;

  return <WorkspaceDetails workspaceId={parsedWsId} organizationId={parsedOrgId} />;
};

export default WorkspaceDetailsPage;
