namespace server.DTOs.Workspace
{
    public record WorkspaceResponseDTO(
        int WorkspaceId,
        int OrganizationId,
        string Name,
        string Slug,
        string? Description,
        bool IsPrivate,
        DateTime CreatedAt,
        string CurrentUserWorkspaceRole,
        int MemberCount = 1
    )
    {
        public WorkspaceResponseDTO() : this(0, 0, string.Empty, string.Empty, null, false, default, string.Empty, 1)
        {
        }

        public WorkspaceResponseDTO(
            int WorkspaceId,
            int OrganizationId,
            string Name,
            string Slug,
            string? Description,
            bool IsPrivate,
            DateTime CreatedAt,
            string CurrentUserWorkspaceRole)
            : this(WorkspaceId, OrganizationId, Name, Slug, Description, IsPrivate, CreatedAt, CurrentUserWorkspaceRole, 1)
        {
        }
    }
}
