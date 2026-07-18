using System.Net;
using ITHelpDesk.Api.Options;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;

namespace ITHelpDesk.Api.Services;

public sealed class SmtpEmailService : IEmailService
{
    private readonly EmailOptions _options;

    public SmtpEmailService(IOptions<EmailOptions> options)
    {
        _options = options.Value;
    }

    public async Task SendPasswordResetCodeAsync(
        string recipientEmail,
        string recipientName,
        string code,
        int expirationMinutes,
        CancellationToken cancellationToken = default)
    {
        var safeRecipientName = WebUtility.HtmlEncode(recipientName);
        var safeCode = WebUtility.HtmlEncode(code);

        var message = new MimeMessage();

        message.From.Add(
            new MailboxAddress(
                _options.FromName,
                _options.FromEmail));

        message.To.Add(
            new MailboxAddress(
                recipientName,
                recipientEmail));

        message.Subject = "IT Help Desk password reset code";

        var bodyBuilder = new BodyBuilder
        {
            TextBody =
                $"Hello {recipientName},\n\n" +
                $"Your password reset code is: {code}\n\n" +
                $"This code expires in {expirationMinutes} minutes.\n" +
                "Do not share this code with anyone.\n\n" +
                "If you did not request a password reset, ignore this email.",

            HtmlBody =
                $"""
                <h2>IT Help Desk</h2>

                <p>Hello {safeRecipientName},</p>

                <p>Your password reset code is:</p>

                <h1 style="letter-spacing: 6px;">
                    {safeCode}
                </h1>

                <p>
                    This code expires in
                    <strong>{expirationMinutes} minutes</strong>.
                </p>

                <p>Do not share this code with anyone.</p>

                <p>
                    If you did not request a password reset,
                    ignore this email.
                </p>
                """
        };

        message.Body = bodyBuilder.ToMessageBody();

        using var smtpClient = new SmtpClient();

        var socketOptions = _options.UseSsl
            ? SecureSocketOptions.SslOnConnect
            : SecureSocketOptions.StartTls;

        await smtpClient.ConnectAsync(
            _options.SmtpHost,
            _options.SmtpPort,
            socketOptions,
            cancellationToken);

        await smtpClient.AuthenticateAsync(
            _options.Username,
            _options.Password,
            cancellationToken);

        await smtpClient.SendAsync(
            message,
            cancellationToken);

        await smtpClient.DisconnectAsync(
            true,
            cancellationToken);
    }
}