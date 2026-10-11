using server.DTOs.Workspace;

namespace server.Repositories.Interfaces
{
    public interface IWorkspaceRepository
    {
        Task<WorkspaceResponseDTO> CreateWorkspaceAsync(
            int organizationId,
            int createdByUserId,
            string name,
            string? description,
            bool isPrivate,
            string baseSlug,
            CancellationToken ct
        );
    }
}
