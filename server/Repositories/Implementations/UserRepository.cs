using Microsoft.EntityFrameworkCore;
using server.Models;
using server.Repositories.Interfaces;

namespace server.Repositories.Implementations
{
    public class UserRepository : IUserRepository
    {
        private readonly TeamSyncContext _dbContext;

        public UserRepository(TeamSyncContext teamSyncContext)
        {
            this._dbContext = teamSyncContext;
        }

        public async Task AddUser(User user, CancellationToken ct)
        {
            await this._dbContext.Users.AddAsync(user, ct);
        }

        public async Task<User?> GetUserByEmail(string email, CancellationToken ct)
        {
            return await this._dbContext.Users.FirstOrDefaultAsync(
                user => user.Email == email &&
                user.IsActive &&
                !user.IsDeleted, ct);
        }

        public async Task<int> Save()
        {
            return await this._dbContext.SaveChangesAsync();
        }
    }
}
