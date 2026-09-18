namespace server.Services.Interfaces
{
    public interface ITokenService
    {
        string GenerateJWTToken(int userId, string email, string fullName);
    }
}
