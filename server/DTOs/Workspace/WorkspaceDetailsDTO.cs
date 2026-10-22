namespace server.DTOs.Workspace
{
    public record WorkspaceDetailsDTO(
        int WorkspaceId,
        int OrganizationId,
        string Name,
        string Slug,
        string? Description,
        string Visibility,
        string Status,
        DateTime CreatedAt,
        DateTime? UpdatedAt,
        int CreatedByUserId,
        string CreatedByUserName,
        int? UpdatedByUserId,
        string? UpdatedByUserName,
        string CurrrentUserWorkspaceRole,
        int TotalMembers
    );
}
