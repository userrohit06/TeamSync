using Dapper;
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

        public async Task<CursorPagedResult<WorkspaceResponseDTO>> GetWorkspacesCursorPagedAsync(int organizationId, int callerUserId, CursorPaginationFilterDTO filter, CancellationToken ct)
        {
            var cursorPayload = CursorHelper.Decode<WorkspacekeysetCursor>(filter.Cursor);

            using var connection = CreateConnection();

            var parameters = new DynamicParameters();
            parameters.Add("@OragnizationId", organizationId);
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

            var result = await connection.QueryFirstOrDefaultAsync(command);
            return result ?? throw new InvalidOperationException("Failed to update workspace details");
        }
    }
}
