using System.ComponentModel.DataAnnotations;

namespace server.DTOs.Auth
{
    public class ForgotPasswordRequestDTO
    {
        [Required(ErrorMessage = "Email is required")]
        [EmailAddress(ErrorMessage = "Enter valid email")]
        public string email { get; set; } = string.Empty;
    }
}
