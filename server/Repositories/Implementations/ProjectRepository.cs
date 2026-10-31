using System.Data;
using Dapper;
using Microsoft.Extensions.Configuration;
using server.DTOs.Common;
using server.DTOs.Project;
using server.Helpers;
using server.Repositories.Interfaces;

namespace server.Repositories.Implementations
{
    public class ProjectRepository : BaseRepository, IProjectRepository
    {
        public ProjectRepository(IConfiguration config) : base(config)
        {
        }

        private static DataTable CreateIdListTable(IEnumerable<int>? ids)
        {
            var table = new DataTable();
            table.Columns.Add("Id", typeof(int));
            if (ids != null)
            {
                foreach (var id in ids)
                {
                    table.Rows.Add(id);
                }
            }
            return table;
        }

        public async Task<ProjectResponseDTO> CreateProjectAsync(
            int workspaceId,
            int currentUserId,
            string name,
            string baseSlug,
            string visibility,
            string? description,
            int? projectStatusId,
            DateTime? startDate,
            DateTime? dueDate,
            IEnumerable<int>? initialMemberIds,
            CancellationToken ct)
        {
            using var connection = CreateConnection();

            var parameters = new DynamicParameters();
            parameters.Add("@WorkspaceId", workspaceId);
            parameters.Add("@CurrentUserId", currentUserId);
            parameters.Add("@Name", name);
            parameters.Add("@BaseSlug", baseSlug);
            parameters.Add("@Visibility", visibility);
            parameters.Add("@Description", description);
            parameters.Add("@ProjectStatusId", projectStatusId);
            parameters.Add("@StartDate", startDate, DbType.Date);
            parameters.Add("@DueDate", dueDate, DbType.Date);
            parameters.Add("@InitialMemberIds", CreateIdListTable(initialMemberIds).AsTableValuedParameter("dbo.IdList"));

            var command = new CommandDefinition(
                commandText: "usp_Project_Create",
                parameters: parameters,
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct
            );

            var result = await connection.QuerySingleOrDefaultAsync<ProjectResponseDTO>(command);
            return result ?? throw new InvalidOperationException("Failed to create project");
        }

        public async Task<ProjectDetailsDTO> GetProjectByIdAsync(
            int projectId,
            int currentUserId,
            int? workspaceId,
            CancellationToken ct)
        {
            using var connection = CreateConnection();

            var parameters = new DynamicParameters();
            parameters.Add("@ProjectId", projectId);
            parameters.Add("@CurrentUserId", currentUserId);
            parameters.Add("@WorkspaceId", workspaceId);

            var command = new CommandDefinition(
                commandText: "usp_Project_GetById",
                parameters: parameters,
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct
            );

            var result = await connection.QuerySingleOrDefaultAsync<ProjectDetailsDTO>(command);
            return result ?? throw new InvalidOperationException("Failed to fetch project details");
        }

        public async Task<CursorPagedResult<ProjectResponseDTO>> GetProjectsCursorPagedAsync(
            int currentUserId,
            int? workspaceId,
            ProjectFilterDTO filter,
            CancellationToken ct)
        {
            var cursorPayload = CursorHelper.Decode<ProjectKeysetCursor>(filter.Cursor);

            using var connection = CreateConnection();

            var parameters = new DynamicParameters();
            parameters.Add("@CurrentUserId", currentUserId);
            parameters.Add("@WorkspaceId", workspaceId);
            parameters.Add("@PageSize", filter.PageSize);
            parameters.Add("@CursorCreatedAt", cursorPayload?.CreatedAt);
            parameters.Add("@CursorProjectId", cursorPayload?.ProjectId);
            parameters.Add("@ProjectStatusId", filter.ProjectStatusId);
            parameters.Add("@SearchTerm", filter.SearchTerm);
            parameters.Add("@IncludeArchived", filter.IncludeArchived);

            var command = new CommandDefinition(
                commandText: "usp_Project_List",
                parameters: parameters,
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct
            );

            var rawRows = (await connection.QueryAsync<ProjectResponseDTO>(command)).ToList();

            return CursorPagedResult<ProjectResponseDTO>.Create(
                rawItems: rawRows,
                requestedPageSize: filter.PageSize,
                cursorSelector: item => CursorHelper.Encode(new ProjectKeysetCursor(item.CreatedAt, item.ProjectId))
            );
        }

