namespace ITHelpDesk.Api.DTOs.Dashboard;

public sealed class DashboardSummaryResponse
{
    public int TotalTickets { get; set; }

    public int OpenTickets { get; set; }

    public int InProgressTickets { get; set; }

    public int PendingTickets { get; set; }

    public int ResolvedTickets { get; set; }
}
