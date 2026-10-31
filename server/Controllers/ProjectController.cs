using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using server.Controllers.Common;
using server.DTOs.Common;
using server.DTOs.Project;
using server.Helpers;
using server.Services.Interfaces;

namespace server.Controllers
{
    [Authorize]
    [ApiController]
    public class ProjectController : BaseApiController
    {
        private readonly IProjectService _projectService;

        public ProjectController(IProjectService projectService)
        {
            _projectService = projectService;
        }

        [HttpPost("api/workspaces/{workspaceId:int}/projects")]
        public async Task<IActionResult> CreateProject(int workspaceId, [FromBody] CreateProjectRequestDTO request, CancellationToken ct)
        {
            if (CurrentUserId is not int currentUserId)
            {
                return UnauthorizedResponse("Invalid token or user");
            }

            try
            {
                var result = await _projectService.CreateProjectAsync(workspaceId, currentUserId, request, ct);
                return HandleResult(result);
            }
            catch (SqlException ex)
            {
                var (statusCode, apiResponse) = SqlExceptionHelper.MapToApiResponse(
                    ex,
                    notFoundNumbers: new[] { 50004 },
                    forbiddenNumbers: new[] { 50005 },
                    badRequestNumbers: new[] { 50001, 50002, 50003, 50006, 50007 }
                );
                return StatusCode(statusCode, apiResponse);
            }
        }

        [HttpGet("api/workspaces/{workspaceId:int}/projects")]
        [HttpGet("api/projects")]
        public async Task<IActionResult> GetProjects(
            [FromRoute] int? workspaceId,
            [FromQuery] int? wsId,
            [FromQuery] ProjectFilterDTO filter,
            CancellationToken ct)
        {
            if (CurrentUserId is not int currentUserId)
            {
                return UnauthorizedResponse("Invalid token or user");
            }

            int? targetWorkspaceId = workspaceId ?? wsId;

            try
            {
                var result = await _projectService.GetProjectsAsync(currentUserId, targetWorkspaceId, filter, ct);
                return HandleResult(result);
            }
            catch (SqlException ex)
            {
                var (statusCode, apiResponse) = SqlExceptionHelper.MapToApiResponse(
                    ex,
                    notFoundNumbers: new[] { 50001 },
                    forbiddenNumbers: new[] { 50002 }
                );
                return StatusCode(statusCode, apiResponse);
            }
        }

        [HttpGet("api/workspaces/{workspaceId:int}/projects/{projectId:int}")]
        [HttpGet("api/projects/{projectId:int}")]
        public async Task<IActionResult> GetProjectById(int projectId, [FromRoute] int? workspaceId, CancellationToken ct)
        {
            if (CurrentUserId is not int currentUserId)
            {
                return UnauthorizedResponse("Invalid token or user");
            }

            try
            {
                var result = await _projectService.GetProjectByIdAsync(projectId, currentUserId, workspaceId, ct);
                return HandleResult(result);
            }
            catch (SqlException ex)
            {
                var (statusCode, apiResponse) = SqlExceptionHelper.MapToApiResponse(
                    ex,
                    notFoundNumbers: new[] { 50001 },
                    forbiddenNumbers: new[] { 50002, 50003 }
                );
                return StatusCode(statusCode, apiResponse);
            }
        }

        [HttpPut("api/workspaces/{workspaceId:int}/projects/{projectId:int}")]
        [HttpPut("api/projects/{projectId:int}")]
        public async Task<IActionResult> UpdateProject(
            int projectId,
            [FromRoute] int? workspaceId,
            [FromBody] UpdateProjectRequestDTO request,
            CancellationToken ct)
        {
            if (CurrentUserId is not int currentUserId)
            {
                return UnauthorizedResponse("Invalid token or user");
            }

            try
            {
                var result = await _projectService.UpdateProjectAsync(projectId, currentUserId, workspaceId, request, ct);
                return HandleResult(result);
            }
            catch (SqlException ex)
            {
                var (statusCode, apiResponse) = SqlExceptionHelper.MapToApiResponse(
                    ex,
                    notFoundNumbers: new[] { 50001 },
                    forbiddenNumbers: new[] { 50003, 50004 },
                    badRequestNumbers: new[] { 50002, 50005, 50006 }
                );
                return StatusCode(statusCode, apiResponse);
            }
        }

