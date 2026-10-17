using System.Text.Json.Serialization;

namespace server.DTOs.Auth
{
    public class SigninResponseDTO
    {
        public int UserId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? ProfilePhotoUrl { get; set; }

        [JsonPropertyName("token")]
        public string Token { get; set; } = string.Empty;

        // Backward compatibility for internal access
        [JsonIgnore]
        public string token
        {
            get => Token;
            set => Token = value;
        }
    }
}
