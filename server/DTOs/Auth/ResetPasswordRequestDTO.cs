using System.ComponentModel.DataAnnotations;

namespace server.DTOs.Auth
{
    public class ResetPasswordRequestDTO
    {
        [Required(ErrorMessage = "Token is required")]
        public string Token { get; set; } = string.Empty;
        [Required(ErrorMessage = "Password is required")]
        [MinLength(8, ErrorMessage = "Password must be at least 8 characters long")]
        public string NewPassword { get; set; } = string.Empty;
    }
}
