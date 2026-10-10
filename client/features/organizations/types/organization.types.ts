import { PageSize } from "@/types";

export interface GetOrganizationParams {
  pageSize: PageSize;
  cursor?: string | null;
  searchTerm?: string | null;
}

export interface UserOrganization {
  organizationId: number;
  name: string;
  description: string | null;
  logoUrl: string | null;
  roleName: string | null;
  roleDescription: string | null;
  joinedAt: string;
}

export interface CreateOrganizationRequest {
  name: string;
  description?: string;
  logoFile?: File;
}

export interface OrganizationResponse {
  organizationId: number;
  name: string;
  description?: string | null;
  logoUrl?: string | null;
  createdAt: string;
  currentUserRole: string;
}

export interface OrganizationDetails {
  organizationId: number;
  name: string;
  description?: string | null;
  logoUrl?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  currentUserRole: string;
  roleDescription: string;
  membershipStatus: string;
  joinedAt: string;
}

export interface UpdateOrganizationRequest {
  organizationId: number;
  name: string;
  description?: string | null;
  logoFile?: File;
  removeExistingLogo?: boolean;
}

export interface UpdateOrganizationResponse {
  organizationId: number;
  name: string;
  description?: string | null;
  logoUrl?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  currentUserRole: string;
  previousLogoUrl?: string | null;
}

export interface OrganizationMember {
  organizationMemberId: number;
  userId: number;
  email: string;
  fullName: string;
  profilePhotoUrl?: string | null;
  roleId: number;
  roleName: string;
  roleDescription: string;
  membershipStatus: string;
  joinedAt: string;
}

export interface GetOrganizationMembersParams {
  organizationId: number;
  pageSize: PageSize;
  cursor?: string;
  searchTerm?: string;
}
