using server.DTOs.Auth;
using Microsoft.AspNetCore.Http;
using server.DTOs.Common;
using server.Helpers;
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
        private readonly IEmailService _emailService;

        public AuthService(
            IUserRepository userRepository,
            IFileStorageService fileStorageService,
            ITokenService tokenService,
            IConfiguration config,
            IHttpContextAccessor httpContextAccessor,
            IEmailService emailService)
        {
            _userRepository = userRepository;
            _fileStorageService = fileStorageService;
            _tokenService = tokenService;
            _config = config;
            _httpContext = httpContextAccessor;
            _emailService = emailService;
        }

        private string? ResolveProfilePhotoUrl(string? photoPath)
        {
            if (string.IsNullOrWhiteSpace(photoPath))
                return null;

            if (Uri.TryCreate(photoPath, UriKind.Absolute, out _))
                return photoPath;

            var request = _httpContext.HttpContext?.Request;
            if (request != null)
            {
                var baseUrl = $"{request.Scheme}://{request.Host}";
                return $"{baseUrl.TrimEnd('/')}/{photoPath.TrimStart('/')}";
            }

            return photoPath;
        }

        public async Task<ApiResponse> ForgotPassword(string email, CancellationToken ct)
        {
            var clientUrl = _config["ClientSettings:BaseUrl"] ?? "http://localhost:3000";
            return await ForgotPassword(email, clientUrl, ct);
        }

        public async Task<ApiResponse> ForgotPassword(string email, string clientUrl, CancellationToken ct)
        {
            var user = await _userRepository.GetUserByEmail(email, ct);

            // Return generic message regardless of user existence to prevent account enumeration
            if (user == null)
            {
                return ApiResponse.Success("If that email exists in our system, a password reset link has been sent.", 200);
            }

            // Generate cryptographically secure token & compute SHA-256 hash
            string rawToken = RandomToken.GenerateSecureToken();
            string hashedToken = RandomToken.ComputeHash(rawToken);

            user.PasswordResetToken = hashedToken;
            user.PasswordResetExpiry = DateTime.UtcNow.AddMinutes(15);
            await _userRepository.UpdateAsync(user, ct);

            var resetLink = $"{clientUrl.TrimEnd('/')}/auth/reset-password?token={rawToken}";

            try
            {
                await _emailService.SendForgotPasswordEmailAsync(user.Email, user.FullName, resetLink);
            }
            catch
            {
                // In production, log email sending error but keep generic message so we don't leak failures
            }

            return ApiResponse.Success("If that email exists in our system, a password reset link has been sent.", 200);
        }

        public async Task<ApiResponse<SigninResponseDTO>> GoogleSignin(GoogleSigninRequestDTO request, CancellationToken ct)
        {
            if (string.IsNullOrEmpty(request.IdToken))
            {
                return ApiResponse<SigninResponseDTO>.Error("Id Token is required", 400);
            }

            var clientId = _config["Google:ClientId"];
            if (string.IsNullOrEmpty(clientId))
            {
                return ApiResponse<SigninResponseDTO>.Error("Google Client Id is not configured!", 500);
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
                return ApiResponse<SigninResponseDTO>.Error("Invalid Google Id token", 400);
            }

            if (!payload.EmailVerified)
            {
                return ApiResponse<SigninResponseDTO>.Error("Google email is not verified", 400);
            }

            var googleId = payload.Subject;
            var email = payload.Email;

            var user = await _userRepository.GetUserByGoogleId(googleId, ct);

            if (user == null)
            {
                user = await _userRepository.GetUserByEmail(email, ct);

                if (user != null)
                {
                    user.GoogleId = googleId;
                    user.UpdatedAt = DateTime.UtcNow;
                    user.LastLoginAt = DateTime.UtcNow;

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

                    await _userRepository.AddUser(user, ct);
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

            await _userRepository.Save();

            var token = _tokenService.GenerateJWTToken(user.UserId, user.Email, user.FullName);

            var data = new SigninResponseDTO
            {
                UserId = user.UserId,
                FullName = user.FullName,
                Email = user.Email,
                ProfilePhotoUrl = ResolveProfilePhotoUrl(user.ProfilePhoto),
                Token = token
            };

            return ApiResponse<SigninResponseDTO>.Success(data, "User login successful", 200);
        }

        public async Task<ApiResponse<SigninResponseDTO>> Signin(string email, string password, CancellationToken ct)
        {
            var user = await _userRepository.GetUserByEmail(email, ct);

            if (user == null)
            {
                return ApiResponse<SigninResponseDTO>.Error("Invalid email or password", 401);
            }

            if (string.IsNullOrEmpty(user.PasswordHash))
            {
                return ApiResponse<SigninResponseDTO>.Error("This account was registered via Google. Please sign in with Google.", 400);
            }

            bool isPasswordCorrect = BcryptNet.Verify(password, user.PasswordHash);

            if (!isPasswordCorrect)
            {
                return ApiResponse<SigninResponseDTO>.Error("Invalid email or password", 401);
            }

            string token = _tokenService.GenerateJWTToken(user.UserId, user.Email, user.FullName);

            await _userRepository.UpdateLastLoginAt(email, ct);

            var data = new SigninResponseDTO
            {
                UserId = user.UserId,
                FullName = user.FullName,
                Email = user.Email,
                ProfilePhotoUrl = ResolveProfilePhotoUrl(user.ProfilePhoto),
                Token = token
            };

            return ApiResponse<SigninResponseDTO>.Success(data, "User signin successful", 200);
        }

        public async Task<ApiResponse> Signup(string fullName, string email, string password, IFormFile? photo, CancellationToken ct)
        {
            var existingUser = await _userRepository.GetUserByEmail(email, ct);

            if (existingUser != null)
            {
                return ApiResponse.Error("User already exists", 409);
            }

            string? photoUrl = null;
            if (photo != null)
            {
                photoUrl = await _fileStorageService.SaveProfilePhotoAsync(photo, email);
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

            await _userRepository.AddUser(newUser, ct);
            await _userRepository.Save();

            return ApiResponse.Success("User signup successful", 201);
        }

        public async Task<ApiResponse> ResetPassword(ResetPasswordRequestDTO request, CancellationToken ct)
        {
            string incomingHashedToken = RandomToken.ComputeHash(request.Token);

            var user = await _userRepository.GetByResetToken(incomingHashedToken);

            if (user == null)
            {
                return ApiResponse.Error("User not found", 404);
            }

            bool isPasswordResetTokenValid = !string.IsNullOrEmpty(user.PasswordResetToken) 
                && user.PasswordResetExpiry.HasValue 
                && user.PasswordResetExpiry > DateTime.UtcNow;

            if (!isPasswordResetTokenValid)
            {
                return ApiResponse.Error("Invalid or expired token", 400);
            }

            user.PasswordHash = BcryptNet.HashPassword(request.NewPassword);
            user.PasswordResetToken = null;
            user.PasswordResetExpiry = null;
            user.UpdatedAt = DateTime.UtcNow;

            await _userRepository.UpdateAsync(user, ct);

            return ApiResponse.Success("Password reset successfully", 200);
        }
    }
}