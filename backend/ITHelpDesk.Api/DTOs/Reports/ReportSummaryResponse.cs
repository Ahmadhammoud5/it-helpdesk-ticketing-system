namespace ITHelpDesk.Api.DTOs.Reports;

public sealed class ReportSummaryResponse
{
    public DateOnly From { get; set; }

    public DateOnly To { get; set; }

    public int TotalTickets { get; set; }

    public int OpenTickets { get; set; }

    public int InProgressTickets { get; set; }

    public int PendingTickets { get; set; }

    public int ResolvedTickets { get; set; }

    public int ClosedTickets { get; set; }

    public int CancelledTickets { get; set; }

    public double? AverageResolutionMinutes { get; set; }

    public IReadOnlyList<ReportChartItemResponse> TicketsByStatus
        { get; set; } = Array.Empty<ReportChartItemResponse>();

    public IReadOnlyList<ReportChartItemResponse> TicketsByPriority
        { get; set; } = Array.Empty<ReportChartItemResponse>();

    public IReadOnlyList<ReportChartItemResponse> TicketsByCategory
        { get; set; } = Array.Empty<ReportChartItemResponse>();

    public IReadOnlyList<ReportVolumeItemResponse> TicketVolume
        { get; set; } = Array.Empty<ReportVolumeItemResponse>();
}
