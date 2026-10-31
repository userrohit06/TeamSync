using System.ComponentModel.DataAnnotations;

namespace server.DTOs.Project
{
    public class AddOrAssignProjectMemberRequestDTO
    {
        [Required(ErrorMessage = "TargetUserId is required.")]
        public int TargetUserId { get; set; }

        [Required(ErrorMessage = "ProjectRoleId is required.")]
        public int ProjectRoleId { get; set; }
    }
}
