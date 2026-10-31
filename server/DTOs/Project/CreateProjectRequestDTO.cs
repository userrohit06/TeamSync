using System.ComponentModel.DataAnnotations;

namespace server.DTOs.Project
{
    public class CreateProjectRequestDTO
    {
        [Required(ErrorMessage = "Project name is required.")]
        [MaxLength(100, ErrorMessage = "Project name cannot exceed 100 characters.")]
        public string Name { get; set; } = string.Empty;

        [MaxLength(500, ErrorMessage = "Description cannot exceed 500 characters.")]
        public string? Description { get; set; }

        public string Visibility { get; set; } = "Workspace";

        public int? ProjectStatusId { get; set; }

        public DateTime? StartDate { get; set; }

        public DateTime? DueDate { get; set; }

        public List<int>? InitialMemberIds { get; set; }
    }
}
