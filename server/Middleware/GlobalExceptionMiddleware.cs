using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using server.DTOs.Common;
using server.Helpers;

namespace server.Middleware
{
    public class GlobalExceptionMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<GlobalExceptionMiddleware> _logger;
        private readonly IHostEnvironment _env;

        public GlobalExceptionMiddleware(
            RequestDelegate next,
            ILogger<GlobalExceptionMiddleware> logger,
            IHostEnvironment env)
        {
            _next = next;
            _logger = logger;
            _env = env;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unhandled exception occurred while processing request {Path}", context.Request.Path);
                await HandleExceptionAsync(context, ex);
            }
        }

        private async Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            if (context.Response.HasStarted)
            {
                _logger.LogWarning("The response has already started, exception middleware cannot write response.");
                return;
            }

            int statusCode;
            ApiResponse response;

            switch (exception)
            {
                case SqlException sqlEx when sqlEx.Number >= 50000 && sqlEx.Number <= 59999:
                    (statusCode, response) = SqlExceptionHelper.MapToApiResponse(sqlEx);
                    break;

                case BadHttpRequestException or ArgumentException:
                    statusCode = StatusCodes.Status400BadRequest;
                    response = ApiResponse.Error(exception.Message, statusCode);
                    break;

                case UnauthorizedAccessException:
                    statusCode = StatusCodes.Status401Unauthorized;
                    response = ApiResponse.Error(exception.Message, statusCode);
                    break;

                case KeyNotFoundException or FileNotFoundException:
                    statusCode = StatusCodes.Status404NotFound;
                    response = ApiResponse.Error(exception.Message, statusCode);
                    break;

                default:
                    statusCode = StatusCodes.Status500InternalServerError;
                    string message = _env.IsDevelopment()
                        ? exception.Message
                        : "An unexpected error occurred. Please try again later.";
                    response = ApiResponse.Error(message, statusCode);
                    break;
            }

            context.Response.ContentType = "application/json";
            context.Response.StatusCode = statusCode;

            var options = new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            };

            await context.Response.WriteAsync(JsonSerializer.Serialize(response, options));
        }
    }
}
