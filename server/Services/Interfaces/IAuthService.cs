using server.DTOs.Common;

namespace server.Services.Interfaces
{
    public interface IAuthService
    {
        Task<ApiResponse> Signup(string fullName, string email, string password, IFormFile? photo, CancellationToken ct);
    }
}
