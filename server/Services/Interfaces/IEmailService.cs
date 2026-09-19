namespace server.Services.Interfaces
{
    public interface IEmailService
    {
        Task SendForgotPasswordEmailAsync(string toEmail, string userName, string resetLink);
    }
}
