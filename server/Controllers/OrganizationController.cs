using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using server.Controllers.Common;
using server.DTOs.Common;
using server.DTOs.Organization;
using server.Helpers;
using server.Services.Interfaces;

namespace server.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    public class OrganizationController : BaseApiController
    {
        private readonly IOrganizationService _orgService;

        public OrganizationController(IOrganizationService organizationService)
        {
            _orgService = organizationService;
        }

        [HttpPost]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> Create([FromForm] CreateOrganizationRequestDTO request, CancellationToken ct)
        {
            if (CurrentUserId is not int currentUserId)
            {
                return UnauthorizedResponse("Invalid token or user ID");
            }

            var result = await _orgService.CreateOrganizationAsync(request, currentUserId, ct);
            return HandleResult(result);
        }

        [HttpGet]
        public async Task<IActionResult> GetOrganizations([FromQuery] CursorPaginationFilterDTO filter, CancellationToken ct)
        {
            if (CurrentUserId is not int currentUserId)
            {
                return UnauthorizedResponse("Unauthorized user access");
            }

            var result = await _orgService.GetOrganizationsAsync(currentUserId, filter, ct);
            return HandleResult(result);
        }

        [HttpGet("{organizationId:int}")]
        public async Task<IActionResult> GetById(int organizationId, CancellationToken ct)
        {
            if (CurrentUserId is not int currentUserId)
            {
                return UnauthorizedResponse("Unauthorized user access");
            }

            var result = await _orgService.GetOrganizationByIdAsync(organizationId, currentUserId, ct);
            return HandleResult(result);
        }

        [HttpPut("{organizationId:int}")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> Update(int organizationId, [FromForm] UpdateOrganizationRequestDTO request, CancellationToken ct)
        {
            if (CurrentUserId is not int userId)
            {
                return UnauthorizedResponse("Unauthorized access");
            }

            try
            {
                var result = await _orgService.UpdateOrganizationAsync(organizationId, userId, request, ct);
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

        [HttpDelete("{organizationId:int}")]
        public async Task<IActionResult> Delete(int organizationId, CancellationToken ct)
        {
            if (CurrentUserId is not int userId)
            {
                return UnauthorizedResponse("Unauthorized access");
            }

            try
            {
                var result = await _orgService.SoftDeleteOrganizationAsync(organizationId, userId, ct);
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

        [HttpGet("{organizationId:int}/members")]
        public async Task<IActionResult> GetMembers(int organizationId, [FromQuery] CursorPaginationFilterDTO filter, CancellationToken ct)
        {
            if (CurrentUserId is not int userId)
            {
                return UnauthorizedResponse("Unauthorized access");
            }

            var result = await _orgService.GetMembersAsync(organizationId, userId, filter, ct);
            return HandleResult(result);
        }

        [HttpPost("{organizationId:int}/members/invite")]
        public async Task<IActionResult> AddMember(int organizationId, [FromBody] AddMemberRequestDTO request, CancellationToken ct)
        {
            if (CurrentUserId is not int currentUserId)
            {
                return UnauthorizedResponse("Unauthorized access");
            }

            try
            {
                var result = await _orgService.AddMemberAsync(organizationId, request, currentUserId, ct);
                return HandleResult(result);
            }
            catch (SqlException ex)
            {
                var (statusCode, apiResponse) = SqlExceptionHelper.MapToApiResponse(
                    ex,
                    notFoundNumbers: new[] { 50001 },
                    forbiddenNumbers: new[] { 50002 },
                    badRequestNumbers: new[] { 50003, 50004, 50005, 50006 }
                );
                return StatusCode(statusCode, apiResponse);
            }
        }

        [HttpPut("{organizationId:int}/members/{targetUserId:int}/role")]
        public async Task<IActionResult> UpdateRole([FromRoute] int organizationId, [FromRoute] int targetUserId, [FromBody] UpdateMemberRoleRequestDTO request, CancellationToken ct)
        {
            if (CurrentUserId is not int callerUserId)
            {
                return UnauthorizedResponse("Unauthorized access");
            }

            try
            {
                var result = await _orgService.UpdateMemberRoleAsync(
                    organizationId,
                    callerUserId,
                    targetUserId: targetUserId,
                    newRoleId: request.RoleId,
                    ct: ct
                );
                return HandleResult(result);
            }
            catch (SqlException ex)
            {
                var (statusCode, apiResponse) = SqlExceptionHelper.MapToApiResponse(
                    ex,
                    notFoundNumbers: new[] { 50001 },
                    forbiddenNumbers: new[] { 50004, 50007, 50008, 50009 },
                    badRequestNumbers: new[] { 50002, 50003, 50005, 50006 }
                );
                return StatusCode(statusCode, apiResponse);
            }
        }

        [HttpDelete("{organizationId:int}/members/{targetUserId:int}/remove")]
        public async Task<IActionResult> RemoveMember(int organizationId, int targetUserId, CancellationToken ct)
        {
            if (CurrentUserId is not int callerUserId)
            {
                return UnauthorizedResponse("Unauthorized access");
            }

            try
            {
                var result = await _orgService.RemoveOrLeaveMemberAsync(
                    organizationId,
                    callerUserId,
                    targetUserId,
                    ct
                );
                return HandleResult(result);
            }
            catch (SqlException ex)
            {
                var (statusCode, apiResponse) = SqlExceptionHelper.MapToApiResponse(
                    ex,
                    notFoundNumbers: new[] { 50001 },
                    forbiddenNumbers: new[] { 50002, 50006, 50007, 50008 },
                    badRequestNumbers: new[] { 50003, 50004, 50005 }
                );
                return StatusCode(statusCode, apiResponse);
            }
        }

        [HttpPost("{id:int}/transfer-ownership")]
        public async Task<IActionResult> TransferOwnership(int id, [FromBody] TransferOwnershipRequestDTO request, CancellationToken ct)
        {
            if (CurrentUserId is not int currentUserId)
            {
                return UnauthorizedResponse("Invalid token or user ID not found in claims.");
            }

            try
            {
                var result = await _orgService.TransferOwnershipAsync(id, currentUserId, request, ct);
                return HandleResult(result);
            }
            catch (SqlException ex)
            {
                var (statusCode, apiResponse) = SqlExceptionHelper.MapToApiResponse(
                    ex,
                    notFoundNumbers: new[] { 50001 },
                    forbiddenNumbers: new[] { 50003 },
                    badRequestNumbers: new[] { 50002, 50004, 50005 }
                );
                return StatusCode(statusCode, apiResponse);
            }
        }

        [HttpGet("roles")]
        public async Task<IActionResult> GetRoles(CancellationToken ct, [FromQuery] bool excludeOwner = false)
        {
            var result = await _orgService.GetRolesAsync(ct, excludeOwner);
            return HandleResult(result);
        }
    }
}
