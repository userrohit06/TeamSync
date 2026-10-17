using server.DTOs.Common;
using server.DTOs.User;

namespace server.Services.Interfaces
{
    public interface IUserService
    {
        Task<ApiResponse<CursorPagedResult<UserResponseDTO>>> GetUsersAsync(
            CursorPaginationFilterDTO filter,
            CancellationToken ct,
            string mode = "All"
        );
    }
}
