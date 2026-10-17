using System.Security.Claims;

namespace server.Extensions
{
    public static class ClaimsPrincipalExtensions
    {
        public static int? GetUserId(this ClaimsPrincipal principal)
        {
            var claimValue = principal.FindFirstValue(ClaimTypes.NameIdentifier);
            if (int.TryParse(claimValue, out int userId))
            {
                return userId;
            }
            return null;
        }

        public static int GetRequiredUserId(this ClaimsPrincipal principal)
        {
            return principal.GetUserId() 
                ?? throw new UnauthorizedAccessException("User is not authenticated or user ID claim is invalid.");
        }

        public static string? GetUserEmail(this ClaimsPrincipal principal)
        {
            return principal.FindFirstValue(ClaimTypes.Email);
        }

        public static string? GetUserName(this ClaimsPrincipal principal)
        {
            return principal.FindFirstValue(ClaimTypes.Name);
        }
    }
}
