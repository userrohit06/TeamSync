using server.DTOs.Auth;
using server.DTOs.Common;

namespace server.Services.Interfaces
{
    public interface IAuthService
    {
        Task<ApiResponse> Signup(string fullName, string email, string password, IFormFile? photo, CancellationToken ct);
        Task<ApiResponse<SigninResponseDTO>> Signin(string email, string password, CancellationToken ct);
        Task<ApiResponse> ForgotPassword(string email, CancellationToken ct);
        Task<ApiResponse<SigninResponseDTO>> GoogleSignin(GoogleSigninRequestDTO request, CancellationToken ct);
        Task<ApiResponse> ForgotPassword(string email, string clientUrl, CancellationToken ct);
        Task<ApiResponse> ResetPassword(ResetPasswordRequestDTO request, CancellationToken ct);
    }
}
