using server.Services.Interfaces;

namespace server.Services.Implementations
{
    public class FileStorageService : IFileStorageService
    {
        private readonly IWebHostEnvironment _env;
        private readonly long _maxFileSize;
        private readonly string[] _allowedExtensions = { ".jpg", ".jpeg", ".png", ".webp" };

        public FileStorageService(IWebHostEnvironment env, IConfiguration config)
        {
            this._env = env;
            this._maxFileSize = config.GetValue<long>("FileSettings:MaxProfilePhotoSizeInBytes", 5242880);
        }

        public async Task<string?> SaveProfilePhotoAsync(IFormFile? file, string email)
        {
            if (file == null || file.Length == 0) return null;

            // 1. Validate file size
            if (file.Length > this._maxFileSize)
            {
                throw new BadHttpRequestException($"File size exceeds the maximum allowed limit of {this._maxFileSize / 1024 / 1024}MB.");
            }

            // 2. Validate file extension
            var extension = Path.GetExtension(file.FileName).ToLower();
            if (!this._allowedExtensions.Contains(extension))
            {
                throw new BadHttpRequestException($"Invalid extension. Allowed extensions are: {string.Join(", ", this._allowedExtensions)}.");
            }

            // 3. Setup target folder structure safely
            string rootPath = this._env.WebRootPath;
            if (string.IsNullOrEmpty(rootPath))
            {
                rootPath = Path.Combine(this._env.ContentRootPath, "wwwroot");
            }

            string folderPath = Path.Combine(rootPath, "userprofilephoto");
            if (!Directory.Exists(folderPath))
            {
                Directory.CreateDirectory(folderPath);
            }

            // A. Double-check that email isn't null or empty to prevent ArgumentNullExceptions
            string safeIdentifier = string.IsNullOrWhiteSpace(email) ? "user" : email;

            // B. Sanitize the email string so it only contains valid characters for a file name
            // This replaces characters like '@', '.', and spaces with underscores
            foreach (char c in Path.GetInvalidFileNameChars())
            {
                safeIdentifier = safeIdentifier.Replace(c, '_');
            }
            safeIdentifier = safeIdentifier.Replace("@", "_").Replace(".", "_");

            // 4. Generate unique filename safely
            string uniqueFileName = $"{safeIdentifier}_{Guid.NewGuid().ToString().Substring(0, 8)}{extension}";

            // Ensure both pieces are perfectly formatted paths
            string fullPath = Path.Combine(folderPath, uniqueFileName);

            // 5. Stream and save to disk
            using (var stream = new FileStream(fullPath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // 6. Return relative URL that can be requested by a browser
            return $"/userprofilephoto/{uniqueFileName}";
        }

    }
}
