import {
  AddOrAssignProjectMemberRequest,
  ChangeProjectStatusRequest,
  ChangeProjectVisibilityRequest,
  CreateProjectRequest,
  GetProjectMembersParams,
  GetProjectsParams,
  ProjectDetails,
  ProjectItem,
  ProjectMember,
  ProjectRoleDTO,
  ProjectStatusDTO,
  RemoveProjectMemberRequest,
  TransferProjectOwnershipRequest,
  UpdateProjectRequest,
} from "@/features/projects/types/project.types";
import { baseApi } from "@/store";
import { ApiDataResponse, ApiResponse, CursorPagedResult } from "@/types";

export const projectApi = baseApi
  .enhanceEndpoints({
    addTagTypes: ["Project", "ProjectMember", "ProjectRole", "ProjectStatus"],
  })
  .injectEndpoints({
    endpoints: (builder) => ({
      getProjects: builder.query<
        ApiDataResponse<CursorPagedResult<ProjectItem>>,
        GetProjectsParams
      >({
        query: ({
          workspaceId,
          pageSize,
          cursor,
          searchTerm,
          projectStatusId,
          includeArchived,
        }) => {
          const params = new URLSearchParams();
          params.set("PageSize", pageSize.toString());

          if (cursor) {
            params.set("Cursor", cursor);
          }

          if (searchTerm?.trim()) {
            params.set("SearchTerm", searchTerm.trim());
          }

          if (projectStatusId) {
            params.set("ProjectStatusId", projectStatusId.toString());
          }

          if (includeArchived) {
            params.set("IncludeArchived", "true");
          }

          const baseUrl = workspaceId
            ? `/workspaces/${workspaceId}/projects`
            : `/projects`;

          return {
            url: `${baseUrl}?${params.toString()}`,
            method: "GET",
          };
        },
        providesTags: (result, _error, { workspaceId }) => {
          const items = result?.data.items ?? [];
          return [
            {
              type: "Project" as const,
              id: workspaceId ? `WS_${workspaceId}_LIST` : "ALL_PROJECTS_LIST",
            },
            ...items.map((proj) => ({
              type: "Project" as const,
              id: proj.projectId,
            })),
          ];
        },
      }),

      getProjectById: builder.query<
        ApiDataResponse<ProjectDetails>,
        { projectId: number; workspaceId?: number }
      >({
        query: ({ projectId, workspaceId }) => ({
          url: workspaceId
            ? `/workspaces/${workspaceId}/projects/${projectId}`
            : `/projects/${projectId}`,
          method: "GET",
        }),
        providesTags: (_result, _error, { projectId }) => [
          { type: "Project" as const, id: projectId },
        ],
      }),

      createProject: builder.mutation<
        ApiDataResponse<ProjectItem>,
        CreateProjectRequest
      >({
        query: ({
          workspaceId,
          name,
          description,
          visibility,
          projectStatusId,
          startDate,
          dueDate,
          initialMemberIds,
        }) => ({
          url: `/workspaces/${workspaceId}/projects`,
          method: "POST",
          body: {
            name: name.trim(),
            description: description?.trim() || null,
            visibility,
            projectStatusId: projectStatusId || null,
            startDate: startDate || null,
            dueDate: dueDate || null,
            initialMemberIds: initialMemberIds || null,
          },
        }),
        invalidatesTags: (_result, _error, { workspaceId }) => [
          { type: "Project", id: `WS_${workspaceId}_LIST` },
          { type: "Project", id: "ALL_PROJECTS_LIST" },
        ],
      }),

      updateProject: builder.mutation<
        ApiDataResponse<ProjectDetails>,
        UpdateProjectRequest
      >({
        query: ({
          projectId,
          workspaceId,
          name,
          description,
          projectStatusId,
          startDate,
          dueDate,
          updateDates,
        }) => ({
          url: workspaceId
            ? `/workspaces/${workspaceId}/projects/${projectId}`
            : `/projects/${projectId}`,
          method: "PUT",
          body: {
            name: name?.trim() || null,
            description: description?.trim() || null,
            projectStatusId: projectStatusId || null,
            startDate: startDate || null,
            dueDate: dueDate || null,
            updateDates: updateDates ?? false,
          },
        }),
        invalidatesTags: (_result, _error, { projectId, workspaceId }) => [
          { type: "Project", id: projectId },
          {
            type: "Project",
            id: workspaceId ? `WS_${workspaceId}_LIST` : "ALL_PROJECTS_LIST",
          },
          { type: "Project", id: "ALL_PROJECTS_LIST" },
        ],
      }),

      changeProjectStatus: builder.mutation<
        ApiDataResponse<ProjectDetails>,
        ChangeProjectStatusRequest
      >({
        query: ({ projectId, workspaceId, projectStatusId }) => ({
          url: workspaceId
            ? `/workspaces/${workspaceId}/projects/${projectId}/status`
            : `/projects/${projectId}/status`,
          method: "PATCH",
          body: { projectStatusId },
        }),
        invalidatesTags: (_result, _error, { projectId, workspaceId }) => [
          { type: "Project", id: projectId },
          {
            type: "Project",
            id: workspaceId ? `WS_${workspaceId}_LIST` : "ALL_PROJECTS_LIST",
          },
          { type: "Project", id: "ALL_PROJECTS_LIST" },
        ],
      }),

      changeProjectVisibility: builder.mutation<
        ApiDataResponse<ProjectDetails>,
        ChangeProjectVisibilityRequest
      >({
        query: ({ projectId, workspaceId, visibility, initialMemberIds }) => ({
          url: workspaceId
            ? `/workspaces/${workspaceId}/projects/${projectId}/visibility`
            : `/projects/${projectId}/visibility`,
          method: "PATCH",
          body: { visibility, initialMemberIds },
        }),
        invalidatesTags: (_result, _error, { projectId, workspaceId }) => [
          { type: "Project", id: projectId },
          {
            type: "Project",
            id: workspaceId ? `WS_${workspaceId}_LIST` : "ALL_PROJECTS_LIST",
          },
          { type: "Project", id: "ALL_PROJECTS_LIST" },
          { type: "ProjectMember", id: `PROJECT_${projectId}_MEMBERS` },
        ],
      }),

      transferProjectOwnership: builder.mutation<
        ApiDataResponse<ProjectDetails>,
        TransferProjectOwnershipRequest
      >({
        query: ({ projectId, workspaceId, newOwnerUserId }) => ({
          url: workspaceId
            ? `/workspaces/${workspaceId}/projects/${projectId}/transfer-ownership`
            : `/projects/${projectId}/transfer-ownership`,
          method: "POST",
          body: { newOwnerUserId },
        }),
        invalidatesTags: (_result, _error, { projectId, workspaceId }) => [
          { type: "Project", id: projectId },
          {
            type: "Project",
            id: workspaceId ? `WS_${workspaceId}_LIST` : "ALL_PROJECTS_LIST",
          },
          { type: "Project", id: "ALL_PROJECTS_LIST" },
          { type: "ProjectMember", id: `PROJECT_${projectId}_MEMBERS` },
        ],
      }),

      archiveProject: builder.mutation<
        ApiDataResponse<ProjectDetails>,
        { projectId: number; workspaceId?: number }
      >({
        query: ({ projectId, workspaceId }) => ({
          url: workspaceId
            ? `/workspaces/${workspaceId}/projects/${projectId}/archive`
            : `/projects/${projectId}/archive`,
          method: "POST",
        }),
        invalidatesTags: (_result, _error, { projectId, workspaceId }) => [
          { type: "Project", id: projectId },
          {
            type: "Project",
            id: workspaceId ? `WS_${workspaceId}_LIST` : "ALL_PROJECTS_LIST",
          },
          { type: "Project", id: "ALL_PROJECTS_LIST" },
        ],
      }),

      restoreArchivedProject: builder.mutation<
        ApiDataResponse<ProjectDetails>,
        { projectId: number; workspaceId?: number }
      >({
        query: ({ projectId, workspaceId }) => ({
          url: workspaceId
            ? `/workspaces/${workspaceId}/projects/${projectId}/restore-archive`
            : `/projects/${projectId}/restore-archive`,
          method: "POST",
        }),
        invalidatesTags: (_result, _error, { projectId, workspaceId }) => [
          { type: "Project", id: projectId },
          {
            type: "Project",
            id: workspaceId ? `WS_${workspaceId}_LIST` : "ALL_PROJECTS_LIST",
          },
          { type: "Project", id: "ALL_PROJECTS_LIST" },
        ],
      }),

      deleteProject: builder.mutation<
        ApiResponse,
        { projectId: number; workspaceId?: number }
      >({
        query: ({ projectId, workspaceId }) => ({
          url: workspaceId
            ? `/workspaces/${workspaceId}/projects/${projectId}`
            : `/projects/${projectId}`,
          method: "DELETE",
        }),
        invalidatesTags: (_result, _error, { projectId, workspaceId }) => [
          { type: "Project", id: projectId },
          {
            type: "Project",
            id: workspaceId ? `WS_${workspaceId}_LIST` : "ALL_PROJECTS_LIST",
          },
          { type: "Project", id: "ALL_PROJECTS_LIST" },
        ],
      }),

      restoreDeletedProject: builder.mutation<
        ApiDataResponse<ProjectDetails>,
        { projectId: number; workspaceId?: number }
      >({
        query: ({ projectId, workspaceId }) => ({
          url: workspaceId
            ? `/workspaces/${workspaceId}/projects/${projectId}/restore-deleted`
            : `/projects/${projectId}/restore-deleted`,
          method: "POST",
        }),
        invalidatesTags: (_result, _error, { projectId, workspaceId }) => [
          { type: "Project", id: projectId },
          {
            type: "Project",
            id: workspaceId ? `WS_${workspaceId}_LIST` : "ALL_PROJECTS_LIST",
          },
          { type: "Project", id: "ALL_PROJECTS_LIST" },
        ],
      }),

      getProjectMembers: builder.query<
        ApiDataResponse<CursorPagedResult<ProjectMember>>,
        GetProjectMembersParams
      >({
        query: ({ projectId, workspaceId, pageSize, cursor, searchTerm }) => {
          const params = new URLSearchParams();
          params.set("PageSize", pageSize.toString());

          if (cursor) {
            params.set("Cursor", cursor);
          }

          if (searchTerm?.trim()) {
            params.set("SearchTerm", searchTerm.trim());
          }

          const baseUrl = workspaceId
            ? `/workspaces/${workspaceId}/projects/${projectId}/members`
            : `/projects/${projectId}/members`;

          return {
            url: `${baseUrl}?${params.toString()}`,
            method: "GET",
          };
        },
        providesTags: (_result, _error, { projectId }) => [
          { type: "ProjectMember", id: `PROJECT_${projectId}_MEMBERS` },
        ],
      }),

      addOrAssignProjectMember: builder.mutation<
        ApiDataResponse<ProjectMember>,
        AddOrAssignProjectMemberRequest
      >({
        query: ({ projectId, workspaceId, targetUserId, projectRoleId }) => ({
          url: workspaceId
            ? `/workspaces/${workspaceId}/projects/${projectId}/members`
            : `/projects/${projectId}/members`,
          method: "POST",
          body: { targetUserId, projectRoleId },
        }),
        invalidatesTags: (_result, _error, { projectId }) => [
          { type: "Project", id: projectId },
          { type: "ProjectMember", id: `PROJECT_${projectId}_MEMBERS` },
        ],
      }),

      removeProjectMember: builder.mutation<
        ApiResponse,
        RemoveProjectMemberRequest
      >({
        query: ({ projectId, workspaceId, targetUserId }) => ({
          url: workspaceId
            ? `/workspaces/${workspaceId}/projects/${projectId}/members/${targetUserId}`
            : `/projects/${projectId}/members/${targetUserId}`,
          method: "DELETE",
        }),
        invalidatesTags: (_result, _error, { projectId }) => [
          { type: "Project", id: projectId },
          { type: "ProjectMember", id: `PROJECT_${projectId}_MEMBERS` },
        ],
      }),

      getProjectRoles: builder.query<
        ApiDataResponse<ProjectRoleDTO[]>,
        { organizationId?: number; excludeOwner?: boolean } | void
      >({
        query: (args) => {
          const params = new URLSearchParams();
          if (args?.organizationId) {
            params.set("organizationId", args.organizationId.toString());
          }
          if (args?.excludeOwner) {
            params.set("excludeOwner", "true");
          }
          return {
            url: `/projects/roles${params.toString() ? `?${params.toString()}` : ""}`,
            method: "GET",
          };
        },
        providesTags: ["ProjectRole"],
      }),

      getProjectStatuses: builder.query<
        ApiDataResponse<ProjectStatusDTO[]>,
        {
          organizationId?: number;
          category?: string;
          includeInactive?: boolean;
        } | void
      >({
        query: (args) => {
          const params = new URLSearchParams();
          if (args?.organizationId) {
            params.set("organizationId", args.organizationId.toString());
          }
          if (args?.category) {
            params.set("category", args.category);
          }
          if (args?.includeInactive) {
            params.set("includeInactive", "true");
          }
          return {
            url: `/projects/statuses${params.toString() ? `?${params.toString()}` : ""}`,
            method: "GET",
          };
        },
        providesTags: ["ProjectStatus"],
      }),
    }),
  });

export const {
  useGetProjectsQuery,
  useGetProjectByIdQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useChangeProjectStatusMutation,
  useChangeProjectVisibilityMutation,
  useTransferProjectOwnershipMutation,
  useArchiveProjectMutation,
  useRestoreArchivedProjectMutation,
  useDeleteProjectMutation,
  useRestoreDeletedProjectMutation,
  useGetProjectMembersQuery,
  useAddOrAssignProjectMemberMutation,
  useRemoveProjectMemberMutation,
  useGetProjectRolesQuery,
  useGetProjectStatusesQuery,
} = projectApi;
