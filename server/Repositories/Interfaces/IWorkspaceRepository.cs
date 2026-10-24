using server.DTOs.Common;
using server.DTOs.Workspace;

namespace server.Repositories.Interfaces
{
    public interface IWorkspaceRepository
    {
        Task<WorkspaceResponseDTO> CreateWorkspaceAsync(
            int organizationId,
            int createdByUserId,
            string name,
            string? description,
            bool isPrivate,
            string baseSlug,
            CancellationToken ct
        );

        Task<CursorPagedResult<WorkspaceResponseDTO>> GetWorkspacesCursorPagedAsync(
            int organizationId,
            int callerUserId,
            CursorPaginationFilterDTO filter,
            CancellationToken ct
        );

        Task<WorkspaceDetailsDTO> GetWorkspaceDetailsAsync(
            int workspaceId,
            int organizationId,
            int currentUserId,
            CancellationToken ct
        );

        Task<WorkspaceDetailsDTO> UpdateWorkspaceAsync(
            int workspaceId,
            int organizationId,
            int currentUserId,
            string? name,
            string? baseSlug,
            string? description,
            bool? isPrivate,
            CancellationToken ct
        );

        Task<bool> SoftDeleteWorkspaceAsync(
            int workspaceId,
            int organizationId,
            int currentUserId,
            CancellationToken ct
        );

        Task<CursorPagedResult<WorkspaceMemberResponseDTO>> GetWorkspaceMembersAsync(
            int organizationId,
            int workspaceId,
            int currentUserId,
            CursorPaginationFilterDTO filter,
            CancellationToken ct
        );

        Task<WorkspaceMemberResponseDTO> AddWorkspaceMemberAsync(
            int organizationId,
            int workspaceId,
            int callerUserId,
            string email,
            int roleId,
            CancellationToken ct
        );

        Task<WorkspaceMemberResponseDTO> UpdateWorkspaceMemberRoleAsync(
            int organizationId,
            int workspaceId,
            int callerUserId,
            int targetUserId,
            int newRoleId,
            CancellationToken ct
        );

        Task<bool> RemoveWorkspaceMemberAsync(
            int organizationId,
            int workspaceId,
            int callerUserId,
            int targetUserId,
            CancellationToken ct
        );

        Task<IReadOnlyList<WorkspaceRoleDTO>> GetWorkspaceRolesAsync(
            CancellationToken ct
        );

        Task<bool> TransferWorkspaceOwnershipAsync(
            int organizationId,
            int workspaceId,
            int currentUserId,
            int newOwnerUserId,
            int? previousOwnerRoleId,
            CancellationToken ct
        );
    }
}
