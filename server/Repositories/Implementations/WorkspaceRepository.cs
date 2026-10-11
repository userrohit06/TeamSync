using Dapper;
using Microsoft.Data.SqlClient;
using server.DTOs.Workspace;
using server.Models;
using server.Repositories.Interfaces;
using System.Data;

namespace server.Repositories.Implementations
{
    public class WorkspaceRepository : IWorkspaceRepository
    {
        private readonly TeamSyncContext _dbContext;
        private readonly IConfiguration _config;

        public WorkspaceRepository(TeamSyncContext dbContext, IConfiguration config)
        {
            this._dbContext = dbContext;
            this._config = config;
        }

        public async Task<WorkspaceResponseDTO> CreateWorkspaceAsync(int organizationId, int createdByUserId, string name, string? description, bool isPrivate, string baseSlug, CancellationToken ct)
        {
            string connectionString = this._config.GetConnectionString("DefaultConnection")!;
            using var connection = new SqlConnection(connectionString);

            var parameters = new DynamicParameters();
            parameters.Add("@OrganizationId", organizationId);
            parameters.Add("@CreatedByUserId", createdByUserId);
            parameters.Add("@Name", name);
            parameters.Add("@Description", description);
            parameters.Add("@IsPrivate", isPrivate);
            parameters.Add("BaseSlug", baseSlug);

            var command = new CommandDefinition(
                commandText: "usp_Workspace_Create",
                parameters: parameters,
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct
            );

            var result = await connection.QuerySingleOrDefaultAsync<WorkspaceResponseDTO>(command);

            return result ?? throw new InvalidOperationException("Failed to create workspace");
        }
    }
}
