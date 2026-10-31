using server.DTOs.Common;
using server.DTOs.Project;
using server.Helpers;
using server.Repositories.Interfaces;
using server.Services.Interfaces;

namespace server.Services.Implementations
{
    public class ProjectService : IProjectService
    {
        private readonly IProjectRepository _projectRepo;

        public ProjectService(IProjectRepository projectRepo)
        {
            _projectRepo = projectRepo;
        }

        public async Task<ApiResponse<ProjectResponseDTO>> CreateProjectAsync(
            int workspaceId,
            int currentUserId,
            CreateProjectRequestDTO request,
            CancellationToken ct)
        {
            if (workspaceId <= 0)
            {
                return ApiResponse<ProjectResponseDTO>.Error("Invalid workspace ID", 400);
            }

            if (string.IsNullOrWhiteSpace(request.Name))
            {
                return ApiResponse<ProjectResponseDTO>.Error("Project name is required", 400);
            }

            string trimmedName = request.Name.Trim();
            string visibility = string.Equals(request.Visibility?.Trim(), "Restricted", StringComparison.OrdinalIgnoreCase)
                ? "Restricted"
                : "Workspace";

            if (request.StartDate.HasValue && request.DueDate.HasValue && request.DueDate.Value < request.StartDate.Value)
            {
                return ApiResponse<ProjectResponseDTO>.Error("DueDate cannot be earlier than StartDate", 400);
            }

            string baseSlug = SlugHelper.GenerateSlug(trimmedName);

            var result = await _projectRepo.CreateProjectAsync(
                workspaceId,
                currentUserId,
                trimmedName,
                baseSlug,
                visibility,
                request.Description?.Trim(),
                request.ProjectStatusId,
                request.StartDate,
                request.DueDate,
                request.InitialMemberIds,
                ct
            );

            return ApiResponse<ProjectResponseDTO>.Success(result, "Project created successfully", 201);
        }

        public async Task<ApiResponse<ProjectDetailsDTO>> GetProjectByIdAsync(
            int projectId,
            int currentUserId,
            int? workspaceId,
            CancellationToken ct)
        {
            if (projectId <= 0)
            {
                return ApiResponse<ProjectDetailsDTO>.Error("Invalid project ID", 400);
            }

            var result = await _projectRepo.GetProjectByIdAsync(projectId, currentUserId, workspaceId, ct);
            return ApiResponse<ProjectDetailsDTO>.Success(result, "Project details fetched successfully", 200);
        }

        public async Task<ApiResponse<CursorPagedResult<ProjectResponseDTO>>> GetProjectsAsync(
            int currentUserId,
            int? workspaceId,
            ProjectFilterDTO filter,
            CancellationToken ct)
        {
            var result = await _projectRepo.GetProjectsCursorPagedAsync(
                currentUserId,
                workspaceId,
                filter,
                ct
            );

            return ApiResponse<CursorPagedResult<ProjectResponseDTO>>.Success(result, "Projects fetched successfully", 200);
        }

        public async Task<ApiResponse<ProjectDetailsDTO>> UpdateProjectAsync(
            int projectId,
            int currentUserId,
            int? workspaceId,
            UpdateProjectRequestDTO request,
            CancellationToken ct)
        {
            if (projectId <= 0)
            {
                return ApiResponse<ProjectDetailsDTO>.Error("Invalid project ID", 400);
            }

            if (request.StartDate.HasValue && request.DueDate.HasValue && request.DueDate.Value < request.StartDate.Value)
            {
                return ApiResponse<ProjectDetailsDTO>.Error("DueDate cannot be earlier than StartDate", 400);
            }

            string? trimmedName = request.Name?.Trim();
            string? baseSlug = !string.IsNullOrEmpty(trimmedName) ? SlugHelper.GenerateSlug(trimmedName) : null;

            var result = await _projectRepo.UpdateProjectAsync(
                projectId,
                currentUserId,
                workspaceId,
                trimmedName,
                baseSlug,
                request.Description?.Trim(),
                request.ProjectStatusId,
                request.StartDate,
                request.DueDate,
                request.UpdateDates,
                ct
            );

            return ApiResponse<ProjectDetailsDTO>.Success(result, "Project updated successfully", 200);
        }

