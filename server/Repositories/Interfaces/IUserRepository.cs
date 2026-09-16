using server.Models;

namespace server.Repositories.Interfaces
{
    public interface IUserRepository
    {
        Task<User?> GetUserByEmail(string email, CancellationToken ct);
        Task AddUser(User user, CancellationToken ct);
        Task<int> Save();
    }
}
