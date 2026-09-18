namespace server.DTOs.Auth
{
    public class SigninResponseDTO
    {
        public int UserId { get; set; }
        public string FullName { get; set; }
        public string Email { get; set; }
        public string? ProfilePhotoUrl { get; set; }
        public string token { get; set; }
    }
}
