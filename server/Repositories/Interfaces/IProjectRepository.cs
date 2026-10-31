using server.DTOs.Common;
using server.DTOs.Project;

namespace server.Repositories.Interfaces
{
    public interface IProjectRepository
    {
        Task<ProjectResponseDTO> CreateProjectAsync(
            int workspaceId,
            int currentUserId,
            string name,
            string baseSlug,
            string visibility,
            string? description,
            int? projectStatusId,
            DateTime? startDate,
            DateTime? dueDate,
            IEnumerable<int>? initialMemberIds,
            CancellationToken ct);

        Task<ProjectDetailsDTO> GetProjectByIdAsync(
            int projectId,
            int currentUserId,
            int? workspaceId,
            CancellationToken ct);

        Task<CursorPagedResult<ProjectResponseDTO>> GetProjectsCursorPagedAsync(
            int currentUserId,
            int? workspaceId,
            ProjectFilterDTO filter,
            CancellationToken ct);

        Task<ProjectDetailsDTO> UpdateProjectAsync(
            int projectId,
            int currentUserId,
            int? workspaceId,
            string? name,
            string? baseSlug,
            string? description,
            int? projectStatusId,
            DateTime? startDate,
            DateTime? dueDate,
            bool updateDates,
            CancellationToken ct);

        Task<ProjectDetailsDTO> ChangeProjectStatusAsync(
            int projectId,
            int currentUserId,
            int newProjectStatusId,
            int? workspaceId,
            CancellationToken ct);

        Task<ProjectDetailsDTO> ChangeProjectVisibilityAsync(
            int projectId,
            int currentUserId,
            string newVisibility,
            int? workspaceId,
            IEnumerable<int>? initialMemberIds,
            CancellationToken ct);

        Task<ProjectDetailsDTO> TransferProjectOwnershipAsync(
            int projectId,
            int currentUserId,
            int newOwnerUserId,
            int? workspaceId,
            CancellationToken ct);

        Task<ProjectDetailsDTO> ArchiveProjectAsync(
            int projectId,
            int currentUserId,
            int? workspaceId,
            CancellationToken ct);

        Task<ProjectDetailsDTO> RestoreArchivedProjectAsync(
            int projectId,
            int currentUserId,
            int? workspaceId,
            CancellationToken ct);

        Task<bool> SoftDeleteProjectAsync(
            int projectId,
            int currentUserId,
            int? workspaceId,
            CancellationToken ct);

        Task<ProjectDetailsDTO> RestoreDeletedProjectAsync(
            int projectId,
            int currentUserId,
            int? workspaceId,
            CancellationToken ct);

        Task<ProjectMemberResponseDTO> AddOrAssignProjectMemberAsync(
            int projectId,
            int currentUserId,
            int targetUserId,
            int projectRoleId,
            int? workspaceId,
            CancellationToken ct);

        Task<CursorPagedResult<ProjectMemberResponseDTO>> GetProjectMembersCursorPagedAsync(
            int projectId,
            int currentUserId,
            int? workspaceId,
            CursorPaginationFilterDTO filter,
            CancellationToken ct);

        Task<bool> RemoveProjectMemberAsync(
            int projectId,
            int currentUserId,
            int targetUserId,
            int? workspaceId,
            CancellationToken ct);

        Task<IReadOnlyList<ProjectRoleDTO>> GetProjectRolesAsync(
            int currentUserId,
            int? organizationId,
            bool excludeOwner,
            CancellationToken ct);

        Task<IReadOnlyList<ProjectStatusDTO>> GetProjectStatusesAsync(
            int currentUserId,
            int? organizationId,
            string? category,
            bool includeInactive,
            CancellationToken ct);
    }
}
