using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using server.Controllers.Common;
using server.DTOs.Common;
using server.Helpers;
using server.Models;
using server.Services.Interfaces;

namespace server.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    public class UserController : BaseApiController
    {
        private readonly IUserService _userService;

        public UserController(IUserService userService)
        {
            this._userService = userService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllAsync([FromQuery] CursorPaginationFilterDTO filter, CancellationToken ct, string mode = "All")
        {
            try
            {
                var result = await this._userService.GetUsersAsync(filter, ct, mode);
                return HandleResult(result);
            }
            catch (SqlException ex)
            {
                var (statusCode, apiResponse) = SqlExceptionHelper.MapToApiResponse(
                    ex,
                    badRequestNumbers: new[] { 50001, 50002 }
                );
                return StatusCode(statusCode, apiResponse);
            }
        }
    }
}
