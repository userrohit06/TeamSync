namespace server.DTOs.Organization
{
    public record UpdatedMemberRoleResponseDTO(
        int OrganizationMemberId,
        int OrganizationId,
        int UserId,
        string Email,
        string FullName,
        string? ProfilePhoto,
        int RoleId,
        int RoleName,
        string RoleDescription,
        string MembershipStatus,
        DateTime JoinedAt,
        DateTime? UpdatedAt
    );
}
