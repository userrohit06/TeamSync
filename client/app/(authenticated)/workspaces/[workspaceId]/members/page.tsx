import type { Metadata } from "next";
import { WorkspaceMemberList } from "@/features/workspaces/components/WorkspaceMemberList/WorkspaceMemberList";

interface PageProps {
  params: Promise<{ workspaceId: string }>;
  searchParams: Promise<{ orgId?: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { workspaceId } = await params;

  return {
    title: `Workspace #${workspaceId} Members | TeamSync`,
    description: "Manage workspace team members and role permissions",
  };
}

const WorkspaceMembersPage = async ({ params, searchParams }: PageProps) => {
  const { workspaceId } = await params;
  const { orgId } = await searchParams;

  const parsedWsId = Number(workspaceId);
  const parsedOrgId = orgId ? Number(orgId) : undefined;

  return <WorkspaceMemberList workspaceId={parsedWsId} organizationId={parsedOrgId} />;
};

export default WorkspaceMembersPage;
