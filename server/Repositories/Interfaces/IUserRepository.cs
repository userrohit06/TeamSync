using server.Models;

namespace server.Repositories.Interfaces
{
    public interface IUserRepository
    {
        Task<User?> GetUserByEmail(string email, CancellationToken ct);
        Task<User?> GetUserByGoogleId(string googleId, CancellationToken ct);
        Task UpdateAsync(User user, CancellationToken ct);
        Task AddUser(User user, CancellationToken ct);
        Task<int> Save();
        Task UpdateLastLoginAt(string email, CancellationToken ct);
    }
}
