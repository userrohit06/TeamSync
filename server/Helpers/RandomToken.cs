using System.Security.Cryptography;
using System.Text;

namespace server.Helpers
{
    public class RandomToken
    {
        /// <summary>
        /// Generates 32 cryptographically secure random bytes and converts it to a clean URL-friendly hex string.
        /// </summary>
        public static string GenerateSecureToken()
        {
            byte[] randomNumber = new byte[32];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(randomNumber);
            return Convert.ToHexString(randomNumber).ToLowerInvariant();
        }

        /// <summary>
        /// Computes standard SHA-256 one-way cryptographic hash of incoming data.
        /// </summary>
        public static string ComputeHash(string rawData)
        {
            if (string.IsNullOrEmpty(rawData)) return string.Empty;
            using var sha256 = SHA256.Create();
            byte[] bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(rawData));
            return Convert.ToHexString(bytes).ToLowerInvariant();
        }

        // Instance methods kept for backwards compatibility
        public string GenerateSecureRandomToken() => GenerateSecureToken();
        public string ComputeSha256Hash(string rawData) => ComputeHash(rawData);
    }
}