        public async Task<ProjectDetailsDTO> UpdateProjectAsync(
            int projectId,
            int currentUserId,
            int? workspaceId,
            string? name,
            string? baseSlug,
            string? description,
            int? projectStatusId,
            DateTime? startDate,
            DateTime? dueDate,
            bool updateDates,
            CancellationToken ct)
        {
            using var connection = CreateConnection();

            var parameters = new DynamicParameters();
            parameters.Add("@ProjectId", projectId);
            parameters.Add("@CurrentUserId", currentUserId);
            parameters.Add("@WorkspaceId", workspaceId);
            parameters.Add("@Name", name);
            parameters.Add("@BaseSlug", baseSlug);
            parameters.Add("@Description", description);
            parameters.Add("@ProjectStatusId", projectStatusId);
            parameters.Add("@StartDate", startDate, DbType.Date);
            parameters.Add("@DueDate", dueDate, DbType.Date);
            parameters.Add("@UpdateDates", updateDates);

            var command = new CommandDefinition(
                commandText: "usp_Project_Update",
                parameters: parameters,
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct
            );

            var result = await connection.QuerySingleOrDefaultAsync<ProjectDetailsDTO>(command);
            return result ?? throw new InvalidOperationException("Failed to update project");
        }

        public async Task<ProjectDetailsDTO> ChangeProjectStatusAsync(
            int projectId,
            int currentUserId,
            int newProjectStatusId,
            int? workspaceId,
            CancellationToken ct)
        {
            using var connection = CreateConnection();

            var parameters = new DynamicParameters();
            parameters.Add("@ProjectId", projectId);
            parameters.Add("@CurrentUserId", currentUserId);
            parameters.Add("@NewProjectStatusId", newProjectStatusId);
            parameters.Add("@WorkspaceId", workspaceId);

            var command = new CommandDefinition(
                commandText: "usp_Project_ChangeStatus",
                parameters: parameters,
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct
            );

            var result = await connection.QuerySingleOrDefaultAsync<ProjectDetailsDTO>(command);
            return result ?? throw new InvalidOperationException("Failed to change project status");
        }

        public async Task<ProjectDetailsDTO> ChangeProjectVisibilityAsync(
            int projectId,
            int currentUserId,
            string newVisibility,
            int? workspaceId,
            IEnumerable<int>? initialMemberIds,
            CancellationToken ct)
        {
            using var connection = CreateConnection();

            var parameters = new DynamicParameters();
            parameters.Add("@ProjectId", projectId);
            parameters.Add("@CurrentUserId", currentUserId);
            parameters.Add("@NewVisibility", newVisibility);
            parameters.Add("@WorkspaceId", workspaceId);
            parameters.Add("@InitialMemberIds", CreateIdListTable(initialMemberIds).AsTableValuedParameter("dbo.IdList"));

            var command = new CommandDefinition(
                commandText: "usp_Project_ChangeVisibility",
                parameters: parameters,
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct
            );

            var result = await connection.QuerySingleOrDefaultAsync<ProjectDetailsDTO>(command);
            return result ?? throw new InvalidOperationException("Failed to change project visibility");
        }