        [HttpPatch("api/workspaces/{workspaceId:int}/projects/{projectId:int}/status")]
        [HttpPatch("api/projects/{projectId:int}/status")]
        public async Task<IActionResult> ChangeStatus(
            int projectId,
            [FromRoute] int? workspaceId,
            [FromBody] ChangeProjectStatusRequestDTO request,
            CancellationToken ct)
        {
            if (CurrentUserId is not int currentUserId)
            {
                return UnauthorizedResponse("Invalid token or user");
            }

            try
            {
                var result = await _projectService.ChangeProjectStatusAsync(projectId, currentUserId, workspaceId, request, ct);
                return HandleResult(result);
            }
            catch (SqlException ex)
            {
                var (statusCode, apiResponse) = SqlExceptionHelper.MapToApiResponse(
                    ex,
                    notFoundNumbers: new[] { 50002 },
                    forbiddenNumbers: new[] { 50004, 50005 },
                    badRequestNumbers: new[] { 50001, 50003 }
                );
                return StatusCode(statusCode, apiResponse);
            }
        }

        [HttpPatch("api/workspaces/{workspaceId:int}/projects/{projectId:int}/visibility")]
        [HttpPatch("api/projects/{projectId:int}/visibility")]
        public async Task<IActionResult> ChangeVisibility(
            int projectId,
            [FromRoute] int? workspaceId,
            [FromBody] ChangeProjectVisibilityRequestDTO request,
            CancellationToken ct)
        {
            if (CurrentUserId is not int currentUserId)
            {
                return UnauthorizedResponse("Invalid token or user");
            }

            try
            {
                var result = await _projectService.ChangeProjectVisibilityAsync(projectId, currentUserId, workspaceId, request, ct);
                return HandleResult(result);
            }
            catch (SqlException ex)
            {
                var (statusCode, apiResponse) = SqlExceptionHelper.MapToApiResponse(
                    ex,
                    notFoundNumbers: new[] { 50002 },
                    forbiddenNumbers: new[] { 50004, 50005 },
                    badRequestNumbers: new[] { 50001, 50003, 50006 }
                );
                return StatusCode(statusCode, apiResponse);
            }
        }

        [HttpPost("api/workspaces/{workspaceId:int}/projects/{projectId:int}/transfer-ownership")]
        [HttpPost("api/projects/{projectId:int}/transfer-ownership")]
        public async Task<IActionResult> TransferOwnership(
            int projectId,
            [FromRoute] int? workspaceId,
            [FromBody] TransferProjectOwnershipRequestDTO request,
            CancellationToken ct)
        {
            if (CurrentUserId is not int currentUserId)
            {
                return UnauthorizedResponse("Invalid token or user");
            }

            try
            {
                var result = await _projectService.TransferProjectOwnershipAsync(projectId, currentUserId, workspaceId, request, ct);
                return HandleResult(result);
            }
            catch (SqlException ex)
            {
                var (statusCode, apiResponse) = SqlExceptionHelper.MapToApiResponse(
                    ex,
                    notFoundNumbers: new[] { 50003 },
                    forbiddenNumbers: new[] { 50005, 50006 },
                    badRequestNumbers: new[] { 50001, 50002, 50004, 50007 }
                );
                return StatusCode(statusCode, apiResponse);
            }
        }

        [HttpPost("api/workspaces/{workspaceId:int}/projects/{projectId:int}/archive")]
        [HttpPost("api/projects/{projectId:int}/archive")]
        public async Task<IActionResult> ArchiveProject(int projectId, [FromRoute] int? workspaceId, CancellationToken ct)
        {
            if (CurrentUserId is not int currentUserId)
            {
                return UnauthorizedResponse("Invalid token or user");
            }

            try
            {
                var result = await _projectService.ArchiveProjectAsync(projectId, currentUserId, workspaceId, ct);
                return HandleResult(result);
            }
            catch (SqlException ex)
            {
                var (statusCode, apiResponse) = SqlExceptionHelper.MapToApiResponse(
                    ex,
                    notFoundNumbers: new[] { 50001 },
                    forbiddenNumbers: new[] { 50004, 50005 },
                    badRequestNumbers: new[] { 50003 }
                );
                return StatusCode(statusCode, apiResponse);
            }
        }

