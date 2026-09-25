namespace server.Services.Interfaces
{
    public interface IFileStorageService
    {
        Task<string?> SaveProfilePhotoAsync(IFormFile? file, string email);
        Task<string?> UploadOrganizationLogoAsync(IFormFile? file, string folderName);
        Task DeleteOrganizationLogoAsync(string? fileUrl);
    }
}
