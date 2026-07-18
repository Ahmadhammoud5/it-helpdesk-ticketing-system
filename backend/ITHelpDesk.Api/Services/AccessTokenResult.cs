namespace ITHelpDesk.Api.Services;

public sealed record AccessTokenResult(
    string AccessToken,
    DateTime ExpiresAtUtc);