        [HttpPost("api/workspaces/{workspaceId:int}/projects/{projectId:int}/restore-archive")]
        [HttpPost("api/projects/{projectId:int}/restore-archive")]
        public async Task<IActionResult> RestoreArchivedProject(int projectId, [FromRoute] int? workspaceId, CancellationToken ct)
        {
            if (CurrentUserId is not int currentUserId)
            {
                return UnauthorizedResponse("Invalid token or user");
            }

            try
            {
                var result = await _projectService.RestoreArchivedProjectAsync(projectId, currentUserId, workspaceId, ct);
                return HandleResult(result);
            }
            catch (SqlException ex)
            {
                var (statusCode, apiResponse) = SqlExceptionHelper.MapToApiResponse(
                    ex,
                    notFoundNumbers: new[] { 50001 },
                    forbiddenNumbers: new[] { 50004, 50005 },
                    badRequestNumbers: new[] { 50003 }
                );
                return StatusCode(statusCode, apiResponse);
            }
        }

        [HttpDelete("api/workspaces/{workspaceId:int}/projects/{projectId:int}")]
        [HttpDelete("api/projects/{projectId:int}")]
        public async Task<IActionResult> SoftDeleteProject(int projectId, [FromRoute] int? workspaceId, CancellationToken ct)
        {
            if (CurrentUserId is not int currentUserId)
            {
                return UnauthorizedResponse("Invalid token or user");
            }

            try
            {
                var result = await _projectService.SoftDeleteProjectAsync(projectId, currentUserId, workspaceId, ct);
                return HandleResult(result);
            }
            catch (SqlException ex)
            {
                var (statusCode, apiResponse) = SqlExceptionHelper.MapToApiResponse(
                    ex,
                    notFoundNumbers: new[] { 50001 },
                    forbiddenNumbers: new[] { 50002, 50003 }
                );
                return StatusCode(statusCode, apiResponse);
            }
        }

        [HttpPost("api/workspaces/{workspaceId:int}/projects/{projectId:int}/restore-deleted")]
        [HttpPost("api/projects/{projectId:int}/restore-deleted")]
        public async Task<IActionResult> RestoreDeletedProject(int projectId, [FromRoute] int? workspaceId, CancellationToken ct)
        {
            if (CurrentUserId is not int currentUserId)
            {
                return UnauthorizedResponse("Invalid token or user");
            }

            try
            {
                var result = await _projectService.RestoreDeletedProjectAsync(projectId, currentUserId, workspaceId, ct);
                return HandleResult(result);
            }
            catch (SqlException ex)
            {
                var (statusCode, apiResponse) = SqlExceptionHelper.MapToApiResponse(
                    ex,
                    notFoundNumbers: new[] { 50001 },
                    forbiddenNumbers: new[] { 50003, 50004 },
                    badRequestNumbers: new[] { 50002 }
                );
                return StatusCode(statusCode, apiResponse);
            }
        }

        [HttpGet("api/workspaces/{workspaceId:int}/projects/{projectId:int}/members")]
        [HttpGet("api/projects/{projectId:int}/members")]
        public async Task<IActionResult> GetProjectMembers(
            int projectId,
            [FromRoute] int? workspaceId,
            [FromQuery] CursorPaginationFilterDTO filter,
            CancellationToken ct)
        {
            if (CurrentUserId is not int currentUserId)
            {
                return UnauthorizedResponse("Invalid token or user");
            }

            try
            {
                var result = await _projectService.GetProjectMembersAsync(projectId, currentUserId, workspaceId, filter, ct);
                return HandleResult(result);
            }
            catch (SqlException ex)
            {
                var (statusCode, apiResponse) = SqlExceptionHelper.MapToApiResponse(
                    ex,
                    notFoundNumbers: new[] { 50001 },
                    forbiddenNumbers: new[] { 50002, 50003 }
                );
                return StatusCode(statusCode, apiResponse);
            }
        }

