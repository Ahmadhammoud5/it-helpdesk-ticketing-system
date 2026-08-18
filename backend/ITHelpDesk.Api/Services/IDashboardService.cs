using ITHelpDesk.Api.DTOs.Dashboard;

namespace ITHelpDesk.Api.Services;

public interface IDashboardService
{
    Task<DashboardSummaryResponse> GetSummaryAsync(
        int userId,
        bool isAdmin,
        bool isManager,
        bool isITSupportAgent,
        CancellationToken cancellationToken = default);

    Task<DashboardChartsResponse> GetChartsAsync(
        int userId,
        bool isAdmin,
        bool isManager,
        bool isITSupportAgent,
        CancellationToken cancellationToken = default);
}
