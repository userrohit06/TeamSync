using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using server.Controllers.Common;
using server.DTOs.Common;
using server.DTOs.Workspace;
using server.Helpers;
using server.Services.Interfaces;

namespace server.Controllers
{
    [Authorize]
    [Route("api/organizations/{organizationId:int}/workspaces")]
    public class WorkspaceController : BaseApiController
    {
        private readonly IWorkspaceService _workspaceService;

        public WorkspaceController(IWorkspaceService workspaceService)
        {
            _workspaceService = workspaceService;
        }

        [HttpPost]
        public async Task<IActionResult> CreateWorkspace(int organizationId, [FromBody] CreateWorkspaceRequestDTO request, CancellationToken ct)
        {
            if (CurrentUserId is not int currentUserId)
            {
                return UnauthorizedResponse("Invalid token or user");
            }

            try
            {
                var result = await _workspaceService.CreateWorkspaceAsync(organizationId, currentUserId, request, ct);
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

        [HttpGet]
        public async Task<IActionResult> GetWorkspaces(int organizationId, [FromQuery] CursorPaginationFilterDTO filter, CancellationToken ct)
        {
            if (CurrentUserId is not int currentUserId)
            {
                return UnauthorizedResponse("Invalid token or user");
            }

            try
            {
                var result = await _workspaceService.GetWorkspacesAsync(organizationId, currentUserId, filter, ct);
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

        [HttpGet("{workspaceId:int}")]
        public async Task<IActionResult> GetWorkspaceById(int workspaceId, int organizationId, CancellationToken ct)
        {
            if (CurrentUserId is not int currentUserId)
            {
                return UnauthorizedResponse("Invalid token or user");
            }

            try
            {
                var result = await _workspaceService.GetWorkspaceById(workspaceId, organizationId, currentUserId, ct);
                return HandleResult(result);
            }
            catch (SqlException ex)
            {
                var (statusCode, apiResponse) = SqlExceptionHelper.MapToApiResponse(
                    ex,
                    notFoundNumbers: new[] { 50002 },
                    forbiddenNumbers: new[] { 50001, 50002 }
                );
                return StatusCode(statusCode, apiResponse);
            }
        }

        [HttpPut("{workspaceId:int}")]
        public async Task<IActionResult> UpdateWorkspaceById(int workspaceId, int organizationId, [FromBody] UpdateWorkspaceRequest request, CancellationToken ct)
        {
            if (CurrentUserId is not int currentUserId)
            {
                return UnauthorizedResponse("Invalid token or user");
            }

            try
            {
                var result = await _workspaceService.UpdateWorkspaceById(workspaceId, organizationId, currentUserId, request, ct);
                return HandleResult(result);
            }
            catch (SqlException ex)
            {
                var (statusCode, apiResponse) = SqlExceptionHelper.MapToApiResponse(
                    ex,
                    badRequestNumbers: new[] { 50001 },
                    notFoundNumbers: new[] { 50002 },
                    forbiddenNumbers: new[] { 50003 }
                );
                return StatusCode(statusCode, apiResponse);
            }
        }

        [HttpDelete("{workspaceId:int}")]
        public async Task<IActionResult> SoftDeleteById(int workspaceId, int organizationId, CancellationToken ct)
        {
            if (CurrentUserId is not int currentUserId)
            {
                return UnauthorizedResponse("Invalid token or user");
            }

            try
            {
                var result = await _workspaceService.SoftDeleteWorkspaceById(
                    workspaceId,
                    organizationId,
                    currentUserId,
                    ct
                );

                return HandleResult(result);
            }
            catch (SqlException ex)
            {
                var (statusCode, apiResponse) = SqlExceptionHelper.MapToApiResponse(
                    ex,
                    notFoundNumbers: new[] { 50003 },
                    forbiddenNumbers: new[] { 50001, 50002 }
                );
                return StatusCode(statusCode, apiResponse);
            }
        }

        [HttpGet("{workspaceId:int}/members")]
        public async Task<IActionResult> GetMembers(int organizationId, int workspaceId, [FromQuery] CursorPaginationFilterDTO filter, CancellationToken ct)
        {
            if (CurrentUserId is not int currentUserId)
            {
                return UnauthorizedResponse("Invalid token or user");
            }

            try
            {
                var result = await _workspaceService.GetWorkspaceMembersAsync(organizationId, workspaceId, currentUserId, filter, ct);
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

        [HttpPost("{workspaceId:int}/members/invite")]
        public async Task<IActionResult> AddMember(int organizationId, int workspaceId, [FromBody] AddWorkspaceMemberRequestDTO request, CancellationToken ct)
        {
            if (CurrentUserId is not int currentUserId)
            {
                return UnauthorizedResponse("Invalid token or user");
            }

            try
            {
                var result = await _workspaceService.AddWorkspaceMemberAsync(organizationId, workspaceId, currentUserId, request, ct);
                return HandleResult(result);
            }
            catch (SqlException ex)
            {
                var (statusCode, apiResponse) = SqlExceptionHelper.MapToApiResponse(
                    ex,
                    notFoundNumbers: new[] { 50001, 50002, 50006 },
                    forbiddenNumbers: new[] { 50003, 50004 },
                    badRequestNumbers: new[] { 50005, 50007, 50008 }
                );
                return StatusCode(statusCode, apiResponse);
            }
        }

        [HttpPut("{workspaceId:int}/members/{targetUserId:int}/role")]
        public async Task<IActionResult> UpdateRole(int organizationId, int workspaceId, int targetUserId, [FromBody] UpdateWorkspaceMemberRoleRequestDTO request, CancellationToken ct)
        {
            if (CurrentUserId is not int currentUserId)
            {
                return UnauthorizedResponse("Invalid token or user");
            }

            try
            {
                var result = await _workspaceService.UpdateWorkspaceMemberRoleAsync(organizationId, workspaceId, currentUserId, targetUserId, request, ct);
                return HandleResult(result);
            }
            catch (SqlException ex)
            {
                var (statusCode, apiResponse) = SqlExceptionHelper.MapToApiResponse(
                    ex,
                    notFoundNumbers: new[] { 50001, 50005 },
                    forbiddenNumbers: new[] { 50003, 50004 },
                    badRequestNumbers: new[] { 50002 }
                );
                return StatusCode(statusCode, apiResponse);
            }
        }

        [HttpDelete("{workspaceId:int}/members/{targetUserId:int}/remove")]
        public async Task<IActionResult> RemoveMember(int organizationId, int workspaceId, int targetUserId, CancellationToken ct)
        {
            if (CurrentUserId is not int currentUserId)
            {
                return UnauthorizedResponse("Invalid token or user");
            }

            try
            {
                var result = await _workspaceService.RemoveWorkspaceMemberAsync(organizationId, workspaceId, currentUserId, targetUserId, ct);
                return HandleResult(result);
            }
            catch (SqlException ex)
            {
                var (statusCode, apiResponse) = SqlExceptionHelper.MapToApiResponse(
                    ex,
                    notFoundNumbers: new[] { 50001, 50003 },
                    forbiddenNumbers: new[] { 50002, 50004, 50005 }
                );
                return StatusCode(statusCode, apiResponse);
            }
        }

        [HttpGet("roles")]
        public async Task<IActionResult> GetRoles(CancellationToken ct)
        {
            var result = await _workspaceService.GetWorkspaceRolesAsync(ct);
            return HandleResult(result);
        }

        [HttpPost("{workspaceId:int}/transfer-ownership")]
        public async Task<IActionResult> TransferOwnership(int organizationId, int workspaceId, [FromBody] TransferWorkspaceOwnershipRequestDTO request, CancellationToken ct)
        {
            if (CurrentUserId is not int currentUserId)
            {
                return UnauthorizedResponse("Invalid token or user");
            }

            try
            {
                var result = await _workspaceService.TransferWorkspaceOwnershipAsync(organizationId, workspaceId, currentUserId, request, ct);
                return HandleResult(result);
            }
            catch (SqlException ex)
            {
                var (statusCode, apiResponse) = SqlExceptionHelper.MapToApiResponse(
                    ex,
                    notFoundNumbers: new[] { 50001 },
                    forbiddenNumbers: new[] { 50002, 50003 },
                    badRequestNumbers: new[] { 50004 }
                );
                return StatusCode(statusCode, apiResponse);
            }
        }
    }
}
