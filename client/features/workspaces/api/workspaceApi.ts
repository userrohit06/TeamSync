import {
  AddWorkspaceMemberRequest,
  CreateWorkspaceRequest,
  GetWorkspaceMembersParams,
  GetWorkspacesParams,
  RemoveWorkspaceMemberRequest,
  TransferWorkspaceOwnershipRequest,
  UpdateWorkspaceMemberRoleRequest,
  UpdateWorkspaceRequest,
  WorkspaceDetails,
  WorkspaceItem,
  WorkspaceMember,
  WorkspaceRoleDTO,
} from "@/features/workspaces/types/workspace.types";
import { baseApi } from "@/store";
import { ApiDataResponse, ApiResponse, CursorPagedResult } from "@/types";

export const workspaceApi = baseApi
  .enhanceEndpoints({
    addTagTypes: ["Workspace", "WorkspaceMember", "WorkspaceRole"],
  })
  .injectEndpoints({
    endpoints: (builder) => ({
      getWorkspaces: builder.query<
        ApiDataResponse<CursorPagedResult<WorkspaceItem>>,
        GetWorkspacesParams
      >({
        query: ({ organizationId, pageSize, cursor, searchTerm }) => {
          const params = new URLSearchParams();
          params.set("PageSize", pageSize.toString());

          if (cursor) {
            params.set("Cursor", cursor);
          }

          if (searchTerm?.trim()) {
            params.set("SearchTerm", searchTerm.trim());
          }

          return {
            url: `/organizations/${organizationId}/workspaces?${params.toString()}`,
            method: "GET",
          };
        },
        providesTags: (result, _error, { organizationId }) => {
          const items = result?.data.items ?? [];
          return [
            { type: "Workspace" as const, id: `ORG_${organizationId}_LIST` },
            ...items.map((ws) => ({
              type: "Workspace" as const,
              id: ws.workspaceId,
            })),
          ];
        },
      }),

      getWorkspaceById: builder.query<
        ApiDataResponse<WorkspaceDetails>,
        { organizationId: number; workspaceId: number }
      >({
        query: ({ organizationId, workspaceId }) => ({
          url: `/organizations/${organizationId}/workspaces/${workspaceId}`,
          method: "GET",
        }),
        providesTags: (_result, _error, { workspaceId }) => [
          { type: "Workspace" as const, id: workspaceId },
        ],
      }),

      createWorkspace: builder.mutation<
        ApiDataResponse<WorkspaceItem>,
        CreateWorkspaceRequest
      >({
        query: ({ organizationId, name, description, isPrivate }) => ({
          url: `/organizations/${organizationId}/workspaces`,
          method: "POST",
          body: {
            name: name.trim(),
            description: description?.trim() || null,
            isPrivate,
          },
        }),
        invalidatesTags: (_result, _error, { organizationId }) => [
          { type: "Workspace", id: `ORG_${organizationId}_LIST` },
        ],
      }),

      updateWorkspace: builder.mutation<
        ApiDataResponse<WorkspaceDetails>,
        UpdateWorkspaceRequest
      >({
        query: ({ organizationId, workspaceId, name, description, isPrivate }) => ({
          url: `/organizations/${organizationId}/workspaces/${workspaceId}`,
          method: "PUT",
          body: {
            name: name?.trim() || null,
            description: description?.trim() || null,
            isPrivate,
          },
        }),
        invalidatesTags: (_result, _error, { organizationId, workspaceId }) => [
          { type: "Workspace", id: `ORG_${organizationId}_LIST` },
          { type: "Workspace", id: workspaceId },
        ],
      }),

      deleteWorkspace: builder.mutation<
        ApiResponse,
        { organizationId: number; workspaceId: number }
      >({
        query: ({ organizationId, workspaceId }) => ({
          url: `/organizations/${organizationId}/workspaces/${workspaceId}`,
          method: "DELETE",
        }),
        invalidatesTags: (_result, _error, { organizationId, workspaceId }) => [
          { type: "Workspace", id: `ORG_${organizationId}_LIST` },
          { type: "Workspace", id: workspaceId },
        ],
      }),

      getWorkspaceMembers: builder.query<
        ApiDataResponse<CursorPagedResult<WorkspaceMember>>,
        GetWorkspaceMembersParams
      >({
        query: ({ organizationId, workspaceId, pageSize, cursor, searchTerm }) => {
          const params = new URLSearchParams();
          params.set("PageSize", pageSize.toString());

          if (cursor) {
            params.set("Cursor", cursor);
          }

          if (searchTerm?.trim()) {
            params.set("SearchTerm", searchTerm.trim());
          }

          return {
            url: `/organizations/${organizationId}/workspaces/${workspaceId}/members?${params.toString()}`,
            method: "GET",
          };
        },
        providesTags: (result, _error, { workspaceId }) => {
          const members = result?.data.items ?? [];
          return [
            { type: "WorkspaceMember" as const, id: `WS_${workspaceId}_LIST` },
            ...members.map((m) => ({
              type: "WorkspaceMember" as const,
              id: `${workspaceId}_${m.userId}`,
            })),
          ];
        },
      }),

      getWorkspaceRoles: builder.query<ApiDataResponse<WorkspaceRoleDTO[]>, number>({
        query: (organizationId) => ({
          url: `/organizations/${organizationId}/workspaces/roles`,
          method: "GET",
        }),
        providesTags: [{ type: "WorkspaceRole", id: "ROLES" }],
      }),

      addWorkspaceMember: builder.mutation<
        ApiDataResponse<WorkspaceMember>,
        AddWorkspaceMemberRequest
      >({
        query: ({ organizationId, workspaceId, email, roleId }) => ({
          url: `/organizations/${organizationId}/workspaces/${workspaceId}/members/invite`,
          method: "POST",
          body: { email: email.trim(), roleId },
        }),
        invalidatesTags: (_result, _error, { workspaceId }) => [
          { type: "WorkspaceMember", id: `WS_${workspaceId}_LIST` },
          { type: "Workspace", id: workspaceId },
        ],
      }),

      updateWorkspaceMemberRole: builder.mutation<
        ApiDataResponse<WorkspaceMember>,
        UpdateWorkspaceMemberRoleRequest
      >({
        query: ({ organizationId, workspaceId, targetUserId, roleId }) => ({
          url: `/organizations/${organizationId}/workspaces/${workspaceId}/members/${targetUserId}/role`,
          method: "PUT",
          body: { roleId },
        }),
        invalidatesTags: (_result, _error, { workspaceId }) => [
          { type: "WorkspaceMember", id: `WS_${workspaceId}_LIST` },
        ],
      }),

      removeWorkspaceMember: builder.mutation<
        ApiResponse,
        RemoveWorkspaceMemberRequest
      >({
        query: ({ organizationId, workspaceId, targetUserId }) => ({
          url: `/organizations/${organizationId}/workspaces/${workspaceId}/members/${targetUserId}/remove`,
          method: "DELETE",
        }),
        invalidatesTags: (_result, _error, { workspaceId }) => [
          { type: "WorkspaceMember", id: `WS_${workspaceId}_LIST` },
          { type: "Workspace", id: workspaceId },
        ],
      }),

      transferWorkspaceOwnership: builder.mutation<
        ApiResponse,
        TransferWorkspaceOwnershipRequest
      >({
        query: ({
          organizationId,
          workspaceId,
          newOwnerUserId,
          previousOwnerNewRoleId,
        }) => ({
          url: `/organizations/${organizationId}/workspaces/${workspaceId}/transfer-ownership`,
          method: "POST",
          body: {
            newOwnerUserId,
            previousOwnerNewRoleId: previousOwnerNewRoleId || undefined,
          },
        }),
        invalidatesTags: (_result, _error, { organizationId, workspaceId }) => [
          { type: "Workspace", id: workspaceId },
          { type: "Workspace", id: `ORG_${organizationId}_LIST` },
          { type: "WorkspaceMember", id: `WS_${workspaceId}_LIST` },
        ],
      }),
    }),
  });

export const {
  useGetWorkspacesQuery,
  useLazyGetWorkspacesQuery,
  useGetWorkspaceByIdQuery,
  useCreateWorkspaceMutation,
  useUpdateWorkspaceMutation,
  useDeleteWorkspaceMutation,
  useGetWorkspaceMembersQuery,
  useGetWorkspaceRolesQuery,
  useAddWorkspaceMemberMutation,
  useUpdateWorkspaceMemberRoleMutation,
  useRemoveWorkspaceMemberMutation,
  useTransferWorkspaceOwnershipMutation,
} = workspaceApi;
