using Dapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using server.DTOs.Common;
using server.DTOs.Workspace;
using server.Helpers;
using server.Models;
using server.Repositories.Interfaces;
using System.Data;

namespace server.Repositories.Implementations
{
    public class WorkspaceRepository : BaseRepository, IWorkspaceRepository
    {
        private readonly TeamSyncContext _dbContext;

        public WorkspaceRepository(TeamSyncContext dbContext, IConfiguration config) : base(config)
        {
            _dbContext = dbContext;
        }

        public async Task<WorkspaceResponseDTO> CreateWorkspaceAsync(int organizationId, int createdByUserId, string name, string? description, bool isPrivate, string baseSlug, CancellationToken ct)
        {
            using var connection = CreateConnection();

            var parameters = new DynamicParameters();
            parameters.Add("@OrganizationId", organizationId);
            parameters.Add("@CreatedByUserId", createdByUserId);
            parameters.Add("@Name", name);
            parameters.Add("@Description", description);
            parameters.Add("@IsPrivate", isPrivate);
            parameters.Add("@BaseSlug", baseSlug);

            var command = new CommandDefinition(
                commandText: "usp_Workspace_Create",
                parameters: parameters,
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct
            );

            var result = await connection.QuerySingleOrDefaultAsync<WorkspaceResponseDTO>(command);

            return result ?? throw new InvalidOperationException("Failed to create workspace");
        }

        public async Task<WorkspaceDetailsDTO> GetWorkspaceDetailsAsync(int workspaceId, int organizationId, int currentUserId, CancellationToken ct)
        {
            using var connection = CreateConnection();

            var parameters = new DynamicParameters();
            parameters.Add("@CurrentUserId", currentUserId);
            parameters.Add("@WorkspaceId", workspaceId);
            parameters.Add("@OrganizationId", organizationId);

            var command = new CommandDefinition(
                commandText: "usp_Workspace_Details",
                parameters: parameters,
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct
            );

            var result = await connection.QuerySingleOrDefaultAsync<WorkspaceDetailsDTO>(command);
            return result ?? throw new InvalidOperationException("Failed to get workspace details");
        }

        public async Task<WorkspaceDetailsDTO> GetWorkspaceDetailsAsync(int workspaceId, int organizationId, int currentUserId, CancellationToken ct)
        {
            using var connection = CreateConnection();

            var parameters = new DynamicParameters();
            parameters.Add("@CurrentUserId", currentUserId);
            parameters.Add("@WorkspaceId", workspaceId);
            parameters.Add("@OrganizationId", organizationId);

            var command = new CommandDefinition(
                commandText: "usp_Workspace_Details",
                parameters: parameters,
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct
            );

            var result = await connection.QuerySingleOrDefaultAsync<WorkspaceDetailsDTO>(command);
            return result ?? throw new InvalidOperationException("Failed to get workspace details");
        }

        public async Task<CursorPagedResult<WorkspaceResponseDTO>> GetWorkspacesCursorPagedAsync(int organizationId, int callerUserId, CursorPaginationFilterDTO filter, CancellationToken ct)
        {
            var cursorPayload = CursorHelper.Decode<WorkspacekeysetCursor>(filter.Cursor);

            using var connection = CreateConnection();

            var parameters = new DynamicParameters();
            parameters.Add("@OrganizationId", organizationId);
            parameters.Add("@CallerUserId", callerUserId);
            parameters.Add("@CursorCreatedAt", cursorPayload?.CreatedAt);
            parameters.Add("@CursorWorkspaceId", cursorPayload?.WorkspaceId);
            parameters.Add("@SearchTerm", filter.SearchTerm);
            parameters.Add("@PageSize", filter.PageSize);

            var command = new CommandDefinition(
                commandText: "usp_Workspace_Paged",
                parameters: parameters,
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct
            );

            var result = (await connection.QueryAsync<WorkspaceResponseDTO>(command)).ToList();

            return CursorPagedResult<WorkspaceResponseDTO>.Create(
                rawItems: result,
                requestedPageSize: filter.PageSize,
                cursorSelector: item => CursorHelper.Encode(new WorkspacekeysetCursor(item.CreatedAt, item.WorkspaceId))
            );
        }

        public async Task<bool> SoftDeleteWorkspaceAsync(int workspaceId, int organizationId, int currentUserId, CancellationToken ct)
        {
            using var connection = CreateConnection();

            var parameters = new DynamicParameters();
            parameters.Add("@WorkspaceId", workspaceId);
            parameters.Add("@OrganizationId", organizationId);
            parameters.Add("@CurrentUserId", currentUserId);

            var command = new CommandDefinition(
                commandText: "usp_Workspace_SoftDelete",
                parameters: parameters,
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct
            );

            await connection.ExecuteAsync(command);

            return true;
        }

        public async Task<WorkspaceDetailsDTO> UpdateWorkspaceAsync(int workspaceId, int organizationId, int currentUserId, string? name, string? baseSlug, string? description, bool? isPrivate, CancellationToken ct)
        {
            using var connection = CreateConnection();

            var parameters = new DynamicParameters();
            parameters.Add("@WorkspaceId", workspaceId);
            parameters.Add("@OrganizationId", organizationId);
            parameters.Add("@CurrentUserId", currentUserId);
            parameters.Add("@Name", name);
            parameters.Add("@BaseSlug", baseSlug);
            parameters.Add("@Description", description);
            parameters.Add("@IsPrivate", isPrivate);

            var command = new CommandDefinition(
                commandText: "usp_Workspace_Update",
                parameters: parameters,
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct
            );

            var result = await connection.QueryFirstOrDefaultAsync<WorkspaceDetailsDTO>(command);
            return result ?? throw new InvalidOperationException("Failed to update workspace details");
        }

