using server.DTOs.Common;
using server.DTOs.Organization;
using server.DTOs.Workspace;

namespace server.Services.Interfaces
{
    public interface IWorkspaceService
    {
        Task<ApiResponse<WorkspaceResponseDTO>> CreateWorkspaceAsync(
            int organizationId,
            int currentUserId,
            CreateWorkspaceRequestDTO request,
            CancellationToken ct
        );

        Task<ApiResponse<CursorPagedResult<WorkspaceResponseDTO>>> GetWorkspacesAsync(
            int organizationId,
            int callerUserId,
            CursorPaginationFilterDTO filter,
            CancellationToken ct
        );

        Task<ApiResponse<WorkspaceDetailsDTO>> GetWorkspaceById(
            int workspaceId,
            int organizationId,
            int currentUserId,
            CancellationToken ct
        );

        Task<ApiResponse<WorkspaceDetailsDTO>> UpdateWorkspaceById(
            int workspaceId,
            int organizationId,
            int currentUserId,
            UpdateWorkspaceRequest request,
            CancellationToken ct
        );

        Task<ApiResponse> SoftDeleteWorkspaceById(
            int workspaceId,
            int organizationId,
            int currentUserId,
            CancellationToken ct
        );
    }
}
