namespace server.DTOs.Workspace
{
    public record AddWorkspaceMemberRequestDTO(
        string Email,
        int RoleId
    );
}
