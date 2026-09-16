using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using server.DTOs.Auth;
using server.DTOs.Common;
using server.Services.Interfaces;

namespace server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            this._authService = authService;
        }

        [HttpPost("signup")]
        public async Task<IActionResult> Signup([FromForm] SignupRequestDTO request, CancellationToken ct)
        {
            var response = new ApiResponse();

            string sanitizedEmail = request.Email.Trim();
            string sanitizedFullName = request.FullName.Trim();

            if (string.IsNullOrWhiteSpace(sanitizedFullName))
            {
                response.Status = 400;
                response.Message = "Full name is required";
                return BadRequest(response);
            }

            if (string.IsNullOrWhiteSpace(sanitizedEmail))
            {
                response.Status = 400;
                response.Message = "Email is required";
                return BadRequest(response);
            }

            if (string.IsNullOrWhiteSpace(request.Password))
            {
                response.Status = 400;
                response.Message = "Password is required";
                return BadRequest(response);
            }

            var result = await this._authService.Signup(
                sanitizedFullName,
                sanitizedEmail,
                request.Password,
                request.ProfilePhoto,
                ct);

            return StatusCode(result.Status, result);
        }
    }
}
