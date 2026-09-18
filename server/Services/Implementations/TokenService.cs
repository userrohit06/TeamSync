using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;
using server.Services.Interfaces;
//using System.IdentityModel.Tokens.Jwt;
using System.Text;

namespace server.Services.Implementations
{
    public class TokenService : ITokenService
    {
        private readonly IConfiguration _config;

        public TokenService(IConfiguration config)
        {
            this._config = config;
        }

        public string GenerateJWTToken(int userId, string email, string fullName)
        {
            var secretKey = this._config["JwtSettings:SecretKey"] ?? throw new InvalidOperationException("Jwt Secret Key is missing.");
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var issuer = this._config["JwtSettings:Issuer"];
            var audience = this._config["JwtSettings:Audience"];
            var durationInMinutes = this._config["JwtSettings:DurationInMinutes"];

            var claims = new Dictionary<string, object>
            {
                [JwtRegisteredClaimNames.Sub] = userId.ToString(),
                [JwtRegisteredClaimNames.Name] = fullName,
                [JwtRegisteredClaimNames.Email] = email
            };

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Claims = claims,
                Expires = DateTime.UtcNow.AddMinutes(Convert.ToDouble(durationInMinutes)),
                SigningCredentials = creds,
                Issuer = issuer,
                Audience = audience
            };

            var handler = new JsonWebTokenHandler();
            return handler.CreateToken(tokenDescriptor);
        }
    }
}
