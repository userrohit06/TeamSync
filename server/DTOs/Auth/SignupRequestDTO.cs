using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace server.DTOs.Auth
{
    public class SignupRequestDTO
    {
        public string FullName { get; set; } = string.Empty;

        [EmailAddress(ErrorMessage = "Enter valid email address")]
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public IFormFile? ProfilePhoto { get; set; }
    }
}
