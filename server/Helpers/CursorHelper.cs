using System.Text;
using System.Text.Json;

namespace server.Helpers
{
    public class CursorHelper
    {
        /// <summary>
        /// Endoces any serializable payload into a URL safe Base64 token
        /// </summary>
        public static string Encode<T>(T payload)
        {
            var json = JsonSerializer.Serialize(payload);
            var bytes = Encoding.UTF8.GetBytes(json);

            return Convert.ToBase64String(bytes)
                .Replace("+", "-")
                .Replace("/", "_")
                .TrimEnd('='); // URL-safe base64
        }

        /// <summary>
        /// Decodes a URL-safe Base64 token back into the types payload.
        /// </summary>
        public static T? Decode<T>(string? cursor) where T : class
        {
            if (string.IsNullOrEmpty(cursor)) return null;

            try
            {
                var incoming = cursor
                    .Replace("-", "+")
                    .Replace("_", "/");

                switch (incoming.Length % 4)
                {
                    case 2: incoming += "=="; break;
                    case 3: incoming += "="; break;
                }

                var bytes = Convert.FromBase64String(incoming);
                var json = Encoding.UTF8.GetString(bytes);

                return JsonSerializer.Deserialize<T>(json);
            }
            catch
            {
                // Malformed cursors fall back gracefully to the first page
                return null;
            }
        }

    }
}
