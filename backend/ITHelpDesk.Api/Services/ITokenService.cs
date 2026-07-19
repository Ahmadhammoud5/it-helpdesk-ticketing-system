using ITHelpDesk.Api.Entities;

namespace ITHelpDesk.Api.Services;

public interface ITokenService
{
    AccessTokenResult CreateAccessToken(
        ApplicationUser user,
        IReadOnlyCollection<string> roles);
}