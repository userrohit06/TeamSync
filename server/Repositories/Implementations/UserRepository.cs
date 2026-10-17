using Dapper;
using Microsoft.EntityFrameworkCore;
using server.DTOs.Common;
using server.DTOs.User;
using server.DTOs.Workspace;
using server.Helpers;
using server.Models;
using server.Repositories.Interfaces;
using System.Data;

namespace server.Repositories.Implementations
{
    public class UserRepository : BaseRepository, IUserRepository
    {
        private readonly TeamSyncContext _dbContext;

        public UserRepository(TeamSyncContext teamSyncContext, IConfiguration config) : base(config)
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

        public async Task<CursorPagedResult<UserResponseDTO>> GetUsersAsync(CursorPaginationFilterDTO filter, CancellationToken ct, string mode = "All")
        {
            var cursorPayload = CursorHelper.Decode<UserKeysetCursor>(filter.Cursor);

            using var connection = CreateConnection();

            var parameters = new DynamicParameters();
            parameters.Add("@PageSize", filter.PageSize);
            parameters.Add("@SearchTerm", filter.SearchTerm);
            parameters.Add("@CursorCreatedAt", cursorPayload?.CreatedAt);
            parameters.Add("@CursorUserId", cursorPayload?.userId);
            parameters.Add("@Mode", mode);

            var command = new CommandDefinition(
                commandText: "usp_Users_Paged",
                parameters: parameters,
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct
            );

            var rawResult = (await connection.QueryAsync<UserResponseDTO>(command)).ToList();

            return CursorPagedResult<UserResponseDTO>.Create(
                rawItems: rawResult,
                requestedPageSize: filter.PageSize,
                cursorSelector: item => CursorHelper.Encode(new UserKeysetCursor(item.CreatedAt, item.UserId))
            );
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
