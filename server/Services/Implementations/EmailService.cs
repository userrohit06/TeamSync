using Microsoft.Extensions.Options;
using server.Configuration;
using server.Services.Interfaces;

namespace server.Services.Implementations
{
    public class EmailService : IEmailService
    {
        private readonly EmailSettings _emailSettings;

        public EmailService(IOptions<EmailSettings> emailSettings)
        {
            this._emailSettings = emailSettings.Value;
        }

        public Task SendForgotPasswordEmailAsync(string toEmail, string userName, string resetLink)
        {
            // 1. Locate and read the HTML template
            var templatePath = Path.Combine(Directory.GetCurrentDirectory(), "Templates", "ForgotPasswordEmail.html");

            throw new NotImplementedException();
        }
    }
}
