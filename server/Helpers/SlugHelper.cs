using System.Text.RegularExpressions;

namespace server.Helpers
{
    public static partial class SlugHelper
    {
        [GeneratedRegex(@"[^a-z0-9\s-]")]
        private static partial Regex DisallowedCharactersRegex();

        [GeneratedRegex(@"\s+")]
        private static partial Regex MultipleWhitespacesRegex();

        [GeneratedRegex(@"-+")]
        private static partial Regex MultipleHyphenRegex();

        public static string GenerateSlug(string input, int maxLength = 100)
        {
            if (string.IsNullOrWhiteSpace(input)) return "workspace";

            // convert to lowercase
            string slug = input.Trim().ToLowerInvariant();

            // strip disallowed characters (keep alphanumeric, space, hyphens)
            slug = DisallowedCharactersRegex().Replace(slug, "");

            // collapse multiple whitespace characters into single hyphen
            slug = MultipleWhitespacesRegex().Replace(slug, "-");

            // collapse multiple hyphens
            slug = MultipleHyphenRegex().Replace(slug, "-").Trim('-');

            if(slug.Length > maxLength)
            {
                slug = slug[..maxLength].TrimEnd('-');
            }

            return string.IsNullOrEmpty(slug) ? "workspace" : slug;
        }
    }
}
