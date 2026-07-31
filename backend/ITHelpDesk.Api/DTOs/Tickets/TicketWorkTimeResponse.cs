namespace ITHelpDesk.Api.DTOs.Tickets;

public sealed class TicketWorkTimeResponse
{
    public int TicketId { get; set; }

    public string ReferenceNumber { get; set; } = string.Empty;

    public string StatusName { get; set; } = string.Empty;

    public bool IsCurrentlyWorking { get; set; }

    public DateTime CreatedDate { get; set; }

    public DateTime? WorkStartedAtUtc { get; set; }

    public int AccumulatedWorkMinutes { get; set; }

    public int CurrentSessionMinutes { get; set; }

    public int TotalWorkMinutes { get; set; }

    public double TotalWorkHours { get; set; }

    public int ElapsedMinutes { get; set; }

    public double ElapsedHours { get; set; }

    public DateTime? ResolvedDate { get; set; }

    public DateTime? ClosedDate { get; set; }

    public DateTime? CancelledDate { get; set; }
}
