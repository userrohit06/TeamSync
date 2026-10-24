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

        Task<ApiResponse<CursorPagedResult<WorkspaceMemberResponseDTO>>> GetWorkspaceMembersAsync(
            int organizationId,
            int workspaceId,
            int currentUserId,
            CursorPaginationFilterDTO filter,
            CancellationToken ct
        );

        Task<ApiResponse<WorkspaceMemberResponseDTO>> AddWorkspaceMemberAsync(
            int organizationId,
            int workspaceId,
            int callerUserId,
            AddWorkspaceMemberRequestDTO request,
            CancellationToken ct
        );

        Task<ApiResponse<WorkspaceMemberResponseDTO>> UpdateWorkspaceMemberRoleAsync(
            int organizationId,
            int workspaceId,
            int callerUserId,
            int targetUserId,
            UpdateWorkspaceMemberRoleRequestDTO request,
            CancellationToken ct
        );

        Task<ApiResponse<bool>> RemoveWorkspaceMemberAsync(
            int organizationId,
            int workspaceId,
            int callerUserId,
            int targetUserId,
            CancellationToken ct
        );

        Task<ApiResponse<IReadOnlyList<WorkspaceRoleDTO>>> GetWorkspaceRolesAsync(
            CancellationToken ct
        );

        Task<ApiResponse<bool>> TransferWorkspaceOwnershipAsync(
            int organizationId,
            int workspaceId,
            int currentUserId,
            TransferWorkspaceOwnershipRequestDTO request,
            CancellationToken ct
        );
    }
}
