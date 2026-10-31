namespace server.DTOs.Project
{
    public record ProjectRoleDTO(
        int ProjectRoleId,
        string RoleName,
        string? Description
    );
}
