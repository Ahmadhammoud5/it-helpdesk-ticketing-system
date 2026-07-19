namespace ITHelpDesk.Api.Options;

public sealed class PasswordResetOptions
{
    public const string SectionName = "PasswordReset";

    public int ExpirationMinutes { get; set; } = 10;

    public int MaxFailedAttempts { get; set; } = 5;

    public string HashKey { get; set; } = string.Empty;
}