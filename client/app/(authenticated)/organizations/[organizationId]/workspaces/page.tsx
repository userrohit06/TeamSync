import type { Metadata } from "next";
import { WorkspaceList } from "@/features/workspaces/components/WorkspaceList/WorkspaceList";

interface PageProps {
  params: Promise<{ organizationId: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { organizationId } = await params;

  return {
    title: `Organization #${organizationId} Workspaces | TeamSync`,
    description: "Manage workspaces within this organization",
  };
}

const OrganizationWorkspacesPage = async ({ params }: PageProps) => {
  const { organizationId } = await params;
  const parsedOrgId = Number(organizationId);

  return <WorkspaceList organizationId={parsedOrgId} />;
};

export default OrganizationWorkspacesPage;
