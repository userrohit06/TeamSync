using server.DTOs.Common;
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
    }
}
