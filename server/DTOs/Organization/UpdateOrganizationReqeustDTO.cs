using Microsoft.AspNetCore.Http;

namespace server.DTOs.Organization
{
    public class UpdateOrganizationReqeustDTO
    {
        public string Name { get; set; }
        public string? Description { get; set; }
        public IFormFile? LogoFile { get; set; }
        public bool RemoveExistingLogo = false;
    }
}
