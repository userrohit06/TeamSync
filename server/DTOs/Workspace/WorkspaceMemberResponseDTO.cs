<<<<<<< HEAD
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
=======
﻿namespace server.DTOs.Workspace
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
>>>>>>> d5c8dc03456278b1abeff80d02c2a6dd60876c6e
