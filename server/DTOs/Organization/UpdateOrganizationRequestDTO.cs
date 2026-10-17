using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace server.DTOs.Organization
{
    public class UpdateOrganizationRequestDTO
    {
        [Required(ErrorMessage = "Organization name is required")]
        [MaxLength(150, ErrorMessage = "Organization name cannot exceed 150 characters")]
        public string Name { get; set; } = string.Empty;

        [MaxLength(500, ErrorMessage = "Description cannot exceed 500 characters")]
        public string? Description { get; set; }

        public IFormFile? LogoFile { get; set; }

        public bool RemoveExistingLogo { get; set; } = false;
    }

    /// <summary>
    /// Backward-compatibility alias for previous typo in class name
    /// </summary>
    public class UpdateOrganizationReqeustDTO : UpdateOrganizationRequestDTO
    {
    }
}
