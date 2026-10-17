using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace server.DTOs.Auth
{
    public class ForgotPasswordRequestDTO
    {
        [Required(ErrorMessage = "Email is required")]
        [EmailAddress(ErrorMessage = "Enter valid email")]
        [JsonPropertyName("email")]
        public string Email { get; set; } = string.Empty;

        // Backward compatibility
        [JsonIgnore]
        public string email
        {
            get => Email;
            set => Email = value;
        }
    }
}
