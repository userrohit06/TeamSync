namespace server.DTOs.Organization
{
    public record MemberDetailDTO(
        int OrganizationMemberId,
        int OrganizationId,
        int UserId,
        string Email,
        string FullName,
        string? ProfilePhoto,
        int RoleId,
        string RoleName,
        string RoleDescription,
        string MembershipStatus,
        DateTime JoinedAt,
        int? InvitedByUserId
    );
}
