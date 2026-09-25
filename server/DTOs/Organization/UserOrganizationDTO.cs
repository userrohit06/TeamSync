namespace server.DTOs.Organization
{
    public class UserOrganizationDTO
    {
        public int OrganizationId { get; set; }
        public string Name { get; set; }
        public string? Description { get; set; }
        public string? LogoUrl { get; set; }
        public string? RoleName { get; set; }
        public string? RoleDescription { get; set; }
        public DateTime JoinedAt { get; set; }
    }
}
