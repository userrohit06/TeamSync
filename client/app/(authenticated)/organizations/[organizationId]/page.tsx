import { OrganizationDetails } from "@/features/organizations/components/OrganizationDetails/OrganizationDetails";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ organizationId: string }>;
}

export async function generateMetaData({
  params,
}: PageProps): Promise<Metadata> {
  const { organizationId } = await params;

  return {
    title: `Organization #${organizationId} | Workspaces`,
    description: "View organization details, members, and settings.",
  };
}

const OrganizationDetailsPage = async ({ params }: PageProps) => {
  const { organizationId } = await params;
  const parsedId = Number(organizationId);

  return <OrganizationDetails organizationId={parsedId} />;
};

export default OrganizationDetailsPage;
