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

        public async Task<MemberDetailDTO> AddorInviteMemberAsync(int organizationId, int callerUserId, string email, int roleId, CancellationToken ct)
        {
            string connectionString = this._config.GetConnectionString("DefaultConnection")!;
            using var connection = new SqlConnection(connectionString);

            var parameters = new DynamicParameters();
            parameters.Add("@OrganizationId", organizationId);
            parameters.Add("@CallerUserId", callerUserId);
            parameters.Add("@Email", email);
            parameters.Add("@RoleId", roleId);

            var command = new CommandDefinition(
                commandText: "usp_OrganizationMember_AddorInvite",
                parameters: parameters,
                commandType: CommandType.Text,
                cancellationToken: ct
            );

            var member = await connection.QuerySingleOrDefaultAsync<MemberDetailDTO>(command);
            return member ?? throw new InvalidOperationException("Failed to add member");
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

        public async Task<IReadOnlyList<OrganizationRoleDTO>> GetAllRolesAsync(CancellationToken ct)
        {
            return await this._dbContext.OrganizationMemberRoles
                .AsNoTracking()
                .OrderBy(r => r.RoleId)
                .Select(r => new OrganizationRoleDTO
                {
                    RoleId = r.RoleId,
                    RoleName = r.RoleName,
                    Description = r.Description
                })
                .ToListAsync(ct);
        }

        public async Task<CursorPagedResult<OrganizationMemberResponseDTO>> GetMembersByOrganizationIdAsync(int organizationId, CursorPaginationFilterDTO filter, CancellationToken ct)
        {
            var cursorPayload = CursorHelper.Decode<MemberKeysetCursor>(filter.Cursor);

            string connectionString = this._config.GetConnectionString("DefaultConnection")!;
            using var connection = new SqlConnection(connectionString);

            var paramters = new DynamicParameters();

            paramters.Add("@OrganizationId", organizationId);
            paramters.Add("@PageSize", filter.PageSize);
            paramters.Add("@SearchTerm", filter.SearchTerm);
            paramters.Add("@LastJoinedAt", cursorPayload?.JoinedAt);
            paramters.Add("@LastUserId", cursorPayload?.UserId);

            var command = new CommandDefinition(
                commandText: "usp_GetOrganizationMembers_Paged",
                parameters: paramters,
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct
            );

            // pagesize + 1 is fetched to determine whether another page exists
            var rawRows = (await connection.QueryAsync<OrganizationMemberResponseDTO>(command)).ToList();

            return CursorPagedResult<OrganizationMemberResponseDTO>.Create(
                rawItems: rawRows,
                requestedPageSize: filter.PageSize,
                cursorSelector: item => CursorHelper.Encode(
                        new MemberKeysetCursor(item.JoinedAt, item.UserId)
                    )
            );
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

        public async Task<bool> RemoveOrLeaveMemberAsync(int organizationId, int callerUserId, int targetUserId, CancellationToken ct)
        {
            string connectionString = this._config.GetConnectionString("DefaultConnection")!;
            using var connection = new SqlConnection(connectionString);

            var parameters = new DynamicParameters();
            parameters.Add("@OrganizationId", organizationId);
            parameters.Add("@CallerUserId", callerUserId);
            parameters.Add("@TargetUserId", targetUserId);

            var command = new CommandDefinition(
                commandText: "usp_OrganizationMember_RemoveOrLeave",
                parameters: parameters,
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct
            );

            var result = await connection.ExecuteScalarAsync<int>(command);

            return result == 1;
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

        public async Task<TransferOwnershipResponseDTO?> TransferOwnershipAsync(int organizationId, int currentOwnerUserId, int newOwnerUserId, int? previousOwnerRoleId, CancellationToken ct)
        {
            string connectionString = this._config.GetConnectionString("DefaultConnection")!;
            using var connection = new SqlConnection(connectionString);

            var parameters = new DynamicParameters();
            parameters.Add("@OrganizationId", organizationId);
            parameters.Add("@CurrentOwnerUserId", currentOwnerUserId);
            parameters.Add("@NewOwnerUserId", newOwnerUserId);
            parameters.Add("@PreviousOwnerRoleId", previousOwnerRoleId);

            var command = new CommandDefinition(
                commandText: "usp_Organization_TransferOwnership",
                parameters: parameters,
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct
            );

            var result = await connection.QuerySingleOrDefaultAsync<TransferOwnershipResponseDTO>(command);

            return result ?? throw new InvalidOperationException("Failed to transfer organization ownerhip");
        }

        public async Task<UpdatedMemberRoleResponseDTO> UpdateMemberRoleAsync(int organizationId, int callerUserId, int targetUserId, int newRoleId, CancellationToken ct)
        {
            string connectionString = this._config.GetConnectionString("DefaultConnection")!;
            using var connection = new SqlConnection(connectionString);

            DynamicParameters parameters = new DynamicParameters();
            parameters.Add("@OrganizationId", organizationId);
            parameters.Add("@CallerUserId", callerUserId);
            parameters.Add("@TargetUserId", targetUserId);
            parameters.Add("@NewRoleId", newRoleId);

            CommandDefinition command = new CommandDefinition(
                commandText: "usp_OrganizationMember_UpdateRole",
                parameters: parameters,
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct
            );

            var result = await connection.QuerySingleOrDefaultAsync<UpdatedMemberRoleResponseDTO>(command);

            return result ?? throw new InvalidOperationException("Failed to update member role");
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
