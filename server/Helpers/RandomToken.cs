using System.Security.Cryptography;
using System.Text;

namespace server.utils
{
    public class RandomToken
    {
        public string GenerateSecureRandomToken()
        {
            // Generates 32 random bytes and converts it to a clean URL-friendly hex string
            byte[] randomNumber = new byte[32];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(randomNumber);

            return Convert.ToHexString(randomNumber).ToLower();
        }

        public string ComputeSha256Hash(string rawData)
        {
            // Standard SHA-256 one-way hashing function
            using var sha256Hash = SHA256.Create();
            byte[] bytes = sha256Hash.ComputeHash(Encoding.UTF8.GetBytes(rawData));

            return Convert.ToHexString(bytes).ToLower();
        }
    }
}
