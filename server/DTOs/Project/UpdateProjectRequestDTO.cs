using System.ComponentModel.DataAnnotations;

namespace server.DTOs.Project
{
    public class UpdateProjectRequestDTO
    {
        [MaxLength(100, ErrorMessage = "Project name cannot exceed 100 characters.")]
        public string? Name { get; set; }

        [MaxLength(500, ErrorMessage = "Description cannot exceed 500 characters.")]
        public string? Description { get; set; }

        public int? ProjectStatusId { get; set; }

        public DateTime? StartDate { get; set; }

        public DateTime? DueDate { get; set; }

        public bool UpdateDates { get; set; } = false;
    }
}