        public async Task<ApiResponse<ProjectDetailsDTO>> ChangeProjectStatusAsync(
            int projectId,
            int currentUserId,
            int? workspaceId,
            ChangeProjectStatusRequestDTO request,
            CancellationToken ct)
        {
            if (projectId <= 0)
            {
                return ApiResponse<ProjectDetailsDTO>.Error("Invalid project ID", 400);
            }

            if (request.ProjectStatusId <= 0)
            {
                return ApiResponse<ProjectDetailsDTO>.Error("Invalid project status ID", 400);
            }

            var result = await _projectRepo.ChangeProjectStatusAsync(
                projectId,
                currentUserId,
                request.ProjectStatusId,
                workspaceId,
                ct
            );

            return ApiResponse<ProjectDetailsDTO>.Success(result, "Project status updated successfully", 200);
        }

        public async Task<ApiResponse<ProjectDetailsDTO>> ChangeProjectVisibilityAsync(
            int projectId,
            int currentUserId,
            int? workspaceId,
            ChangeProjectVisibilityRequestDTO request,
            CancellationToken ct)
        {
            if (projectId <= 0)
            {
                return ApiResponse<ProjectDetailsDTO>.Error("Invalid project ID", 400);
            }

            string visibility = string.Equals(request.Visibility?.Trim(), "Restricted", StringComparison.OrdinalIgnoreCase)
                ? "Restricted"
                : "Workspace";

            var result = await _projectRepo.ChangeProjectVisibilityAsync(
                projectId,
                currentUserId,
                visibility,
                workspaceId,
                request.InitialMemberIds,
                ct
            );

            return ApiResponse<ProjectDetailsDTO>.Success(result, "Project visibility updated successfully", 200);
        }

        public async Task<ApiResponse<ProjectDetailsDTO>> TransferProjectOwnershipAsync(
            int projectId,
            int currentUserId,
            int? workspaceId,
            TransferProjectOwnershipRequestDTO request,
            CancellationToken ct)
        {
            if (projectId <= 0)
            {
                return ApiResponse<ProjectDetailsDTO>.Error("Invalid project ID", 400);
            }

            if (request.NewOwnerUserId <= 0)
            {
                return ApiResponse<ProjectDetailsDTO>.Error("Invalid target owner user ID", 400);
            }

            var result = await _projectRepo.TransferProjectOwnershipAsync(
                projectId,
                currentUserId,
                request.NewOwnerUserId,
                workspaceId,
                ct
            );

            return ApiResponse<ProjectDetailsDTO>.Success(result, "Project ownership transferred successfully", 200);
        }

        public async Task<ApiResponse<ProjectDetailsDTO>> ArchiveProjectAsync(
            int projectId,
            int currentUserId,
            int? workspaceId,
            CancellationToken ct)
        {
            if (projectId <= 0)
            {
                return ApiResponse<ProjectDetailsDTO>.Error("Invalid project ID", 400);
            }

            var result = await _projectRepo.ArchiveProjectAsync(projectId, currentUserId, workspaceId, ct);
            return ApiResponse<ProjectDetailsDTO>.Success(result, "Project archived successfully", 200);
        }

        public async Task<ApiResponse<ProjectDetailsDTO>> RestoreArchivedProjectAsync(
            int projectId,
            int currentUserId,
            int? workspaceId,
            CancellationToken ct)
        {
            if (projectId <= 0)
            {
                return ApiResponse<ProjectDetailsDTO>.Error("Invalid project ID", 400);
            }

            var result = await _projectRepo.RestoreArchivedProjectAsync(projectId, currentUserId, workspaceId, ct);
            return ApiResponse<ProjectDetailsDTO>.Success(result, "Project restored successfully", 200);
        }

        public async Task<ApiResponse> SoftDeleteProjectAsync(
            int projectId,
            int currentUserId,
            int? workspaceId,
            CancellationToken ct)
        {
            if (projectId <= 0)
            {
                return ApiResponse.Error("Invalid project ID", 400);
            }

            bool isSuccess = await _projectRepo.SoftDeleteProjectAsync(projectId, currentUserId, workspaceId, ct);
            if (!isSuccess)
            {
                return ApiResponse.Error("Unable to delete project", 500);
            }

            return ApiResponse.Success("Project deleted successfully", 200);
        }

