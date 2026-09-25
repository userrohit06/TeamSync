using server.Services.Interfaces;
using Microsoft.AspNetCore.Http;

namespace server.Services.Implementations
{
    public class FileStorageService : IFileStorageService
    {
        private readonly IWebHostEnvironment _env;
        private readonly long _maxFileSize;
        private readonly string[] _allowedExtensions = { ".jpg", ".jpeg", ".png", ".webp" };
        private readonly IHttpContextAccessor _httpContextAccessor;

        public FileStorageService(IWebHostEnvironment env, IConfiguration config, IHttpContextAccessor httpContextAccessor)
        {
            this._env = env;
            this._maxFileSize = config.GetValue<long>("FileSettings:MaxProfilePhotoSizeInBytes", 5242880);
            this._httpContextAccessor = httpContextAccessor;
        }

        public Task DeleteOrganizationLogoAsync(string? fileUrl)
        {
            if (string.IsNullOrEmpty(fileUrl)) return Task.CompletedTask;

            try
            {
                var uri = new Uri(fileUrl);
                var relativePath = uri.AbsolutePath.TrimStart('/');
                var fullPath = Path.Combine(this._env.WebRootPath ?? Directory.GetCurrentDirectory(), relativePath);

                if (File.Exists(fullPath))
                {
                    File.Delete(fullPath);
                }
            }
            catch
            {
                // Logging can be done here
            }

            return Task.CompletedTask;
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

        public async Task<string?> UploadOrganizationLogoAsync(IFormFile? file, string folderName)
        {
            if(file is null || file.Length == 0)
            {
                return null;
            }

            if(file.Length > this._maxFileSize)
            {
                throw new ArgumentException($"File size exceeds the maximum allowed limit of {this._maxFileSize / 1024 / 1024}MB.");
            }

            var extension = Path.GetExtension(file.FileName).ToLower();
            if (!this._allowedExtensions.Contains(extension))
            {
                throw new BadHttpRequestException($"Invalid extension. Allowed extensions are: {string.Join(", ", this._allowedExtensions)}.");
            }

            // Target: wwwroot/uploads/{folderName}
            var uploadsFolder = Path.Combine(this._env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), "uploads", folderName);
            if (!Directory.Exists(uploadsFolder))
            {
                Directory.CreateDirectory(uploadsFolder);
            }

            var uniqueFilename = $"{Guid.NewGuid():N}{extension}";
            var filePath = Path.Combine(uploadsFolder, uniqueFilename);

            await using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var request = this._httpContextAccessor.HttpContext?.Request;
            var baseUrl = $"{request?.Scheme}://{request?.Host}";
            return $"{baseUrl}/uploads/{folderName}/{uniqueFilename}";
        }
    }
}
