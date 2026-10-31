namespace server.DTOs.Workspace
{
    public record WorkspaceMemberResponseDTO(
        int UserId,
        string Email,
        string FullName,
        string? ProfilePhoto,
        string WorkspaceRole,
        bool IsExplicit,
        DateTime? JoinedAt,
        string OrganizationRole
    )
    {
        public WorkspaceMemberResponseDTO() : this(0, string.Empty, string.Empty, null, string.Empty, false, null, string.Empty)
        {
        }

        public WorkspaceMemberResponseDTO(
            int UserId,
            string Email,
            string FullName,
            string? ProfilePhoto,
            string WorkspaceRole,
            int IsExplicit,
            DateTime? JoinedAt,
            string OrganizationRole)
            : this(UserId, Email, FullName, ProfilePhoto, WorkspaceRole, IsExplicit != 0, JoinedAt, OrganizationRole)
        {
        }
    }
}