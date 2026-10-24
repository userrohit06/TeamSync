using Org.BouncyCastle.Asn1.X509.Qualified;
using server.DTOs.Common;
using server.DTOs.Workspace;
using server.Helpers;
using server.Repositories.Interfaces;
using server.Services.Interfaces;

namespace server.Services.Implementations
{
    public class WorkspaceService : IWorkspaceService
    {
        private readonly IWorkspaceRepository _workspaceRepo;

        public WorkspaceService(IWorkspaceRepository workspaceRepository)
        {
            _workspaceRepo = workspaceRepository;
        }

        public async Task<ApiResponse<WorkspaceResponseDTO>> CreateWorkspaceAsync(int organizationId, int currentUserId, CreateWorkspaceRequestDTO request, CancellationToken ct)
        {
            if (organizationId <= 0)
            {
                return ApiResponse<WorkspaceResponseDTO>.Error("Invalid organization id", 400);
            }

            if (string.IsNullOrWhiteSpace(request.Name))
            {
                return ApiResponse<WorkspaceResponseDTO>.Error("Workspace name is required", 400);
            }

            string trimmedName = request.Name.Trim();
            string baseSlug = SlugHelper.GenerateSlug(trimmedName);

            var result = await _workspaceRepo.CreateWorkspaceAsync(
                organizationId,
                currentUserId,
                trimmedName,
                request.Description?.Trim(),
                request.IsPrivate,
                baseSlug,
                ct
            );

            return ApiResponse<WorkspaceResponseDTO>.Success(result, "Workspace created successfully", 201);
        }

        public async Task<ApiResponse<WorkspaceDetailsDTO>> GetWorkspaceById(int workspaceId, int organizationId, int currentUserId, CancellationToken ct)
        {
            if (workspaceId <= 0)
            {
                return ApiResponse<WorkspaceDetailsDTO>.Error("Invalid workspace id", 400);
            }

            if (organizationId <= 0)
            {
                return ApiResponse<WorkspaceDetailsDTO>.Error("Invalid organization id", 400);
            }

            var result = await _workspaceRepo.GetWorkspaceDetailsAsync(workspaceId, organizationId, currentUserId, ct);

            return ApiResponse<WorkspaceDetailsDTO>.Success(result, "Workspace details fetched successfully", 200);
        }

        public async Task<ApiResponse<CursorPagedResult<WorkspaceResponseDTO>>> GetWorkspacesAsync(int organizationId, int callerUserId, CursorPaginationFilterDTO filter, CancellationToken ct)
        {
            if (organizationId <= 0)
            {
                return ApiResponse<CursorPagedResult<WorkspaceResponseDTO>>.Error("Invalid organization ID", 400);
            }

            var result = await _workspaceRepo.GetWorkspacesCursorPagedAsync(
                organizationId,
                callerUserId,
                filter,
                ct
            );

            return ApiResponse<CursorPagedResult<WorkspaceResponseDTO>>.Success(result, "Workspaces fetched successfully", 200);
        }

        public async Task<ApiResponse> SoftDeleteWorkspaceById(int workspaceId, int organizationId, int currentUserId, CancellationToken ct)
        {
            if (workspaceId <= 0)
            {
                return ApiResponse.Error("Invalid workspace id", 400);
            }

            if (organizationId <= 0)
            {
                return ApiResponse.Error("Invalid organization id", 400);
            }

            bool isSuccess = await _workspaceRepo.SoftDeleteWorkspaceAsync(
                workspaceId,
                organizationId,
                currentUserId,
                ct
            );

            if (!isSuccess)
            {
                return ApiResponse.Error("Unable to delete workspace", 500);
            }

            return ApiResponse.Success("Workspace deleted successfully", 200);
        }

        public async Task<ApiResponse<WorkspaceDetailsDTO>> UpdateWorkspaceById(int workspaceId, int organizationId, int currentUserId, UpdateWorkspaceRequest request, CancellationToken ct)
        {
            if (workspaceId <= 0)
            {
                return ApiResponse<WorkspaceDetailsDTO>.Error("Invalid workspace id", 400);
            }

            if (organizationId <= 0)
            {
                return ApiResponse<WorkspaceDetailsDTO>.Error("Invalid organization id", 400);
            }

            if (request is null)
            {
                return ApiResponse<WorkspaceDetailsDTO>.Error("Request body cannot be null", 400);
            }

            bool hasName = !string.IsNullOrWhiteSpace(request.Name);
            bool hasDescription = !string.IsNullOrWhiteSpace(request.Description);
            bool hasIsPrivate = request.IsPrivate.HasValue;

            if (!hasName && !hasDescription && !hasIsPrivate)
            {
                return ApiResponse<WorkspaceDetailsDTO>.Error("At least provide 1 field to update", 400);
            }

            string? baseSlug = null;
            string? trimmedName = null;

            if (hasName)
            {
                trimmedName = request.Name!.Trim();
                baseSlug = SlugHelper.GenerateSlug(trimmedName);
            }

            var updatedWorkspace = await _workspaceRepo.UpdateWorkspaceAsync(
                workspaceId,
                organizationId,
                currentUserId,
                name: trimmedName,
                baseSlug: baseSlug,
                description: request.Description?.Trim(),
                isPrivate: request.IsPrivate,
                ct: ct
            );

            if (updatedWorkspace is null)
            {
                return ApiResponse<WorkspaceDetailsDTO>.Error("Failed to update workspace", 500);
            }

            return ApiResponse<WorkspaceDetailsDTO>.Success(updatedWorkspace, "Workspace updated successfully", 200);
        }

