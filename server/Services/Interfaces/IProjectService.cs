using server.DTOs.Common;
using server.DTOs.Project;

namespace server.Services.Interfaces
{
    public interface IProjectService
    {
        Task<ApiResponse<ProjectResponseDTO>> CreateProjectAsync(
            int workspaceId,
            int currentUserId,
            CreateProjectRequestDTO request,
            CancellationToken ct);

        Task<ApiResponse<ProjectDetailsDTO>> GetProjectByIdAsync(
            int projectId,
            int currentUserId,
            int? workspaceId,
            CancellationToken ct);

        Task<ApiResponse<CursorPagedResult<ProjectResponseDTO>>> GetProjectsAsync(
            int currentUserId,
            int? workspaceId,
            ProjectFilterDTO filter,
            CancellationToken ct);

        Task<ApiResponse<ProjectDetailsDTO>> UpdateProjectAsync(
            int projectId,
            int currentUserId,
            int? workspaceId,
            UpdateProjectRequestDTO request,
            CancellationToken ct);

        Task<ApiResponse<ProjectDetailsDTO>> ChangeProjectStatusAsync(
            int projectId,
            int currentUserId,
            int? workspaceId,
            ChangeProjectStatusRequestDTO request,
            CancellationToken ct);

        Task<ApiResponse<ProjectDetailsDTO>> ChangeProjectVisibilityAsync(
            int projectId,
            int currentUserId,
            int? workspaceId,
            ChangeProjectVisibilityRequestDTO request,
            CancellationToken ct);

        Task<ApiResponse<ProjectDetailsDTO>> TransferProjectOwnershipAsync(
            int projectId,
            int currentUserId,
            int? workspaceId,
            TransferProjectOwnershipRequestDTO request,
            CancellationToken ct);

        Task<ApiResponse<ProjectDetailsDTO>> ArchiveProjectAsync(
            int projectId,
            int currentUserId,
            int? workspaceId,
            CancellationToken ct);

        Task<ApiResponse<ProjectDetailsDTO>> RestoreArchivedProjectAsync(
            int projectId,
            int currentUserId,
            int? workspaceId,
            CancellationToken ct);

        Task<ApiResponse> SoftDeleteProjectAsync(
            int projectId,
            int currentUserId,
            int? workspaceId,
            CancellationToken ct);

        Task<ApiResponse<ProjectDetailsDTO>> RestoreDeletedProjectAsync(
            int projectId,
            int currentUserId,
            int? workspaceId,
            CancellationToken ct);

        Task<ApiResponse<ProjectMemberResponseDTO>> AddOrAssignProjectMemberAsync(
            int projectId,
            int currentUserId,
            int? workspaceId,
            AddOrAssignProjectMemberRequestDTO request,
            CancellationToken ct);

        Task<ApiResponse<CursorPagedResult<ProjectMemberResponseDTO>>> GetProjectMembersAsync(
            int projectId,
            int currentUserId,
            int? workspaceId,
            CursorPaginationFilterDTO filter,
            CancellationToken ct);

        Task<ApiResponse> RemoveProjectMemberAsync(
            int projectId,
            int currentUserId,
            int targetUserId,
            int? workspaceId,
            CancellationToken ct);

        Task<ApiResponse<IReadOnlyList<ProjectRoleDTO>>> GetProjectRolesAsync(
            int currentUserId,
            int? organizationId,
            bool excludeOwner,
            CancellationToken ct);

        Task<ApiResponse<IReadOnlyList<ProjectStatusDTO>>> GetProjectStatusesAsync(
            int currentUserId,
            int? organizationId,
            string? category,
            bool includeInactive,
            CancellationToken ct);
    }
}
