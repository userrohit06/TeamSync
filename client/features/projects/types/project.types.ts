import { PageSize } from "@/types";

export type ProjectVisibility = "Workspace" | "Restricted";

export interface ProjectItem {
  projectId: number;
  workspaceId: number;
  workspaceName?: string;
  workspaceSlug?: string;
  name: string;
  slug: string;
  description?: string | null;
  visibility: ProjectVisibility;
  projectStatusId: number;
  projectStatusName: string;
  projectStatusCategory: string;
  projectStatusColor?: string | null;
  ownerUserId: number;
  ownerName: string;
  ownerAvatarUrl?: string | null;
  startDate?: string | null;
  dueDate?: string | null;
  isArchived: boolean;
  createdAt: string;
  currentUserProjectRole: string;
  explicitMemberCount: number;
  memberCount?: number;
  totalMembers?: number;
}

export interface ProjectDetails {
  projectId: number;
  workspaceId: number;
  workspaceName: string;
  workspaceSlug: string;
  name: string;
  slug: string;
  description?: string | null;
  visibility: ProjectVisibility;
  projectStatusId: number;
  projectStatusName: string;
  projectStatusCategory: string;
  projectStatusColor?: string | null;
  ownerUserId: number;
  ownerName: string;
  ownerEmail?: string | null;
  ownerAvatarUrl?: string | null;
  createdByUserId: number;
  createdByName: string;
  startDate?: string | null;
  dueDate?: string | null;
  isArchived: boolean;
  archivedAt?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  currentUserProjectRole: string;
  canEdit: boolean;
  canManageMembers: boolean;
  canTransferOwnership: boolean;
  canDelete: boolean;
  explicitMemberCount: number;
}

export interface ProjectMember {
  userId: number;
  email: string;
  fullName: string;
  profilePhoto?: string | null;
  projectRole: string;
  isExplicit: boolean;
  isOwner: boolean;
  joinedAt?: string | null;
  workspaceRole: string;
}

export interface ProjectRoleDTO {
  projectRoleId: number;
  roleName: string;
  description?: string | null;
}

export interface ProjectStatusDTO {
  projectStatusId: number;
  name: string;
  category: string;
  colorHex?: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface GetProjectsParams {
  workspaceId?: number;
  pageSize: PageSize;
  cursor?: string | null;
  searchTerm?: string | null;
  projectStatusId?: number;
  includeArchived?: boolean;
}

export interface CreateProjectRequest {
  workspaceId: number;
  name: string;
  description?: string | null;
  visibility: ProjectVisibility;
  projectStatusId?: number | null;
  startDate?: string | null;
  dueDate?: string | null;
  initialMemberIds?: number[];
}

export interface UpdateProjectRequest {
  projectId: number;
  workspaceId?: number;
  name?: string;
  description?: string | null;
  projectStatusId?: number;
  startDate?: string | null;
  dueDate?: string | null;
  updateDates?: boolean;
}

export interface ChangeProjectStatusRequest {
  projectId: number;
  workspaceId?: number;
  projectStatusId: number;
}

export interface ChangeProjectVisibilityRequest {
  projectId: number;
  workspaceId?: number;
  visibility: ProjectVisibility;
  initialMemberIds?: number[];
}

export interface TransferProjectOwnershipRequest {
  projectId: number;
  workspaceId?: number;
  newOwnerUserId: number;
}

export interface AddOrAssignProjectMemberRequest {
  projectId: number;
  workspaceId?: number;
  targetUserId: number;
  projectRoleId: number;
}

export interface RemoveProjectMemberRequest {
  projectId: number;
  workspaceId?: number;
  targetUserId: number;
}

export interface GetProjectMembersParams {
  projectId: number;
  workspaceId?: number;
  pageSize: PageSize;
  cursor?: string | null;
  searchTerm?: string | null;
}