        public async Task<CursorPagedResult<WorkspaceMemberResponseDTO>> GetWorkspaceMembersAsync(int organizationId, int workspaceId, int currentUserId, CursorPaginationFilterDTO filter, CancellationToken ct)
        {
            var cursorPayload = CursorHelper.Decode<WorkspaceMemberKeysetCursor>(filter.Cursor);

            using var connection = CreateConnection();

            var parameters = new DynamicParameters();
            parameters.Add("@OrganizationId", organizationId);
            parameters.Add("@WorkspaceId", workspaceId);
            parameters.Add("@CurrentUserId", currentUserId);
            parameters.Add("@PageSize", filter.PageSize);
            parameters.Add("@CursorUserId", cursorPayload?.UserId);
            parameters.Add("@SearchTerm", filter.SearchTerm);

            var command = new CommandDefinition(
                commandText: "usp_WorkspaceMember_List",
                parameters: parameters,
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct
            );

            var rawRows = (await connection.QueryAsync<WorkspaceMemberResponseDTO>(command)).ToList();

            return CursorPagedResult<WorkspaceMemberResponseDTO>.Create(
                rawItems: rawRows,
                requestedPageSize: filter.PageSize,
                cursorSelector: item => CursorHelper.Encode(new WorkspaceMemberKeysetCursor(item.UserId))
            );
        }

        public async Task<WorkspaceMemberResponseDTO> AddWorkspaceMemberAsync(int organizationId, int workspaceId, int callerUserId, string email, int roleId, CancellationToken ct)
        {
            using var connection = CreateConnection();

            var parameters = new DynamicParameters();
            parameters.Add("@OrganizationId", organizationId);
            parameters.Add("@WorkspaceId", workspaceId);
            parameters.Add("@CallerUserId", callerUserId);
            parameters.Add("@TargetEmail", email);
            parameters.Add("@RoleId", roleId);

            var command = new CommandDefinition(
                commandText: "usp_WorkspaceMember_Add",
                parameters: parameters,
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct
            );

            var result = await connection.QuerySingleOrDefaultAsync<WorkspaceMemberResponseDTO>(command);
            return result ?? throw new InvalidOperationException("Failed to add workspace member");
        }

        public async Task<WorkspaceMemberResponseDTO> UpdateWorkspaceMemberRoleAsync(int organizationId, int workspaceId, int callerUserId, int targetUserId, int newRoleId, CancellationToken ct)
        {
            using var connection = CreateConnection();

            var parameters = new DynamicParameters();
            parameters.Add("@OrganizationId", organizationId);
            parameters.Add("@WorkspaceId", workspaceId);
            parameters.Add("@CallerUserId", callerUserId);
            parameters.Add("@TargetUserId", targetUserId);
            parameters.Add("@NewRoleId", newRoleId);

            var command = new CommandDefinition(
                commandText: "usp_WorkspaceMember_UpdateRole",
                parameters: parameters,
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct
            );

            var result = await connection.QuerySingleOrDefaultAsync<WorkspaceMemberResponseDTO>(command);
            return result ?? throw new InvalidOperationException("Failed to update workspace member role");
        }

        public async Task<bool> RemoveWorkspaceMemberAsync(int organizationId, int workspaceId, int callerUserId, int targetUserId, CancellationToken ct)
        {
            using var connection = CreateConnection();

            var parameters = new DynamicParameters();
            parameters.Add("@OrganizationId", organizationId);
            parameters.Add("@WorkspaceId", workspaceId);
            parameters.Add("@CallerUserId", callerUserId);
            parameters.Add("@TargetUserId", targetUserId);

            var command = new CommandDefinition(
                commandText: "usp_WorkspaceMember_RemoveOrLeave",
                parameters: parameters,
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct
            );

            var result = await connection.ExecuteScalarAsync<int>(command);
            return result == 1;
        }

        public async Task<IReadOnlyList<WorkspaceRoleDTO>> GetWorkspaceRolesAsync(CancellationToken ct)
        {
            return await _dbContext.WorkspaceRoles
                .AsNoTracking()
                .OrderBy(r => r.RoleId)
                .Select(r => new WorkspaceRoleDTO
                {
                    RoleId = r.RoleId,
                    RoleName = r.RoleName,
                    Description = r.Description
                })
                .ToListAsync(ct);
        }

        public async Task<bool> TransferWorkspaceOwnershipAsync(int organizationId, int workspaceId, int currentUserId, int newOwnerUserId, int? previousOwnerRoleId, CancellationToken ct)
        {
            using var connection = CreateConnection();

            var parameters = new DynamicParameters();
            parameters.Add("@OrganizationId", organizationId);
            parameters.Add("@WorkspaceId", workspaceId);
            parameters.Add("@CurrentOwnerUserId", currentUserId);
            parameters.Add("@NewOwnerUserId", newOwnerUserId);
            parameters.Add("@PreviousOwnerRoleId", previousOwnerRoleId);

            var command = new CommandDefinition(
                commandText: "usp_Workspace_TransferOwnership",
                parameters: parameters,
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct
            );

            var result = await connection.ExecuteScalarAsync<int>(command);
            return result == 1;
        }
    }
}
