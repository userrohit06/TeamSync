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
    );
}
