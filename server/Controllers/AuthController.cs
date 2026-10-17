using Microsoft.AspNetCore.Mvc;
using server.Controllers.Common;
using server.DTOs.Auth;
using server.Services.Interfaces;

namespace server.Controllers
{
    [Route("api/[controller]")]
    public class AuthController : BaseApiController
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("signup")]
        public async Task<IActionResult> Signup([FromForm] SignupRequestDTO request, CancellationToken ct)
        {
            string sanitizedEmail = request.Email.Trim();
            string sanitizedFullName = request.FullName.Trim();

            if (string.IsNullOrWhiteSpace(sanitizedFullName))
            {
                return Error("Full name is required", 400);
            }

            if (string.IsNullOrWhiteSpace(sanitizedEmail))
            {
                return Error("Email is required", 400);
            }

            if (string.IsNullOrWhiteSpace(request.Password))
            {
                return Error("Password is required", 400);
            }

            var result = await _authService.Signup(
                sanitizedFullName,
                sanitizedEmail,
                request.Password,
                request.ProfilePhoto,
                ct);

            return HandleResult(result);
        }

        [HttpPost("signin")]
        public async Task<IActionResult> Signin([FromBody] SigninRequestDTO request, CancellationToken ct)
        {
            var result = await _authService.Signin(request.Email, request.Password, ct);
            return HandleResult(result);
        }

        [HttpPost("google")]
        public async Task<IActionResult> GoogleSignin([FromBody] GoogleSigninRequestDTO request, CancellationToken ct)
        {
            var result = await _authService.GoogleSignin(request, ct);
            return HandleResult(result);
        }

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequestDTO request, CancellationToken ct)
        {
            var result = await _authService.ForgotPassword(request.Email, ct);
            return HandleResult(result);
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequestDTO request, CancellationToken ct)
        {
            var result = await _authService.ResetPassword(request, ct);
            return HandleResult(result);
        }
    }
}
