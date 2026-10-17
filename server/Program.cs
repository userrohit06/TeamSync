using Microsoft.EntityFrameworkCore;
using server.Extensions;
using server.Middleware;
using server.Models;

var builder = WebApplication.CreateBuilder(args);

// 1. Controllers & API Behavior (Standardized ApiResponse on model validation)
builder.Services.AddControllers();
builder.Services.ConfigureApiBehavior();

// 2. Swagger / OpenAPI Documentation
builder.Services.AddSwaggerDocumentation();

// 3. Authentication & Authorization (Standardized ApiResponse on 401 & 403)
builder.Services.AddJwtAuthentication(builder.Configuration);
builder.Services.AddAuthorization();

// 4. CORS Policy
builder.Services.AddCorsPolicy(builder.Configuration);

// 5. HttpContext & Dependency Injection Layers
builder.Services.AddHttpContextAccessor();
builder.Services.AddRepositories();
builder.Services.AddApplicationServices(builder.Configuration);

// 6. Database Context
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<TeamSyncContext>(options =>
    options.UseSqlServer(connectionString)
);

var app = builder.Build();

// 7. HTTP Request Pipeline

// Global Exception Handling (ensures ApiResponse format on any unhandled error)
app.UseMiddleware<GlobalExceptionMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseStaticFiles();
app.UseHttpsRedirection();
app.UseCors("FrontendPolicy");

// Ensure Authentication executes before Authorization
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
