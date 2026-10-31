using System.ComponentModel.DataAnnotations;

namespace server.DTOs.Project
{
    public class ChangeProjectStatusRequestDTO
    {
        [Required(ErrorMessage = "ProjectStatusId is required.")]
        public int ProjectStatusId { get; set; }
    }
}
