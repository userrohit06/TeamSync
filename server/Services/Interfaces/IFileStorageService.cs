namespace server.Services.Interfaces
{
    public interface IFileStorageService
    {
        Task<string?> SaveProfilePhotoAsync(IFormFile? file, string email);
    }
}
