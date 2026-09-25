using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace server.DTOs.Organization
{
    public class CreateOrganizationRequestDTO
    {
        [Required(ErrorMessage = "Organization name is required")]
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public IFormFile? LogoFile { get; set; }
    }
}
