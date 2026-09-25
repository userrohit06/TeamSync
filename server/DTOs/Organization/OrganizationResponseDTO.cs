namespace server.DTOs.Organization
{
    public class OrganizationResponseDTO
    {
        public int OrganizationId { get; set; }
        public string Name { get; set; }
        public string? Description { get; set; }
        public string? LogoUrl { get; set; }
        public DateTime CreatedAt { get; set; }
        public string CurrentUserRole { get; set; }
    }
}
