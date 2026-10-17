using server.DTOs.Common;
using server.DTOs.User;
using server.Repositories.Interfaces;
using server.Services.Interfaces;

namespace server.Services.Implementations
{
    public class UserService : IUserService
    {
        private readonly IUserRepository _userRepo;

        public UserService(IUserRepository userRepository)
        {
            this._userRepo = userRepository;
        }

        public async Task<ApiResponse<CursorPagedResult<UserResponseDTO>>> GetUsersAsync(CursorPaginationFilterDTO filter, CancellationToken ct, string mode = "All")
        {
            string[] modes = { "All", "Active", "Inactive" };

            if(!modes.Contains(mode, StringComparer.OrdinalIgnoreCase))
            {
                ApiResponse<CursorPagedResult<UserResponseDTO>>.Error("Invalid mode provided. Mode must be in (All, Active, Inactive)");
            }

            var result = await this._userRepo.GetUsersAsync(filter, ct, mode);

            return ApiResponse<CursorPagedResult<UserResponseDTO>>.Success(result, "Users fetched successfully", 200);
        }
    }
}
