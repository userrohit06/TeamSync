using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using server.DTOs.Common;
using server.Extensions;

namespace server.Controllers.Common
{
    [ApiController]
    public abstract class BaseApiController : ControllerBase
    {
        /// <summary>
        /// Retrieves the current authenticated user's ID from claims, or null if unauthenticated / invalid.
        /// </summary>
        protected int? CurrentUserId => User.GetUserId();

        /// <summary>
        /// Retrieves the current authenticated user's ID, or throws UnauthorizedAccessException if not present.
        /// </summary>
        protected int RequiredCurrentUserId => User.GetRequiredUserId();

        /// <summary>
        /// Returns an IActionResult matching the status code inside the ApiResponse.
        /// </summary>
        protected IActionResult HandleResult(ApiResponse response)
        {
            return StatusCode(response.Status, response);
        }

        /// <summary>
        /// Returns an IActionResult matching the status code inside the ApiResponse<T>.
        /// </summary>
        protected IActionResult HandleResult<T>(ApiResponse<T> response)
        {
            return StatusCode(response.Status, response);
        }

        protected IActionResult Success(string message = "Success", int status = StatusCodes.Status200OK)
        {
            return StatusCode(status, ApiResponse.Success(message, status));
        }

        protected IActionResult Success<T>(T? data, string message = "Success", int status = StatusCodes.Status200OK)
        {
            return StatusCode(status, ApiResponse<T>.Success(data, message, status));
        }

        protected IActionResult Error(string message, int status = StatusCodes.Status400BadRequest)
        {
            return StatusCode(status, ApiResponse.Error(message, status));
        }

        protected IActionResult UnauthorizedResponse(string message = "Unauthorized access")
        {
            return StatusCode(StatusCodes.Status401Unauthorized, ApiResponse.Error(message, StatusCodes.Status401Unauthorized));
        }

        protected IActionResult ForbiddenResponse(string message = "Forbidden access")
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse.Error(message, StatusCodes.Status403Forbidden));
        }

        protected IActionResult NotFoundResponse(string message = "Resource not found")
        {
            return StatusCode(StatusCodes.Status404NotFound, ApiResponse.Error(message, StatusCodes.Status404NotFound));
        }
    }
}
