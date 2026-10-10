import type { Metadata } from "next";
import { OrganizationMemberList } from "@/features/organizations/components/OrganizationMemberList/OrganizationMemberList";

interface PageProps {
  params: Promise<{ organizationId: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { organizationId } = await params;
  return {
    title: `Members | Organization #${organizationId}`,
    description: "Manage and view members of this organization",
  };
}

export default async function OrganizationMembersPage({ params }: PageProps) {
  const { organizationId } = await params;
  const parsedId = Number(organizationId);

  return <OrganizationMemberList organizationId={parsedId} />;
}
