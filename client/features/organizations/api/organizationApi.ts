import {
  AddMemberRequest,
  CreateOrganizationRequest,
  GetOrganizationMembersParams,
  GetOrganizationParams,
  OrganizationDetails,
  OrganizationMember,
  OrganizationResponse,
  RemoveMemberRequest,
  RoleResponsedTO,
  TransferOwnershipRequest,
  UpdateMemberRoleRequest,
  UpdateOrganizationRequest,
  UpdateOrganizationResponse,
  UserOrganization,
} from "@/features/organizations/types/organization.types";
import { baseApi } from "@/store";
import { ApiDataResponse, ApiResponse, CursorPagedResult } from "@/types";

export const organizationApi = baseApi
  .enhanceEndpoints({
    addTagTypes: ["Organization", "Member"],
  })
  .injectEndpoints({
    endpoints: (builder) => ({
      getMyOrganizations: builder.query<
        ApiDataResponse<CursorPagedResult<UserOrganization>>,
        GetOrganizationParams
      >({
        query: ({ pageSize, cursor, searchTerm }) => {
          const params = new URLSearchParams();

          params.set("PageSize", pageSize.toString());

          if (cursor) {
            params.set("Cursor", cursor);
          }

          if (searchTerm?.trim()) {
            params.set("SearchTerm", searchTerm.trim());
          }

          return {
            url: `/organization?${params.toString()}`,
            method: "GET",
          };
        },

        providesTags: (result) => {
          const organizations = result?.data.items ?? [];

          return [
            {
              type: "Organization" as const,
              id: "LIST",
            },

            ...organizations.map((organization) => ({
              type: "Organization" as const,
              id: organization.organizationId,
            })),
          ];
        },
      }),

      createOrganization: builder.mutation<
        ApiDataResponse<OrganizationResponse>,
        CreateOrganizationRequest
      >({
        query: ({ name, description, logoFile }) => {
          const formData = new FormData();

          formData.append("Name", name.trim());

          if (description?.trim()) {
            formData.append("Description", description.trim());
          }

          if (logoFile) {
            formData.append("LogoFile", logoFile);
          }

          return {
            url: "/organization",
            method: "POST",
            body: formData,
          };
        },

        invalidatesTags: [{ type: "Organization", id: "LIST" }],
      }),

      getOrganizationId: builder.query<
        ApiDataResponse<OrganizationDetails>,
        number
      >({
        query: (organizationId) => ({
          url: `/organization/${organizationId}`,
          method: "GET",
        }),
        providesTags: (_result, _error, id) => [{ type: "Organization", id }],
      }),

      updateOrganization: builder.mutation<
        ApiDataResponse<UpdateOrganizationResponse>,
        UpdateOrganizationRequest
      >({
        query: ({
          organizationId,
          name,
          description,
          logoFile,
          removeExistingLogo,
        }) => {
          const formData = new FormData();

          formData.append("Name", name.trim());

          if (description !== undefined && description !== null) {
            formData.append("Description", description.trim());
          }

          if (logoFile) {
            formData.append("LogoFile", logoFile);
          }

          formData.append(
            "RemoveExistingLogo",
            String(Boolean(removeExistingLogo)),
          );

          return {
            url: `/organization/${organizationId}`,
            method: "PUT",
            body: formData,
          };
        },

        invalidatesTags: (_result, _error, arg) => [
          { type: "Organization", id: "LIST" },
          { type: "Organization", id: arg.organizationId },
        ],
      }),

      deleteOrganization: builder.mutation<ApiResponse, number>({
        query: (organizationId) => {
          console.log("inside delete");
          return {
            url: `/organization/${organizationId}`,
            method: "DELETE",
          };
        },

        invalidatesTags: (_result, _error, id) => [
          { type: "Organization", id: "LIST" },
          { type: "Organization", id },
        ],
      }),

      getOrganizationMembers: builder.query<
        ApiDataResponse<CursorPagedResult<OrganizationMember>>,
        GetOrganizationMembersParams
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
            url: `/organization/${organizationId}/members?${params.toString()}`,
            method: "GET",
          };
        },
        providesTags: (result, _error, { organizationId }) => {
          const members = result?.data.items ?? [];

          return [
            { type: "Member" as const, id: `ORG_${organizationId}_LIST` },
            ...members.map((member) => ({
              type: "Member" as const,
              id: member.organizationMemberId,
            })),
          ];
        },
      }),

      getOrganizationRoles: builder.query<
        ApiDataResponse<RoleResponsedTO[]>,
        { excludeOwner?: boolean } | void
      >({
        query: (args) => {
          const params = new URLSearchParams();

          if (args?.excludeOwner !== undefined) {
            params.set("excludeOwner", String(args.excludeOwner));
          }

          return {
            url: `/Organization/roles?${params.toString()}`,
            method: "GET",
          };
        },

        providesTags: [{ type: "Organization", id: "ROLES" }],
      }),

      addMember: builder.mutation<ApiDataResponse<null>, AddMemberRequest>({
        query: ({ organizationId, email, roleId }) => ({
          url: `/Organization/${organizationId}/members/invite`,
          method: "POST",
          body: { email, roleId },
        }),

        invalidatesTags: (_result, _error, { organizationId }) => [
          { type: "Member", id: `ORG_${organizationId}_LIST` },
        ],
      }),

      updateMemberRole: builder.mutation<ApiResponse, UpdateMemberRoleRequest>({
        query: ({ organizationId, targetUserId, roleId }) => ({
          url: `/Organization/${organizationId}/members/${targetUserId}/role`,
          method: "PUT",
          body: { roleId },
        }),

        invalidatesTags: (_result, _error, { organizationId }) => [
          { type: "Member", id: `ORG_${organizationId}_LIST` },
        ],
      }),

      removeMember: builder.mutation<ApiResponse, RemoveMemberRequest>({
        query: ({ organizationId, targetUserId }) => ({
          url: `Organization/${organizationId}/members/${targetUserId}/remove`,
          method: "DELETE",
        }),

        invalidatesTags: (_result, _error, { organizationId }) => [
          { type: "Member", id: `ORG_${organizationId}_LIST` },
        ],
      }),

      transferOwnership: builder.mutation<
        ApiResponse,
        TransferOwnershipRequest
      >({
        query: ({
          organizationId,
          newOwnerUserId,
          previousOwnerNewRoleId,
        }) => ({
          url: `/Organization/${organizationId}/transfer-ownership`,
          method: "POST",
          body: {
            newOwnerUserId,
            previousOwnerNewRoleId: previousOwnerNewRoleId || undefined,
          },
        }),
        invalidatesTags: (_result, _error, { organizationId }) => [
          { type: "Organization", id: organizationId },
          { type: "Organization", id: "LIST" },
          { type: "Member", id: `ORG_${organizationId}_LIST` },
        ],
      }),
    }),
  });

export const {
  useGetMyOrganizationsQuery,
  useLazyGetMyOrganizationsQuery,
  useCreateOrganizationMutation,
  useGetOrganizationIdQuery,
  useUpdateOrganizationMutation,
  useDeleteOrganizationMutation,
  useGetOrganizationMembersQuery,
  useGetOrganizationRolesQuery,
  useAddMemberMutation,
  useUpdateMemberRoleMutation,
  useRemoveMemberMutation,
  useTransferOwnershipMutation,
} = organizationApi;
