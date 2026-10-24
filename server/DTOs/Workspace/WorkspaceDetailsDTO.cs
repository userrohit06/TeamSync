<<<<<<< HEAD
﻿namespace server.DTOs.Workspace
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
        string CurrentUserWorkspaceRole,
        int TotalMembers
    );
}
=======
﻿namespace server.DTOs.Workspace
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
>>>>>>> d5c8dc03456278b1abeff80d02c2a6dd60876c6e
