using server.DTOs.Common;
using server.Models;
using server.Repositories.Interfaces;
using server.Services.Interfaces;
using BcryptNet = BCrypt.Net.BCrypt;

namespace server.Services.Implementations
{
    public class AuthService : IAuthService
    {
        private readonly IUserRepository _userRepository;
        private readonly IFileStorageService _fileStorageService;

        public AuthService(IUserRepository userRepository, IFileStorageService fileStorageService)
        {
            this._userRepository = userRepository;
            this._fileStorageService = fileStorageService;
        }

        public async Task<ApiResponse> Signup(string fullName, string email, string password, IFormFile? photo, CancellationToken ct)
        {
            ApiResponse response = new ApiResponse();

            try
            {
                var user = await this._userRepository.GetUserByEmail(email, ct);

                if(user != null)
                {
                    response.Status = 409;
                    response.Message = "User already exists";
                    return response;
                }

                // 1. Process and upload photo using utility service
                string? photoUrl = null;

                if(photo != null)
                {
                    photoUrl = await this._fileStorageService.SaveProfilePhotoAsync(photo, email);
                }

                // 2. Hash password
                string hashedPassword = BcryptNet.HashPassword(password);

                // 3. Construct and save user
                var newUser = new User
                {
                    FullName = fullName,
                    Email = email,
                    PasswordHash = hashedPassword,
                    ProfilePhoto = photoUrl,
                    IsActive = true,
                    IsDeleted = false
                };

                await this._userRepository.AddUser(newUser, ct);
                await this._userRepository.Save();

                response.Status = 201;
                response.Message = "User signup successful";
                return response;
            }
            catch (BadHttpRequestException ex) // Catch file validation errors explicitly
            {
                response.Status = 400;
                response.Message = ex.Message;
                return response;
            }
            catch(Exception ex)
            {
                response.Status = 500;
                response.Message = ex.Message;
                return response;
            }
        }
    }
}
