using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using server.DTOs.Common;
using server.DTOs.Organization;
using server.Services.Interfaces;
using System.Security.Claims;

namespace server.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class OrganizationController : ControllerBase
    {
        private readonly IOrganizationService _orgService;

        public OrganizationController(IOrganizationService organizationService)
        {
            this._orgService = organizationService;
        }

        [HttpPost]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> Create([FromForm] CreateOrganizationRequestDTO request, CancellationToken ct)
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if(string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int currentUserId))
            {
                return Unauthorized(new ApiResponse
                {
                    Status = 401,
                    Message = "Invalid token or UserId"
                });
            }

            var result = await this._orgService.CreateOrganizationAsync(request, currentUserId, ct);

            return StatusCode(result.Status, result);
        }

        [HttpGet]
        public async Task<IActionResult> GetOrganizations([FromQuery] CursorPaginationFilterDTO filter, CancellationToken ct)
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if(string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int currentUserId))
            {
                return Unauthorized(new ApiResponse
                {
                    Status = 401,
                    Message = "Unauthorized user access"
                });
            }

            var result = await this._orgService.GetOrganizationsAsync(currentUserId, filter, ct);
            return StatusCode(result.Status, result);
        }

        [HttpGet("{organizationId:int}")]
        public async Task<IActionResult> GetById(int organizationId, CancellationToken ct)
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int currentUserId))
            {
                return Unauthorized(new ApiResponse
                {
                    Status = 401,
                    Message = "Unauthorized user access"
                });
            }

            var result = await this._orgService.GetOrganizationByIdAsync(organizationId, currentUserId, ct);

            return StatusCode(result.Status, result);
        }

        [HttpPut("{organizationId:int}")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> Update(int organizationId, [FromForm] UpdateOrganizationReqeustDTO request, CancellationToken ct)
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if(string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized(new ApiResponse
                {
                    Status = 401,
                    Message = "Unauthorized access"
                });
            }

            try
            {
                var result = await this._orgService.UpdateOrganizationAsync(organizationId, userId, request, ct);
                return StatusCode(result.Status, result);
            }
            catch(Microsoft.Data.SqlClient.SqlException ex) when (ex.Number == 50001)
            {
                return NotFound(new ApiResponse
                {
                    Status = 401,
                    Message = ex.Message
                });
            }
            catch(Microsoft.Data.SqlClient.SqlException ex) when (ex.Number == 50002)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new ApiResponse
                {
                    Status = 401,
                    Message = ex.Message
                });
            }
            catch(ArgumentException ex)
            {
                return BadRequest(new ApiResponse
                {
                    Status = 400,
                    Message = ex.Message
                });
            }
        }

        [HttpDelete("{organizationId:int}")]
        public async Task<IActionResult> Delete(int organizationId, CancellationToken ct)
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if(string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized(new ApiResponse
                {
                    Status = 404,
                    Message = "Unauthorized access"
                });
            }

            try
            {
                var result = await this._orgService.SoftDeleteOrganizationAsync(organizationId, userId, ct);
                return StatusCode(result.Status, result);
            }
            catch(Microsoft.Data.SqlClient.SqlException ex) when (ex.Number == 50001)
            {
                return NotFound(new ApiResponse
                {
                    Status = 404,
                    Message = ex.Message
                });
            }
            catch (Microsoft.Data.SqlClient.SqlException ex) when (ex.Number == 50002)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new ApiResponse
                {
                    Status = StatusCodes.Status403Forbidden,
                    Message = ex.Message
                });
            }
            catch(Exception ex)
            {
                return StatusCode(500, new ApiResponse
                {
                    Status = 500,
                    Message = ex.Message
                });
            }
        }

        [HttpGet("{organizationId:int}/members")]
        public async Task<IActionResult> GetMembers(int organizationId, CancellationToken ct)
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if(userIdClaim == null || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized(new ApiResponse
                {
                    Status = 401,
                    Message = "Unauthorized access"
                });
            }

            var result = await this._orgService.GetMembersAsync(organizationId, userId, ct);
            return StatusCode(result.Status, result);
        }
    }
}
