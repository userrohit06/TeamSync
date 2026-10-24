import { PageSize } from "@/types";

export interface GetWorkspacesParams {
  organizationId: number;
  pageSize: PageSize;
  cursor?: string | null;
  searchTerm?: string | null;
}

export interface WorkspaceItem {
  workspaceId: number;
  organizationId: number;
  name: string;
  slug: string;
  description?: string | null;
  isPrivate: boolean;
  createdAt: string;
  currentUserWorkspaceRole: string;
  memberCount: number;
}

export interface WorkspaceDetails {
  workspaceId: number;
  organizationId: number;
  name: string;
  slug: string;
  description?: string | null;
  visibility: string;
  status: string;
  createdAt: string;
  updatedAt?: string | null;
  createdByUserId: number;
  createdByUserName: string;
  updatedByUserId?: number | null;
  updatedByUserName?: string | null;
  currentUserWorkspaceRole: string;
  totalMembers: number;
}

export interface CreateWorkspaceRequest {
  organizationId: number;
  name: string;
  description?: string | null;
  isPrivate: boolean;
}

export interface UpdateWorkspaceRequest {
  organizationId: number;
  workspaceId: number;
  name?: string | null;
  description?: string | null;
  isPrivate?: boolean | null;
}

export interface WorkspaceMember {
  userId: number;
  email: string;
  fullName: string;
  profilePhoto?: string | null;
  workspaceRole: string;
  isExplicit: boolean;
  joinedAt?: string | null;
  organizationRole: string;
}

export interface GetWorkspaceMembersParams {
  organizationId: number;
  workspaceId: number;
  pageSize: PageSize;
  cursor?: string | null;
  searchTerm?: string | null;
}

export interface WorkspaceRoleDTO {
  roleId: number;
  roleName: string;
  description: string;
}

export interface AddWorkspaceMemberRequest {
  organizationId: number;
  workspaceId: number;
  email: string;
  roleId: number;
}

export interface UpdateWorkspaceMemberRoleRequest {
  organizationId: number;
  workspaceId: number;
  targetUserId: number;
  roleId: number;
}

export interface RemoveWorkspaceMemberRequest {
  organizationId: number;
  workspaceId: number;
  targetUserId: number;
}

export interface TransferWorkspaceOwnershipRequest {
  organizationId: number;
  workspaceId: number;
  newOwnerUserId: number;
  previousOwnerNewRoleId?: number;
}
