using Microsoft.Data.SqlClient;
using server.DTOs.Common;
using server.DTOs.Organization;
using server.Models;
using server.Repositories.Interfaces;
using Dapper;
using System.Data;
using server.Helpers;
using Microsoft.EntityFrameworkCore;

namespace server.Repositories.Implementations
{
    public class OrganizationRepository : IOrganizationRepository
    {
        private readonly TeamSyncContext _dbContext;
        private readonly IConfiguration _config;

        public OrganizationRepository(TeamSyncContext context, IConfiguration config)
        {
            this._dbContext = context;
            this._config = config;
        }

        public async Task<OrganizationResponseDTO> CreateOrganization(string name, string? description, string? logoUrl, int createdByUserId, CancellationToken ct)
        {
            string connectionString = this._config.GetConnectionString("DefaultConnection")!;
            using var connection = new SqlConnection(connectionString);

            var parameters = new DynamicParameters();
            parameters.Add("@Name", name);
            parameters.Add("@Description", description);
            parameters.Add("@LogoUrl", logoUrl);
            parameters.Add("@CreatedByUserId", createdByUserId);

            var command = new CommandDefinition(
                commandText: "usp_CreateOrganization",
                parameters: parameters,
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct
            );

            var result = await connection.QuerySingleOrDefaultAsync<OrganizationResponseDTO>(command);

            return result ?? throw new InvalidOperationException("Failed to create organization");
        }

        public async Task<IReadOnlyList<OrganizationMemberResponseDTO>> GetMembersByOrganizationIdAsync(int organizationId, CancellationToken ct)
        {
            return await this._dbContext.OrganizationMembers
                .AsNoTracking()
                .Where(om => om.OrganizationId == organizationId
                    && !om.Organization.IsDeleted
                    && om.Organization.IsActive)
                .OrderBy(om => om.Role.RoleId) // Owner and Admin roles come at top
                .ThenBy(om => om.JoinedAt)
                .Select(om => new OrganizationMemberResponseDTO
                {
                    OrganizationMemberId = om.OrganizationMemberId,
                    UserId = om.UserId,
                    Email = om.User.Email,
                    FullName = om.User.FullName,
                    ProfilePhotoUrl = om.User.ProfilePhoto,
                    RoleId = om.Role.RoleId,
                    RoleDescription = om.Role.Description,
                    MembershipStatus = om.MembershipStatus,
                    JoinedAt = om.JoinedAt
                })
                .ToListAsync();
        }

        public async Task<OrganizationDetailDTO?> GetOrganizationByIdForUserAsync(int organizationId, int userId, CancellationToken ct)
        {
            return await this._dbContext.OrganizationMembers
                .AsNoTracking()
                .Where(om => om.OrganizationId == organizationId
                    && om.UserId == userId
                    && om.MembershipStatus == "Active"
                    && !om.Organization.IsDeleted
                    && om.Organization.IsActive)
                .Select(om => new OrganizationDetailDTO
                (
                    om.Organization.OrganizationId,
                    om.Organization.Name,
                    om.Organization.Description,
                    om.Organization.LogoUrl,
                    om.Organization.CreatedAt,
                    om.Organization.UpdatedAt,
                    om.Role.RoleName,
                    om.Role.Description,
                    om.MembershipStatus,
                    om.JoinedAt
                ))
                .FirstOrDefaultAsync();
        }

        public async Task<CursorPagedResult<UserOrganizationDTO>> GetUserOrganizationsCursorPagedAsync(int userId, CursorPaginationFilterDTO filter, CancellationToken ct)
        {
            // Decode generic cursor
            var cursorPayload = CursorHelper.Decode<OrganizationKeysetCursor>(filter.Cursor);

            string connectionString = this._config.GetConnectionString("DefaultConnection")!;
            using var connection = new SqlConnection(connectionString);

            var parameters = new DynamicParameters();
            parameters.Add("@UserId", userId);
            parameters.Add("@PageSize", filter.PageSize);
            parameters.Add("@SearchTerm", filter?.SearchTerm);
            parameters.Add("@lastJoinedAt", cursorPayload?.JoinedAt);
            parameters.Add("@LastOrganizationId", cursorPayload?.OrganizationId);

            var command = new CommandDefinition(
                commandText: "usp_GetUserOrganizations_Paged",
                parameters: parameters,
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct
            );

            // fetches up to (PageSize + 1) rows
            var rawRows = (await connection.QueryAsync<UserOrganizationDTO>(command)).ToList();

            // Strips the +1 row and builds the next cursor token
            return CursorPagedResult<UserOrganizationDTO>.Create(
            rawItems: rawRows,
            requestedPageSize: filter.PageSize,
            cursorSelector: item => CursorHelper.Encode(new OrganizationKeysetCursor(item.JoinedAt, item.OrganizationId))
            );
        }

        public async Task<bool> IsUserActiveMemberAsync(int organizationId, int userId, CancellationToken ct)
        {
            return await this._dbContext.OrganizationMembers
                .AsNoTracking()
                .AnyAsync(om => om.OrganizationId == organizationId
                    && om.UserId == userId
                    && om.MembershipStatus == "Active"
                    && om.Organization.IsActive
                    && !om.Organization.IsDeleted);
        }

        public async Task<bool> SoftDeleteOrganization(int organizationId, int currentUserId, CancellationToken ct)
        {
            string connectionString = this._config.GetConnectionString("DefaultConnection")!;
            using var connection = new SqlConnection(connectionString);

            var parameters = new DynamicParameters();
            parameters.Add("@OrganizationId", organizationId);
            parameters.Add("@UserId", currentUserId);

            var command = new CommandDefinition(
                commandText: "usp_Organization_SoftDelete",
                parameters: parameters,
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct
            );

            var result = await connection.ExecuteScalarAsync<int>(command);

            return result == 1;
        }

        public async Task<UpdateOrganizationDbResult> UpdateOrganizationAsync(int organizationId, int userId, string name, string? description, string? logoUrl, bool updateLogo, CancellationToken ct)
        {
            string connectionString = this._config.GetConnectionString("DefaultConnection")!;
            using var connection = new SqlConnection(connectionString);

            var parameters = new DynamicParameters();
            parameters.Add("@OrganizationId", organizationId);
            parameters.Add("@UserId", userId);
            parameters.Add("@Name", name);
            parameters.Add("@Description", description);
            parameters.Add("@LogoUrl", logoUrl);
            parameters.Add("@UpdateLogo", updateLogo);

            var command = new CommandDefinition(
                commandText: "usp_Organization_Update",
                parameters: parameters,
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct
            );

            var result = await connection.QuerySingleOrDefaultAsync<UpdateOrganizationDbResult>(command);

            return result ?? throw new InvalidOperationException("Failed to update organization");
        }
    }
}