        [HttpPost("api/workspaces/{workspaceId:int}/projects/{projectId:int}/members")]
        [HttpPost("api/projects/{projectId:int}/members")]
        public async Task<IActionResult> AddOrAssignProjectMember(
            int projectId,
            [FromRoute] int? workspaceId,
            [FromBody] AddOrAssignProjectMemberRequestDTO request,
            CancellationToken ct)
        {
            if (CurrentUserId is not int currentUserId)
            {
                return UnauthorizedResponse("Invalid token or user");
            }

            try
            {
                var result = await _projectService.AddOrAssignProjectMemberAsync(projectId, currentUserId, workspaceId, request, ct);
                return HandleResult(result);
            }
            catch (SqlException ex)
            {
                var (statusCode, apiResponse) = SqlExceptionHelper.MapToApiResponse(
                    ex,
                    notFoundNumbers: new[] { 50003 },
                    forbiddenNumbers: new[] { 50005, 50006 },
                    badRequestNumbers: new[] { 50001, 50002, 50004, 50007, 50008 }
                );
                return StatusCode(statusCode, apiResponse);
            }
        }

        [HttpDelete("api/workspaces/{workspaceId:int}/projects/{projectId:int}/members/{targetUserId:int}")]
        [HttpDelete("api/projects/{projectId:int}/members/{targetUserId:int}")]
        public async Task<IActionResult> RemoveProjectMember(
            int projectId,
            int targetUserId,
            [FromRoute] int? workspaceId,
            CancellationToken ct)
        {
            if (CurrentUserId is not int currentUserId)
            {
                return UnauthorizedResponse("Invalid token or user");
            }

            try
            {
                var result = await _projectService.RemoveProjectMemberAsync(projectId, currentUserId, targetUserId, workspaceId, ct);
                return HandleResult(result);
            }
            catch (SqlException ex)
            {
                var (statusCode, apiResponse) = SqlExceptionHelper.MapToApiResponse(
                    ex,
                    notFoundNumbers: new[] { 50001, 50005 },
                    forbiddenNumbers: new[] { 50004, 50006 },
                    badRequestNumbers: new[] { 50002, 50003 }
                );
                return StatusCode(statusCode, apiResponse);
            }
        }

        [HttpGet("api/projects/roles")]
        public async Task<IActionResult> GetRoles(
            [FromQuery] int? organizationId,
            [FromQuery] bool excludeOwner = false,
            CancellationToken ct = default)
        {
            if (CurrentUserId is not int currentUserId)
            {
                return UnauthorizedResponse("Invalid token or user");
            }

            try
            {
                var result = await _projectService.GetProjectRolesAsync(currentUserId, organizationId, excludeOwner, ct);
                return HandleResult(result);
            }
            catch (SqlException ex)
            {
                var (statusCode, apiResponse) = SqlExceptionHelper.MapToApiResponse(
                    ex,
                    forbiddenNumbers: new[] { 50001 }
                );
                return StatusCode(statusCode, apiResponse);
            }
        }

        [HttpGet("api/projects/statuses")]
        public async Task<IActionResult> GetStatuses(
            [FromQuery] int? organizationId,
            [FromQuery] string? category = null,
            [FromQuery] bool includeInactive = false,
            CancellationToken ct = default)
        {
            if (CurrentUserId is not int currentUserId)
            {
                return UnauthorizedResponse("Invalid token or user");
            }

            try
            {
                var result = await _projectService.GetProjectStatusesAsync(currentUserId, organizationId, category, includeInactive, ct);
                return HandleResult(result);
            }
            catch (SqlException ex)
            {
                var (statusCode, apiResponse) = SqlExceptionHelper.MapToApiResponse(
                    ex,
                    forbiddenNumbers: new[] { 50001 },
                    badRequestNumbers: new[] { 50002 }
                );
                return StatusCode(statusCode, apiResponse);
            }
        }
    }
}
