using System.Text.RegularExpressions;

namespace server.Helpers
{
    public static class SlugHelper
    {
        private static readonly Regex DisallowedCharactersRegex = new(@"[^a-z0-9\s-]", RegexOptions.Compiled);
        private static readonly Regex MultipleWhitespacesRegex = new(@"\s+", RegexOptions.Compiled);
        private static readonly Regex MultipleHyphenRegex = new(@"-+", RegexOptions.Compiled);

        public static string GenerateSlug(string input, int maxLength = 100)
        {
            if (string.IsNullOrWhiteSpace(input)) return "workspace";

            // convert to lowercase
            string slug = input.Trim().ToLowerInvariant();

            // strip disallowed characters (keep alphanumeric, space, hyphens)
            slug = DisallowedCharactersRegex.Replace(slug, "");

            // collapse multiple whitespace characters into single hyphen
            slug = MultipleWhitespacesRegex.Replace(slug, "-");

            // collapse multiple hyphens
            slug = MultipleHyphenRegex.Replace(slug, "-").Trim('-');

            if (slug.Length > maxLength)
            {
                slug = slug[..maxLength].TrimEnd('-');
            }

            return string.IsNullOrEmpty(slug) ? "workspace" : slug;
        }
    }
}
