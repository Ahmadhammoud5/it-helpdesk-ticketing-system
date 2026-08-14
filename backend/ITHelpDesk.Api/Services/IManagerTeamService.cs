using ITHelpDesk.Api.DTOs.Manager;

namespace ITHelpDesk.Api.Services;

public interface IManagerTeamService
{
    Task<ManagerTeamResponse> GetTeamAsync(
        CancellationToken cancellationToken = default);
}