        public async Task<ProjectDetailsDTO> TransferProjectOwnershipAsync(
            int projectId,
            int currentUserId,
            int newOwnerUserId,
            int? workspaceId,
            CancellationToken ct)
        {
            using var connection = CreateConnection();

            var parameters = new DynamicParameters();
            parameters.Add("@ProjectId", projectId);
            parameters.Add("@CurrentUserId", currentUserId);
            parameters.Add("@NewOwnerUserId", newOwnerUserId);
            parameters.Add("@WorkspaceId", workspaceId);

            var command = new CommandDefinition(
                commandText: "usp_Project_TransferOwnership",
                parameters: parameters,
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct
            );

            var result = await connection.QuerySingleOrDefaultAsync<ProjectDetailsDTO>(command);
            return result ?? throw new InvalidOperationException("Failed to transfer project ownership");
        }

        public async Task<ProjectDetailsDTO> ArchiveProjectAsync(
            int projectId,
            int currentUserId,
            int? workspaceId,
            CancellationToken ct)
        {
            using var connection = CreateConnection();

            var parameters = new DynamicParameters();
            parameters.Add("@ProjectId", projectId);
            parameters.Add("@CurrentUserId", currentUserId);
            parameters.Add("@WorkspaceId", workspaceId);

            var command = new CommandDefinition(
                commandText: "usp_Project_Archive",
                parameters: parameters,
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct
            );

            var result = await connection.QuerySingleOrDefaultAsync<ProjectDetailsDTO>(command);
            return result ?? throw new InvalidOperationException("Failed to archive project");
        }

        public async Task<ProjectDetailsDTO> RestoreArchivedProjectAsync(
            int projectId,
            int currentUserId,
            int? workspaceId,
            CancellationToken ct)
        {
            using var connection = CreateConnection();

            var parameters = new DynamicParameters();
            parameters.Add("@ProjectId", projectId);
            parameters.Add("@CurrentUserId", currentUserId);
            parameters.Add("@WorkspaceId", workspaceId);

            var command = new CommandDefinition(
                commandText: "usp_Project_RestoreArchive",
                parameters: parameters,
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct
            );

            var result = await connection.QuerySingleOrDefaultAsync<ProjectDetailsDTO>(command);
            return result ?? throw new InvalidOperationException("Failed to restore archived project");
        }

        public async Task<bool> SoftDeleteProjectAsync(
            int projectId,
            int currentUserId,
            int? workspaceId,
            CancellationToken ct)
        {
            using var connection = CreateConnection();

            var parameters = new DynamicParameters();
            parameters.Add("@ProjectId", projectId);
            parameters.Add("@CurrentUserId", currentUserId);
            parameters.Add("@WorkspaceId", workspaceId);

            var command = new CommandDefinition(
                commandText: "usp_Project_SoftDelete",
                parameters: parameters,
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct
            );

            var result = await connection.ExecuteScalarAsync<int>(command);
            return result == 1;
        }

        public async Task<ProjectDetailsDTO> RestoreDeletedProjectAsync(
            int projectId,
            int currentUserId,
            int? workspaceId,
            CancellationToken ct)
        {
            using var connection = CreateConnection();

            var parameters = new DynamicParameters();
            parameters.Add("@ProjectId", projectId);
            parameters.Add("@CurrentUserId", currentUserId);
            parameters.Add("@WorkspaceId", workspaceId);

            var command = new CommandDefinition(
                commandText: "usp_Project_RestoreDeleted",
                parameters: parameters,
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct
            );

            var result = await connection.QuerySingleOrDefaultAsync<ProjectDetailsDTO>(command);
            return result ?? throw new InvalidOperationException("Failed to restore deleted project");
        }

        public async Task<ProjectMemberResponseDTO> AddOrAssignProjectMemberAsync(
            int projectId,
            int currentUserId,
            int targetUserId,
            int projectRoleId,
            int? workspaceId,
            CancellationToken ct)
        {
            using var connection = CreateConnection();

            var parameters = new DynamicParameters();
            parameters.Add("@ProjectId", projectId);
            parameters.Add("@CurrentUserId", currentUserId);
            parameters.Add("@TargetUserId", targetUserId);
            parameters.Add("@ProjectRoleId", projectRoleId);
            parameters.Add("@WorkspaceId", workspaceId);

            var command = new CommandDefinition(
                commandText: "usp_ProjectMember_AddOrAssign",
                parameters: parameters,
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct
            );

            var result = await connection.QuerySingleOrDefaultAsync<ProjectMemberResponseDTO>(command);
            return result ?? throw new InvalidOperationException("Failed to add or assign project member");
        }

