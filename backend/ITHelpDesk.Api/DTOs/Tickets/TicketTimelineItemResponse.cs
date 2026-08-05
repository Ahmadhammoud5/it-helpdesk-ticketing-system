namespace ITHelpDesk.Api.DTOs.Tickets;

public sealed class TicketTimelineItemResponse
{
    public long Id { get; set; }

    public string EventType { get; set; } = string.Empty;

    public string FieldName { get; set; } = string.Empty;

    public string? OldValue { get; set; }

    public string? NewValue { get; set; }

    public int ChangedByUserId { get; set; }

    public string ChangedByName { get; set; } = string.Empty;

    public DateTime ChangedAtUtc { get; set; }
}
