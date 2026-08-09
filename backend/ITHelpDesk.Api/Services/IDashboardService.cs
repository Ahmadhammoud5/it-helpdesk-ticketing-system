using ITHelpDesk.Api.DTOs.Dashboard;

namespace ITHelpDesk.Api.Services;

public interface IDashboardService
{
    Task<DashboardSummaryResponse> GetSummaryAsync(
        int userId,
        bool isAdmin,
        CancellationToken cancellationToken = default);

    Task<DashboardChartsResponse> GetChartsAsync(
        int userId,
        bool isAdmin,
        CancellationToken cancellationToken = default);
}