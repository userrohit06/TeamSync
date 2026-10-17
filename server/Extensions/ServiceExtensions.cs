using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using server.Configuration;
using server.DTOs.Common;
using server.Repositories.Implementations;
using server.Repositories.Interfaces;
using server.Services.Implementations;
using server.Services.Interfaces;

namespace server.Extensions
{
    public static class ServiceExtensions
    {
        public static IServiceCollection AddSwaggerDocumentation(this IServiceCollection services)
        {
            services.AddEndpointsApiExplorer();
            services.AddSwaggerGen(options =>
            {
                options.SwaggerDoc("v1", new OpenApiInfo { Title = "TeamSync API", Version = "v1" });

                options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
                {
                    Name = "Authorization",
                    In = ParameterLocation.Header,
                    Type = SecuritySchemeType.Http,
                    Scheme = "Bearer",
                    BearerFormat = "JWT",
                    Description = "Input your raw token. Swagger will append 'Bearer ' prefix automatically."
                });

                options.AddSecurityRequirement(new OpenApiSecurityRequirement
                {
                    {
                        new OpenApiSecurityScheme
                        {
                            Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
                        },
                        Array.Empty<string>()
                    }
                });
            });

            return services;
        }

        public static IServiceCollection AddJwtAuthentication(this IServiceCollection services, IConfiguration configuration)
        {
            var secretKey = configuration["JwtSettings:SecretKey"] 
                ?? throw new InvalidOperationException("JWT Secret missing.");

            services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidIssuer = configuration["JwtSettings:Issuer"],
                    ValidateAudience = true,
                    ValidAudience = configuration["JwtSettings:Audience"],
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.Zero
                };

                // Ensure 401 Unauthorized and 403 Forbidden always return in ApiResponse format
                options.Events = new JwtBearerEvents
                {
                    OnChallenge = async context =>
                    {
                        context.HandleResponse();
                        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                        context.Response.ContentType = "application/json";

                        var response = ApiResponse.Error("Unauthorized: Token is missing, invalid, or expired.", StatusCodes.Status401Unauthorized);
                        var json = JsonSerializer.Serialize(response, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });
                        await context.Response.WriteAsync(json);
                    },
                    OnForbidden = async context =>
                    {
                        context.Response.StatusCode = StatusCodes.Status403Forbidden;
                        context.Response.ContentType = "application/json";

                        var response = ApiResponse.Error("Forbidden: You do not have permission to access this resource.", StatusCodes.Status403Forbidden);
                        var json = JsonSerializer.Serialize(response, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });
                        await context.Response.WriteAsync(json);
                    }
                };
            });

            return services;
        }

        public static IServiceCollection AddCorsPolicy(this IServiceCollection services, IConfiguration configuration)
        {
            var allowedOrigins = configuration
                .GetSection("AllowedOrigins")
                .Get<string[]>() ?? Array.Empty<string>();

            services.AddCors(options =>
            {
                options.AddPolicy("FrontendPolicy", policy =>
                {
                    policy
                        .WithOrigins(allowedOrigins)
                        .AllowAnyHeader()
                        .AllowAnyMethod()
                        .AllowCredentials();
                });
            });

            return services;
        }

        public static IServiceCollection ConfigureApiBehavior(this IServiceCollection services)
        {
            services.Configure<ApiBehaviorOptions>(options =>
            {
                // Ensure model validation errors return in ApiResponse format
                options.InvalidModelStateResponseFactory = context =>
                {
                    var errors = context.ModelState
                        .Where(e => e.Value?.Errors.Count > 0)
                        .SelectMany(e => e.Value!.Errors.Select(x => !string.IsNullOrEmpty(x.ErrorMessage) ? x.ErrorMessage : "Invalid field value"))
                        .ToList();

                    var errorMessage = errors.Count > 0 
                        ? string.Join("; ", errors) 
                        : "One or more validation errors occurred.";

                    var response = ApiResponse.Error(errorMessage, StatusCodes.Status400BadRequest);
                    return new BadRequestObjectResult(response);
                };
            });

            return services;
        }

        public static IServiceCollection AddRepositories(this IServiceCollection services)
        {
            services.AddScoped<IUserRepository, UserRepository>();
            services.AddScoped<IOrganizationRepository, OrganizationRepository>();
            services.AddScoped<IWorkspaceRepository, WorkspaceRepository>();

            return services;
        }

        public static IServiceCollection AddApplicationServices(this IServiceCollection services, IConfiguration configuration)
        {
            services.Configure<EmailSettings>(configuration.GetSection("EmailSettings"));

            services.AddScoped<IAuthService, AuthService>();
            services.AddScoped<IFileStorageService, FileStorageService>();
            services.AddScoped<ITokenService, TokenService>();
            services.AddScoped<IEmailService, EmailService>();
            services.AddScoped<IOrganizationService, OrganizationService>();
            services.AddScoped<IWorkspaceService, WorkspaceService>();
            services.AddScoped<IUserService, UserService>();

            return services;
        }
    }
}
