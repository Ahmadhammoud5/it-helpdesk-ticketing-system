namespace ITHelpDesk.Api.DTOs.Dashboard;

public sealed class DashboardChartsResponse
{
    public IReadOnlyList<DashboardChartItemResponse> TicketsByStatus
        { get; set; } = Array.Empty<DashboardChartItemResponse>();

    public IReadOnlyList<DashboardChartItemResponse> TicketsByPriority
        { get; set; } = Array.Empty<DashboardChartItemResponse>();

    public IReadOnlyList<DashboardChartItemResponse> TicketsByCategory
        { get; set; } = Array.Empty<DashboardChartItemResponse>();
}