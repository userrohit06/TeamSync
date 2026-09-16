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

            // 1. validate file size
            if(file.Length > this._maxFileSize)
            {
                throw new BadHttpRequestException($"File size exceeds the maximum allowed limit of {this._maxFileSize / 1024 / 1024}MB.");
            }

            // 2. Validate file extension
            var extension = Path.GetExtension(file.FileName).ToLower();

            if (!this._allowedExtensions.Contains(extension))
            {
                throw new BadHttpRequestException($"Invalid extension. Allowed extensions are: {string.Join(", ", this._allowedExtensions)}.");
            }

            // 3. Setup target folder structure
            string folderPath = Path.Combine(this._env.WebRootPath, "userprofilephoto");

            if (!Directory.Exists(folderPath))
            {
                Directory.CreateDirectory(folderPath);
            }

            // 4. Generate unique filename
            string uniqueFileName = $"{email}_{Guid.NewGuid().ToString().Substring(0, 8)}{extension}";
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
