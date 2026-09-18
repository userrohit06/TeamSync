using server.DTOs.Auth;
using Microsoft.AspNetCore.Http;
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
        private readonly ITokenService _tokenService;
        private readonly IConfiguration _config;
        private readonly IHttpContextAccessor _httpContext;

        public AuthService(
            IUserRepository userRepository,
            IFileStorageService fileStorageService,
            ITokenService tokenService,
            IConfiguration config,
            IHttpContextAccessor httpContextAccessor)
        {
            this._userRepository = userRepository;
            this._fileStorageService = fileStorageService;
            this._tokenService = tokenService;
            this._config = config;
            this._httpContext = httpContextAccessor;
        }

        public async Task<ApiResponse<SigninResponseDTO>> Signin(string email, string password, CancellationToken ct)
        {
            var response = new ApiResponse<SigninResponseDTO>();

            try
            {
                // 1. Fetch user by email
                var user = await this._userRepository.GetUserByEmail(email, ct);

                if(user == null)
                {
                    response.Status = 401;
                    response.Message = "Invalid email or password";
                    return response;
                }

                // 2. Validate hash match via BcryptNet
                bool isPasswordCorrect = BcryptNet.Verify(password, user.PasswordHash);

                if (!isPasswordCorrect)
                {
                    response.Status = 401;
                    response.Message = "Invalid email or password";
                    return response;
                }

                // 3. Generate token
                string token = this._tokenService.GenerateJWTToken(user.UserId, user.Email, user.FullName);

                response.Status = 200;
                response.Message = "User signin successful";
                response.Data = new SigninResponseDTO
                {
                    FullName = user.FullName,
                    Email = user.Email,
                    ProfilePhotoUrl = user.ProfilePhoto,
                    token = token
                };
                return response;
            }
            catch(Exception ex)
            {
                response.Status = 500;
                response.Message = ex.Message;
                return response;
            }
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
