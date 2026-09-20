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

        public async Task<User?> GetByResetToken(string hashedToken)
        {
            return await this._dbContext.Users.FirstOrDefaultAsync(user => user.PasswordResetToken == hashedToken);
        }

        public async Task<User?> GetUserByEmail(string email, CancellationToken ct)
        {
            return await this._dbContext.Users.FirstOrDefaultAsync(
                user => user.Email == email &&
                user.IsActive &&
                !user.IsDeleted, ct);
        }

        public async Task<User?> GetUserByGoogleId(string googleId, CancellationToken ct)
        {
            return await this._dbContext.Users.FirstOrDefaultAsync(
                user => user.GoogleId == googleId &&
                user.IsActive &&
                !user.IsDeleted, ct);
        }

        public async Task<int> Save()
        {
            return await this._dbContext.SaveChangesAsync();
        }

        public async Task UpdateAsync(User user, CancellationToken ct)
        {
            this._dbContext.Users.Update(user);
            await this._dbContext.SaveChangesAsync();
        }

        public async Task UpdateLastLoginAt(string email, CancellationToken ct)
        {
            await this._dbContext.Users
                .Where(user => user.Email == email)
                .ExecuteUpdateAsync(setters => setters.SetProperty(u => u.LastLoginAt, DateTime.UtcNow), ct);
        }
    }
}
