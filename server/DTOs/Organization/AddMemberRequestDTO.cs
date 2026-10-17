using System.ComponentModel.DataAnnotations;

namespace server.DTOs.Organization
{
    public class AddMemberRequestDTO
    {
        [Required(ErrorMessage = "Email is required of the user you want to invite")]
        [EmailAddress(ErrorMessage = "Enter valid email")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Provide a valid role")]
        [Range(1, int.MaxValue, ErrorMessage = "RoleId must be a positive integer")]
        public int RoleId { get; set; }
    }
}
