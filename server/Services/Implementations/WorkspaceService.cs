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
    }
}