        public async Task<CursorPagedResult<ProjectMemberResponseDTO>> GetProjectMembersCursorPagedAsync(
            int projectId,
            int currentUserId,
            int? workspaceId,
            CursorPaginationFilterDTO filter,
            CancellationToken ct)
        {
            var cursorPayload = CursorHelper.Decode<ProjectMemberKeysetCursor>(filter.Cursor);

            using var connection = CreateConnection();

            var parameters = new DynamicParameters();
            parameters.Add("@ProjectId", projectId);
            parameters.Add("@CurrentUserId", currentUserId);
            parameters.Add("@WorkspaceId", workspaceId);
            parameters.Add("@PageSize", filter.PageSize);
            parameters.Add("@CursorUserId", cursorPayload?.UserId);
            parameters.Add("@SearchTerm", filter.SearchTerm);

            var command = new CommandDefinition(
                commandText: "usp_ProjectMember_List",
                parameters: parameters,
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct
            );

            var rawRows = (await connection.QueryAsync<ProjectMemberResponseDTO>(command)).ToList();

            return CursorPagedResult<ProjectMemberResponseDTO>.Create(
                rawItems: rawRows,
                requestedPageSize: filter.PageSize,
                cursorSelector: item => CursorHelper.Encode(new ProjectMemberKeysetCursor(item.UserId))
            );
        }

        public async Task<bool> RemoveProjectMemberAsync(
            int projectId,
            int currentUserId,
            int targetUserId,
            int? workspaceId,
            CancellationToken ct)
        {
            using var connection = CreateConnection();

            var parameters = new DynamicParameters();
            parameters.Add("@ProjectId", projectId);
            parameters.Add("@CurrentUserId", currentUserId);
            parameters.Add("@TargetUserId", targetUserId);
            parameters.Add("@WorkspaceId", workspaceId);

            var command = new CommandDefinition(
                commandText: "usp_ProjectMember_Remove",
                parameters: parameters,
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct
            );

            var result = await connection.ExecuteScalarAsync<int>(command);
            return result == 1;
        }

        public async Task<IReadOnlyList<ProjectRoleDTO>> GetProjectRolesAsync(
            int currentUserId,
            int? organizationId,
            bool excludeOwner,
            CancellationToken ct)
        {
            using var connection = CreateConnection();

            var parameters = new DynamicParameters();
            parameters.Add("@CurrentUserId", currentUserId);
            parameters.Add("@OrganizationId", organizationId);
            parameters.Add("@ExcludeOwner", excludeOwner);

            var command = new CommandDefinition(
                commandText: "usp_ProjectRole_List",
                parameters: parameters,
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct
            );

            var result = await connection.QueryAsync<ProjectRoleDTO>(command);
            return result.ToList();
        }

        public async Task<IReadOnlyList<ProjectStatusDTO>> GetProjectStatusesAsync(
            int currentUserId,
            int? organizationId,
            string? category,
            bool includeInactive,
            CancellationToken ct)
        {
            using var connection = CreateConnection();

            var parameters = new DynamicParameters();
            parameters.Add("@CurrentUserId", currentUserId);
            parameters.Add("@OrganizationId", organizationId);
            parameters.Add("@Category", category);
            parameters.Add("@IncludeInactive", includeInactive);

            var command = new CommandDefinition(
                commandText: "usp_ProjectStatus_List",
                parameters: parameters,
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct
            );

            var result = await connection.QueryAsync<ProjectStatusDTO>(command);
            return result.ToList();
        }
    }
}
