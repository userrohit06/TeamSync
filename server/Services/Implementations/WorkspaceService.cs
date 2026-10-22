using Org.BouncyCastle.Asn1.X509.Qualified;
using server.DTOs.Common;
using server.DTOs.Organization;
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
            if(workspaceId <= 0)
            {
                ApiResponse<WorkspaceDetailsDTO>.Error("Invalid workspace id", 400);
            }

            if(organizationId <= 0)
            {
                ApiResponse<WorkspaceDetailsDTO>.Error("Invalid organization id", 400);
            }

            var result = await this._workspaceRepo.GetWorkspaceDetailsAsync(workspaceId, organizationId, currentUserId, ct);

            return ApiResponse<WorkspaceDetailsDTO>.Success(result, "Workspace detailes fetched successfully", 200);
        }

        public async Task<ApiResponse<CursorPagedResult<WorkspaceResponseDTO>>> GetWorkspacesAsync(int organizationId, int callerUserId, CursorPaginationFilterDTO filter, CancellationToken ct)
        {
            if(organizationId <= 0)
            {
                ApiResponse<CursorPagedResult<WorkspaceResponseDTO>>.Error("Invalid organization ID", 400);
            }

            var result = await this._workspaceRepo.GetWorkspacesCursorPagedAsync(
                organizationId,
                callerUserId,
                filter,
                ct
            );

            return ApiResponse<CursorPagedResult<WorkspaceResponseDTO>>.Success(result, "Workspaces fetched successfully", 200);
        }

        public async Task<ApiResponse> SoftDeleteWorkspaceById(int workspaceId, int organizationId, int currentUserId, CancellationToken ct)
        {
            if(workspaceId <= 0)
            {
                return ApiResponse.Error("Invalid workspace id", 400);
            }

            if(organizationId <= 0)
            {
                return ApiResponse.Error("Invalid organization id", 400);
            }

            bool isSuccess = await this._workspaceRepo.SoftDeleteWorkspaceAsync(
                workspaceId,
                organizationId,
                currentUserId,
                ct
            );

            if (!isSuccess)
            {
                return ApiResponse.Error("Unable to delete workspace", 500);
            }

            return ApiResponse.Success("Workspace deleted successfully", 204);
        }

        public async Task<ApiResponse<WorkspaceDetailsDTO>> UpdateWorkspaceById(int workspaceId, int organizationId, int currentUserId, UpdateWorkspaceRequest request, CancellationToken ct)
        {
            if(workspaceId <= 0)
            {
                return ApiResponse<WorkspaceDetailsDTO>.Error("Invalid workspace id", 400);
            }

            if(organizationId <= 0)
            {
                return ApiResponse<WorkspaceDetailsDTO>.Error("Invalid organization id", 400);
            }

            if(request is null)
            {
                return ApiResponse<WorkspaceDetailsDTO>.Error("Request body cannot be null", 400);
            }

            bool hasName = !string.IsNullOrWhiteSpace(request.Name);
            bool hasDescription = !string.IsNullOrWhiteSpace(request.Description);
            bool hasIsPrivate = request.IsPrivate.HasValue;

            if(!hasName && !hasDescription && !hasIsPrivate)
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

            var updatedWorkspace = await this._workspaceRepo.UpdateWorkspaceAsync(
                    workspaceId,
                    organizationId,
                    currentUserId,
                    name: trimmedName,
                    baseSlug: baseSlug,
                    description: request.Description?.Trim(),
                    isPrivate: request.IsPrivate,
                    ct: ct
            );

            if(updatedWorkspace is null)
            {
                return ApiResponse<WorkspaceDetailsDTO>.Error("Failed to update workpspace", 500);
            }

            return ApiResponse<WorkspaceDetailsDTO>.Success(updatedWorkspace, "Workspace updated successfully", 200);
        }
    }
}