        public async Task<ApiResponse<CursorPagedResult<WorkspaceMemberResponseDTO>>> GetWorkspaceMembersAsync(int organizationId, int workspaceId, int currentUserId, CursorPaginationFilterDTO filter, CancellationToken ct)
        {
            if (organizationId <= 0)
            {
                return ApiResponse<CursorPagedResult<WorkspaceMemberResponseDTO>>.Error("Invalid organization id", 400);
            }

            if (workspaceId <= 0)
            {
                return ApiResponse<CursorPagedResult<WorkspaceMemberResponseDTO>>.Error("Invalid workspace id", 400);
            }

            var result = await _workspaceRepo.GetWorkspaceMembersAsync(
                organizationId,
                workspaceId,
                currentUserId,
                filter,
                ct
            );

            return ApiResponse<CursorPagedResult<WorkspaceMemberResponseDTO>>.Success(result, "Workspace members fetched successfully", 200);
        }

        public async Task<ApiResponse<WorkspaceMemberResponseDTO>> AddWorkspaceMemberAsync(int organizationId, int workspaceId, int callerUserId, AddWorkspaceMemberRequestDTO request, CancellationToken ct)
        {
            if (organizationId <= 0)
            {
                return ApiResponse<WorkspaceMemberResponseDTO>.Error("Invalid organization id", 400);
            }

            if (workspaceId <= 0)
            {
                return ApiResponse<WorkspaceMemberResponseDTO>.Error("Invalid workspace id", 400);
            }

            if (string.IsNullOrWhiteSpace(request.Email))
            {
                return ApiResponse<WorkspaceMemberResponseDTO>.Error("Email is required", 400);
            }

            if (request.RoleId <= 0)
            {
                return ApiResponse<WorkspaceMemberResponseDTO>.Error("Invalid role id", 400);
            }

            var result = await _workspaceRepo.AddWorkspaceMemberAsync(
                organizationId,
                workspaceId,
                callerUserId,
                request.Email.Trim(),
                request.RoleId,
                ct
            );

            return ApiResponse<WorkspaceMemberResponseDTO>.Success(result, "Member added to workspace successfully", 201);
        }

        public async Task<ApiResponse<WorkspaceMemberResponseDTO>> UpdateWorkspaceMemberRoleAsync(int organizationId, int workspaceId, int callerUserId, int targetUserId, UpdateWorkspaceMemberRoleRequestDTO request, CancellationToken ct)
        {
            if (organizationId <= 0)
            {
                return ApiResponse<WorkspaceMemberResponseDTO>.Error("Invalid organization id", 400);
            }

            if (workspaceId <= 0)
            {
                return ApiResponse<WorkspaceMemberResponseDTO>.Error("Invalid workspace id", 400);
            }

            if (targetUserId <= 0)
            {
                return ApiResponse<WorkspaceMemberResponseDTO>.Error("Invalid target user id", 400);
            }

            if (request.RoleId <= 0)
            {
                return ApiResponse<WorkspaceMemberResponseDTO>.Error("Invalid role id", 400);
            }

            var result = await _workspaceRepo.UpdateWorkspaceMemberRoleAsync(
                organizationId,
                workspaceId,
                callerUserId,
                targetUserId,
                request.RoleId,
                ct
            );

            return ApiResponse<WorkspaceMemberResponseDTO>.Success(result, "Workspace member role updated successfully", 200);
        }

        public async Task<ApiResponse<bool>> RemoveWorkspaceMemberAsync(int organizationId, int workspaceId, int callerUserId, int targetUserId, CancellationToken ct)
        {
            if (organizationId <= 0)
            {
                return ApiResponse<bool>.Error("Invalid organization id", 400);
            }

            if (workspaceId <= 0)
            {
                return ApiResponse<bool>.Error("Invalid workspace id", 400);
            }

            if (targetUserId <= 0)
            {
                return ApiResponse<bool>.Error("Invalid target user id", 400);
            }

            await _workspaceRepo.RemoveWorkspaceMemberAsync(
                organizationId,
                workspaceId,
                callerUserId,
                targetUserId,
                ct
            );

            return ApiResponse<bool>.Success(true, "Member removed from workspace successfully", 200);
        }

        public async Task<ApiResponse<IReadOnlyList<WorkspaceRoleDTO>>> GetWorkspaceRolesAsync(CancellationToken ct)
        {
            var roles = await _workspaceRepo.GetWorkspaceRolesAsync(ct);
            return ApiResponse<IReadOnlyList<WorkspaceRoleDTO>>.Success(roles, "Workspace roles fetched successfully", 200);
        }

        public async Task<ApiResponse<bool>> TransferWorkspaceOwnershipAsync(int organizationId, int workspaceId, int currentUserId, TransferWorkspaceOwnershipRequestDTO request, CancellationToken ct)
        {
            if (organizationId <= 0)
            {
                return ApiResponse<bool>.Error("Invalid organization id", 400);
            }

            if (workspaceId <= 0)
            {
                return ApiResponse<bool>.Error("Invalid workspace id", 400);
            }

            if (request.NewOwnerUserId <= 0)
            {
                return ApiResponse<bool>.Error("Invalid recipient user id", 400);
            }

            if (currentUserId == request.NewOwnerUserId)
            {
                return ApiResponse<bool>.Error("Cannot transfer ownership to yourself", 400);
            }

            var result = await _workspaceRepo.TransferWorkspaceOwnershipAsync(
                organizationId,
                workspaceId,
                currentUserId,
                request.NewOwnerUserId,
                request.PreviousOwnerNewRoleId,
                ct
            );

            return ApiResponse<bool>.Success(result, "Workspace ownership transferred successfully", 200);
        }
    }
}
