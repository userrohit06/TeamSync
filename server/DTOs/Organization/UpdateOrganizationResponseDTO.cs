namespace server.DTOs.Organization
{
    public class UpdateOrganizationResponseDTO
    {
        public int OrganizationId { get; set; }
        public string Name { get; set; }
        public string? Description { get; set; }
        public string? LogoUrl { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public string CurrentUserRole { get; set; }
    }

    public class UpdateOrganizationDbResult : UpdateOrganizationResponseDTO
    {
        public string? PreviousLogoUrl { get; set; }
    }
}
