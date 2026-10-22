using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using server.Controllers.Common;
using server.DTOs.Common;
using server.DTOs.Workspace;
using server.Helpers;
using server.Models;
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
            if(CurrentUserId is not int currentUserId)
            {
                return UnauthorizedResponse("Invalid token or user");
            }

            try
            {
                var result = await this._workspaceService.GetWorkspacesAsync(organizationId, currentUserId, filter, ct);
                return HandleResult(result);
            }
            catch(SqlException ex)
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
                var result = await this._workspaceService.GetWorkspaceById(workspaceId, organizationId, currentUserId, ct);
                return HandleResult(result);
            }
            catch (SqlException ex)
            {
                var (statusCode, apiResponse) = SqlExceptionHelper.MapToApiResponse(
                    ex,
                    forbiddenNumbers: new[] { 50001, 50002 }
                );
                return StatusCode(statusCode, apiResponse);
            }
        }

        [HttpPut("{workpsaceId:int}")]
        public async Task<IActionResult> UpdateWorkspaceById(int workpsaceId, int organizationId, [FromBody] UpdateWorkspaceRequest request, CancellationToken ct)
        {
            if (CurrentUserId is not int currentUserId)
            {
                return UnauthorizedResponse("Invalid token or user");
            }

            try
            {
                var result = await this._workspaceService.UpdateWorkspaceById(workpsaceId, organizationId, currentUserId, request, ct);
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

        [HttpDelete("${workspaceId:int}")]
        public async Task<IActionResult> SoftDeleteById(int workspaceId, int organizationId, CancellationToken ct)
        {
            if (CurrentUserId is not int currentUserId)
            {
                return UnauthorizedResponse("Invalid token or user");
            }

            trys
            {
                var result = await this._workspaceService.SoftDeleteWorkspaceById(
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
                    badRequestNumbers: new[] { 50001 },
                    notFoundNumbers: new[] { 50002 },
                    forbiddenNumbers: new[] { 50003 }
                );
                return StatusCode(statusCode, apiResponse);
            }
        }
        {

        }
    }
}
