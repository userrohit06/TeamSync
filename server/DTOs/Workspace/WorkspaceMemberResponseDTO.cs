namespace server.DTOs.Workspace
{
    public record WorkspaceMemberResponseDTO(
        int userId,
        string email,
        string fullName,
        string? profilePhoto,
        string workpsaceRole,
        bool isExplicit,
        DateTime joinedAt,
        string organizationRole
    );
}
