using System.ComponentModel.DataAnnotations;

namespace server.DTOs.Project
{
    public class ChangeProjectVisibilityRequestDTO
    {
        [Required(ErrorMessage = "Visibility is required.")]
        [RegularExpression("^(Workspace|Restricted)$", ErrorMessage = "Visibility must be either 'Workspace' or 'Restricted'.")]
        public string Visibility { get; set; } = string.Empty;

        public List<int>? InitialMemberIds { get; set; }
    }
}
