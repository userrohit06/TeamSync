using Microsoft.Extensions.Options;
using MimeKit;
using server.Configuration;
using server.Services.Interfaces;
using MailKit.Net.Smtp;

namespace server.Services.Implementations
{
    public class EmailService : IEmailService
    {
        private readonly EmailSettings _emailSettings;
        private readonly IWebHostEnvironment _env;

        public EmailService(IOptions<EmailSettings> emailSettings, IWebHostEnvironment env)
        {
            this._emailSettings = emailSettings.Value;
            this._env = env;
        }

        public async Task SendForgotPasswordEmailAsync(string toEmail, string userName, string resetLink)
        {
            // 1. Locate and read the HTML template
            var templatePath = Path.Combine(this._env.ContentRootPath, "Templates", "FogotPasswordEmail.html");

            if (!File.Exists(templatePath))
            {
                throw new FileNotFoundException($"Email template file could not be found at path: {templatePath}");
            }

            string emailBody = await File.ReadAllTextAsync(templatePath);

            emailBody = emailBody
                .Replace("{Username}", userName)
                .Replace("{ResetLink}", resetLink);

            // Construct the email message using MimeKit
            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(this._emailSettings.SenderName, this._emailSettings.SenderEmail));
            message.To.Add(new MailboxAddress(userName, toEmail));
            message.Subject = "Reset Your Password";

            var bodyBuilder = new BodyBuilder { HtmlBody = emailBody };
            message.Body = bodyBuilder.ToMessageBody();

            using var client = new SmtpClient();

            try
            {
                await client.ConnectAsync(this._emailSettings.SmtpServer, this._emailSettings.Port, MailKit.Security.SecureSocketOptions.StartTls);
                await client.AuthenticateAsync(this._emailSettings.SenderEmail, this._emailSettings.AppPassword);
                await client.SendAsync(message);
            }
            finally
            {
                await client.DisconnectAsync(true);
            }
        }
    }
}
