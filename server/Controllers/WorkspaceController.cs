using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using server.DTOs.Common;
using server.DTOs.Workspace;
using server.Services.Interfaces;
using System.Security.Claims;

namespace server.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/organizations/{organizationId:int}/workspaces")]
    public class WorkspaceController : ControllerBase
    {
        private readonly IWorkspaceService _workspaceService;

        public WorkspaceController(IWorkspaceService workspaceService)
        {
            this._workspaceService = workspaceService;
        }

        [HttpPost]
        public async Task<IActionResult> CreateWorkspace(int organizationId, [FromBody] CreateWorkspaceRequestDTO request, CancellationToken ct)
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if(string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int currentUserId))
            {
                return Unauthorized(new ApiResponse
                {
                    Status = 401,
                    Message = "Invalid token or user"
                });
            }

            try
            {
                var result = await this._workspaceService.CreateWorkspaceAsync(organizationId, currentUserId, request, ct);

                return StatusCode(result.Status, result);
            }
            catch (Microsoft.Data.SqlClient.SqlException ex) when (ex.Number == 50001)
            {
                return NotFound(new ApiResponse{ Status = 404, Message = ex.Message });
            }
            catch (Microsoft.Data.SqlClient.SqlException ex) when (ex.Number is 50002 or 50003)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
            }
            catch (Microsoft.Data.SqlClient.SqlException ex) when (ex.Number == 50004)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new ApiResponse { Status = 500, Message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse
                {
                    Status = 500,
                    Message = ex.Message
                });
            }
        }
    }
}
