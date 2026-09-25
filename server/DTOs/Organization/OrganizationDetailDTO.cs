namespace server.DTOs.Organization
{
    public record OrganizationDetailDTO(
        int OrganizationId,
        string Name,
        string? Description,
        string? LogoUrl,
        DateTime CreatedAt,
        DateTime? UpdatedAt,
        string CurrentUserRole,
        string RoleDescription,
        string MembershipStatus,
        DateTime JoinedAt
    );
}
