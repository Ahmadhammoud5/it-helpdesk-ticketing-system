namespace ITHelpDesk.Api.Services;

public interface IEmailService
{
    Task SendPasswordResetCodeAsync(
        string recipientEmail,
        string recipientName,
        string code,
        int expirationMinutes,
        CancellationToken cancellationToken = default);
}