        public async Task<ApiResponse<ProjectDetailsDTO>> RestoreDeletedProjectAsync(
            int projectId,
            int currentUserId,
            int? workspaceId,
            CancellationToken ct)
        {
            if (projectId <= 0)
            {
                return ApiResponse<ProjectDetailsDTO>.Error("Invalid project ID", 400);
            }

            var result = await _projectRepo.RestoreDeletedProjectAsync(projectId, currentUserId, workspaceId, ct);
            return ApiResponse<ProjectDetailsDTO>.Success(result, "Project restored successfully", 200);
        }

        public async Task<ApiResponse<ProjectMemberResponseDTO>> AddOrAssignProjectMemberAsync(
            int projectId,
            int currentUserId,
            int? workspaceId,
            AddOrAssignProjectMemberRequestDTO request,
            CancellationToken ct)
        {
            if (projectId <= 0)
            {
                return ApiResponse<ProjectMemberResponseDTO>.Error("Invalid project ID", 400);
            }

            if (request.TargetUserId <= 0)
            {
                return ApiResponse<ProjectMemberResponseDTO>.Error("Invalid target user ID", 400);
            }

            if (request.ProjectRoleId <= 0)
            {
                return ApiResponse<ProjectMemberResponseDTO>.Error("Invalid project role ID", 400);
            }

            var result = await _projectRepo.AddOrAssignProjectMemberAsync(
                projectId,
                currentUserId,
                request.TargetUserId,
                request.ProjectRoleId,
                workspaceId,
                ct
            );

            return ApiResponse<ProjectMemberResponseDTO>.Success(result, "Project member assigned successfully", 200);
        }

        public async Task<ApiResponse<CursorPagedResult<ProjectMemberResponseDTO>>> GetProjectMembersAsync(
            int projectId,
            int currentUserId,
            int? workspaceId,
            CursorPaginationFilterDTO filter,
            CancellationToken ct)
        {
            if (projectId <= 0)
            {
                return ApiResponse<CursorPagedResult<ProjectMemberResponseDTO>>.Error("Invalid project ID", 400);
            }

            var result = await _projectRepo.GetProjectMembersCursorPagedAsync(
                projectId,
                currentUserId,
                workspaceId,
                filter,
                ct
            );

            return ApiResponse<CursorPagedResult<ProjectMemberResponseDTO>>.Success(result, "Project members fetched successfully", 200);
        }

        public async Task<ApiResponse> RemoveProjectMemberAsync(
            int projectId,
            int currentUserId,
            int targetUserId,
            int? workspaceId,
            CancellationToken ct)
        {
            if (projectId <= 0)
            {
                return ApiResponse.Error("Invalid project ID", 400);
            }

            if (targetUserId <= 0)
            {
                return ApiResponse.Error("Invalid target user ID", 400);
            }

            bool isSuccess = await _projectRepo.RemoveProjectMemberAsync(
                projectId,
                currentUserId,
                targetUserId,
                workspaceId,
                ct
            );

            if (!isSuccess)
            {
                return ApiResponse.Error("Unable to remove project member", 500);
            }

            return ApiResponse.Success("Project member removed successfully", 200);
        }

        public async Task<ApiResponse<IReadOnlyList<ProjectRoleDTO>>> GetProjectRolesAsync(
            int currentUserId,
            int? organizationId,
            bool excludeOwner,
            CancellationToken ct)
        {
            var result = await _projectRepo.GetProjectRolesAsync(currentUserId, organizationId, excludeOwner, ct);
            return ApiResponse<IReadOnlyList<ProjectRoleDTO>>.Success(result, "Project roles fetched successfully", 200);
        }

        public async Task<ApiResponse<IReadOnlyList<ProjectStatusDTO>>> GetProjectStatusesAsync(
            int currentUserId,
            int? organizationId,
            string? category,
            bool includeInactive,
            CancellationToken ct)
        {
            var result = await _projectRepo.GetProjectStatusesAsync(currentUserId, organizationId, category, includeInactive, ct);
            return ApiResponse<IReadOnlyList<ProjectStatusDTO>>.Success(result, "Project statuses fetched successfully", 200);
        }
    }
}
