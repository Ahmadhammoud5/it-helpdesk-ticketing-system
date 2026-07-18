namespace ITHelpDesk.Api.DTOs.Auth;

public sealed class LoginResponse
{
    public string AccessToken { get; set; } = string.Empty;

    public DateTime ExpiresAtUtc { get; set; }

    public int UserId { get; set; }

    public string FullName { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public IReadOnlyCollection<string> Roles { get; set; }
        = Array.Empty<string>();
}