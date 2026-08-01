namespace ITHelpDesk.Api.DTOs.Tickets;

public sealed class TicketStatusUpdateResponse
{
    public int TicketId { get; set; }

    public string ReferenceNumber { get; set; } = string.Empty;

    public int PreviousStatusId { get; set; }

    public string PreviousStatusName { get; set; } = string.Empty;

    public int CurrentStatusId { get; set; }

    public string CurrentStatusName { get; set; } = string.Empty;

    public int ChangedByUserId { get; set; }

    public DateTime ChangedAtUtc { get; set; }

    public DateTime? WorkStartedAtUtc { get; set; }

    public int WorkMinutesAdded { get; set; }

    public int TotalWorkMinutes { get; set; }

    public double TotalWorkHours { get; set; }

    public DateTime? ResolvedDate { get; set; }

    public DateTime? ClosedDate { get; set; }

    public DateTime? CancelledDate { get; set; }
}
