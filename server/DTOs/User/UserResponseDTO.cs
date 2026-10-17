namespace server.DTOs.User
{
    public record UserResponseDTO(
        int UserId,
        string FullName,
        string Email,
        string ProfilePhoto,
        DateTime CreatedAt,
        DateTime? UpdatedAt,
        string Status
    );
}
