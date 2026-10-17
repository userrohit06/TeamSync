namespace server.DTOs.Workspace
{
    public record WorkspaceItemDTO(
        int WorkspaceId,
        int OrganizationId,
        string Name,
        string Slug,
        string? Description,
        bool IsPrivate,
        DateTime CreatedAt,
        string CurrentUserWorkspaceRole,
        int MemberCount
    );
}
