using server.DTOs.Auth;
using Microsoft.AspNetCore.Http;
using server.DTOs.Common;
using server.Models;
using server.Repositories.Interfaces;
using server.Services.Interfaces;
using BcryptNet = BCrypt.Net.BCrypt;
using Google.Apis.Auth;

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

        private string? ResolveProfilePhotoUrl(string? photoPath)
        {
            // 1. Guard against empty/null values
            if (string.IsNullOrWhiteSpace(photoPath))
                return null;

            // 2. Check if it is already a complete URL
            if (Uri.TryCreate(photoPath, UriKind.Absolute, out _))
                return photoPath;

            // 3. Prepend the host and scheme for relative server files
            var request = this._httpContext.HttpContext?.Request;
            if (request != null)
            {
                var baseUrl = $"{request.Scheme}://{request.Host}";
                return $"{baseUrl.TrimEnd('/')}/{photoPath.TrimStart('/')}";
            }

            return photoPath;
        }

        public async Task<ApiResponse> ForgotPassword(string email, CancellationToken ct)
        {
            var response = new ApiResponse();
            var user = await this._userRepository.GetUserByEmail(email, ct);

            // Return generic message regardless of user existence to prevent account enumeration
            if (user != null)
            {
                // TODO: Generate reset token and dispatch email via notification service
            }

            response.Status = 200;
            response.Message = "If that email exists in our system, a password reset link has been sent.";
            return response;
        }

        public async Task<ApiResponse<SigninResponseDTO>> GoogleSignin(GoogleSigninRequestDTO request, CancellationToken ct)
        {
            var response = new ApiResponse<SigninResponseDTO>();

            if (string.IsNullOrEmpty(request.IdToken))
            {
                response.Status = 400;
                response.Message = "Id Token is required";
                return response;
            }

            try
            {
                var clientId = this._config["Google:ClientId"];
                if (string.IsNullOrEmpty(clientId))
                {
                    response.Status = 500;
                    response.Message = "Google Client Id is not configured!";
                    return response;
                }

                GoogleJsonWebSignature.Payload payload;
                try
                {
                    payload = await GoogleJsonWebSignature.ValidateAsync(request.IdToken, new GoogleJsonWebSignature.ValidationSettings
                    {
                        Audience = new[] { clientId }
                    });
                }
                catch
                {
                    response.Status = 400;
                    response.Message = "Invalid Google Id token";
                    return response;
                }

                if (!payload.EmailVerified)
                {
                    response.Status = 400;
                    response.Message = "Google email is not verified";
                    return response;
                }

                var googleId = payload.Subject;
                var email = payload.Email;

                var user = await this._userRepository.GetUserByGoogleId(googleId, ct);

                if (user == null)
                {
                    user = await this._userRepository.GetUserByEmail(email, ct);

                    if (user != null)
                    {
                        user.GoogleId = googleId;
                        user.UpdatedAt = DateTime.UtcNow;
                        user.LastLoginAt = DateTime.UtcNow;

                        // Only assign Google photo if user does not already have one
                        if (string.IsNullOrEmpty(user.ProfilePhoto))
                        {
                            user.ProfilePhoto = payload.Picture;
                        }
                    }
                    else
                    {
                        user = new User
                        {
                            FullName = payload.Name ?? email,
                            Email = email,
                            PasswordHash = null,
                            GoogleId = googleId,
                            ProfilePhoto = payload.Picture,
                            CreatedAt = DateTime.UtcNow,
                            LastLoginAt = DateTime.UtcNow,
                            IsActive = true,
                            IsDeleted = false
                        };

                        await this._userRepository.AddUser(user, ct);
                    }
                }
                else
                {
                    user.LastLoginAt = DateTime.UtcNow;
                    user.UpdatedAt = DateTime.UtcNow;

                    if (string.IsNullOrEmpty(user.ProfilePhoto) && !string.IsNullOrWhiteSpace(payload.Picture))
                    {
                        user.ProfilePhoto = payload.Picture;
                    }
                }

                await this._userRepository.Save();

                var token = this._tokenService.GenerateJWTToken(user.UserId, user.Email, user.FullName);

                response.Status = 200;
                response.Message = "User login successful";
                response.Data = new SigninResponseDTO
                {
                    UserId = user.UserId,
                    FullName = user.FullName,
                    Email = user.Email,
                    ProfilePhotoUrl = ResolveProfilePhotoUrl(user.ProfilePhoto),
                    token = token
                };

                return response;
            }
            catch (Exception ex)
            {
                response.Status = 500;
                response.Message = ex.Message;
                return response;
            }
        }

        public async Task<ApiResponse<SigninResponseDTO>> Signin(string email, string password, CancellationToken ct)
        {
            var response = new ApiResponse<SigninResponseDTO>();

            try
            {
                var user = await this._userRepository.GetUserByEmail(email, ct);

                if (user == null)
                {
                    response.Status = 401;
                    response.Message = "Invalid email or password";
                    return response;
                }

                if (string.IsNullOrEmpty(user.PasswordHash))
                {
                    response.Status = 400;
                    response.Message = "This account was registered via Google. Please sign in with Google.";
                    return response;
                }

                bool isPasswordCorrect = BcryptNet.Verify(password, user.PasswordHash);

                if (!isPasswordCorrect)
                {
                    response.Status = 401;
                    response.Message = "Invalid email or password";
                    return response;
                }

                string token = this._tokenService.GenerateJWTToken(user.UserId, user.Email, user.FullName);

                await this._userRepository.UpdateLastLoginAt(email, ct);

                response.Status = 200;
                response.Message = "User signin successful";
                response.Data = new SigninResponseDTO
                {
                    UserId = user.UserId,
                    FullName = user.FullName,
                    Email = user.Email,
                    ProfilePhotoUrl = ResolveProfilePhotoUrl(user.ProfilePhoto),
                    token = token
                };
                return response;
            }
            catch (Exception ex)
            {
                response.Status = 500;
                response.Message = ex.Message;
                return response;
            }
        }

        public async Task<ApiResponse> Signup(string fullName, string email, string password, IFormFile? photo, CancellationToken ct)
        {
            var response = new ApiResponse();

            try
            {
                var user = await this._userRepository.GetUserByEmail(email, ct);

                if (user != null)
                {
                    response.Status = 409;
                    response.Message = "User already exists";
                    return response;
                }

                string? photoUrl = null;
                if (photo != null)
                {
                    photoUrl = await this._fileStorageService.SaveProfilePhotoAsync(photo, email);
                }

                string hashedPassword = BcryptNet.HashPassword(password);

                var newUser = new User
                {
                    FullName = fullName,
                    Email = email,
                    PasswordHash = hashedPassword,
                    ProfilePhoto = photoUrl,
                    CreatedAt = DateTime.UtcNow,
                    IsActive = true,
                    IsDeleted = false
                };

                await this._userRepository.AddUser(newUser, ct);
                await this._userRepository.Save();

                response.Status = 201;
                response.Message = "User signup successful";
                return response;
            }
            catch (BadHttpRequestException ex)
            {
                response.Status = 400;
                response.Message = ex.Message;
                return response;
            }
            catch (Exception ex)
            {
                response.Status = 500;
                response.Message = ex.Message;
                return response;
            }
        }
    }
}